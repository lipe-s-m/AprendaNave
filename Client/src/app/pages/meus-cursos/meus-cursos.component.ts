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

@Component({
  selector: 'app-meus-cursos',
  standalone: true,
  imports: [CommonModule, LoaderComponent, SubheaderComponent, ButtonComponent],
  templateUrl: './meus-cursos.component.html',
  styleUrl: './meus-cursos.component.scss',
})
export class MeusCursosComponent implements OnInit, OnDestroy {
  cursos = signal<Curso[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  private cursosSubscription?: Subscription;

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

  getStatusBadge(status?: number): {
    text: string;
    class: string;
  } {
    switch (status) {
      case 0:
        return { text: 'Pendente', class: 'status-pendente' };
      case 1:
        return { text: 'Aprovado', class: 'status-aprovado' };
      case 2:
        return { text: 'Rejeitado', class: 'status-rejeitado' };
      default:
        return { text: 'Desconhecido', class: 'status-unknown' };
    }
  }

  handleDelete(cursoId: number, event: Event): void {
    event.stopPropagation();
    this.toastr.info('Funcionalidade em desenvolvimento', 'Info');
  }

  goToCurso(curso: Curso): void {
    // Navegar para detalhes do curso quando implementado
    this.router.navigate(['/trilha', curso.id]);
  }
}
