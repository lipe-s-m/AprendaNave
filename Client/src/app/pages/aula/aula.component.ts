import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TrilhaService } from '../../services/trilha/trilha.service';
import { Trilha, Modulo, Aula } from '../../models/trilha.model';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-aula',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aula.component.html',
  styleUrl: './aula.component.scss'
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
  error: string | null = null;
  
  videoUrl: SafeResourceUrl | null = null;
  
  private subscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trilhaService: TrilhaService,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe((params) => {
      const trilhaId = params.get('trilhaId');
      const moduloId = params.get('moduloId');
      const aulaId = params.get('aulaId');

      this.trilhaId = trilhaId !== null ? Number(trilhaId) : null;
      this.moduloId = moduloId !== null ? Number(moduloId) : null;
      this.aulaId = aulaId !== null ? Number(aulaId) : null;

      if (this.trilhaId !== null && this.moduloId !== null && this.aulaId !== null) {
        this.loadAula(this.trilhaId, this.moduloId, this.aulaId);
      } else {
        this.error = 'ID de trilha, módulo ou aula inválido';
        this.isLoading = false;
      }
    });
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
        this.aula = this.aulasList.find(a => a.id === aulaId) || null;

        if (!this.aula) {
          this.error = `Aula com ID ${aulaId} não encontrada no módulo`;
          this.isLoading = false;
          return;
        }

        // Gerar URL do vídeo para a aula (simulação)
        this.gerarVideoUrl();

        // Encontrar a próxima aula e a aula anterior
        this.definirNavegacaoAulas();

        // Marcar a aula como concluída se ainda não estiver
        if (!this.aula.concluida) {
          this.marcarAulaConcluida();
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar a trilha: ' + err.message;
        this.isLoading = false;
        this.toastr.error(this.error, 'Erro');
      }
    });
  }

  gerarVideoUrl(): void {
    // Lista de IDs de vídeos do YouTube sobre educação
    const videoIds = [
      'jNQXAC9IVRw',  // "Me at the zoo" (primeiro vídeo do YouTube)
      'dQw4w9WgXcQ',  // Rick Astley - Never Gonna Give You Up
      'J---aiyznGQ',  // Keyboard Cat
      'QH2-TGUlwu4',  // Nyan Cat
      'EwTZ2xpQwpA',  // "Chocolate Rain"
      '9bZkp7q19f0',  // Gangnam Style
      'z9Uz1icjwrM',  // "Despacito"
      'PeonBmeFR8o',  // Matemática - Frações
      'FTsIGF-vz7s',  // Matemática - Geometria
      'RF4wnAXJfIA'   // Português - Gramática
    ];

    // Usar o ID da aula para selecionar um vídeo (de forma circular)
    const videoIndex = (this.aulaId! - 1) % videoIds.length;
    const videoId = videoIds[videoIndex];
    
    // Gerar URL segura para o iframe
    const url = `https://www.youtube.com/embed/${videoId}?autoplay=0`;
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  definirNavegacaoAulas(): void {
    if (!this.aula || !this.aulasList.length) return;

    const currentIndex = this.aulasList.findIndex(a => a.id === this.aula!.id);
    
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

  marcarAulaConcluida(): void {
    if (!this.trilhaId || !this.moduloId || !this.aulaId) return;
    
    this.trilhaService.atualizarStatusAula(
      this.trilhaId, 
      this.moduloId, 
      this.aulaId, 
      true
    ).subscribe({
      next: (trilhaAtualizada) => {
        this.trilha = trilhaAtualizada;
        this.modulo = trilhaAtualizada.modulos.find(m => m.id === this.moduloId) || null;
        
        if (this.modulo) {
          this.aulasList = this.modulo.aulasList || [];
          this.aula = this.aulasList.find(a => a.id === this.aulaId) || null;
        }
        
        this.toastr.success('Aula marcada como concluída', 'Sucesso');
      },
      error: (err) => {
        this.toastr.error('Erro ao marcar aula como concluída', 'Erro');
      }
    });
  }

  irParaProximaAula(): void {
    if (this.proximaAula && this.trilhaId && this.moduloId) {
      this.router.navigate(['/aula', this.trilhaId, this.moduloId, this.proximaAula.id]);
    }
  }

  irParaAulaAnterior(): void {
    if (this.aulaAnterior && this.trilhaId && this.moduloId) {
      this.router.navigate(['/aula', this.trilhaId, this.moduloId, this.aulaAnterior.id]);
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
