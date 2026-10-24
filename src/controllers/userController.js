import { CreateUserService } from '../services/CreateUserService.js';
import prisma from '../client.js';

const createUserService = new CreateUserService();

class UserController {
    async create(req, res) {
        try {
            const user = await createUserService.execute(req.body);

            return res.status(201).json(user);
        } catch (error) {
            console.error('Erro ao criar usuário:', error);
            if (error.statusCode) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            if (error.code === 'P2002') {
                return res.status(409).json({ error: 'Este e-mail já está em uso' });
            }

            return res.status(500).json({
                error: 'Erro interno ao criar conta',
            });
        }
    }

    async index(req, res) {
        try {
            const users = await prisma.user.findMany({
                where: {
                    companyId: req.user.companyId,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    active: true,
                    createdAt: true,
                },
            });

            return res.json(users);
        } catch (error) {
            return res.status(500).json({
                error: 'Erro ao listar usuários',
            });
        }
    }
}

export default new UserController();