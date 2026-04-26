import 'dotenv/config';
import express from 'express';
import cors from 'cors'; // 1. Importamos o CORS (o porteiro que libera a entrada)
import routes from './routes.js';

const app = express();

// 2. Liberamos a API para ser acessada por outros endereços (como o front-end da Juliana)
app.use(cors());

app.use(express.json());

app.use(routes);

app.listen(3333, () => {
    console.log('🚀 Servidor rodando na porta 3333');
});