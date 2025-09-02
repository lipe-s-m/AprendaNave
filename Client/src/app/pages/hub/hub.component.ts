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
  trilhas: any[] = [];
  isLoading = true;
  error: string | null = null;
  private subscription: Subscription | null = null;

  constructor(private router: Router, private trilhaService: TrilhaService) {}

  ngOnInit(): void {
    this.loadTrilhas();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadTrilhas(): void {
    this.isLoading = true;
    this.error = null;

    this.subscription = this.trilhaService.getTrilhasResumidas().subscribe({
      next: (trilhas) => {
        this.trilhas = trilhas;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar trilhas: ' + err.message;
        this.isLoading = false;
      },
    });
  }

  entrarComoUsuario() {
    this.router.navigate(['login']);
  }
}
