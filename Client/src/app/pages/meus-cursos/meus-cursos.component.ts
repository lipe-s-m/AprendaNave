import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { CursoService } from '../../services/curso/curso.service';
import { Curso } from '../../models/curso.model';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { StatusBadgeComponent, StatusBadgeType } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-meus-cursos',
  standalone: true,
  imports: [
    CommonModule,
    LoaderComponent,
    SubheaderComponent,
    ButtonComponent,
    ConfirmModalComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
  ],
  templateUrl: './meus-cursos.component.html',
  styleUrl: './meus-cursos.component.scss',
})
export class MeusCursosComponent implements OnInit, OnDestroy {
  cursos = signal<Curso[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  private cursosSubscription?: Subscription;

  modalExcluir = signal<{ aberto: boolean; cursoId: number; mensagem: string }>({
    aberto: false, cursoId: 0, mensagem: '',
  });

  constructor(
    private cursoService: CursoService,
    public router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadMeusCursos();
  }

  ngOnDestroy(): void {
    if (this.cursosSubscription) {
      this.cursosSubscription.unsubscribe();
    }
  }

  loadMeusCursos(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.cursosSubscription = this.cursoService.getMeusCursos().subscribe({
      next: (cursos) => {
        this.cursos.set(cursos);
        this.isLoading.set(false);
      },
      error: (err) => {
        const errorMessage = 'Erro ao carregar seus cursos: ' + err.message;
        this.error.set(errorMessage);
        this.isLoading.set(false);
        this.toastr.error(errorMessage, 'Erro');
      },
    });
  }

  getStatusBadge(status?: number): { text: string; status: StatusBadgeType } {
    switch (status) {
      case 0: return { text: 'Pendente', status: 'warning' };
      case 1: return { text: 'Aprovado', status: 'success' };
      case 2: return { text: 'Rejeitado', status: 'error' };
      default: return { text: 'Desconhecido', status: 'neutral' };
    }
  }

  goToGerenciar(curso: Curso): void {
    this.router.navigate(['/curso', curso.id, 'gerenciar']);
  }

  /** Fallback quando a URL da logo falha. */
  onLogoError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/avatar-default.svg';
  }

  confirmarExcluir(curso: Curso): void {
    this.modalExcluir.set({
      aberto: true,
      cursoId: curso.id,
      mensagem: `Tem certeza que deseja excluir "${curso.nome}"? Todas as aulas e módulos serão removidos.`,
    });
  }

  fecharModalExcluir(): void {
    this.modalExcluir.set({ aberto: false, cursoId: 0, mensagem: '' });
  }

  executarExclusao(): void {
    const cursoId = this.modalExcluir().cursoId;
    this.cursoService.deleteCurso(cursoId).subscribe({
      next: () => {
        this.toastr.success('Curso excluído!', 'Sucesso');
        this.fecharModalExcluir();
        this.loadMeusCursos();
      },
      error: (err) => {
        this.toastr.error(err.error?.error || 'Erro ao excluir curso', 'Erro');
        this.fecharModalExcluir();
      },
    });
  }
}
