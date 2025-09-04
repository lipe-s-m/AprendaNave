import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TrilhaService } from '../../services/trilha/trilha.service';
import { Trilha, Modulo } from '../../models/trilha.model';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-modulo',
  standalone: true,
  imports: [CommonModule],
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

  marcarConcluido(): void {
    if (this.trilhaId && this.moduloId) {
      this.trilhaService
        .atualizarStatusModulo(this.trilhaId, this.moduloId, 'CONCLUIDO')
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
}
