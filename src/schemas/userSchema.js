import { z } from 'zod';

export const createUserSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Nome é obrigatório'),

    email: z.email({
        error: 'E-mail inválido',
    }),

    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),

    confirmPassword: z
        .string()
        .min(1, 'A confirmação da senha é obrigatória'),

    companyId: z
        .string()
        .trim()
        .min(1, 'Empresa é obrigatória'),

}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
});

export const createSessionSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
    companyId: z.string().trim().min(1).optional(),
});