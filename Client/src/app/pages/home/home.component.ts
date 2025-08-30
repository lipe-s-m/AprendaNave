import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login/login.service';
import { ToastrService } from 'ngx-toastr';
import { ThemeService } from '../../services/theme/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  isDarkMode = true;
  private themeSubscription?: Subscription;

  constructor(
    private router: Router,
    private loginService: LoginService,
    private toastr: ToastrService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    // Subscreve às mudanças de tema
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.isDarkMode = theme === 'dark';
    });
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }
  trilhas = [
    {
      id: 0,
      nome: 'Matemática',
      imagem: 'assets/matematica.svg',
      matriculas: 37,
      nivel: 'INICIANTE',
      professor: 'Professor Paulo',
      tag: 'NOVA',
      modulos: 4,
    },
    {
      id: 1,
      nome: 'Português',
      imagem: 'assets/dicionario.svg',
      matriculas: 24,
      nivel: 'INICIANTE',
      professor: 'Professor Mock',
      modulos: 4,
    },
    {
      id: 2,
      nome: 'Música',
      imagem: 'assets/notas-musicais.svg',
      matriculas: 11,
      nivel: 'INICIANTE',
      professor: 'Professor Felipe',
      modulos: 4,
    },
    {
      id: 3,
      nome: 'Programação',
      imagem: 'assets/programacao.svg',
      matriculas: 725,
      nivel: 'INTERMEDIÁRIO',
      professor: 'Professor Felipe',
      tag: 'POPULAR',
      modulos: 4,
    },
    {
      id: 4,
      nome: 'Mock 1',
      imagem: 'assets/dicionario.svg',
      matriculas: 0,
      nivel: 'INICIANTE',
      professor: 'Professor Mock',
      modulos: 4,
    },
    {
      id: 5,
      nome: 'Mock 2',
      imagem: 'assets/matematica.svg',
      matriculas: 7,
      nivel: 'INTERMEDIÁRIO',
      professor: 'Professor Mock',
      modulos: 4,
    },
  ];

  goToTrilha(id: number) {
    this.router.navigate(['/trilha', id]);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    const newTheme = this.themeService.getCurrentTheme();
    this.toastr.info(`Tema alterado para ${newTheme === 'dark' ? 'escuro' : 'claro'}`, 'Tema');
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
