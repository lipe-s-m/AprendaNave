import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

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
  @Input() buttonLevel: 'primary' | 'secondary' = 'primary';
  @Input() buttonTheme: 'light' | 'dark' = 'light';
  @Input() buttonType: 'submit' | 'button' = 'button';
  @Input() buttonDisabled: boolean = false;
  @Input() buttonBackgroundColor?: string;
  @Input() buttonTextColor?: string;
}
