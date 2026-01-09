import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Curso, CreateCursoDto } from '../../models/curso.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CursoService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  getCursos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${this.apiUrl}/cursos/aprovados`);
  }

  getCursoById(cursoId: number): Observable<Curso> {
    return this.http.get<Curso>(`${this.apiUrl}/cursos/${cursoId}`);
  }

  createCurso(curso: CreateCursoDto): Observable<Curso> {
    return this.http.post<Curso>(`${this.apiUrl}/cursos`, curso);
  }

  getMeusCursos(): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${this.apiUrl}/cursos/me`);
  }
}
