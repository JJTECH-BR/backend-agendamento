import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../client.js';

class SessionController {
    async create(req, res) {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d',
            });
        return res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            token,
        });
    }
}
export default new SessionController();