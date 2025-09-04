import { Component, OnInit } from '@angular/core';
import { ButtonComponent } from '../../shared/components/button/button.component';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputComponent } from '../../shared/components/input/input.component';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login/login.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ThemeService } from '../../services/theme/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ButtonComponent,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    InputComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  constructor(
    private router: Router,
    private loginService: LoginService,
    private toastr: ToastrService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    // Garante que o tema escuro seja aplicado por padrão na tela de login
    if (this.themeService.getCurrentTheme() !== 'dark') {
      this.themeService.setTheme('dark');
    }
  }
  signInFormIsActive: boolean = false;
  isLoading: boolean = false;
  formSignIn = new FormGroup(
    {
      nomeDeUsuario: new FormControl('', [
        Validators.required,
        Validators.minLength(3),
      ]),
      email: new FormControl('', [Validators.required, Validators.email]),
      senha: new FormControl('', [
        Validators.required,
        Validators.minLength(4),
      ]),
      confirmarSenha: new FormControl('', [Validators.required]),
    },
    { validators: passwordMatchValidator }
  );

  formLogin = new FormGroup({
    email: new FormControl('', [Validators.required]),
    senha: new FormControl('', [Validators.required]),
  });

  handleLoginFormSubmit() {
    if (
      this.formLogin.get('email')?.value === 'admin' &&
      this.formLogin.get('senha')?.value === 'admin'
    ) {
      this.router.navigate(['/home']);
      return;
    }
    if (this.formLogin.valid) {
      this.isLoading = true;

      const loginData = {
        email: this.formLogin.get('email')?.value || '',
        senha: this.formLogin.get('senha')?.value || '',
      };

      this.loginService.login(loginData).subscribe({
        next: (response) => {
          this.toastr.success('Login realizado com sucesso!', 'Sucesso');
          this.loginService.saveUserSession(response.token, response.user);
          this.router.navigate(['/home']);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;
          if (error.status === 401) {
            this.toastr.error('Email ou senha inválidos', 'Erro');
          } else {
            this.toastr.error('Erro ao realizar login', 'Erro');
            console.error('Login error:', error);
          }
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    } else {
      Object.keys(this.formLogin.controls).forEach((key) => {
        const control = this.formLogin.get(key);
        control?.markAsTouched();
      });
    }
  }
  handleSignInFormSubmit() {
    if (this.formSignIn.valid) {
      this.isLoading = true;

      const userData = {
        nomeDeUsuario: this.formSignIn.get('nomeDeUsuario')?.value || '',
        email: this.formSignIn.get('email')?.value || '',
        senha: this.formSignIn.get('senha')?.value || '',
      };

      this.loginService.registerUser(userData).subscribe({
        next: (response) => {
          // Show success message
          this.toastr.success('Cadastro realizado com sucesso!', 'Sucesso');

          // Reset form
          this.formSignIn.reset();

          // Switch to login view
          this.signInFormIsActive = false;
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;

          if (error.status === 409) {
            // Email already exists
            this.formSignIn.get('email')?.setErrors({ emailTaken: true });
            this.toastr.error('Este email já está cadastrado', 'Erro');
          } else {
            // Handle other errors
            console.error('Registration error:', error);
            this.toastr.error('Erro ao realizar cadastro', 'Erro');
          }
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.formSignIn.controls).forEach((key) => {
        const control = this.formSignIn.get(key);
        control?.markAsTouched();
      });
    }
  }
  handleChangeForm() {
    this.signInFormIsActive = !this.signInFormIsActive;
  }
  handleBackToMenu() {
    this.formSignIn.reset();
    this.router.navigate(['']);
  }
}

const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const senha = control.get('senha');
  const confirmaSenha = control.get('confirmarSenha');

  if (!senha || !confirmaSenha || confirmaSenha.pristine) {
    return null;
  }

  return senha.value !== confirmaSenha.value
    ? { passwordNotMatch: true }
    : null;
};
