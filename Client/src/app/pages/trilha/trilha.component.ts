import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TrilhaService } from '../../services/trilha/trilha.service';
import { Trilha, Modulo } from '../../models/trilha.model';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { HeaderComponent } from '../../layout/header/header.component';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { ModuloService } from '../../services/modulo/modulo.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { NavigationStateService } from '../../services/navigation-state/navigation-state.service';

@Component({
  selector: 'app-trilha',
  standalone: true,
  imports: [CommonModule, LoaderComponent, SubheaderComponent, ButtonComponent],
  templateUrl: './trilha.component.html',
  styleUrl: './trilha.component.scss',
})
export class TrilhaComponent implements OnInit, OnDestroy {
  private readonly navState = inject(NavigationStateService);

  trilha: any = null;
  nomeCurso: string = '';
  isLoading = true;
  error: string | null = null;
  moduloSelecionado: any = null;
  statusModulo: string = 'PENDENTE';
  private subscription: Subscription | null = null;

  get trilhaId(): number | null {
    return this.navState.cursoId();
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trilhaService: TrilhaService,
    private moduloService: ModuloService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      const nomeCurso = sessionStorage.getItem('cursoNome');
      const cursoIdNum = id !== null ? Number(id) : null;

      this.navState.setCurso(cursoIdNum);

      if (nomeCurso) {
        this.nomeCurso = nomeCurso;
      }

      if (cursoIdNum !== null) {
        this.loadTrilha(cursoIdNum);
      } else {
        this.error = 'ID de trilha inválido';
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadTrilha(id: number): void {
    this.isLoading = true;
    this.error = null;

    this.moduloService.getModulos(id).subscribe({
      next: (trilha) => {
        this.trilha = trilha;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar a trilha: ' + err.message;
        this.isLoading = false;
        this.toastr.error(this.error, 'Erro');
      },
    });
  }

  atualizarStatusModulo(
    moduloId: number,
    novoStatus: 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO'
  ): void {
    if (this.trilhaId === null) {
      return;
    }

    this.trilhaService
      .atualizarStatusModulo(this.trilhaId, moduloId, novoStatus)
      .subscribe({
        next: (trilha) => {
          this.trilha = trilha;

          let mensagemStatus = '';
          switch (novoStatus) {
            case 'NAO_INICIADO':
              mensagemStatus = 'não iniciado';
              break;
            case 'EM_ANDAMENTO':
              mensagemStatus = 'em andamento';
              // Redirecionar para a página do módulo
              this.navegarParaModulo(moduloId);
              break;
            case 'CONCLUIDO':
              mensagemStatus = 'concluído';
              break;
          }

          this.toastr.success(
            `Módulo marcado como ${mensagemStatus}`,
            'Sucesso'
          );
        },
        error: (err) => {
          console.error('Erro ao atualizar módulo:', err);
          this.toastr.error(err.message, 'Erro');
        },
      });
  }

  abrirModalModulo(modulo: Modulo, event?: Event): void {
    if (modulo.id !== 1) {
      this.toastr.info('Funcionalidade em desenvolvimento', 'Atenção');
      return;
    }

    try {
      // Verificar se o evento veio de um botão
      const isButtonClick =
        event?.target instanceof HTMLElement &&
        (event.target as HTMLElement).tagName === 'BUTTON';

      // Se o módulo já está em andamento ou concluído, redireciona direto para a página do módulo
      if (modulo.status === 'EM_ANDAMENTO' || modulo.status === 'CONCLUIDO') {
        this.navegarParaModulo(modulo.id);
        return;
      }

      // Caso contrário, abrimos o modal para confirmação
      this.moduloSelecionado = modulo;
    } catch (error) {
      console.error('Erro ao abrir modal do módulo:', error);
      this.toastr.error('Ocorreu um erro ao abrir o modal', 'Erro');
    }
  }

  fecharModal(): void {
    this.moduloSelecionado = null;
  }

  iniciarOuContinuarModulo(modulo: Modulo, event: Event): void {
    event.stopPropagation(); // Impede que o evento propague para o card
    if (modulo.id !== 1) {
      this.toastr.info('Funcionalidade em desenvolvimento', 'Atenção');
      return;
    }
    try {
      if (modulo.status === 'NAO_INICIADO') {
        // Se não iniciado, marca como em andamento e navega para a página do módulo
        this.abrirModalModulo(modulo, event);
      } else {
        // Se já em andamento ou concluído, apenas navega para a página do módulo
        this.navegarParaModulo(modulo.id);
      }
    } catch (error) {
      console.error('Erro ao iniciar ou continuar módulo:', error);
      this.toastr.error('Ocorreu um erro ao processar a ação', 'Erro');
    }
  }

  confirmarIniciarModulo(): void {
    if (this.moduloSelecionado.id !== 1) {
      this.toastr.info('Funcionalidade em desenvolvimento', 'Atenção');
      this.fecharModal();

      return;
    }
    if (this.moduloSelecionado) {
      try {
        const moduloId = this.moduloSelecionado.id;
        this.fecharModal();

        // Primeiro fechar o modal para evitar problemas de redirecionamento
        setTimeout(() => {
          // Marcar como em andamento e redirecionar

          this.atualizarStatusModulo(moduloId, 'EM_ANDAMENTO');
        }, 100);
      } catch (error) {
        console.error('Erro ao confirmar início do módulo:', error);
        this.toastr.error('Ocorreu um erro ao iniciar o módulo', 'Erro');
      }
    } else {
      console.error('confirmarIniciarModulo chamado sem módulo selecionado');
    }
  }

  getIndexModuloSelecionado(): number {
    if (!this.trilha || !this.moduloSelecionado) return -1;

    return this.trilha.findIndex(
      (modulo: any) => modulo.id === this.moduloSelecionado?.id
    );
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'NAO_INICIADO':
        return 'Não iniciado';
      case 'EM_ANDAMENTO':
        return 'Em andamento';
      case 'CONCLUIDO':
        return 'Concluído';
      default:
        return 'Desconhecido';
    }
  }

  getButtonText(status: string): string {
    switch (status) {
      case 'NAO_INICIADO':
        return 'Iniciar';
      case 'EM_ANDAMENTO':
        return 'Continuar';
      case 'CONCLUIDO':
        return 'Revisar';
      default:
        return 'Iniciar';
    }
  }

  navegarParaModulo(moduloId: number): void {
    if (this.trilhaId !== null) {
      this.router.navigate(['/modulo', this.trilhaId, moduloId]);
    }
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }

  resetarDados(): void {
    this.trilhaService.resetarTrilhas();
    this.toastr.success('Dados resetados com sucesso!', 'Sucesso');
    if (this.trilhaId) {
      this.loadTrilha(this.trilhaId);
    }
  }

  getNivelClass(nivel?: string): string {
    switch (nivel) {
      case 'INICIANTE':
        return 'nivel-iniciante';
      case 'INTERMEDIÁRIO':
        return 'nivel-intermediario';
      case 'AVANÇADO':
        return 'nivel-avancado';
      default:
        return 'nivel-iniciante';
    }
  }
}
