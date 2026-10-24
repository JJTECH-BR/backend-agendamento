import { z } from 'zod';

const metadataSchema = z.record(z.string(), z.json()).optional();

export const chatMessageSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1, 'Conteúdo da mensagem é obrigatório'),
    metadata: metadataSchema,
});

export const createChatConversationSchema = z.object({
    title: z.string().trim().min(1).optional(),
    metadata: metadataSchema,
    messages: z.array(chatMessageSchema).optional(),
});

export const createChatMessageSchema = chatMessageSchema;
