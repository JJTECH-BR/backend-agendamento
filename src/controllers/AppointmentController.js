import prisma from '../client.js';
import { hasAppointmentConflict, isWithinAppointmentHours } from '../services/appointmentRules.js';

const appointmentSelect = {
    id: true,
    date: true,
    price: true,
    status: true,
    client: { select: { id: true, name: true } },
    professional: { select: { id: true, name: true, specialty: true } },
    service: { select: { id: true, name: true, price: true, duration: true } },
};

async function getCompanyHours(companyId) {
    return prisma.company.findUnique({
        where: { id: companyId },
        select: {
            openingTime: true,
            closingTime: true,
            closedDates: true,
        },
    });
}

async function lockProfessionalSchedule(transaction, companyId, professionalId) {
    const lockKey = `${companyId}:${professionalId}`;
    await transaction.$queryRaw`
        SELECT 1 AS locked
        FROM (
            SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))
        ) AS advisory_lock
    `;
}

async function findConflicts({
    client = prisma,
    companyId,
    professionalId,
    date,
    duration,
    excludedId,
}) {
    const appointments = await client.appointment.findMany({
        where: {
            companyId,
            professionalId,
            ...(excludedId ? { id: { not: excludedId } } : {}),
            status: { not: 'CANCELLED' },
            date: {
                gte: new Date(date.getTime() - 24 * 60 * 60_000),
                lt: new Date(date.getTime() + duration * 60_000),
            },
        },
        select: { date: true, serviceId: true },
    });

    if (appointments.length === 0) return false;

    const services = await client.service.findMany({
        where: { id: { in: [...new Set(appointments.map(({ serviceId }) => serviceId))] } },
        select: { id: true, duration: true },
    });
    const durations = new Map(services.map(({ id, duration: serviceDuration }) => [id, serviceDuration]));
    const appointmentsWithDuration = appointments.map((appointment) => {
        const serviceDuration = durations.get(appointment.serviceId);
        if (serviceDuration === undefined) {
            throw new Error('Serviço associado ao agendamento não encontrado');
        }

        return { ...appointment, service: { duration: serviceDuration } };
    });

    return hasAppointmentConflict(date, duration, appointmentsWithDuration);
}

class AppointmentController {
    async store(req, res) {
        try {
            if (req.user.role !== 'CLIENT') {
                return res.status(403).json({ error: 'Somente clientes podem criar agendamentos' });
            }

            const date = new Date(req.body.date);
            if (date <= new Date()) {
                return res.status(400).json({ error: 'O horário deve ser no futuro' });
            }

            const service = await prisma.service.findFirst({
                where: {
                    id: req.body.serviceId,
                    companyId: req.user.companyId,
                    active: true,
                },
                select: { id: true, professionalId: true, duration: true, price: true },
            });
            const company = await getCompanyHours(req.user.companyId);

            if (!service || !company) {
                return res.status(404).json({ error: 'Serviço ou empresa não encontrado(a) ou inativo(a)' });
            }

            const professionalId = req.body.professionalId || service.professionalId;
            if (!professionalId) {
                return res.status(400).json({ error: 'Selecione um profissional para o serviço' });
            }

            const professional = await prisma.user.findFirst({
                where: {
                    id: professionalId,
                    companyId: req.user.companyId,
                    role: 'PROFISSIONAL',
                    active: true,
                },
                select: {
                    id: true,
                    schedules: {
                        select: { dayOfWeek: true, startTime: true, endTime: true, available: true },
                    },
                },
            });

            if (!professional) {
                return res.status(400).json({ error: 'Profissional inválido ou inativo' });
            }
            if (service.professionalId && service.professionalId !== professional.id) {
                return res.status(400).json({ error: 'Este serviço não está disponível com esse profissional' });
            }
            if (!isWithinAppointmentHours(date, service.duration, company, professional.schedules)) {
                return res.status(400).json({
                    error: 'O horário está fora do expediente, da disponibilidade do profissional ou em uma data fechada',
                });
            }
            const appointment = await prisma.$transaction(async (transaction) => {
                await lockProfessionalSchedule(
                    transaction,
                    req.user.companyId,
                    professional.id,
                );
                if (await findConflicts({
                    client: transaction,
                    companyId: req.user.companyId,
                    professionalId: professional.id,
                    date,
                    duration: service.duration,
                })) {
                    return null;
                }

                return transaction.appointment.create({
                    data: {
                        date,
                        price: service.price,
                        status: 'PENDING',
                        clientId: req.user.id,
                        professionalId: professional.id,
                        serviceId: service.id,
                        companyId: req.user.companyId,
                    },
                    select: { id: true },
                });
            });
            if (!appointment) {
                return res.status(409).json({ error: 'Este horário acabou de ser ocupado. Escolha outro.' });
            }

            const createdAppointment = await prisma.appointment.findUnique({
                where: { id: appointment.id },
                select: appointmentSelect,
            });
            if (!createdAppointment) {
                throw new Error('Agendamento criado não foi encontrado');
            }
            return res.status(201).json(createdAppointment);
        } catch (error) {
            console.error('Erro ao criar agendamento:', error);
            return res.status(500).json({ error: 'Erro ao criar agendamento' });
        }
    }

    async index(req, res) {
        try {
            if (req.user.role === 'PROFISSIONAL') {
                return res.status(403).json({ error: 'Profissionais não possuem acesso ao sistema' });
            }

            const where = { companyId: req.user.companyId };
            if (req.user.role === 'CLIENT') {
                where.clientId = req.user.id;
            }

            const appointments = await prisma.appointment.findMany({
                where,
                orderBy: { date: 'asc' },
                select: appointmentSelect,
            });
            return res.json(appointments);
        } catch (error) {
            console.error('Erro ao listar agendamentos:', error);
            return res.status(500).json({ error: 'Erro ao listar agendamentos' });
        }
    }

    async update(req, res) {
        try {
            if (req.user.role === 'PROFISSIONAL') {
                return res.status(403).json({ error: 'Profissionais não possuem acesso ao sistema' });
            }

            const appointment = await prisma.appointment.findFirst({
                where: {
                    id: req.params.id,
                    companyId: req.user.companyId,
                    ...(req.user.role === 'CLIENT' ? { clientId: req.user.id } : {}),
                },
                include: {
                    service: { select: { id: true, duration: true, active: true } },
                    professional: { select: { id: true, active: true } },
                },
            });

            if (!appointment) {
                return res.status(404).json({ error: 'Agendamento não encontrado' });
            }

            const isAdmin = req.user.role === 'ADMIN';
            if (req.body.status && !isAdmin && req.body.status !== 'CANCELLED') {
                return res.status(403).json({ error: 'Somente administradores podem alterar este status' });
            }
            if (req.body.status && ['CANCELLED', 'COMPLETED'].includes(appointment.status)) {
                return res.status(400).json({ error: 'Este agendamento já foi encerrado' });
            }
            if (req.body.date && !isAdmin && appointment.status !== 'PENDING') {
                return res.status(400).json({ error: 'Somente agendamentos pendentes podem ser remarcados' });
            }
            if (req.body.date && ['CANCELLED', 'COMPLETED'].includes(appointment.status)) {
                return res.status(400).json({ error: 'Agendamentos encerrados não podem ser alterados' });
            }

            const date = req.body.date ? new Date(req.body.date) : null;
            if (date) {
                if (date <= new Date()) {
                    return res.status(400).json({ error: 'O horário deve ser no futuro' });
                }
                if (!appointment.service.active || !appointment.professional.active) {
                    return res.status(400).json({
                        error: 'O serviço ou profissional está inativo e o agendamento não pode ser remarcado',
                    });
                }

                const company = await getCompanyHours(req.user.companyId);
                const professional = await prisma.user.findFirst({
                    where: {
                        id: appointment.professionalId,
                        companyId: req.user.companyId,
                        role: 'PROFISSIONAL',
                        active: true,
                    },
                    select: {
                        schedules: {
                            select: { dayOfWeek: true, startTime: true, endTime: true, available: true },
                        },
                    },
                });
                if (
                    !company
                    || !professional
                    || !isWithinAppointmentHours(date, appointment.service.duration, company, professional.schedules)
                ) {
                    return res.status(400).json({
                        error: 'O horário está fora do expediente, da disponibilidade do profissional ou em uma data fechada',
                    });
                }
                const updatedAppointment = await prisma.$transaction(async (transaction) => {
                    await lockProfessionalSchedule(
                        transaction,
                        req.user.companyId,
                        appointment.professionalId,
                    );
                    if (await findConflicts({
                        client: transaction,
                        companyId: req.user.companyId,
                        professionalId: appointment.professionalId,
                        date,
                        duration: appointment.service.duration,
                        excludedId: appointment.id,
                    })) {
                        return null;
                    }

                    return transaction.appointment.update({
                        where: { id: appointment.id },
                        data: { date },
                        select: { id: true },
                    });
                });
                if (!updatedAppointment) {
                    return res.status(409).json({ error: 'Este horário já está ocupado. Escolha outro.' });
                }

                const rescheduledAppointment = await prisma.appointment.findUnique({
                    where: { id: updatedAppointment.id },
                    select: appointmentSelect,
                });
                if (!rescheduledAppointment) {
                    throw new Error('Agendamento remarcado não foi encontrado');
                }
                return res.json(rescheduledAppointment);
            }

            const updatedAppointment = await prisma.appointment.update({
                where: { id: appointment.id },
                data: {
                    ...(req.body.status ? { status: req.body.status } : {}),
                },
                select: appointmentSelect,
            });
            return res.json(updatedAppointment);
        } catch (error) {
            console.error('Erro ao atualizar agendamento:', error);
            return res.status(500).json({ error: 'Erro ao atualizar agendamento' });
        }
    }
}

export default new AppointmentController();
