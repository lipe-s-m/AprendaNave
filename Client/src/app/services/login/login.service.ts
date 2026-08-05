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
  GuestRequestDTO,
  GuestResponseDTO,
} from '../../shared/interfaces/user.interface';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { AulaService } from '../aula/aula.service';

const TOKEN_KEY = 'authToken';
@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private userService: UserService,
    private aulaService: AulaService
  ) {}

  createGuestAccount(userData: GuestRequestDTO): Observable<GuestResponseDTO> {
    let payload = {
      nome: userData.nome,
      contato: userData.contato,
    };
    return this.http.post<GuestResponseDTO>(`${this.apiUrl}/guests`, payload);
  }

  registerUser(userData: Omit<UserDTO, 'id'>): Observable<CadastroResponseDTO> {
    let payload = {
      nome: userData.nome,
      email: userData.email,
      senha: userData.senha,
      senhaConfirmacao: userData.confirmarSenha,
    };

    return this.http.post<CadastroResponseDTO>(`${this.apiUrl}/user`, payload);
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
          // Isolar a sessão anterior (estado em memória) sem apagar caches por usuário
          this.aulaService.limparEstadoDaSessao();
          if (response.pontos === undefined || response.pontos === null) {
            response.pontos = 0;
          }
          this.saveUserData(response);
          this.authService.checkAuthState();
        })
      );
  }
  saveUserData(user: LoginResponseDTO): void {
    this.userService.setUser({ ...user, cargo: (user as any).cargo });
  }

  logout(): void {
    this.aulaService.limparEstadoDaSessao();
    this.http
      .post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe();
    this.authService.logout();
    // Limpar apenas chaves de sessão — caches de progresso ficam isolados por usuário
    localStorage.removeItem('userData');
    localStorage.removeItem(TOKEN_KEY);
  }
}
