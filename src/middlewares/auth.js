import jwt from 'jsonwebtoken';

const roles = new Set(['CLIENT', 'ADMIN']);

export default (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não enviado' });
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
        return res.status(401).json({ error: 'Token não enviado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.APP_SECRET);
        if (
            typeof decoded !== 'object'
            || !decoded.id
            || !decoded.companyId
            || !roles.has(decoded.role)
        ) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        req.user = {
            id: decoded.id,
            role: decoded.role,
            companyId: decoded.companyId,
        };

        return next();
    } catch {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

export function requireAdmin(req, res, next) {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Acesso restrito a administradores' });
    }

    return next();
}