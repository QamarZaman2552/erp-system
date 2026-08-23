import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly THEME_KEY = 'erp-theme';
  isDark = signal<boolean>(false);

  constructor() {
    const saved = localStorage.getItem(this.THEME_KEY) || 'light';
    this.applyTheme(saved);
  }

  setTheme(theme: 'light' | 'dark'): void {
    localStorage.setItem(this.THEME_KEY, theme);
    this.applyTheme(theme);
  }

  toggle(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  isDarkMode(): boolean {
    return localStorage.getItem(this.THEME_KEY) === 'dark';
  }

  private applyTheme(theme: string): void {
    document.documentElement.setAttribute('data-bs-theme', theme);
    this.isDark.set(theme === 'dark');
  }
}
