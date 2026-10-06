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

            return res.status(500).json({
                error: 'Erro interno ao criar conta',
            });
        }
    }

    async index(req, res) {
        try {
            const users = await prisma.user.findMany({
                where: {
                    companyId: req.userCompanyId,
                },
                include: {
                    company: true,
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