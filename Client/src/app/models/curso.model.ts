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
  autorNome?: string;
  autorId?: number;
  quantidadeModulos?: number;
  modulos: Modulo[];
  tag: string;
  descricao?: string;
  statusAprovacao?: number; // 0=Pendente, 1=Aprovado, 2=Rejeitado
}

export interface CreateCursoDto {
  nome: string;
  logo: string;
  autorNome: string;
  descricao: string;
}
