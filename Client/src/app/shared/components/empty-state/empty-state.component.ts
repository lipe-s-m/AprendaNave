import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
  @Input() title = '';
  @Input() description = '';
  /** Nome de um ícone Material, ex.: 'school'. */
  @Input() icon = 'inbox';
  @Input() actionText?: string;

  @Output() action = new EventEmitter<void>();
}
