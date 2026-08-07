import { Component, Input, OnDestroy } from '@angular/core';
import { Router, RouterModule, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoginService } from '../../../services/login/login.service';
import { ToastrService } from 'ngx-toastr';
import { ThemeService } from '../../../services/theme/theme.service';
import { UserService } from '../../../services/user/user.service';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-subheader',
  standalone: true,
  imports: [CommonModule, ButtonComponent, RouterModule],
  templateUrl: './subheader.component.html',
  styleUrl: './subheader.component.scss',
})
export class SubheaderComponent {
  @Input() infoMode: 'default' | 'meus-cursos' = 'default';
  isDarkMode = true;
  trilhas: any[] = [];
  isLoading = true;
  error: string | null = null;
  isOpen = false;
  url: string = '';
  showInfoModal = false;
  private themeSubscription?: Subscription;
  private trilhasSubscription?: Subscription;
  private routerSubscription?: Subscription;

  constructor(
    private router: Router,
    private loginService: LoginService,
    private toastr: ToastrService,
    private themeService: ThemeService,
    private userService: UserService
  ) {}

  get isAdmin(): boolean {
    return this.userService.getUserSignal()()?.cargo === 'Admin';
  }

  ngOnInit(): void {
    this.routerSubscription = this.router.events.subscribe((evt) => {
      if (evt instanceof NavigationStart) {
        this.isOpen = false;
      }
    });
    this.url = this.router.url;

    if (this.infoMode === 'meus-cursos') {
      const userId = this.userService.getUserSignal()()?.id ?? 'anonimo';
      const tutorialKey = `aprendanave:tutorial-meus-cursos:v1:${userId}`;

      if (!localStorage.getItem(tutorialKey)) {
        this.showInfoModal = true;
        localStorage.setItem(tutorialKey, 'visto');
      }
    } else if (
      sessionStorage.getItem('exibirTutorial') === 'true' &&
      this.url.startsWith('/home')
    ) {
      this.showInfoModal = true;
      sessionStorage.setItem('exibirTutorial', 'false');
    }
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
    this.isOpen = false;
    this.router.navigate(['/perfil']);
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
    } else if (this.url.startsWith('/perfil')) {
      this.router.navigate(['/home']);
    } else if (this.url.startsWith('/teste-final')) {
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
