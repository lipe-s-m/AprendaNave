import { Component, OnDestroy, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TrilhaService } from '../../services/trilha/trilha.service';
import { Curso, Modulo } from '../../models/curso.model';
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
export class ModuloComponent implements OnDestroy {
  private readonly navState = inject(NavigationStateService);

  get cursoId(): number | null {
    return this.navState.cursoId();
  }

  get moduloId(): number | null {
    return this.navState.moduloId();
  }

  get nomeCurso(): string {
    return this.navState.nomeCurso() || '';
  }

  get nomeModulo(): string {
    return this.navState.nomeModulo() || '';
  }

  curso: Curso | null = null;
  modulo: Modulo | null = null;
  isLoading = true;
  error: string | null = null;
  aulas: AulaViewModel[] = [];
  private loadedModuloId: number | null = null;

  private aulasSubscription: Subscription | null = null;
  private route = inject(ActivatedRoute);
  constructor(
    private router: Router,
    private trilhaService: TrilhaService,
    private aulaService: AulaService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    let cursoId = this.navState.cursoId();
    let moduloId = this.navState.moduloId();
    if (!cursoId || !moduloId) {
      const cid = this.route.snapshot.paramMap.get('trilhaId');
      const mid = this.route.snapshot.paramMap.get('moduloId');

      console.log(cid);
      if (cid && mid) {
        cursoId = parseInt(cid, 10);
        moduloId = parseInt(mid, 10);

        // Atualiza o service para que outros componentes também saibam dos IDs
        console.log(`${cursoId} e ${moduloId}`);

        this.navState.updateIdContexto(cursoId, moduloId, null);
      }
    }
    if (this.loadedModuloId === moduloId) {
      return;
    }

    this.error = null;
    this.loadedModuloId = moduloId;
    moduloId ? this.carregarAulas(moduloId) : null;
  }

  ngOnDestroy(): void {
    localStorage.removeItem('trilhas');
    this.aulasSubscription?.unsubscribe();
  }

  irParaTesteFinal(): void {
    if (this.cursoId && this.moduloId) {
      this.router.navigate(['/teste-final', this.cursoId, this.moduloId]);
    }
  }
  resetarAulas(): void {
    this.aulaService.resetConclusoes();
    this.sincronizarConclusoesLocais();
  }
  marcarConcluido(): void {
    if (this.cursoId && this.moduloId) {
      this.aulas.forEach((aula) => this.marcarConclusaoLocal(aula.idAula));
      this.sincronizarConclusoesLocais();
      this.atualizarStatusModulo();
    }
  }

  private atualizarStatusModulo(): void {
    this.trilhaService
      .atualizarStatusModulo(this.cursoId!, this.moduloId!, 'CONCLUIDO')
      .subscribe({
        next: (curso) => {
          this.curso = curso;
          this.modulo =
            curso.modulos.find((c: Modulo) => c.id === this.moduloId) || null;
          this.toastr.success('Módulo concluído com sucesso!', 'Parabéns');

          // Navegar de volta para a trilha após 2 segundos
          setTimeout(() => {
            this.router.navigate(['/trilha', this.cursoId]);
          }, 2000);
        },
        error: (err) => {
          this.toastr.error(err.message, 'Erro');
        },
      });
  }

  voltarParaTrilha(): void {
    if (this.cursoId) {
      this.router.navigate(['/trilha', this.cursoId]);
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
    if (!this.cursoId || !this.moduloId) return;

    // Navegar para a página da aula
    this.navState.updateIdContexto(this.cursoId, this.moduloId, aula.idAula);
    this.router.navigate(['/aula', this.cursoId, this.moduloId, aula.idAula]);

    this.marcarConclusaoLocal(aula.idAula);
    this.sincronizarConclusoesLocais();
  }

  private carregarAulas(moduloId: number): void {
    console.log('tester');

    this.isLoading = true;
    this.aulasSubscription?.unsubscribe();
    this.aulasSubscription = this.aulaService.getAulas(moduloId).subscribe({
      next: (aulas) => {
        this.aulas = aulas
          .sort((a, b) => a.ordemAula - b.ordemAula)
          .map((aula) => ({
            ...aula,
            concluida: this.aulaService.isAulaConcluida(aula.idAula),
          }));
        console.log(aulas);
        this.navState.setAulas(this.aulas);
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
      this.aulas.forEach((aula) => this.marcarConclusaoLocal(aula.idAula));
    } else if (
      this.modulo.status === 'EM_ANDAMENTO' &&
      !this.aulas.some((aula) => aula.concluida)
    ) {
      const primeiraAula = this.aulas[0];
      if (primeiraAula) {
        this.marcarConclusaoLocal(primeiraAula.idAula);
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
      concluida: this.aulaService.isAulaConcluida(aula.idAula),
    }));
  }
}
