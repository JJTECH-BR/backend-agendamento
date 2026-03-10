import express from 'express';

const app = express();

// Isso avisa ao nosso servidor que ele vai receber dados no formato JSON (que vamos mandar pelo Insomnia)
app.use(express.json());

// Uma rota de teste só para ver se tudo ligou certinho
app.get('/', (req, res) => {
    return res.json({ message: 'Servidor rodando!' });
});

// Ligar o servidor na porta 3333
app.listen(3333, () => {
    console.log('Servidor rodando na porta 3333');
});