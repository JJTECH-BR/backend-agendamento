import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import prisma from '../client.js';

class SessionController {
    async store(req, res) {
        const { email, password, companyId } = req.body;

        try {
            const user = await prisma.user.findUnique({
                where: { email },
            });

            if (!user || !user.password) {
                return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
            }

            if (user.role === 'PROFISSIONAL') {
                return res.status(403).json({ error: 'Profissionais não possuem acesso ao sistema.' });
            }

            if (!user.active) {
                return res.status(401).json({ error: 'Esta conta está inativa.' });
            }

            if (companyId) {
                const company = await prisma.company.findUnique({
                    where: { slug: companyId },
                    select: { id: true },
                });

                if (!company) {
                    return res.status(400).json({ error: 'Empresa não encontrada' });
                }

                if (user.companyId !== company.id) {
                    return res.status(401).json({ error: 'Esta conta não pertence a esta empresa' });
                }
            }

            const checkPassword = await bcryptjs.compare(password, user.password);
            if (!checkPassword) {
                return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
            }

            const { id, name, role } = user;
            const token = jwt.sign(
                { id, companyId: user.companyId, role },
                process.env.APP_SECRET,
                { expiresIn: '7d' },
            );

            return res.json({
                user: { id, name, email: user.email, role },
                token,
            });
        } catch (error) {
            console.error('Erro ao autenticar usuário:', error);
            return res.status(500).json({ error: 'Erro ao autenticar usuário' });
        }
    }
}

export default new SessionController();