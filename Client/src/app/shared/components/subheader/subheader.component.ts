import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoginService } from '../../../services/login/login.service';
import { ToastrService } from 'ngx-toastr';
import { ThemeService } from '../../../services/theme/theme.service';
import { TrilhaService } from '../../../services/trilha/trilha.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subheader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subheader.component.html',
  styleUrl: './subheader.component.scss',
})
export class SubheaderComponent {
  isDarkMode = true;
  trilhas: any[] = [];
  isLoading = true;
  error: string | null = null;
  isOpen = false;
  url: string = '';

  private themeSubscription?: Subscription;
  private trilhasSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private loginService: LoginService,
    private toastr: ToastrService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.routerSubscription = this.router.events.subscribe((evt) => {
      if (evt instanceof NavigationStart) {
        this.isOpen = false;
      }
    });
    this.url = this.router.url;
  }
  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.themeSubscription?.unsubscribe();
    this.trilhasSubscription?.unsubscribe();
  }
  goToHome() {
    this.router.navigate(['/home']);
  }
  toggleTheme() {
    this.themeService.toggleTheme();
    const newTheme = this.themeService.getCurrentTheme();
    this.toastr.info(
      `Tema alterado para ${newTheme === 'dark' ? 'escuro' : 'claro'}`,
      'Tema'
    );
    this.isOpen = false;
  }

  goToProfile() {
    this.toastr.info('Funcionalidade de perfil em desenvolvimento', 'Info');
    this.isOpen = false;
  }

  logout() {
    this.themeService.setTheme('dark');
    this.loginService.logout();
    this.toastr.success('Logout realizado com sucesso!', 'Sucesso');
    this.router.navigate(['/']);
    this.isOpen = false;
  }
  loadPreviousURL() {
    if (this.url.startsWith('/trilha/')) {
      this.router.navigate(['/home']);
    } else if (this.url.startsWith('/modulo/')) {
      const idTrilha = this.url.split('/')[2];
      this.router.navigate(['/trilha', idTrilha]);
    } else if (this.url.startsWith('/aula/')) {
      const idTrilha = this.url.split('/')[2];
      const idModulo = this.url.split('/')[3];
      this.router.navigate(['/modulo', idTrilha, idModulo]);
    }

    return;
  }
  toggleHamburguerMenu() {
    this.isOpen = !this.isOpen;
  }

  closeHamburguerMenu() {
    this.isOpen = false;
  }
}
