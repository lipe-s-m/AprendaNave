import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';
import { TrilhaService } from '../../services/trilha/trilha.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-hub',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './hub.component.html',
  styleUrl: './hub.component.scss',
})
export class HubComponent implements OnInit, OnDestroy {
  cursos: any[] = [];
  isLoading = true;
  error: string | null = null;
  private subscription: Subscription | null = null;

  constructor(private router: Router, private trilhaService: TrilhaService) {}

  ngOnInit(): void {
    this.loadCursos();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadCursos(): void {
    this.isLoading = true;
    this.error = null;

    this.subscription = this.trilhaService.getCursosResumidos().subscribe({
      next: (cursos) => {
        this.cursos = cursos;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar cursos: ' + err.message;
        this.isLoading = false;
      },
    });
  }

  entrarComoUsuario() {
    this.router.navigate(['login']);
  }
}
