import { z } from 'zod';

export const createProfessionalSchema = z.object({
    name: z.string().trim().min(1, 'Nome é obrigatório'),
    specialty: z.string().trim().min(1, 'Especialidade é obrigatória'),
    biography: z.string().trim().nullable().optional(),
    profilePhoto: z.string().max(7_000_000).nullable().optional(),
    instagram: z.string().trim().max(30).nullable().optional(),
    active: z.boolean().default(true),
});

export const updateProfessionalSchema = createProfessionalSchema
    .extend({ active: z.boolean().optional() })
    .partial();

export const professionalScheduleSchema = z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido'),
    endTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido'),
    available: z.boolean().default(true),
}).refine((schedule) => schedule.startTime < schedule.endTime, {
    message: 'O horário final deve ser posterior ao horário inicial',
    path: ['endTime'],
});
