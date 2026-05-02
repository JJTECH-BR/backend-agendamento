import request from 'supertest'; // Ferramenta que simula o nosso cliente (Postman/Insomnia)
import express from 'express';   // O motor que cria o nosso servidor
import routes from '../../routes.js';
import prisma from '../../client.js'; // AQUI A MAGIA ACONTECE: Importamos o Prisma DE VERDADE!

// Montamos um servidor Express "fantasma" exclusivo para rodar esse teste
const app = express();
app.use(express.json());
app.use(routes);

describe('Teste de Integração da rota POST /users', () => {

    // 🧹 O FAXINEIRO (beforeAll): 
    // Roda UMA ÚNICA VEZ antes de todos os testes começarem.
    // É obrigatório limpar o banco de testes, senão os usuários salvos no teste de ontem 
    // vão dar erro de "E-mail já existe" no teste de hoje.
    beforeAll(async () => {
        await prisma.user.deleteMany();
        await prisma.company.deleteMany();
    });

    // 💡 APAGANDO A LUZ (afterAll):
    // Roda UMA ÚNICA VEZ depois que todos os testes terminam.
    // Ele desliga a conexão com o banco. Se esquecer isso, o terminal fica travado para sempre!
    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('Deve salvar o usuário de verdade no banco de testes', async () => {

        // --- FASE 1: O PREPARO (Arrange) ---

        // Como o banco está totalmente vazio (o faxineiro limpou), a gente precisa 
        // criar uma Empresa real lá dentro primeiro, senão o Usuário não tem a quem se vincular!
        const empresa = await prisma.company.create({
            data: {
                name: 'Empresa Teste de Integração',
                slug: 'empresa-teste-integracao'
            }
        });

        // --- FASE 2: A AÇÃO (Act) ---

        // Disparamos os dados contra a nossa rota real, usando o ID da empresa 
        // que o próprio banco acabou de gerar na linha de cima.
        const response = await request(app)
            .post('/users')
            .send({
                name: 'Johny Integração',
                email: 'integracao@teste.com',
                password: '123',
                confirmPassword: '123',
                role: 'ADMIN',
                companyId: empresa.id // Pegamos o ID dinâmico gerado pelo banco!
            });

        // Dica de debug: Se o teste falhar (não der 201), imprime o motivo no terminal
        // para a gente não precisar adivinhar qual regra do banco travou a gravação.
        if (response.status !== 201) {
            console.log("Erro no Teste de Integração:", response.body);
        }

        // --- FASE 3: A VERIFICAÇÃO (Assert) ---

        // Verificamos se a API devolveu o status de "Criado com Sucesso" (201)
        expect(response.status).toBe(201);

        // Verificamos se o banco de dados realmente criou um "id" para esse novo usuário
        expect(response.body).toHaveProperty('id');

        // Verificamos se o nome gravado no banco é exatamente o que a gente mandou
        expect(response.body.name).toBe('Johny Integração');
    });
});