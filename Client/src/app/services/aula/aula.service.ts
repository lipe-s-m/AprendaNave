import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface AulasCompletionState {
  // A chave é a string combinada, o valor é o Subject que armazena o status
  [key: string]: BehaviorSubject<boolean>;
}
@Injectable({
  providedIn: 'root',
})
export class AulaService {
  constructor() {}

  todasAsAulasConcluidas$: BehaviorSubject<boolean>[][] = [];
  private listaAulas: AulasCompletionState = {};

  private moduloCompletoSubject = new BehaviorSubject<{
    cursoId: number;
    moduloId: number;
  } | null>(null);
  moduloCompleto$ = this.moduloCompletoSubject.asObservable();

  getAulaKey(idCurso: number, idModulo: number, idAula: number): string {
    return `${idCurso}-${idModulo}-${idAula}`;
  }
  initializeAulas(
    aulasAPI: any[] | null,
    idCurso: number,
    idModulo: number,
    qtdAulas?: number | null
  ): void {
    if (!aulasAPI) {
      for (let index = 0; index < qtdAulas!; index++) {
        const key = this.getAulaKey(idCurso, idModulo, index + 1);

        this.listaAulas[key];

        this.listaAulas[key] = new BehaviorSubject<boolean>(false);
      }
      return;
    }
    aulasAPI.forEach((aula) => {
      const key = this.getAulaKey(idCurso, idModulo, aula.id);
      if (!this.listaAulas[key]) {
        this.listaAulas[key] = new BehaviorSubject<boolean>(false);
      }
    });
  }

  marcarAulaComoConcluida(
    idCurso: number,
    idModulo: number,
    idAula: number
  ): void {
    const key = this.getAulaKey(idCurso, idModulo, idAula);
    if (this.listaAulas[key]) {
      this.listaAulas[key].next(true);

      this.verificarTodasAsAulasConcluidas(idCurso, idModulo);
    }
  }

  verificarTodasAsAulasConcluidas(idCurso: number, idModulo: number): void {
    let aulasConcluidas = true;
    let aulasDoModuloEncontradas = false;

    const moduloKey = `${idCurso}-${idModulo}`;
    for (const key in this.listaAulas) {
      if (key.startsWith(moduloKey)) {
        aulasDoModuloEncontradas = true;
        const aulaStatus = this.listaAulas[key].getValue();
        if (aulaStatus === false) {
          aulasConcluidas = false;
          break;
        }
      }
    }
    if (aulasConcluidas && aulasDoModuloEncontradas) {
      this.moduloCompletoSubject.next({ cursoId: idCurso, moduloId: idModulo });
    }
  }
}
