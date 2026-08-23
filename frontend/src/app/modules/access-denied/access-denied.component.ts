import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="access-denied-page">
      <div class="denied-card erp-card">
        <div class="denied-icon">🔒</div>
        <h1>403 — Access Denied</h1>
        <p class="denied-msg">
          Sorry <strong>{{ user()?.fullName }}</strong>, you don't have permission to access this module.
        </p>
        <p class="attempted" *ngIf="attemptedUrl">
          Requested: <code>{{ attemptedUrl }}</code>
        </p>
        <p class="hint">Your role: <span class="badge badge-info">{{ user()?.role }}</span></p>
        <div class="d-flex gap-2 justify-content-center mt-3">
          <button class="btn btn-primary" (click)="goBack()">← Back to Dashboard</button>
          <button class="btn btn-outline-secondary" (click)="goBackInHistory()">Go Back</button>
        </div>
        <p class="contact small text-secondary mt-4 mb-0">
          Need access? Contact your system administrator.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .access-denied-page {
      min-height: calc(100vh - 64px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }

    .denied-card {
      max-width: 520px;
      width: 100%;
      text-align: center;
      padding: 48px 40px;
    }

    .denied-icon {
      font-size: 56px;
      margin-bottom: 16px;
    }

    h1 {
      font-family: var(--font-heading);
      font-size: 26px;
      margin-bottom: 12px;
      color: var(--danger, #ef4444);
    }

    .denied-msg {
      color: var(--text-secondary);
      font-size: 14px;
      margin-bottom: 8px;
    }

    .attempted {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    .attempted code {
      background: var(--bg-tertiary);
      padding: 2px 8px;
      border-radius: 6px;
    }

    .hint {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 0;
    }
  `]
})
export class AccessDeniedComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  user = this.auth.currentUser;
  attemptedUrl = this.route.snapshot.queryParamMap.get('attempted');

  goBack(): void {
    this.router.navigateByUrl('/dashboard');
  }

  goBackInHistory(): void {
    window.history.back();
  }
}
