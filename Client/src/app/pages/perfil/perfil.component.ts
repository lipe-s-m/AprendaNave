import { Component } from '@angular/core';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [SubheaderComponent],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent {}
