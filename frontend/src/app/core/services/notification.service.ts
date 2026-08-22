import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead?: boolean;
  actionUrl?: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private hubConnection?: signalR.HubConnection;

  notifications = signal<NotificationItem[]>([]);
  unreadCount = signal<number>(0);
  loaded = false;

  constructor(private api: ApiService) {}

  initSignalR(token: string): void {
    if (this.hubConnection) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveNotification', (title: string, message: string) => {
      // Real-time toast — refresh persisted list + badge from server
      this.loadFromServer();
    });

    this.hubConnection.on('ReceiveBroadcast', (title: string, message: string) => {
      this.loadFromServer();
    });

    this.hubConnection.start().catch(() => {
      // Offline fallback
    });
  }

  /** Load persisted notifications + unread count from the API */
  loadFromServer(): void {
    this.api.getNotifications(false, 50).subscribe({
      next: (list) => {
        const items: NotificationItem[] = (list || []).map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.isRead,
          actionUrl: n.actionUrl,
          timestamp: new Date(n.createdAt)
        }));
        this.notifications.set(items);
        this.unreadCount.set(items.filter(i => !i.isRead).length);
        this.loaded = true;
      }
    });
  }

  addNotification(item: NotificationItem): void {
    this.notifications.update(prev => [item, ...prev]);
    this.unreadCount.update(c => c + 1);
  }

  markRead(id: string): void {
    this.api.markNotificationRead(id).subscribe({
      next: () => {
        this.notifications.update(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        this.recount();
      }
    });
  }

  markAllRead(): void {
    this.api.markAllNotificationsRead().subscribe({
      next: () => {
        this.notifications.update(prev => prev.map(n => ({ ...n, isRead: true })));
        this.unreadCount.set(0);
      }
    });
  }

  clearAll(): void {
    this.api.clearNotifications().subscribe({
      next: () => {
        this.notifications.set([]);
        this.unreadCount.set(0);
      }
    });
  }

  private recount(): void {
    this.unreadCount.set(this.notifications().filter(n => !n.isRead).length);
  }
}
