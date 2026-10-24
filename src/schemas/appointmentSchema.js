import { z } from 'zod';

export const createAppointmentSchema = z.object({
    serviceId: z.uuid(),
    professionalId: z.uuid().optional(),
    date: z.iso.datetime({ offset: true }),
});

export const updateAppointmentSchema = z.object({
    date: z.iso.datetime({ offset: true }).optional(),
    status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: 'Informe pelo menos um campo para atualizar',
}).refine((data) => !(data.date && data.status), {
    message: 'Atualize a data e o status em operações separadas',
});
