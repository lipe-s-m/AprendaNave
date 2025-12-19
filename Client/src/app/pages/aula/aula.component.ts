import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  computed,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
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

  aulasList: WritableSignal<AulaDisplay[]> = signal<AulaDisplay[]>([]);
  aulasListOrdenada: Signal<AulaDisplay[]> = computed(() => {
    return [...this.aulasList()].sort((a, b) => a.ordemAula - b.ordemAula);
  });
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
  get cursoNome(): string | null {
    return this.navState.nomeCurso();
  }
  get moduloId(): number | null {
    return this.navState.moduloId();
  }
  get moduloNome(): string | null {
    return this.navState.nomeModulo();
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
  ) {
    console.log(this.cursoNome);
  }

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe((params) => {
      let cursoId = this.navState.cursoId();
      let moduloId = this.navState.moduloId();
      let aulaId = this.navState.aulaId();

      if (!cursoId || !moduloId || !aulaId) {
        const cid = params.get('cursoId');
        const mid = params.get('moduloId');
        const aid = params.get('aulaId');

        if (cid && mid && aid) {
          cursoId = Number(cid);
          moduloId = Number(mid);
          aulaId = Number(aid);
        }
      }

      const cursoIdNum = cursoId !== null ? Number(cursoId) : null;
      const moduloIdNum = moduloId !== null ? Number(moduloId) : null;
      const aulaIdNum = aulaId !== null ? Number(aulaId) : null;

      this.navState.updateIdContexto(cursoIdNum, moduloIdNum, aulaIdNum);
      console.log(cursoIdNum, moduloIdNum, aulaIdNum);

      if (cursoIdNum !== null && moduloIdNum !== null && aulaIdNum !== null) {
        if (this.aulasList.length === 0) {
          this.aulaService.getAulas(moduloIdNum).subscribe({
            next: (aulas) => {
              this.aulasList.set(aulas);

              this.navState.setAulas(this.aulasList());
              this.loadAula(aulaIdNum);
            },
            error: (err) => {
              this.error = 'Erro ao carregar aulas: ' + err.message;
              this.isLoading = false;
              this.toastr.error(this.error, 'Erro');
            },
          });
          this.loadAula(aulaIdNum);
        } else {
          this.error = 'ID de curso, módulo ou aula inválido';
          this.isLoading = false;
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadAula(aulaId: number): void {
    this.isLoading = true;
    this.error = null;

    this.aulaService.getAulaById(aulaId).subscribe({
      next: (aula) => {
        // Verificar se todas as aulas foram concluídas
        // Encontrar a próxima aula e a aula anterior
        this.aula = aula;
        console.log(aula);

        this.gerarVideoUrl(this.aula.videoYoutubeIdAula);
        this.aulasList.set(this.navState.aulas() || []);
        console.log(this.aulasList());

        this.definirNavegacaoAulas();

        // Marcar a aula como concluída se ainda não estiver
        // if (!this.aula.concluida) {
        //   // this.marcarAulaConcluida(aulaId);

        //   this.aula.concluida = true;
        //   this.verificarAulasConcluidas();
        // }

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

    const moduloCompleto = this.aulasList().every(
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

  gerarVideoUrl(aulaIdYoutube: string): void {
    const url = `https://www.youtube.com/embed/${aulaIdYoutube}?autoplay=0`;
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  definirNavegacaoAulas(): void {
    if (!this.aula || !this.aulasList.length) return;

    const currentIndex = this.aulasList().findIndex(
      (a) => a.idAula === this.aula!.idAula
    );

    // Próxima aula
    if (currentIndex < this.aulasList().length - 1) {
      this.proximaAula = this.aulasList()[currentIndex + 1];
    } else {
      this.proximaAula = null;
    }

    // Aula anterior
    if (currentIndex > 0) {
      this.aulaAnterior = this.aulasList()[currentIndex - 1];
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
        this.proximaAula.idAula,
      ]);
    }
  }

  irParaAulaAnterior(): void {
    if (this.aulaAnterior && this.cursoId && this.moduloId) {
      this.router.navigate([
        '/aula',
        this.cursoId,
        this.moduloId,
        this.aulaAnterior.idAula,
      ]);
    }
  }

  irParaAula(aula: Aula): void {
    if (this.cursoId && this.moduloId) {
      this.navState.setAula(aula.idAula);
      this.router.navigate(['/aula', this.cursoId, this.moduloId, aula.idAula]);
    }
  }

  voltarParaModulo(): void {
    if (this.cursoId && this.moduloId) {
      this.router.navigate(['/modulo', this.cursoId, this.moduloId]);
    }
  }
}
