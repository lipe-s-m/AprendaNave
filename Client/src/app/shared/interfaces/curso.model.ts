export interface Curso {
  id: number;
  nome: string;
  logo: string;
  professor: string;
  quantidadeModulos: number;
  tag?: string;
}

export interface IModulo {
  id: number;
  nome: string;
  descricao: string;
  ordem: number;
  nivel: string;
  quantidadeAulas: number;
  quantidadeHoras: number;
  cursoId: number;
  playlist: string;
}
