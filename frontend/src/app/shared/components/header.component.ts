import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ApiService } from '../../core/services/api.service';
import { UiService } from '../../core/services/ui.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header-container">
      <!-- Mobile Menu Toggle -->
      <button class="hamburger-btn" (click)="ui.toggleSidebar()" aria-label="Toggle menu">
        <span></span><span></span><span></span>
      </button>

      <!-- Search or Page Indicator -->
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" placeholder="Search employees, orders, projects..." class="search-input" />
      </div>

      <!-- Quick Action Controls -->
      <div class="header-actions">
        <!-- Live Clock In/Out Quick Action -->
        <button class="btn btn-sm btn-primary" (click)="quickCheckIn()" *ngIf="!isCheckedIn()">
          <span>⏱️ Clock In</span>
        </button>
        <button class="btn btn-sm btn-secondary" (click)="quickCheckOut()" *ngIf="isCheckedIn()">
          <span>🚪 Clock Out</span>
        </button>

        <!-- Notification Bell Dropdown -->
        <div class="notification-wrapper">
          <button class="icon-btn" (click)="toggleNotifications()">
            <span>🔔</span>
            <span class="notification-badge" *ngIf="unreadCount() > 0">{{ unreadCount() }}</span>
          </button>

          <!-- Dropdown Menu -->
          <div class="notification-dropdown" *ngIf="showNotifications()">
            <div class="dropdown-header">
              <span class="font-semibold">Notifications</span>
              <div>
                <button class="text-xs text-indigo-400 me-2" (click)="markAllRead()">Mark all read</button>
                <button class="text-xs text-danger" (click)="clearAll()">Clear All</button>
              </div>
            </div>
            <div class="dropdown-list">
              <div class="dropdown-item"
                   *ngFor="let n of notifications()"
                   [ngClass]="{ 'unread-item': !n.isRead }"
                   (click)="openNotification(n)"
                   style="cursor: pointer;">
                <div class="item-title">
                  <span class="me-1">{{ typeIcon(n.type) }}</span>{{ n.title }}
                </div>
                <div class="item-msg">{{ n.message }}</div>
                <div class="item-time">{{ n.timestamp | date:'short' }}</div>
              </div>
              <div class="empty-state" *ngIf="notifications().length === 0">
                No new notifications
              </div>
            </div>
          </div>
        </div>

        <!-- Admin: System Announcement -->
        <button class="btn btn-sm btn-outline-warning" *ngIf="auth.hasRole(['Admin'])" (click)="announce()" title="Send announcement to all users">
          📢
        </button>

        <!-- Logout Action -->
        <button class="btn btn-sm btn-secondary" (click)="logout()">
          <span>Log out</span>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .header-container {
      height: 64px;
      background: var(--bg-glass);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      gap: 16px;
    }

    .hamburger-btn {
      display: none;
      flex-direction: column;
      justify-content: center;
      gap: 4px;
      width: 38px;
      height: 38px;
      padding: 8px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      flex-shrink: 0;
    }

    .hamburger-btn span {
      display: block;
      height: 2px;
      width: 100%;
      background: var(--text-primary);
      border-radius: 2px;
    }

    @media (max-width: 991.98px) {
      .hamburger-btn { display: flex; }
      .header-container { padding: 0 16px; }
    }

    @media (max-width: 575.98px) {
      .search-box { display: none; }
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 6px 14px;
      width: 340px;
    }

    .search-icon {
      font-size: 14px;
      color: var(--text-muted);
    }

    .search-input {
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: 13px;
      outline: none;
      width: 100%;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .icon-btn {
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
    }

    .icon-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .notification-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: var(--danger);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .notification-wrapper {
      position: relative;
    }

    .notification-dropdown {
      position: absolute;
      top: 48px;
      right: 0;
      width: 320px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color-light);
      border-radius: var(--radius-lg);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      z-index: 100;
      overflow: hidden;
    }

    .dropdown-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--bg-tertiary);
      border-bottom: 1px solid var(--border-color);
      font-size: 13px;
    }

    .dropdown-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .dropdown-item {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color);
      font-size: 13px;
    }

    .dropdown-item:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .item-title {
      font-weight: 600;
      color: var(--text-primary);
    }

    .item-msg {
      color: var(--text-secondary);
      font-size: 12px;
      margin-top: 2px;
    }

    .item-time {
      color: var(--text-muted);
      font-size: 10px;
      margin-top: 4px;
    }

    .empty-state {
      padding: 24px;
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
    }

    .unread-item {
      background: rgba(99, 102, 241, 0.08);
      border-left: 2px solid #6366f1;
    }
  `]
})
export class HeaderComponent {
  auth = inject(AuthService);
  notificationService = inject(NotificationService);
  apiService = inject(ApiService);
  ui = inject(UiService);
  private router = inject(Router);

  showNotifications = signal(false);
  isCheckedIn = signal(false);

  notifications = this.notificationService.notifications;
  unreadCount = this.notificationService.unreadCount;

  toggleNotifications(): void {
    this.showNotifications.update(s => !s);
    if (this.showNotifications()) this.notificationService.loadFromServer();
  }

  openNotification(n: any): void {
    if (!n.isRead) this.notificationService.markRead(n.id);
    if (n.actionUrl) {
      this.showNotifications.set(false);
      this.router.navigateByUrl(n.actionUrl);
    }
  }

  markAllRead(): void { this.notificationService.markAllRead(); }

  clearAll(): void { this.notificationService.clearAll(); }

  typeIcon(type: string): string {
    switch (type) {
      case 'Success': return '✅';
      case 'Warning': return '⚠️';
      case 'Error': return '❌';
      case 'System': return '📢';
      default: return '🔔';
    }
  }

  announce(): void {
    const title = prompt('Announcement title:');
    if (!title) return;
    const message = prompt('Announcement message:');
    if (!message) return;
    this.apiService.announce(title, message).subscribe({
      next: () => this.notificationService.addNotification({
        id: Math.random().toString(),
        title: 'Announcement Sent',
        message: `📢 "${title}" sent to all users`,
        type: 'System',
        isRead: true,
        timestamp: new Date()
      })
    });
  }

  quickCheckIn(): void {
    this.apiService.checkInMe('Web Clock-In').subscribe({
      next: (res) => {
        this.isCheckedIn.set(true);
        this.notificationService.addNotification({
          id: Math.random().toString(),
          title: 'Attendance',
          message: res.message || 'Clocked in successfully!',
          type: 'success',
          timestamp: new Date()
        });
      },
      error: (err) => this.notifyAttendanceError(err)
    });
  }

  quickCheckOut(): void {
    this.apiService.checkOutMe('Web Clock-Out').subscribe({
      next: (res) => {
        this.isCheckedIn.set(false);
        this.notificationService.addNotification({
          id: Math.random().toString(),
          title: 'Attendance',
          message: res.message || 'Clocked out successfully!',
          type: 'info',
          timestamp: new Date()
        });
      },
      error: (err) => this.notifyAttendanceError(err)
    });
  }

  private notifyAttendanceError(err: any): void {
    const message = err?.error?.message || 'Attendance action failed. Please try again.';
    this.notificationService.addNotification({
      id: Math.random().toString(),
      title: 'Attendance',
      message,
      type: 'error',
      timestamp: new Date()
    });
  }

  logout(): void {
    this.auth.logout();
  }
}
