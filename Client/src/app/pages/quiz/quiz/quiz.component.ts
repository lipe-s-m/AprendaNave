import { QuizService } from './../../../services/quiz/quiz.service';
import { Observable, of, Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { SubheaderComponent } from '../../../shared/components/subheader/subheader.component';
import { ActivatedRoute, Router } from '@angular/router';
import { IModulo } from '../../../shared/interfaces/curso.model';
import { AsyncPipe, NgIf, NgForOf, NgFor } from '@angular/common';
import { CdkAriaLive } from '../../../../../node_modules/@angular/cdk/a11y/index';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [ButtonComponent, SubheaderComponent, NgIf, AsyncPipe, NgFor],

  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss',
})
export class QuizComponent implements OnInit, OnDestroy {
  private subscription: Subscription | null = null;
  cursoId: string | null = null;
  moduloId: string | null = null;
  modulo$: Observable<IModulo | null> = of(null);
  inGame: boolean = false;
  initializingGame: boolean = false;
  resetingGame: boolean = false;
  contagemRegressiva: number = 3;
  tempoRestante: number = 10;
  number1: number = 0;
  number2: number = 0;
  result: number = 0;
  opIndex: number = 0;
  questions: number[] = [0, 0, 0, 0];
  points: number = 0;
  questionIndex: number = 0;
  ganhou: boolean = false;
  constructor(
    private activatedRoute: ActivatedRoute,
    private quizService: QuizService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize component
    // Example: Load quiz data based on cursoId
    this.subscription = this.activatedRoute.paramMap.subscribe((params) => {
      this.cursoId = params.get('trilhaId');
      this.moduloId = params.get('moduloId');
    });

    this.modulo$ = this.quizService.getQuiz(this.cursoId, this.moduloId);

    this.randNumber1();
    this.randNumber2();
    this.resultNumber();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  handlerInitializingGame() {
    if (this.initializingGame) {
      return;
    }
    this.initializingGame = true;

    const interval = setInterval(() => {
      this.contagemRegressiva--;

      if (this.contagemRegressiva === 0) {
        clearInterval(interval);
        this.inGame = true;
        this.contagemRegressiva = 3;
        this.initializingGame = false;
        this.resetingGame = false;
        this.points = 0;
        this.questionIndex = 0;
        this.iniciarContagemTempoRestante();
      }
    }, 1000);
  }
  randNumber1(): number {
    this.number1 = Math.floor(Math.random() * 10);
    if (this.number1 === 0) {
      this.number1 = 1;
    }
    return this.number1;
  }
  randNumber2(): number {
    this.number2 = Math.floor(Math.random() * 10);
    if (this.number2 === 0) {
      this.number2 = 1;
    }
    return this.number2;
  }
  resultNumber(): void {
    this.opIndex = Math.floor(Math.random() * 4);
    this.result = this.calcNumber();

    this.questions = [this.result];

    while (this.questions.length < 4) {
      let incorrectAnswer = this.generateIncorrectAnswer(this.result);

      if (!this.questions.includes(incorrectAnswer)) {
        this.questions.push(incorrectAnswer);
      }
    }

    this.shuffleArray(this.questions);
  }

  private generateIncorrectAnswer(correctAnswer: number): number {
    const offset = Math.floor(Math.random() * 21) - 10;
    let incorrect = correctAnswer + offset;

    if (incorrect === correctAnswer) {
      incorrect += incorrect > 0 ? 1 : -1;
    }

    return Math.max(0, incorrect);
  }

  private shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  calcNumber(): number {
    switch (this.opIndex) {
      case 0:
        return this.number1 + this.number2;
      case 1:
        return this.number1 - this.number2;
      case 2:
        return this.number1 * this.number2;
      case 3:
        if (this.number2 !== 0 || this.number1 !== 0) {
          if (this.number1 < this.number2) {
            [this.number1, this.number2] = [this.number2, this.number1];
          }
          return this.number1 / this.number2;
        } else {
          console.error('Divisão por zero não permitida');
          return 0;
        }
      default:
        return 0;
    }
  }
  resultOp(): string {
    switch (this.opIndex) {
      case 0:
        return '+';
      case 1:
        return '-';
      case 2:
        return '*';
      case 3:
        return '/';

      default:
        return 'error';
    }
  }
  checkAnswer(answer: number | null) {
    let audio = new Audio();

    if (answer && answer === this.result) {
      audio.src = 'assets/retro-coin.mp3';
      audio.load();
      audio.play();
      this.toastr.success('Resposta Correta!');
      this.points += 1;
      this.nextQuestion();
    } else {
      audio.src = 'assets/error.mp3';
      audio.load();
      audio.play();
      this.toastr.error('Resposta Errada!');

      this.nextQuestion();
    }
  }
  nextQuestion() {
    if (this.questionIndex >= 10) {
      this.resetingGame = true;
      this.inGame = false;
      if (this.points >= 7) {
        this.ganhou = true;
        this.toastr.success('Parabéns! Você completou o quiz!');
      } else {
        this.toastr.error(
          'Você não atingiu a pontuação necessária. Tente novamente!'
        );
        this.ganhou = false;
      }
    }
    this.questionIndex += 1;
    this.randNumber1();
    this.randNumber2();
    this.resultNumber();
    this.resultOp();
    this.iniciarContagemTempoRestante();
  }
  voltarParaTrilha() {
    if (this.cursoId && this.moduloId) {
      this.inGame = false;
      this.toastr.info('Voltando para a trilha...');
      this.router.navigate(['/trilha', this.cursoId]);
    }
  }
  moduloConcluido(): void {
    this.toastr.success('Quiz concluído com sucesso', 'Parabens!');
    this.router.navigate(['/trilha', this.cursoId]);
  }
  refazerQuiz(): void {
    this.toastr.info('Não desista, tente novamente!');
    this.inGame = false;
    this.initializingGame = false;
    this.resetingGame = false;
  }
  iniciarContagemTempoRestante(): void {
    console.log('fui chamado');
    const questionIndexAtual = this.questionIndex;

    if (this.inGame) {
      console.log('ingame');

      this.tempoRestante = 10;
      const interval = setInterval(() => {
        this.tempoRestante -= 1;
        if (this.tempoRestante <= 0) {
          clearInterval(interval);
          this.tempoRestante = 10;
          this.checkAnswer(null);
        }
        if (this.questionIndex !== questionIndexAtual) {
          clearInterval(interval);
          this.tempoRestante = 10;
        }
      }, 1000);
    }
  }
}
