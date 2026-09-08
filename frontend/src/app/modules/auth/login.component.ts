import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <!-- Logo & Header -->
        <div class="login-header">
          <div class="logo-box"><i class="bi bi-grid-3x3-gap-fill"></i></div>
          <h1>Enterprise ERP</h1>
          <p>Business Operations &amp; Resource Management</p>
        </div>

        <!-- Error Alert -->
        <div class="alert-box alert-error" *ngIf="errorMessage()">
          <span><i class="bi bi-exclamation-triangle-fill"></i></span> {{ errorMessage() }}
        </div>

        <div class="alert-box alert-success" *ngIf="resetSent()" style="border-color: rgba(25,135,84,.4); background: rgba(25,135,84,.1); color: #75dfae;">
          <span><i class="bi bi-envelope-check-fill"></i></span> {{ resetSent() }}
        </div>

        <!-- Forgot Password Form -->
        <form (ngSubmit)="sendResetLink()" class="login-form" *ngIf="showForgot()">
          <p class="text-secondary small">Enter your work email and we'll send you a password reset link.</p>
          <div class="form-group">
            <label class="form-label">Work Email</label>
            <input type="email" [(ngModel)]="email" name="fpEmail" required class="form-control" placeholder="e.g. admin@company.com" />
          </div>
          <button type="submit" class="btn btn-primary w-full" [disabled]="isSendingReset()">
            <span *ngIf="!isSendingReset()">Send Reset Link</span>
            <span *ngIf="isSendingReset()">Sending...</span>
          </button>
        </form>

        <!-- Login Form -->
        <form (ngSubmit)="onSubmit()" class="login-form" *ngIf="!showForgot()">
          <div class="form-group">
            <label class="form-label">Work Email</label>
            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
              class="form-control"
              placeholder="e.g. admin@company.com"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
              class="form-control"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" class="btn btn-primary w-full" [disabled]="isLoading()">
            <span *ngIf="!isLoading()">Sign In to Dashboard →</span>
            <span *ngIf="isLoading()">Authenticating...</span>
          </button>
        </form>

        <div class="text-center mt-2" *ngIf="!showForgot()">
          <a href="javascript:void(0)" class="small text-secondary" (click)="openForgot()">Forgot password?</a>
        </div>
        <div class="text-center mt-2" *ngIf="showForgot()">
          <a href="javascript:void(0)" class="small text-secondary" (click)="closeForgot()">← Back to login</a>
        </div>

        <!-- Quick Demo Credentials Selector -->
        <div class="quick-credentials">
          <span class="quick-title">Quick Demo Logins:</span>
          <div class="demo-buttons">
            <button class="demo-btn" (click)="setCredentials('admin@company.com', 'Admin@1234')">
              <i class="bi bi-crown"></i> Admin
            </button>
            <button class="demo-btn" (click)="setCredentials('hr@company.com', 'Hr@12345')">
              <i class="bi bi-briefcase"></i> HR Manager
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 10%, rgba(192, 192, 192, 0.15), transparent 50%),
                  radial-gradient(circle at 80% 80%, rgba(166, 166, 166, 0.15), transparent 50%),
                  var(--bg-primary);
      padding: 20px;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      background: var(--bg-glass-card);
      backdrop-filter: blur(16px);
      border: 1px solid var(--border-color-light);
      border-radius: var(--radius-xl);
      padding: 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }

    .login-header {
      text-align: center;
      margin-bottom: 28px;
    }

    .logo-box {
      font-size: 36px;
      width: 64px;
      height: 64px;
      margin: 0 auto 16px;
      background: rgba(192, 192, 192, 0.1);
      border: 1px solid var(--border-glow);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .login-header h1 {
      font-size: 24px;
      margin-bottom: 6px;
    }

    .login-header p {
      color: var(--text-muted);
      font-size: 13px;
    }

    .alert-box {
      padding: 10px 14px;
      border-radius: var(--radius-md);
      font-size: 13px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .alert-error {
      background: var(--danger-bg);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }

    .w-full {
      width: 100%;
      margin-top: 10px;
    }

    .quick-credentials {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid var(--border-color);
      text-align: center;
    }

    .quick-title {
      font-size: 12px;
      color: var(--text-muted);
      display: block;
      margin-bottom: 10px;
    }

    .demo-buttons {
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    .demo-btn {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 6px 14px;
      border-radius: var(--radius-md);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .demo-btn:hover {
      background: rgba(192, 192, 192, 0.2);
      border-color: var(--accent-primary);
      color: #fff;
    }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  email = 'admin@company.com';
  password = 'Admin@1234';
  isLoading = signal(false);
  showForgot = signal(false);
  isSendingReset = signal(false);
  resetSent = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  setCredentials(e: string, p: string): void {
    this.email = e;
    this.password = p;
  }

  onSubmit(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage.set(res.message || 'Authentication failed.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Unable to connect to ERP API.');
      }
    });
  }

  openForgot(): void {
    this.showForgot.set(true);
    this.errorMessage.set(null);
    this.resetSent.set(null);
  }

  closeForgot(): void {
    this.showForgot.set(false);
    this.resetSent.set(null);
    this.errorMessage.set(null);
  }

  sendResetLink(): void {
    if (!this.email) {
      this.errorMessage.set('Please enter your work email.');
      return;
    }
    this.isSendingReset.set(true);
    this.api.forgotPassword(this.email).subscribe({
      next: () => {
        this.isSendingReset.set(false);
        this.resetSent.set('If an account exists for this email, a password reset link has been sent.');
      },
      error: () => {
        this.isSendingReset.set(false);
        this.resetSent.set('If an account exists for this email, a password reset link has been sent.');
      }
    });
  }
}
