import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CursoService } from '../../services/curso/curso.service';
import { InputComponent } from '../../shared/components/input/input.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';
import { StatusBadgeComponent, StatusBadgeType } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { CreateModuloDto, CreateAulaDto, Curso } from '../../models/curso.model';

@Component({
  selector: 'app-gerenciar-curso',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputComponent,
    ButtonComponent,
    SubheaderComponent,
    LoaderComponent,
    ConfirmModalComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
  ],
  templateUrl: './gerenciar-curso.component.html',
  styleUrl: './gerenciar-curso.component.scss',
})
export class GerenciarCursoComponent implements OnInit, OnDestroy {
  cursoId = signal(0);
  isLoading = signal(true);
  error = signal<string | null>(null);
  salvandoCurso = signal(false);
  enviandoLogo = signal(false);
  salvandoModulo = signal(false);
  salvandoAula = signal(false);
  painelCursoRecolhido = signal(false);
  reordenando = signal(false);

  curso = signal<Curso | null>(null);

  // Lista de módulos com aulas
  modulos = signal<any[]>([]);
  aulasCache = signal<Map<number, any[]>>(new Map());
  moduloExpandido = signal<number | null>(null);

  // Modal de módulo
  modalModuloAberto = signal(false);
  editandoModulo = signal<any | null>(null);

  // Modal de aula
  modalAulaAberto = signal(false);
  editandoAula = signal<any | null>(null);
  aulaModuloId = signal<number | null>(null);

  // Modal de exclusão
  modalExcluir = signal<{ aberto: boolean; tipo: string; id: number; titulo: string; mensagem: string }>({
    aberto: false, tipo: '', id: 0, titulo: '', mensagem: '',
  });

  private ultimoFoco: HTMLElement | null = null;

  // ── Forms ──

  formCurso = new FormGroup({
    nome: new FormControl('', [Validators.required]),
    logo: new FormControl('', [Validators.required]),
    descricao: new FormControl('', [Validators.required, Validators.minLength(10)]),
  });

  // A quantidade de aulas NÃO é informada pelo criador: o servidor calcula
  // dinamicamente a partir da tabela `aula`.
  // A ordem NÃO é informada pelo criador: o servidor empilha no final
  // (total + 1) e a reordenação é feita pelas setas subir/descer.
  formModulo = new FormGroup({
    nome: new FormControl('', [Validators.required]),
    descricao: new FormControl('', [Validators.required]),
    nivel: new FormControl(1, [Validators.required, Validators.min(1)]),
    quantidadeHoras: new FormControl(0),
  });

  formAula = new FormGroup({
    titulo: new FormControl('', [Validators.required]),
    descricao: new FormControl('', [Validators.required]),
    videoYoutubeId: new FormControl('', [Validators.required]),
    duracao: new FormControl<number | null>(null),
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cursoService: CursoService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set('ID inválido'); return; }
    this.cursoId.set(parseInt(id));
    this.carregarCurso();
    this.carregarModulos();
    document.addEventListener('keydown', this.teclaListener);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.teclaListener);
  }

  private readonly teclaListener = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    if (this.modalModuloAberto()) this.fecharModalModulo();
    else if (this.modalAulaAberto()) this.fecharModalAula();
    else if (this.modalExcluir().aberto) this.fecharModalExcluir();
  };

  // ── Curso ──

  carregarCurso(): void {
    this.cursoService.getCursoById(this.cursoId()).subscribe({
      next: (curso) => {
        this.curso.set(curso);
        this.formCurso.patchValue({ nome: curso.nome, logo: curso.logo, descricao: curso.descricao });
        this.isLoading.set(false);
      },
      error: () => { this.error.set('Erro ao carregar curso'); this.isLoading.set(false); },
    });
  }

  voltarParaMeusCursos(): void {
    this.router.navigate(['/meus-cursos']);
  }

  togglePainelCurso(): void {
    this.painelCursoRecolhido.set(!this.painelCursoRecolhido());
  }

  cursoStatusLabel(): string {
    switch (this.curso()?.statusAprovacao) {
      case 0: return 'Pendente';
      case 1: return 'Aprovado';
      case 2: return 'Rejeitado';
      default: return '—';
    }
  }

  cursoStatusTipo(): StatusBadgeType {
    switch (this.curso()?.statusAprovacao) {
      case 0: return 'warning';
      case 1: return 'success';
      case 2: return 'error';
      default: return 'neutral';
    }
  }

  statusTipo(status: string | undefined): StatusBadgeType {
    switch (status) {
      case 'Aprovado': return 'success';
      case 'Pendente': return 'warning';
      case 'Rejeitado': return 'error';
      default: return 'neutral';
    }
  }

  horasDoModulo(modulo: any): string {
    const h = modulo.quantidadeHoras;
    return h && h > 0 ? `${h} ${h === 1 ? 'hora' : 'horas'}` : 'horas não definidas';
  }

  /**
   * Resumo de aulas para o painel do criador: total + distribuição por status.
   * Fragmentos com valor zero são ocultados para reduzir poluição visual.
   */
  resumoAulas(modulo: any): string {
    const total = modulo?.quantidadeAulas ?? 0;
    const partes = [`${total} ${total === 1 ? 'aula' : 'aulas'}`];
    if ((modulo?.quantidadeAulasAprovadas ?? 0) > 0) {
      partes.push(`${modulo.quantidadeAulasAprovadas} aprovadas`);
    }
    if ((modulo?.quantidadeAulasPendentes ?? 0) > 0) {
      partes.push(`${modulo.quantidadeAulasPendentes} pendentes`);
    }
    if ((modulo?.quantidadeAulasRejeitadas ?? 0) > 0) {
      partes.push(`${modulo.quantidadeAulasRejeitadas} rejeitadas`);
    }
    return partes.join(' · ');
  }

  salvarCurso(): void {
    if (!this.formCurso.valid) return;
    this.salvandoCurso.set(true);
    this.cursoService.updateCurso(this.cursoId(), this.formCurso.value as any).subscribe({
      next: (updated) => {
        this.curso.set(updated);
        this.toastr.success('Curso atualizado!', 'Sucesso');
        this.salvandoCurso.set(false);
      },
      error: () => { this.toastr.error('Erro ao atualizar curso', 'Erro'); this.salvandoCurso.set(false); },
    });
  }

  onLogoCursoSelecionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    const tamanhoMaximo = 5 * 1024 * 1024;
    if (!tiposPermitidos.includes(file.type)) {
      this.toastr.warning('Use uma imagem JPG, PNG ou WebP.', 'Formato inválido');
      input.value = '';
      return;
    }
    if (file.size > tamanhoMaximo) {
      this.toastr.warning('A imagem deve ter no máximo 5 MB.', 'Imagem muito grande');
      input.value = '';
      return;
    }

    this.enviandoLogo.set(true);
    this.cursoService.uploadLogoCurso(file).subscribe({
      next: ({ logoUrl }) => {
        this.formCurso.patchValue({ logo: logoUrl });
        this.toastr.success('Capa enviada. Clique em salvar para aplicar a alteração.', 'Imagem pronta');
        this.enviandoLogo.set(false);
      },
      error: (err) => {
        this.toastr.error(err.error?.error || 'Não foi possível enviar a imagem.', 'Erro no upload');
        this.enviandoLogo.set(false);
        input.value = '';
      },
    });
  }

  // ── Módulos ──

  carregarModulos(): void {
    this.cursoService.getModulosByCurso(this.cursoId()).subscribe({
      next: (modulos: any[]) => {
        this.modulos.set(modulos || []);
        // Carregar aulas de cada módulo
        (modulos || []).forEach((m: any) => this.carregarAulas(m.id));
      },
      error: () => this.toastr.error('Erro ao carregar módulos', 'Erro'),
    });
  }

  toggleModulo(moduloId: number): void {
    this.moduloExpandido.set(this.moduloExpandido() === moduloId ? null : moduloId);
    if (!this.aulasCache().has(moduloId)) {
      this.carregarAulas(moduloId);
    }
  }

  gerenciarQuiz(moduloId: number): void {
    this.router.navigate(['/curso', this.cursoId(), 'modulo', moduloId, 'quiz', 'gerenciar']);
  }

  abrirModalModulo(modulo?: any): void {
    this.ultimoFoco = document.activeElement as HTMLElement | null;
    this.editandoModulo.set(modulo || null);
    if (modulo) {
      this.formModulo.patchValue({
        nome: modulo.nome,
        descricao: modulo.descricao,
        nivel: modulo.nivel,
        quantidadeHoras: modulo.quantidadeHoras || 0,
      });
    } else {
      this.formModulo.reset({ nivel: 1, quantidadeHoras: 0 });
    }
    this.modalModuloAberto.set(true);
    this.focarModal();
  }

  fecharModalModulo(): void {
    this.modalModuloAberto.set(false);
    this.editandoModulo.set(null);
    this.ultimoFoco?.focus();
    this.ultimoFoco = null;
  }

  salvarModulo(): void {
    if (!this.formModulo.valid) return;
    this.salvandoModulo.set(true);
    const data: CreateModuloDto = {
      nome: this.formModulo.value.nome!,
      descricao: this.formModulo.value.descricao!,
      // Sem `ordem`: o servidor empilha no final (total + 1).
      nivel: Number(this.formModulo.value.nivel),
      quantidadeHoras: Number(this.formModulo.value.quantidadeHoras) || 0,
      cursoId: this.cursoId(),
    };

    const req = this.editandoModulo()
      ? this.cursoService.updateModulo(this.editandoModulo().id, data)
      : this.cursoService.createModulo(this.cursoId(), data);

    req.subscribe({
      next: () => {
        this.toastr.success(this.editandoModulo() ? 'Módulo atualizado!' : 'Módulo criado!', 'Sucesso');
        this.fecharModalModulo();
        this.recarregarModulos();
        this.salvandoModulo.set(false);
      },
      error: (err) => {
        this.toastr.error(err.error?.error || 'Erro ao salvar módulo', 'Erro');
        this.salvandoModulo.set(false);
      },
    });
  }

  confirmarExcluirModulo(modulo: any): void {
    this.modalExcluir.set({
      aberto: true, tipo: 'modulo', id: modulo.id,
      titulo: 'Excluir Módulo',
      mensagem: `Tem certeza que deseja excluir "${modulo.nome}" e todas as suas aulas?`,
    });
  }

  // ── Aulas ──

  carregarAulas(moduloId: number): void {
    this.cursoService.getAulasByModulo(moduloId).subscribe({
      next: (aulas) => {
        const cache = new Map(this.aulasCache());
        cache.set(moduloId, aulas);
        this.aulasCache.set(cache);
      },
    });
  }

  aulasPorModulo(moduloId: number): any[] {
    return this.aulasCache().get(moduloId) || [];
  }

  abrirModalAula(aula: any | null, moduloId: number): void {
    this.ultimoFoco = document.activeElement as HTMLElement | null;
    this.editandoAula.set(aula);
    this.aulaModuloId.set(moduloId);
    if (aula) {
      this.formAula.patchValue({
        titulo: aula.tituloAula,
        descricao: aula.descricaoAula,
        videoYoutubeId: aula.videoYoutubeIdAula,
        duracao: aula.duracaoAula || null,
      });
    } else {
      this.formAula.reset({ duracao: null });
    }
    this.modalAulaAberto.set(true);
    this.focarModal();
  }

  fecharModalAula(): void {
    this.modalAulaAberto.set(false);
    this.editandoAula.set(null);
    this.ultimoFoco?.focus();
    this.ultimoFoco = null;
  }

  private extrairIdYoutube(valor: string): string | null {
    const entrada = valor.trim();
    if (/^[\w-]{11}$/.test(entrada)) return entrada;

    try {
      const url = new URL(entrada.startsWith('http') ? entrada : `https://${entrada}`);
      const host = url.hostname.replace('www.', '').replace('m.', '');
      let id = '';

      if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || '';
      if (host === 'youtube.com') {
        id = url.searchParams.get('v') || '';
        if (!id) {
          const partes = url.pathname.split('/').filter(Boolean);
          if (partes[0] === 'embed' || partes[0] === 'shorts' || partes[0] === 'live') id = partes[1] || '';
        }
      }

      return /^[\w-]{11}$/.test(id) ? id : null;
    } catch {
      return null;
    }
  }

  salvarAula(): void {
    if (!this.formAula.valid || !this.aulaModuloId()) return;
    const videoYoutubeId = this.extrairIdYoutube(this.formAula.value.videoYoutubeId || '');
    if (!videoYoutubeId) {
      this.toastr.error('Cole um link válido do YouTube ou o ID de 11 caracteres do vídeo.', 'Vídeo inválido');
      return;
    }
    this.salvandoAula.set(true);
    const data: CreateAulaDto = {
      titulo: this.formAula.value.titulo!,
      descricao: this.formAula.value.descricao!,
      videoYoutubeId,
      // Sem `ordem`: o servidor empilha no final (total + 1).
      duracao: this.formAula.value.duracao ? Number(this.formAula.value.duracao) : undefined,
      idModulo: this.aulaModuloId()!,
    };

    const req = this.editandoAula()
      ? this.cursoService.updateAula(this.editandoAula().idAula, data)
      : this.cursoService.createAula(this.aulaModuloId()!, data);

    req.subscribe({
      next: () => {
        this.toastr.success(this.editandoAula() ? 'Aula atualizada!' : 'Aula criada!', 'Sucesso');
        this.fecharModalAula();
        this.carregarAulas(this.aulaModuloId()!);
        this.salvandoAula.set(false);
      },
      error: (err) => {
        this.toastr.error(err.error?.error || 'Erro ao salvar aula', 'Erro');
        this.salvandoAula.set(false);
      },
    });
  }

  confirmarExcluirAula(aula: any): void {
    this.modalExcluir.set({
      aberto: true, tipo: 'aula', id: aula.idAula,
      titulo: 'Excluir Aula',
      mensagem: `Tem certeza que deseja excluir "${aula.tituloAula}"?`,
    });
  }

  // ── Reordenação (setas subir/descer) ──

  /**
   * Sobe/desce um módulo trocando a ordem com o vizinho da direção.
   * O servidor é a fonte da verdade; a lista vem ordenada por `ordem` (asc).
   */
  moverModulo(modulo: any, direcao: -1 | 1): void {
    const ordenados = [...this.modulos()].sort((a, b) => a.ordem - b.ordem);
    const idx = ordenados.findIndex((m) => m.id === modulo.id);
    const vizinho = ordenados[idx + direcao];
    if (!vizinho || this.reordenando()) return;

    this.reordenando.set(true);
    forkJoin([
      this.cursoService.updateModulo(modulo.id, { ordem: vizinho.ordem }),
      this.cursoService.updateModulo(vizinho.id, { ordem: modulo.ordem }),
    ]).subscribe({
      next: () => this.toastr.success('Ordem atualizada!', 'Sucesso'),
      error: () => this.toastr.error('Erro ao reordenar módulo', 'Erro'),
      complete: () => {
        this.reordenando.set(false);
        this.recarregarModulos();
      },
    });
  }

  /**
   * Sobe/desce uma aula trocando a ordem com a aula vizinha da direção.
   */
  moverAula(aula: any, moduloId: number, direcao: -1 | 1): void {
    const ordenadas = [...this.aulasPorModulo(moduloId)].sort((a, b) => a.ordemAula - b.ordemAula);
    const idx = ordenadas.findIndex((a) => a.idAula === aula.idAula);
    const vizinho = ordenadas[idx + direcao];
    if (!vizinho || this.reordenando()) return;

    this.reordenando.set(true);
    forkJoin([
      this.cursoService.updateAula(aula.idAula, { ordem: vizinho.ordemAula }),
      this.cursoService.updateAula(vizinho.idAula, { ordem: aula.ordemAula }),
    ]).subscribe({
      next: () => this.toastr.success('Ordem atualizada!', 'Sucesso'),
      error: () => this.toastr.error('Erro ao reordenar aula', 'Erro'),
      complete: () => {
        this.reordenando.set(false);
        this.carregarAulas(moduloId);
      },
    });
  }

  // ── Exclusão ──

  fecharModalExcluir(): void {
    this.modalExcluir.set({ aberto: false, tipo: '', id: 0, titulo: '', mensagem: '' });
  }

  executarExclusao(): void {
    const { tipo, id } = this.modalExcluir();
    let req: any;

    if (tipo === 'modulo') {
      req = this.cursoService.deleteModulo(id);
    } else if (tipo === 'aula') {
      req = this.cursoService.deleteAula(id);
    } else {
      return;
    }

    req.subscribe({
      next: () => {
        this.toastr.success(`${tipo === 'modulo' ? 'Módulo' : 'Aula'} excluído(a)!`, 'Sucesso');
        this.fecharModalExcluir();
        this.recarregarModulos();
      },
      error: (err: any) => this.toastr.error(err.error?.error || 'Erro ao excluir', 'Erro'),
    });
  }

  recarregarModulos(): void {
    this.aulasCache.set(new Map());
    this.moduloExpandido.set(null);
    this.carregarModulos();
  }

  // ── Foco do modal ──

  private focarModal(): void {
    setTimeout(() => {
      document.querySelector<HTMLElement>(
        '.modal-content input, .modal-content textarea, .modal-content button'
      )?.focus();
    }, 0);
  }
}
