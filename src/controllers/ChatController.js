import prisma from '../client.js';

const messageOrder = [{ createdAt: 'asc' }, { id: 'asc' }];

function conversationScope(user) {
    return {
        companyId: user.companyId,
        ...(user.role === 'ADMIN' ? {} : { userId: user.id }),
    };
}

class ChatController {
    async createConversation(req, res) {
        try {
            const { title, metadata, messages } = req.body;
            const conversation = await prisma.chatConversation.create({
                data: {
                    title,
                    metadata,
                    companyId: req.user.companyId,
                    userId: req.user.id,
                    ...(messages ? {
                        messages: {
                            create: messages.map(({ role, content, metadata: messageMetadata }) => ({
                                role,
                                content,
                                metadata: messageMetadata,
                            })),
                        },
                    } : {}),
                },
                include: {
                    messages: { orderBy: messageOrder },
                },
            });

            return res.status(201).json(conversation);
        } catch (error) {
            console.error('Erro ao salvar conversa:', error);
            return res.status(500).json({ error: 'Erro ao salvar conversa' });
        }
    }

    async index(req, res) {
        try {
            const conversations = await prisma.chatConversation.findMany({
                where: conversationScope(req.user),
                orderBy: { updatedAt: 'desc' },
                include: {
                    messages: {
                        take: 1,
                        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                    },
                },
            });

            return res.json(conversations);
        } catch (error) {
            console.error('Erro ao listar conversas:', error);
            return res.status(500).json({ error: 'Erro ao listar conversas' });
        }
    }

    async show(req, res) {
        try {
            const conversation = await prisma.chatConversation.findFirst({
                where: {
                    id: req.params.id,
                    ...conversationScope(req.user),
                },
                include: {
                    messages: { orderBy: messageOrder },
                },
            });

            if (!conversation) {
                return res.status(404).json({ error: 'Conversa não encontrada' });
            }

            return res.json(conversation);
        } catch (error) {
            console.error('Erro ao buscar conversa:', error);
            return res.status(500).json({ error: 'Erro ao buscar conversa' });
        }
    }

    async createMessage(req, res) {
        try {
            const conversation = await prisma.chatConversation.findFirst({
                where: {
                    id: req.params.id,
                    ...conversationScope(req.user),
                },
                select: { id: true },
            });

            if (!conversation) {
                return res.status(404).json({ error: 'Conversa não encontrada' });
            }

            const updatedConversation = await prisma.chatConversation.update({
                where: { id: conversation.id },
                data: {
                    updatedAt: new Date(),
                    messages: { create: req.body },
                },
                include: {
                    messages: { orderBy: messageOrder },
                },
            });

            return res.status(201).json(updatedConversation);
        } catch (error) {
            console.error('Erro ao salvar mensagem:', error);
            return res.status(500).json({ error: 'Erro ao salvar mensagem' });
        }
    }
}

export default new ChatController();
