import {
  Component,
  EventEmitter,
  inject,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { UserService } from '../../../services/user/user.service';
import { User } from '../../interfaces/user.interface';
import { forkJoin } from 'rxjs';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-modal-editar-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './modal-editar-perfil.component.html',
  styleUrl: './modal-editar-perfil.component.scss',
})
export class ModalEditarPerfilComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  perfilForm!: FormGroup;
  isLoading = signal<boolean>(false);
  isSkeleton = signal<boolean>(true);

  // Imagem
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  currentUser: User | null = null;

  // Contador de caracteres
  bioMaxLength = 150;
  bioCurrentLength = signal<number>(0);

  errorMessage = signal<string>('');

  ngOnInit(): void {
    this.initForm();
    this.loadUserData();
  }

  private initForm(): void {
    this.perfilForm = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      bio: ['', [Validators.maxLength(this.bioMaxLength)]],
    });

    // Atualizar contador de caracteres
    this.perfilForm.get('bio')?.valueChanges.subscribe((value: string) => {
      this.bioCurrentLength.set(value?.length || 0);
    });
  }

  private loadUserData(): void {
    this.currentUser = this.userService.getUserSignal()();

    if (this.currentUser) {
      this.perfilForm.patchValue({
        nome: this.currentUser.nome,
        bio: (this.currentUser as any).bio || '',
      });

      // Definir preview da imagem atual
      this.imagePreview =
        (this.currentUser as any).fotoPerfil || 'assets/avatar-default.svg';
      this.bioCurrentLength.set((this.currentUser as any).bio?.length || 0);
      this.isSkeleton.set(false);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        this.errorMessage.set('Por favor, selecione uma imagem válida.');
        return;
      }

      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage.set('A imagem deve ter no máximo 5MB.');
        return;
      }

      this.selectedFile = file;
      this.errorMessage.set('');

      // Criar preview instantâneo
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  triggerFileInput(): void {
    document.getElementById('fileInput')?.click();
  }

  onSave(): void {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const formValue = this.perfilForm.value;
    const dataChanged =
      formValue.nome !== this.currentUser?.nome ||
      formValue.bio !== (this.currentUser as any)?.bio;
    const imageChanged = this.selectedFile !== null;

    if (!dataChanged && !imageChanged) {
      this.closeModal();
      return;
    }

    // Cenário 1: Apenas dados textuais mudaram
    if (dataChanged && !imageChanged) {
      const updateData: any = {};
      if (formValue.nome !== this.currentUser?.nome) {
        updateData.nome = formValue.nome;
      }
      if (formValue.bio !== (this.currentUser as any)?.bio) {
        updateData.bio = formValue.bio;
      }

      this.userService.updateUsuarioData(updateData).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.closeModal();
        },
        error: (error) => {
          this.handleError(error);
        },
      });
    }
    // Cenário 2: Apenas imagem mudou
    else if (!dataChanged && imageChanged && this.selectedFile) {
      this.userService.updateUsuarioFoto(this.selectedFile).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.closeModal();
        },
        error: (error) => {
          this.handleError(error);
        },
      });
    }
    // Cenário 3: Ambos mudaram
    else if (dataChanged && imageChanged && this.selectedFile) {
      const updateData: any = {};
      if (formValue.nome !== this.currentUser?.nome) {
        updateData.nome = formValue.nome;
      }
      if (formValue.bio !== (this.currentUser as any)?.bio) {
        updateData.bio = formValue.bio;
      }

      forkJoin({
        data: this.userService.updateUsuarioData(updateData),
        image: this.userService.updateUsuarioFoto(this.selectedFile),
      }).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.closeModal();
        },
        error: (error) => {
          this.handleError(error);
        },
      });
    }
  }

  private handleError(error: any): void {
    this.isLoading.set(false);

    if (error.status === 413) {
      this.errorMessage.set('A imagem é muito grande. Tente uma menor.');
    } else if (error.status === 400) {
      this.errorMessage.set('Dados inválidos. Verifique os campos.');
    } else {
      this.errorMessage.set('Erro ao salvar. Tente novamente.');
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  get bioCharacterCounter(): string {
    return `${this.bioCurrentLength()}/${this.bioMaxLength}`;
  }

  get isFormValid(): boolean {
    return this.perfilForm.valid;
  }
}
