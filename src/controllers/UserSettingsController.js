import pool from '../database/db.js'
import bcrypt from 'bcrypt'

// Updating user data
async function updateData() {
    const { username, email, password } = req.body;
    const { id } = req.params;

    try {
        let passwordHash = null;
        if (password) {
            const saltRounds = 10;
            passwordHash = await bcrypt.hash(password, saltRounds);
        }

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
}

export { updateData }