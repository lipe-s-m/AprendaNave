import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-hub',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './hub.component.html',
  styleUrl: './hub.component.scss',
})
export class HubComponent {
  trilhas = [
    { id: 0, nome: 'Matemática', imagem: 'assets/matematica.svg' },
    { id: 1, nome: 'Português', imagem: 'assets/dicionario.svg' },
    { id: 2, nome: 'Música', imagem: 'assets/notas-musicais.svg' },
    { id: 3, nome: 'Programação', imagem: 'assets/programacao.svg' },
    { id: 3, nome: 'Mock 1', imagem: 'assets/dicionario.svg' },
    { id: 3, nome: 'Mock 2', imagem: 'assets/matematica.svg' },
  ];

  entrarComoUsuario() {
    alert('Entrar na sua conta clicked');
  }
}
