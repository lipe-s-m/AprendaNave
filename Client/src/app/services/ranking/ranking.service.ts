import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RankingCategoria,
  RankingResposta,
  RegistrarResultadoResposta,
} from '../../shared/interfaces/ranking.interface';

@Injectable({
  providedIn: 'root',
})
export class RankingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCategorias(): Observable<RankingCategoria[]> {
    return this.http.get<RankingCategoria[]>(`${this.apiUrl}/rankings/categorias`);
  }

  getRanking(slug: string, limite = 20): Observable<RankingResposta> {
    return this.http.get<RankingResposta>(`${this.apiUrl}/rankings/${slug}`, {
      params: { limite },
    });
  }

  registrarResultadoDesafioMatematica(pontos: number): Observable<RegistrarResultadoResposta> {
    return this.http.post<RegistrarResultadoResposta>(
      `${this.apiUrl}/rankings/desafio-matematica/resultado`,
      { pontos }
    );
  }
}
