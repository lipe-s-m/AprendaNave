import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ThemeService } from '../../services/theme/theme.service';
import { Subscription } from 'rxjs';
import { TrilhaService } from '../../services/trilha/trilha.service';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { CursoService } from '../../services/curso/curso.service';
import { Curso } from '../../shared/interfaces/curso.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LoaderComponent, SubheaderComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  isDarkMode = true;
  cursos: Curso[] = [];
  isLoading = true;
  error: string | null = null;
  private themeSubscription?: Subscription;
  private cursoSubscription?: Subscription;

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private themeService: ThemeService,
    private cursoService: CursoService
  ) {}

  ngOnInit() {
    console.log('oi');

    // Subscreve às mudanças de tema
    this.themeSubscription = this.themeService.theme$.subscribe((theme) => {
      this.isDarkMode = theme === 'dark';
    });

    // Carrega as trilhas
    this.loadCursos();

    this.cursoService.getCursos().subscribe({
      next: (cursos) => {
        console.log(cursos);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.cursoSubscription) {
      this.cursoSubscription.unsubscribe();
    }
    localStorage.removeItem('cursos');
  }

  loadCursos(): void {
    this.isLoading = true;
    this.error = null;

    this.cursoSubscription = this.cursoService.getCursos().subscribe({
      next: (cursos) => {
        this.cursos = cursos;
        this.isLoading = false;
        console.log(this.cursos);
      },
      error: (err) => {
        this.error = 'Erro ao carregar cursos: ' + err.message;
        this.isLoading = false;
        this.toastr.error(this.error, 'Erro');
      },
    });
  }

  goToTrilha(id: number, nome: string) {
    this.router.navigate(['/trilha', id, nome]);
  }
}
