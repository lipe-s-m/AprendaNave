import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { LoaderComponent } from '../../../shared/components/loader/loader.component';
import { SubheaderComponent } from '../../../shared/components/subheader/subheader.component';
import { QuizService, QuizTentativa, ResultadoQuiz } from '../../../services/quiz/quiz.service';

@Component({ selector: 'app-quiz', standalone: true, imports: [CommonModule, ButtonComponent, LoaderComponent, SubheaderComponent], templateUrl: './quiz.component.html', styleUrl: './quiz.component.scss' })
export class QuizComponent implements OnInit {
  cursoId = 0; moduloId = 0;
  carregando = signal(true); iniciando = signal(false); finalizando = signal(false);
  status = signal<any>(null); tentativa = signal<QuizTentativa | null>(null); indice = signal(0);
  respostas = signal<Map<number, number>>(new Map()); resultado = signal<ResultadoQuiz | null>(null);

  constructor(private readonly route: ActivatedRoute, private readonly router: Router, private readonly quizService: QuizService, private readonly toastr: ToastrService) {}
  ngOnInit(): void { this.cursoId = Number(this.route.snapshot.paramMap.get('trilhaId')); this.moduloId = Number(this.route.snapshot.paramMap.get('moduloId')); this.carregarStatus(); }
  carregarStatus(): void { this.carregando.set(true); this.quizService.getStatus(this.moduloId).subscribe({ next: (status) => { this.status.set(status); this.carregando.set(false); }, error: () => { this.toastr.error('Não foi possível carregar o quiz.'); this.carregando.set(false); } }); }
  iniciar(): void { this.iniciando.set(true); this.quizService.iniciarTentativa(this.moduloId).subscribe({ next: (tentativa) => { this.tentativa.set(tentativa); this.indice.set(0); this.respostas.set(new Map()); this.iniciando.set(false); }, error: (e) => { this.toastr.error(e.error?.error || 'Não foi possível iniciar o quiz'); this.iniciando.set(false); this.carregarStatus(); } }); }
  questaoAtual() { return this.tentativa()?.questoes[this.indice()]; }
  selecionar(alternativaId: number): void { const questao = this.questaoAtual(); if (!questao) return; const respostas = new Map(this.respostas()); respostas.set(questao.id, alternativaId); this.respostas.set(respostas); }
  selecionada(alternativaId: number): boolean { const questao = this.questaoAtual(); return !!questao && this.respostas().get(questao.id) === alternativaId; }
  proxima(): void { if (!this.respostas().has(this.questaoAtual()?.id ?? 0)) return; if (this.indice() < (this.tentativa()?.questoes.length ?? 0) - 1) this.indice.update((i) => i + 1); else this.finalizar(); }
  anterior(): void { if (this.indice() > 0) this.indice.update((i) => i - 1); }
  finalizar(): void { const tentativa = this.tentativa(); if (!tentativa || this.finalizando()) return; this.finalizando.set(true); const respostas = [...this.respostas()].map(([questaoId, alternativaId]) => ({ questaoId, alternativaId })); this.quizService.finalizarTentativa(this.moduloId, tentativa.tentativaId, respostas).subscribe({ next: (resultado) => { this.resultado.set(resultado); this.finalizando.set(false); }, error: (e) => { this.toastr.error(e.error?.error || 'Não foi possível corrigir o quiz'); this.finalizando.set(false); } }); }
  voltar(): void { this.router.navigate(['/modulo', this.cursoId, this.moduloId]); }
}
