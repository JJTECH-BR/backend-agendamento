import { jest } from '@jest/globals'; // Traz o motor do Jest para podermos controlar o teste
import request from 'supertest';      // Ferramenta que simula o 'Postman' ou 'Insomnia' para bater nas rotas
import express from 'express';        // O criador do nosso servidor web
import { mockDeep } from 'jest-mock-extended'; // Ferramenta para criar o Dublê (Mock) do Prisma

// 1. O DUBLÊ (Mock): Criamos um "ator" que vai fingir ser o banco de dados.
const prismaMock = mockDeep();

// 2. O SEQUESTRO: Antes do sistema ligar, avisamos o Node.js: 
// "Quando o sistema pedir o client.js (o banco real), entregue o prismaMock (o dublê)".
jest.unstable_mockModule('../../client.js', () => ({
    default: prismaMock,
}));

// 3. IMPORTAÇÃO DINÂMICA: Usamos o 'await import' para o sistema esperar 
// o sequestro do Prisma terminar ANTES de carregar as rotas. Se não fizer isso, dá erro!
const { default: routes } = await import('../../routes.js');

// 4. PREPARANDO O SERVIDOR: Montamos um servidor Express "fantasma" só para esse teste.
const app = express();
app.use(express.json()); // Ensina o servidor a entender dados no formato JSON
app.use(routes);         // Conecta as rotas do sistema ao nosso servidor fantasma

describe('Teste Unitário da rota POST /users', () => {

    // O FAXINEIRO: Limpa a memória do dublê antes de cada teste começar.
    // Assim, um teste antigo não atrapalha o próximo.
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Deve criar usuário sem tocar no banco de dados', async () => {

        // --- FASE 1: PREPARAR O DUBLÊ (Arrange) ---

        // A) Ensinamos o dublê a responder: "Esse email já existe no banco?" -> "Não (null)"
        prismaMock.user.findFirst.mockResolvedValue(null);
        prismaMock.user.findUnique.mockResolvedValue(null);

        // B) Ensinamos o dublê a devolver um usuário falso quando o sistema mandar criar
        prismaMock.user.create.mockResolvedValue({
            id: 'id-falso-123',
            name: 'Johny Mock'
        });

        // --- FASE 2: A AÇÃO (Act) ---

        // Usamos o Supertest para disparar os dados contra a nossa rota, como se fosse um cliente real
        const response = await request(app)
            .post('/users')
            .send({
                name: 'Johny Mock',
                email: 'teste@mock.com',
                password: '123',
                confirmPassword: '123',
                role: 'ADMIN',
                companyId: 'uuid-empresa-falsa-123'
            });

        // Dica de ouro para debugar: se não der status 201 (Criado com Sucesso), mostra o erro no terminal
        if (response.status !== 201) {
            console.log("Erro no Controller:", response.body);
        }

        // --- FASE 3: AS VERIFICAÇÕES (Assert) ---

        // Verificamos se a resposta da rota foi exatamente 201
        expect(response.status).toBe(201);

        // Verificamos se o dublê (Prisma) foi chamado exatamente 1 vez para criar o usuário
        expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    })
})