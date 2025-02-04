import pool from '../database/db.js'


// Creating Expense
async function creatingExpense(req, res) {
    const { itemname, price, date } = req.body;

    if (!itemname || !price || !date) {
        return res.status(400).json({ message: 'Nome do item, preço e data são obrigatórios' });
    }

    try {
        await pool.query(
            'INSERT INTO expenses (user_id, itemname, price, date) VALUES ($1, $2, $3, $4)',
            [req.userId, itemname, price, date]
        );
        res.status(201).json({ message: 'Despesa criada com sucesso' });
    } catch (error) {
        console.error('Erro ao criar despesa:', error);
        res.status(500).json({ message: 'Erro ao criar despesa', error });
    }
}

// Updating user expense
async function updateUserExpense(req, res) {
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
}

// Deleting user expense
async function deletingExpense(req, res) {
    const { id } = req.params

    try {
        await pool.query(`DELETE FROM expenses WHERE id = '${id}'`)

        res.status(200).json({ message: 'Despesa deletada com sucesso!' })
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar despesa' })
    }
}

// Get user expenses
async function getExpenses(req, res) {
    try {
        const result = await pool.query(
            'SELECT * FROM expenses WHERE user_id = $1',
            [req.userId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao listar despesas' });
    }
}

// Get user total spent
async function totalSpent(req, res) {
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
}

export { creatingExpense, updateUserExpense, deletingExpense, getExpenses, totalSpent }



