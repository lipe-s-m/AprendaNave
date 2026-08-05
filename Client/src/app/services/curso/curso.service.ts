import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Curso, CreateCursoDto, CreateModuloDto, CreateAulaDto } from '../../models/curso.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CursoService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // ── Cursos ──

  getCursos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${this.apiUrl}/cursos/aprovados`);
  }

  getCursoById(cursoId: number): Observable<Curso> {
    return this.http.get<Curso>(`${this.apiUrl}/cursos/${cursoId}`);
  }

  createCurso(curso: CreateCursoDto): Observable<Curso> {
    return this.http.post<Curso>(`${this.apiUrl}/cursos`, curso);
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
