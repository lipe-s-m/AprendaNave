import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, UserResponse } from '../../shared/interfaces/user.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  registerUser(userData: Omit<User, 'id'>): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/users`, userData);
  }

  // Use GET to query users by email+senha so we don't accidentally create users on login
  login(credentials: {
    email: string;
    senha: string;
  }): Observable<UserResponse> {
    const params = { email: credentials.email, senha: credentials.senha };

    return this.http.get<User[]>(`${this.apiUrl}/users`, { params }).pipe(
      map((users) => {
        if (!users || users.length === 0) {
          // emulate HTTP 401 response for invalid credentials
          throw new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            error: { message: 'Email ou senha inválidos' },
          });
        }

        const user = users[0];
        const token = 'mock_token_' + Math.random().toString(36).substr(2);
        const userSafe: User = { ...user };
        // remove password before returning
        delete (userSafe as any).senha;

        return { token, user: userSafe } as UserResponse;
      })
    );
  }

  saveUserSession(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
