-- Tabela de conquistas (definições)
CREATE TABLE IF NOT EXISTS conquista (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  icone VARCHAR(50) NOT NULL DEFAULT 'flag-red.svg',
  tipo VARCHAR(30) NOT NULL,
  condicao_valor INTEGER NOT NULL DEFAULT 0,
  pontos INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de conquistas desbloqueadas pelo aluno
CREATE TABLE IF NOT EXISTS aluno_conquista (
  id SERIAL PRIMARY KEY,
  id_aluno INTEGER NOT NULL REFERENCES aluno(id) ON DELETE CASCADE,
  id_conquista INTEGER NOT NULL REFERENCES conquista(id) ON DELETE CASCADE,
  desbloqueado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id_aluno, id_conquista)
);

-- Conquistas iniciais
INSERT INTO conquista (nome, descricao, icone, tipo, condicao_valor, pontos) VALUES
  ('Primeiro Passo', 'Complete sua primeira aula', 'flag-teal.svg', 'aulas_concluidas', 1, 10),
  ('Explorador de Trilha', 'Complete todas as aulas de um módulo', 'flag-green.svg', 'modulo_concluido', 1, 50),
  ('Maratonista', 'Assista 10 aulas em um único dia', 'flag-orange.svg', 'aulas_dia', 10, 30),
  ('Colecionador', 'Complete 5 módulos', 'flag-purple.svg', 'modulos_concluidos', 5, 100),
  ('Aprendiz', 'Complete um quiz (qualquer pontuação)', 'flag-blue.svg', 'quiz_completo', 1, 25),
  ('Rei das Contas', 'Acerte todas as questões de um quiz', 'flag-gold.svg', 'quiz_perfeito', 1, 75),
  ('Mestre do Curso', 'Complete um curso inteiro (todos os módulos)', 'flag-red.svg', 'curso_concluido', 1, 150),
  ('Estudante Dedicado', 'Acumule 500 pontos', 'flag-teal.svg', 'pontos_acumulados', 500, 50),
  ('Criador de Conteúdo', 'Tenha um curso aprovado', 'flag-blue.svg', 'curso_aprovado', 1, 100),
  ('Lenda', 'Desbloqueie 5 conquistas', 'flag-gold.svg', 'conquistas_desbloqueadas', 5, 200);
