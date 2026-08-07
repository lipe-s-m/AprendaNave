import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type PapelChat = 'user' | 'assistant';

export interface MensagemAprendaBot {
  role: PapelChat;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class AprendaBotService {
  private readonly apiUrl = environment.apiUrl;

  /**
   * Emite cada trecho recebido do servidor. Fetch e usado aqui porque o
   * HttpClient aguarda o corpo inteiro antes de disponibilizar a resposta.
   */
  conversarEmTempoReal(
    mensagem: string,
    historico: MensagemAprendaBot[]
  ): Observable<string> {
    return new Observable<string>((observer) => {
      const abortController = new AbortController();

      const iniciarStream = async (): Promise<void> => {
        try {
          const resposta = await fetch(`${this.apiUrl}/aprendabot/chat/stream`, {
            method: 'POST',
            credentials: 'include',
            signal: abortController.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensagem, historico }),
          });

          if (!resposta.ok) {
            let erro = 'Nao consegui responder agora. Tente novamente.';
            try {
              const corpo = (await resposta.json()) as { error?: unknown };
              if (typeof corpo.error === 'string') erro = corpo.error;
            } catch {
              // Mantem a mensagem generica quando a resposta de erro nao for JSON.
            }
            observer.error({ error: { error: erro } });
            return;
          }

          if (!resposta.body) {
            observer.error({ error: { error: 'O AprendaBot nao iniciou a resposta.' } });
            return;
          }

          const reader = resposta.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          const processarLinha = (linha: string): boolean => {
            if (!linha.startsWith('data:')) return true;
            const data = linha.slice(5).trim();
            if (!data) return true;

            try {
              const evento = JSON.parse(data) as { delta?: unknown; error?: unknown };
              if (typeof evento.delta === 'string') observer.next(evento.delta);
              if (typeof evento.error === 'string') {
                observer.error({ error: { error: evento.error } });
                return false;
              }
            } catch {
              // Linhas fora do formato de dados do AprendaBot sao ignoradas.
            }
            return true;
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const linhas = buffer.split(/\r?\n/);
            buffer = linhas.pop() ?? '';
            for (const linha of linhas) {
              if (!processarLinha(linha)) return;
            }
          }

          if (buffer) processarLinha(buffer);
          observer.complete();
        } catch (erro) {
          if (!abortController.signal.aborted) observer.error(erro);
        }
      };

      void iniciarStream();
      return () => abortController.abort();
    });
  }
}
