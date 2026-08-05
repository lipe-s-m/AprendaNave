import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, Subject, catchError, map, of, switchMap } from 'rxjs';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { RankingService } from '../../services/ranking/ranking.service';
import { UserService } from '../../services/user/user.service';
import {
  RankingCategoria,
  RankingEntrada,
  RankingResposta,
} from '../../shared/interfaces/ranking.interface';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule, SubheaderComponent, LoaderComponent, EmptyStateComponent],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.scss',
})
export class RankingComponent implements OnInit, OnDestroy {
  categorias = signal<RankingCategoria[]>([]);
  categoriaSelecionada = signal<string>('desafio-matematica');
  ranking = signal<RankingResposta | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  private readonly slugSubject = new Subject<string>();
  private readonly userService = inject(UserService);

  constructor(
    private rankingService: RankingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Resposta lenta da categoria A nunca substitui a categoria B (switchMap)
    this.slugSubject
      .pipe(switchMap((slug) => this.buscarRanking(slug)))
      .subscribe((resposta) => {
        if (resposta) this.ranking.set(resposta);
      });

    this.rankingService.getCategorias().subscribe({
      next: (cats) => {
        this.categorias.set(cats);
        const inicial =
          cats.find((c) => c.slug === 'desafio-matematica') ?? cats[0];
        if (inicial) {
          this.categoriaSelecionada.set(inicial.slug);
          this.slugSubject.next(inicial.slug);
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.error.set('Erro ao carregar as categorias.');
        this.isLoading.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.slugSubject.complete();
  }

  private buscarRanking(slug: string): Observable<RankingResposta | null> {
    this.isLoading.set(true);
    this.error.set(null);
    return this.rankingService.getRanking(slug).pipe(
      map((resposta) => {
        this.isLoading.set(false);
        return resposta;
      }),
      catchError(() => {
        this.error.set('Erro ao carregar o ranking. Tente novamente.');
        this.isLoading.set(false);
        return of(null);
      })
    );
  }

  selecionarCategoria(slug: string): void {
    if (this.categoriaSelecionada() === slug) return;
    this.categoriaSelecionada.set(slug);
    this.slugSubject.next(slug);
  }

  podium(): RankingEntrada[] {
    return this.ranking()?.entradas.slice(0, 3) ?? [];
  }

  demais(): RankingEntrada[] {
    return this.ranking()?.entradas.slice(3) ?? [];
  }

  medalha(posicao: number): string {
    switch (posicao) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  }

  /** Iniciais do nome como fallback quando não há foto. */
  iniciais(nome: string): string {
    return nome
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  ehVoce(entrada: RankingEntrada): boolean {
    const meuId = this.userService.getUserSignal()()?.id;
    return meuId !== undefined && meuId !== null && entrada.idAluno === meuId;
  }

  /** Card fixo "Seu desempenho" só quando o usuário está fora das entradas exibidas. */
  seuDesempenhoSeparado(): boolean {
    const r = this.ranking();
    if (!r?.meuRanking) return false;
    return !r.entradas.some((e) => e.idAluno === r.meuRanking!.idAluno);
  }

  emptyActionText(): string {
    return this.categoriaSelecionada() === 'desafio-matematica'
      ? 'Seja o primeiro a jogar'
      : 'Começar a estudar';
  }

  emptyAction(): void {
    if (this.categoriaSelecionada() === 'desafio-matematica') {
      this.router.navigate(['/desafio-matematica']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  jogarDesafio(): void {
    this.router.navigate(['/desafio-matematica']);
  }
}
