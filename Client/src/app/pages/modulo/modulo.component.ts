import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TrilhaService } from '../../services/trilha/trilha.service';
import { Trilha, Modulo, Aula } from '../../models/trilha.model';
import { Observable, Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-modulo',
  standalone: true,
  imports: [CommonModule, LoaderComponent, SubheaderComponent, ButtonComponent],
  templateUrl: './modulo.component.html',
  styleUrl: './modulo.component.scss',
})
export class ModuloComponent implements OnInit, OnDestroy {
  trilhaId: number | null = null;
  moduloId: number | null = null;
  trilha: Trilha | null = null;
  modulo: Modulo | null = null;
  isLoading = true;
  error: string | null = null;
  aulas: any[] = [];

  private subscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trilhaService: TrilhaService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe((params) => {
      const trilhaId = params.get('trilhaId');
      const moduloId = params.get('moduloId');

      this.trilhaId = trilhaId !== null ? Number(trilhaId) : null;
      this.moduloId = moduloId !== null ? Number(moduloId) : null;

      if (this.trilhaId !== null && this.moduloId !== null) {
        this.loadTrilhaEModulo(this.trilhaId, this.moduloId);
      } else {
        this.error = 'ID de trilha ou módulo inválido';
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    localStorage.removeItem('trilhas');
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
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
        } else {
          // Carregar as aulas do módulo
          this.aulas = this.modulo.aulasList || [];

          // Atualiza o número de aulas no módulo para refletir o número real de aulas
          this.modulo.aulas = this.aulas.length;

          // Se o módulo estiver marcado como concluído, marque todas as aulas como concluídas
          if (this.modulo.status === 'CONCLUIDO') {
            this.aulas.forEach((aula) => {
              aula.concluida = true;
            });
          }
          // Se o módulo estiver em andamento mas nenhuma aula estiver concluída,
          // marque pelo menos a primeira aula como concluída
          else if (
            this.modulo.status === 'EM_ANDAMENTO' &&
            !this.aulas.some((a) => a.concluida)
          ) {
            if (this.aulas.length > 0) {
              this.aulas[0].concluida = true;
            }
          }
        }

        this.isLoading = false;
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
    this.aulas.forEach((aula) => {
      aula.concluida = false;
    });
  }
  marcarConcluido(): void {
    if (this.trilhaId && this.moduloId) {
      // Primeiro, vamos marcar todas as aulas como concluídas
      const promises: Observable<Trilha>[] = [];

      // Para cada aula não concluída, criamos uma Promise para atualizá-la
      this.aulas.forEach((aula) => {
        if (!aula.concluida) {
          promises.push(
            this.trilhaService.atualizarStatusAula(
              this.trilhaId!,
              this.moduloId!,
              aula.id,
              true
            )
          );
        }
      });

      // Se não houver aulas para concluir, ou após todas as atualizações,
      // marcamos o módulo como concluído
      if (promises.length === 0) {
        this.atualizarStatusModulo();
      } else {
        // Utilizamos o último Observable para atualizar o módulo após todas as aulas serem atualizadas
        promises[promises.length - 1].subscribe({
          next: () => {
            // Marcar todas as aulas como concluídas na interface
            this.aulas.forEach((aula) => {
              aula.concluida = true;
            });

            // Agora atualizamos o status do módulo
            this.atualizarStatusModulo();
          },
          error: (err: any) => {
            this.toastr.error('Erro ao concluir as aulas', 'Erro');
            console.error('Erro ao concluir as aulas:', err);
          },
        });
      }
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
    return this.aulas.every((aula) => aula.concluida === true);
  }

  podeConcluirModulo(): boolean {
    return this.modulo?.status !== 'CONCLUIDO' && this.todasAulasConcluidas();
  }

  iniciarAula(aula: any): void {
    if (!this.trilhaId || !this.moduloId) return;

    // Navegar para a página da aula
    this.router.navigate(['/aula', this.trilhaId, this.moduloId, aula.id]);

    // Marca a aula como concluída
    aula.concluida = true;

    // Atualiza o estado no localStorage
    if (this.trilha && this.modulo) {
      this.trilhaService
        .atualizarStatusAula(this.trilhaId, this.moduloId, aula.id, true)
        .subscribe({
          next: (trilhaAtualizada) => {
            // Atualiza a trilha e o módulo com os dados atualizados
            this.trilha = trilhaAtualizada;
            this.modulo =
              trilhaAtualizada.modulos.find((m) => m.id === this.moduloId) ||
              null;

            // Verifica se todas as aulas estão concluídas
            const todasAulasConcluidas = this.aulas.every((a) => a.concluida);
          },
          error: (err: any) => {
            this.toastr.error('Erro ao atualizar status da aula', 'Erro');
            console.error('Erro ao atualizar status da aula:', err);
          },
        });
    }
  }
}
