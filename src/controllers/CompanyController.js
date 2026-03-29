import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// A conexão nova exigida pela versão 7:
const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

class CompanyController {
    async store(req, res) {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'O nome da empresa é obrigatório' });
        }

        try {
            const company = await prisma.company.create({
                data: { name },
            });

            return res.status(201).json(company);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao criar empresa' });
        }
    }

    async index(req, res) {
        const companies = await prisma.company.findMany();
        return res.json(companies);
    }
}

export default new CompanyController();