-- Tabela genérica de melhor pontuação por aluno/categoria.
-- Executar com: npx prisma db execute --schema prisma/schema.prisma --file prisma/create-ranking-melhor-pontuacao.sql
-- (NUNCA usar `prisma db push` — o schema Prisma não corresponde perfeitamente ao banco real.)

CREATE TABLE IF NOT EXISTS ranking_melhor_pontuacao (
  id BIGSERIAL PRIMARY KEY,
  id_aluno INTEGER NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  pontos INTEGER NOT NULL CHECK (pontos >= 0),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NULL,
  CONSTRAINT ranking_melhor_pontuacao_aluno_fk
    FOREIGN KEY (id_aluno) REFERENCES aluno(id) ON DELETE CASCADE,
  CONSTRAINT ranking_melhor_pontuacao_aluno_categoria_unica
    UNIQUE (id_aluno, categoria)
);

CREATE INDEX IF NOT EXISTS ranking_melhor_pontuacao_categoria_pontos_idx
  ON ranking_melhor_pontuacao (categoria, pontos DESC);

-- Migrar o maior valor já existente em desafio_jcc para a categoria desafio-matematica.
-- Somente alunos válidos (id_aluno órfãos de guests/deletados são ignorados pela FK).
INSERT INTO ranking_melhor_pontuacao (id_aluno, categoria, pontos)
SELECT d.id_aluno, 'desafio-matematica', MAX(d.pontos)
FROM desafio_jcc d
WHERE EXISTS (SELECT 1 FROM aluno a WHERE a.id = d.id_aluno)
GROUP BY d.id_aluno
ON CONFLICT (id_aluno, categoria)
DO UPDATE SET pontos = GREATEST(ranking_melhor_pontuacao.pontos, EXCLUDED.pontos),
              atualizado_em = NOW();
