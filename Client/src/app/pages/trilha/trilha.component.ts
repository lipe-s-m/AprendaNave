import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { TrilhaService } from '../../services/trilha/trilha.service';
import { Trilha, Modulo } from '../../models/trilha.model';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-trilha',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trilha.component.html',
  styleUrl: './trilha.component.scss',
})
export class TrilhaComponent implements OnInit, OnDestroy {
  trilhaId: number | null = null;
  trilha: Trilha | null = null;
  isLoading = true;
  error: string | null = null;
  moduloSelecionado: Modulo | null = null;

  private subscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trilhaService: TrilhaService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.trilhaId = id !== null ? Number(id) : null;

      if (this.trilhaId !== null) {
        this.loadTrilha(this.trilhaId);
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

    this.trilhaService.getTrilhaById(id).subscribe({
      next: (trilha) => {
        this.trilha = trilha;
        console.log('Trilha carregada:', trilha);
        console.log('Módulos:', trilha.modulos);
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
      console.log(this.trilhaId);
      return;
    }

    console.log(
      `Tentando atualizar módulo ${moduloId} para status: ${novoStatus}`
    );

    this.trilhaService
      .atualizarStatusModulo(this.trilhaId, moduloId, novoStatus)
      .subscribe({
        next: (trilha) => {
          console.log('Trilha atualizada recebida:', trilha);
          const moduloAtualizado = trilha.modulos.find(
            (m) => m.id === moduloId
          );
          console.log('Módulo após atualização:', moduloAtualizado);

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
    console.log('abrirModalModulo chamado com módulo:', modulo);
    console.log('Status atual do módulo:', modulo.status);
    console.log('Evento:', event);

    try {
      // Verificar se o evento veio de um botão
      const isButtonClick =
        event?.target instanceof HTMLElement &&
        (event.target as HTMLElement).tagName === 'BUTTON';

      console.log('O clique foi em um botão?', isButtonClick);

      // Se o módulo já está em andamento ou concluído, redireciona direto para a página do módulo
      if (modulo.status === 'EM_ANDAMENTO' || modulo.status === 'CONCLUIDO') {
        console.log('Módulo já em andamento ou concluído, redirecionando...');
        this.navegarParaModulo(modulo.id);
        return;
      }

      // Caso contrário, abrimos o modal para confirmação
      console.log('Abrindo modal de confirmação...');
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
    console.log('iniciarOuContinuarModulo chamado com módulo:', modulo);
    event.stopPropagation(); // Impede que o evento propague para o card

    try {
      if (modulo.status === 'NAO_INICIADO') {
        // Se não iniciado, marca como em andamento e navega para a página do módulo
        console.log('abrindo modulo...', modulo.id);
        this.abrirModalModulo(modulo, event);
      } else {
        // Se já em andamento ou concluído, apenas navega para a página do módulo
        console.log('Navegando para módulo já iniciado...', modulo.id);
        this.navegarParaModulo(modulo.id);
      }
    } catch (error) {
      console.error('Erro ao iniciar ou continuar módulo:', error);
      this.toastr.error('Ocorreu um erro ao processar a ação', 'Erro');
    }
  }

  confirmarIniciarModulo(): void {
    if (this.moduloSelecionado) {
      try {
        console.log(
          'confirmarIniciarModulo para módulo:',
          this.moduloSelecionado
        );
        const moduloId = this.moduloSelecionado.id;
        this.fecharModal();

        // Primeiro fechar o modal para evitar problemas de redirecionamento
        setTimeout(() => {
          // Marcar como em andamento e redirecionar
          console.log(
            'Executando atualizarStatusModulo para o módulo:',
            moduloId
          );
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

    return this.trilha.modulos.findIndex(
      (modulo) => modulo.id === this.moduloSelecionado?.id
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
