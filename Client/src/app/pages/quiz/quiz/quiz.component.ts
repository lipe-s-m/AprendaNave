import { QuizService } from './../../../services/quiz/quiz.service';
import { Observable, of, Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { SubheaderComponent } from '../../../shared/components/subheader/subheader.component';
import { ActivatedRoute } from '@angular/router';
import { IModulo } from '../../../shared/interfaces/curso.model';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [ButtonComponent, SubheaderComponent, NgIf, AsyncPipe],

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
  contagemRegressiva: number = 3;
  constructor(
    private activatedRoute: ActivatedRoute,
    private quizService: QuizService
  ) {}

  ngOnInit(): void {
    // Initialize component
    // Example: Load quiz data based on cursoId
    this.subscription = this.activatedRoute.paramMap.subscribe((params) => {
      this.cursoId = params.get('trilhaId');
      this.moduloId = params.get('moduloId');
    });
    console.log(this.quizService.getQuiz(this.cursoId, this.moduloId));

    this.modulo$ = this.quizService.getQuiz(this.cursoId, this.moduloId);
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
      console.log(this.contagemRegressiva);
      console.log(this.initializingGame);

      this.contagemRegressiva--;

      if (this.contagemRegressiva === 0) {
        clearInterval(interval);
        this.inGame = true;
        this.contagemRegressiva = 3;
        this.initializingGame = false;
      }
    }, 1000);
  }
}
