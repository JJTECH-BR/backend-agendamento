import prisma from '../client.js';

const scheduleSelect = {
    id: true,
    dayOfWeek: true,
    startTime: true,
    endTime: true,
    available: true,
};

const professionalSelect = {
    id: true,
    name: true,
    specialty: true,
    biography: true,
    profilePhoto: true,
    instagram: true,
    active: true,
    schedules: {
        orderBy: { dayOfWeek: 'asc' },
        select: scheduleSelect,
    },
};

class ProfessionalController {
    async store(req, res) {
        try {
            const professional = await prisma.user.create({
                data: {
                    ...req.body,
                    email: null,
                    password: null,
                    role: 'PROFISSIONAL',
                    companyId: req.user.companyId,
                },
                select: professionalSelect,
            });
            return res.status(201).json(professional);
        } catch (error) {
            console.error('Erro ao criar profissional:', error);
            return res.status(500).json({ error: 'Erro ao criar profissional' });
        }
    }

    async update(req, res) {
        try {
            const professional = await prisma.user.findFirst({
                where: {
                    id: req.params.id,
                    companyId: req.user.companyId,
                    role: 'PROFISSIONAL',
                },
                select: { id: true },
            });

            if (!professional) {
                return res.status(404).json({ error: 'Profissional não encontrado' });
            }

            const updatedProfessional = await prisma.user.update({
                where: { id: professional.id },
                data: req.body,
                select: professionalSelect,
            });
            return res.json(updatedProfessional);
        } catch (error) {
            console.error('Erro ao atualizar profissional:', error);
            return res.status(500).json({ error: 'Erro ao atualizar profissional' });
        }
    }

    async delete(req, res) {
        try {
            const professional = await prisma.user.findFirst({
                where: {
                    id: req.params.id,
                    companyId: req.user.companyId,
                    role: 'PROFISSIONAL',
                },
                select: { id: true },
            });

            if (!professional) {
                return res.status(404).json({ error: 'Profissional não encontrado' });
            }

            const appointments = await prisma.appointment.count({
                where: { professionalId: professional.id },
            });
            const services = await prisma.service.count({
                where: { professionalId: professional.id },
            });
            const conversations = await prisma.chatConversation.count({
                where: { userId: professional.id },
            });

            if (appointments || services || conversations) {
                await prisma.user.update({
                    where: { id: professional.id },
                    data: { active: false },
                });
                return res.status(200).json({ id: professional.id, active: false, archived: true });
            }

            await prisma.user.delete({ where: { id: professional.id } });
            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir profissional:', error);
            return res.status(500).json({ error: 'Erro ao excluir profissional' });
        }
    }

    async index(req, res) {
        try {
            const professionals = await prisma.user.findMany({
                where: {
                    companyId: req.user.companyId,
                    role: 'PROFISSIONAL',
                },
                orderBy: { name: 'asc' },
                select: professionalSelect,
            });
            return res.json(professionals);
        } catch (error) {
            console.error('Erro ao listar profissionais:', error);
            return res.status(500).json({ error: 'Erro ao listar profissionais' });
        }
    }

    async saveSchedule(req, res) {
        try {
            const professional = await prisma.user.findFirst({
                where: {
                    id: req.params.id,
                    companyId: req.user.companyId,
                    role: 'PROFISSIONAL',
                },
                select: { id: true },
            });

            if (!professional) {
                return res.status(404).json({ error: 'Profissional não encontrado' });
            }

            const schedule = await prisma.professionalSchedule.upsert({
                where: {
                    professionalId_dayOfWeek: {
                        professionalId: professional.id,
                        dayOfWeek: req.body.dayOfWeek,
                    },
                },
                create: {
                    ...req.body,
                    professionalId: professional.id,
                },
                update: {
                    startTime: req.body.startTime,
                    endTime: req.body.endTime,
                    available: req.body.available,
                },
                select: scheduleSelect,
            });

            return res.status(200).json(schedule);
        } catch (error) {
            console.error('Erro ao salvar horário do profissional:', error);
            return res.status(500).json({ error: 'Erro ao salvar horário do profissional' });
        }
    }

    async deleteSchedule(req, res) {
        try {
            const professional = await prisma.user.findFirst({
                where: {
                    id: req.params.id,
                    companyId: req.user.companyId,
                    role: 'PROFISSIONAL',
                },
                select: { id: true },
            });
            if (!professional) {
                return res.status(404).json({ error: 'Profissional não encontrado' });
            }

            const schedule = await prisma.professionalSchedule.findFirst({
                where: {
                    id: req.params.scheduleId,
                    professionalId: professional.id,
                },
                select: { id: true },
            });

            if (!schedule) {
                return res.status(404).json({ error: 'Horário não encontrado' });
            }

            await prisma.professionalSchedule.delete({ where: { id: schedule.id } });
            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir horário do profissional:', error);
            return res.status(500).json({ error: 'Erro ao excluir horário do profissional' });
        }
    }
}

export default new ProfessionalController();
