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
