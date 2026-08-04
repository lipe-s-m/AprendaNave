# Refatoracao AprendaNave — 04/08/2026

## Backend: Migracao .NET 8 → TypeScript + Hono

### O que mudou
- Backend inteiro reescrito de C# (.NET 8 Minimal API) para TypeScript (Hono + Prisma)
- Nova pasta `api/` na raiz do projeto (pasta `server/` mantida para referencia)
- ORM: Entity Framework Core → Prisma
- Hash de senhas: Argon2 → bcrypt (com fallback Argon2 para senhas existentes, migra automaticamente no login)
- Hospedagem alvo: Azure → Railway

### Arquivos criados
- `api/src/index.ts` — entry point, CORS, mount de rotas
- `api/src/middleware/auth.ts` — JWT cookie middleware
- `api/src/routes/auth.ts` — login, logout, validate-token
- `api/src/routes/user.ts` — cadastro, perfil, foto
- `api/src/routes/cursos.ts` — CRUD cursos + modulos aninhados
- `api/src/routes/modulos.ts` — CRUD modulos + aulas aninhadas
- `api/src/routes/aulas.ts` — GET aula por ID
- `api/src/routes/desafioJcc.ts` — ranking desafio JCC
- `api/src/routes/ranking.ts` — ranking generico por modalidade
- `api/src/routes/guests.ts` — CRUD visitantes
- `api/src/lib/prisma.ts` — singleton PrismaClient
- `api/src/lib/cloudinary.ts` — config Cloudinary
- `api/prisma/schema.prisma` — schema das 9 tabelas (escrito manualmente a partir do EF Core snapshot)
- `api/package.json`, `api/tsconfig.json`, `api/Procfile`, `api/.env.example`

### Contratos da API
Todos os 25+ endpoints mantidos com contratos JSON identicos ao .NET. Frontend nao precisou de mudancas de contrato.

### Frontend: environment.ts
- `apiUrl` alterado de `http://localhost:5269` para `http://localhost:3000`

---

## Frontend: Primeira Leva de Refatoracao

### 1. Backdoor admin/admin removido (SEGURANCA)
- **Arquivo:** `Client/src/app/pages/login/login.component.ts`
- Removido bloco que permitia login com admin/admin sem autenticacao

### 2. Logout real implementado (SEGURANCA)
- **Arquivo:** `Client/src/app/services/auth/auth.service.ts` — adicionado metodo `logout()` que reseta `isAuthSubject` para `false`
- **Arquivo:** `Client/src/app/services/login/login.service.ts` — `logout()` agora faz POST `/auth/logout` para limpar cookie no servidor, chama `authService.logout()`, limpa localStorage
- **Arquivo:** `api/src/routes/auth.ts` — adicionado endpoint `POST /auth/logout` que limpa cookie `access_token`

### 3. Toast enganoso do perfil removido
- **Arquivo:** `Client/src/app/shared/components/subheader/subheader.component.ts`
- Removido `toastr.info('Funcionalidade de perfil em desenvolvimento')` do metodo `goToProfile()`

### 4. Botoes Facebook/Google removidos
- **Arquivo:** `Client/src/app/pages/login/login.component.html`
- Removidos botoes "Entrar com Facebook" e "Entrar com Google" e divisores "OU" de ambas as secoes (login e cadastro)

### 5. Console.logs removidos (~48 ocorrencias)
- `login.component.ts` (4)
- `trilha.component.ts` (5)
- `modulo.component.ts` (4)
- `aula.component.ts` (4)
- `desafio-jcc.component.ts` (6)
- `desafio-matematica.component.ts` (14)
- `quiz/quiz.component.ts` (5)
- `user.service.ts` (4)
- `desafio-jcc.service.ts` (1)
- `app.config.ts` (1)

---

## Frontend: Segunda Leva de Refatoracao

### 6. Dados hardcoded substituidos por dados reais
- **Arquivo:** `Client/src/app/pages/home/home.component.html`
  - "4 modulos" hardcoded → usa `curso.quantidadeModulos` se disponivel, senao mostra "Curso"
  - `curso.id` exibido como contagem de alunos → removido (nao existe dado real de matriculas)
- **Arquivo:** `Client/src/app/pages/trilha/trilha.component.html`
  - `modulo.id+1 aulas · modulo.id*40 min` (dados fabricados) → usa `modulo.quantidadeAulas` e `modulo.quantidadeHoras` reais da API

### 7. Imagens externas internalizadas
- **Arquivo:** `Client/src/app/pages/home/home.component.html`
  - Icone AprendaBot (`i.ibb.co`) → salvo em `src/assets/aprendabot-icon.png`
  - Icone Desafio (`flaticon.com`) → salvo em `src/assets/desafio-icon.png`
  - Referencias atualizadas para assets locais

### 8. Todos os modulos desbloqueados
- **Arquivo:** `Client/src/app/pages/trilha/trilha.component.ts`
  - Removido `if (modulo.id !== 1)` em `abrirModalModulo()` que bloqueava todos os modulos exceto id=1
  - Removido `if (this.moduloSelecionado.id !== 1)` em `confirmarIniciarModulo()` com mesmo bloqueio
  - Agora todos os modulos aprovados retornados pela API sao acessiveis

### 9. Bug de signal corrigido no componente de aula
- **Arquivo:** `Client/src/app/pages/aula/aula.component.ts`
  - `this.aulasList.length` → `this.aulasList().length` em 3 locais (ngOnInit, verificarAulasConcluidas, definirNavegacaoAulas)
  - Bug: `.length` na funcao signal (sempre > 0) ao inves do valor do array. Impedia o fetch de aulas e quebrava a navegacao entre aulas

---

---

## Frontend: Terceira Leva de Refatoracao

### 10. Memory leaks de timers corrigidos
- **Arquivo:** `Client/src/app/pages/quiz/quiz/quiz.component.ts`
  - Adicionadas propriedades `countdownInterval` e `timerInterval` para rastrear intervalos
  - `setInterval` agora armazena referencia e limpa intervalo anterior antes de criar novo
  - `ngOnDestroy()` limpa ambos os intervalos. Removido `this.voltarParaTrilha()` do destroy (causava race condition de navegacao)
- **Arquivo:** `Client/src/app/pages/desafio-matematica/desafio-matematica.component.ts`
  - Mesma correcao aplicada: rastrear, limpar antes de recriar, limpar no destroy

### 11. Logica de quiz unificada em MathGameService
- **Arquivo criado:** `Client/src/app/services/math-game/math-game.service.ts`
  - `generateQuestion(num1, num2, opIndex)` — calcula resultado para +, -, *, / com validacao de divisao
  - `generateOptions(correctAnswer)` — gera 4 opcoes embaralhadas (1 correta + 3 plausíveis)
  - `shuffleArray<T>(array)` — Fisher-Yates shuffle generico
  - `getOperatorSymbol(opIndex)` — mapeia 0-3 para +, -, *, /
- **Arquivo:** `Client/src/app/pages/quiz/quiz/quiz.component.ts` — removidos `calcNumber()`, `generateIncorrectAnswer()`, `shuffleArray()`, substituidos por chamadas ao service
- **Arquivo:** `Client/src/app/pages/desafio-matematica/desafio-matematica.component.ts` — mesma refatoracao, logica especifica (dificuldade progressiva, game over no primeiro erro) mantida no componente

### 12. Progresso de aulas persistido no servidor
- **Arquivo backend:** `api/src/routes/aulas.ts`
  - `GET /aulas/progresso/:moduloId` (auth) — retorna array de IDs de aulas concluidas pelo usuario no modulo
  - `POST /aulas/:aulaId/concluir` (auth) — marca aula como concluida (idempotente, cria registro em `aluno_aula_progresso`)
- **Arquivo frontend:** `Client/src/app/services/aula/aula.service.ts`
  - `getAulas()` agora sincroniza com servidor: busca progresso server-side e faz merge (uniao) com localStorage
  - `markAulaComoConcluida()` agora tambem faz POST ao servidor (fire-and-forget)
  - Usuarios nao autenticados (guests) continuam usando apenas localStorage como fallback

---

## Bugs conhecidos (a corrigir)

### BUG: Quantidade de aulas mostra 0 em todos os modulos
- **Onde:** Pagina de trilha (`trilha.component.html`)
- **Causa provavel:** O campo `quantidade_aulas` no banco esta com valor 0 para todos os modulos existentes. Os dados corretos nunca foram populados — o .NET original tambem tinha um bug no `ModuloService.CreateModulo` que atribuia `quantidadeAulas` ao campo `quantidadeHoras`. Corrigir populando o valor real no banco ou calculando dinamicamente a partir da contagem de aulas aprovadas do modulo.
