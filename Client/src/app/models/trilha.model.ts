export interface Modulo {
  id: number;
  nome: string;
  status: 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  aulas: number;
  duracao: string;
  descricao?: string;
  nivel?: 'INICIANTE' | 'INTERMEDIÁRIO' | 'AVANÇADO';
}

export interface Trilha {
  id: number;
  nome: string;
  imagem: string;
  matriculas: number;
  professor: string;
  tag?: 'NOVA' | 'POPULAR';
  descricao: string;
  modulos: Modulo[];
}
