import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent {
  @Input() placeholder?: string = 'Digite aqui...';
  @Input() inputName?: string;
  @Input() inputSize: 'small' | 'medium' | 'large' = 'medium';
  @Input() inputLevel: 'primary' | 'secondary' = 'primary';
  @Input() inputTheme: 'light' | 'dark' = 'light';
  @Input() inputType?: string = 'text';
  @Input() inputDisabled = false;
  @Input() inputBackgroundColor?: string;
  @Input() inputTextColor?: string;
  @Input() rows?: number = 4;
  /** Label exibido acima do campo (1.4rem). */
  @Input() label?: string;
  /** Texto de apoio exibido abaixo do campo. */
  @Input() hint?: string;
  /** Mensagem de erro exibida abaixo do campo (aria-invalid no campo). */
  @Input() errorMessage?: string;

  // O valor interno do input
  value?: any = '';

  // Funções que o Angular vai registrar para comunicação
  onChange: any = () => {};
  onTouched: any = () => {};

  // Método que o Angular chama para passar o valor para o seu componente
  writeValue(value: any): void {
    this.value = value;
  }

  // Método que o Angular chama para registrar a função de 'onChange'
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  // Método que o Angular chama para registrar a função de 'onTouched'
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.onChange(value);
    this.value = value;
  }
}
