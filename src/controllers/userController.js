import bcryptjs from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// A conexão nova exigida pela versão 7:
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

class UserController {
    // O método 'create' vai guardar toda a lógica de criar o usuário
    async create(req, res) {
        const { name, email, password, confirmPassword, companyId } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'As senhas não coincidem' });
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
                companyId: companyId // Atribuímos o ID da empresa diretamente aqui
            }
        });

        return res.status(201).json(user);
    }
    async index(req, res) {
        try {
            const users = await prisma.user.findMany({
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

// Exportamos a classe instanciada para as rotas poderem usar
export default new UserController();