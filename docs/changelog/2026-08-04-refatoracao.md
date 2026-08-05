# Refatoração AprendaNave — 04/08/2026

## Sessão 1: Migração .NET 8 → TypeScript + Hono

### O que mudou
- Backend inteiro reescrito de C# (.NET 8 Minimal API) para TypeScript (Hono + Prisma)
- Nova pasta `api/` na raiz do projeto (pasta `server/` mantida para referência)
- ORM: Entity Framework Core → Prisma
- Hash de senhas: Argon2 → bcrypt (com fallback Argon2 para senhas existentes, migra automaticamente no login)
- Hospedagem alvo: Azure → Railway

### Arquivos criados
- `api/src/index.ts` — entry point, CORS, mount de rotas
- `api/src/middleware/auth.ts` — JWT cookie middleware
- `api/src/routes/auth.ts`, `user.ts`, `cursos.ts`, `modulos.ts`, `aulas.ts`, `desafioJcc.ts`, `ranking.ts`, `guests.ts`
- `api/src/lib/prisma.ts`, `cloudinary.ts`
- `api/prisma/schema.prisma` — schema das 9 tabelas (escrito manualmente a partir do EF Core snapshot)
- `api/package.json`, `tsconfig.json`, `Procfile`, `.env.example`

### Contratos da API
Todos os 25+ endpoints mantidos com contratos JSON idênticos ao .NET. Frontend não precisou de mudanças de contrato.

### Frontend: environment.ts
- `apiUrl` alterado de `http://localhost:5269` para `http://localhost:3000`

---

## Sessão 1b: Primeira Leva de Refatoração no Frontend

1. **Backdoor admin/admin removido** (SEGURANCA) — `login.component.ts`
2. **Logout real implementado** (SEGURANCA) — `auth.service.ts`, `login.service.ts`, `auth.ts`
3. **Toast enganoso do perfil removido** — `subheader.component.ts`
4. **Botoes Facebook/Google removidos** — `login.component.html`
5. **Console.logs removidos** (~48 ocorrências em 10 arquivos)

---

## Sessão 1c: Segunda Leva de Refatoração

6. **Dados hardcoded substituídos por dados reais** — `home.component.html`, `trilha.component.html`
7. **Imagens externas internalizadas** — assets locais
8. **Todos os módulos desbloqueados** — removido bloqueio `if (modulo.id !== 1)`
9. **Bug de signal corrigido** — `this.aulasList.length` → `this.aulasList().length`

---

## Sessão 1d: Terceira Leva de Refatoração

10. **Memory leaks de timers corrigidos** — `quiz.component.ts`, `desafio-matematica.component.ts`
11. **Lógica de quiz unificada** — `MathGameService` com Fisher-Yates
12. **Progresso de aulas persistido no servidor** — endpoints em `aulas.ts`, sync no `aula.service.ts`

---

## Sessão 2: Progresso Server-Side + Dirty Flag

### Backend
- `POST /aulas/:aulaId/concluir` refatorado com auto-upsert de `aluno_modulo_progresso`
- Novo: `GET /user/progresso` — progresso consolidado (aulas + módulos)
- Novo: `GET /modulos/:moduloId/progresso` — progresso por módulo
- `PATCH /user/` e `PATCH /user/image` corrigidos (não retornam mais `alunoModuloProgresso: []` hardcoded)
- Tabela `aluno_modulo_progresso` criada no banco (estava faltando)

### Frontend
- `AulaService` refatorado: servidor como fonte da verdade, dirty flag, localStorage como cache
- `AulaComponent.marcarAulaConcluida()` descomentado e corrigido
- `ModuloComponent` e `TrilhaComponent` usando progresso real do servidor

---

## Sessão 3: Painel do Criador

### Backend
- Novo: `GET /cursos/:id`, `PUT /cursos/:id`, `DELETE /cursos/:id`
- Novo: `PUT /modulos/:id`, `DELETE /modulos/:id`
- Novo: `PUT /aulas/:id`, `DELETE /aulas/:id`
- Novo: `GET /cursos/:cursoId/modulos` (retorna todos se owner, só aprovados se não)
- Novo: `GET /modulos/:moduloId/aulas` (mesma lógica)
- Segurança: `POST /cursos/:cursoId/modulos` e `POST /modulos/:moduloId/aulas` agora exigem auth + owner
- Middleware: `isCursoOwner()`, `isModuloOwner()`, `isAulaOwner()` adicionados

### Frontend
- Nova página: `GerenciarCursoComponent` (`/curso/:id/gerenciar`) — editar curso, CRUD módulos e aulas
- Novo componente: `ConfirmModalComponent` (modal genérico)
- `MeusCursosComponent` refatorado com botões gerenciar/excluir
- `CursoService` expandido com 10 novos métodos CRUD
- Interfaces `CreateModuloDto`, `CreateAulaDto` adicionadas

---

## Sessão 4: Painel de Admin

### Backend
- `adminRoutes` com middleware `adminRequired`
- `GET /admin/pendentes` — lista pendentes (cursos, módulos, aulas)
- Aprovar/rejeitar curso, módulo, aula
- Validação hierárquica: não aprova módulo sem curso aprovado, não aprova aula sem módulo aprovado

### Frontend
- Nova página: `AdminComponent` (`/admin`) com 3 abas
- Link "Painel Admin" no subheader (visível só para `cargo === 'Admin'`)
- Link "Meus Cursos" no subheader (visível para todos)

---

## Sessão 5: Sistema de Conquistas

### Banco
- Tabela `conquista` — 10 conquistas (Primeiro Passo, Explorador de Trilha, Maratonista, Colecionador, Aprendiz, Rei das Contas, Mestre do Curso, Estudante Dedicado, Criador de Conteúdo, Lenda)
- Tabela `aluno_conquista` — registros de desbloqueio

### Backend
- `GET /conquistas` — lista com status de desbloqueio
- `conquistas.service.ts` — verificação automática (aulas, módulos, pontos, conquistas em cadeia)
- Integrado ao `POST /aulas/:aulaId/concluir`
- Tratamento de P2002 (unique constraint) para evitar duplicatas

### Frontend
- Página de perfil (`/perfil`) carrega conquistas dinamicamente
- Ícones: `flag-green.svg` (desbloqueada), `flag-red.svg` (bloqueada)
- Zero HTML hardcoded

---

## Sessão 6: UI e Organização

- **Subheader:** links Admin + Meus Cursos no menu hamburguer (removidos da home)
- **SCSS:** `gerenciar-curso`, `admin`, `meus-cursos` padronizados com `_variables.scss`
- **localStorage:** `localStorage.clear()` no login e logout (sem vazamento entre contas)
- **Interface `User`:** adicionado campo `cargo`
- **Script `reset-senha.ts`:** utilitário para resetar senha via terminal

---

## Sessão 7: Padronização de Escala de Fonte (CRÍTICO)

> **Importante para qualquer LLM que trabalhar no frontend:** o `root` do projeto define **1rem = 10px**.

### Escala de referência
| px | rem |
|----|-----|
| 10px | 1.0rem |
| 12px | 1.2rem |
| 14px | 1.4rem |
| **16px (padrão)** | **1.6rem** |
| 18px | 1.8rem |
| 20px | 2.0rem |
| 24px | 2.4rem |

### Regras de ouro
- **Corpo de texto:** 1.6rem (16px) — `$fonte-tamanho-p` em `_variables.scss`
- **Metadados/labels:** 1.4rem (14px)
- **Ícones em botões de ação:** 1.6rem
- **Títulos:** h1=2.4rem, h2=2rem, h3=1.8rem (já definidos nas variáveis)
- **Cores:** SEMPRE via variáveis CSS de `_variables.scss` (`--background-secondary`, `--text-primary`, `--accent-primary`, etc.) — NUNCA hex hardcoded

### Arquivos ajustados
- `confirm-modal.component.ts` — estilos inline movidos de px hardcoded + hex para rem + variáveis CSS
- `meus-cursos.component.scss` — `.action-btn` 1.2rem → 1.6rem
- `gerenciar-curso.component.scss` — `.icon-btn` 1.4→1.6rem, `.aula-info` 1.4→1.6rem, `.aula-yt` 1.2→1.4rem, `.status-badge` 1.2→1.4rem
- `perfil.component.scss` — loader centralizado na seção de conquistas

---

## Estrutura Final de Pastas (visão simplificada)

```
AprendaNave/
├── Client/                     # Angular 18
│   └── src/app/
│       ├── pages/              # 14 páginas
│       │   ├── admin/          # Painel admin (aprovação)
│       │   ├── aula/           # Player de aula (YouTube)
│       │   ├── criar-curso/    # Form de criação de curso
│       │   ├── gerenciar-curso/# Painel do criador (editar+CRUD módulos/aulas)
│       │   ├── home/           # Home com grade de cursos
│       │   ├── login/          # Login + cadastro
│       │   ├── meus-cursos/    # Lista de cursos do usuário
│       │   ├── modulo/         # Lista de aulas do módulo
│       │   ├── perfil/         # Perfil + conquistas
│       │   ├── quiz/           # Quiz de matemática
│       │   ├── trilha/         # Lista de módulos do curso
│       │   └── ...
│       ├── services/           # 8 serviços
│       ├── shared/components/  # Button, Input, Loader, Subheader, ConfirmModal
│       ├── models/             # Interfaces (Curso, Modulo, Aula, DTOs)
│       └── guards/             # authGuard
├── api/                        # Hono + Prisma
│   └── src/
│       ├── routes/             # 10 arquivos de rota
│       ├── middleware/         # auth.ts (JWT, admin, owner checks)
│       ├── services/           # conquistas.service.ts
│       └── lib/                # prisma.ts, cloudinary.ts
├── server/                     # .NET 8 original (referência apenas)
└── docs/                       # Documentação
    ├── changelog/
    ├── plans/
    └── fixes-futuros.md
```
