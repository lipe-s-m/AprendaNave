import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Ranking } from '../../shared/interfaces/user.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DesafioJccService {
  constructor(private httpClient: HttpClient) {}

  apiUrl: string = environment.apiUrl;
  getRanking() {
    return this.httpClient.get<Ranking[]>(
      `${this.apiUrl}/desafio/desafio-jcc/ranking`
    );
  }
  updatePontuacao(pontuacao: number, id: number, nome: string) {
    const payload = {
      PontuacaoAluno: pontuacao,
      IdAluno: id,
      NomeAluno: nome,
    };
    return this.httpClient.patch(
      `${this.apiUrl}/desafio/desafio-jcc/pontuacao`,
      payload
    );
  }
  obterTodosDesafiantes() {
    return this.httpClient.get<any[]>(
      `${this.apiUrl}/desafio/desafio-jcc/desafiantes`
    );
  }
}
