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
const clientId = '9845a503-5ea3-41be-aa89-f02b87397887';
const professionalId = '1b8e9b47-271a-4de1-a18b-aec6ee096a3d';
const serviceId = '15f53ed4-9085-462a-ab77-e59c441807c5';
const authHeader = (role = 'CLIENT') => {
    const token = jwt.sign(
        { id: role === 'CLIENT' ? clientId : 'admin-uuid', companyId, role },
        process.env.APP_SECRET,
    );
    return { Authorization: `Bearer ${token}` };
};

describe('Rotas de agendamentos', () => {
    beforeAll(() => {
        process.env.APP_SECRET = randomBytes(32).toString('hex');
    });

    beforeEach(() => {
        jest.clearAllMocks();
        prismaMock.$transaction.mockImplementation(async (callback) => callback(prismaMock));
        prismaMock.$queryRaw.mockResolvedValue([]);
        prismaMock.company.findUnique.mockResolvedValue({
            openingTime: '09:00',
            closingTime: '17:00',
            closedDates: [],
        });
    });

    it('cria agendamento associado ao cliente e à empresa autenticados', async () => {
        prismaMock.service.findFirst.mockResolvedValue({
            id: serviceId,
            professionalId,
            duration: 45,
            price: 40,
        });
        prismaMock.user.findFirst.mockResolvedValue({
            id: professionalId,
            schedules: [{ dayOfWeek: 3, startTime: '09:00', endTime: '17:00', available: true }],
        });
        prismaMock.appointment.findMany.mockResolvedValue([]);
        prismaMock.appointment.create.mockResolvedValue({
            id: '6ca0c90e-8b10-4ca4-ae4e-8cb282697e24',
            status: 'PENDING',
        });
        prismaMock.appointment.findUnique.mockResolvedValue({
            id: '6ca0c90e-8b10-4ca4-ae4e-8cb282697e24',
            status: 'PENDING',
        });

        const response = await request(app)
            .post('/appointments')
            .set(authHeader())
            .send({
                serviceId,
                professionalId,
                companyId: 'empresa-enviada-pelo-cliente',
                date: '2099-06-10T14:00:00.000Z',
            });

        expect(response.status).toBe(201);
        expect(prismaMock.appointment.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                status: 'PENDING',
                price: 40,
                clientId,
                professionalId,
                serviceId,
                companyId,
                date: new Date('2099-06-10T14:00:00.000Z'),
            }),
            select: expect.any(Object),
        }));
        expect(prismaMock.$queryRaw).toHaveBeenCalled();
    });

    it('recusa um horário ocupado antes de gravar o agendamento', async () => {
        prismaMock.service.findFirst.mockResolvedValue({
            id: serviceId,
            professionalId,
            duration: 45,
            price: 40,
        });
        prismaMock.user.findFirst.mockResolvedValue({
            id: professionalId,
            schedules: [{ dayOfWeek: 3, startTime: '09:00', endTime: '17:00', available: true }],
        });
        prismaMock.appointment.findMany.mockResolvedValue([{
            date: new Date('2099-06-10T14:15:00.000Z'),
            serviceId: 'existing-service',
        }]);
        prismaMock.service.findMany.mockResolvedValue([
            { id: 'existing-service', duration: 30 },
        ]);

        const response = await request(app)
            .post('/appointments')
            .set(authHeader())
            .send({
                serviceId,
                professionalId,
                date: '2099-06-10T14:00:00.000Z',
            });

        expect(response.status).toBe(409);
        expect(prismaMock.appointment.create).not.toHaveBeenCalled();
    });

    it('não permite que clientes consultem agendamentos de outros clientes', async () => {
        prismaMock.appointment.findMany.mockResolvedValue([]);

        const response = await request(app).get('/appointments').set(authHeader());

        expect(response.status).toBe(200);
        expect(prismaMock.appointment.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { companyId, clientId },
        }));
    });

    it('não permite que clientes atualizem agendamentos de outra empresa', async () => {
        prismaMock.appointment.findFirst.mockResolvedValue(null);

        const response = await request(app)
            .patch('/appointments/appointment-de-outra-empresa')
            .set(authHeader())
            .send({ status: 'CANCELLED' });

        expect(response.status).toBe(404);
        expect(prismaMock.appointment.findFirst).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ companyId, clientId }),
        }));
        expect(prismaMock.appointment.update).not.toHaveBeenCalled();
    });

    it('exige que remarcação e alteração de status sejam operações separadas', async () => {
        const response = await request(app)
            .patch('/appointments/appointment-id')
            .set(authHeader('ADMIN'))
            .send({
                date: '2099-06-10T14:00:00.000Z',
                status: 'CONFIRMED',
            });

        expect(response.status).toBe(400);
        expect(prismaMock.appointment.findFirst).not.toHaveBeenCalled();
    });

    it('não permite que um profissional acesse os agendamentos', async () => {
        const response = await request(app).get('/appointments').set(authHeader('PROFISSIONAL'));

        expect(response.status).toBe(401);
        expect(prismaMock.appointment.findMany).not.toHaveBeenCalled();
    });
});
