import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../client.js';

class SessionController {
    async create(req, res) {
        const { email, password } = req.body;

        // 1. Verifica se enviaram email e senha
        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        // 2. Procura o usuário no banco pelo email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // 3. Se não achar o usuário, avisa que não encontrou
        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        // 4. Compara a senha digitada com a senha secreta do banco
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }

        // 5. O CRACHÁ (Token): Guardamos o ID, o Cargo (Role) e a Empresa dentro dele
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                companyId: user.companyId
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' } // Esse crachá vale por 7 dias
        );

        // 6. Resposta final para o Front-end (Juliana)
        return res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,      // Importante para o Front saber se é ADMIN
                companyId: user.companyId
            },
            token, // O token que ela vai usar para "abrir as portas" das outras rotas
        });
    }
}

export default new SessionController();