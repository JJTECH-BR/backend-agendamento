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
const professionalId = '1b8e9b47-271a-4de1-a18b-aec6ee096a3d';
const authHeader = (role = 'ADMIN') => ({
    Authorization: `Bearer ${jwt.sign(
        { id: 'user-id', companyId, role },
        process.env.APP_SECRET,
    )}`,
});

describe('Rotas de serviços e profissionais', () => {
    beforeAll(() => {
        process.env.APP_SECRET = randomBytes(32).toString('hex');
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('cria serviço vinculado a profissional ativo da empresa autenticada', async () => {
        prismaMock.user.findFirst.mockResolvedValue({ id: professionalId });
        prismaMock.service.create.mockResolvedValue({
            id: 'service-uuid',
            name: 'Manicure',
            companyId,
            professionalId,
            price: 40,
            duration: 45,
            active: true,
        });

        const response = await request(app)
            .post('/services')
            .set(authHeader())
            .send({
                name: 'Manicure',
                price: '40',
                duration: '45',
                professionalId,
            });

        expect(response.status).toBe(201);
        expect(prismaMock.user.findFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: professionalId, companyId, role: 'PROFISSIONAL', active: true },
        }));
        expect(prismaMock.service.create).toHaveBeenCalledWith(expect.objectContaining({
            data: {
                name: 'Manicure',
                price: 40,
                duration: 45,
                active: true,
                professionalId,
                companyId,
            },
        }));
    });

    it('rejeita serviço sem profissional válido e ativo', async () => {
        const response = await request(app)
            .post('/services')
            .set(authHeader())
            .send({ name: 'Manicure', price: 40, duration: 45 });

        expect(response.status).toBe(400);
        expect(prismaMock.service.create).not.toHaveBeenCalled();
    });

    it('não cria serviço associado a profissional inativo', async () => {
        prismaMock.user.findFirst.mockResolvedValue(null);

        const response = await request(app)
            .post('/services')
            .set(authHeader())
            .send({
                name: 'Manicure',
                price: 40,
                duration: 45,
                professionalId,
            });

        expect(response.status).toBe(400);
        expect(prismaMock.service.create).not.toHaveBeenCalled();
    });

    it('permite manter um profissional inativo já associado ao editar serviço', async () => {
        prismaMock.service.findFirst.mockResolvedValue({ id: 'service-uuid', professionalId });
        prismaMock.user.findFirst
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ id: professionalId });
        prismaMock.service.update.mockResolvedValue({
            id: 'service-uuid',
            name: 'Manicure atualizada',
            professionalId,
            active: true,
        });

        const response = await request(app)
            .patch('/services/service-uuid')
            .set(authHeader())
            .send({ name: 'Manicure atualizada', professionalId });

        expect(response.status).toBe(200);
        expect(prismaMock.service.update).toHaveBeenCalledWith(expect.objectContaining({
            data: { name: 'Manicure atualizada', professionalId },
        }));
    });

    it('lista serviços somente da empresa autenticada', async () => {
        prismaMock.service.findMany.mockResolvedValue([]);

        const response = await request(app).get('/services').set(authHeader());

        expect(response.status).toBe(200);
        expect(prismaMock.service.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { companyId },
        }));
    });

    it('impede clientes de acessar o catálogo administrativo', async () => {
        const response = await request(app).get('/services').set(authHeader('CLIENT'));

        expect(response.status).toBe(403);
        expect(prismaMock.service.findMany).not.toHaveBeenCalled();
    });

    it('cria profissional sem credenciais de acesso ou campos de tenant fornecidos pelo cliente', async () => {
        prismaMock.user.create.mockResolvedValue({
            id: professionalId,
            name: 'Ana',
            specialty: 'Nail designer',
            active: true,
            schedules: [],
        });

        const response = await request(app)
            .post('/professionals')
            .set(authHeader())
            .send({
                name: 'Ana',
                specialty: 'Nail designer',
                biography: 'Especialista em unhas',
                companyId: 'outra-empresa',
                role: 'ADMIN',
            });

        expect(response.status).toBe(201);
        expect(response.body).not.toHaveProperty('password');
        expect(response.body).not.toHaveProperty('email');
        expect(response.body).not.toHaveProperty('companyId');
        expect(prismaMock.user.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                role: 'PROFISSIONAL',
                companyId,
                email: null,
                password: null,
                specialty: 'Nail designer',
            }),
        }));
    });

    it('salva horário semanal no escopo do profissional e empresa autenticados', async () => {
        prismaMock.user.findFirst.mockResolvedValue({ id: professionalId });
        prismaMock.professionalSchedule.upsert.mockResolvedValue({
            id: 'schedule-uuid',
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '17:00',
            available: true,
        });

        const response = await request(app)
            .post(`/professionals/${professionalId}/schedules`)
            .set(authHeader())
            .send({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00', available: true });

        expect(response.status).toBe(200);
        expect(prismaMock.professionalSchedule.upsert).toHaveBeenCalledWith(expect.objectContaining({
            create: expect.objectContaining({ professionalId, dayOfWeek: 1 }),
        }));
    });

    it('valida horários semanais antes de persistir', async () => {
        const response = await request(app)
            .post(`/professionals/${professionalId}/schedules`)
            .set(authHeader())
            .send({ dayOfWeek: 7, startTime: '17:00', endTime: '09:00' });

        expect(response.status).toBe(400);
        expect(prismaMock.professionalSchedule.upsert).not.toHaveBeenCalled();
    });

    it('arquiva profissionais com histórico em vez de quebrar relacionamentos', async () => {
        prismaMock.user.findFirst.mockResolvedValue({ id: professionalId });
        prismaMock.appointment.count.mockResolvedValue(1);
        prismaMock.service.count.mockResolvedValue(0);
        prismaMock.chatConversation.count.mockResolvedValue(0);
        prismaMock.user.update.mockResolvedValue({ id: professionalId, active: false });

        const response = await request(app)
            .delete(`/professionals/${professionalId}`)
            .set(authHeader());

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ active: false, archived: true });
        expect(prismaMock.user.delete).not.toHaveBeenCalled();
    });

    it('bloqueia operações administrativas sem token', async () => {
        const response = await request(app).get('/professionals');

        expect(response.status).toBe(401);
    });
});
