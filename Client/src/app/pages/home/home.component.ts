import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ThemeService } from '../../services/theme/theme.service';
import { Subscription } from 'rxjs';
import { TrilhaService } from '../../services/trilha/trilha.service';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LoaderComponent, SubheaderComponent],
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
}
