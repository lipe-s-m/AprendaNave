import { Injectable, computed, signal } from '@angular/core';
import { AulaDTO } from '../../shared/interfaces/aulas';

interface NavigationState {
  cursoId: number | null;
  moduloId: number | null;
  aulaId: number | null;
  nomeCurso: string | null;
  descricaoCurso: string | null;
  nomeModulo: string | null;
  aulas: AulaDTO[] | null;
}

@Injectable({
  providedIn: 'root',
})
export class NavigationStateService {
  private readonly state = signal<NavigationState>({
    cursoId: null,
    moduloId: null,
    aulaId: null,
    nomeCurso: null,
    descricaoCurso: null,
    nomeModulo: null,
    aulas: null,
  });

  readonly cursoId = computed(() => this.state().cursoId);
  readonly moduloId = computed(() => this.state().moduloId);
  readonly aulaId = computed(() => this.state().aulaId);
  readonly nomeCurso = computed(() => this.state().nomeCurso);
  readonly descricaoCurso = computed(() => this.state().descricaoCurso);
  readonly nomeModulo = computed(() => this.state().nomeModulo);
  readonly aulas = computed(() => this.state().aulas);

  readonly contextoCompleto = computed(() => {
    const s = this.state();
    return {
      cursoId: s.cursoId,
      moduloId: s.moduloId,
      aulaId: s.aulaId,
      nomeCurso: s.nomeCurso,
      descricaoCurso: s.descricaoCurso,
      nomeModulo: s.nomeModulo,
      aulas: s.aulas,
      temCurso: s.cursoId !== null,
      temModulo: s.moduloId !== null,
      temAula: s.aulaId !== null,
      temAulas: s.aulas !== null && s.aulas.length > 0,
    };
  });

  setCurso(cursoId: number | null, nomeCurso: string | null = null): void {
    this.state.update((s) => ({
      ...s,
      cursoId,
      nomeCurso,
      moduloId: null,
      nomeModulo: null,
      aulaId: null,
    }));
  }
  setDescricaoCurso(descricaoCurso: string | null = null): void {
    this.state.update((s) => ({
      ...s,
      descricaoCurso,
    }));
  }
  setModulo(moduloId: number | null, nomeModulo: string | null = null): void {
    this.state.update((s) => ({
      ...s,
      moduloId,
      nomeModulo,
      aulaId: null,
    }));
  }

  setAula(aulaId: number | null): void {
    this.state.update((s) => ({
      ...s,
      aulaId,
    }));
  }

  setAulas(aulas: AulaDTO[] | null): void {
    this.state.update((s) => ({
      ...s,
      aulas,
    }));
  }

  updateIdContexto(
    cursoId: number | null,
    moduloId: number | null,
    aulaId: number | null
  ): void {
    this.state.update((s) => ({
      ...s,
      cursoId,
      moduloId,
      aulaId,
    }));
  }

  limpar(): void {
    this.state.set({
      cursoId: null,
      moduloId: null,
      aulaId: null,
      nomeCurso: null,
      descricaoCurso: null,
      nomeModulo: null,
      aulas: null,
    });
  }
}
