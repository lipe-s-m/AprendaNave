import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ThemeService } from '../../services/theme/theme.service';
import { Subscription } from 'rxjs';
import { TrilhaService } from '../../services/trilha/trilha.service';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { DesafioJccService } from '../../services/desafio-jcc/desafio-jcc.service';
import { Curso } from '../../models/curso.model';
import { CursoService } from '../../services/curso/curso.service';
import { NavigationStateService } from '../../services/navigation-state/navigation-state.service';

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
  qtdDesafiantesJCC: number = 0;
  private themeSubscription?: Subscription;
  private cursoSubscription?: Subscription;
  private readonly navState = inject(NavigationStateService);

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private themeService: ThemeService,
    private cursoService: CursoService,
    private desafioJccService: DesafioJccService
  ) {}

  ngOnInit() {
    // Subscreve às mudanças de tema
    this.themeSubscription = this.themeService.theme$.subscribe((theme) => {
      this.isDarkMode = theme === 'dark';
    });

    // Carrega as trilhas
    this.loadCursos();
    this.loadDesafiantesJCC();
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
      },
      error: (err) => {
        this.error = 'Erro ao carregar cursos: ' + err.message;
        this.isLoading = false;
        this.toastr.error(this.error, 'Erro');
      },
    });
  }
  loadDesafiantesJCC(): void {
    this.isLoading = true;
    this.desafioJccService.obterTodosDesafiantes().subscribe({
      next: (desafiantes) => {
        // Processar os desafiantes conforme necessário
        this.qtdDesafiantesJCC = desafiantes.length;
      },
      error: (err) => {
        this.error = 'Erro ao carregar desafiantes: ' + err.message;
        console.log(err);
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }
  goToTrilha(id: number, nome: string) {
    sessionStorage.setItem('cursoNome', nome);
    this.navState.setCurso(id, nome);
    this.router.navigate(['/trilha', id]);
  }
  goToDesafioJCC() {
    this.router.navigate(['/desafiojcc']);
  }
  goToAprendaBot() {
    this.router.navigate(['/aprendabot']);
  }
}
