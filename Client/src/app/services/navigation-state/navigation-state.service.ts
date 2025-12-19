import { Injectable, computed, signal } from '@angular/core';

interface NavigationState {
  cursoId: number | null;
  moduloId: number | null;
  aulaId: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class NavigationStateService {
  private readonly state = signal<NavigationState>({
    cursoId: null,
    moduloId: null,
    aulaId: null,
  });

  readonly cursoId = computed(() => this.state().cursoId);
  readonly moduloId = computed(() => this.state().moduloId);
  readonly aulaId = computed(() => this.state().aulaId);

  readonly contextoCompleto = computed(() => {
    const s = this.state();
    return {
      cursoId: s.cursoId,
      moduloId: s.moduloId,
      aulaId: s.aulaId,
      temCurso: s.cursoId !== null,
      temModulo: s.moduloId !== null,
      temAula: s.aulaId !== null,
    };
  });

  setCurso(cursoId: number | null): void {
    this.state.update((s) => ({
      ...s,
      cursoId,
      moduloId: null,
      aulaId: null,
    }));
  }

  setModulo(moduloId: number | null): void {
    this.state.update((s) => ({
      ...s,
      moduloId,
      aulaId: null,
    }));
  }

  setAula(aulaId: number | null): void {
    this.state.update((s) => ({
      ...s,
      aulaId,
    }));
  }

  setContexto(
    cursoId: number | null,
    moduloId: number | null,
    aulaId: number | null
  ): void {
    this.state.set({
      cursoId,
      moduloId,
      aulaId,
    });
  }

  limpar(): void {
    this.state.set({
      cursoId: null,
      moduloId: null,
      aulaId: null,
    });
  }
}
