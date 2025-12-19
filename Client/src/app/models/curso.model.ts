export interface Aula {
  id: number;
  titulo: string;
  videoYoutubeId: string;
  concluida: boolean;
}

export interface Modulo {
  id: number;
  nome: string;
  aulasList: Aula[];
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
