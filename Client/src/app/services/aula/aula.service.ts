import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AulaDTO } from '../../shared/interfaces/aulas';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AulaService {
  private readonly apiUrl = environment.apiUrl;
  private readonly aulasSignal = signal<AulaDTO[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly concluidasSignal = signal<Set<number>>(new Set());
  private moduloAtual: number | null = null;
  private isAuthenticated = false;

  readonly aulas = computed(() => this.aulasSignal());
  readonly isLoading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());
  readonly progresso = computed(() => {
    const aulas = this.aulasSignal();
    const concluidas = this.concluidasSignal();
    return {
      total: aulas.length,
      concluidas: concluidas.size,
      todasConcluidas: aulas.length > 0 && concluidas.size === aulas.length,
    };
  });

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {
    this.authService.isLogged().subscribe((logged) => {
      this.isAuthenticated = logged;
    });
  }

  getAulas(moduloId: number): Observable<AulaDTO[]> {
    if (this.moduloAtual !== moduloId) {
      this.restaurarConclusoesLocais(moduloId);
      this.moduloAtual = moduloId;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .get<AulaDTO[]>(`${this.apiUrl}/modulos/${moduloId}/aulas/aprovadas`)
      .pipe(
        tap((aulas) => {
          this.aulasSignal.set(aulas);
          this.loadingSignal.set(false);
          this.sincronizarProgressoServidor(moduloId);
        }),
        catchError((error) => {
          this.loadingSignal.set(false);
          this.errorSignal.set('Não foi possível carregar as aulas.');
          return throwError(() => error);
        })
      );
  }

  getAulaById(aulaId: number): Observable<AulaDTO> {
    return this.http.get<AulaDTO>(`${this.apiUrl}/aulas/${aulaId}`);
  }

  markAulaComoConcluida(aulaId: number): void {
    if (!this.moduloAtual) return;
    const atual = new Set(this.concluidasSignal());
    atual.add(aulaId);
    this.concluidasSignal.set(atual);
    this.persistirConclusoesLocais(this.moduloAtual, atual);

    // Fire and forget: persist server-side if authenticated
    if (this.isAuthenticated) {
      this.http
        .post(`${this.apiUrl}/aulas/${aulaId}/concluir`, {})
        .subscribe({
          error: () => {
            // Silently ignore - localStorage keeps the data as fallback
          },
        });
    }
  }

  resetConclusoes(): void {
    if (!this.moduloAtual) return;
    this.concluidasSignal.set(new Set());
    localStorage.removeItem(this.getStorageKey(this.moduloAtual));
  }

  isAulaConcluida(aulaId: number): boolean {
    return this.concluidasSignal().has(aulaId);
  }

  private sincronizarProgressoServidor(moduloId: number): void {
    if (!this.isAuthenticated) return;

    this.http
      .get<number[]>(`${this.apiUrl}/aulas/progresso/${moduloId}`)
      .subscribe({
        next: (serverIds) => {
          const localConcluidas = this.concluidasSignal();
          const merged = new Set([...localConcluidas, ...serverIds]);
          this.concluidasSignal.set(merged);
          this.persistirConclusoesLocais(moduloId, merged);
        },
        error: () => {
          // Silently ignore - keep localStorage data as fallback
        },
      });
  }

  private restaurarConclusoesLocais(moduloId: number) {
    const stored = localStorage.getItem(this.getStorageKey(moduloId));
    if (!stored) {
      this.concluidasSignal.set(new Set());
      return;
    }

    try {
      const parsed: number[] = JSON.parse(stored);
      this.concluidasSignal.set(new Set(parsed));
    } catch {
      this.concluidasSignal.set(new Set());
    }
  }

  private persistirConclusoesLocais(moduloId: number, concluidas: Set<number>) {
    localStorage.setItem(
      this.getStorageKey(moduloId),
      JSON.stringify(Array.from(concluidas))
    );
  }

  private getStorageKey(moduloId: number): string {
    return `aulas-concluidas-${moduloId}`;
  }
}
