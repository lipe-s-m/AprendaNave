-- Evento público reutilizável, sem FK polimórfica entre aluno e guest_user.
-- Execute: npx prisma db execute --schema prisma/schema.prisma --file prisma/create-desafio-evento.sql

CREATE TABLE IF NOT EXISTS desafio_evento (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  nome VARCHAR(120) NOT NULL,
  descricao VARCHAR(300),
  status VARCHAR(20) NOT NULL DEFAULT 'RASCUNHO' CHECK (status IN ('RASCUNHO', 'ATIVO', 'ENCERRADO')),
  jogo_habilitado BOOLEAN NOT NULL DEFAULT FALSE,
  inicio_em TIMESTAMPTZ,
  fim_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS desafio_evento_participante (
  id UUID PRIMARY KEY,
  id_evento BIGINT NOT NULL REFERENCES desafio_evento(id) ON DELETE CASCADE,
  tipo_pessoa VARCHAR(10) NOT NULL CHECK (tipo_pessoa IN ('ALUNO', 'GUEST')),
  id_pessoa INTEGER,
  nome_snapshot VARCHAR(100) NOT NULL,
  token_sessao_hash VARCHAR(64),
  expira_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT desafio_evento_participante_origem_unica UNIQUE (id_evento, tipo_pessoa, id_pessoa)
);

CREATE INDEX IF NOT EXISTS ix_desafio_evento_participante_token ON desafio_evento_participante(id_evento, token_sessao_hash);

CREATE TABLE IF NOT EXISTS desafio_evento_score (
  id_evento BIGINT NOT NULL REFERENCES desafio_evento(id) ON DELETE CASCADE,
  id_participante UUID NOT NULL REFERENCES desafio_evento_participante(id) ON DELETE CASCADE,
  melhor_pontuacao INTEGER NOT NULL CHECK (melhor_pontuacao >= 0),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ,
  PRIMARY KEY (id_evento, id_participante)
);

CREATE INDEX IF NOT EXISTS ix_desafio_evento_score_ranking ON desafio_evento_score(id_evento, melhor_pontuacao DESC);

INSERT INTO desafio_evento (slug, nome, descricao, status, jogo_habilitado)
VALUES ('jcc-afs-2026', 'Desafio JCC + AFS 2026', 'Teste seu raciocínio matemático, conquiste pontos e entre no ranking ao vivo.', 'ATIVO', TRUE)
ON CONFLICT (slug) DO NOTHING;
