import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LeaveRequest, Employee } from '../../core/models/erp.models';

@Component({
  selector: 'app-leaves',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header-row">
      <div>
        <h2>Leave Management</h2>
        <p class="text-sm text-gray-400">Employee leave applications, approvals, and balance history</p>
      </div>
      <button class="btn btn-primary" (click)="showModal.set(true)">
        <span>+ Apply for Leave</span>
      </button>
    </div>

    <!-- Leave Summary Bar -->
    <div class="filter-bar erp-card d-flex align-items-center gap-3 flex-wrap">
      <div class="summary-counter">
        <span class="text-muted">Pending:</span>
        <strong class="text-warning">{{ pendingCount() }}</strong>
      </div>
      <div class="summary-counter">
        <span class="text-muted">Approved:</span>
        <strong class="text-success">{{ approvedCount() }}</strong>
      </div>
      <div class="summary-counter">
        <span class="text-muted">Rejected:</span>
        <strong class="text-danger">{{ rejectedCount() }}</strong>
      </div>
      <div class="summary-counter">
        <span class="text-muted">Days Used (Approved):</span>
        <strong class="text-primary">{{ approvedDays() }}</strong>
      </div>
    </div>

    <!-- Leave Requests Table -->
    <div class="erp-table-container">
      <table class="erp-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Type</th>
            <th>Dates</th>
            <th>Days</th>
            <th>Reason</th>
            <th>Status / Approval</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let leave of leaves()">
            <td class="font-semibold">{{ leave.employeeName }}</td>
            <td><span class="badge badge-info">{{ leave.leaveType }}</span></td>
            <td>
              <div>{{ leave.startDate }} to {{ leave.endDate }}</div>
            </td>
            <td class="font-semibold">{{ leave.totalDays }} day(s)</td>
            <td class="text-sm text-gray-300">{{ leave.reason }}</td>
            <td>
              <div class="mini-flow" [class.mini-flow-pending]="leave.status === 'Pending'" [class.mini-flow-approved]="leave.status === 'Approved'" [class.mini-flow-rejected]="leave.status === 'Rejected'">
                <div class="mini-flow-step" [class.active]="leave.status !== 'Pending'">
                  <span class="mini-flow-dot"></span>
                  <span class="mini-flow-label">Submitted</span>
                </div>
                <div class="mini-flow-arrow"></div>
                <div class="mini-flow-step" [class.active]="leave.status === 'Approved'" [class.rejected]="leave.status === 'Rejected'">
                  <span class="mini-flow-dot"></span>
                  <span class="mini-flow-label">{{ leave.status === 'Approved' ? 'Approved' : leave.status === 'Rejected' ? 'Rejected' : '…' }}</span>
                </div>
              </div>
              <div *ngIf="leave.approvedBy || leave.rejectionReason" class="mini-flow-detail">
                <span *ngIf="leave.approvedBy" class="text-xs text-success">✓ {{ leave.approvedBy }}{{ leave.approvedAt ? ' on ' + leave.approvedAt : '' }}</span>
                <span *ngIf="leave.rejectionReason" class="text-xs text-danger">✕ {{ leave.rejectionReason }}</span>
              </div>
              <div class="action-btn-group mt-1" *ngIf="leave.status === 'Pending' && canApprove()">
                <button class="btn btn-sm btn-success" (click)="approve(leave.id, true)">✓</button>
                <button class="btn btn-sm btn-danger" (click)="approve(leave.id, false)">✕</button>
              </div>
              <span class="text-xs text-gray-500" *ngIf="leave.status !== 'Pending'">Processed</span>
            </td>
          </tr>

          <tr *ngIf="leaves().length === 0">
            <td colspan="6" class="text-center py-8 text-gray-400">
              No leave requests currently found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- On-Leave Calendar + Department Report -->
    <div class="row g-3 mt-1">
      <div class="col-md-7">
        <div class="erp-card p-3 h-100">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="h6 mb-0">🗓️ Who's On Leave</h5>
            <input type="month" [(ngModel)]="calendarMonth" (change)="calendarMonth.set($any($event.target).value)" class="form-control form-control-sm" style="max-width: 160px;" />
          </div>
          <table class="erp-table" *ngIf="onLeaveThisMonth().length > 0; else noneOnLeave">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Working Days</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of onLeaveThisMonth()">
                <td class="font-semibold">{{ l.employeeName }}</td>
                <td><span class="badge badge-info">{{ l.leaveType }}</span></td>
                <td class="text-sm text-gray-400">{{ fmtDate(l.startDate) }} → {{ fmtDate(l.endDate) }}</td>
                <td>{{ countWeekdays(l.startDate, l.endDate) }}</td>
              </tr>
            </tbody>
          </table>
          <ng-template #noneOnLeave>
            <p class="text-sm text-gray-400 mb-0">No approved leaves in {{ monthLabel() }}.</p>
          </ng-template>
        </div>
      </div>
      <div class="col-md-5">
        <div class="erp-card p-3 h-100">
          <h5 class="h6 mb-3">📊 Department-wise Leave ({{ monthLabel() }})</h5>
          <table class="erp-table" *ngIf="deptSummary().length > 0; else noDept">
            <thead>
              <tr>
                <th>Department</th>
                <th class="text-center">Requests</th>
                <th class="text-center">Days</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of deptSummary()">
                <td class="font-semibold">{{ d.dept }}</td>
                <td class="text-center">{{ d.requests }}</td>
                <td class="text-center font-semibold">{{ d.days }}</td>
              </tr>
            </tbody>
          </table>
          <ng-template #noDept>
            <p class="text-sm text-gray-400 mb-0">No approved leave data for this month.</p>
          </ng-template>
        </div>
      </div>
    </div>

    <!-- Apply Leave Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="showModal()">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Submit Leave Request</h5>
            <button type="button" class="btn-close btn-close-white" (click)="showModal.set(false)"></button>
          </div>
          <form (ngSubmit)="submitLeave()">
            <div class="modal-body">
              <div class="mb-3" *ngIf="canPickEmployee()">
                <label class="form-label small">Employee *</label>
                <select [(ngModel)]="newLeave.employeeId" name="emp" required class="form-select">
                  <option *ngFor="let e of employees()" [value]="e.id">{{ e.fullName }} ({{ e.departmentName }})</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label small">Leave Type</label>
                <select [(ngModel)]="newLeave.leaveType" name="lt" required class="form-select">
                  <option [value]="0">Annual Leave</option>
                  <option [value]="1">Sick Leave</option>
                  <option [value]="2">Maternity Leave</option>
                  <option [value]="3">Paternity Leave</option>
                  <option [value]="4">Unpaid Leave</option>
                  <option [value]="5">Emergency Leave</option>
                </select>
              </div>

              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label small">Start Date *</label>
                  <input type="date" [(ngModel)]="newLeave.startDate" name="sd" required class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label small">End Date *</label>
                  <input type="date" [(ngModel)]="newLeave.endDate" name="ed" required class="form-control" />
                </div>
              </div>
              <div class="alert alert-info py-2 small" *ngIf="previewDays() > 0">
                <i class="bi bi-calendar-check me-1"></i>
                Duration: <strong>{{ previewDays() }} working day(s)</strong> — weekends excluded automatically.
              </div>
              <div class="alert alert-warning py-2 small" *ngIf="previewDays() === 0 && newLeave.startDate && newLeave.endDate">
                <i class="bi bi-exclamation-triangle me-1"></i>Selected range has no working days (only weekends).
              </div>

              <div class="mb-1">
                <label class="form-label small">Reason / Notes *</label>
                <textarea [(ngModel)]="newLeave.reason" name="rs" rows="3" required class="form-control" placeholder="Explain the reason for your leave..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showModal.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Submit Application</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .action-btn-group {
      display: flex;
      gap: 6px;
    }

    .summary-counter {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
    }

    .summary-counter strong {
      font-size: 16px;
    }

    .text-sm { font-size: 13px; }
    .text-xs { font-size: 11px; }
    .text-gray-300 { color: #d1d5db; }
    .text-gray-400 { color: var(--text-secondary); }
    .text-gray-500 { color: var(--text-muted); }
    .text-center { text-align: center; }
    .py-8 { padding-top: 32px; padding-bottom: 32px; }

    .mini-flow {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
    }

    .mini-flow-step {
      display: flex;
      align-items: center;
      gap: 3px;
      opacity: 0.4;
    }

    .mini-flow-step.active {
      opacity: 1;
    }

    .mini-flow-step.rejected {
      opacity: 1;
    }

    .mini-flow-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--text-muted);
      display: inline-block;
    }

    .mini-flow-step.active .mini-flow-dot {
      background: var(--success);
    }

    .mini-flow-step.rejected .mini-flow-dot {
      background: var(--danger);
    }

    .mini-flow-label {
      color: var(--text-muted);
      font-size: 10px;
    }

    .mini-flow-step.active .mini-flow-label {
      color: var(--text-primary);
      font-weight: 600;
    }

    .mini-flow-arrow {
      color: var(--text-muted);
      font-size: 8px;
    }

    .mini-flow-detail {
      display: flex;
      gap: 8px;
      margin-top: 4px;
      flex-wrap: wrap;
    }

    .mini-flow.mini-flow-pending .mini-flow-label {
      color: var(--warning);
    }
  `]
})
export class LeavesComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);

  canPickEmployee(): boolean { return this.auth.hasRole(['Admin', 'HR', 'Manager']); }

  leaves = signal<LeaveRequest[]>([]);
  employees = signal<Employee[]>([]);
  showModal = signal(false);

  pendingCount = computed(() => this.leaves().filter(l => l.status === 'Pending').length);
  approvedCount = computed(() => this.leaves().filter(l => l.status === 'Approved').length);
  rejectedCount = computed(() => this.leaves().filter(l => l.status === 'Rejected').length);
  approvedDays = computed(() => this.leaves().filter(l => l.status === 'Approved').reduce((s, l) => s + (l.totalDays || 0), 0));

  newLeave: any = {
    employeeId: '',
    leaveType: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: ''
  };

  ngOnInit(): void {
    this.loadLeaves();
    this.loadEmployees();
  }

  loadLeaves(): void {
    this.api.getLeaves(1, 50).subscribe({
      next: (res) => {
        if (res?.items) this.leaves.set(res.items);
      }
    });
  }

  loadEmployees(): void {
    this.api.getEmployees(1, 100).subscribe({
      next: (res) => {
        if (res?.items) {
          this.employees.set(res.items);
          if (res.items.length > 0 && !this.newLeave.employeeId) {
            this.newLeave.employeeId = res.items[0].id;
          }
        }
      }
    });
  }

  submitLeave(): void {
    if (!this.newLeave.employeeId) {
      this.notifications.addNotification({ id: Math.random().toString(), title: 'Leave', message: 'Please select an employee.', type: 'warning', timestamp: new Date() });
      return;
    }
    if (new Date(this.newLeave.endDate) < new Date(this.newLeave.startDate)) {
      this.notifications.addNotification({ id: Math.random().toString(), title: 'Leave', message: 'End date cannot be before start date.', type: 'warning', timestamp: new Date() });
      return;
    }
    this.api.createLeave(this.newLeave).subscribe({
      next: () => {
        this.showModal.set(false);
        this.loadLeaves();
        this.notifications.addNotification({ id: Math.random().toString(), title: 'Leave', message: 'Leave request submitted successfully!', type: 'success', timestamp: new Date() });
      },
      error: (err) => this.notifications.addNotification({ id: Math.random().toString(), title: 'Leave', message: err?.error?.message || 'Could not submit leave request.', type: 'error', timestamp: new Date() })
    });
  }

  approve(id: string, isApproved: boolean): void {
    if (!isApproved) {
      const reason = prompt('Rejection reason (required):');
      if (!reason || !reason.trim()) {
        this.notifications.addNotification({ id: Math.random().toString(), title: 'Leave', message: 'Rejection reason is required.', type: 'warning', timestamp: new Date() });
        return;
      }
      this.api.approveLeave(id, false, reason.trim()).subscribe({
        next: (res) => {
          if (res?.data) this.leaves.update(list => list.map(l => l.id === id ? res.data! : l));
          this.loadLeaves();
        },
        error: (err) => this.notifications.addNotification({ id: Math.random().toString(), title: 'Leave', message: err?.error?.message || 'Rejection failed.', type: 'error', timestamp: new Date() })
      });
      return;
    }
    this.api.approveLeave(id, true).subscribe({
      next: (res) => {
        if (res?.data) this.leaves.update(list => list.map(l => l.id === id ? res.data! : l));
        this.loadLeaves();
      },
      error: (err) => this.notifications.addNotification({ id: Math.random().toString(), title: 'Leave', message: err?.error?.message || 'Approval failed.', type: 'error', timestamp: new Date() })
    });
  }

  previewDays(): number {
    if (!this.newLeave.startDate || !this.newLeave.endDate) return 0;
    return this.countWeekdays(this.newLeave.startDate, this.newLeave.endDate);
  }

  countWeekdays(startStr: string, endStr: string): number {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
    let days = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) days++;
    }
    return days;
  }

  calendarMonth = signal<string>(new Date().toISOString().substring(0, 7));

  monthStart(): Date { return new Date(this.calendarMonth() + '-01T00:00:00'); }
  monthEnd(): Date {
    const s = this.monthStart();
    return new Date(s.getFullYear(), s.getMonth() + 1, 0, 23, 59, 59);
  }

  onLeaveThisMonth(): LeaveRequest[] {
    const ms = this.monthStart().getTime();
    const me = this.monthEnd().getTime();
    return this.leaves().filter(l => {
      if (l.status !== 'Approved') return false;
      const s = new Date(l.startDate).getTime();
      const e = new Date(l.endDate).getTime();
      return s <= me && e >= ms;
    });
  }

  deptSummary(): { dept: string; requests: number; days: number }[] {
    const map = new Map<string, { requests: number; days: number }>();
    for (const l of this.onLeaveThisMonth()) {
      const emp = this.employees().find(e => e.id === l.employeeId);
      const dept = emp?.departmentName || 'Unknown';
      const cur = map.get(dept) || { requests: 0, days: 0 };
      cur.requests++;
      cur.days += this.countWeekdays(l.startDate, l.endDate);
      map.set(dept, cur);
    }
    return Array.from(map.entries()).map(([dept, v]) => ({ dept, ...v })).sort((a, b) => b.days - a.days);
  }

  monthLabel(): string {
    const d = this.monthStart();
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  fmtDate(s: string): string {
    return new Date(s).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

  canApprove(): boolean {
    return this.auth.hasRole(['Admin', 'HR', 'Manager']);
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'Approved': return 'badge-success';
      case 'Pending': return 'badge-warning';
      case 'Rejected': return 'badge-danger';
      default: return 'badge-neutral';
    }
  }
}
