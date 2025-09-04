import { Component } from '@angular/core';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { TrilhaService } from '../../services/trilha/trilha.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-start',
  standalone: true,
  imports: [ButtonComponent, HeaderComponent],
  templateUrl: './start.component.html',
  styleUrl: './start.component.scss',
})
export class StartComponent {
  constructor(
    private router: Router,
    private trilhaService: TrilhaService,
    private toastr: ToastrService
  ) {}

  entrarComoUsuario() {
    this.router.navigate(['/login']);
  }
  entrarComoVisitante() {
    this.router.navigate(['/hub']);
  }

  resetarDados() {
    this.trilhaService.resetarTrilhas();
    this.toastr.success('Dados resetados com sucesso!', 'Sucesso');
  }
}
