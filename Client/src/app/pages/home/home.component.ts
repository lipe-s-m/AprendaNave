import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login/login.service';
import { ToastrService } from 'ngx-toastr';
import { ThemeService } from '../../services/theme/theme.service';
import { Subscription } from 'rxjs';
import { TrilhaService } from '../../services/trilha/trilha.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  isDarkMode = true;
  trilhas: any[] = [];
  isLoading = true;
  error: string | null = null;
  private themeSubscription?: Subscription;
  private trilhasSubscription?: Subscription;

  constructor(
    private router: Router,
    private loginService: LoginService,
    private toastr: ToastrService,
    private themeService: ThemeService,
    private trilhaService: TrilhaService
  ) {}

  ngOnInit() {
    // Subscreve às mudanças de tema
    this.themeSubscription = this.themeService.theme$.subscribe((theme) => {
      this.isDarkMode = theme === 'dark';
    });

    // Carrega as trilhas
    this.loadTrilhas();
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.trilhasSubscription) {
      this.trilhasSubscription.unsubscribe();
    }
  }

  loadTrilhas(): void {
    this.isLoading = true;
    this.error = null;

    this.trilhasSubscription = this.trilhaService
      .getTrilhasResumidas()
      .subscribe({
        next: (trilhas) => {
          this.trilhas = trilhas;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Erro ao carregar trilhas: ' + err.message;
          this.isLoading = false;
          this.toastr.error(this.error, 'Erro');
        },
      });
  }

  goToTrilha(id: number) {
    this.router.navigate(['/trilha', id]);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    const newTheme = this.themeService.getCurrentTheme();
    this.toastr.info(
      `Tema alterado para ${newTheme === 'dark' ? 'escuro' : 'claro'}`,
      'Tema'
    );
  }

  goToProfile() {
    // Rota para perfil (você pode criar depois)
    this.toastr.info('Funcionalidade de perfil em desenvolvimento', 'Info');
  }

  logout() {
    this.loginService.logout();
    this.toastr.success('Logout realizado com sucesso!', 'Sucesso');
    this.router.navigate(['/']);
  }
}
