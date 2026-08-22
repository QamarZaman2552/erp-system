import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiService {
  readonly sidebarOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
    this.syncBodyClass();
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
    this.syncBodyClass();
  }

  private syncBodyClass(): void {
    document.body.classList.toggle('sidebar-open', this.sidebarOpen());
  }
}
