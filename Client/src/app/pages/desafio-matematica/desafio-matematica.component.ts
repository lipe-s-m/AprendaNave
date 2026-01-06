import { AuthService } from './../../services/auth/auth.service';
import { DesafioJccService } from './../../services/desafio-jcc/desafio-jcc.service';
import { Component, inject, Input, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizService } from '../../services/quiz/quiz.service';
import { ToastrService } from 'ngx-toastr';
import { Observable, of, Subscription } from 'rxjs';
import { IModulo } from '../../shared/interfaces/curso.model';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user/user.service';
import { User } from '../../shared/interfaces/user.interface';

@Component({
  selector: 'app-desafio-matematica',
  standalone: true,
  imports: [ButtonComponent, CommonModule],
  templateUrl: './desafio-matematica.component.html',
  styleUrl: './desafio-matematica.component.scss',
})
export class DesafioMatematicaComponent {
  private subscription: Subscription | null = null;
  cursoId: string | null = null;
  moduloId: string | null = null;
  modulo$: Observable<IModulo | null> = of(null);
  inGame: boolean = false;
  initializingGame: boolean = true;
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
  maiorPontuacaoUser: number = 0;
  private userService = inject(UserService);
  userSignal: WritableSignal<User | null>;
  currentUser: User | null = null;
  nomeQuiz: string = 'Desafio Matemática';

  constructor(
    private activatedRoute: ActivatedRoute,
    private quizService: QuizService,
    private toastr: ToastrService,
    private router: Router,
    private desafioJccService: DesafioJccService,
    private authService: AuthService
  ) {
    this.userSignal = this.userService.getUserSignal();
  }

  ngOnInit(): void {
    // Initialize component
    this.handlerInitializingGame();
    this.number1 = this.randNumber1();
    this.number2 = this.randNumber2();
    this.resultNumber();
    console.log(this.nomeQuiz);

    this.obterUser();
    this.authService.isLogged().subscribe({
      next: (isLogged) => {
        console.log('Usuário logado:', isLogged);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  obterUser(): void {
    this.authService.isLogged().subscribe({
      next: (isLogged) => {
        if (!isLogged) {
          this.currentUser = JSON.parse(
            localStorage.getItem('guestUserData') || 'null'
          );
        } else {
          this.currentUser = this.userSignal();
        }
        console.log('to login?', isLogged);
      },
    });

    console.log('usuer:', this.currentUser);
  }

  handlerInitializingGame() {
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
    let number1 = 0;
    if (this.questionIndex < 15) {
      number1 = Math.floor(Math.random() * 10);
    } else if (this.questionIndex >= 15 && this.questionIndex < 30) {
      number1 = Math.floor(Math.random() * 15);
    } else if (this.questionIndex >= 30 && this.questionIndex < 60) {
      number1 = Math.floor(Math.random() * 15);
    }
    return number1;
  }
  randNumber2(): number {
    let number2 = Math.floor(Math.random() * 10);
    if (this.questionIndex > 45 && this.questionIndex < 60) {
      number2 = Math.floor(Math.random() * 12);
    } else if (this.questionIndex > 60) {
      number2 = Math.floor(Math.random() * 15);
    }
    return number2;
  }
  resultNumber(): void {
    this.opIndex = this.balancearDificuldade(this.questionIndex);
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
  balancearDificuldade(questionIndex: number): number {
    let opIndex: number = 0;
    if (questionIndex < 6) return Math.floor(Math.random() * 2);
    if (questionIndex >= 6 && questionIndex < 10)
      return Math.floor(Math.random() * 3);

    opIndex = Math.floor(Math.random() * 4);
    if (questionIndex >= 10 && questionIndex < 20) {
      console.log('index: ' + opIndex);
      if (opIndex === 3 && this.number2 !== 0) {
        console.log('oi');

        while (
          this.isFloat(this.number1 / this.number2) ||
          this.number1 % this.number2 !== 0
        ) {
          console.log('divisao quebrada');
          this.number1 = this.randNumber1();
          this.number2 = this.randNumber2();
        }
      }
    } else if (questionIndex >= 20) {
      opIndex = Math.floor(Math.random() * 4);
    }

    return opIndex;
  }
  isFloat(x: any): boolean {
    if (!isNaN(x)) {
      if (parseInt(x) != parseFloat(x)) {
        return true;
      }
    }
    return false;
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
        if (this.number2 !== 0) {
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
    console.log('resposta', answer);
    console.log('result', this.result);
    console.log(answer === this.result);

    if (answer != null && answer === this.result) {
      audio.src = 'assets/retro-coin.mp3';
      audio.load();
      audio.play();
      this.points += 1;
      this.nextQuestion();
    } else {
      audio.src = 'assets/error.mp3';
      audio.load();
      audio.play();
      this.erros += 1;
      if (this.erros > 0) {
        this.toastr.error(
          'Tente novamente para melhorar sua colocação!',
          'Você perdeu!'
        );
        this.resetingGame = true;
        this.inGame = false;
        this.maiorPontuacaoUser = Number(
          sessionStorage.getItem('maiorPontuacaoDesafioJcc')
        );
        console.log(
          `Maior pontuacao: ${this.maiorPontuacaoUser}, pontuacao atual: ${this.points}`
        );

        if (
          this.maiorPontuacaoUser === null ||
          this.points > this.maiorPontuacaoUser
        ) {
          console.log('atualizando pontuacao');
          this.atualizarPontuacaoNoServidor();
        }
        return;
      }
      this.nextQuestion();
    }
  }
  atualizarPontuacaoNoServidor(): void {
    sessionStorage.setItem('maiorPontuacaoDesafioJcc', this.points.toString());

    if (this.currentUser && typeof this.currentUser.id === 'number') {
      console.log(this.currentUser.id);

      if (this.nomeQuiz === 'Desafio Matemática') {
        console.log('Entrei aq');
        this.desafioJccService
          .updatePontuacao(
            this.points,
            this.currentUser.id,
            this.currentUser.nome
          )
          .subscribe({
            next: (response) => {
              console.log('Pontuação atualizada no servidor:', response);
            },
          });
      } else {
        console.warn('User id not available; skipping server update');
      }
    }
  }
  nextQuestion() {
    this.questionIndex += 1;
    this.number1 = this.randNumber1();
    this.number2 = this.randNumber2();
    this.resultNumber();
    this.resultOp();
    this.iniciarContagemTempoRestante();
  }

  refazerQuiz(): void {
    this.initializingGame = false;
    this.resetingGame = false;
    this.points = 0;
    this.erros = 0;
    this.questionIndex = 0;
    this.ganhou = false;
    this.handlerInitializingGame();
  }
  voltarPraHome() {
    this.router.navigate(['/home']);
  }
  voltarParaRanking() {
    this.router.navigate(['/desafiojcc']);
  }
  getDificuldade(): number {
    if (this.points <= 8) return 13;
    if (this.points > 8 && this.points <= 15) return 10;
    if (this.points > 15 && this.points <= 25) return 7;
    if (this.points > 25 && this.points <= 45) return 5;
    if (this.points > 45 && this.points <= 70) return 4;
    return 3;
  }
  iniciarContagemTempoRestante(): void {
    const questionIndexAtual = this.questionIndex;

    if (this.inGame) {
      this.tempoRestante = this.getDificuldade();
      const interval = setInterval(() => {
        this.tempoRestante -= 1;
        if (this.tempoRestante <= 0 && this.inGame) {
          clearInterval(interval);
          this.tempoRestante = this.getDificuldade();
          this.checkAnswer(null);
        }
        if (this.questionIndex !== questionIndexAtual) {
          clearInterval(interval);
          this.tempoRestante = this.getDificuldade();
        }
      }, 1000);
    }
  }
}
