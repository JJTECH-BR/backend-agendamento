import jwt from 'jsonwebtoken';
import { promisify } from 'util';

export default async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // 1. Checa se o Token veio no cabeçalho da requisição
    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    // O cabeçalho vem como "Bearer TOKEN", então pegamos só a segunda parte
    const [, token] = authHeader.split(' ');

    try {
        // 2. Tenta validar o Token com a nossa chave secreta do .env
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        // 3. Sucesso! Colocamos os dados do usuário dentro da requisição (req)
        // Agora qualquer Controller que vier depois saberá quem está logado
        req.userId = decoded.userId;
        req.userRole = decoded.role;
        req.userCompanyId = decoded.companyId;

        // 4. Libera a passagem para a próxima função (o Controller)
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};