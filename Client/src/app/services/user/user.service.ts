import { HttpClient } from '@angular/common/http';
import { Injectable, signal, WritableSignal } from '@angular/core';
import { User } from '../../shared/interfaces/user.interface';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly user = signal<User | null>(this.loadUserData());
  private apiUrl: string = environment.apiUrl;
  constructor(private http: HttpClient) {}

  loadUserData(): User | null {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }
  saveUserData(user: User): void {
    localStorage.setItem('userData', JSON.stringify(user));
    this.user.set(user);
  }

  getUserSignal(): WritableSignal<User | null> {
    return this.user;
  }

  setUser(user: User | null) {
    if (user) {
      this.user.set(user);
      this.saveUserData(user);
    } else {
      this.user.set(null); // Para logout
    }
  }

  setUserPoints(pontos: number) {
    const currentUser = this.user();
    if (currentUser) {
      this.http
        .patch(`${this.apiUrl}/user/${currentUser.id}/pontos`, {
          pontos: pontos,
        })
        .subscribe({
          next: (response: any) => {
            this.user.update((user) =>
              user ? { ...user, pontos: response } : user
            );
            localStorage.setItem('userData', JSON.stringify(this.user()));
          },
          error: () => {},
        });
    }
  }

  updateUsuarioData(data: { nome?: string; bio?: string }): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/user`, data).pipe(
      tap((updatedUser) => {
        this.setUser(updatedUser);
      })
    );
  }

  updateUsuarioFoto(file: File): Observable<User> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.patch<User>(`${this.apiUrl}/user/image`, formData).pipe(
      tap((updatedUser) => {
        this.setUser(updatedUser);
      })
    );
  }
}
