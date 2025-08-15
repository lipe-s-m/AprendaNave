import { Component } from '@angular/core';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';

@Component({
  selector: 'app-start',
  standalone: true,
  imports: [ButtonComponent, HeaderComponent],
  templateUrl: './start.component.html',
  styleUrl: './start.component.scss',
})
export class StartComponent {
  constructor(private router: Router) {}

  entrarComoUsuario() {
    this.router.navigate(['/login']);
  }
  entrarComoVisitante() {
    this.router.navigate(['/hub']);
  }
}
