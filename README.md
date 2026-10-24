# 📅 API de Agendamento - Backend (JJ TECH)

🚧 **Status:** Em desenvolvimento (Work in Progress)...

Serviço de Back-end (API RESTful) projetado para gerenciar de ponta a ponta a regra de negócio de um sistema de agendamentos moderno. Desenvolvido sob a organização **JJTECH-BR**, a aplicação utiliza uma arquitetura escalável capaz de lidar com a gestão de empresas, perfis de usuários, catálogo de serviços e controle de horários.

### 📚 Documentação do Projeto

Toda a visão do sistema, regras de negócio (arquitetura SaaS Multi-tenant), histórias de usuário e fluxos de agendamento estão documentados detalhadamente no Notion.
👉 **[Acesse a Documentação Oficial do Projeto Aqui](https://harvest-handball-6ad.notion.site/Sistema-de-Agendamento-Plataforma-SaaS-JJ-TECH-2e5beba9022c807da1c2d5c56fd87caf?source=copy_link)**

---

### 🛠️ Tecnologias e Infraestrutura

A API foi construída com as ferramentas mais sólidas do ecossistema JavaScript moderno:

* **🟢 Node.js:** Ambiente de execução para rodar o JavaScript no servidor.
* **🚂 Express.js:** Framework principal para a criação das rotas e gerenciamento da API REST.
* **🗄️ PostgreSQL:** Banco de dados relacional robusto para armazenar as informações com segurança.
* **💎 Prisma ORM:** Ferramenta moderna para modelar as tabelas do banco e realizar consultas de forma simples e segura.
* **🔐 JWT (JSON Web Token):** Sistema de autenticação responsável por gerar os tokens (crachás virtuais) de acesso.
* **🔒 Bcryptjs:** Biblioteca de segurança responsável por criptografar as senhas antes de salvá-las no banco de dados.

---

### ✨ Arquitetura e Funcionalidades

* **Padrão MVC Otimizado:** Separação clara de responsabilidades com o uso de Controllers para manter as rotas limpas e a lógica de negócio isolada.
* **Módulo de Sintaxe Moderna:** Configurado para utilizar ES Modules (`import`/`export`) nativamente no Node.js.
* **Modelagem Relacional (Prisma ORM & PostgreSQL):** Histórico robusto de *migrations* (migrações de banco de dados) já implementadas, definindo os esquemas para:
  * Criação de Usuários.
  * Gestão de Empresas (Estúdios/Organizações).
  * Catálogo de Serviços.
  * Controle de Agendamentos.
* **Segurança de Dados:** Implementação de UUIDs (Identificadores Únicos Universais) para a identificação de registros sensíveis no banco e isolamento de informações.
* **Ecossistema JavaScript:** Desenvolvido puramente em JS. *(Nota técnica: O projeto contém um único arquivo `.ts` referente ao `prisma.config.ts`, adequando-se às exigências das novas atualizações do Prisma)*.

### 🏢 Perfil e conteúdo público da empresa

As rotas abaixo exigem autenticação e usam a empresa vinculada ao usuário autenticado. Apenas administradores podem alterar esses dados.

* `GET /company`: carrega nome, slug, contato, endereço, redes sociais, expediente, datas fechadas e conteúdo público da empresa autenticada.
* `PATCH /company`: persiste esses dados sem aceitar um `companyId` do cliente.
* `PATCH /company/password`: valida a senha atual e grava o hash da nova senha do administrador.
* `GET /public/companies/:slug`: fornece o conteúdo salvo, serviços com profissionais ativos e horários semanais da equipe ativa.

### 🧾 Serviços e equipe

As rotas abaixo exigem `Authorization: Bearer <token>` e restringem os registros à empresa associada ao usuário autenticado.

* `GET /services`: lista serviços da empresa, incluindo descrição, duração, preço, status e profissional associado.
* `POST /services`: cadastra um serviço com `name`, `description`, `price`, `duration` e `professionalId` de um profissional ativo da empresa.
* `PATCH /services/:id` e `DELETE /services/:id`: atualiza e exclui serviços do tenant autenticado. Se houver histórico, o DELETE desativa o serviço para preservar as referências.
* `GET /professionals`: lista a equipe da empresa, inclusive inativos, sem credenciais e com horários semanais.
* `POST /professionals`: cadastra um registro de equipe com `name`, `specialty`, `biography`, `profilePhoto` e `instagram`; profissional não recebe e-mail nem senha de acesso.
* `PATCH /professionals/:id` e `DELETE /professionals/:id`: atualiza, ativa/desativa ou exclui profissionais. Com histórico ou associações, o DELETE os arquiva como inativos.
* `POST /professionals/:id/schedules` e `DELETE /professionals/:id/schedules/:scheduleId`: grava ou remove a disponibilidade semanal (dia `0` a `6`, início, fim e disponibilidade).

Sem horários semanais próprios, o profissional usa o expediente da empresa em todos os dias da semana, exceto datas fechadas. Se houver qualquer horário próprio, somente os dias cadastrados e disponíveis são aceitos. Os intervalos individuais são limitados à interseção com o expediente da empresa. As horas de negócio usam o fuso `America/Sao_Paulo`.

### 📅 Agendamentos e autenticação

* `POST /appointments`: aceita somente clientes autenticados; valida tenant, serviço e profissional ativos, expediente, horário semanal, data fechada, futuro e conflitos. O preço corrente é copiado para o agendamento.
* `GET /appointments`: administradores recebem os registros da empresa; clientes recebem somente os próprios.
* `PATCH /appointments/:id`: clientes podem remarcar agendamentos pendentes e cancelar os próprios; confirmação/conclusão são operações administrativas. Remarcações repetem as validações de disponibilidade.
* `POST /sessions` autentica clientes e administradores. Registros `PROFISSIONAL` não são contas de acesso.
* `POST /users` cria apenas clientes. `POST /companies` exige a chave de cadastro configurada no ambiente.

### 🔧 Ambiente e banco de dados

1. Copie `.env.example` para `.env`, preencha `DATABASE_URL`, `APP_SECRET`, `ADMIN_SECRET` e as variáveis `POSTGRES_*` com valores locais seguros. Nunca versione `.env`.
2. O serviço PostgreSQL do Docker grava no volume nomeado `jjtech_data`. Para iniciar/reiniciar o serviço, configure `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB` no `.env` antes de executar `docker compose up -d database`. Não remova o volume.
3. Em desenvolvimento, aplique migrações aditivas com `npx prisma migrate dev`, confira com `npx prisma migrate status` e valide com `npx prisma validate`.
4. Configure as mesmas variáveis no gerenciador de segredos do ambiente de produção. Defina a URL do banco de produção e segredos novos pelo ambiente de deploy; não copie valores locais nem aplique migrações de produção a partir deste fluxo local.
5. A URL da API no front-end é `VITE_API_URL`. O front-end usa o fallback de desenvolvimento local quando ela não estiver definida.

### 💬 Histórico do chat

As rotas de chat exigem autenticação. Conversas são vinculadas à empresa e ao usuário autenticados; administradores podem consultar as conversas da empresa, enquanto outros usuários acessam apenas as próprias conversas. `metadata` aceita um objeto JSON para dados adicionais da interface, sem incluir senhas ou tokens.

* `POST /chat/conversations`: cria uma conversa com `title` e `metadata` opcionais; pode receber mensagens iniciais em `messages`.
* `GET /chat/conversations`: lista conversas acessíveis e a mensagem mais recente de cada uma.
* `GET /chat/conversations/:id`: retorna a conversa e todas as mensagens.
* `POST /chat/conversations/:id/messages`: grava uma nova mensagem com `role` (`user` ou `assistant`), `content` e `metadata` opcional.
