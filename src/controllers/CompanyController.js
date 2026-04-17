import prisma from '../client.js';

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