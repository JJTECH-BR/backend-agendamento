import { Router } from 'express';
import UserController from './controllers/userController.js';
import CompanyController from './controllers/CompanyController.js';
import SessionController from './controllers/sessionController.js';
import authMiddleware from './middlewares/auth.js';
const routes = new Router();

// Rota de teste
routes.get('/', (req, res) => {
    return res.json({ message: 'Servidor rodando perfeitamente!' });
});

// --- ÁREA PÚBLICA ---
routes.post('/sessions', SessionController.create);
routes.post('/users', UserController.create);
routes.post('/companies', CompanyController.store);

// --- FILTRO DE SEGURANÇA ---
routes.use(authMiddleware);

// --- ROTAS PROTEGIDAS ---
routes.get('/users', UserController.index);
routes.get('/companies', CompanyController.index);

export default routes;