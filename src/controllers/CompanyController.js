import bcryptjs from 'bcryptjs';
import { timingSafeEqual } from 'crypto';
import prisma from '../client.js';

function segredoValido(recebido, esperado) {
    if (!recebido || !esperado) return false;
    const recebidoBuffer = Buffer.from(recebido);
    const esperadoBuffer = Buffer.from(esperado);
    return recebidoBuffer.length === esperadoBuffer.length
        && timingSafeEqual(recebidoBuffer, esperadoBuffer);
}

class CompanyController {
    async store(req, res) {
        if (!process.env.ADMIN_SECRET) {
            return res.status(503).json({ error: 'Cadastro de empresas indisponível neste ambiente' });
        }

        if (!segredoValido(req.body.adminKey, process.env.ADMIN_SECRET)) {
            return res.status(401).json({ error: 'Chave de cadastro inválida' });
        }

        const slug = req.body.companyName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');

        if (!slug) {
            return res.status(400).json({ error: 'O nome da empresa não gera um link válido' });
        }

        try {
            const userExists = await prisma.user.findUnique({
                where: { email: req.body.email },
                select: { id: true },
            });
            if (userExists) {
                return res.status(409).json({ error: 'Este e-mail já está em uso' });
            }

            const hashedPassword = await bcryptjs.hash(req.body.password, 12);
            const company = await prisma.company.create({
                data: {
                    name: req.body.companyName,
                    slug,
                    users: {
                        create: {
                            name: req.body.userName,
                            email: req.body.email,
                            password: hashedPassword,
                            role: 'ADMIN',
                        },
                    },
                },
                select: {
                    name: true,
                    slug: true,
                },
            });

            return res.status(201).json(company);
        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(409).json({ error: 'Já existe uma empresa ou usuário com esses dados' });
            }

            console.error('Erro ao criar a empresa e o administrador:', error);
            return res.status(500).json({ error: 'Erro ao criar a empresa e o administrador' });
        }
    }

    async index(req, res) {
        try {
            const company = await prisma.company.findUnique({
                where: { id: req.user.companyId },
                select: { name: true, slug: true },
            });
            return company ? res.json([company]) : res.status(404).json({ error: 'Empresa não encontrada' });
        } catch (error) {
            console.error('Erro ao buscar a empresa:', error);
            return res.status(500).json({ error: 'Erro ao buscar a empresa' });
        }
    }

    async show(req, res) {
        try {
            const company = await prisma.company.findUnique({
                where: { id: req.user.companyId },
                select: {
                    name: true,
                    slug: true,
                    description: true,
                    heroTitle: true,
                    heroDescription: true,
                    phone: true,
                    address: true,
                    instagram: true,
                    instagramUrl: true,
                    openingTime: true,
                    closingTime: true,
                    closedDates: true,
                    pageContent: true,
                },
            });

            if (!company) {
                return res.status(404).json({ error: 'Empresa não encontrada' });
            }

            return res.json(company);
        } catch (error) {
            console.error('Erro ao buscar dados da empresa:', error);
            return res.status(500).json({ error: 'Erro ao buscar dados da empresa' });
        }
    }

    async update(req, res) {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Somente administradores podem alterar os dados da empresa' });
        }

        try {
            const currentCompany = await prisma.company.findUnique({
                where: { id: req.user.companyId },
                select: { openingTime: true, closingTime: true },
            });
            if (!currentCompany) {
                return res.status(404).json({ error: 'Empresa não encontrada' });
            }
            const openingTime = req.body.openingTime || currentCompany.openingTime;
            const closingTime = req.body.closingTime || currentCompany.closingTime;
            if (openingTime >= closingTime) {
                return res.status(400).json({ error: 'O fechamento deve ser posterior à abertura' });
            }

            const company = await prisma.company.update({
                where: { id: req.user.companyId },
                data: req.body,
                select: {
                    name: true,
                    slug: true,
                    description: true,
                    heroTitle: true,
                    heroDescription: true,
                    phone: true,
                    address: true,
                    instagram: true,
                    instagramUrl: true,
                    openingTime: true,
                    closingTime: true,
                    closedDates: true,
                    pageContent: true,
                },
            });

            return res.json(company);
        } catch (error) {
            console.error('Erro ao atualizar dados da empresa:', error);
            return res.status(500).json({ error: 'Erro ao atualizar dados da empresa' });
        }
    }

    async changePassword(req, res) {
        try {
            const user = await prisma.user.findFirst({
                where: {
                    id: req.user.id,
                    companyId: req.user.companyId,
                    role: 'ADMIN',
                    active: true,
                },
                select: { id: true, password: true },
            });

            if (!user?.password || !(await bcryptjs.compare(req.body.currentPassword, user.password))) {
                return res.status(400).json({ error: 'A senha atual está incorreta' });
            }

            const password = await bcryptjs.hash(req.body.newPassword, 12);
            await prisma.user.update({
                where: { id: user.id },
                data: { password },
            });

            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao alterar a senha do administrador:', error);
            return res.status(500).json({ error: 'Erro ao alterar a senha' });
        }
    }

    async showPublic(req, res) {
        try {
            const companyRecord = await prisma.company.findUnique({
                where: { slug: req.params.slug },
                select: { id: true },
            });
            if (!companyRecord) {
                return res.status(404).json({ error: 'Empresa não encontrada' });
            }

            const company = await prisma.company.findUnique({
                where: { id: companyRecord.id },
                select: {
                    name: true,
                    slug: true,
                    description: true,
                    heroTitle: true,
                    heroDescription: true,
                    phone: true,
                    address: true,
                    instagram: true,
                    instagramUrl: true,
                    openingTime: true,
                    closingTime: true,
                    closedDates: true,
                    pageContent: true,
                    services: {
                        where: {
                            active: true,
                            professional: {
                                is: {
                                    active: true,
                                    role: 'PROFISSIONAL',
                                    companyId: companyRecord.id,
                                },
                            },
                        },
                        orderBy: { name: 'asc' },
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            price: true,
                            duration: true,
                            active: true,
                            professionalId: true,
                            professional: {
                                select: { id: true, name: true, specialty: true },
                            },
                        },
                    },
                    users: {
                        where: {
                            role: 'PROFISSIONAL',
                            active: true,
                            companyId: companyRecord.id,
                        },
                        orderBy: { name: 'asc' },
                        select: {
                            id: true,
                            name: true,
                            specialty: true,
                            biography: true,
                            profilePhoto: true,
                            instagram: true,
                            schedules: {
                                orderBy: { dayOfWeek: 'asc' },
                                select: {
                                    id: true,
                                    dayOfWeek: true,
                                    startTime: true,
                                    endTime: true,
                                    available: true,
                                },
                            },
                        },
                    },
                },
            });

            return res.json(company);
        } catch (error) {
            console.error('Erro ao buscar página pública da empresa:', error);
            return res.status(500).json({ error: 'Erro ao buscar dados públicos da empresa' });
        }
    }
}

export default new CompanyController();