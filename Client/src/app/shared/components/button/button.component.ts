import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  @Input() buttonText?: string;
  @Input() buttonSize: 'small' | 'medium' | 'large' = 'medium';
  /** Mantido para compatibilidade com o padrão antigo (primary/secondary). */
  @Input() buttonLevel: 'primary' | 'secondary' = 'primary';
  @Input() buttonTheme: 'light' | 'dark' = 'dark';
  @Input() buttonType: 'submit' | 'button' = 'button';
  @Input() buttonDisabled: boolean = false;
  @Input() buttonBackgroundColor?: string;
  @Input() buttonTextColor?: string;
  /**
   * Variantes semânticas. Quando não informada, usa o padrão antigo
   * (buttonLevel) para não alterar o comportamento dos usos existentes.
   */
  @Input() buttonVariant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
}
