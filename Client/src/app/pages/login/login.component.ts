import { Component } from '@angular/core';
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
export class LoginComponent {
  constructor(private router: Router) {}
  signInFormIsActive: boolean = false;
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
  submit() {
    alert('suvmitou');
  }
  handleChangeForm() {
    this.signInFormIsActive = !this.signInFormIsActive;
  }
  handleBackToMenu() {
    console.log(this.formSignIn.value);

    // this.formSignIn.reset();
    this.router.navigate(['']);
    console.log(this.formSignIn.value);
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
