import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UiService } from '../../core/services/ui.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Mobile overlay -->
    <div class="sidebar-overlay" *ngIf="ui.sidebarOpen()" (click)="ui.closeSidebar()"></div>
    <aside class="sidebar-container" [class.open]="ui.sidebarOpen()">
      <!-- Brand Logo -->
      <div class="brand-header">
        <div class="logo-icon"><i class="bi bi-grid-3x3-gap-fill"></i></div>
        <div class="brand-text">
          <span class="brand-title">Enterprise ERP</span>
          <span class="brand-subtitle">Business Suite v1.0</span>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="nav-section">
        <div class="nav-label">MAIN</div>
        
        <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-icon"><i class="bi bi-speedometer2"></i></span>
          <span class="nav-text">Dashboard</span>
        </a>

        <a routerLink="/profile" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-icon"><i class="bi bi-person-circle"></i></span>
          <span class="nav-text">My Profile</span>
        </a>

        <div class="nav-label">HUMAN RESOURCES</div>
        
        <a routerLink="/employees" routerLinkActive="active" class="nav-item" (click)="onNavClick()" *ngIf="canAccessHR()">
          <span class="nav-icon"><i class="bi bi-people"></i></span>
          <span class="nav-text">Employees</span>
        </a>
        
        <a routerLink="/attendance" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-icon"><i class="bi bi-clock-history"></i></span>
          <span class="nav-text">Attendance</span>
        </a>

        <a routerLink="/leaves" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-icon"><i class="bi bi-calendar-event"></i></span>
          <span class="nav-text">Leave Requests</span>
        </a>

        <a routerLink="/payroll" routerLinkActive="active" class="nav-item" (click)="onNavClick()" *ngIf="canAccessHR()">
          <span class="nav-icon"><i class="bi bi-wallet2"></i></span>
          <span class="nav-text">Payroll</span>
        </a>

        <div class="nav-label">OPERATIONS &amp; SALES</div>

        <a routerLink="/crm" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-icon"><i class="bi bi-handshake"></i></span>
          <span class="nav-text">CRM &amp; Leads</span>
        </a>

        <a routerLink="/projects" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-icon"><i class="bi bi-kanban"></i></span>
          <span class="nav-text">Projects &amp; Tasks</span>
        </a>

        <a routerLink="/tasks" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-icon"><i class="bi bi-arrow-repeat"></i></span>
          <span class="nav-text">Recurring Tasks</span>
        </a>

        <a routerLink="/team" routerLinkActive="active" class="nav-item" (click)="onNavClick()" *ngIf="canAccessTeam()">
          <span class="nav-icon"><i class="bi bi-person-workspace"></i></span>
          <span class="nav-text">My Team</span>
        </a>

        <a routerLink="/inventory" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-icon"><i class="bi bi-box-seam"></i></span>
          <span class="nav-text">Inventory</span>
        </a>

        <a routerLink="/sales" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-icon"><i class="bi bi-cart3"></i></span>
          <span class="nav-text">Sales &amp; Invoices</span>
        </a>

        <a routerLink="/purchase" routerLinkActive="active" class="nav-item" (click)="onNavClick()" *ngIf="canAccessTeam()">
          <span class="nav-icon"><i class="bi bi-truck"></i></span>
          <span class="nav-text">Purchase Orders</span>
        </a>

        <div class="nav-label">ACCOUNTING</div>

        <a routerLink="/finance" routerLinkActive="active" class="nav-item" (click)="onNavClick()" *ngIf="canAccessFinance()">
          <span class="nav-icon"><i class="bi bi-cash-stack"></i></span>
          <span class="nav-text">Finance &amp; Budget</span>
        </a>

        <a routerLink="/users" routerLinkActive="active" class="nav-item" (click)="onNavClick()" *ngIf="canAccessAdmin()">
          <span class="nav-icon"><i class="bi bi-shield-lock"></i></span>
          <span class="nav-text">User Management</span>
        </a>

        <a routerLink="/audit-logs" routerLinkActive="active" class="nav-item" (click)="onNavClick()" *ngIf="canAccessAdmin()">
          <span class="nav-icon"><i class="bi bi-journal-text"></i></span>
          <span class="nav-text">Audit Trail</span>
        </a>

        <a routerLink="/documents" routerLinkActive="active" class="nav-item" (click)="onNavClick()">
          <span class="nav-icon"><i class="bi bi-folder2-open"></i></span>
          <span class="nav-text">Documents</span>
        </a>

        <div class="nav-label" *ngIf="canAccessAdmin()">SETTINGS</div>

        <a routerLink="/email-templates" routerLinkActive="active" class="nav-item" (click)="onNavClick()" *ngIf="canAccessAdmin()">
          <span class="nav-icon"><i class="bi bi-envelope-paper"></i></span>
          <span class="nav-text">Email Templates</span>
        </a>
      </nav>

      <!-- User Profile Badge -->
      <div class="sidebar-user" *ngIf="user()">
        <div class="user-avatar">{{ user()?.fullName?.charAt(0) || 'U' }}</div>
        <div class="user-info">
          <div class="user-name">{{ user()?.fullName }}</div>
          <div class="user-role badge badge-info">{{ user()?.role }}</div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar-container {
      width: 260px;
      height: 100vh;
      background: var(--bg-secondary);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      padding: 20px 16px;
      user-select: none;
    }

    .brand-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px 24px;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 16px;
    }

    .logo-icon {
      font-size: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(192, 192, 192, 0.1);
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-glow);
    }

    .brand-title {
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 17px;
      color: var(--text-primary);
      display: block;
      letter-spacing: -0.01em;
    }

    .brand-subtitle {
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 500;
      display: block;
    }

    .nav-section {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.08em;
      padding: 12px 12px 6px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
    }

    .nav-item.active {
      background: var(--accent-gradient);
      color: #10141f;
      font-weight: 700;
      box-shadow: var(--accent-glow);
    }

    .nav-icon {
      font-size: 16px;
    }

    .sidebar-user {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--bg-tertiary);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      margin-top: 12px;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--accent-gradient);
      color: #10141f;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }

    .user-info {
      overflow: hidden;
    }

    .user-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .user-role {
      font-size: 10px;
      padding: 1px 6px;
      margin-top: 2px;
    }

    .sidebar-overlay {
      display: none;
    }

    @media (max-width: 991.98px) {
      .sidebar-container {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 1050;
        transform: translateX(-100%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);
      }

      .sidebar-container.open {
        transform: translateX(0);
      }

      .sidebar-overlay {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        z-index: 1040;
        backdrop-filter: blur(4px);
      }
    }
  `]
})
export class SidebarComponent {
  private auth = inject(AuthService);
  ui = inject(UiService);
  user = this.auth.currentUser;

  onNavClick(): void {
    this.ui.closeSidebar();
  }

  canAccessHR(): boolean {
    return this.auth.hasRole(['Admin', 'HR']);
  }

  canAccessFinance(): boolean {
    return this.auth.hasRole(['Admin', 'HR', 'Manager']);
  }

  canAccessTeam(): boolean {
    return this.auth.hasRole(['Admin', 'HR', 'Manager']);
  }

  canAccessAdmin(): boolean {
    return this.auth.hasRole(['Admin']);
  }
}
