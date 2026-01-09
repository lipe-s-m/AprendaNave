import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { EMPTY, map, Observable, shareReplay, tap } from 'rxjs';
import { IModulo } from '../../shared/interfaces/curso.model';

@Injectable({
  providedIn: 'root',
})
export class ModuloService {
  private apiUrl = environment.apiUrl;
  private moduloCache$: Observable<IModulo[] | null> = EMPTY;
  constructor(private http: HttpClient) {}

  getModulos(cursoId: number): Observable<IModulo[] | null> {
    // if (this.moduloCache$ === EMPTY) {
    this.moduloCache$ = this.http
      .get<IModulo[]>(`${this.apiUrl}/cursos/${cursoId}/modulos/aprovados`)
      .pipe(
        tap(() =>
          console.log(
            `[Cache]: Requisição HTTP REALIZADA para cursoId ${cursoId}`
          )
        ),
        shareReplay({ bufferSize: 1, refCount: true })
      );
    // }
    return this.moduloCache$;
  }

  getModuloById(cursoId: number, moduloId: number): Observable<IModulo | null> {
    return this.getModulos(cursoId).pipe(
      map((modulos) =>
        modulos
          ? modulos.find((modulo) => modulo.id === moduloId) ?? null
          : null
      )
    );
  }

  updateModuloStatus(
    moduloId: number,
    status: 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO'
  ): Observable<IModulo> {
    return this.http.patch<IModulo>(`${this.apiUrl}/modulos/${moduloId}`, {
      status,
    });
  }
  clearCache(): void {
    this.moduloCache$ = EMPTY;
  }
}
