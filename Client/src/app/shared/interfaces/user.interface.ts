export interface User {
  id?: number;
  nomeDeUsuario: string;
  email: string;
  senha: string;
}
export interface UserLoginDTO {
  email: string;
  senha: string;
}
export interface UserDTO {
  id?: number;
  nomeDeUsuario: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

export interface UserResponse {
  user: User;
  token: string;
}
