import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AulaDTO } from '../../shared/interfaces/aulas';

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

  constructor(private readonly http: HttpClient) {}

  loadAulas(moduloId: number): Observable<AulaDTO[]> {
    if (this.moduloAtual !== moduloId) {
      this.restaurarConclusoesLocais(moduloId);
      this.moduloAtual = moduloId;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .get<AulaDTO[]>(`${this.apiUrl}/modulos/${moduloId}/aulas`)
      .pipe(
        tap((aulas) => {
          this.aulasSignal.set(aulas);
          this.loadingSignal.set(false);
        }),
        catchError((error) => {
          this.loadingSignal.set(false);
          this.errorSignal.set('Não foi possível carregar as aulas.');
          return throwError(() => error);
        })
      );
  }

  markAulaComoConcluida(aulaId: number): void {
    if (!this.moduloAtual) return;
    const atual = new Set(this.concluidasSignal());
    atual.add(aulaId);
    this.concluidasSignal.set(atual);
    this.persistirConclusoesLocais(this.moduloAtual, atual);
  }

  resetConclusoes(): void {
    if (!this.moduloAtual) return;
    this.concluidasSignal.set(new Set());
    localStorage.removeItem(this.getStorageKey(this.moduloAtual));
  }

  isAulaConcluida(aulaId: number): boolean {
    return this.concluidasSignal().has(aulaId);
  }

  getAulaById(aulaId: number): AulaDTO | undefined {
    return this.aulasSignal().find((aula) => aula.id === aulaId);
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
