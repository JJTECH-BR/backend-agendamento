
import bcryptjs from 'bcryptjs';
import prisma from '../client.js';

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export class CreateUserService {
    async execute({
        name,
        email,
        password,
        companyId,
        role,
        adminKey,
    }) {
        const perfil = role || 'CLIENT';

        if (perfil !== 'CLIENT' && adminKey !== ADMIN_SECRET) {
            const error = new Error('Chave secreta incorreta');
            error.statusCode = 401;
            throw error;
        }

        const company = await prisma.company.findUnique({
            where: {
                slug: companyId,
            },
        });

        if (!company) {
            const error = new Error('Empresa não encontrada');
            error.statusCode = 400;
            throw error;
        }

        const userExists = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (userExists) {
            const error = new Error('Usuário já existe');
            error.statusCode = 400;
            throw error;
        }

        const hashedPassword = await bcryptjs.hash(password, 8);

        return prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: perfil,
                companyId: company.id,
            },
        });
    }
}