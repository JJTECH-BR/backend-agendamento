import bcryptjs from 'bcryptjs';
import prisma from '../client.js';

class UserController {
    // O método 'create' vai guardar toda a lógica de criar o usuário
    async create(req, res) {
        // 1. ADICIONAMOS O 'role' AQUI NA LISTA DE RECEBIMENTO
        const { name, email, password, confirmPassword, companyId, role } = req.body;

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
                companyId: companyId, // Atribuímos o ID da empresa diretamente aqui
            }
        });

        return res.status(201).json(user);
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