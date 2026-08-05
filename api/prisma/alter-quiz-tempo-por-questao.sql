-- Migração incremental para bancos que já receberam create-quiz-generico.sql.
ALTER TABLE quiz
  ADD COLUMN IF NOT EXISTS tempo_por_questao_segundos INTEGER;

ALTER TABLE quiz
  DROP CONSTRAINT IF EXISTS quiz_tempo_por_questao_segundos_check;

ALTER TABLE quiz
  ADD CONSTRAINT quiz_tempo_por_questao_segundos_check
  CHECK (tempo_por_questao_segundos IS NULL OR tempo_por_questao_segundos BETWEEN 5 AND 300);
