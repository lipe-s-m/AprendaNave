# Backend Migration: .NET 8 → TypeScript + Hono

> **For Claude:** REQUIRED SUB-SKILL: Use fulcrum:execute-plan to implement this plan task-by-task.

**Goal:** Reescrever o backend de .NET 8 para TypeScript + Hono, mantendo o mesmo banco PostgreSQL (Supabase) e deployando no Railway.

**Architecture:** Nova pasta `api/` na raiz do projeto. Hono rodando como servidor Node.js convencional via `@hono/node-server`. Prisma como ORM apontando pro banco existente via `prisma db pull`. Rotas organizadas por dominio, sem camada de services (CRUD simples direto nos handlers).

**Tech Stack:** Hono, Prisma, jsonwebtoken, bcryptjs, @node-rs/argon2 (compatibilidade com senhas existentes), cloudinary (placeholder), tsup (build), tsx (dev)

---

## Contexto

O frontend Angular 18 esta no Vercel (`aprendanave.vercel.app`). O backend .NET 8 estava no Azure (creditos acabaram). O banco PostgreSQL esta no Supabase e continua o mesmo. O novo backend sera deployado no Railway.

### Restricoes criticas

- **Contratos da API devem ser identicos** — o frontend nao pode precisar mudar (exceto a URL base)
- **Cookie-based auth** — JWT via cookie HttpOnly, Secure, SameSite=None
- **Banco ja existe com dados** — nao recriar tabelas, usar `prisma db pull`
- **Compatibilidade de senhas** — banco tem hashes Argon2. Login deve tentar Argon2 primeiro; se bater, re-hasheia com bcrypt e atualiza a row (migracao gradual)
- **Cloudinary** — placeholder no codigo, configurar depois (nao bloqueia)
- **Sem testes** — prazo de 3 dias, e um port 1:1

### O que NAO implementar (stubs no .NET)
- `DELETE /user/{id}` — nao implementado
- `PATCH /user/{idUsuario}/pontos` — retorna string placeholder
- `CompletouModulo` / `GetModuloById` — `NotImplementedException`

---

## Estrutura de pastas alvo

```
api/
├── src/
│   ├── index.ts              # Entry point, Hono app, CORS, mount routes
│   ├── routes/
│   │   ├── auth.ts           # POST /auth/login, GET /auth/validate-token
│   │   ├── user.ts           # GET/POST/PATCH /user
│   │   ├── cursos.ts         # GET/POST /cursos + nested modulos
│   │   ├── modulos.ts        # GET/POST /modulos + nested aulas
│   │   ├── aulas.ts          # GET /aulas/:id
│   │   ├── desafioJcc.ts     # /desafio/desafio-jcc/*
│   │   ├── ranking.ts        # /rankings/*
│   │   └── guests.ts         # GET/POST /guests
│   ├── middleware/
│   │   └── auth.ts           # JWT cookie extraction + authRequired middleware
│   └── lib/
│       ├── prisma.ts         # PrismaClient singleton
│       └── cloudinary.ts     # Cloudinary config (placeholder)
├── prisma/
│   └── schema.prisma         # Gerado via prisma db pull
├── package.json
├── tsconfig.json
├── .env.example
└── Procfile                  # Railway: web: node dist/index.js
```

---

## Contratos da API (referencia para cada task)

### Casing dos campos no JSON (CRITICO)

O .NET serializa em camelCase por padrao. O frontend espera exatamente:

- **Login request** (frontend envia PascalCase): `{ Email, Senha }`
- **Login response**: `{ id, nome, email, cargo, pontos, bio, fotoPerfil }`
- **User response**: `{ nome, bio, fotoPerfil, email, cargo, pontos, alunoModuloProgresso: [] }`
- **Cadastro response**: `{ id, nome, email, cargo }`
- **Curso entity** (raw): `{ id, nome, logo, autorNome, autorId, descricao, status, modulos: [] }`
- **CursoResponseDTO**: `{ id, nome, logo, autorNome, autorId, descricao, statusAprovacao }` (statusAprovacao como integer: 0=Pendente, 1=Aprovado, 2=Rejeitado)
- **Modulo entity** (camelCase): `{ id, nome, descricao, ordem, nivel, quantidadeAulas, quantidadeHoras, playlist, status, cursoId, createdAt, lastUpdatedAt }`
- **AulaResponseDTO**: `{ idAula, tituloAula, descricaoAula, ordemAula, duracaoAula, videoYoutubeIdAula, idModulo }`
- **Desafio/Ranking request** (frontend envia PascalCase): `{ IdAluno, NomeAluno, PontuacaoAluno }`
- **Desafio/Ranking response**: `{ idAluno, nomeAluno, pontuacaoAluno }`
- **Guest response**: `{ id, nome, contato }`

---

## Tasks

### Task 1: Scaffold do projeto

**Status: CONCLUIDO**

**Arquivos criados:**
- `api/package.json` — dependencias e scripts
- `api/tsconfig.json` — config TypeScript
- `api/.env.example` — template de env vars
- `api/Procfile` — comando de start pro Railway

**Dependencias:**
- hono, @hono/node-server, @prisma/client, jsonwebtoken, bcryptjs, @node-rs/argon2, cloudinary
- Dev: prisma, tsx, tsup, typescript, @types/*

---

### Task 2: Prisma schema via db pull

**Arquivos:**
- Criar: `api/.env` com DATABASE_URL real
- Gerar: `api/prisma/schema.prisma` via `npx prisma db pull`

**Steps:**
1. Criar `.env` com `DATABASE_URL` do Supabase
2. Rodar `npx prisma db pull` — introspecciona as tabelas existentes
3. Revisar o schema gerado — verificar que os nomes de colunas (snake_case) batem
4. Rodar `npx prisma generate` — gera o client tipado

**Tabelas esperadas (snake_case no banco):**
- `alunos` — id, nome, bio, foto_perfil, email, senha, cargo, pontos, created_at, last_updated_at
- `cursos` — id, nome, logo, autor_nome, autor_id (FK), descricao, status (string)
- `modulos` — id, nome, descricao, ordem, nivel, quantidade_aulas, quantidade_horas, playlist, status, curso_id (FK), created_at, last_updated_at
- `aulas` — id, titulo, descricao, ordem, duracao, video_youtube_id, status, modulo_id (FK)
- `progresso` — id_aluno + id_modulo (PK composta), status_progresso
- `aula_progresso` — id, id_aluno, id_aula, id_modulo
- `rankings` — id, id_aluno, nome_aluno, modalidade, pontos, created_at, last_updated_at
- `desafio_jcc` — id, id_aluno, nome_aluno, pontos, created_at, last_updated_at
- `guest_users` — id, nome, contato, created_at, last_updated_at

---

### Task 3: Entry point + CORS + Prisma singleton

**Arquivos:**
- Criar: `api/src/lib/prisma.ts`
- Criar: `api/src/lib/cloudinary.ts`
- Criar: `api/src/index.ts`

**`src/lib/prisma.ts`** — singleton do PrismaClient:
```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
export default prisma
```

**`src/lib/cloudinary.ts`** — placeholder:
```typescript
import { v2 as cloudinary } from 'cloudinary'
cloudinary.config({ secure: true })
export default cloudinary
```

**`src/index.ts`** — Hono app com:
- CORS para `http://localhost:4200` e `https://aprendanave.vercel.app` com `credentials: true`
- `GET /` retornando `"Hello World!"` (healthcheck, igual ao .NET)
- Mount de todas as rotas
- `serve()` via `@hono/node-server` na porta `process.env.PORT || 3000`

---

### Task 4: Middleware de auth (JWT cookie)

**Arquivos:**
- Criar: `api/src/middleware/auth.ts`

**Funcoes exportadas:**

1. `getCurrentUserId(c: Context): number | null` — le cookie `access_token`, verifica JWT com `process.env.PRIVATE_KEY`, retorna o claim `id` parseado como int. Retorna null se invalido.

2. `authRequired(c: Context, next: Next)` — middleware que chama `getCurrentUserId()`, retorna 401 se null, senao seta `c.set('userId', userId)` e chama `next()`.

**Claims do JWT (novos tokens):**
```json
{ "id": "123", "name": "Felipe", "email": "felipe@email.com", "cargo": "Aluno" }
```
Nota: o .NET usava URIs XML pros claims de name/email (`http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name`), mas como o backend antigo esta morto (Azure off), nao ha sessoes ativas pra manter compatibilidade. Claims simples sao suficientes.

---

### Task 5: Rotas de Auth (/auth)

**Arquivos:**
- Criar: `api/src/routes/auth.ts`

**Endpoints:**

#### `POST /auth/login`
- Body: `{ Email, Senha }` (PascalCase — aceitar ambos PascalCase e camelCase por seguranca)
- Busca aluno por email no banco
- **Migracao de senha:** tenta `bcrypt.compare()` primeiro. Se falhar, tenta `argon2.verify()`. Se Argon2 bater, re-hasheia com bcrypt e atualiza a row.
- Gera JWT (HS256, 2h expiry) com claims `{ id, name, email, cargo }`
- Seta cookie `access_token`: httpOnly=true, secure=true, sameSite='None', maxAge=7200, path='/'
- Retorna: `{ id, nome, email, cargo, pontos, bio, fotoPerfil }` (200)
  - **NOTA:** o .NET original NAO retornava `id` no LoginResponseDTO, mas o frontend espera. Incluir `id` corrige esse bug.
  - `fotoPerfil` vem da coluna `foto_perfil` do banco
- Erro: `"Email ou Senha incorretos!"` (401)

#### `GET /auth/validate-token`
- Le cookie `access_token`
- Verifica JWT com `jwt.verify()`
- Retorna 200 se valido, 401 se invalido

---

### Task 6: Rotas de User (/user)

**Arquivos:**
- Criar: `api/src/routes/user.ts`

**Endpoints:**

#### `GET /user/`
- Extrai userId do JWT via `getCurrentUserId()`
- Retorna o ID como numero (200)

#### `POST /user/`
- Body: `{ nome, email, senha, senhaConfirmacao, cargo? }`
- Validacao: senha.length > 2, senha === senhaConfirmacao
- Hash com bcrypt (salt rounds: 10)
- Cargo default: `"Aluno"` se vazio
- Retorna: `{ id, nome, email, cargo }` (201)

#### `GET /user/list`
- Paginado: 10 por pagina, query param `pagina` (default 1)
- Retorna: array de alunos (OMITIR campo `senha` por seguranca)

#### `PATCH /user/` (authRequired)
- Body: `{ nome?, bio? }` — atualiza apenas os campos presentes
- Retorna: `{ nome, bio, fotoPerfil, email, cargo, pontos, alunoModuloProgresso: [] }`

#### `PATCH /user/image` (authRequired)
- FormData com campo `file`
- TODO: upload pro Cloudinary (folder `users/profilePic`, nome `user_{id}`, crop 500x500, overwrite=true)
- Por agora: retorna o UserResponseDTO sem alterar foto
- Retorna: mesma shape de `PATCH /user/`

---

### Task 7: Rotas de Cursos (/cursos)

**Arquivos:**
- Criar: `api/src/routes/cursos.ts`

**Helper:** `statusToInt(status: string): number` — converte `"Pendente"→0`, `"Aprovado"→1`, `"Rejeitado"→2`

**Endpoints:**

#### `GET /cursos/aprovados`
- Filtro: `status === 'Aprovado'`
- Paginado: 6 por pagina, query param `pagina` (default 1)
- Retorna: array de Curso (raw entity shape com camelCase):
  ```json
  [{ "id": 1, "nome": "...", "logo": "...", "autorNome": "...", "autorId": 1, "descricao": "...", "status": "Aprovado", "modulos": [] }]
  ```

#### `POST /cursos/` (auth via JWT)
- Extrai `userId` do JWT claim `id`
- Body: `{ nome, logo, autorNome, descricao }`
- Cria com `status: 'Pendente'`, `autor_id: userId`
- Retorna: CursoResponseDTO `{ id, nome, logo, autorNome, autorId, descricao, statusAprovacao: 0 }` (201)

#### `GET /cursos/me` (auth via JWT)
- Filtra por `autor_id === userId`
- Retorna: array de CursoResponseDTO (com `statusAprovacao` como integer)

#### `GET /cursos/:cursoId/modulos/aprovados`
- Filtro: `curso_id === cursoId AND status === 'Aprovado'`
- Retorna: array de Modulo (camelCase mapeado do snake_case)

#### `POST /cursos/:cursoId/modulos`
- Body: ModuloRequestDTO `{ nome, ordem, nivel, descricao, quantidadeAulas, quantidadeHoras?, cursoId }`
- Cria com `status: 'Pendente'`, timestamps
- Retorna: Modulo entity (201)

**ATENCAO roteamento:** Hono deve registrar `/me` ANTES de `/:cursoId` para evitar conflito. Hono's SmartRouter prioriza segmentos estaticos, mas verificar nos testes.

---

### Task 8: Rotas de Modulos (/modulos)

**Arquivos:**
- Criar: `api/src/routes/modulos.ts`

**Endpoints:**

#### `GET /modulos/aprovados`
- Filtro: `status === 'Aprovado'`
- Retorna: array de Modulo (camelCase)

#### `GET /modulos/:moduloId/aulas/aprovadas`
- Filtro: `modulo_id === moduloId AND status === 'Aprovado'`
- Retorna: array de AulaResponseDTO:
  ```json
  [{ "idAula": 1, "tituloAula": "...", "descricaoAula": "...", "ordemAula": 1, "duracaoAula": null, "videoYoutubeIdAula": "abc123", "idModulo": 1 }]
  ```

#### `POST /modulos/:moduloId/aulas`
- Body: `{ titulo, descricao, ordem, duracao?, videoYoutubeId, idModulo }`
- Validacao: `moduloId === body.idModulo` (senao 404), `ordem >= 1`
- Cria com `status: 'Pendente'`
- Retorna: Aula entity shape (201)

---

### Task 9: Rotas de Aulas (/aulas)

**Arquivos:**
- Criar: `api/src/routes/aulas.ts`

**Endpoints:**

#### `GET /aulas/:aulaId`
- Busca por ID
- Retorna: AulaResponseDTO `{ idAula, tituloAula, descricaoAula, ordemAula, duracaoAula, videoYoutubeIdAula, idModulo }` (200)
- Se nao encontrada: 404

---

### Task 10: Rotas de Desafio JCC (/desafio/desafio-jcc)

**Arquivos:**
- Criar: `api/src/routes/desafioJcc.ts`

**Endpoints:**

#### `GET /ranking`
- Top 5 por pontos (ORDER BY pontos DESC, LIMIT 5)
- Retorna: `[{ idAluno, nomeAluno, pontuacaoAluno }]`

#### `GET /desafiantes`
- Todos os registros
- Retorna: mesma shape

#### `PATCH /pontuacao`
- Body: `{ IdAluno, NomeAluno, PontuacaoAluno }` (PascalCase — aceitar ambos)
- Upsert: busca por `(id_aluno, nome_aluno)`. Se existe, atualiza `pontos`. Se nao, cria novo registro.
- Retorna: `{ idAluno, nomeAluno, pontuacaoAluno }`

---

### Task 11: Rotas de Ranking (/rankings)

**Arquivos:**
- Criar: `api/src/routes/ranking.ts`

**Endpoints:**

#### `GET /modalidade/ranking?modalidade=X`
- Top 5 por modalidade
- Retorna: `[{ idAluno, nomeAluno, pontuacaoAluno, modalidade }]`

#### `GET /desafiantes?modalidade=X`
- Todos de uma modalidade
- Retorna: mesma shape

#### `PATCH /pontuacao`
- Body: `{ IdAluno, NomeAluno, PontuacaoAluno, Modalidade }` (PascalCase)
- Upsert: busca por `(id_aluno, nome_aluno, modalidade)`
- Retorna: `{ idAluno, nomeAluno, pontuacaoAluno, modalidade }`

---

### Task 12: Rotas de Guests (/guests)

**Arquivos:**
- Criar: `api/src/routes/guests.ts`

**Endpoints:**

#### `POST /`
- Body: `{ nome, contato }`
- Cria guest_user com timestamps
- Retorna: `{ id, nome, contato }` (201)

#### `GET /`
- Lista todos
- Retorna: `[{ id, nome, contato }]`

---

### Task 13: Teste local + ajustes

**Steps:**
1. Criar `.env` com `DATABASE_URL` real e `PRIVATE_KEY`
2. Rodar `npx prisma db pull` e `npx prisma generate`
3. Rodar `npm run dev` — servidor em `http://localhost:3000`
4. Testar com curl:
   - `curl http://localhost:3000/` → `Hello World!`
   - `curl http://localhost:3000/cursos/aprovados` → array de cursos
   - `curl http://localhost:3000/desafio/desafio-jcc/ranking` → ranking
   - `curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"Email":"test@test.com","Senha":"test"}'` → testa login
5. Testar com o frontend Angular (`ng serve` apontando pra `localhost:3000`)
6. Fixar mismatches de campo (o `prisma db pull` pode gerar nomes diferentes do esperado)

**Pontos criticos a verificar:**
- Cookie sendo setado corretamente no response de login
- `validate-token` funciona com o cookie
- Status no banco e string `"Aprovado"` (nao integer)
- Paginacao funciona
- Upsert do desafio/ranking funciona

---

### Task 14: Preparar deploy Railway

**Steps:**

1. **Railway project:**
   - Criar projeto no railway.app
   - Conectar repo GitHub
   - Setar root directory: `api/`

2. **Build settings:**
   - Build: `npm install && npm run build`
   - Start: `node dist/index.js` (ou Railway le o Procfile)

3. **Env vars no Railway:**
   - `DATABASE_URL` — connection string do Supabase
   - `PRIVATE_KEY` — chave secreta JWT (pode ser nova, backend antigo esta morto)
   - `CLOUDINARY_URL` — placeholder pra depois
   - `PORT` — Railway seta automaticamente

4. **Atualizar frontend:**
   - No Vercel, setar env var `API_URL_PROD` com a URL do Railway (ex: `https://aprendanave-api-production.up.railway.app`)
   - O script `Client/scripts/replace-env.js` ja substitui `http://localhost:5269` pelo valor de `API_URL_PROD` no build

5. **Verificar:**
   ```bash
   curl https://<railway-url>/
   curl https://<railway-url>/cursos/aprovados
   ```

---

## Riscos e mitigacoes

| Risco | Mitigacao |
|-------|----------|
| Hashes Argon2 incompativeis com bcrypt | Login tenta Argon2 primeiro via `@node-rs/argon2`, re-hasheia com bcrypt se bater |
| Prisma schema diferente do esperado | Rodar `prisma db pull` e adaptar codigo aos nomes reais |
| StatusAprovacao string vs integer | `statusToInt()` helper converte string→int pro CursoResponseDTO; endpoints que retornam entity raw retornam a string |
| `@node-rs/argon2` falha no build do Railway | Pacote ja vem pre-compilado (Rust→NAPI), nao precisa de toolchain C++ |
| Cookie SameSite=None exige HTTPS | Railway fornece HTTPS por padrao. Local dev pode precisar ajuste (secure=false) |
| Rota `/cursos/me` conflita com `/:cursoId` | Hono SmartRouter prioriza segmentos estaticos. Verificar nos testes |
