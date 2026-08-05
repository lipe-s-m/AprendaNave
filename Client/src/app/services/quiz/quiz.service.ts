import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface QuizAlternativa { id: number; texto: string; correta?: boolean; ordem?: number; }
export interface QuizQuestao { id: number; enunciado: string; explicacao?: string | null; ordem?: number; status?: string; alternativas: QuizAlternativa[]; }
export interface Quiz { id: number; moduloId?: number; titulo: string; descricao?: string | null; notaMinima: number; status?: string; questoes?: QuizQuestao[]; }
export interface QuizTentativa { tentativaId: string; quiz: Quiz; questoes: QuizQuestao[]; }
export interface ResultadoQuiz { tentativaId: string; acertos: number; totalQuestoes: number; percentual: number; aprovado: boolean; navecoinsGanhos: number; }

@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly apiUrl = environment.apiUrl;
  constructor(private readonly http: HttpClient) {}

  getStatus(moduloId: number): Observable<any> { return this.http.get(`${this.apiUrl}/modulos/${moduloId}/quiz/status`); }
  iniciarTentativa(moduloId: number): Observable<QuizTentativa> { return this.http.post<QuizTentativa>(`${this.apiUrl}/modulos/${moduloId}/quiz/tentativas`, {}); }
  finalizarTentativa(moduloId: number, tentativaId: string, respostas: { questaoId: number; alternativaId: number }[]): Observable<ResultadoQuiz> { return this.http.post<ResultadoQuiz>(`${this.apiUrl}/modulos/${moduloId}/quiz/tentativas/${tentativaId}/finalizar`, { respostas }); }

  getQuizCriador(moduloId: number): Observable<{ quiz: Quiz | null }> { return this.http.get<{ quiz: Quiz | null }>(`${this.apiUrl}/modulos/${moduloId}/quiz/gerenciar`); }
  criarQuiz(moduloId: number, data: Partial<Quiz>): Observable<Quiz> { return this.http.post<Quiz>(`${this.apiUrl}/modulos/${moduloId}/quiz`, data); }
  atualizarQuiz(moduloId: number, data: Partial<Quiz>): Observable<any> { return this.http.put(`${this.apiUrl}/modulos/${moduloId}/quiz`, data); }
  enviarParaAprovacao(moduloId: number): Observable<any> { return this.http.post(`${this.apiUrl}/modulos/${moduloId}/quiz/enviar-aprovacao`, {}); }
  criarQuestao(quizId: number, data: { enunciado: string; explicacao?: string; alternativas: { texto: string; correta: boolean }[] }): Observable<QuizQuestao> { return this.http.post<QuizQuestao>(`${this.apiUrl}/quizzes/${quizId}/questoes`, data); }
  atualizarQuestao(quizId: number, questaoId: number, data: any): Observable<any> { return this.http.put(`${this.apiUrl}/quizzes/${quizId}/questoes/${questaoId}`, data); }
  excluirQuestao(quizId: number, questaoId: number): Observable<any> { return this.http.delete(`${this.apiUrl}/quizzes/${quizId}/questoes/${questaoId}`); }
}
