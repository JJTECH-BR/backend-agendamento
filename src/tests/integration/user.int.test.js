import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import { randomBytes, randomUUID } from 'crypto';
import routes from '../../routes.js';
import prisma from '../../client.js';

process.env.APP_SECRET = randomBytes(32).toString('hex');
jest.setTimeout(30_000);

const app = express();
app.use(express.json({ limit: '8mb' }));
app.use(routes);

function localDateAfter(days) {
    const date = new Date(Date.now() + days * 24 * 60 * 60_000);
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const dayOfWeek = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
    }[values.weekday];

    return {
        date: `${values.year}-${values.month}-${values.day}`,
        dayOfWeek,
    };
}

describe('Fluxos HTTP integrados com PostgreSQL local', () => {
    let company;
    let admin;
    let professional;
    let service;

    afterAll(async () => {
        if (company) {
            await prisma.appointment.deleteMany({ where: { companyId: company.id } });
            if (professional) {
                await prisma.professionalSchedule.deleteMany({
                    where: { professionalId: professional.id },
                });
            }
            await prisma.service.deleteMany({ where: { companyId: company.id } });
            await prisma.user.deleteMany({ where: { companyId: company.id } });
            await prisma.company.delete({ where: { id: company.id } });
        }
        await prisma.$disconnect();
    });

    it('cria, consulta, edita, agenda e desativa registros sem tocar em dados preexistentes', async () => {
        const suffix = randomUUID();
        let slug;
        const adminPassword = randomBytes(24).toString('base64url');
        const newAdminPassword = randomBytes(24).toString('base64url');
        const clientPassword = randomBytes(24).toString('base64url');

        const companyResponse = await request(app).post('/companies').send({
            companyName: `Empresa API ${suffix}`,
            userName: 'Admin de integração',
            email: `admin-${suffix}@example.test`,
            password: adminPassword,
            adminKey: process.env.ADMIN_SECRET,
        });
        expect(companyResponse.status).toBe(201);
        slug = companyResponse.body.slug;
        company = await prisma.company.findUnique({
            where: { slug },
        });
        admin = { email: `admin-${suffix}@example.test` };
        expect(company).not.toBeNull();

        const client = { email: `cliente-${suffix}@example.test` };
        const clientResponse = await request(app).post('/users').send({
            name: 'Cliente de integração',
            email: client.email,
            password: clientPassword,
            confirmPassword: clientPassword,
            companyId: companyResponse.body.slug,
        });
        expect(clientResponse.status).toBe(201);
        expect(clientResponse.body).not.toHaveProperty('password');

        const adminLogin = await request(app).post('/sessions').send({
            email: admin.email,
            password: adminPassword,
            companyId: slug,
        });
        const clientLogin = await request(app).post('/sessions').send({
            email: client.email,
            password: clientPassword,
            companyId: slug,
        });
        expect(adminLogin.status).toBe(200);
        expect(clientLogin.status).toBe(200);
        expect(adminLogin.body.user).not.toHaveProperty('password');
        expect(clientLogin.body.user).not.toHaveProperty('password');
        const passwordChange = await request(app)
            .patch('/company/password')
            .set({ Authorization: `Bearer ${adminLogin.body.token}` })
            .send({ currentPassword: adminPassword, newPassword: newAdminPassword });
        expect(passwordChange.status).toBe(204);
        const oldPasswordLogin = await request(app).post('/sessions').send({
            email: admin.email,
            password: adminPassword,
            companyId: slug,
        });
        expect(oldPasswordLogin.status).toBe(401);
        const newPasswordLogin = await request(app).post('/sessions').send({
            email: admin.email,
            password: newAdminPassword,
            companyId: slug,
        });
        expect(newPasswordLogin.status).toBe(200);
        const adminAuth = { Authorization: `Bearer ${adminLogin.body.token}` };
        const clientAuth = { Authorization: `Bearer ${clientLogin.body.token}` };
        const closedDate = localDateAfter(90).date;

        const profileUpdate = await request(app)
            .patch('/company')
            .set(adminAuth)
            .send({
                name: `Empresa editada ${suffix}`,
                description: 'Descrição pública integrada',
                phone: '11999990000',
                address: 'Rua de Teste, 123',
                instagram: 'empresa_teste',
                instagramUrl: 'https://instagram.com/empresa_teste',
                openingTime: '09:00',
                closingTime: '17:00',
                closedDates: [closedDate],
                pageContent: { sobre: { title: 'Página integrada' } },
            });
        expect(profileUpdate.status).toBe(200);
        expect(profileUpdate.body.name).toBe(`Empresa editada ${suffix}`);
        expect(profileUpdate.body.closedDates).toContain(closedDate);

        const publicPage = await request(app).get(`/public/companies/${slug}`);
        expect(publicPage.status).toBe(200);
        expect(publicPage.body.pageContent.sobre.title).toBe('Página integrada');
        expect(publicPage.body.instagramUrl).toBe('https://instagram.com/empresa_teste');
        expect(publicPage.body.closedDates).toContain(closedDate);

        const professionalResponse = await request(app)
            .post('/professionals')
            .set(adminAuth)
            .send({
                name: `Profissional ${suffix}`,
                specialty: 'Integração',
                biography: 'Registro criado pelo teste HTTP',
                instagram: 'teste_integracao',
            });
        expect(professionalResponse.status).toBe(201);
        expect(professionalResponse.body).not.toHaveProperty('email');
        expect(professionalResponse.body).not.toHaveProperty('password');
        professional = professionalResponse.body;

        const target = localDateAfter(30);
        const scheduleResponse = await request(app)
            .post(`/professionals/${professional.id}/schedules`)
            .set(adminAuth)
            .send({
                dayOfWeek: target.dayOfWeek,
                startTime: '09:00',
                endTime: '17:00',
                available: true,
            });
        expect(scheduleResponse.status).toBe(200);

        const serviceResponse = await request(app)
            .post('/services')
            .set(adminAuth)
            .send({
                name: `Serviço ${suffix}`,
                description: 'Criado no teste integrado',
                price: 120,
                duration: 30,
                professionalId: professional.id,
            });
        expect(serviceResponse.status).toBe(201);
        service = serviceResponse.body;

        const activeCatalog = await request(app).get(`/public/companies/${slug}`);
        expect(activeCatalog.status).toBe(200);
        expect(activeCatalog.body.services).toHaveLength(1);
        expect(activeCatalog.body.users[0].schedules[0].dayOfWeek).toBe(target.dayOfWeek);

        const bookingDate = new Date(`${target.date}T10:00:00-03:00`);
        const appointmentResponse = await request(app)
            .post('/appointments')
            .set(clientAuth)
            .send({
                serviceId: service.id,
                professionalId: professional.id,
                date: bookingDate.toISOString(),
            });
        expect(appointmentResponse.status).toBe(201);
        expect(appointmentResponse.body.price).toBe(120);

        const duplicate = await request(app)
            .post('/appointments')
            .set(clientAuth)
            .send({
                serviceId: service.id,
                professionalId: professional.id,
                date: bookingDate.toISOString(),
            });
        expect(duplicate.status).toBe(409);

        const serviceUpdate = await request(app)
            .patch(`/services/${service.id}`)
            .set(adminAuth)
            .send({ price: 150 });
        expect(serviceUpdate.status).toBe(200);

        const clientAppointments = await request(app).get('/appointments').set(clientAuth);
        expect(clientAppointments.status).toBe(200);
        expect(clientAppointments.body).toHaveLength(1);
        expect(clientAppointments.body[0].price).toBe(120);
        const adminAppointments = await request(app).get('/appointments').set(adminAuth);
        expect(adminAppointments.status).toBe(200);
        expect(adminAppointments.body).toHaveLength(1);

        const forbiddenStatus = await request(app)
            .patch(`/appointments/${appointmentResponse.body.id}`)
            .set(clientAuth)
            .send({ status: 'CONFIRMED' });
        expect(forbiddenStatus.status).toBe(403);

        const rescheduledDate = new Date(`${localDateAfter(37).date}T11:00:00-03:00`);
        const reschedule = await request(app)
            .patch(`/appointments/${appointmentResponse.body.id}`)
            .set(clientAuth)
            .send({ date: rescheduledDate.toISOString() });
        expect(reschedule.status).toBe(200);

        const confirmation = await request(app)
            .patch(`/appointments/${appointmentResponse.body.id}`)
            .set(adminAuth)
            .send({ status: 'CONFIRMED' });
        expect(confirmation.status).toBe(200);

        const concurrentDate = new Date(`${localDateAfter(44).date}T13:00:00-03:00`);
        const concurrentBookings = await Promise.all([
            request(app)
                .post('/appointments')
                .set(clientAuth)
                .send({
                    serviceId: service.id,
                    professionalId: professional.id,
                    date: concurrentDate.toISOString(),
                }),
            request(app)
                .post('/appointments')
                .set(clientAuth)
                .send({
                    serviceId: service.id,
                    professionalId: professional.id,
                    date: concurrentDate.toISOString(),
                }),
        ]);
        expect(concurrentBookings.map(({ status }) => status).sort()).toEqual([201, 409]);
        const concurrentAppointment = concurrentBookings.find(({ status }) => status === 201).body;
        const cancellation = await request(app)
            .patch(`/appointments/${concurrentAppointment.id}`)
            .set(clientAuth)
            .send({ status: 'CANCELLED' });
        expect(cancellation.status).toBe(200);
        expect(cancellation.body.status).toBe('CANCELLED');
        const completion = await request(app)
            .patch(`/appointments/${appointmentResponse.body.id}`)
            .set(adminAuth)
            .send({ status: 'COMPLETED' });
        expect(completion.status).toBe(200);
        expect(completion.body.status).toBe('COMPLETED');

        const disableService = await request(app)
            .patch(`/services/${service.id}`)
            .set(adminAuth)
            .send({ active: false });
        expect(disableService.status).toBe(200);
        expect((await request(app).get(`/public/companies/${slug}`)).body.services).toHaveLength(0);
        const reactivateService = await request(app)
            .patch(`/services/${service.id}`)
            .set(adminAuth)
            .send({ active: true });
        expect(reactivateService.status).toBe(200);

        const deactivateProfessional = await request(app)
            .patch(`/professionals/${professional.id}`)
            .set(adminAuth)
            .send({ active: false });
        expect(deactivateProfessional.status).toBe(200);
        const hiddenCatalog = await request(app).get(`/public/companies/${slug}`);
        expect(hiddenCatalog.body.services).toHaveLength(0);
        expect(hiddenCatalog.body.users).toHaveLength(0);

        const reactivateProfessional = await request(app)
            .patch(`/professionals/${professional.id}`)
            .set(adminAuth)
            .send({ active: true });
        expect(reactivateProfessional.status).toBe(200);
        const adminProfessionals = await request(app).get('/professionals').set(adminAuth);
        expect(adminProfessionals.body.find((item) => item.id === professional.id).active).toBe(true);

        await request(app)
            .patch(`/professionals/${professional.id}`)
            .set(adminAuth)
            .send({ active: false });

        const removeSchedule = await request(app)
            .delete(`/professionals/${professional.id}/schedules/${scheduleResponse.body.id}`)
            .set(adminAuth);
        expect(removeSchedule.status).toBe(204);

        const archivedService = await request(app)
            .delete(`/services/${service.id}`)
            .set(adminAuth);
        expect(archivedService.status).toBe(200);
        expect(archivedService.body).toMatchObject({ archived: true, active: false });

        const archivedProfessional = await request(app)
            .delete(`/professionals/${professional.id}`)
            .set(adminAuth);
        expect(archivedProfessional.status).toBe(200);
        expect(archivedProfessional.body).toMatchObject({ archived: true, active: false });
    });
});
