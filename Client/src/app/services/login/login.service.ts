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
import { UserService } from '../user/user.service';

const TOKEN_KEY = 'authToken';
@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService
  ) {}

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
          if (response.pontos === undefined || response.pontos === null) {
            response.pontos = 0;
          }
          this.saveUserData({
            id: response.id,
            nome: response.nome,
            email: response.email,
            cargo: response.cargo,
            pontos: response.pontos,
          });
        })
      );
  }
  saveUserData(user: LoginResponseDTO): void {
    this.userService.setUser(user);
  }

  logout(): void {
    localStorage.removeItem('userData');
    localStorage.removeItem('pontos');
  }
}
