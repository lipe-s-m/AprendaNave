import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type StatusBadgeType = 'success' | 'warning' | 'error' | 'neutral' | 'info';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  @Input() label = '';
  @Input() status: StatusBadgeType = 'neutral';
  /** Nome de um ícone Material opcional, ex.: 'check_circle'. */
  @Input() icon?: string;
}
