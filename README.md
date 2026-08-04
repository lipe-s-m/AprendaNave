# AprendaNave

Plataforma web de aprendizado gamificado voltada para jovens. Inspirada no conceito do Duolingo, permite que usuários naveguem por cursos organizados em módulos e aulas (vídeos do YouTube), acumulem pontos ("Navecoins"), participem de desafios matemáticos com ranking e acompanhem seu progresso.

---

## Arquitetura Geral

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    Frontend       │       │    Backend        │       │    Banco de      │
│    Angular 18     │──────▶│    .NET 8         │──────▶│    Dados         │
│    (Vercel)       │  API  │    Minimal API    │  EF   │    PostgreSQL    │
│                   │◀──────│    (Azure)        │◀──────│    (Supabase)    │
└──────────────────┘  REST  └──────────────────┘ Core  └──────────────────┘
                                    │
                                    ▼
                            ┌──────────────────┐
                            │   Cloudinary      │
                            │   (Imagens)       │
                            └──────────────────┘
```

| Camada     | Tecnologia                    | Hospedagem        |
|------------|-------------------------------|-------------------|
| Frontend   | Angular 18, TypeScript, SCSS  | Vercel            |
| Backend    | .NET 8, Minimal API, EF Core  | Azure App Service |
| Banco      | PostgreSQL                    | Supabase          |
| Imagens    | Cloudinary                    | Cloudinary CDN    |

---

## Frontend (Angular)

### Stack

- **Angular 18.2** com standalone components (sem NgModules)
- **TypeScript 5.5**, RxJS 7.8
- **Angular Material 18** (spinner de loading)
- **SCSS** com CSS custom properties (temas dark/light)
- **ngx-toastr** para notificacoes
- **Fonte**: Nunito
- **Icons**: Feather Icons / Material Icons

### Estrutura de Pastas

```
Client/src/app/
├── data/                  # Dados mock (cursos, trilhas)
├── guards/auth/           # Guard de autenticacao (authGuard)
├── layout/header/         # Header component
├── models/                # Modelos TypeScript (Curso, Trilha)
├── pages/                 # Paginas da aplicacao
│   ├── aprendabot/        # Tutor IA (stub, nao implementado)
│   ├── aula/              # Player de aula (embed YouTube)
│   ├── criar-curso/       # Formulario de criacao de curso
│   ├── desafio-jcc/       # Lobby do desafio JCC (ranking + guest)
│   ├── desafio-matematica/# Jogo de matematica (endless)
│   ├── home/              # Dashboard principal (lista cursos)
│   ├── hub/               # Landing alternativa
│   ├── login/             # Login + cadastro
│   ├── meus-cursos/       # Cursos criados pelo usuario
│   ├── modulo/            # Detalhe do modulo (lista aulas)
│   ├── perfil/            # Perfil do usuario
│   ├── quiz/              # Quiz final do modulo (10 questoes)
│   ├── start/             # Landing page inicial
│   └── trilha/            # Detalhe do curso (lista modulos)
├── scss/                  # Variaveis SCSS globais
├── services/              # Services (logica de negocio + HTTP)
│   ├── auth/              # AuthService + CookieInterceptor
│   ├── aula/              # AulaService
│   ├── curso/             # CursoService
│   ├── desafio-jcc/       # DesafioJccService
│   ├── login/             # LoginService
│   ├── modulo/            # ModuloService
│   ├── navigation-state/  # NavigationStateService (signals)
│   ├── quiz/              # QuizService
│   ├── theme/             # ThemeService (dark/light)
│   └── user/              # UserService (signal + localStorage)
└── shared/
    ├── components/        # Button, Input, Loader, Subheader, ModalEditarPerfil
    └── interfaces/        # Interfaces TypeScript
```

### Rotas Principais

| Rota                                   | Componente               | Auth |
|----------------------------------------|--------------------------|------|
| `/`                                    | StartComponent           | Nao  |
| `/login`                               | LoginComponent           | Nao  |
| `/home`                                | HomeComponent            | Sim  |
| `/hub`                                 | HubComponent             | Sim  |
| `/perfil`                              | PerfilComponent          | Sim  |
| `/trilha/:id`                          | TrilhaComponent          | Sim  |
| `/modulo/:trilhaId/:moduloId`          | ModuloComponent          | Sim  |
| `/aula/:cursoId/:moduloId/:aulaId`     | AulaComponent            | Sim  |
| `/teste-final/:trilhaId/:moduloId`     | QuizComponent            | Sim  |
| `/curso/criar`                         | CriarCursoComponent      | Sim  |
| `/meus-cursos`                         | MeusCursosComponent      | Sim  |
| `/desafiojcc`                          | DesafioJccComponent      | Nao  |
| `/desafio-matematica`                  | DesafioMatematicaComponent | Nao |
| `/aprendabot`                          | AprendabotComponent      | Sim  |

### Autenticacao

- Token JWT armazenado em **cookie HttpOnly** (nao localStorage)
- `CookieInterceptor` adiciona `withCredentials: true` a todas as requests
- `APP_INITIALIZER` verifica estado de autenticacao no bootstrap da app
- `authGuard` protege rotas que exigem login

### Temas

Dois temas com CSS custom properties: `dark-theme` (padrao, estilo espacial com tons de azul/roxo) e `light-theme`. Toggle disponivel no subheader.

---

## Backend (.NET 8)

### Stack

- **.NET 8** Minimal API (sem Controllers)
- **Entity Framework Core 8** com Npgsql (PostgreSQL)
- **Argon2** para hash de senhas (Isopoh.Cryptography.Argon2)
- **JWT Bearer** para autenticacao (token via cookie HttpOnly)
- **Cloudinary** para upload de imagens de perfil
- **Swagger/OpenAPI** em desenvolvimento

### Arquitetura

Inspirada em Clean Architecture:

```
server/server/
├── Configurations/         # Opcoes de hash de senha
├── Domain/
│   ├── DTOs/               # Data Transfer Objects
│   ├── Entities/           # Entidades do dominio
│   ├── Exceptions/         # Excecoes customizadas
│   ├── Interfaces/         # Contratos dos services
│   └── Services/           # Implementacao da logica de negocio
├── Endpoints/              # Minimal API endpoints (por dominio)
│   ├── Auth/
│   ├── Aulas/
│   ├── Cursos/
│   ├── Modulos/
│   └── User/
├── Migrations/             # EF Core migrations
├── Repository/Database/    # DbContext
├── Settings/               # Configuration, DatabaseSettings
└── Program.cs              # Composicao e pipeline
```

### Entidades

| Entidade               | Descricao                                         |
|------------------------|----------------------------------------------------|
| `Aluno`                | Usuario/aluno (nome, email, senha Argon2, cargo, pontos, bio, foto) |
| `Curso`                | Curso/trilha (nome, logo, autor, descricao, status de aprovacao) |
| `Modulo`               | Modulo de um curso (nome, ordem, nivel, qtd aulas/horas, playlist) |
| `Aula`                 | Aula de um modulo (titulo, ordem, videoYoutubeId, duracao) |
| `AlunoModuloProgresso` | Progresso do aluno em um modulo (NaoIniciado/EmAndamento/Concluido) |
| `AlunoAulaProgresso`   | Registro de aula concluida por aluno |
| `Ranking`              | Pontuacao por modalidade (generico, multiuso) |
| `DesafioJcc`           | Pontuacao do desafio JCC especifico |
| `GuestUser`            | Visitante/lead (nome + contato) |

Todas as entidades com `IAuditableEntity` tem `CreatedAt` e `LastUpdatedAt` automaticos.

### Endpoints da API

#### Auth (`/auth`)
| Metodo | Rota                  | Descricao                                          |
|--------|-----------------------|----------------------------------------------------|
| POST   | `/auth/login`         | Login com email/senha, retorna cookie JWT (2h)     |
| GET    | `/auth/validate-token`| Valida se o cookie JWT ainda e valido              |

#### User (`/user`)
| Metodo | Rota                       | Auth | Descricao                              |
|--------|----------------------------|------|----------------------------------------|
| GET    | `/user/`                   | -    | Retorna ID do usuario autenticado      |
| POST   | `/user/`                   | Nao  | Cadastra novo aluno                    |
| GET    | `/user/list`               | -    | Lista todos os alunos (paginado, 10/p) |
| PATCH  | `/user/`                   | Sim  | Atualiza nome e/ou bio                 |
| PATCH  | `/user/image`              | Sim  | Upload foto de perfil (Cloudinary)     |

#### Cursos (`/cursos`)
| Metodo | Rota                             | Auth | Descricao                              |
|--------|----------------------------------|------|----------------------------------------|
| GET    | `/cursos/aprovados`              | Nao  | Lista cursos aprovados (paginado, 6/p) |
| POST   | `/cursos/`                       | Sim  | Cria novo curso (status: Pendente)     |
| GET    | `/cursos/{id}/modulos/aprovados` | Nao  | Lista modulos aprovados de um curso    |
| POST   | `/cursos/{id}/modulos`           | -    | Cria modulo em um curso                |
| GET    | `/cursos/me`                     | Sim  | Cursos criados pelo usuario autenticado|

#### Modulos (`/modulos`)
| Metodo | Rota                              | Descricao                               |
|--------|-----------------------------------|-----------------------------------------|
| GET    | `/modulos/aprovados`              | Todos os modulos aprovados              |
| GET    | `/modulos/{id}/aulas/aprovadas`   | Aulas aprovadas de um modulo            |
| POST   | `/modulos/{id}/aulas`             | Cria nova aula em um modulo             |

#### Aulas (`/aulas`)
| Metodo | Rota              | Descricao                    |
|--------|--------------------|------------------------------|
| GET    | `/aulas/{aulaId}` | Retorna uma aula por ID      |

#### Desafio JCC (`/desafio/desafio-jcc`)
| Metodo | Rota                                  | Descricao                           |
|--------|---------------------------------------|-------------------------------------|
| GET    | `/desafio/desafio-jcc/ranking`        | Top 5 do ranking JCC               |
| GET    | `/desafio/desafio-jcc/desafiantes`    | Todos os participantes com pontos   |
| PATCH  | `/desafio/desafio-jcc/pontuacao`      | Upsert da pontuacao de um aluno     |

#### Ranking (`/rankings`)
| Metodo | Rota                              | Descricao                                  |
|--------|-----------------------------------|--------------------------------------------|
| GET    | `/rankings/modalidade/ranking`    | Top 5 por modalidade (query param)         |
| GET    | `/rankings/desafiantes`           | Todos os participantes de uma modalidade   |
| PATCH  | `/rankings/pontuacao`             | Upsert de pontuacao por modalidade         |

#### Visitantes (`/guests`)
| Metodo | Rota       | Descricao                        |
|--------|------------|----------------------------------|
| POST   | `/guests`  | Registra visitante (lead capture)|
| GET    | `/guests`  | Lista todos os visitantes        |

### Fluxo de Aprovacao de Conteudo

Cursos, modulos e aulas usam o enum `StatusAprovacao` (`Pendente`, `Aprovado`, `Rejeitado`). Conteudo criado por usuarios comeca como `Pendente` e so aparece publicamente quando `Aprovado`. Atualmente nao ha endpoint de admin para aprovar -- isso e feito diretamente no banco.

---

## Gamificacao

### Navecoins
Moeda virtual da plataforma. Ganhos ao completar o quiz final de um modulo:
- 7 acertos: 1000 / dificuldade
- 8-9 acertos: 1500 / dificuldade
- 10 acertos: 2000 / dificuldade

Niveis de dificuldade: Facil (20s), Medio (10s), Dificil (5s) por questao.

### Desafio Matematico (Desafio JCC)
- Jogo endless de matematica acessivel sem login
- Dificuldade progressiva: +/- nas primeiras questoes, depois multiplicacao e divisao
- Um erro encerra a rodada
- Ranking publico com top 5
- Suporta usuarios registrados e visitantes (guest)

### Conquistas
Atualmente hardcoded no perfil (3 conquistas, apenas uma funcional: "Explorador de Trilha"). Nao e dinamico.

### Progresso
- Progresso de aulas salvo no `localStorage` por modulo
- 100% de conclusao de aulas desbloqueia o quiz final do modulo
- Tabela `AlunoModuloProgresso` no backend (NaoIniciado/EmAndamento/Concluido)

---

## Banco de Dados (Supabase / PostgreSQL)

### Tabelas (via EF Core Migrations, snake_case)
- `alunos` - usuarios
- `cursos` - cursos/trilhas
- `modulos` - modulos de cada curso
- `aulas` - aulas de cada modulo
- `progresso` - AlunoModuloProgresso (PK composta: id_aluno + id_modulo)
- `aula_progresso` - AlunoAulaProgresso
- `rankings` - ranking generico por modalidade
- `desafio_jcc` - ranking do desafio JCC
- `guest_users` - visitantes/leads

### Configuracao
- Naming convention: snake_case automatico
- Retry on failure habilitado
- Auditoria automatica (CreatedAt/LastUpdatedAt) via override de `SaveChangesAsync`

---

## Deploy

### Frontend (Vercel)
- `vercel.json` com rewrite SPA (`/* -> /index.html`)
- Build: `npm run vercel-build` executa:
  1. `scripts/replace-env.js` -- substitui `http://localhost:5269` pelo valor de `$API_URL_PROD` em `environment.prod.ts`
  2. `ng build --configuration production`
- URL de producao: `https://aprendanave.vercel.app`

### Backend (Azure App Service)
- Deploy via Zip Deploy (configurado em `Properties/ServiceDependencies/`)
- CORS configurado para aceitar requests de `localhost:4200` (dev) e `aprendanave.vercel.app` (prod)
- Cookies com `SameSite=None` e `Secure=true` para funcionar cross-origin

### Servicos Externos
- **Supabase**: PostgreSQL gerenciado (connection string via env var)
- **Cloudinary**: Upload de fotos de perfil (URL via `CLOUDINARY_URL`)
- **Firebase**: Config presente no frontend mas nao utilizada ativamente

---

## Desenvolvimento Local

### Pre-requisitos
- Node.js (para o Angular CLI)
- .NET 8 SDK
- PostgreSQL local ou acesso ao Supabase

### Frontend
```bash
cd Client
npm install
ng serve
# Acessa em http://localhost:4200
```

### Backend
```bash
cd server
dotnet restore
dotnet run --project server
# API disponivel em http://localhost:5269
# Swagger em http://localhost:5269/swagger (apenas em dev)
```

### Variaveis de Ambiente do Backend
- `PrivateKey` -- chave secreta para assinar JWT
- `ConnectionStrings:TransationConnection` -- connection string do PostgreSQL
- `CLOUDINARY_URL` -- URL de acesso ao Cloudinary

---

## Funcionalidades em Desenvolvimento / Incompletas

- **AprendaBot**: Pagina de tutor IA existe mas nao esta conectada a nenhum backend de IA
- **Conquistas**: Hardcoded, sem sistema dinamico
- **Admin Panel**: Nao existe endpoint para aprovar/rejeitar cursos, modulos e aulas (feito manualmente no banco)
- **Delete de curso**: Botao existe no frontend mas mostra "em desenvolvimento"
- **Stubs no backend**: `DELETE /user/{id}`, `PATCH /user/{id}/pontos` nao implementados
- **`CompletouModulo` e `GetModuloById`**: Lancam `NotImplementedException`
