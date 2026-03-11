import express from 'express';
import bcryptjs from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

// Isso avisa ao nosso servidor que ele vai receber dados no formato JSON (que vamos mandar pelo Insomnia)
app.use(express.json());

// Uma rota de teste só para ver se tudo ligou certinho
app.get('/', (req, res) => {
    return res.json({ message: 'Servidor rodando!' });
});

app.post('/users', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    // Verificamos se as senhas coincidem
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'As senhas não coincidem' });
    };


    // Verificamos se esse e-mail já existe no banco (A trava de segurança)
    const userExists = await prisma.user.findUnique({
        where: { email: email },
    });

    if (userExists) {
        return res.status(400).json({ error: 'Usuário já existe' });
    };

    const hashedPassword = await bcryptjs.hash(password, 8);

    //Criamos o usuário no banco de dados
    const user = await prisma.user.create({
        data: {
            name: name,
            email: email,
            password: hashedPassword,
        }
    });

    return res.status(201).json(user);
});

// Ligar o servidor na porta 3333
app.listen(3333, () => {
    console.log('Servidor rodando na porta 3333');
});