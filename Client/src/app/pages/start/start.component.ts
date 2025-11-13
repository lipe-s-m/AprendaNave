import { Component, OnInit } from '@angular/core';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { ThemeService } from '../../services/theme/theme.service';

@Component({
  selector: 'app-start',
  standalone: true,
  imports: [ButtonComponent, HeaderComponent],
  templateUrl: './start.component.html',
  styleUrl: './start.component.scss',
})
export class StartComponent implements OnInit {
  constructor(private router: Router, private themeService: ThemeService) {}
  ngOnInit() {
    // Garante que o tema escuro seja aplicado por padrão na tela de login
    if (this.themeService.getCurrentTheme() !== 'dark') {
      this.themeService.setTheme('dark');
    }
    if (sessionStorage.getItem('maiorPontuacaoDesafioJcc')) {
      sessionStorage.removeItem('maiorPontuacaoDesafioJcc');
    }
    if (localStorage.getItem('trilhas')) {
      localStorage.removeItem('trilhas');
    }
    sessionStorage.setItem('exibirTutorial', 'true');
  }

  entrarComoUsuario() {
    this.router.navigate(['/login']);
  }
  entrarComoVisitante() {
    this.router.navigate(['/desafiojcc']);
  }
}
