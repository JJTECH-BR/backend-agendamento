
import bcryptjs from 'bcryptjs';
import prisma from '../client.js';

export class CreateUserService {
    async execute({
        name,
        email,
        password,
        companyId,
    }) {
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
            error.statusCode = 409;
            throw error;
        }

        const hashedPassword = await bcryptjs.hash(password, 12);

        return prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'CLIENT',
                companyId: company.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });
    }
}