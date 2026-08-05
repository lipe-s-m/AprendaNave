import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { LoginResponseDTO, User } from '../../shared/interfaces/user.interface';
import { UserService } from '../../services/user/user.service';
import { CommonModule } from '@angular/common';
import { ModalEditarPerfilComponent } from '../../shared/components/modal-editar-perfil/modal-editar-perfil.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { LoaderComponent } from '../../shared/components/loader/loader.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { environment } from '../../../environments/environment';

interface Conquista {
  id: number;
  nome: string;
  descricao: string;
  icone: string;
  pontos: number;
  desbloqueada: boolean;
  desbloqueadoEm: string | null;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    SubheaderComponent,
    CommonModule,
    ModalEditarPerfilComponent,
    ButtonComponent,
    LoaderComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
  ],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent implements OnInit {
  pontos: string = '0';
  private userService = inject(UserService);
  userSignal: WritableSignal<User | null>;
  showModal = signal<boolean>(false);
  conquistas = signal<Conquista[]>([]);
  isLoadingConquistas = signal(true);
  conquistasDesbloqueadas = computed(
    () => this.conquistas().filter((c) => c.desbloqueada).length
  );

  constructor(private http: HttpClient) {
    this.userSignal = this.userService.getUserSignal();
  }

  ngOnInit(): void {
    this.carregarConquistas();
  }

  carregarConquistas(): void {
    this.http.get<Conquista[]>(`${environment.apiUrl}/conquistas`).subscribe({
      next: (data) => {
        this.conquistas.set(data);
        this.isLoadingConquistas.set(false);
      },
      error: () => {
        this.isLoadingConquistas.set(false);
      },
    });
  }

  openEditModal(): void {
    this.showModal.set(true);
  }

  closeEditModal(): void {
    this.showModal.set(false);
  }
}
