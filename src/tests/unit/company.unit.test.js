import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
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
const authorization = (role = 'ADMIN') => ({
    Authorization: `Bearer ${jwt.sign(
        { id: 'user-id', companyId, role },
        process.env.APP_SECRET,
    )}`,
});

describe('Rotas de dados da empresa', () => {
    beforeAll(() => {
        process.env.APP_SECRET = randomBytes(32).toString('hex');
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('retorna somente os dados da empresa associada ao usuário autenticado', async () => {
        prismaMock.company.findUnique.mockResolvedValue({
            id: companyId,
            name: 'Studio Fernanda',
            slug: 'studio-fernanda',
            description: null,
            phone: null,
            address: null,
        });

        const response = await request(app).get('/company').set(authorization());

        expect(response.status).toBe(200);
        expect(prismaMock.company.findUnique).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: companyId },
        }));
    });

    it('salva os dados do perfil no escopo da empresa autenticada', async () => {
        prismaMock.company.findUnique.mockResolvedValue({
            openingTime: '09:00',
            closingTime: '17:00',
        });
        const updatedCompany = {
            id: companyId,
            name: 'Studio Fernanda',
            slug: 'studio-fernanda',
            description: 'Atendimento especializado.',
            heroTitle: 'Realce sua beleza',
            heroDescription: 'Agende com a nossa equipe.',
            phone: '11999990000',
            address: 'Rua Central, 10',
        };
        prismaMock.company.update.mockResolvedValue(updatedCompany);

        const response = await request(app)
            .patch('/company')
            .set(authorization())
            .send({
                name: updatedCompany.name,
                description: updatedCompany.description,
                heroTitle: updatedCompany.heroTitle,
                heroDescription: updatedCompany.heroDescription,
                phone: updatedCompany.phone,
                address: updatedCompany.address,
            });

        expect(response.status).toBe(200);
        expect(response.body).toEqual(updatedCompany);
        expect(prismaMock.company.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: companyId },
            data: {
                name: updatedCompany.name,
                description: updatedCompany.description,
                heroTitle: updatedCompany.heroTitle,
                heroDescription: updatedCompany.heroDescription,
                phone: updatedCompany.phone,
                address: updatedCompany.address,
            },
        }));
    });

    it('impede profissionais de alterar os dados da empresa', async () => {
        const response = await request(app)
            .patch('/company')
            .set(authorization('PROFISSIONAL'))
            .send({ name: 'Nome indevido' });

        expect(response.status).toBe(401);
        expect(prismaMock.company.update).not.toHaveBeenCalled();
    });

    it('retorna o conteúdo público salvo junto com o catálogo da empresa', async () => {
        prismaMock.company.findUnique
            .mockResolvedValueOnce({ id: companyId })
            .mockResolvedValueOnce({
            id: companyId,
            name: 'Studio Fernanda',
            slug: 'studio-fernanda',
            heroTitle: 'Realce sua beleza',
            heroDescription: 'Agende com a nossa equipe.',
            services: [],
            users: [],
            });

        const response = await request(app).get('/public/companies/studio-fernanda');

        expect(response.status).toBe(200);
        expect(response.body.heroTitle).toBe('Realce sua beleza');
        expect(prismaMock.company.findUnique).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: companyId },
            select: expect.objectContaining({
                heroTitle: true,
                heroDescription: true,
            }),
        }));
    });

    it('impede clientes de consultar as configurações administrativas da empresa', async () => {
        const response = await request(app).get('/company').set(authorization('CLIENT'));

        expect(response.status).toBe(403);
        expect(prismaMock.company.findUnique).not.toHaveBeenCalled();
    });

    it('altera a senha somente após validar a senha atual', async () => {
        const currentPassword = randomBytes(16).toString('hex');
        const newPassword = randomBytes(16).toString('hex');
        prismaMock.user.findFirst.mockResolvedValue({
            id: 'user-id',
            password: await bcryptjs.hash(currentPassword, 4),
        });
        prismaMock.user.update.mockResolvedValue({ id: 'user-id' });

        const response = await request(app)
            .patch('/company/password')
            .set(authorization())
            .send({
                currentPassword,
                newPassword,
            });

        expect(response.status).toBe(204);
        expect(prismaMock.user.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'user-id' },
            data: { password: expect.any(String) },
        }));
        expect(prismaMock.user.update.mock.calls[0][0].data.password).not.toBe(newPassword);
    });
});
