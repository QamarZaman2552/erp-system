import { Injectable, signal, computed } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface ToastItem {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private toastsSignal = signal<ToastItem[]>([]);
  toasts = computed(() => this.toastsSignal());

  show(title: string, message: string, type: ToastItem['type'] = 'info', duration = 5000): void {
    const item: ToastItem = { id: this.nextId++, title, message, type };
    this.toastsSignal.update(list => [...list.slice(-4), item]);
    setTimeout(() => this.dismiss(item.id), duration);
  }

  success(title: string, message: string): void {
    this.show(title, message, 'success');
  }

  error(title: string, message: string): void {
    this.show(title, message, 'error', 7000);
  }

  warning(title: string, message: string): void {
    this.show(title, message, 'warning', 6000);
  }

  info(title: string, message: string): void {
    this.show(title, message, 'info');
  }

  dismiss(id: number): void {
    this.toastsSignal.update(list => list.filter(t => t.id !== id));
  }

  showHttpError(err: HttpErrorResponse): void {
    if (err.status === 0) {
      this.error('Connection Error', 'Server se connection nahi ban saka. Internet/API check karein.');
      return;
    }
    if (err.status === 401) {
      this.error('Session Expired', 'Aapka session khatam ho gaya. Dobara login karein.');
      return;
    }

    const body = err.error as any;
    let message = '';

    if (body?.errors && typeof body.errors === 'object' && !Array.isArray(body.errors)) {
      const parts: string[] = [];
      for (const key of Object.keys(body.errors)) {
        const field = key.startsWith('$.') ? key.substring(2) : key;
        const label = field.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());
        const msgs = Array.isArray(body.errors[key]) ? body.errors[key].join(', ') : String(body.errors[key]);
        parts.push(`${label}: ${msgs}`);
      }
      message = parts.join(' • ');
    }

    if (!message) message = body?.message || body?.title || err.message || 'Something went wrong.';
    if (body?.errors && Array.isArray(body.errors) && body.errors.length) {
      message = body.errors.join(' • ');
    }

    const type: ToastItem['type'] = err.status >= 400 && err.status < 500 ? 'warning' : 'error';
    this.show(this.shortTitle(err.status), message, type, 7000);
  }

  private shortTitle(status: number): string {
    if (status === 400) return 'Validation Error';
    if (status === 403) return 'Access Denied';
    if (status === 404) return 'Not Found';
    if (status >= 500) return 'Server Error';
    return 'Request Failed';
  }
}
