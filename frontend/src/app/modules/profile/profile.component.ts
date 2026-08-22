import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { MyProfile, AttendanceRecord, PayrollRecord } from '../../core/models/erp.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="h3 mb-1"><i class="bi bi-person-circle me-2 text-primary"></i>My Profile</h2>
        <p class="text-secondary small mb-0">Personal info, attendance, and account settings</p>
      </div>
    </div>

    <div class="alert alert-warning" *ngIf="notLinked()">
      <i class="bi bi-exclamation-triangle me-2"></i>
      No employee profile is linked to your account. Please contact HR.
    </div>

    <div class="row g-4" *ngIf="profile()">
      <!-- Left Column: Profile -->
      <div class="col-md-5">
        <div class="card p-4 mb-4">
          <div class="d-flex align-items-center gap-3 mb-3">
            <div class="profile-avatar">{{ profile()?.fullName?.charAt(0) }}</div>
            <div>
              <h4 class="h5 mb-1">{{ profile()?.fullName }}</h4>
              <span class="badge bg-secondary me-1">{{ profile()?.employeeCode }}</span>
              <span class="badge" [class.bg-success]="profile()?.status === 'Active'" [class.bg-secondary]="profile()?.status !== 'Active'">{{ profile()?.status }}</span>
            </div>
          </div>
          <table class="table table-sm table-borderless mb-0">
            <tbody>
              <tr><td class="text-secondary small">Email</td><td class="small">{{ profile()?.email }}</td></tr>
              <tr><td class="text-secondary small">Department</td><td class="small">{{ profile()?.departmentName }}</td></tr>
              <tr><td class="text-secondary small">Designation</td><td class="small">{{ profile()?.designationTitle }}</td></tr>
              <tr><td class="text-secondary small">Joined</td><td class="small">{{ profile()?.dateOfJoining | date:'MMM d, y' }}</td></tr>
              <tr><td class="text-secondary small">Phone</td><td class="small">{{ editable().phone || '—' }}</td></tr>
              <tr><td class="text-secondary small">City</td><td class="small">{{ editable().city || '—' }}</td></tr>
              <tr><td class="text-secondary small">Country</td><td class="small">{{ editable().country || '—' }}</td></tr>
            </tbody>
          </table>
          <button class="btn btn-sm btn-outline-primary mt-2" (click)="editing.set(!editing())">
            <i class="bi bi-pencil me-1"></i>{{ editing() ? 'Cancel' : 'Edit Contact Info' }}
          </button>
        </div>

        <!-- Edit Contact Info -->
        <div class="card p-4 mb-4" *ngIf="editing()">
          <h5 class="h6 mb-3"><i class="bi bi-pencil-square me-2"></i>Edit Contact Info</h5>
          <div class="mb-2">
            <label class="form-label small">Phone</label>
            <input type="text" [(ngModel)]="editable().phone" name="ph" class="form-control form-control-sm" />
          </div>
          <div class="mb-2">
            <label class="form-label small">City</label>
            <input type="text" [(ngModel)]="editable().city" name="ct" class="form-control form-control-sm" />
          </div>
          <div class="mb-3">
            <label class="form-label small">Country</label>
            <input type="text" [(ngModel)]="editable().country" name="cn" class="form-control form-control-sm" />
          </div>
          <small class="text-secondary d-block mb-2">Only phone, city &amp; country are editable. Other changes go through HR.</small>
          <button class="btn btn-sm btn-primary" (click)="saveProfile()" [disabled]="saving()">
            <span class="spinner-border spinner-border-sm me-1" *ngIf="saving()"></span>Save Changes
          </button>
        </div>

        <!-- Change Password -->
        <div class="card p-4">
          <h5 class="h6 mb-3"><i class="bi bi-shield-lock me-2"></i>Change Password</h5>
          <div class="mb-2">
            <label class="form-label small">Current Password</label>
            <input type="password" [(ngModel)]="pwd.current" name="cp" class="form-control form-control-sm" autocomplete="current-password" />
          </div>
          <div class="mb-2">
            <label class="form-label small">New Password</label>
            <input type="password" [(ngModel)]="pwd.next" name="np" class="form-control form-control-sm" autocomplete="new-password" />
          </div>
          <div class="mb-3">
            <label class="form-label small">Confirm New Password</label>
            <input type="password" [(ngModel)]="pwd.confirm" name="cnp" class="form-control form-control-sm" autocomplete="new-password" />
          </div>
          <button class="btn btn-sm btn-primary" (click)="savePassword()" [disabled]="savingPwd()">
            <span class="spinner-border spinner-border-sm me-1" *ngIf="savingPwd()"></span>Update Password
          </button>
        </div>
      </div>

      <!-- Right Column: Attendance & Payslips -->
      <div class="col-md-7">
        <!-- Today's Attendance -->
        <div class="card p-4 mb-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="h6 mb-0"><i class="bi bi-clock-history me-2"></i>Today's Attendance</h5>
            <span class="badge" [class.bg-success]="todayRecord()?.isPresent" [class.bg-secondary]="!todayRecord()?.isPresent">
              {{ todayRecord() ? (todayRecord()?.isPresent ? 'Present' : 'Marked') : 'Not Marked' }}
            </span>
          </div>
          <div class="d-flex align-items-center gap-4 flex-wrap" *ngIf="todayRecord(); else notCheckedIn">
            <div>
              <small class="text-secondary d-block">Check In</small>
              <strong>{{ todayRecord()?.checkInTime | date:'HH:mm:ss' }}</strong>
            </div>
            <div>
              <small class="text-secondary d-block">Check Out</small>
              <strong>{{ todayRecord()?.checkOutTime | date:'HH:mm:ss' }}</strong>
            </div>
            <div>
              <small class="text-secondary d-block">Hours</small>
              <strong>{{ todayRecord()?.workingHours || 0 }}h</strong>
            </div>
            <button class="btn btn-sm btn-outline-danger ms-auto" (click)="checkOutNow()" [disabled]="!!todayRecord()?.checkOutTime || checking()">
              Check Out
            </button>
          </div>
          <ng-template #notCheckedIn>
            <p class="text-secondary small mb-2">You haven't checked in yet today.</p>
            <button class="btn btn-sm btn-success" (click)="checkInNow()" [disabled]="checking()">
              <span class="spinner-border spinner-border-sm me-1" *ngIf="checking()"></span>Check In
            </button>
          </ng-template>
        </div>

        <!-- Monthly History -->
        <div class="card p-4 mb-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="h6 mb-0"><i class="bi bi-calendar3 me-2"></i>This Month's Attendance</h5>
            <span class="small text-secondary">{{ presentCount }} present / {{ history().length }} marked</span>
          </div>
          <div class="d-flex flex-wrap gap-1" *ngIf="history().length > 0; else noHistory">
            <span *ngFor="let r of history()" class="day-chip"
                  [class.day-present]="r.isPresent"
                  [class.day-late]="r.isPresent && r.isLateArrival"
                  [class.day-absent]="!r.isPresent"
                  [title]="(r.attendanceDate | date:'MMM d') + (r.isPresent ? ' - Present' : ' - Absent') + (r.isLateArrival ? ' (Late)' : '')">
              {{ r.attendanceDate | date:'d' }}
            </span>
          </div>
          <ng-template #noHistory>
            <p class="text-secondary small mb-0">No attendance records this month.</p>
          </ng-template>
        </div>

        <!-- My Payslips -->
        <div class="card p-0">
          <div class="p-3 border-bottom border-secondary border-opacity-10">
            <h5 class="h6 mb-0"><i class="bi bi-receipt me-2"></i>My Salary Slips</h5>
          </div>
          <div class="table-responsive" *ngIf="payrolls().length > 0; else noPayroll">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr class="small text-secondary">
                  <th class="ps-3">Month</th>
                  <th>Gross</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th class="pe-3 text-end">Payslip #</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let p of payrolls()">
                  <td class="ps-3 fw-semibold">{{ monthName(p.month) }} {{ p.year }}</td>
                  <td>\${{ p.grossSalary | number:'1.0-0' }}</td>
                  <td class="fw-semibold">\${{ p.netSalary | number:'1.0-0' }}</td>
                  <td><span class="badge" [class.bg-success]="p.status === 'Paid'" [class.bg-warning]="p.status === 'Pending' || p.status === 'Processed'" [class.bg-danger]="p.status === 'Failed'">{{ p.status }}</span></td>
                  <td class="pe-3 text-end"><span class="badge bg-secondary">PAY-{{ p.id.substring(0, 8) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #noPayroll>
            <div class="p-4 text-center text-secondary small">No salary slips generated yet.</div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-avatar {
      width: 64px; height: 64px; border-radius: 50%;
      background: var(--accent-gradient); color: #10141f;
      display: flex; align-items: center; justify-content: center;
      font-size: 26px; font-weight: 700;
    }
    .day-chip {
      width: 30px; height: 30px; display: inline-flex;
      align-items: center; justify-content: center;
      border-radius: 6px; font-size: 11px; font-weight: 600;
      background: var(--bg-tertiary); color: var(--text-muted);
      border: 1px solid var(--border-color);
    }
    .day-present { background: rgba(25, 135, 84, 0.2); color: #75dfae; border-color: rgba(25, 135, 84, 0.4); }
    .day-late { background: rgba(255, 193, 7, 0.2); color: #ffe08a; border-color: rgba(255, 193, 7, 0.4); }
    .day-absent { background: rgba(220, 53, 69, 0.15); color: #ff9faa; border-color: rgba(220, 53, 69, 0.35); }
  `]
})
export class ProfileComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  toast = inject(ToastService);

  user = this.auth.currentUser;
  profile = signal<MyProfile | null>(null);
  notLinked = signal(false);
  editing = signal(false);
  saving = signal(false);
  savingPwd = signal(false);
  checking = signal(false);

  todayRecord = signal<AttendanceRecord | null>(null);
  history = signal<AttendanceRecord[]>([]);
  payrolls = signal<PayrollRecord[]>([]);

  editable = signal({ phone: '', city: '', country: '' });
  pwd = { current: '', next: '', confirm: '' };

  ngOnInit(): void {
    this.api.getMyProfile().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.profile.set(res.data);
          this.editable.set({ phone: res.data.phone || '', city: res.data.city || '', country: res.data.country || '' });
          this.loadAttendance(res.data.id);
        } else {
          this.notLinked.set(true);
        }
      },
      error: () => this.notLinked.set(true)
    });
    this.loadPayrolls();
  }

  loadAttendance(employeeId: string): void {
    const now = new Date();
    this.api.getMyAttendanceHistory(employeeId, now.getMonth() + 1, now.getFullYear()).subscribe({
      next: (res) => {
        const items = res?.items || [];
        this.history.set(items);
        const today = new Date().toDateString();
        this.todayRecord.set(items.find(r => new Date(r.attendanceDate).toDateString() === today) || null);
      }
    });
  }

  loadPayrolls(): void {
    this.api.getMyPayrolls().subscribe({
      next: (res) => this.payrolls.set(res?.items || [])
    });
  }

  get presentCount(): number {
    return this.history().filter(r => r.isPresent).length;
  }

  saveProfile(): void {
    this.saving.set(true);
    this.api.updateMyProfile({
      phone: this.editable().phone,
      city: this.editable().city,
      country: this.editable().country
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.success && res.data) {
          this.profile.set(res.data);
          this.toast.success('Profile', 'Contact info updated!');
        }
      },
      error: () => this.saving.set(false)
    });
  }

  savePassword(): void {
    if (!this.pwd.current || !this.pwd.next) {
      this.toast.warning('Password', 'Please fill in both password fields.');
      return;
    }
    if (this.pwd.next !== this.pwd.confirm) {
      this.toast.warning('Password', 'New passwords do not match.');
      return;
    }
    if (this.pwd.next.length < 6) {
      this.toast.warning('Password', 'New password must be at least 6 characters.');
      return;
    }
    this.savingPwd.set(true);
    this.api.changePassword({ currentPassword: this.pwd.current, newPassword: this.pwd.next }).subscribe({
      next: (res) => {
        this.savingPwd.set(false);
        if (res.success) {
          this.toast.success('Password', 'Password changed successfully!');
          this.pwd = { current: '', next: '', confirm: '' };
        }
      },
      error: () => this.savingPwd.set(false)
    });
  }

  checkInNow(): void {
    this.checking.set(true);
    this.api.checkInMe().subscribe({
      next: (res) => {
        this.checking.set(false);
        if (res.success) {
          this.toast.success('Attendance', 'Checked in successfully!');
          if (this.profile()) this.loadAttendance(this.profile()!.id);
        }
      },
      error: () => this.checking.set(false)
    });
  }

  checkOutNow(): void {
    this.checking.set(true);
    this.api.checkOutMe().subscribe({
      next: (res) => {
        this.checking.set(false);
        if (res.success) {
          this.toast.success('Attendance', 'Checked out. See you tomorrow!');
          if (this.profile()) this.loadAttendance(this.profile()!.id);
        }
      },
      error: () => this.checking.set(false)
    });
  }

  monthName(m: number): string {
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1] || '';
  }
}
