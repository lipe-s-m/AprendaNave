import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AulaDTO } from '../../shared/interfaces/aulas';
import { ConcluirAulaResponse, UserProgress } from '../../shared/interfaces/user.interface';
import { UserService } from '../user/user.service';

interface ProgressoAulasCache {
  userId: number;
  aulaIds: number[];
  sincronizadoEm: string;
}

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

  constructor(
    private readonly http: HttpClient,
    private readonly userService: UserService
  ) {}

  private getCurrentUserId(): number | null {
    return this.userService.getUserSignal()()?.id ?? null;
  }

  /**
   * Carrega as aulas aprovadas do módulo.
   * Só emite a lista depois que o progresso (cache ou servidor) estiver definido,
   * garantindo que a primeira renderização já esteja correta.
   */
  getAulas(moduloId: number): Observable<AulaDTO[]> {
    this.moduloAtual = moduloId;
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .get<AulaDTO[]>(`${this.apiUrl}/modulos/${moduloId}/aulas/aprovadas`)
      .pipe(
        switchMap((aulas) => {
          this.aulasSignal.set(aulas);
          const userId = this.getCurrentUserId();

          if (userId === null) {
            this.concluidasSignal.set(new Set());
            return of(aulas);
          }

          return this.carregarConclusoes(userId, moduloId).pipe(
            map((concluidas) => {
              // Não aplicar resposta atrasada de outro módulo
              if (this.moduloAtual !== moduloId) {
                return aulas;
              }
              this.concluidasSignal.set(concluidas);
              return aulas;
            })
          );
        }),
        tap(() => this.loadingSignal.set(false)),
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

  /** Busca progresso consolidado do usuário logado (servidor é a verdade). */
  getUserProgress(): Observable<UserProgress> {
    return this.http.get<UserProgress>(`${this.apiUrl}/user/progresso`);
  }

  /**
   * Marca aula como concluída no servidor (fonte da verdade).
   * Só atualiza estado local após sucesso do servidor.
   * Salva o cache por usuário e marca dirty para reconciliar na próxima abertura.
   */
  markAulaComoConcluida(aulaId: number): Observable<ConcluirAulaResponse> {
    return this.http
      .post<ConcluirAulaResponse>(`${this.apiUrl}/aulas/${aulaId}/concluir`, {})
      .pipe(
        tap(() => {
          const userId = this.getCurrentUserId();
          const atual = new Set(this.concluidasSignal());
          atual.add(aulaId);
          this.concluidasSignal.set(atual);
          if (userId !== null && this.moduloAtual !== null) {
            this.salvarCache(userId, this.moduloAtual, atual);
            // Dirty após salvar é intencional: nova abertura reconcilia com o servidor
            this.marcarCacheSujo(userId, this.moduloAtual);
          }
        })
      );
  }

  resetConclusoes(): void {
    const userId = this.getCurrentUserId();
    if (userId === null || this.moduloAtual === null) return;
    this.concluidasSignal.set(new Set());
    localStorage.removeItem(this.getStorageKey(userId, this.moduloAtual));
  }

  isAulaConcluida(aulaId: number): boolean {
    return this.concluidasSignal().has(aulaId);
  }

  /**
   * Limpa somente o estado em memória da sessão atual.
   * Não apaga caches de progresso (agora isolados por usuário).
   */
  limparEstadoDaSessao(): void {
    this.moduloAtual = null;
    this.aulasSignal.set([]);
    this.concluidasSignal.set(new Set());
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }

  /**
   * Carrega os IDs concluídos de um módulo para um usuário.
   * Usa cache local válido; caso contrário, busca no servidor.
   * Nunca faz subscribe interno — apenas retorna o Observable.
   */
  private carregarConclusoes(
    userId: number,
    moduloId: number
  ): Observable<Set<number>> {
    const cache = this.lerCache(userId, moduloId);

    // Cache válido e sem alterações desde o último sync — não chama a API
    if (cache !== null && !this.isCacheSujo(userId, moduloId)) {
      return of(cache);
    }

    return this.http
      .get<number[]>(`${this.apiUrl}/aulas/progresso/${moduloId}`)
      .pipe(
        map((serverIds) => new Set(serverIds)),
        tap((concluidas) => {
          this.salvarCache(userId, moduloId, concluidas);
          this.limparCacheSujo(userId, moduloId);
        }),
        catchError(() => {
          // Offline/falha: usa cache como fallback; sem cache, retorna vazio
          return of(this.lerCache(userId, moduloId) ?? new Set<number>());
        })
      );
  }

  // ── Cache helpers (isolados por usuário) ──

  private getStorageKey(userId: number, moduloId: number): string {
    return `aprendanave:progresso-aulas:v2:user-${userId}:modulo-${moduloId}`;
  }

  private getDirtyKey(userId: number, moduloId: number): string {
    return `aprendanave:progresso-aulas-dirty:v2:user-${userId}:modulo-${moduloId}`;
  }

  private lerCache(userId: number, moduloId: number): Set<number> | null {
    const raw = localStorage.getItem(this.getStorageKey(userId, moduloId));
    if (!raw) return null;

    try {
      const cache = JSON.parse(raw) as ProgressoAulasCache;
      if (cache.userId !== userId || !Array.isArray(cache.aulaIds)) {
        localStorage.removeItem(this.getStorageKey(userId, moduloId));
        return null;
      }
      return new Set(cache.aulaIds);
    } catch {
      localStorage.removeItem(this.getStorageKey(userId, moduloId));
      return null;
    }
  }

  private salvarCache(
    userId: number,
    moduloId: number,
    aulaIds: Set<number>
  ): void {
    const cache: ProgressoAulasCache = {
      userId,
      aulaIds: [...aulaIds],
      sincronizadoEm: new Date().toISOString(),
    };
    localStorage.setItem(
      this.getStorageKey(userId, moduloId),
      JSON.stringify(cache)
    );
  }

  private isCacheSujo(userId: number, moduloId: number): boolean {
    return localStorage.getItem(this.getDirtyKey(userId, moduloId)) === '1';
  }

  private marcarCacheSujo(userId: number, moduloId: number): void {
    localStorage.setItem(this.getDirtyKey(userId, moduloId), '1');
  }

  private limparCacheSujo(userId: number, moduloId: number): void {
    localStorage.removeItem(this.getDirtyKey(userId, moduloId));
  }
}
