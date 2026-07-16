import bcryptjs from 'bcryptjs';
import prisma from '../client.js';

class UserController {
    // O método 'create' vai guardar toda a lógica de criar o usuário
    async create(req, res) {
        try {
            const { name, email, password, confirmPassword, companyId, role } = req.body;

            if (!name || !email || !password || !confirmPassword) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({ error: 'As senhas não coincidem' });
            }

            const company = await prisma.company.findUnique({
                where: { slug: companyId },
            });

            if (!company) {
                return res.status(400).json({ error: 'Empresa não encontrada' });
            }

            const userExists = await prisma.user.findUnique({
                where: { email: email },
            });

            if (userExists) {
                return res.status(400).json({ error: 'Usuário já existe' });
            }

            const hashedPassword = await bcryptjs.hash(password, 8);

            const user = await prisma.user.create({
                data: {
                    name: name,
                    email: email,
                    password: hashedPassword,
                    companyId: company.id,
                }
            });

            return res.status(201).json(user);
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            return res.status(500).json({ error: 'Erro interno ao criar conta' });
        }
    }

    async index(req, res) {
        try {
            const users = await prisma.user.findMany({
                // O 'where' é o nosso filtro. 
                // Ele diz: "Prisma, traga os usuários ONDE o companyId seja igual ao ID que está no Token"
                where: {
                    companyId: req.userCompanyId,
                },
                include: {
                    company: true,
                }
            });
            return res.json(users);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao listar usuários' });
        }
    }
}

export default new UserController();