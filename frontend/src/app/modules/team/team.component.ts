import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { TeamMember, ProjectTask, AttendanceRecord } from '../../core/models/erp.models';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="h3 mb-1"><i class="bi bi-people me-2 text-primary"></i>My Team</h2>
        <p class="text-secondary small mb-0">Team members, their workload, and overdue tasks</p>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card p-3 d-flex align-items-center gap-3">
          <span class="metric-icon bg-primary bg-opacity-25 text-primary">👥</span>
          <div>
            <div class="metric-value">{{ team().length }}</div>
            <div class="metric-title">Team Members</div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card p-3 d-flex align-items-center gap-3">
          <span class="metric-icon bg-danger bg-opacity-25 text-danger">⚠️</span>
          <div>
            <div class="metric-value">{{ overdueTasks().length }}</div>
            <div class="metric-title">Overdue Tasks</div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card p-3 d-flex align-items-center gap-3">
          <span class="metric-icon bg-success bg-opacity-25 text-success">📋</span>
          <div>
            <div class="metric-value">{{ totalActiveTasks() }}</div>
            <div class="metric-title">Active Task Assignments</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Team Members Table -->
    <div class="card p-0 mb-4">
      <div class="p-3 border-bottom border-secondary border-opacity-10">
        <h5 class="h6 mb-0"><i class="bi bi-person-badge me-2"></i>Team Members</h5>
      </div>
      <div class="table-responsive" *ngIf="team().length > 0; else noTeam">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr class="small text-secondary">
              <th class="ps-3">Code</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Designation</th>
              <th class="text-center">Active Tasks</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of team()">
              <td class="ps-3"><span class="badge bg-secondary">{{ m.employeeCode }}</span></td>
              <td class="fw-semibold">{{ m.employeeName }}</td>
              <td class="text-secondary small">{{ m.email }}</td>
              <td>{{ m.departmentName }}</td>
              <td class="text-secondary">{{ m.designationTitle }}</td>
              <td class="text-center">
                <span class="badge" [class.bg-success]="m.activeTaskCount === 0"
                      [class.bg-warning]="m.activeTaskCount > 0 && m.activeTaskCount <= 3"
                      [class.bg-danger]="m.activeTaskCount > 3">{{ m.activeTaskCount }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <ng-template #noTeam>
        <div class="p-5 text-center text-secondary">
          <i class="bi bi-people fs-1 d-block mb-2 opacity-50"></i>
          No team members found. Employees whose "Reporting Manager" is set to you appear here.
        </div>
      </ng-template>
    </div>

    <!-- Today's Team Attendance -->
    <div class="card p-0 mb-4">
      <div class="p-3 border-bottom border-secondary border-opacity-10">
        <h5 class="h6 mb-0"><i class="bi bi-alarm me-2"></i>Team Attendance — Today</h5>
      </div>
      <div class="table-responsive" *ngIf="team().length > 0; else noTeam2">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr class="small text-secondary">
              <th class="ps-3">Code</th>
              <th>Name</th>
              <th class="text-center">Status</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th class="text-end pe-3">Hours</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of team()">
              <td class="ps-3"><span class="badge bg-secondary">{{ m.employeeCode }}</span></td>
              <td class="fw-semibold">{{ m.employeeName }}</td>
              <td class="text-center">
                <span class="badge" [class.bg-success]="todayStatus(m.employeeId) === 'Present'"
                      [class.bg-warning]="todayStatus(m.employeeId) === 'Late'"
                      [class.bg-danger]="todayStatus(m.employeeId) === 'Absent' || todayStatus(m.employeeId) === 'No Record'"
                      [class.bg-secondary]="todayStatus(m.employeeId) === 'Not Marked'">
                  {{ todayStatus(m.employeeId) }}
                </span>
              </td>
              <td class="small">{{ checkInOf(m.employeeId) || '—' }}</td>
              <td class="small">{{ checkOutOf(m.employeeId) || '—' }}</td>
              <td class="text-end pe-3 small">{{ hoursOf(m.employeeId) ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ng-template #noTeam2>
        <div class="p-4 text-center text-secondary small">Add team members to see attendance.</div>
      </ng-template>
    </div>

    <!-- Overdue Tasks -->
    <div class="card p-0">
      <div class="p-3 border-bottom border-secondary border-opacity-10 d-flex justify-content-between align-items-center">
        <h5 class="h6 mb-0"><i class="bi bi-exclamation-triangle me-2 text-danger"></i>Overdue Tasks</h5>
        <button class="btn btn-sm btn-outline-secondary" (click)="ngOnInit()">
          <i class="bi bi-arrow-clockwise me-1"></i>Refresh
        </button>
      </div>
      <div class="table-responsive" *ngIf="overdueTasks().length > 0; else noOverdue">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr class="small text-secondary">
              <th class="ps-3">Task</th>
              <th>Project</th>
              <th>Assigned To</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th class="text-end pe-3">Days Overdue</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of overdueTasks()">
              <td class="ps-3 fw-semibold">{{ t.title }}</td>
              <td class="text-secondary">{{ t.projectName }}</td>
              <td class="small">{{ t.assigneeNames.join(', ') || '—' }}</td>
              <td><span class="badge" [class.bg-secondary]="t.priority === 'Low'" [class.bg-info]="t.priority === 'Medium'" [class.bg-warning]="t.priority === 'High'" [class.bg-danger]="t.priority === 'Critical'">{{ t.priority }}</span></td>
              <td class="text-secondary small">{{ t.dueDate | date:'MMM d, y' }}</td>
              <td class="text-end pe-3"><span class="badge bg-danger">{{ daysOverdue(t.dueDate) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <ng-template #noOverdue>
        <div class="p-5 text-center text-secondary">
          <i class="bi bi-check2-circle fs-1 d-block mb-2 text-success"></i>
          No overdue tasks. Team is on track!
        </div>
      </ng-template>
    </div>
  `
})
export class TeamComponent implements OnInit {
  private api = inject(ApiService);

  team = signal<TeamMember[]>([]);
  overdueTasks = signal<ProjectTask[]>([]);
  todayAttendance = signal<AttendanceRecord[]>([]);

  ngOnInit(): void {
    this.api.getMyTeam().subscribe({
      next: (res) => this.team.set(res || [])
    });
    this.api.getOverdueTasks().subscribe({
      next: (res) => this.overdueTasks.set(res || [])
    });
    this.api.getTodayAttendance(1, 200).subscribe({
      next: (res) => this.todayAttendance.set(res?.items || [])
    });
  }

  recOf(employeeId: string): AttendanceRecord | undefined {
    const today = new Date().toDateString();
    return this.todayAttendance().find(r =>
      r.employeeId === employeeId && new Date(r.attendanceDate).toDateString() === today);
  }

  todayStatus(employeeId: string): string {
    const r = this.recOf(employeeId);
    if (!r) return 'No Record';
    if (!r.isPresent && !r.checkInTime) return 'Not Marked';
    return r.isLateArrival ? 'Late' : 'Present';
  }

  checkInOf(employeeId: string): string | null {
    return this.recOf(employeeId)?.checkInTime ?? null;
  }

  checkOutOf(employeeId: string): string | null {
    return this.recOf(employeeId)?.checkOutTime ?? null;
  }

  hoursOf(employeeId: string): number | null {
    return this.recOf(employeeId)?.workingHours ?? null;
  }

  totalActiveTasks(): number {
    return this.team().reduce((sum, m) => sum + m.activeTaskCount, 0);
  }

  daysOverdue(dueDate?: string): number {
    if (!dueDate) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000));
  }
}
