import { Injectable, OnInit } from '@angular/core';
import { ModuloService } from '../modulo/modulo.service';
import { IModulo } from '../../shared/interfaces/curso.model';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  constructor(private moduloService: ModuloService) {}
  getQuiz(
    idCurso: string | null,
    idModulo: string | null
  ): Observable<IModulo | null> {
    if (idCurso && idModulo) {
      const targetId = parseInt(idModulo!);
      return this.moduloService.getModulos(parseInt(idCurso)).pipe(
        map((modulos) => {
          if (!modulos || isNaN(targetId)) {
            return null;
          }
          const moduloEncontrado = modulos.find((m) => m.id === targetId);
          return moduloEncontrado || null;
        })
      );
    }
    return of(null);
  }
}
