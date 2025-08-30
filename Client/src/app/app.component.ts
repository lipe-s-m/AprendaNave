import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'Client';

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    // O ThemeService já inicializa o tema no construtor
    // Esta linha garante que o serviço seja instanciado
  }
}
