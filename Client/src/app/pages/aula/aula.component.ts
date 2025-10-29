import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TrilhaService } from '../../services/trilha/trilha.service';
import { Trilha, Modulo, Aula } from '../../models/trilha.model';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { AulaService } from '../../services/aula/aula.service';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';

@Component({
  selector: 'app-aula',
  standalone: true,
  imports: [CommonModule, ButtonComponent, LoaderComponent, SubheaderComponent],
  templateUrl: './aula.component.html',
  styleUrl: './aula.component.scss',
})
export class AulaComponent implements OnInit, OnDestroy {
  trilhaId: number | null = null;
  moduloId: number | null = null;
  aulaId: number | null = null;

  trilha: Trilha | null = null;
  modulo: Modulo | null = null;
  aula: Aula | null = null;

  aulasList: Aula[] = [];
  proximaAula: Aula | null = null;
  aulaAnterior: Aula | null = null;

  isLoading = true;
  todasAsAulasConcluidas = false;
  error: string | null = null;

  videoUrl: SafeResourceUrl | null = null;

  videoIds: string[] = [];

  private subscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trilhaService: TrilhaService,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer,
    private aulaService: AulaService
  ) {}

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe((params) => {
      const trilhaId = params.get('trilhaId');
      const moduloId = params.get('moduloId');
      const aulaId = params.get('aulaId');

      this.trilhaId = trilhaId !== null ? Number(trilhaId) : null;
      this.moduloId = moduloId !== null ? Number(moduloId) : null;
      this.aulaId = aulaId !== null ? Number(aulaId) : null;

      if (
        this.trilhaId !== null &&
        this.moduloId !== null &&
        this.aulaId !== null
      ) {
        this.loadAula(this.trilhaId, this.moduloId, this.aulaId);
      } else {
        this.error = 'ID de trilha, módulo ou aula inválido';
        this.isLoading = false;
      }
    });
    this.videoIds = [
      'q1oqfO8PgMs', // Rick Astley - Never Gonna Give You Up
      '-4eukz8miOI', // tommei data sekkai
      'r8im6qIYCNE', // op13
      '97hIG-8D-Xo', // yura yura

      'saglKg48Sgk', //  sign
    ];
    this.aulaService.initializeAulas(
      null,
      this.trilhaId!,
      this.moduloId!,
      this.videoIds.length
    );
    setTimeout(() => {
      this.verificarAulasConcluidas();
    }, 400);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadAula(trilhaId: number, moduloId: number, aulaId: number): void {
    this.isLoading = true;
    this.error = null;

    this.trilhaService.getTrilhaById(trilhaId).subscribe({
      next: (trilha) => {
        this.trilha = trilha;

        // Encontrar o módulo correspondente
        this.modulo = trilha.modulos.find((m) => m.id === moduloId) || null;

        if (!this.modulo) {
          this.error = `Módulo com ID ${moduloId} não encontrado na trilha`;
          this.isLoading = false;
          return;
        }

        // Carregar as aulas do módulo
        this.aulasList = this.modulo.aulasList || [];

        // Encontrar a aula atual
        this.aula = this.aulasList.find((a) => a.id === aulaId) || null;

        if (!this.aula) {
          this.error = `Aula com ID ${aulaId} não encontrada no módulo`;
          this.isLoading = false;
          return;
        }

        // Gerar URL do vídeo para a aula (simulação)
        this.gerarVideoUrl();
        //verificar se todas as aulas foram concluidas
        // Encontrar a próxima aula e a aula anterior
        this.definirNavegacaoAulas();

        // Marcar a aula como concluída se ainda não estiver
        if (!this.aula.concluida) {
          this.marcarAulaConcluida(trilhaId, moduloId, aulaId);

          this.aula.concluida = true;
          this.verificarAulasConcluidas();
          // this.verificarAulasConcluidas(trilhaId, moduloId);
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar a trilha: ' + err.message;
        this.isLoading = false;
        this.toastr.error(this.error, 'Erro');
      },
    });
  }

  verificarAulasConcluidas(): void {
    if (this.aulasList.length === 0) {
      this.todasAsAulasConcluidas = false;
      return;
    }

    const moduloCompleto = this.aulasList.every(
      (aula) => aula.concluida === true
    );
    if (moduloCompleto) {
      this.toastr.success(
        'Parabéns! Você concluiu todas as aulas deste módulo.'
      );
      this.todasAsAulasConcluidas = moduloCompleto;
    }
  }
  irParaTesteFinal(): void {
    if (this.trilhaId && this.moduloId) {
      this.router.navigate(['/teste-final', this.trilhaId, this.moduloId]);
    }
  }

  gerarVideoUrl(): void {
    // Lista de IDs de vídeos do YouTube sobre educação

    // Usar o ID da aula para selecionar um vídeo (de forma circular)
    const videoIndex = (this.aulaId! - 1) % this.videoIds.length;
    const videoId = this.videoIds[videoIndex];

    // Gerar URL segura para o iframe
    const url = `https://www.youtube.com/embed/${videoId}?autoplay=0`;

    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  definirNavegacaoAulas(): void {
    if (!this.aula || !this.aulasList.length) return;

    const currentIndex = this.aulasList.findIndex(
      (a) => a.id === this.aula!.id
    );

    // Próxima aula
    if (currentIndex < this.aulasList.length - 1) {
      this.proximaAula = this.aulasList[currentIndex + 1];
    } else {
      this.proximaAula = null;
    }

    // Aula anterior
    if (currentIndex > 0) {
      this.aulaAnterior = this.aulasList[currentIndex - 1];
    } else {
      this.aulaAnterior = null;
    }
  }

  marcarAulaConcluida(
    trilhaId: number,
    moduloId: number,
    aulaId: number
  ): void {
    if (!trilhaId || !moduloId || !aulaId) return;

    this.aulaService.marcarAulaComoConcluida(trilhaId, moduloId, aulaId);
  }

  irParaProximaAula(): void {
    if (this.proximaAula && this.trilhaId && this.moduloId) {
      this.router.navigate([
        '/aula',
        this.trilhaId,
        this.moduloId,
        this.proximaAula.id,
      ]);
    }
  }

  irParaAulaAnterior(): void {
    if (this.aulaAnterior && this.trilhaId && this.moduloId) {
      this.router.navigate([
        '/aula',
        this.trilhaId,
        this.moduloId,
        this.aulaAnterior.id,
      ]);
    }
  }

  irParaAula(aula: Aula): void {
    if (this.trilhaId && this.moduloId) {
      this.router.navigate(['/aula', this.trilhaId, this.moduloId, aula.id]);
    }
  }

  voltarParaModulo(): void {
    if (this.trilhaId && this.moduloId) {
      this.router.navigate(['/modulo', this.trilhaId, this.moduloId]);
    }
  }
}
