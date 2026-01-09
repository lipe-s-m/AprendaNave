import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { CursoService } from '../../services/curso/curso.service';
import { UserService } from '../../services/user/user.service';
import { InputComponent } from '../../shared/components/input/input.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { CreateCursoDto } from '../../models/curso.model';

@Component({
  selector: 'app-criar-curso',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputComponent,
    ButtonComponent,
    SubheaderComponent,
    LoaderComponent,
  ],
  templateUrl: './criar-curso.component.html',
  styleUrl: './criar-curso.component.scss',
})
export class CriarCursoComponent implements OnInit {
  isLoading = signal(false);

  formCriarCurso = new FormGroup({
    nome: new FormControl('', [Validators.required, Validators.minLength(3)]),
    logo: new FormControl('', [Validators.required]),
    autor: new FormControl({ value: '', disabled: true }, [
      Validators.required,
    ]),
    descricao: new FormControl('', [
      Validators.required,
      Validators.minLength(10),
    ]),
  });

  constructor(
    private cursoService: CursoService,
    private userService: UserService,
    public router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const user = this.userService.getUserSignal()();
    if (user) {
      this.formCriarCurso.patchValue({
        autor: user.nome,
      });
    }
  }

  handleSubmit(): void {
    if (this.formCriarCurso.valid) {
      this.isLoading.set(true);

      const cursoData: CreateCursoDto = {
        nome: this.formCriarCurso.get('nome')?.value || '',
        logo: this.formCriarCurso.get('logo')?.value || '',
        autorNome: this.formCriarCurso.get('autor')?.value || '',
        descricao: this.formCriarCurso.get('descricao')?.value || '',
      };

      this.cursoService.createCurso(cursoData).subscribe({
        next: (response) => {
          this.toastr.success('Curso criado com sucesso!', 'Sucesso');
          this.router.navigate(['/meus-cursos']);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          const errorMessage =
            error.error?.message || 'Erro ao criar curso. Tente novamente.';
          this.toastr.error(errorMessage, 'Erro');
          console.error('Erro ao criar curso:', error);
        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
    } else {
      // Marcar todos os campos como touched para exibir erros
      Object.keys(this.formCriarCurso.controls).forEach((key) => {
        const control = this.formCriarCurso.get(key);
        control?.markAsTouched();
      });
      this.toastr.warning('Preencha todos os campos obrigatórios', 'Atenção');
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.formCriarCurso.get(controlName);
    if (control?.hasError('required')) {
      return 'Este campo é obrigatório';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Mínimo de ${minLength} caracteres`;
    }
    return '';
  }

  isFieldInvalid(controlName: string): boolean {
    const control = this.formCriarCurso.get(controlName);
    return !!(control?.invalid && control?.touched);
  }
  goToMeusCursos() {
    this.router.navigate(['/meus-cursos']);
  }
}
