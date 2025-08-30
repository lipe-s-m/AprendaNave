import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-trilha',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trilha.component.html',
  styleUrl: './trilha.component.scss',
})
export class TrilhaComponent {
  trilhaId: number | null = null;
  trilha: any = null;

  // Minimal mock source; in a real app you'd fetch this from a service
  trilhas = [
    {
      id: 0,
      nome: 'Matemática',
      modulos: 4,
      descricao: 'Fundamentos matemáticos para iniciantes.',
    },
    {
      id: 1,
      nome: 'Português',
      modulos: 4,
      descricao: 'Gramática e interpretação de textos.',
    },
    { id: 2, nome: 'Música', modulos: 4, descricao: 'Teoria musical básica.' },
    {
      id: 3,
      nome: 'Programação',
      modulos: 4,
      descricao: 'Lógica e introdução à programação.',
    },
  ];

  constructor(private route: ActivatedRoute, private router: Router) {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.trilhaId = id !== null ? Number(id) : null;
      this.trilha = this.trilhas.find((t) => t.id === this.trilhaId) || null;
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
