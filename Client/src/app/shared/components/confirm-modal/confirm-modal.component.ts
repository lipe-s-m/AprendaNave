import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
})
export class ConfirmModalComponent implements OnChanges, OnDestroy {
  @Input() title = 'Confirmar';
  @Input() message = 'Tem certeza?';
  @Input() confirmText = 'Excluir';
  @Input() cancelText = 'Cancelar';
  @Input() isOpen = false;
  /** Variante do botão de confirmação (danger por padrão). */
  @Input() variant: 'danger' | 'success' | 'primary' = 'danger';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private ultimoFoco: HTMLElement | null = null;
  private readonly teclaListener = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.isOpen) {
      this.fechar();
    }
  };

  ngOnChanges(): void {
    if (this.isOpen) {
      this.ultimoFoco = document.activeElement as HTMLElement | null;
      document.addEventListener('keydown', this.teclaListener);
      // Foco no botão de confirmar ao abrir (ação mais provável)
      setTimeout(() => {
        document.querySelector<HTMLElement>('.btn-confirm')?.focus();
      }, 0);
    } else {
      document.removeEventListener('keydown', this.teclaListener);
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.teclaListener);
  }

  fechar(): void {
    this.cancel.emit();
    // Devolve o foco ao elemento que abriu o modal
    this.ultimoFoco?.focus();
    this.ultimoFoco = null;
  }
}
