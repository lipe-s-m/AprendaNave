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
import { UserService } from '../../../services/user/user.service';
import { MathGameService } from '../../../services/math-game/math-game.service';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [ButtonComponent, SubheaderComponent, NgIf, AsyncPipe, NgFor],

  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss',
})
export class QuizComponent implements OnInit, OnDestroy {
  private subscription: Subscription | null = null;
  private countdownInterval: any = null;
  private timerInterval: any = null;
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
  erros: number = 0;
  questionIndex: number = 0;
  ganhou: boolean = false;
  dificuldade: string = 'medio';

  constructor(
    private activatedRoute: ActivatedRoute,
    private quizService: QuizService,
    private toastr: ToastrService,
    private router: Router,
    private userService: UserService,
    private mathGameService: MathGameService
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
    clearInterval(this.countdownInterval);
    clearInterval(this.timerInterval);
  }
  getDificuldade(): number {
    switch (this.dificuldade) {
      case 'facil':
        return 20;
      case 'medio':
        return 10;
      case 'dificil':
        return 5;
      default:
        return 10;
    }
  }
  setDificuldade(nivel: string) {
    this.dificuldade = nivel;
  }
  handlerInitializingGame() {
    if (this.initializingGame) {
      return;
    }
    this.initializingGame = true;

    clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      this.contagemRegressiva--;

      if (this.contagemRegressiva === 0) {
        clearInterval(this.countdownInterval);
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

    const question = this.mathGameService.generateQuestion(
      this.number1,
      this.number2,
      this.opIndex
    );
    this.number1 = question.num1;
    this.number2 = question.num2;
    this.result = question.result;

    this.questions = this.mathGameService.generateOptions(this.result);
  }

  resultOp(): string {
    return this.mathGameService.getOperatorSymbol(this.opIndex);
  }
  checkAnswer(answer: number | null) {
    let audio = new Audio();

    if (answer != null && answer === this.result) {
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
      this.erros += 1;
      if (this.erros > 3) {
        this.toastr.error(
          'Você errou muitas perguntas! Tente novamente.',
          'Você perdeu!'
        );
        this.resetingGame = true;
        this.inGame = false;

        return;
      }
      this.toastr.error('Resposta Errada!');
      this.nextQuestion();
    }
  }
  nextQuestion() {
    if (this.questionIndex >= 9) {
      this.resetingGame = true;
      this.inGame = false;
      if (this.points >= 7) {
        this.ganhou = true;
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
      this.points = 0;
      this.inGame = false;
      this.toastr.info('Voltando para as aulas...');
      this.router.navigate(['/modulo', this.cursoId, this.moduloId]);
    }
  }
  moduloConcluido(): void {
    let pontuacao = 0;
    switch (this.points) {
      case 10:
        pontuacao = 2000 / this.getDificuldade();
        this.toastr.success(
          `Você recebeu +${pontuacao} Navecoins!`,
          'Parabéns!'
        );
        break;
      case 9:
        pontuacao = 1500 / this.getDificuldade();
        this.toastr.success(
          `Você recebeu +${pontuacao} Navecoins!`,
          'Parabéns!'
        );
        break;
      case 8:
        pontuacao = 1500 / this.getDificuldade();
        this.toastr.success(
          `Você recebeu +${pontuacao} Navecoins!`,
          'Parabéns!'
        );
        break;
      case 7:
        pontuacao = 1000 / this.getDificuldade();
        this.toastr.success(
          `Você recebeu +${pontuacao} Navecoins!`,
          'Parabéns!'
        );
        break;
    }
    this.adicionarPontos(pontuacao);

    this.router.navigate(['/trilha', this.cursoId]);
  }
  refazerQuiz(): void {
    this.inGame = false;
    this.initializingGame = false;
    this.resetingGame = false;
    this.points = 0;
    this.erros = 0;
    this.questionIndex = 0;
    this.ganhou = false;
  }
  iniciarContagemTempoRestante(): void {
    const questionIndexAtual = this.questionIndex;

    if (this.inGame) {
      this.tempoRestante = this.getDificuldade();
      clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        this.tempoRestante -= 1;
        if (this.tempoRestante <= 0 && this.inGame) {
          clearInterval(this.timerInterval);
          this.tempoRestante = this.getDificuldade();
          this.checkAnswer(null);
        }
        if (this.questionIndex !== questionIndexAtual) {
          clearInterval(this.timerInterval);
          this.tempoRestante = this.getDificuldade();
        }
      }, 1000);
    }
  }
  adicionarPontos(pontos: number) {
    this.userService.setUserPoints(pontos);
  }
}
