import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Router } from '@angular/router';
import { DesafioJccService } from '../../services/desafio-jcc/desafio-jcc.service';
import { Ranking } from '../../shared/interfaces/user.interface';

@Component({
  selector: 'app-desafio-jcc',
  standalone: true,
  imports: [CommonModule, SubheaderComponent, ButtonComponent],
  templateUrl: './desafio-jcc.component.html',
  styleUrl: './desafio-jcc.component.scss',
})
export class DesafioJccComponent implements OnInit {
  ranking: Ranking[] = [];
  constructor(
    private router: Router,
    private desafioJccService: DesafioJccService
  ) {}
  iniciarDesafio(): void {
    console.log('Desafio iniciado!');
    this.router.navigate(['/desafio-matematica']);
  }
  ngOnInit() {
    this.desafioJccService.getRanking().subscribe((data) => {
      this.ranking = data;
      console.log(data);
    });
  }
}
