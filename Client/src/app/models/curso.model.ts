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
  /** Contagem dinâmica vinda da API (nº de aulas aprovadas para o público). */
  quantidadeAulas?: number;
  /** Detalhamento por status, retornado apenas no modo criador. */
  quantidadeAulasAprovadas?: number;
  quantidadeAulasPendentes?: number;
  quantidadeAulasRejeitadas?: number;
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

export interface CreateModuloDto {
  nome: string;
  descricao: string;
  ordem: number;
  nivel: number;
  // A quantidade de aulas NÃO é enviada: o servidor calcula dinamicamente
  // a partir da tabela `aula`.
  quantidadeHoras?: number;
  cursoId: number;
}

export interface CreateAulaDto {
  titulo: string;
  descricao: string;
  ordem: number;
  duracao?: number;
  videoYoutubeId: string;
  idModulo: number;
}
