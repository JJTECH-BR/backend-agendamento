import { Router } from 'express';
import UserController from './controllers/userController.js';
import CompanyController from './controllers/CompanyController.js';
import SessionController from './controllers/sessionController.js';
import ServiceController from './controllers/ServiceController.js';
import ProfessionalController from './controllers/ProfessionalController.js';
import AppointmentController from './controllers/AppointmentController.js';
import ChatController from './controllers/ChatController.js';
import authMiddleware, { requireAdmin } from './middlewares/auth.js';
import validate from './middlewares/validate.js';
import { createSessionSchema, createUserSchema } from './schemas/userSchema.js';
import { createServiceSchema, updateServiceSchema } from './schemas/serviceSchema.js';
import {
    createProfessionalSchema,
    professionalScheduleSchema,
    updateProfessionalSchema,
} from './schemas/professionalSchema.js';
import { createAppointmentSchema, updateAppointmentSchema } from './schemas/appointmentSchema.js';
import { createChatConversationSchema, createChatMessageSchema } from './schemas/chatSchema.js';
import {
    changePasswordSchema,
    createCompanySchema,
    updateCompanySchema,
} from './schemas/companySchema.js';
const routes = new Router();

// Rota de teste
routes.get('/', (req, res) => {
    return res.json({ message: 'Servidor rodando perfeitamente!' });
});

// --- ÁREA PÚBLICA ---
routes.post('/sessions', validate(createSessionSchema), SessionController.store);
routes.post('/users', validate(createUserSchema), UserController.create);
routes.post('/companies', validate(createCompanySchema), CompanyController.store);
routes.get('/public/companies/:slug', CompanyController.showPublic);

// --- FILTRO DE SEGURANÇA ---
routes.use(authMiddleware);

// --- ROTAS PROTEGIDAS ---
routes.get('/users', requireAdmin, UserController.index);
routes.get('/companies', requireAdmin, CompanyController.index);
routes.get('/company', requireAdmin, CompanyController.show);
routes.patch('/company', requireAdmin, validate(updateCompanySchema), CompanyController.update);
routes.patch('/company/password', requireAdmin, validate(changePasswordSchema), CompanyController.changePassword);
routes.post('/services', requireAdmin, validate(createServiceSchema), ServiceController.store);
routes.get('/services', requireAdmin, ServiceController.index);
routes.patch('/services/:id', requireAdmin, validate(updateServiceSchema), ServiceController.update);
routes.delete('/services/:id', requireAdmin, ServiceController.delete);
routes.post('/professionals', requireAdmin, validate(createProfessionalSchema), ProfessionalController.store);
routes.get('/professionals', requireAdmin, ProfessionalController.index);
routes.patch('/professionals/:id', requireAdmin, validate(updateProfessionalSchema), ProfessionalController.update);
routes.delete('/professionals/:id', requireAdmin, ProfessionalController.delete);
routes.post(
    '/professionals/:id/schedules',
    requireAdmin,
    validate(professionalScheduleSchema),
    ProfessionalController.saveSchedule,
);
routes.delete('/professionals/:id/schedules/:scheduleId', requireAdmin, ProfessionalController.deleteSchedule);
routes.post('/appointments', validate(createAppointmentSchema), AppointmentController.store);
routes.get('/appointments', AppointmentController.index);
routes.patch('/appointments/:id', validate(updateAppointmentSchema), AppointmentController.update);
routes.post('/chat/conversations', validate(createChatConversationSchema), ChatController.createConversation);
routes.get('/chat/conversations', ChatController.index);
routes.get('/chat/conversations/:id', ChatController.show);
routes.post(
    '/chat/conversations/:id/messages',
    validate(createChatMessageSchema),
    ChatController.createMessage,
);

export default routes;