export interface User {
  id?: number;
  nomeDeUsuario: string;
  email: string;
  senha: string;
}

export interface UserResponse {
  user: User;
  token: string;
}
