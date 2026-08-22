import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private hubConnection?: signalR.HubConnection;
  notifications = signal<NotificationItem[]>([]);
  unreadCount = signal<number>(0);

  initSignalR(token: string): void {
    if (this.hubConnection) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.signalRUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveNotification', (title: string, message: string) => {
      this.addNotification({
        id: Math.random().toString(36).substring(2),
        title,
        message,
        type: 'info',
        timestamp: new Date()
      });
    });

    this.hubConnection.on('ReceiveBroadcast', (title: string, message: string) => {
      this.addNotification({
        id: Math.random().toString(36).substring(2),
        title,
        message,
        type: 'warning',
        timestamp: new Date()
      });
    });

    this.hubConnection.start().catch(() => {
      // Offline fallback
    });
  }

  addNotification(item: NotificationItem): void {
    this.notifications.update(prev => [item, ...prev]);
    this.unreadCount.update(c => c + 1);
  }

  clearAll(): void {
    this.notifications.set([]);
    this.unreadCount.set(0);
  }
}
