import bcryptjs from 'bcryptjs';
import prisma from '../client.js';

class CompanyController {
    async store(req, res) {
        // 1. Recebemos os dados do JSON (Dono e Empresa juntos)
        const { companyName, userName, email, password } = req.body;

        if (!companyName || !userName || !email || !password) {
            return res.status(400).json({ error: 'Preencha todos os campos do dono e da empresa' });
        }

        try {
            const userExists = await prisma.user.findUnique({ where: { email } });
            if (userExists) {
                return res.status(400).json({ error: 'Este e-mail já está em uso' });
            }

            const hashedPassword = await bcryptjs.hash(password, 8);

            // 2. Cria a Empresa e o Dono na mesma tacada
            const company = await prisma.company.create({
                data: {
                    name: companyName,
                    users: {
                        create: {
                            name: userName,
                            email: email,
                            password: hashedPassword,
                            role: 'ADMIN'
                        }
                    }
                },
                include: {
                    users: true
                }
            });

            return res.status(201).json(company);
        } catch (error) {
            console.log(error);
            return res.status(500).json({ error: 'Erro ao criar a empresa e o administrador' });
        }
    }

    async index(req, res) {
        const companies = await prisma.company.findMany();
        return res.json(companies);
    }
}

export default new CompanyController();