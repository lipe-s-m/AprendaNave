import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentTheme = new BehaviorSubject<string>('dark');
  public theme$ = this.currentTheme.asObservable();

  constructor() {
    // Verifica se há um tema salvo no localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme('dark'); // Tema padrão
    }
  }

  setTheme(theme: string): void {
    this.currentTheme.next(theme);
    localStorage.setItem('theme', theme);
    
    // Remove todas as classes de tema do body
    document.body.classList.remove('light-theme', 'dark-theme');
    
    // Adiciona a classe do tema atual
    document.body.classList.add(`${theme}-theme`);
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme.value === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  getCurrentTheme(): string {
    return this.currentTheme.value;
  }

  isDarkMode(): boolean {
    return this.currentTheme.value === 'dark';
  }
}
