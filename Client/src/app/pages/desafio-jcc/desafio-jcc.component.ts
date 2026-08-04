import { AuthService } from './../../services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Router } from '@angular/router';
import { DesafioJccService } from '../../services/desafio-jcc/desafio-jcc.service';
import { Ranking } from '../../shared/interfaces/user.interface';
import { InputComponent } from '../../shared/components/input/input.component';
import { LoginService } from '../../services/login/login.service';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import {
  FormControl,
  FormGroup,
  Validators,
  ɵInternalFormsSharedModule,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-desafio-jcc',
  standalone: true,
  imports: [
    CommonModule,
    SubheaderComponent,
    ButtonComponent,
    InputComponent,
    LoaderComponent,
    ɵInternalFormsSharedModule,
    ReactiveFormsModule,
  ],
  templateUrl: './desafio-jcc.component.html',
  styleUrls: ['./desafio-jcc.component.scss', 'modal-guest.scss'],
})
export class DesafioJccComponent implements OnInit {
  ranking: Ranking[] = [];
  isLogged: boolean = true;
  isGuest: boolean = false;
  isLoading: boolean = false;
  formCreateGuestUser = new FormGroup({
    nome: new FormControl('', [Validators.required]),
    contato: new FormControl('', [Validators.required]),
  });
  guestUserData: any = null;
  constructor(
    private router: Router,
    private desafioJccService: DesafioJccService,
    private authService: AuthService,
    private loginService: LoginService
  ) {}
  iniciarDesafio(): void {
    this.router.navigate(['/desafio-matematica']);
  }
  ngOnInit() {
    this.desafioJccService.getRanking().subscribe((data) => {
      this.ranking = data;
      // console.log(data);
    });

    this.obterUser();
  }
  obterUser(): void {
    this.authService.isLogged().subscribe({
      next: (isLoggedObservable) => {
        this.isLogged = isLoggedObservable;
        if (!isLoggedObservable) {
          this.guestUserData = JSON.parse(
            localStorage.getItem('guestUserData') || 'null'
          );
          this.isLogged = this.guestUserData !== null;
        }
      },
      error: () => {},
    });
  }
  criarContaVisitante(): void {
    this.isLoading = true;
    this.loginService
      .createGuestAccount({
        nome: this.formCreateGuestUser.value.nome || 'Visitante',
        contato:
          this.formCreateGuestUser.value.contato || 'visitante@example.com',
      })
      .subscribe({
        next: (response) => {
          localStorage.setItem('guestUserData', JSON.stringify(response));
          if (sessionStorage.getItem('maiorPontuacaoDesafioJcc')) {
            sessionStorage.removeItem('maiorPontuacaoDesafioJcc');
          }
          this.isLogged = true;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }
}
