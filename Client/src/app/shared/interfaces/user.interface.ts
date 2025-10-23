export interface User {
  id?: number;
  nome: string;
  email: string;
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
