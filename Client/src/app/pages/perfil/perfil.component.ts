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

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [SubheaderComponent, CommonModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent {
  pontos: string = '0';
  private userService = inject(UserService);
  userSignal: WritableSignal<User | null>;

  constructor() {
    this.userSignal = this.userService.getUserSignal();
  }
}
