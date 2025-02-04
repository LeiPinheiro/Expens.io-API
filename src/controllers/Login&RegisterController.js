import pool from '../database/db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import 'dotenv/config'


async function userRegister(req, res) {
    const { username, email, password } = req.body;

    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email e senha são obrigatórios' });
        }

        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'Email já está em uso' });
        }

        const saltRounds = 10;


        const passwordHash = await bcrypt.hash(password, saltRounds);

        await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
            [username, email, passwordHash]
        );

        res.status(201).json({ message: 'Usuário registrado com sucesso' });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro ao registrar usuário' });
    }
}

async function userLogin(req, res) {
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

        const token = jwt.sign({ id: user.id }, process.env.SECRET, { expiresIn: '1d' });

        console.log('Token gerado no backend:', token);

        return res.json({
            token,
            username: user.username
        });
    } catch (error) {
        console.error('Erro no servidor:', error.message);
        return res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
}

export { userRegister, userLogin }