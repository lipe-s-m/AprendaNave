import { Component } from '@angular/core';
import { HeaderComponent } from '../../layout/header/header.component';
import { SubheaderComponent } from '../../shared/components/subheader/subheader.component';
import { InputComponent } from '../../shared/components/input/input.component';

@Component({
  selector: 'app-aprendabot',
  standalone: true,
  imports: [HeaderComponent, SubheaderComponent, InputComponent],
  templateUrl: './aprendabot.component.html',
  styleUrl: './aprendabot.component.scss',
})
export class AprendabotComponent {}
