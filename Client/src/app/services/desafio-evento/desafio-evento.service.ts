import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EventoDesafio { id: number; slug: string; nome: string; descricao?: string; status: string; jogoHabilitado: boolean; podeJogar: boolean; }
export interface RankingEventoEntrada { posicao: number; nome: string; pontos: number; }
export interface EventoPublico { evento: EventoDesafio; entradas: RankingEventoEntrada[]; totalParticipantes: number; }

@Injectable({ providedIn: 'root' })
export class DesafioEventoService {
  private readonly apiUrl = environment.apiUrl;
  constructor(private readonly http: HttpClient) {}
  getEvento(slug: string): Observable<EventoPublico> { return this.http.get<EventoPublico>(`${this.apiUrl}/desafio-eventos/${slug}`); }
  getRanking(slug: string, limite = 20): Observable<{ entradas: RankingEventoEntrada[]; totalParticipantes: number }> { return this.http.get<any>(`${this.apiUrl}/desafio-eventos/${slug}/ranking?limite=${limite}`); }
  criarGuest(slug: string, nome: string, contato: string): Observable<any> { return this.http.post(`${this.apiUrl}/desafio-eventos/${slug}/participantes/guest`, { nome, contato }); }
  entrarComoAluno(slug: string): Observable<any> { return this.http.post(`${this.apiUrl}/desafio-eventos/${slug}/participantes/aluno`, {}); }
  registrarResultado(slug: string, pontos: number, token?: string): Observable<any> { return this.http.post(`${this.apiUrl}/desafio-eventos/${slug}/resultado`, { pontos }, token ? { headers: new HttpHeaders({ 'X-Desafio-Session': token }) } : {}); }
}
