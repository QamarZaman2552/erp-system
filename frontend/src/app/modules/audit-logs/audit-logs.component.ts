import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="h3 mb-1"><i class="bi bi-shield-check me-2 text-success"></i>Audit Trail</h2>
        <p class="text-secondary small mb-0">Tamper-resistant activity log — every action recorded with user, module &amp; IP</p>
      </div>
      <a class="btn btn-outline-success" [href]="api.auditLogsCsvUrl(activeFilters())">
        <i class="bi bi-filetype-csv me-1"></i> Export CSV (Excel)
      </a>
    </div>

    <!-- Filters -->
    <div class="card border-0 shadow-sm p-3 mb-3">
      <div class="row g-2 align-items-end">
        <div class="col-md-3">
          <label class="form-label small mb-1">User (name / id contains)</label>
          <input type="text" [(ngModel)]="filters.userId" (ngModelChange)="applyFilters()" class="form-control form-control-sm" placeholder="e.g. admin" />
        </div>
        <div class="col-md-2">
          <label class="form-label small mb-1">Module / Action</label>
          <select [(ngModel)]="filters.module" (ngModelChange)="applyFilters()" class="form-select form-select-sm">
            <option value="">All</option>
            <option value="Auth">Auth</option>
            <option value="Customers">Customers</option>
            <option value="Leads">Leads</option>
            <option value="SalesOrders">Sales Orders</option>
            <option value="PurchaseOrders">Purchase Orders</option>
            <option value="Products">Products</option>
            <option value="Finance">Finance</option>
            <option value="Employees">Employees</option>
            <option value="Payroll">Payroll</option>
            <option value="Users">Users</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label small mb-1">From</label>
          <input type="date" [(ngModel)]="filters.from" (change)="applyFilters()" class="form-control form-control-sm" />
        </div>
        <div class="col-md-3">
          <label class="form-label small mb-1">To</label>
          <input type="date" [(ngModel)]="filters.to" (change)="applyFilters()" class="form-control form-control-sm" />
        </div>
        <div class="col-md-1 text-end">
          <button class="btn btn-sm btn-outline-secondary w-100" (click)="clearFilters()" title="Clear filters">×</button>
        </div>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-dark table-hover table-sm align-middle mb-0">
          <thead>
            <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Module</th><th>Entity</th><th>IP Address</th><th></th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of logs()">
              <td class="text-nowrap">{{ log.timestamp | date:'medium' }}</td>
              <td>{{ log.userName }}</td>
              <td>
                <span class="badge" [ngClass]="actionBadge(log.action)">{{ actionType(log.action) }}</span>
                {{ shortAction(log.action) }}
              </td>
              <td>{{ log.entityType }}</td>
              <td><small class="font-monospace text-secondary">{{ shortId(log.entityId) }}</small></td>
              <td><small>{{ log.ipAddress || '-' }}</small></td>
              <td>
                <button class="btn btn-sm btn-outline-secondary py-0 px-2" *ngIf="log.newValues" (click)="showDetail(log)" title="Payload">👁</button>
              </td>
            </tr>
            <tr *ngIf="logs().length === 0">
              <td colspan="7" class="text-center py-5 text-secondary">No audit entries match the filters.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="d-flex justify-content-between align-items-center p-2 border-top border-secondary" *ngIf="totalCount() > pageSize">
        <span class="small text-secondary">{{ (page - 1) * pageSize + 1 }}–{{ min(page * pageSize, totalCount()) }} of {{ totalCount() }}</span>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" [disabled]="page <= 1" (click)="goPage(page - 1)">‹ Prev</button>
          <button class="btn btn-outline-secondary" [disabled]="page * pageSize >= totalCount()" (click)="goPage(page + 1)">Next ›</button>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="detail()">
      <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title small">Audit Entry — {{ detail()?.action }}</h5>
            <button type="button" class="btn-close btn-close-white" (click)="detail.set(null)"></button>
          </div>
          <div class="modal-body">
            <p class="small text-secondary">{{ detail()?.userName }} at {{ detail()?.timestamp | date:'medium' }} — IP {{ detail()?.ipAddress }}</p>
            <pre class="bg-dark text-success p-3 rounded small" style="max-height:400px; overflow:auto;">{{ pretty(detail()?.newValues) }}</pre>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuditLogsComponent implements OnInit {
  api = inject(ApiService);

  logs = signal<any[]>([]);
  totalCount = signal(0);
  detail = signal<any>(null);
  page = 1;
  readonly pageSize = 25;

  filters = { userId: '', module: '', from: '', to: '' };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const f = {
      userId: this.filters.userId || undefined,
      module: this.filters.module || undefined,
      from: this.filters.from ? new Date(this.filters.from).toISOString() : undefined,
      to: this.filters.to ? new Date(this.filters.to).toISOString() : undefined
    };
    this.api.getAuditLogs(this.page, this.pageSize, f).subscribe({
      next: res => {
        if (res?.items) {
          this.logs.set(res.items);
          this.totalCount.set(res.totalCount);
        }
      }
    });
  }

  applyFilters(): void {
    clearTimeout((this as any)._t);
    (this as any)._t = setTimeout(() => { this.page = 1; this.load(); }, 350);
  }

  clearFilters(): void {
    this.filters = { userId: '', module: '', from: '', to: '' };
    this.page = 1;
    this.load();
  }

  goPage(p: number): void {
    this.page = p;
    this.load();
  }

  showDetail(log: any): void { this.detail.set(log); }

  activeFilters(): any {
    return {
      userId: this.filters.userId || undefined,
      module: this.filters.module || undefined,
      from: this.filters.from || undefined,
      to: this.filters.to || undefined
    };
  }

  actionType(action: string): string {
    const a = (action || '').toLowerCase();
    if (a.startsWith('create')) return 'CREATE';
    if (a.startsWith('update')) return 'UPDATE';
    if (a.startsWith('delete')) return 'DELETE';
    if (a.includes('failed') || a.includes('locked')) return 'SECURITY';
    return 'EVENT';
  }

  shortAction(action: string): string {
    const parts = (action || '').split(' ');
    return parts.length > 1 ? parts.slice(1).join('.') : '';
  }

  actionBadge(action: string): string {
    switch (this.actionType(action)) {
      case 'CREATE': return 'bg-success';
      case 'UPDATE': return 'bg-warning';
      case 'DELETE': return 'bg-danger';
      case 'SECURITY': return 'bg-danger';
      default: return 'bg-info';
    }
  }

  shortId(id?: string | null): string {
    return id ? id.substring(0, 8) : '-';
  }

  pretty(json?: string | null): string {
    if (!json) return '(no payload)';
    try { return JSON.stringify(JSON.parse(json), null, 2); } catch { return json; }
  }

  min(a: number, b: number): number { return Math.min(a, b); }
}
