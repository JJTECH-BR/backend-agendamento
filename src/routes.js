import { Router } from 'express'; // Puxamos só a ferramenta de rotas do Express
import UserController from './controllers/userController.js'; // Importamos o nosso especialista
import CompanyController from './controllers/CompanyController.js';



const routes = new Router();

// A nossa rota de teste de saúde do servidor
routes.get('/', (req, res) => {
    return res.json({ message: 'Servidor rodando perfeitamente!' });
});

// A ROTA DE CADASTRO: Olha como fica limpa! 
// Quando bater um POST no /users, ele chama a função 'create' do UserController
routes.post('/users', UserController.create);

routes.get('/users', UserController.index);

// Rota para criar a empresa (Onde você vai gerar o ID oficial)
routes.post('/companies', CompanyController.store);

// Rota para listar as empresas (Para você consultar o ID depois)
routes.get('/companies', CompanyController.index);

// Exportamos o mapa de rotas
export default routes;