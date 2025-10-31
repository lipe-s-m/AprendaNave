import { Component, OnInit } from '@angular/core';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { LoginResponseDTO } from '../../shared/interfaces/user.interface';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [SubheaderComponent],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent implements OnInit {
  pontos: string = '0';
  user: LoginResponseDTO | null = null;
  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    const storedPontos = localStorage.getItem('pontos');
    if (storedPontos !== null) {
      this.pontos = storedPontos;
    }
  }
}
