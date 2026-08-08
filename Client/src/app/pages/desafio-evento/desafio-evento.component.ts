import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription, interval } from 'rxjs';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { MathGameService } from '../../services/math-game/math-game.service';
import { AuthService } from '../../services/auth/auth.service';
import { DesafioEventoService, EventoDesafio, RankingEventoEntrada } from '../../services/desafio-evento/desafio-evento.service';

@Component({ selector: 'app-desafio-evento', standalone: true, imports: [CommonModule, FormsModule, ButtonComponent, LoaderComponent], templateUrl: './desafio-evento.component.html', styleUrl: './desafio-evento.component.scss' })
export class DesafioEventoComponent implements OnInit, OnDestroy {
  slug = ''; evento: EventoDesafio | null = null; ranking: RankingEventoEntrada[] = []; carregando = true; modoRanking = false; totalParticipantes = 0; limiteRanking = 10; carregandoMaisRanking = false;
  participantePronto = false; mostrarCadastro = false; nome = ''; contato = ''; tokenSessao: string | null = null;
  emJogo = false; preparando = false; contagemRegressiva = 3; encerrado = false; pontos = 0; expressao = ''; numero1 = 1; numero2 = 1; resultado = 0; opIndex = 0; opcoes: number[] = []; tempoRestante = 10;
  private timer?: ReturnType<typeof setInterval>; private countdown?: ReturnType<typeof setInterval>; private polling?: Subscription;
  constructor(private readonly route: ActivatedRoute, private readonly eventoService: DesafioEventoService, private readonly authService: AuthService, private readonly math: MathGameService, private readonly toastr: ToastrService) {}
  ngOnInit(): void { this.slug = this.route.snapshot.paramMap.get('slug') || ''; this.modoRanking = this.route.snapshot.queryParamMap.get('ranking') === '1'; this.carregar(); this.polling = interval(this.modoRanking ? 5000 : 10000).subscribe(() => this.carregarRanking()); }
  ngOnDestroy(): void { this.pararTimer(); if (this.countdown) clearInterval(this.countdown); this.polling?.unsubscribe(); }
  private chaveSessao() { return `aprendanave:desafio-evento:${this.slug}:sessao`; }
  carregar(): void { this.eventoService.getEvento(this.slug).subscribe({ next: (dados) => { this.evento = dados.evento; this.ranking = dados.entradas; this.totalParticipantes = dados.totalParticipantes; this.carregando = false; if (!this.modoRanking) this.prepararParticipacao(); }, error: () => { this.carregando = false; this.toastr.error('Evento não encontrado ou indisponível.'); } }); }
  carregarRanking(): void { if (!this.slug) return; this.eventoService.getRanking(this.slug, this.limiteRanking).subscribe({ next: (dados) => { this.ranking = dados.entradas; this.totalParticipantes = dados.totalParticipantes; } }); }
  temMaisRanking(): boolean { return this.ranking.length < this.totalParticipantes; }
  mostrarMaisRanking(): void { if (this.carregandoMaisRanking || !this.temMaisRanking()) return; this.carregandoMaisRanking = true; this.limiteRanking += 10; this.eventoService.getRanking(this.slug, this.limiteRanking).subscribe({ next: (dados) => { this.ranking = dados.entradas; this.totalParticipantes = dados.totalParticipantes; this.carregandoMaisRanking = false; }, error: () => { this.carregandoMaisRanking = false; this.toastr.error('Não foi possível carregar mais participantes.'); } }); }
  private prepararParticipacao(): void { if (this.participantePronto || !this.evento?.podeJogar) return; this.authService.isLogged().subscribe({ next: (logado) => { if (logado) { this.eventoService.entrarComoAluno(this.slug).subscribe({ next: () => this.participantePronto = true, error: () => this.toastr.error('Não foi possível entrar no evento.') }); return; } const sessao = localStorage.getItem(this.chaveSessao()); if (sessao) { this.tokenSessao = sessao; this.participantePronto = true; } else this.mostrarCadastro = true; } }); }
  cadastrar(): void { if (!this.nome.trim() || !this.contato.trim()) return; this.eventoService.criarGuest(this.slug, this.nome.trim(), this.contato.trim()).subscribe({ next: (dados) => { this.tokenSessao = dados.tokenSessao; localStorage.setItem(this.chaveSessao(), dados.tokenSessao); this.participantePronto = true; this.mostrarCadastro = false; }, error: (e) => this.toastr.error(e.error?.error || 'Não foi possível criar sua participação.') }); }
  iniciar(): void { if (!this.participantePronto || !this.evento?.podeJogar || this.preparando) return; this.encerrado = false; this.pontos = 0; this.preparando = true; this.contagemRegressiva = 3; this.countdown = setInterval(() => { this.contagemRegressiva--; if (this.contagemRegressiva === 0) { if (this.countdown) clearInterval(this.countdown); this.preparando = false; this.emJogo = true; this.proximaPergunta(); } }, 1000); }
  private proximaPergunta(): void { const pergunta = this.math.generateProgressiveQuestion(this.pontos); this.numero1 = pergunta.num1; this.numero2 = pergunta.num2; this.opIndex = pergunta.opIndex; this.expressao = pergunta.expression || `${pergunta.num1} ${pergunta.operator} ${pergunta.num2}`; this.resultado = pergunta.result; this.opcoes = this.math.generateOptions(this.resultado); this.tempoRestante = this.tempoPorPergunta(); this.pararTimer(); this.timer = setInterval(() => { this.tempoRestante--; if (this.tempoRestante <= 0) this.responder(null); }, 1000); }
  operador(): string { return this.math.getOperatorSymbol(this.opIndex); }
  responder(resposta: number | null): void { if (!this.emJogo) return; if (resposta === this.resultado) { this.pontos++; this.proximaPergunta(); return; } this.finalizar(); }
  private tempoPorPergunta(): number { return this.pontos <= 8 ? 13 : this.pontos <= 15 ? 10 : this.pontos <= 25 ? 7 : this.pontos <= 45 ? 5 : 4; }
  private pararTimer(): void { if (this.timer) clearInterval(this.timer); this.timer = undefined; }
  private finalizar(): void { this.pararTimer(); this.emJogo = false; this.encerrado = true; this.eventoService.registrarResultado(this.slug, this.pontos, this.tokenSessao || undefined).subscribe({ next: (res) => { this.toastr.success(res.melhorou ? `Novo recorde: ${res.melhorPontuacao} pontos!` : `Seu recorde é ${res.melhorPontuacao} pontos.`); this.carregarRanking(); }, error: (e) => this.toastr.error(e.error?.error || 'Não foi possível registrar a pontuação.') }); }
}
