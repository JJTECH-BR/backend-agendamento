import { Router } from 'express';
import UserController from './controllers/userController.js';
import CompanyController from './controllers/CompanyController.js';
import SessionController from './controllers/sessionController.js'; // Importamos o controle de login

const routes = new Router();

// Rota de teste para ver se o servidor está on-line
routes.get('/', (req, res) => {
    return res.json({ message: 'Servidor rodando perfeitamente!' });
});

// ROTA DE LOGIN: É por aqui que o usuário recebe o seu "crachá" (Token)
// A Juliana vai usar essa rota no Front-end
routes.post('/sessions', SessionController.create);

// Rotas de Usuário
routes.post('/users', UserController.create);
routes.get('/users', UserController.index);

// Rotas de Empresa
routes.post('/companies', CompanyController.store);
routes.get('/companies', CompanyController.index);

export default routes;