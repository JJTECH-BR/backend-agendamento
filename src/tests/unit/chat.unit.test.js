import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { mockDeep } from 'jest-mock-extended';

const prismaMock = mockDeep();

jest.unstable_mockModule('../../client.js', () => ({
    default: prismaMock,
}));

const { default: routes } = await import('../../routes.js');
const app = express();
app.use(express.json());
app.use(routes);

const companyId = 'a85dfc20-8e8b-4d46-a2d1-8e5dc798438b';
const userId = '9845a503-5ea3-41be-aa89-f02b87397887';
const conversationId = '6ca0c90e-8b10-4ca4-ae4e-8cb282697e24';

const authHeader = (role = 'CLIENT', id = userId, authenticatedCompany = companyId) => {
    const token = jwt.sign(
        { id, companyId: authenticatedCompany, role },
        process.env.APP_SECRET,
    );
    return { Authorization: `Bearer ${token}` };
};

describe('Rotas de histórico do chat', () => {
    beforeAll(() => {
        process.env.APP_SECRET = randomBytes(32).toString('hex');
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('salva conversa, mensagens iniciais e metadados enviados pela interface', async () => {
        prismaMock.chatConversation.create.mockResolvedValue({
            id: conversationId,
            title: 'Agendamento',
            metadata: { source: 'web' },
            companyId,
            userId,
            messages: [{ role: 'user', content: 'Quero marcar um horário' }],
        });

        const response = await request(app)
            .post('/chat/conversations')
            .set(authHeader())
            .send({
                title: 'Agendamento',
                metadata: { source: 'web' },
                messages: [{
                    role: 'user',
                    content: 'Quero marcar um horário',
                    metadata: { page: '/servicos' },
                }],
            });

        expect(response.status).toBe(201);
        expect(prismaMock.chatConversation.create).toHaveBeenCalledWith({
            data: {
                title: 'Agendamento',
                metadata: { source: 'web' },
                companyId,
                userId,
                messages: {
                    create: [{
                        role: 'user',
                        content: 'Quero marcar um horário',
                        metadata: { page: '/servicos' },
                    }],
                },
            },
            include: { messages: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] } },
        });
    });

    it('lista apenas conversas do usuário autenticado', async () => {
        prismaMock.chatConversation.findMany.mockResolvedValue([]);

        const response = await request(app).get('/chat/conversations').set(authHeader());

        expect(response.status).toBe(200);
        expect(prismaMock.chatConversation.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { companyId, userId },
            orderBy: { updatedAt: 'desc' },
        }));
    });

    it('permite a administradores listar conversas da empresa toda', async () => {
        prismaMock.chatConversation.findMany.mockResolvedValue([]);

        const response = await request(app)
            .get('/chat/conversations')
            .set(authHeader('ADMIN', 'admin-user-id'));

        expect(response.status).toBe(200);
        expect(prismaMock.chatConversation.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { companyId },
        }));
    });

    it('não retorna nem grava mensagens em conversas de outros usuários', async () => {
        prismaMock.chatConversation.findFirst.mockResolvedValue(null);

        const response = await request(app)
            .post('/chat/conversations/' + conversationId + '/messages')
            .set(authHeader())
            .send({ role: 'user', content: 'Mensagem privada' });

        expect(response.status).toBe(404);
        expect(prismaMock.chatConversation.findFirst).toHaveBeenCalledWith({
            where: { id: conversationId, companyId, userId },
            select: { id: true },
        });
        expect(prismaMock.chatConversation.update).not.toHaveBeenCalled();
    });

    it('persiste nova mensagem e atualiza a conversa', async () => {
        prismaMock.chatConversation.findFirst.mockResolvedValue({ id: conversationId });
        prismaMock.chatConversation.update.mockResolvedValue({
            id: conversationId,
            messages: [{ role: 'assistant', content: 'Posso ajudar.' }],
        });

        const response = await request(app)
            .post('/chat/conversations/' + conversationId + '/messages')
            .set(authHeader())
            .send({
                role: 'assistant',
                content: 'Posso ajudar.',
                metadata: { model: 'chat-ui' },
            });

        expect(response.status).toBe(201);
        expect(prismaMock.chatConversation.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: conversationId },
            data: {
                updatedAt: expect.any(Date),
                messages: {
                    create: {
                        role: 'assistant',
                        content: 'Posso ajudar.',
                        metadata: { model: 'chat-ui' },
                    },
                },
            },
        }));
    });
});
