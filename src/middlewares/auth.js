import jwt from 'jsonwebtoken';
import { promisify } from 'util';

export default async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não enviado' });
    }

    const [, token] = authHeader.split(' ');

    try {
        // Valida o crachá
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        // Salva os dados para os próximos arquivos usarem
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        req.userCompanyId = decoded.companyId;

        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};