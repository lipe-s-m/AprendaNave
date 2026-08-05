-- Backfill da coluna legada quantidade_aulas (não é fonte de verdade).
-- A API calcula a contagem dinamicamente a partir da tabela `aula`.
-- Este script apenas deixa dados antigos coerentes para ferramentas SQL/código legado.
-- Executar com: npx prisma db execute --schema prisma/schema.prisma --file prisma/backfill-quantidade-aulas.sql

UPDATE modulo m
SET quantidade_aulas = contagem.total
FROM (
  SELECT modulo_id, COUNT(*)::INTEGER AS total
  FROM aula
  GROUP BY modulo_id
) contagem
WHERE m.id = contagem.modulo_id;

UPDATE modulo
SET quantidade_aulas = 0
WHERE id NOT IN (SELECT DISTINCT modulo_id FROM aula);
