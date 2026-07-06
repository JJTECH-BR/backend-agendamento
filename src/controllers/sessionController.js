import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import prisma from '../client.js';

class SessionController {
    async store(req, res) {
        const { email, password } = req.body;

        // 1. Verifica se o usuário existe no banco
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado.' });
        }

        // 2. Compara a senha digitada com a senha criptografada do banco
        const checkPassword = await bcryptjs.compare(password, user.password);

        if (!checkPassword) {
            return res.status(401).json({ error: 'Senha incorreta.' });
        }

        // 3. Gera o Token de Acesso usando a chave do .env
        const { id, name, companyId, role } = user;
        const token = jwt.sign(
            { id, companyId, role },
            process.env.APP_SECRET,
            { expiresIn: '7d' } // O login dura 7 dias
        );

        // 4. Retorna os dados do usuário (sem a senha) e o Token
        return res.json({
            user: {
                id,
                name,
                email,
                companyId,
                role
            },
            token
        });
    }
}

export default new SessionController();