import 'dotenv/config';
import express from 'express';
import routes from './routes.js'; // Importamos o mapa de rotas que criamos

const app = express();

app.use(express.json());

// Avisamos ao Express para usar o nosso mapa de rotas
app.use(routes);

app.listen(3333, () => {
    console.log('🚀 Servidor rodando na porta 3333');
});