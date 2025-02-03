import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import pool from './config/db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'


const app = express()
const port = 3000
app.use(express.json())
app.use(cors({
    origin: 'https://expensio-f0qwzt6rr-lei-pinheiros-projects.vercel.app/'
}))

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1]; // Recupera o token após 'Bearer' 

    if (!token) {
        return res.status(401).json({ message: 'Token inválido' });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        console.error('Erro ao verificar token:', error.message);
        return res.status(403).json({ message: 'Token inválido' });
    }
};


// Registro de usuários
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Verifica se todos os campos estão preenchidos
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email e senha são obrigatórios' });
        }

        // Verifica se o email já está em uso
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Email já está em uso' });
        }

        // Define o número de rounds do salt (recomendado: 10)
        const saltRounds = 10;

        // Gera o hash da senha
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insere o usuário no banco de dados
        await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
            [username, email, passwordHash]
        );

        res.status(201).json({ message: 'Usuário registrado com sucesso' });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro ao registrar usuário' });
    }
});

// Login
// Gerar token ao fazer login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    try {
        console.log('Chave secreta usada para assinar o token:', process.env.SECRET);
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        // Gerar o token com 1 dia de validade
        const token = jwt.sign({ id: user.id }, process.env.SECRET, { expiresIn: '1d' });

        console.log('Token gerado no backend:', token);  // Verificando o token gerado

        return res.json({
            token,
            username: user.username
        });
    } catch (error) {
        console.error('Erro no servidor:', error.message);
        return res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
});


// Criar despesa
// Criar despesa com autenticação
app.post('/api/expenses', authMiddleware, async (req, res) => {
    const { itemname, price, date } = req.body;

    // Verifique se os dados necessários estão presentes
    if (!itemname || !price || !date) {
        return res.status(400).json({ message: 'Nome do item, preço e data são obrigatórios' });
    }

    try {
        // Insira a despesa no banco, agora com req.userId
        await pool.query(
            'INSERT INTO expenses (user_id, itemname, price, date) VALUES ($1, $2, $3, $4)',
            [req.userId, itemname, price, date]
        );
        res.status(201).json({ message: 'Despesa criada com sucesso' });
    } catch (error) {
        console.error('Erro ao criar despesa:', error);
        res.status(500).json({ message: 'Erro ao criar despesa', error });
    }
});


// Listar despesas do usuário logado
app.get('/api/expenses', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM expenses WHERE user_id = $1',
            [req.userId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar despesas' });
    }
});


// Get user total spent
app.get('/api/total', async (req, res) => {
    try {
        const { userName } = req.query

        if (!userName) {
            return res.status(400).json({ message: 'Username é necessário' })
        }

        const result = await pool.query(
            'SELECT SUM(e.price) AS total_price FROM expenses e JOIN users u ON e.user_id = u.id WHERE u.username = $1',
            [userName]
        );

        res.json({ total: result.rows[0].total_price || 0 })
    } catch (err) {
        res.status(500).send('Error fetching total price')
    }
})

// updating item
app.put('/api/expenses/:id', authMiddleware, async (req, res) => {
    const { itemname, price, date } = req.body;
    const { id } = req.params;

    try {
        await pool.query(
            `UPDATE expenses 
                SET itemname = COALESCE(NULLIF($1, ''), itemname), 
                price = COALESCE(NULLIF($2, '')::numeric, price), 
                date = COALESCE(NULLIF($3, '')::date, date)  -- Conversão explícita para DATE
                WHERE id = $4 AND user_id = $5`,
            [itemname, price, date, id, req.userId]
        );

        res.json({ message: 'Despesa atualizada com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar despesa' });
        console.error('Erro ao atualizar despesa:', error.response?.data || error.message)
    }
});

// Updating user settings
app.put('/api/expenses/update/:id', async (req, res) => {
    const { username, email, password } = req.body;
    const { id } = req.params;

    try {
        let passwordHash = null;
        if (password) {
            // Gera o hash da senha
            const saltRounds = 10;
            passwordHash = await bcrypt.hash(password, saltRounds);
        }

        // Atualiza o usuário no banco de dados
        await pool.query(
            `UPDATE users
            SET username = COALESCE(NULLIF($1, ''), username),
            email = COALESCE(NULLIF($2, ''), email),
            password_hash = COALESCE($3, password_hash)
            WHERE id = $4`,
            [username, email, passwordHash, id]
        );

        res.status(200).json({ message: 'Dados atualizados com sucesso!' });
    } catch (error) {
        console.error('Erro ao atualizar dados:', error);
        res.status(500).json({ message: 'Erro ao atualizar dados' });
    }
});;


// Deleting item
app.delete('/api/expenses/:id', authMiddleware, async (req, res) => {
    const { id } = req.params

    try {
        await pool.query(`DELETE FROM expenses WHERE id = '${id}'`)

        res.status(200).json({ message: 'Despesa deletada com sucesso!' })
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar despesa' })
    }
})

app.listen(port, () => console.log('Servidor rodando na porta:', port))

