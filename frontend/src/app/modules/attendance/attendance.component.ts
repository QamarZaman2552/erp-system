import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AttendanceRecord, Employee } from '../../core/models/erp.models';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header-row">
      <div>
        <h2>Attendance Tracking</h2>
        <p class="text-sm text-gray-400">Daily check-in / check-out times, working hours, and presence summaries</p>
      </div>
      <button class="btn btn-primary" (click)="openMarkModal()" *ngIf="canManage()">
        <i class="bi bi-plus-circle me-1"></i> Mark Attendance
      </button>
    </div>

    <!-- Attendance Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card erp-card">
        <span class="text-sm text-gray-400">Today Present</span>
        <div class="card-val text-emerald-400">{{ presentCount() }}</div>
      </div>
      <div class="summary-card erp-card">
        <span class="text-sm text-gray-400">Late Arrivals</span>
        <div class="card-val text-amber-400">{{ lateCount() }}</div>
      </div>
      <div class="summary-card erp-card">
        <span class="text-sm text-gray-400">Average Working Hours</span>
        <div class="card-val text-indigo-400">8.2 hrs</div>
      </div>
    </div>

    <!-- Attendance Log Table -->
    <div class="erp-table-container">
      <table class="erp-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Staff Member</th>
            <th>Check-In</th>
            <th>Check-Out</th>
            <th>Duration</th>
            <th>Arrival Status</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let att of attendanceList()">
            <td>{{ att.attendanceDate }}</td>
            <td class="font-semibold">{{ att.employeeName }}</td>
            <td>
              <span class="font-mono text-emerald-400" *ngIf="att.checkInTime">{{ fmtTime(att.checkInTime) }}</span>
              <span class="text-gray-500" *ngIf="!att.checkInTime">—</span>
            </td>
            <td>
              <span class="font-mono text-indigo-400" *ngIf="att.checkOutTime">{{ fmtTime(att.checkOutTime) }}</span>
              <span class="text-gray-500" *ngIf="!att.checkOutTime">—</span>
            </td>
            <td>
              <span *ngIf="att.workingHours">{{ att.workingHours }} hrs</span>
              <span class="text-gray-500" *ngIf="!att.workingHours">—</span>
            </td>
            <td>
              <span class="badge badge-warning" *ngIf="att.isLateArrival">Late Arrival</span>
              <span class="badge badge-success" *ngIf="!att.isLateArrival && att.isPresent">On Time</span>
              <span class="badge badge-danger" *ngIf="!att.isPresent">Absent</span>
            </td>
            <td class="text-gray-400 text-sm">{{ att.remarks || '—' }}</td>
          </tr>

          <tr *ngIf="attendanceList().length === 0">
            <td colspan="7" class="text-center py-8 text-gray-400">
              No attendance records recorded for today yet.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Reports Section (management only) -->
    <div class="reports-header" *ngIf="canSeeReports()">
      <div class="reports-tabs">
        <button class="report-tab" [class.active]="reportView() === 'monthly'" (click)="setReportView('monthly')">
          <i class="bi bi-calendar3 me-1"></i> Monthly Summary
        </button>
        <button class="report-tab" [class.active]="reportView() === 'late'" (click)="setReportView('late')">
          <i class="bi bi-alarm me-1"></i> Late Arrivals
        </button>
        <button class="report-tab" [class.active]="reportView() === 'absent'" (click)="setReportView('absent')">
          <i class="bi bi-person-dash me-1"></i> Absentees
        </button>
      </div>
      @if (reportView() === 'monthly' || reportView() === 'late') {
        <div class="d-flex gap-2 align-items-center">
          <select [(ngModel)]="reportMonth" name="rMonth" class="form-select form-select-sm w-auto" (change)="loadReport()">
            @for (m of monthNames; track $index) {
              <option [value]="$index + 1">{{ m }}</option>
            }
          </select>
          <select [(ngModel)]="reportYear" name="rYear" class="form-select form-select-sm w-auto" (change)="loadReport()">
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      }
    </div>

    <!-- Monthly Summary -->
    @if (reportView() === 'monthly') {
      <div class="erp-table-container">
        <table class="erp-table">
          <thead>
            <tr><th>Employee</th><th>Department</th><th>Present Days</th><th>Late Days</th><th>Leaves</th><th>Total Hours</th><th>Overtime</th></tr>
          </thead>
          <tbody>
            @for (r of monthlyReport(); track r.employeeId) {
              <tr>
                <td class="font-semibold">{{ r.employeeName }}</td>
                <td><span class="badge badge-info">{{ r.departmentName }}</span></td>
                <td>{{ r.presentDays }}</td>
                <td>{{ r.lateDays }}</td>
                <td>{{ r.leaveDays }}</td>
                <td>{{ r.totalHours }} hrs</td>
                <td [class.text-success]="r.overtimeHours > 0">{{ r.overtimeHours > 0 ? '+' + r.overtimeHours + ' hrs' : '—' }}</td>
              </tr>
            }
            <tr *ngIf="monthlyReport().length === 0">
              <td colspan="7" class="text-center py-8 text-gray-400">No attendance data for this month.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Department-wise Comparison -->
      <div class="erp-card p-3 mt-3">
        <h5 class="h6 mb-3">🏢 Department-wise Comparison ({{ monthNames[reportMonth - 1] }} {{ reportYear }})</h5>
        <table class="erp-table">
          <thead>
            <tr><th>Department</th><th class="text-center">Employees</th><th class="text-center">Present Days</th><th class="text-center">Late Days</th><th class="text-center">Leave Days</th><th class="text-center">Total Hours</th><th class="text-center">Overtime Hrs</th></tr>
          </thead>
          <tbody>
            @for (d of deptComparison(); track d.dept) {
              <tr>
                <td class="font-semibold"><span class="badge badge-info">{{ d.dept }}</span></td>
                <td class="text-center">{{ d.employees }}</td>
                <td class="text-center">{{ d.present }}</td>
                <td class="text-center">{{ d.late }}</td>
                <td class="text-center">{{ d.leaves }}</td>
                <td class="text-center">{{ d.hours }}</td>
                <td class="text-center">{{ d.overtime }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- Late Arrivals -->
    @if (reportView() === 'late') {
      <div class="erp-table-container">
        <table class="erp-table">
          <thead>
            <tr><th>Date</th><th>Employee</th><th>Check-In Time</th><th>Remarks</th></tr>
          </thead>
          <tbody>
            @for (r of lateArrivals(); track r.id) {
              <tr>
                <td>{{ r.attendanceDate }}</td>
                <td class="font-semibold">{{ r.employeeName }}</td>
                <td class="font-mono text-amber-400">{{ r.checkInTime }}</td>
                <td class="text-gray-400 text-sm">{{ r.remarks || '—' }}</td>
              </tr>
            }
            <tr *ngIf="lateArrivals().length === 0">
              <td colspan="4" class="text-center py-8 text-gray-400">No late arrivals this month. 🎉</td>
            </tr>
          </tbody>
        </table>
      </div>
    }

    <!-- Absentees -->
    @if (reportView() === 'absent') {
      <div class="erp-table-container">
        <table class="erp-table">
          <thead>
            <tr><th>Employee Code</th><th>Name</th><th>Department</th></tr>
          </thead>
          <tbody>
            @for (a of absentees(); track a.employeeId) {
              <tr>
                <td class="font-mono">{{ a.employeeCode }}</td>
                <td class="font-semibold">{{ a.employeeName }}</td>
                <td><span class="badge badge-info">{{ a.departmentName }}</span></td>
              </tr>
            }
            <tr *ngIf="absentees().length === 0">
              <td colspan="3" class="text-center py-8 text-gray-400">Everyone is marked present today.</td>
            </tr>
          </tbody>
        </table>
      </div>
    }

    <!-- Mark Attendance Modal -->
    @if (showMarkModal()) {
      <div class="modal d-block" tabindex="-1" (click)="closeMarkModal($event)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-clock-history me-2"></i>Mark Attendance</h5>
              <button type="button" class="btn-close btn-close-white" (click)="showMarkModal.set(false)"></button>
            </div>
            <form (ngSubmit)="submitMark('in')">
              <div class="modal-body">
                <div class="mb-3">
                  <label class="form-label small">Employee *</label>
                  <select [(ngModel)]="mark.employeeId" name="empId" required class="form-select">
                    <option [ngValue]="null" disabled>Select employee...</option>
                    @for (e of employees(); track e.id) {
                      <option [ngValue]="e.id">{{ e.employeeCode }} — {{ e.fullName }}</option>
                    }
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label small">Date</label>
                  <input type="date" [(ngModel)]="mark.date" name="mdate" class="form-control" />
                  <small class="form-hint">Backdated entries allowed (missed punch correction).</small>
                </div>
                <div class="row g-2 mb-3">
                  <div class="col-6">
                    <label class="form-label small">Check-In Time (HH:mm)</label>
                    <input type="time" [(ngModel)]="mark.checkIn" name="mcin" class="form-control" />
                  </div>
                  <div class="col-6">
                    <label class="form-label small">Check-Out Time (HH:mm)</label>
                    <input type="time" [(ngModel)]="mark.checkOut" name="mcout" class="form-control" />
                  </div>
                </div>
                <div class="alert alert-info py-2 small mb-3" *ngIf="mark.checkIn && mark.checkOut">
                  <i class="bi bi-magic me-1"></i>Both times filled → saves as a <strong>full corrected entry</strong> (auto hours &amp; late flag). Otherwise use the punch buttons below.
                </div>
                <div class="mb-3">
                  <label class="form-label small">Remarks</label>
                  <input type="text" [(ngModel)]="mark.remarks" name="rem" class="form-control"
                         placeholder="e.g. Manual entry by HR" />
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showMarkModal.set(false)">Cancel</button>
                <button type="button" class="btn btn-warning" [disabled]="saving() || !mark.employeeId || !mark.checkIn" (click)="submitManualEntry()">
                  <i class="bi bi-pencil-square me-1"></i> Save Full Entry
                </button>
                <button type="button" class="btn btn-success" [disabled]="saving() || !mark.employeeId" (click)="submitMark('in')">
                  <i class="bi bi-box-arrow-in-right me-1"></i> Check In
                </button>
                <button type="button" class="btn btn-primary" [disabled]="saving() || !mark.employeeId" (click)="submitMark('out')">
                  <i class="bi bi-box-arrow-left me-1"></i> Check Out
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .summary-card {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .card-val {
      font-size: 26px;
      font-weight: 700;
      font-family: var(--font-heading);
    }

    .font-semibold { font-weight: 600; }
    .text-emerald-400 { color: #34d399; }
    .text-amber-400 { color: #fbbf24; }
    .text-indigo-400 { color: #ededed; }
    .font-mono { font-family: var(--font-mono); }
    .text-sm { font-size: 13px; }
    .text-gray-400 { color: var(--text-secondary); }
    .text-gray-500 { color: var(--text-muted); }
    .text-center { text-align: center; }
    .py-8 { padding-top: 32px; padding-bottom: 32px; }

    .reports-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 28px 0 14px;
    }

    .reports-tabs { display: flex; gap: 8px; flex-wrap: wrap; }

    .report-tab {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: var(--text-secondary);
      border-radius: 8px;
      padding: 7px 14px;
      font-size: 13px;
      transition: all 0.15s ease;
    }

    .report-tab:hover { color: #fff; border-color: rgba(255, 255, 255, 0.3); }

    .report-tab.active {
      background: var(--accent-gradient, linear-gradient(135deg, #6366f1, #8b5cf6));
      color: #fff;
      border-color: transparent;
    }

    @media (max-width: 767px) {
      .page-header-row { flex-direction: column; align-items: flex-start; gap: 12px; }
      .summary-cards { grid-template-columns: 1fr; }
      .reports-header { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class AttendanceComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  canManage(): boolean { return this.auth.hasRole(['Admin', 'HR']); }
  canSeeReports(): boolean { return this.auth.hasRole(['Admin', 'HR', 'Manager']); }

  attendanceList = signal<AttendanceRecord[]>([]);
  employees = signal<Employee[]>([]);
  showMarkModal = signal(false);
  saving = signal(false);

  mark = { employeeId: null as string | null, remarks: '', date: new Date().toISOString().split('T')[0], checkIn: '', checkOut: '' };

  reportView = signal<'monthly' | 'late' | 'absent' | null>(null);
  monthlyReport = signal<any[]>([]);
  lateArrivals = signal<any[]>([]);
  absentees = signal<any[]>([]);
  reportMonth = new Date().getMonth() + 1;
  reportYear = new Date().getFullYear();
  monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  presentCount = signal(0);
  lateCount = signal(0);

  ngOnInit(): void {
    this.loadToday();
  }

  loadToday(): void {
    this.api.getTodayAttendance(1, 50).subscribe({
      next: (res) => {
        if (res?.items) {
          this.attendanceList.set(res.items);
          this.presentCount.set(res.items.filter(i => i.isPresent).length);
          this.lateCount.set(res.items.filter(i => i.isLateArrival).length);
        }
      }
    });
  }

  setReportView(view: 'monthly' | 'late' | 'absent'): void {
    if (this.reportView() === view) {
      this.reportView.set(null);
      return;
    }
    this.reportView.set(view);
    this.loadReport();
  }

  loadReport(): void {
    const view = this.reportView();
    if (view === 'monthly') {
      this.api.getMonthlyAttendanceReport(this.reportMonth, this.reportYear).subscribe({
        next: (res) => this.monthlyReport.set(Array.isArray(res) ? res : [])
      });
    } else if (view === 'late') {
      this.api.getLateArrivals(this.reportMonth, this.reportYear).subscribe({
        next: (res) => this.lateArrivals.set(Array.isArray(res) ? res : [])
      });
    } else if (view === 'absent') {
      this.api.getAbsentees().subscribe({
        next: (res) => this.absentees.set(Array.isArray(res) ? res : [])
      });
    }
  }

  openMarkModal(): void {
    this.mark = { employeeId: null, remarks: '', date: new Date().toISOString().split('T')[0], checkIn: '', checkOut: '' };
    this.showMarkModal.set(true);
    if (this.employees().length === 0) {
      this.api.getEmployees(1, 200).subscribe({
        next: (res) => { if (res?.items) this.employees.set(res.items); }
      });
    }
  }

  closeMarkModal(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.showMarkModal.set(false);
    }
  }

  submitMark(action: 'in' | 'out'): void {
    if (!this.mark.employeeId) {
      this.toast.warning('Attendance', 'Please select an employee first.');
      return;
    }

    const selected = this.employees().find(e => e.id === this.mark.employeeId);
    this.saving.set(true);

    const request$ = action === 'in'
      ? this.api.checkIn(this.mark.employeeId, this.mark.remarks || 'Manual entry', this.mark.date)
      : this.api.checkOut(this.mark.employeeId, this.mark.remarks || 'Manual entry', this.mark.date);

    request$.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.showMarkModal.set(false);
        const name = selected?.fullName || res?.data?.employeeName || 'Employee';
        this.toast.success(
          'Attendance',
          action === 'in' ? `${name} checked in successfully.` : `${name} checked out successfully.`
        );
        this.loadToday();
      },
      error: () => {
        this.saving.set(false);
      }
    });
  }

  submitManualEntry(): void {
    if (!this.mark.employeeId || !this.mark.checkIn) {
      this.toast.warning('Attendance', 'Employee and check-in time are required.');
      return;
    }
    this.saving.set(true);
    this.api.markManualAttendance({
      employeeId: this.mark.employeeId,
      date: this.mark.date,
      checkIn: this.mark.checkIn,
      checkOut: this.mark.checkOut || undefined,
      remarks: this.mark.remarks || undefined
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.showMarkModal.set(false);
        const name = res?.data?.employeeName || 'Employee';
        this.toast.success('Attendance', `Entry saved for ${name}: ${res?.data?.workingHours ?? 0}h${res?.data?.isLateArrival ? ' (late)' : ''}.`);
        this.loadToday();
      },
      error: () => this.saving.set(false)
    });
  }

  deptComparison(): { dept: string; employees: number; present: number; late: number; leaves: number; hours: number; overtime: number }[] {
    const map = new Map<string, any>();
    for (const r of this.monthlyReport()) {
      const cur = map.get(r.departmentName) || { dept: r.departmentName, employees: 0, present: 0, late: 0, leaves: 0, hours: 0, overtime: 0 };
      cur.employees++;
      cur.present += r.presentDays;
      cur.late += r.lateDays;
      cur.leaves += r.leaveDays ?? 0;
      cur.hours += r.totalHours ?? 0;
      cur.overtime += r.overtimeHours ?? 0;
      map.set(r.departmentName, cur);
    }
    return Array.from(map.values());
  }

  /** "04:44:49.7751669" → "04:44", keeps already-short values intact */
  fmtTime(t?: string | null): string {
    if (!t) return '—';
    const m = t.match(/^(\d{1,2}):(\d{2})/);
    return m ? `${m[1].padStart(2, '0')}:${m[2]}` : t;
  }
}
