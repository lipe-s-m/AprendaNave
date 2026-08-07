import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Curso, CreateCursoDto, CreateModuloDto, CreateAulaDto } from '../../models/curso.model';
import { map, Observable } from 'rxjs';

export interface PaginaCursos {
  cursos: Curso[];
  temMais: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CursoService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // ── Cursos ──

  getCursos(): Observable<Curso[]> {
    // Evita que o navegador reutilize uma lista anterior após uma aprovação no admin.
    return this.http.get<Curso[]>(`${this.apiUrl}/cursos/aprovados`, {
      params: { cacheBust: Date.now().toString() },
    });
  }

  getCursosPaginados(pagina: number): Observable<PaginaCursos> {
    return this.http
      .get<Curso[]>(`${this.apiUrl}/cursos/aprovados`, {
        params: {
          pagina: pagina.toString(),
          cacheBust: Date.now().toString(),
        },
        observe: 'response',
      })
      .pipe(
        map((resposta: HttpResponse<Curso[]>) => ({
          cursos: resposta.body ?? [],
          temMais: resposta.headers.get('X-Has-More') === 'true',
        }))
      );
  }

  getCursoById(cursoId: number): Observable<Curso> {
    return this.http.get<Curso>(`${this.apiUrl}/cursos/${cursoId}`);
  }

  createCurso(curso: CreateCursoDto): Observable<Curso> {
    return this.http.post<Curso>(`${this.apiUrl}/cursos`, curso);
  }

  /** Envia a capa ao Cloudinary e devolve a URL segura para salvar no curso. */
  uploadLogoCurso(file: File): Observable<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ logoUrl: string }>(
      `${this.apiUrl}/cursos/upload-logo`,
      formData
    );
  }

  updateCurso(id: number, data: Partial<CreateCursoDto>): Observable<Curso> {
    return this.http.put<Curso>(`${this.apiUrl}/cursos/${id}`, data);
  }

  deleteCurso(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.apiUrl}/cursos/${id}`);
  }

  getMeusCursos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${this.apiUrl}/cursos/me`);
  }

  // ── Módulos ──

  getModulosByCurso(cursoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/cursos/${cursoId}/modulos`);
  }

  createModulo(cursoId: number, data: CreateModuloDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/cursos/${cursoId}/modulos`, data);
  }

  updateModulo(id: number, data: Partial<CreateModuloDto>): Observable<any> {
    return this.http.put(`${this.apiUrl}/modulos/${id}`, data);
  }

  deleteModulo(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.apiUrl}/modulos/${id}`);
  }

  // ── Aulas ──

  createAula(moduloId: number, data: CreateAulaDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/modulos/${moduloId}/aulas`, data);
  }

  updateAula(id: number, data: Partial<CreateAulaDto>): Observable<any> {
    return this.http.put(`${this.apiUrl}/aulas/${id}`, data);
  }

  deleteAula(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.apiUrl}/aulas/${id}`);
  }

  getAulasByModulo(moduloId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/modulos/${moduloId}/aulas`);
  }
}
