# Diretrizes para Agentes de IA — AprendaNave

> Última atualização: 2026-08-04 (pós-migração .NET → Hono e implementação do painel do criador)

## Objetivo do Projeto

Plataforma web de cursos gamificados voltada para jovens. Inspiração conceitual: Duolingo.

## Regras Gerais

- **Mobile-first** obrigatório.
- Interface simples, clara e orientada a gamificação.
- "Cursos" = "Trilhas" (termos intercambiáveis no código).
- Sempre responder em **português**.
- Formulários usam **Reactive Forms** (Angular).
- Contratos da API são idênticos aos do .NET original (camelCase + alguns PascalCase).

---

## Stack

| Camada | Tecnologia | Hospedagem |
|--------|-----------|------------|
| **Frontend** | Angular 18, TypeScript, SCSS, Signals | Vercel (`aprendanave.vercel.app`) |
| **Backend** | TypeScript + Hono (Node.js) + Prisma ORM | Railway (`aprendanave-api-production.up.railway.app`) |
| **Banco** | PostgreSQL | Supabase (free tier, `aws-1-sa-east-1.pooler.supabase.com`) |

> **Nota histórica:** O backend original era .NET 8 + Entity Framework Core (pasta `server/`, mantida apenas como referência). Foi migrado para Hono em 2026-08-04.

---

## Frontend (Angular 18)

### Arquitetura
- **Services:** toda lógica de negócio, chamadas HTTP, estado (Signals).
- **Componentes:** apenas lógica de apresentação. Templates sem lógica de negócio.
- **Componentes compartilhados** em `src/app/shared/components/`: `ButtonComponent`, `InputComponent`, `LoaderComponent`, `SubheaderComponent`, `ConfirmModalComponent`.
- **Guards:** `authGuard` protege rotas autenticadas (`src/app/guards/auth/`).
- **Interceptors:** `auth.cookie.interceptor.ts` — envia `withCredentials: true` nas requisições.

### UI/Design
- Ícones: Feather Icons ou Material Icons.
- Fonte: **Montserrat** (definida em `_variables.scss`).
- Cores: **exclusivamente** via variáveis CSS de `src/app/scss/_variables.scss`.
- Tema escuro (padrão) e claro (`dark-theme` / `light-theme`).
- Tamanhos de fonte base: h1=2.4rem, h2=2rem, h3=1.8rem, p=1.6rem.

### ⚠️ Escala de rem (CRÍTICO)
O root do projeto define **1rem = 10px**. Portanto:
- **Corpo de texto:** 1.6rem (= 16px, `$fonte-tamanho-p`)
- **Metadados/labels:** 1.4rem (= 14px)
- **Ícones em botões:** 1.6rem
- **NUNCA** usar hex hardcoded — sempre variáveis CSS de `_variables.scss`

### Rotas principais
| Rota | Componente | Auth? |
|------|-----------|-------|
| `/` | StartComponent | Não |
| `/login` | LoginComponent | Não |
| `/home` | HomeComponent | Sim |
| `/trilha/:id` | TrilhaComponent | Sim |
| `/modulo/:trilhaId/:moduloId` | ModuloComponent | Sim |
| `/aula/:cursoId/:moduloId/:aulaId` | AulaComponent | Sim |
| `/teste-final/:trilhaId/:moduloId` | QuizComponent | Sim |
| `/perfil` | PerfilComponent | Sim |
| `/curso/criar` | CriarCursoComponent | Sim |
| `/curso/:id/gerenciar` | GerenciarCursoComponent | Sim |
| `/meus-cursos` | MeusCursosComponent | Sim |
| `/admin` | AdminComponent | Sim |

### Serviços principais
| Serviço | Arquivo | Responsabilidade |
|---------|---------|-----------------|
| `AulaService` | `services/aula/aula.service.ts` | Progresso de aulas (dirty flag, server sync, localStorage cache) |
| `CursoService` | `services/curso/curso.service.ts` | CRUD cursos, módulos, aulas |
| `AuthService` | `services/auth/auth.service.ts` | Estado de autenticação |
| `LoginService` | `services/login/login.service.ts` | Login, logout, registro |
| `UserService` | `services/user/user.service.ts` | Dados do usuário logado |
| `ModuloService` | `services/modulo/modulo.service.ts` | Listagem de módulos |
| `MathGameService` | `services/math-game/math-game.service.ts` | Lógica de quiz (Fisher-Yates, geração de opções) |

---

## Backend (Hono + Prisma)

### Estrutura
```
api/
├── src/
│   ├── index.ts              # Entry point, CORS, mount de rotas
│   ├── routes/
│   │   ├── auth.ts           # /auth/*
│   │   ├── user.ts           # /user/*
│   │   ├── cursos.ts         # /cursos/*
│   │   ├── modulos.ts        # /modulos/*
│   │   ├── aulas.ts          # /aulas/*
│   │   ├── desafioJcc.ts     # /desafio/desafio-jcc/*
│   │   ├── ranking.ts        # /rankings/*
│   │   ├── guests.ts         # /guests/*
│   │   ├── admin.ts          # /admin/* (admin only)
│   │   └── conquistas.ts     # /conquistas/*
│   ├── middleware/
│   │   └── auth.ts           # JWT cookie, authRequired, adminRequired, isCursoOwner...
│   ├── lib/
│   │   ├── prisma.ts         # PrismaClient singleton
│   │   └── cloudinary.ts     # Cloudinary config
│   └── services/
│       └── conquistas.service.ts  # Verificação e desbloqueio de conquistas
├── prisma/
│   └── schema.prisma        # Schema do banco (10 tabelas)
├── package.json
├── tsconfig.json
├── .env                     # DATABASE_URL, PRIVATE_KEY, CLOUDINARY_URL (não commitado)
└── Procfile                 # Railway: web: node dist/index.js
```

### Endpoints da API

#### Auth
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/login` | Não | Login (cookie JWT), migração Argon2→bcrypt |
| POST | `/auth/logout` | Não | Limpa cookie |
| GET | `/auth/validate-token` | Não | Valida JWT no cookie |

#### User
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/user/` | Sim | Retorna userId do JWT |
| POST | `/user/` | Não | Cadastro (bcrypt hash) |
| GET | `/user/list?pagina=` | Não | Lista paginada (10/página) |
| GET | `/user/progresso` | Sim | Progresso consolidado (aulas + módulos) |
| PATCH | `/user/` | Sim | Atualizar nome/bio |
| PATCH | `/user/image` | Sim | Upload foto (Cloudinary) |

#### Cursos
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/cursos/aprovados?pagina=` | Não | Cursos aprovados (6/página) |
| GET | `/cursos/me` | Sim | Cursos do usuário |
| GET | `/cursos/:id` | Não | Curso por ID |
| POST | `/cursos/` | Sim | Criar curso (status: Pendente) |
| PUT | `/cursos/:id` | Sim (owner) | Editar curso |
| DELETE | `/cursos/:id` | Sim (owner) | Excluir curso (cascade) |
| GET | `/cursos/:id/modulos` | Opcional | Módulos (owner vê todos, outros só aprovados) |
| GET | `/cursos/:id/modulos/aprovados` | Não | Módulos aprovados |
| POST | `/cursos/:id/modulos` | Sim (owner) | Criar módulo |

#### Módulos
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/modulos/aprovados` | Não | Todos módulos aprovados |
| GET | `/modulos/:id/progresso` | Sim | Progresso do usuário no módulo |
| PUT | `/modulos/:id` | Sim (owner) | Editar módulo |
| DELETE | `/modulos/:id` | Sim (owner) | Excluir módulo (cascade) |
| GET | `/modulos/:id/aulas` | Opcional | Aulas (owner vê todas, outros só aprovadas) |
| GET | `/modulos/:id/aulas/aprovadas` | Não | Aulas aprovadas |
| POST | `/modulos/:id/aulas` | Sim (owner) | Criar aula |

#### Aulas
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/aulas/:id` | Não | Aula por ID |
| GET | `/aulas/progresso/:moduloId` | Sim | IDs das aulas concluídas |
| POST | `/aulas/:id/concluir` | Sim | Marcar concluída + upsert módulo + verificar conquistas |
| PUT | `/aulas/:id` | Sim (owner) | Editar aula |
| DELETE | `/aulas/:id` | Sim (owner) | Excluir aula |

#### Admin
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/admin/pendentes` | Admin | Lista pendentes (cursos, módulos, aulas) |
| PATCH | `/admin/cursos/:id/aprovar` | Admin | Aprovar curso |
| PATCH | `/admin/cursos/:id/rejeitar` | Admin | Rejeitar curso |
| PATCH | `/admin/modulos/:id/aprovar` | Admin | Aprovar módulo (exige curso aprovado) |
| PATCH | `/admin/modulos/:id/rejeitar` | Admin | Rejeitar módulo |
| PATCH | `/admin/aulas/:id/aprovar` | Admin | Aprovar aula (exige módulo aprovado) |
| PATCH | `/admin/aulas/:id/rejeitar` | Admin | Rejeitar aula |

#### Conquistas
| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/conquistas` | Sim | Lista todas com status de desbloqueio |

#### Outros
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/desafio/desafio-jcc/ranking` | Top 5 ranking JCC |
| GET | `/desafio/desafio-jcc/desafiantes` | Todos desafiantes JCC |
| PATCH | `/desafio/desafio-jcc/pontuacao` | Upsert pontuação JCC |
| GET | `/rankings/modalidade/ranking?modalidade=` | Top 5 por modalidade |
| GET | `/rankings/desafiantes?modalidade=` | Todos de uma modalidade |
| PATCH | `/rankings/pontuacao` | Upsert pontuação |
| GET/POST | `/guests` | CRUD visitantes |

### Autenticação
- **JWT** via cookie `access_token` (HttpOnly, Secure, SameSite=None).
- Cookie setado no login, limpo no logout.
- Middleware `authRequired`: lê cookie, verifica JWT, seta `userId` no context.
- Middleware `adminRequired`: verifica `cargo === 'Admin'`.
- Helpers: `isCursoOwner()`, `isModuloOwner()`, `isAulaOwner()`.

### Banco de Dados (Prisma)
- **Provider:** PostgreSQL (`DATABASE_URL` no `.env`)
- **Schema:** `api/prisma/schema.prisma` (gerado manualmente, NÃO usar `prisma db push`)
- **Tabelas:** `aluno`, `curso`, `modulo`, `aula`, `aluno_modulo_progresso`, `aluno_aula_progresso`, `ranking`, `desafio_jcc`, `guest_user`, `conquista`, `aluno_conquista`
- **Casing:** snake_case no banco, camelCase na API

### Progresso de Aulas (sistema de cache com dirty flag)
- **Fonte da verdade:** servidor (`aluno_aula_progresso`, `aluno_modulo_progresso`)
- **Cache local:** localStorage (`aulas-concluidas-{moduloId}`)
- **Dirty flag:** localStorage (`aulas-dirty-{moduloId}`)
  - Ao concluir aula: marca dirty
  - Ao carregar módulo: se dirty → busca servidor → limpa dirty; senão → usa cache
  - Sem cache (primeira visita): força dirty → busca servidor
- **Auto-upsert:** concluir aula → recalcula progresso do módulo (`CONCLUIDO`/`EM_ANDAMENTO`)

### Conquistas (Gamificação)
- **10 conquistas** definidas no banco (`conquista` table)
- Verificadas automaticamente ao concluir aula (`POST /aulas/:aulaId/concluir`)
- Tipos: `aulas_concluidas`, `modulo_concluido`, `modulos_concluidos`, `quiz_completo`, `quiz_perfeito`, `pontos_acumulados`, `conquistas_desbloqueadas`, `curso_aprovado`, `aulas_dia`, `curso_concluido`
- Cada conquista desbloqueada dá pontos ao usuário
- Frontend: página `/perfil` mostra todas dinamicamente (flag-red.svg = bloqueada, flag-green.svg = desbloqueada)

---

## Deploy

### Frontend (Vercel)
- Env var: `API_URL_PROD=https://aprendanave-api-production.up.railway.app`
- Build: `node scripts/replace-env.js && ng build --configuration production`
- Script substitui `localhost:5269` por `API_URL_PROD` no environment.prod.ts

### Backend (Railway)
- Root: `api/`
- Build: `npm install && npm run build` (prisma generate + tsup)
- Start: `node dist/index.js` (Procfile)
- Env vars: `DATABASE_URL`, `PRIVATE_KEY`, `CLOUDINARY_URL`, `PORT` (Railway auto)

### Dev Local
```bash
# Backend (porta 3000)
cd api && npm run dev

# Frontend (porta 4200)
cd Client && npm start

# Banco — usar Supabase direto (.env em api/)
```

---

## Funcionalidades Implementadas

1. ✅ Autenticação JWT (login, cadastro, logout)
2. ✅ CRUD de cursos, módulos e aulas (Painel do Criador)
3. ✅ Painel de Admin (aprovação/rejeição com validação hierárquica)
4. ✅ Progresso server-side com dirty flag (aulas e módulos)
5. ✅ Conquistas dinâmicas (10 conquistas, verificação automática)
6. ✅ Ranking e Desafio JCC
7. ✅ Upload de foto de perfil (Cloudinary)
8. ✅ Quiz de matemática (operações +, -, *, /)
9. ✅ Tema escuro/claro
10. ✅ Modo visitante (guest)
11. ✅ Migração de senhas Argon2 → bcrypt (transparente no login)
