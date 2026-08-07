import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Subscription } from 'rxjs';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import {
  AprendaBotService,
  MensagemAprendaBot,
} from '../../services/aprendabot/aprendabot.service';

@Component({
  selector: 'app-aprendabot',
  standalone: true,
  imports: [CommonModule, FormsModule, SubheaderComponent],
  templateUrl: './aprendabot.component.html',
  styleUrl: './aprendabot.component.scss',
})
export class AprendabotComponent implements OnDestroy {
  @ViewChild('historicoChat') private historicoChat?: ElementRef<HTMLElement>;

  readonly mensagens = signal<MensagemAprendaBot[]>([
    {
      role: 'assistant',
      content:
        'Ola! Eu sou o AprendaBot. Posso explicar um conceito, ajudar com um exercicio ou montar um plano de estudos. O que vamos aprender hoje?',
    },
  ]);
  readonly enviando = signal(false);
  readonly recebendoResposta = signal(false);
  mensagemAtual = '';
  private conversaAtiva?: Subscription;

  readonly sugestoes = [
    'Explique porcentagem com um exemplo',
    'Me ajude a entender uma equacao do 1o grau',
    'Como posso criar uma rotina de estudos?',
  ];

  constructor(private readonly aprendabotService: AprendaBotService) {}

  ngOnDestroy(): void {
    this.conversaAtiva?.unsubscribe();
  }

  enviarComEnter(evento: Event): void {
    const eventoTeclado = evento as KeyboardEvent;
    if (eventoTeclado.shiftKey) return;
    evento.preventDefault();
    this.enviarMensagem();
  }

  usarSugestao(sugestao: string): void {
    this.mensagemAtual = sugestao;
    this.enviarMensagem();
  }

  enviarMensagem(): void {
    const mensagem = this.mensagemAtual.trim();
    if (!mensagem || this.enviando()) return;

    const historico = this.mensagens().slice(-10);
    this.mensagens.update((mensagens) => [
      ...mensagens,
      { role: 'user', content: mensagem },
    ]);
    this.mensagemAtual = '';
    this.enviando.set(true);
    this.rolarParaFim();

    this.recebendoResposta.set(false);
    this.conversaAtiva = this.aprendabotService
      .conversarEmTempoReal(mensagem, historico)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (trecho) => {
          if (!this.recebendoResposta()) {
            this.recebendoResposta.set(true);
            this.mensagens.update((mensagens) => [
              ...mensagens,
              { role: 'assistant', content: trecho },
            ]);
          } else {
            this.mensagens.update((mensagens) =>
              mensagens.map((item, indice) =>
                indice === mensagens.length - 1
                  ? { ...item, content: item.content + trecho }
                  : item
              )
            );
          }
          this.rolarParaFim();
        },
        error: (erro) => {
          const mensagemErro =
            erro.error?.error ??
            'Nao consegui responder agora. Tente enviar sua pergunta novamente.';
          this.mensagens.update((mensagens) => [
            ...mensagens,
            { role: 'assistant', content: mensagemErro },
          ]);
          this.rolarParaFim();
        },
      });
  }

  formatarMensagem(texto: string): string {
    // O modelo e instruido a nao usar LaTeX, mas esta normalizacao evita que
    // comandos tecnicos como "\\div" cheguem ao aluno caso ele os use.
    const textoLegivel = texto
      .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1 dividido por $2')
      .replace(/\\times|\\cdot/g, ' x ')
      .replace(/\\div/g, ' dividido por ')
      .replace(/\\%/g, '%');

    const seguro = textoLegivel
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    return seguro
      .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  private rolarParaFim(): void {
    setTimeout(() => {
      const container = this.historicoChat?.nativeElement;
      if (container) container.scrollTop = container.scrollHeight;
    });
  }
}
