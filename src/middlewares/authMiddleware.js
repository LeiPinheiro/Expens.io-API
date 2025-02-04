import jwt from 'jsonwebtoken'
import 'dotenv/config'

// Middleware de autenticação
export const authMiddleware = (req, res, next) => {
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