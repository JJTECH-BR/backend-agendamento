import { Router } from 'express';
import UserController from './controllers/userController.js';
import CompanyController from './controllers/CompanyController.js';
import SessionController from './controllers/sessionController.js'; // Importamos o controle de login
import authMiddleware from './middlewares/auth.js';
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

// --- FILTRO DE SEGURANÇA (O segurança na porta) ---

// Daqui para baixo, o segurança 'authMiddleware' vai exigir o Token (crachá)
// Se não tiver o token, ele não deixa o código passar para as linhas abaixo
routes.use(authMiddleware);

// --- ROTAS PROTEGIDAS (Quem já entrou na casa) ---

// Listagem: Só quem está logado pode ver a lista de usuários e empresas
routes.get('/users', UserController.index);
routes.get('/companies', CompanyController.index);

export default routes;