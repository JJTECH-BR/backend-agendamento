import { Router } from 'express'; // Puxamos só a ferramenta de rotas do Express
import UserController from './controllers/userController.js'; // Importamos o nosso especialista

const routes = new Router();

// A nossa rota de teste de saúde do servidor
routes.get('/', (req, res) => {
    return res.json({ message: 'Servidor rodando perfeitamente!' });
});

// A ROTA DE CADASTRO: Olha como fica limpa! 
// Quando bater um POST no /users, ele chama a função 'create' do UserController
routes.post('/users', UserController.create);

// Exportamos o mapa de rotas
export default routes;