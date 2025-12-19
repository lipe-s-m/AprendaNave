export interface Aula {
  idAula: number;
  tituloAula: string;
  videoYoutubeIdAula: string;
  concluida: boolean;
  idModulo: number;
  duracaoAula: number;
  ordemAula: number;
  descricaoAula: string;
}

export interface Modulo {
  id: number;
  nome: string;
  status: 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  aulas: number;
  duracao: string;
  descricao?: string;
  nivel?: 'INICIANTE' | 'INTERMEDIÁRIO' | 'AVANÇADO';
  aulasList?: Aula[];
}

export interface Curso {
  id: number;
  nome: string;
  logo?: string;
  professor?: string;
  quantidadeModulos?: number;
  modulos: Modulo[];
  tag: string;
}
