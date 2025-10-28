// import { AuthService } from './../auth/auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  User,
  UserDTO,
  LoginRequestDTO,
  LoginResponseDTO,
  CadastroResponseDTO,
} from '../../shared/interfaces/user.interface';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';

const TOKEN_KEY = 'authToken';
@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private apiUrl = environment.apiUrlDev;

  constructor(private http: HttpClient, private authService: AuthService) {}

  registerUser(userData: Omit<UserDTO, 'id'>): Observable<CadastroResponseDTO> {
    let payload = {
      nome: userData.nome,
      email: userData.email,
      senha: userData.senha,
      senhaConfirmacao: userData.confirmarSenha,
    };

    return this.http.post<CadastroResponseDTO>(`${this.apiUrl}/users`, payload);
  }

  // Use GET to query users by email+senha so we don't accidentally create users on login
  login(userData: {
    email: string;
    senha: string;
  }): Observable<LoginResponseDTO> {
    let payload = {
      Email: userData.email,
      Senha: userData.senha,
    };

    return this.http
      .post<LoginResponseDTO>(`${this.apiUrl}/auth/login`, payload, {
        withCredentials: true,
      })
      .pipe(
        tap((response) => {
          this.authService.checkAuthState();
          this.saveUserData({
            id: response.id,
            nome: response.nome,
            email: response.email,
            cargo: response.cargo,
          });
        })
      );
  }
  saveUserData(user: LoginResponseDTO): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  logout(): void {
    localStorage.removeItem('user');
  }
}
