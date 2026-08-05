export interface User {
  id?: number;
  nome: string;
  email: string;
  pontos: number;
  cargo?: string;
  bio?: string;
  fotoPerfil?: string;
}
export interface UserProfile {
  nome: string;
  email: string;
  pontos: number;
  bio: string;
  fotoPerfil: string;
}
export interface LoginRequestDTO {
  email: string;
  senha: string;
}
export interface LoginResponseDTO {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  pontos: number;
}
export interface CadastroResponseDTO {
  id: number;
  nome: string;
  email: string;
  cargo: string;
}
export interface UserDTO {
  id?: number;
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

export interface Ranking {
  nomeAluno: string;
  pontuacaoAluno: number;
}
export interface GuestRequestDTO {
  nome: string;
  contato: string;
}
export interface GuestResponseDTO {
  id: number;
  nome: string;
  contato: string;
}

export interface ModuloProgresso {
  idModulo: number;
  idCurso: number;
  status: 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
  aulasConcluidas: number;
  totalAulas: number;
}

export interface UserProgress {
  aulasConcluidas: number[];
  modulosProgresso: ModuloProgresso[];
}

export interface ConcluirAulaResponse {
  idAula: number;
  idModulo: number;
  moduloStatus: 'EM_ANDAMENTO' | 'CONCLUIDO';
  todasAulasConcluidas: boolean;
}
