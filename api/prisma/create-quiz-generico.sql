-- Quiz final genérico por módulo. Execute uma vez com:
-- npx prisma db execute --schema prisma/schema.prisma --file prisma/create-quiz-generico.sql

CREATE TABLE IF NOT EXISTS quiz (
  id BIGSERIAL PRIMARY KEY,
  id_modulo INTEGER NOT NULL UNIQUE REFERENCES modulo(id) ON DELETE CASCADE,
  titulo VARCHAR(100) NOT NULL,
  descricao VARCHAR(255),
  nota_minima INTEGER NOT NULL DEFAULT 70 CHECK (nota_minima BETWEEN 1 AND 100),
  status VARCHAR(20) NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Aprovado', 'Rejeitado')),
  criado_por_id INTEGER NOT NULL REFERENCES aluno(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_quiz_modulo_status ON quiz(id_modulo, status);

CREATE TABLE IF NOT EXISTS quiz_questao (
  id BIGSERIAL PRIMARY KEY,
  id_quiz BIGINT NOT NULL REFERENCES quiz(id) ON DELETE CASCADE,
  enunciado TEXT NOT NULL,
  explicacao TEXT,
  ordem INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Aprovado', 'Rejeitado')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ,
  CONSTRAINT uq_quiz_questao_ordem UNIQUE (id_quiz, ordem)
);

CREATE INDEX IF NOT EXISTS ix_quiz_questao_quiz_status ON quiz_questao(id_quiz, status);

CREATE TABLE IF NOT EXISTS quiz_alternativa (
  id BIGSERIAL PRIMARY KEY,
  id_questao BIGINT NOT NULL REFERENCES quiz_questao(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  correta BOOLEAN NOT NULL DEFAULT FALSE,
  ordem INTEGER NOT NULL,
  CONSTRAINT uq_quiz_alternativa_ordem UNIQUE (id_questao, ordem)
);

CREATE INDEX IF NOT EXISTS ix_quiz_alternativa_questao ON quiz_alternativa(id_questao);

CREATE TABLE IF NOT EXISTS quiz_tentativa (
  id UUID PRIMARY KEY,
  id_aluno INTEGER NOT NULL REFERENCES aluno(id) ON DELETE CASCADE,
  id_quiz BIGINT NOT NULL REFERENCES quiz(id) ON DELETE CASCADE,
  id_modulo INTEGER NOT NULL REFERENCES modulo(id) ON DELETE CASCADE,
  perguntas_snapshot JSONB NOT NULL,
  iniciada_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalizada_em TIMESTAMPTZ,
  expira_em TIMESTAMPTZ,
  acertos INTEGER,
  total_questoes INTEGER,
  percentual INTEGER,
  aprovado BOOLEAN,
  navecoins_ganhos INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'EM_ANDAMENTO' CHECK (status IN ('EM_ANDAMENTO', 'FINALIZADA', 'EXPIRADA'))
);

CREATE INDEX IF NOT EXISTS ix_quiz_tentativa_aluno_quiz_data ON quiz_tentativa(id_aluno, id_quiz, iniciada_em);

CREATE TABLE IF NOT EXISTS aluno_modulo_quiz (
  id_aluno INTEGER NOT NULL REFERENCES aluno(id) ON DELETE CASCADE,
  id_modulo INTEGER NOT NULL REFERENCES modulo(id) ON DELETE CASCADE,
  melhor_percentual INTEGER NOT NULL DEFAULT 0 CHECK (melhor_percentual BETWEEN 0 AND 100),
  melhor_acertos INTEGER NOT NULL DEFAULT 0,
  tentativas_realizadas INTEGER NOT NULL DEFAULT 0,
  primeira_aprovacao_em TIMESTAMPTZ,
  ultima_tentativa_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_aluno, id_modulo)
);
