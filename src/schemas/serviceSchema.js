import { z } from 'zod';

export const createServiceSchema = z.object({
    name: z.string().trim().min(1, 'Nome é obrigatório'),
    description: z.string().trim().nullable().optional(),
    price: z.coerce.number().finite().nonnegative('Preço não pode ser negativo'),
    duration: z.coerce.number().int().min(1).max(1440, 'Duração não pode exceder 24 horas'),
    active: z.boolean().default(true),
    professionalId: z.uuid(),
});

export const updateServiceSchema = createServiceSchema
    .extend({ active: z.boolean().optional() })
    .partial();
