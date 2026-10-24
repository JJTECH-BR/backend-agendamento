import { z } from 'zod';

const horaSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Horário inválido');
const dataFechadaSchema = z.iso.date();
const secaoPublicaSchema = z.object({
    eyebrow: z.string().max(160).optional(),
    title: z.string().max(160).optional(),
    subtitle: z.string().max(160).optional(),
    description: z.string().max(2000).optional(),
    weekdayHours: z.string().max(160).optional(),
    saturdayHours: z.string().max(160).optional(),
    sundayHours: z.string().max(160).optional(),
});
const pageContentSchema = z.object({
    sobre: secaoPublicaSchema.optional(),
    servicos: secaoPublicaSchema.optional(),
    equipe: secaoPublicaSchema.optional(),
    rodape: secaoPublicaSchema.optional(),
});

export const updateCompanySchema = z.object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    heroTitle: z.string().trim().max(120).nullable().optional(),
    heroDescription: z.string().trim().max(500).nullable().optional(),
    phone: z.string().trim().max(40).nullable().optional(),
    address: z.string().trim().max(300).nullable().optional(),
    instagram: z.string().trim().max(30).nullable().optional(),
    instagramUrl: z.url().refine((value) => /^https?:\/\//i.test(value), {
        message: 'Informe um link HTTP ou HTTPS',
    }).nullable().optional(),
    openingTime: horaSchema.optional(),
    closingTime: horaSchema.optional(),
    closedDates: z.array(dataFechadaSchema).max(366).refine(
        (dates) => new Set(dates).size === dates.length,
        'As datas fechadas não podem se repetir',
    ).optional(),
    pageContent: pageContentSchema.nullable().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: 'Informe pelo menos um campo para atualizar',
});

export const createCompanySchema = z.object({
    companyName: z.string().trim().min(1).max(120),
    userName: z.string().trim().min(1).max(120),
    email: z.email(),
    password: z.string().min(8).max(128),
    adminKey: z.string().min(1),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
}).refine((data) => data.currentPassword !== data.newPassword, {
    message: 'A nova senha deve ser diferente da senha atual',
    path: ['newPassword'],
});
