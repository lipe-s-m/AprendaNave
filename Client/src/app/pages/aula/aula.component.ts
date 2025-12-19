import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CursoService } from '../../services/curso/curso.service';
import { Curso, Modulo, Aula } from '../../models/curso.model';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { AulaService } from '../../services/aula/aula.service';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { NavigationStateService } from '../../services/navigation-state/navigation-state.service';

// Define a type that extends Aula to include the missing property used in the template
type AulaDisplay = Aula & { duracao?: string };

@Component({
  selector: 'app-aula',
  standalone: true,
  imports: [CommonModule, ButtonComponent, LoaderComponent, SubheaderComponent],
  templateUrl: './aula.component.html',
  styleUrl: './aula.component.scss',
})
export class AulaComponent implements OnInit, OnDestroy {
  private readonly navState = inject(NavigationStateService);

  curso: Curso | null = null;
  modulo: Modulo | null = null;
  aula: AulaDisplay | null = null;

  aulasList: AulaDisplay[] = [];
  proximaAula: AulaDisplay | null = null;
  aulaAnterior: AulaDisplay | null = null;

  isLoading = true;
  todasAsAulasConcluidas = false;
  error: string | null = null;

  videoUrl: SafeResourceUrl | null = null;

  private subscription: Subscription | null = null;

  get cursoId(): number | null {
    return this.navState.cursoId();
  }

  get moduloId(): number | null {
    return this.navState.moduloId();
  }

  get aulaId(): number | null {
    return this.navState.aulaId();
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cursoService: CursoService,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer,
    private aulaService: AulaService
  ) {}

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe((params) => {
      const cursoId = params.get('cursoId');
      const moduloId = params.get('moduloId');
      const aulaId = params.get('aulaId');

      const cursoIdNum = cursoId !== null ? Number(cursoId) : null;
      const moduloIdNum = moduloId !== null ? Number(moduloId) : null;
      const aulaIdNum = aulaId !== null ? Number(aulaId) : null;

      this.navState.setContexto(cursoIdNum, moduloIdNum, aulaIdNum);

      if (cursoIdNum !== null && moduloIdNum !== null && aulaIdNum !== null) {
        this.loadAula(cursoIdNum, moduloIdNum, aulaIdNum);
      } else {
        this.error = 'ID de curso, módulo ou aula inválido';
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadAula(cursoId: number, moduloId: number, aulaId: number): void {
    this.isLoading = true;
    this.error = null;

    this.cursoService.getCursoById(cursoId).subscribe({
      next: (curso) => {
        this.curso = curso;

        // Encontrar o módulo correspondente
        this.modulo = curso.modulos.find((m) => m.id === moduloId) || null;

        if (!this.modulo) {
          this.error = `Módulo com ID ${moduloId} não encontrado no curso`;
          this.isLoading = false;
          return;
        }

        // Carregar as aulas do módulo
        this.aulasList = (this.modulo.aulasList || []) as AulaDisplay[];

        // Encontrar a aula atual
        this.aula = this.aulasList.find((a) => a.id === aulaId) || null;

        if (!this.aula) {
          this.error = `Aula com ID ${aulaId} não encontrada no módulo`;
          this.isLoading = false;
          return;
        }

        // Gerar URL do vídeo para a aula (simulação)
        this.gerarVideoUrl();
        // Verificar se todas as aulas foram concluídas
        // Encontrar a próxima aula e a aula anterior
        this.definirNavegacaoAulas();

        // Marcar a aula como concluída se ainda não estiver
        if (!this.aula.concluida) {
          this.marcarAulaConcluida(cursoId, moduloId, aulaId);

          this.aula.concluida = true;
          this.verificarAulasConcluidas();
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar o curso: ' + err.message;
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
    if (this.cursoId && this.moduloId) {
      this.router.navigate(['/teste-final', this.cursoId, this.moduloId]);
    }
  }

  gerarVideoUrl(): void {
    const aula = this.aulaService.getAulaById(this.aulaId!);
    if (aula?.videoYoutubeId) {
      const url = `https://www.youtube.com/embed/${aula.videoYoutubeId}?autoplay=0`;
      this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
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

  marcarAulaConcluida(cursoId: number, moduloId: number, aulaId: number): void {
    if (!cursoId || !moduloId || !aulaId) return;

    this.aulaService.markAulaComoConcluida(aulaId);
  }

  irParaProximaAula(): void {
    if (this.proximaAula && this.cursoId && this.moduloId) {
      this.router.navigate([
        '/aula',
        this.cursoId,
        this.moduloId,
        this.proximaAula.id,
      ]);
    }
  }

  irParaAulaAnterior(): void {
    if (this.aulaAnterior && this.cursoId && this.moduloId) {
      this.router.navigate([
        '/aula',
        this.cursoId,
        this.moduloId,
        this.aulaAnterior.id,
      ]);
    }
  }

  irParaAula(aula: Aula): void {
    if (this.cursoId && this.moduloId) {
      this.router.navigate(['/aula', this.cursoId, this.moduloId, aula.id]);
    }
  }

  voltarParaModulo(): void {
    if (this.cursoId && this.moduloId) {
      this.router.navigate(['/modulo', this.cursoId, this.moduloId]);
    }
  }
}
