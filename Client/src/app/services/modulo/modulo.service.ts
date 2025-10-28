import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { EMPTY, Observable, shareReplay, tap } from 'rxjs';
import { IModulo } from '../../shared/interfaces/curso.model';

@Injectable({
  providedIn: 'root',
})
export class ModuloService {
  private apiUrl = environment.apiUrlDev;
  private moduloCache$: Observable<IModulo[] | null> = EMPTY;
  constructor(private http: HttpClient) {}

  getModulos(cursoId: number): Observable<IModulo[] | null> {
    // if (this.moduloCache$ === EMPTY) {
    this.moduloCache$ = this.http
      .get<IModulo[]>(`${this.apiUrl}/cursos/modulos?cursoId=${cursoId}`)
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
  clearCache(): void {
    this.moduloCache$ = EMPTY;
    console.log('[Cache]: Cache de módulos limpo.');
  }
}
