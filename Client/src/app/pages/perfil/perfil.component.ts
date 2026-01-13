import {
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { LoginResponseDTO, User } from '../../shared/interfaces/user.interface';
import { UserService } from '../../services/user/user.service';
import { CommonModule } from '@angular/common';
import { ModalEditarPerfilComponent } from '../../shared/components/modal-editar-perfil/modal-editar-perfil.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    SubheaderComponent,
    CommonModule,
    ModalEditarPerfilComponent,
    ButtonComponent,
  ],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent {
  pontos: string = '0';
  private userService = inject(UserService);
  userSignal: WritableSignal<User | null>;
  showModal = signal<boolean>(false);

  constructor() {
    this.userSignal = this.userService.getUserSignal();
    console.log(this.userSignal());
  }

  openEditModal(): void {
    this.showModal.set(true);
  }

  closeEditModal(): void {
    this.showModal.set(false);
  }
}
