import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex align-items-center gap-2">
      <!-- Moon icon -->
      <i class="bi bi-moon-fill" style="font-size:14px; color: var(--text-muted);"></i>

      <!-- Toggle -->
      <div class="theme-toggle-track"
           [class.active]="theme.isDark()"
           (click)="theme.toggle()"
           role="button"
           tabindex="0"
           (keydown.enter)="theme.toggle()"
           [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
        <div class="theme-toggle-thumb">
          <i class="bi"
             [ngClass]="theme.isDark() ? 'bi-moon-stars-fill' : 'bi-brightness-high-fill'"></i>
        </div>
      </div>

      <!-- Sun icon -->
      <i class="bi bi-brightness-high" style="font-size:14px; color: var(--text-muted);"></i>
    </div>
  `,
  styles: [`
    .theme-toggle-track {
      width: 56px;
      height: 28px;
      border-radius: 999px;
      background-color: #E8EAEF;
      border: 1px solid #C9CBD5;
      position: relative;
      cursor: pointer;
      transition: background-color 0.3s ease, border-color 0.3s ease;
    }

    .theme-toggle-track.active {
      background-color: #2E3247;
      border-color: #4B5268;
    }

    .theme-toggle-track.active .theme-toggle-thumb {
      transform: translateX(28px);
      background-color: #4A6CF7;
    }

    .theme-toggle-track.active .theme-toggle-thumb i {
      color: #ffffff;
    }

    .theme-toggle-thumb {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: #ffffff;
      position: absolute;
      top: 1px;
      left: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease, background-color 0.3s ease;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
    }

    .theme-toggle-thumb i {
      font-size: 12px;
      color: #F59E0B;
      transition: color 0.3s ease;
    }
  `]
})
export class ThemeToggleComponent {
  theme = inject(ThemeService);
}
