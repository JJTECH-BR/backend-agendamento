import { z } from 'zod';

const roles = ['CLIENT', 'ADMIN', 'PROFISSIONAL'];

export const createUserSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, 'Nome é obrigatório'),

    email: z.email({
        error: 'E-mail inválido',
    }),

    password: z
        .string()
        .min(6, 'A senha deve ter pelo menos 6 caracteres'),

    confirmPassword: z
        .string()
        .min(1, 'A confirmação da senha é obrigatória'),

    companyId: z
        .string()
        .trim()
        .min(1, 'Empresa é obrigatória'),

    role: z
        .enum(roles)
        .default('CLIENT'),

    adminKey: z
        .string()
        .optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
});