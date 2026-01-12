import { HttpClient } from '@angular/common/http';
import { Injectable, signal, WritableSignal } from '@angular/core';
import { User } from '../../shared/interfaces/user.interface';
import { environment } from '../../../environments/environment';

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
      console.log('Usuário definido/atualizado:', user.nome);
    } else {
      this.user.set(null); // Para logout
    }
  }

  setUserPoints(pontos: number) {
    console.log('to aw');

    const currentUser = this.user();
    console.log(currentUser);

    if (currentUser) {
      this.http
        .patch(`${this.apiUrl}/user/${currentUser.id}/pontos`, {
          pontos: pontos,
        })
        .subscribe({
          next: (response: any) => {
            console.log('Pontos atualizados com sucesso:', response);
            this.user.update((user) =>
              user ? { ...user, pontos: response } : user
            );
            localStorage.setItem('userData', JSON.stringify(this.user()));
          },
          error: (error) => {
            console.error('Erro ao atualizar pontos:', error);
          },
        });
    }
  }
}
