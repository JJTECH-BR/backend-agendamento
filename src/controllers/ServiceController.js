import prisma from '../client.js';

const serviceSelect = {
    id: true,
    name: true,
    description: true,
    price: true,
    duration: true,
    active: true,
    professionalId: true,
    professional: {
        select: { id: true, name: true, specialty: true, active: true },
    },
};

async function findProfessional(professionalId, companyId) {
    if (!professionalId) return null;

    return prisma.user.findFirst({
        where: {
            id: professionalId,
            companyId,
            role: 'PROFISSIONAL',
            active: true,
        },
        select: { id: true },
    });
}

class ServiceController {
    async store(req, res) {
        try {
            const professional = await findProfessional(req.body.professionalId, req.user.companyId);
            if (!professional) {
                return res.status(400).json({ error: 'Selecione um profissional ativo desta empresa' });
            }

            const service = await prisma.service.create({
                data: { ...req.body, companyId: req.user.companyId },
                select: serviceSelect,
            });
            return res.status(201).json(service);
        } catch (error) {
            console.error('Erro ao criar serviço:', error);
            return res.status(500).json({ error: 'Erro ao criar serviço' });
        }
    }

    async update(req, res) {
        try {
            const service = await prisma.service.findFirst({
                where: { id: req.params.id, companyId: req.user.companyId },
                select: { id: true, professionalId: true },
            });

            if (!service) {
                return res.status(404).json({ error: 'Serviço não encontrado' });
            }

            if (req.body.professionalId) {
                const professional = await findProfessional(req.body.professionalId, req.user.companyId);
                if (!professional && req.body.professionalId !== service.professionalId) {
                    return res.status(400).json({ error: 'Selecione um profissional ativo desta empresa' });
                }

                if (!professional && req.body.professionalId === service.professionalId) {
                    const existingProfessional = await prisma.user.findFirst({
                        where: {
                            id: service.professionalId,
                            companyId: req.user.companyId,
                            role: 'PROFISSIONAL',
                        },
                        select: { id: true },
                    });
                    if (!existingProfessional) {
                        return res.status(400).json({ error: 'Profissional inválido para esta empresa' });
                    }
                }
            }

            const updatedService = await prisma.service.update({
                where: { id: service.id },
                data: req.body,
                select: serviceSelect,
            });
            return res.json(updatedService);
        } catch (error) {
            console.error('Erro ao atualizar serviço:', error);
            return res.status(500).json({ error: 'Erro ao atualizar serviço' });
        }
    }

    async delete(req, res) {
        try {
            const service = await prisma.service.findFirst({
                where: { id: req.params.id, companyId: req.user.companyId },
                select: { id: true },
            });

            if (!service) {
                return res.status(404).json({ error: 'Serviço não encontrado' });
            }

            const appointmentCount = await prisma.appointment.count({
                where: { serviceId: service.id },
            });
            if (appointmentCount) {
                await prisma.service.update({
                    where: { id: service.id },
                    data: { active: false },
                });
                return res.status(200).json({ id: service.id, active: false, archived: true });
            }

            await prisma.service.delete({ where: { id: service.id } });
            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir serviço:', error);
            return res.status(500).json({ error: 'Erro ao excluir serviço' });
        }
    }

    async index(req, res) {
        try {
            const services = await prisma.service.findMany({
                where: { companyId: req.user.companyId },
                orderBy: { name: 'asc' },
                select: serviceSelect,
            });
            return res.json(services);
        } catch (error) {
            console.error('Erro ao listar serviços:', error);
            return res.status(500).json({ error: 'Erro ao listar serviços' });
        }
    }
}

export default new ServiceController();
