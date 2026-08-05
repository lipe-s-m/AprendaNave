CREATE TABLE IF NOT EXISTS aluno_modulo_progresso (
  id_aluno INTEGER NOT NULL,
  id_modulo INTEGER NOT NULL,
  status_progresso INTEGER NOT NULL,
  CONSTRAINT aluno_modulo_progresso_pkey PRIMARY KEY (id_aluno, id_modulo),
  CONSTRAINT fk_aluno_modulo_progresso_aluno FOREIGN KEY (id_aluno) REFERENCES aluno(id) ON DELETE CASCADE,
  CONSTRAINT fk_aluno_modulo_progresso_modulo FOREIGN KEY (id_modulo) REFERENCES modulo(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_aluno_modulo_progresso_id_modulo ON aluno_modulo_progresso(id_modulo);
