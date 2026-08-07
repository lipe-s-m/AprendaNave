import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { Quiz, QuizQuestao, QuizService } from '../../services/quiz/quiz.service';

@Component({
  selector: 'app-gerenciar-quiz',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    LoaderComponent,
    SubheaderComponent,
  ],
  templateUrl: './gerenciar-quiz.component.html',
  styleUrl: './gerenciar-quiz.component.scss',
})
export class GerenciarQuizComponent implements OnInit {
  cursoId = 0;
  moduloId = 0;
  carregando = signal(true);
  salvando = signal(false);
  quiz = signal<Quiz | null>(null);

  titulo = '';
  descricao = '';
  notaMinima = 70;
  tempoPorQuestaoSegundos: number | null = null;
  enunciado = '';
  explicacao = '';
  alternativas = ['', '', '', ''];
  correta = 0;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly quizService: QuizService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cursoId = Number(this.route.snapshot.paramMap.get('cursoId'));
    this.moduloId = Number(this.route.snapshot.paramMap.get('moduloId'));
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.quizService.getQuizCriador(this.moduloId).subscribe({
      next: ({ quiz }) => {
        this.quiz.set(quiz);
        if (quiz) {
          this.titulo = quiz.titulo;
          this.descricao = quiz.descricao || '';
          this.notaMinima = quiz.notaMinima;
          this.tempoPorQuestaoSegundos = quiz.tempoPorQuestaoSegundos ?? null;
        }
        this.carregando.set(false);
      },
      error: () => {
        this.toastr.error('Não foi possível carregar o quiz.');
        this.carregando.set(false);
      },
    });
  }

  salvarQuiz(): void {
    if (!this.titulo.trim()) {
      this.toastr.info('Escolha um título para o quiz.');
      return;
    }

    this.salvando.set(true);
    const dados = {
      titulo: this.titulo,
      descricao: this.descricao,
      notaMinima: Number(this.notaMinima),
      tempoPorQuestaoSegundos:
        this.tempoPorQuestaoSegundos === null || this.tempoPorQuestaoSegundos === 0
          ? null
          : Number(this.tempoPorQuestaoSegundos),
    };
    const request = this.quiz()
      ? this.quizService.atualizarQuiz(this.moduloId, dados)
      : this.quizService.criarQuiz(this.moduloId, dados);

    request.subscribe({
      next: () => {
        this.toastr.success('Quiz salvo como pendente de aprovação.');
        this.salvando.set(false);
        this.carregar();
      },
      error: (erro) => {
        this.toastr.error(erro.error?.error || 'Erro ao salvar quiz.');
        this.salvando.set(false);
      },
    });
  }

  letraAlternativa(indice: number): string {
    return String.fromCharCode(65 + indice);
  }

  podeAdicionarQuestao(): boolean {
    return (
      !!this.quiz() &&
      !!this.enunciado.trim() &&
      this.alternativas.every((texto) => !!texto.trim())
    );
  }

  quantidadeAlternativasPreenchidas(): number {
    return this.alternativas.filter((texto) => !!texto.trim()).length;
  }

  /** Mantém cada input no mesmo nó do DOM enquanto o texto muda. */
  trackByAlternativa(indice: number): number {
    return indice;
  }

  adicionarQuestao(): void {
    const quiz = this.quiz();
    if (!quiz) return;
    if (!this.enunciado.trim()) {
      this.toastr.info('Escreva o enunciado da questão antes de adicionar.');
      return;
    }
    if (this.alternativas.some((texto) => !texto.trim())) {
      this.toastr.info('Preencha as quatro alternativas antes de adicionar.');
      return;
    }

    this.salvando.set(true);
    this.quizService
      .criarQuestao(quiz.id, {
        enunciado: this.enunciado,
        explicacao: this.explicacao,
        alternativas: this.alternativas.map((texto, indice) => ({
          texto,
          correta: indice === this.correta,
        })),
      })
      .subscribe({
        next: () => {
          this.enunciado = '';
          this.explicacao = '';
          this.alternativas = ['', '', '', ''];
          this.correta = 0;
          this.salvando.set(false);
          this.carregar();
        },
        error: (erro) => {
          this.toastr.error(erro.error?.error || 'Erro ao adicionar questão.');
          this.salvando.set(false);
        },
      });
  }

  excluirQuestao(questao: QuizQuestao): void {
    const quiz = this.quiz();
    if (!quiz || !confirm('Excluir esta questão?')) return;

    this.quizService.excluirQuestao(quiz.id, questao.id).subscribe({
      next: () => this.carregar(),
      error: () => this.toastr.error('Erro ao excluir questão.'),
    });
  }

  enviar(): void {
    this.quizService.enviarParaAprovacao(this.moduloId).subscribe({
      next: () => {
        this.toastr.success('Quiz enviado para aprovação.');
        this.carregar();
      },
      error: (erro) =>
        this.toastr.error(erro.error?.error || 'Revise as questões antes de enviar.'),
    });
  }

  voltar(): void {
    this.router.navigate(['/curso', this.cursoId, 'gerenciar']);
  }
}
