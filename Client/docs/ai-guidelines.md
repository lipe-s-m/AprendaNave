# Diretrizes para Agentes de IA

## Objetivo do Projeto

Criar uma plataforma web de Cursos de aprendizado gamificado voltada para jovens.

## Regras Gerais

- A aplicação DEVE seguir abordagem **mobile-first**.
- A interface DEVE ser simples, clara e orientada a gamificação.
- Referência conceitual: Duolingo (apenas como inspiração, não copiar layouts).
- Sempre Responda em português
- "Cursos" são as "trilhas", em alguns lugares o nome muda porém tudo é curso

## Frontend (Angular)

- Framework: Angular 18
- Linguagem: TypeScript
- Estilização: SCSS
- Gerenciamento de estado: Signals

### Arquitetura Frontend

- Toda lógica e regra de negócio DEVEM estar em **services**.
- Componentes DEVEM conter apenas lógica de apresentação.
- Templates HTML NÃO DEVEM conter lógica de negócio.
- Comunicação com backend DEVE ser feita exclusivamente via services.

### UI

- Ícones DEVEM ser Feather Icons ou Material Icons.
- Fonte padrão: Nunito.
- Cores DEVEM ser usadas exclusivamente a partir de `src/app/scss/_variables.scss`.

## Backend

- Plataforma: .NET 8
- Tipo: API REST separada do frontend.
- Arquitetura inspirada em Clean Architecture.
- Uso obrigatório de:
  - Injeção de Dependência
  - Services
  - DTOs
  - Interfaces

## Banco de Dados

- PostgreSQL (externo).
- O backend DEVE ser responsável por toda regra de acesso aos dados.

## Autenticação

- JWT.
- O frontend NÃO DEVE gerenciar identidade de usuário manualmente.
