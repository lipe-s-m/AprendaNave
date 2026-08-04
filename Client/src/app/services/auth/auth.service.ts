import { LoginService } from './../login/login.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponseDTO } from '../../shared/interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isAuthSubject = new BehaviorSubject<boolean>(false);
  private isAuth$ = this.isAuthSubject.asObservable();
  constructor(private http: HttpClient) {}

  checkAuthState(): Observable<boolean> {
    return this.http
      .get(`${this.apiUrl}/auth/validate-token`, {
        withCredentials: true,
      })
      .pipe(
        map(() => true),
        tap((isAuthenticated) => {
          this.isAuthSubject.next(isAuthenticated);
        }),
        catchError(() => {
          this.isAuthSubject.next(false);
          return of(false);
        })
      );
  }

  isLogged() {
    return this.isAuth$;
  }

  logout(): void {
    this.isAuthSubject.next(false);
  }
}
