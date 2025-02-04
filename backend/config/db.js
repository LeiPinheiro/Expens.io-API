import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
        rejectUnauthorized: false, // Importante para evitar erro de SSL no Render
    }
})

export default pool