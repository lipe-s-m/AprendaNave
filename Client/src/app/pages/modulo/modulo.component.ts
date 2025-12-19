import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TrilhaService } from '../../services/trilha/trilha.service';
import { Trilha, Modulo } from '../../models/trilha.model';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AulaService } from '../../services/aula/aula.service';
import { AulaDTO } from '../../shared/interfaces/aulas';
import { NavigationStateService } from '../../services/navigation-state/navigation-state.service';

type AulaViewModel = AulaDTO & { concluida: boolean };

@Component({
  selector: 'app-modulo',
  standalone: true,
  imports: [CommonModule, LoaderComponent, SubheaderComponent, ButtonComponent],
  templateUrl: './modulo.component.html',
  styleUrl: './modulo.component.scss',
})
export class ModuloComponent implements OnInit, OnDestroy {
  private readonly navState = inject(NavigationStateService);

  trilha: Trilha | null = null;
  modulo: Modulo | null = null;
  isLoading = true;
  error: string | null = null;
  aulas: AulaViewModel[] = [];

  private subscription: Subscription | null = null;
  private aulasSubscription: Subscription | null = null;

  get trilhaId(): number | null {
    return this.navState.cursoId();
  }

  get moduloId(): number | null {
    return this.navState.moduloId();
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trilhaService: TrilhaService,
    private aulaService: AulaService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe((params) => {
      const trilhaId = params.get('trilhaId');
      const moduloId = params.get('moduloId');

      const cursoIdNum = trilhaId !== null ? Number(trilhaId) : null;
      const moduloIdNum = moduloId !== null ? Number(moduloId) : null;

      this.navState.setCurso(cursoIdNum);
      this.navState.setModulo(moduloIdNum);

      if (cursoIdNum !== null && moduloIdNum !== null) {
        this.loadTrilhaEModulo(cursoIdNum, moduloIdNum);
      } else {
        this.error = 'ID de trilha ou módulo inválido';
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    localStorage.removeItem('trilhas');
    this.subscription?.unsubscribe();
    this.aulasSubscription?.unsubscribe();
  }

  loadTrilhaEModulo(trilhaId: number, moduloId: number): void {
    this.isLoading = true;
    this.error = null;

    this.trilhaService.getTrilhaById(trilhaId).subscribe({
      next: (trilha) => {
        this.trilha = trilha;

        // Encontrar o módulo correspondente
        this.modulo = trilha.modulos.find((m) => m.id === moduloId) || null;

        if (!this.modulo) {
          this.error = `Módulo com ID ${moduloId} não encontrado na trilha`;
          this.isLoading = false;
        } else {
          this.carregarAulas(this.modulo.id);
        }
      },
      error: (err) => {
        this.error = 'Erro ao carregar a trilha: ' + err.message;
        this.isLoading = false;
        this.toastr.error(this.error, 'Erro');
      },
    });
  }
  irParaTesteFinal(): void {
    if (this.trilhaId && this.moduloId) {
      this.router.navigate(['/teste-final', this.trilhaId, this.moduloId]);
    }
  }
  resetarAulas(): void {
    this.aulaService.resetConclusoes();
    this.sincronizarConclusoesLocais();
  }
  marcarConcluido(): void {
    if (this.trilhaId && this.moduloId) {
      this.aulas.forEach((aula) => this.marcarConclusaoLocal(aula.id));
      this.sincronizarConclusoesLocais();
      this.atualizarStatusModulo();
    }
  }

  private atualizarStatusModulo(): void {
    this.trilhaService
      .atualizarStatusModulo(this.trilhaId!, this.moduloId!, 'CONCLUIDO')
      .subscribe({
        next: (trilha) => {
          this.trilha = trilha;
          this.modulo =
            trilha.modulos.find((m) => m.id === this.moduloId) || null;
          this.toastr.success('Módulo concluído com sucesso!', 'Parabéns');

          // Navegar de volta para a trilha após 2 segundos
          setTimeout(() => {
            this.router.navigate(['/trilha', this.trilhaId]);
          }, 2000);
        },
        error: (err) => {
          this.toastr.error(err.message, 'Erro');
        },
      });
  }

  voltarParaTrilha(): void {
    if (this.trilhaId) {
      this.router.navigate(['/trilha', this.trilhaId]);
    }
  }

  getNivelClass(nivel?: string): string {
    switch (nivel) {
      case 'INICIANTE':
        return 'nivel-iniciante';
      case 'INTERMEDIÁRIO':
        return 'nivel-intermediario';
      case 'AVANÇADO':
        return 'nivel-avancado';
      default:
        return 'nivel-iniciante';
    }
  }

  todasAulasConcluidas(): boolean {
    return this.aulaService.progresso().todasConcluidas;
  }

  podeConcluirModulo(): boolean {
    return this.modulo?.status !== 'CONCLUIDO' && this.todasAulasConcluidas();
  }

  iniciarAula(aula: AulaViewModel): void {
    if (!this.trilhaId || !this.moduloId) return;

    // Navegar para a página da aula
    this.router.navigate(['/aula', this.trilhaId, this.moduloId, aula.id]);

    this.marcarConclusaoLocal(aula.id);
    this.sincronizarConclusoesLocais();
  }

  private carregarAulas(moduloId: number): void {
    this.isLoading = true;
    this.aulasSubscription?.unsubscribe();
    this.aulasSubscription = this.aulaService.loadAulas(moduloId).subscribe({
      next: (aulas) => {
        this.aulas = aulas.map((aula) => ({
          ...aula,
          concluida: this.aulaService.isAulaConcluida(aula.id),
        }));

        if (this.modulo) {
          this.modulo.aulas = this.aulas.length;
        }

        this.aplicarRegraStatusModulo();
        this.sincronizarConclusoesLocais();
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar aulas: ' + err.message;
        this.isLoading = false;
        this.toastr.error(this.error, 'Erro');
      },
    });
  }

  private aplicarRegraStatusModulo(): void {
    if (!this.modulo) {
      return;
    }

    if (this.modulo.status === 'CONCLUIDO') {
      this.aulas.forEach((aula) => this.marcarConclusaoLocal(aula.id));
    } else if (
      this.modulo.status === 'EM_ANDAMENTO' &&
      !this.aulas.some((aula) => aula.concluida)
    ) {
      const primeiraAula = this.aulas[0];
      if (primeiraAula) {
        this.marcarConclusaoLocal(primeiraAula.id);
      }
    }
  }

  private marcarConclusaoLocal(aulaId: number): void {
    if (!this.aulaService.isAulaConcluida(aulaId)) {
      this.aulaService.markAulaComoConcluida(aulaId);
    }
  }

  private sincronizarConclusoesLocais(): void {
    this.aulas = this.aulas.map((aula) => ({
      ...aula,
      concluida: this.aulaService.isAulaConcluida(aula.id),
    }));
  }
}
