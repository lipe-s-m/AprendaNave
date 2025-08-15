import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Router } from '@angular/router';
import { HeaderComponent } from '../../layout/header/header.component';

@Component({
  selector: 'app-hub',
  standalone: true,
  imports: [CommonModule, ButtonComponent, HeaderComponent],
  templateUrl: './hub.component.html',
  styleUrl: './hub.component.scss',
})
export class HubComponent {
  constructor(private router: Router) {}
  trilhas = [
    {
      id: 0,
      nome: 'Matemática',
      imagem: 'assets/matematica.svg',
      matriculas: 37,
    },
    {
      id: 1,
      nome: 'Português',
      imagem: 'assets/dicionario.svg',
      matriculas: 24,
    },
    {
      id: 2,
      nome: 'Música',
      imagem: 'assets/notas-musicais.svg',
      matriculas: 11,
    },
    {
      id: 3,
      nome: 'Programação',
      imagem: 'assets/programacao.svg',
      matriculas: 725,
    },
    { id: 3, nome: 'Mock 1', imagem: 'assets/dicionario.svg', matriculas: 0 },
    { id: 3, nome: 'Mock 2', imagem: 'assets/matematica.svg', matriculas: 7 },
  ];

  entrarComoUsuario() {
    this.router.navigate(['login']);
  }
}
