import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import prisma from '../client.js';

class SessionController {
    async store(req, res) {
        const { email, password, companyId } = req.body;

        // 1. Verifica se o usuário existe no banco
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado.' });
        }

        // 1.5 Se veio um slug de empresa na URL, confirma que o usuário pertence a ela
        if (companyId) {
            const company = await prisma.company.findUnique({
                where: { slug: companyId }
            });

            if (!company) {
                return res.status(400).json({ error: 'Empresa não encontrada' });
            }

            if (user.companyId !== company.id) {
                return res.status(401).json({ error: 'Esta conta não pertence a esta empresa' });
            }
        }

        // 2. Compara a senha digitada com a senha criptografada do banco
        const checkPassword = await bcryptjs.compare(password, user.password);

        if (!checkPassword) {
            return res.status(401).json({ error: 'Senha incorreta.' });
        }

        // 3. Gera o Token de Acesso usando a chave do .env
        const { id, name, role } = user;
        const token = jwt.sign(
            { id, companyId: user.companyId, role },
            process.env.APP_SECRET,
            { expiresIn: '7d' } // O login dura 7 dias
        );

        // 4. Retorna os dados do usuário (sem a senha) e o Token
        return res.json({
            user: {
                id,
                name,
                email,
                companyId: user.companyId,
                role
            },
            token
        });
    }
}

export default new SessionController();