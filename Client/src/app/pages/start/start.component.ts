import { Component } from '@angular/core';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-start',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './start.component.html',
  styleUrl: './start.component.scss',
})
export class StartComponent {
  constructor(private router: Router) {}

  entrarComoUsuario() {
    alert('Entrar na sua conta clicked');
  }
  entrarComoVisitante() {
    alert('Entrar como visitante clicked');
    this.router.navigate(['/hub']);
  }
}
