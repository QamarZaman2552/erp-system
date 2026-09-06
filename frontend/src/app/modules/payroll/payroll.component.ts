import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PayrollRecord, Employee } from '../../core/models/erp.models';
import { PaginationComponent } from '../../shared/components/pagination.component';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div class="page-header-row">
      <div>
        <h2>Payroll Management</h2>
        <p class="text-sm text-gray-400">Automated salary processing, allowance/tax calculations, and payslips</p>
      </div>
      <div class="header-action-btns">
        <button class="btn btn-primary" (click)="generateMonthlyPayroll()">
          <span>⚡ Generate Payroll for {{ currentMonth }}/{{ currentYear }}</span>
        </button>
      </div>
    </div>

    <!-- Payroll Table -->
    <div class="erp-table-container">
      <table class="erp-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Period</th>
            <th>Basic</th>
            <th class="text-center">W.Days</th>
            <th class="text-center">Present</th>
            <th class="text-center">Leave</th>
            <th>OT Pay</th>
            <th>Absent Ded.</th>
            <th>Gross</th>
            <th>Net Salary</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of payrollRecords()">
            <td class="font-semibold">{{ p.employeeName }}</td>
            <td><span class="badge badge-info">{{ p.month }}/{{ p.year }}</span></td>
            <td>\${{ p.basicSalary | number:'1.0-0' }}</td>
            <td class="text-center">{{ p.workingDays ?? '—' }}</td>
            <td class="text-center">{{ p.presentDays ?? '—' }}</td>
            <td class="text-center">{{ p.leaveDays ?? 0 }}</td>
            <td class="text-emerald-400">{{ p.overtimePay ? '$' + (p.overtimePay | number:'1.0-0') : '—' }}</td>
            <td class="text-red-400">{{ p.absentDeduction ? '-$' + (p.absentDeduction | number:'1.0-0') : '—' }}</td>
            <td class="text-indigo-300 font-semibold">\${{ p.grossSalary | number:'1.0-0' }}</td>
            <td class="text-emerald-400 font-bold">\${{ p.netSalary | number:'1.2-2' }}</td>
            <td>
              <span class="badge" [ngClass]="p.status === 'Paid' ? 'badge-success' : 'badge-warning'">
                {{ p.status }}
              </span>
            </td>
            <td>
              <div class="action-btn-group">
                <button class="btn btn-sm btn-success" *ngIf="p.status !== 'Paid'" (click)="markPaid(p.id)">
                  Mark Paid
                </button>
                <a class="btn btn-sm btn-secondary" [href]="'https://localhost:7001/api/payroll/' + p.id + '/payslip'" target="_blank">
                  📄 Payslip
                </a>
              </div>
            </td>
          </tr>

          <tr *ngIf="payrollRecords().length === 0">
            <td colspan="12" class="text-center py-8 text-gray-400">
              No payroll processed for this period yet. Click "Generate Payroll" above to compute salaries.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <app-pagination
      [page]="page()"
      [pageSize]="pageSize()"
      [totalCount]="totalCount()"
      (pageChange)="onPageChange($event)"
      (pageSizeChange)="onPageSizeChange($event)"
    />

    <!-- Department-wise Payroll Cost -->
    <div class="erp-card p-3 mt-3" *ngIf="payrollRecords().length > 0 && deptCosts().length > 0">
      <h5 class="h6 mb-3">🏢 Department-wise Payroll Cost — {{ currentMonth }}/{{ currentYear }}</h5>
      <table class="erp-table">
        <thead>
          <tr>
            <th>Department</th>
            <th class="text-center">Employees</th>
            <th class="text-end">Total Gross</th>
            <th class="text-end">Total Net</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let d of deptCosts()">
            <td class="font-semibold"><span class="badge badge-info">{{ d.dept }}</span></td>
            <td class="text-center">{{ d.count }}</td>
            <td class="text-end">\${{ d.gross | number:'1.0-0' }}</td>
            <td class="text-end text-emerald-400 font-bold">\${{ d.net | number:'1.0-0' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .page-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .action-btn-group {
      display: flex;
      gap: 6px;
    }

    .text-indigo-300 { color: #e0e0e0; }
    .text-emerald-400 { color: #34d399; }
    .text-sm { font-size: 13px; }
    .text-gray-400 { color: var(--text-secondary); }
    .text-center { text-align: center; }
    .py-8 { padding-top: 32px; padding-bottom: 32px; }
  `]
})
export class PayrollComponent implements OnInit {
  private api = inject(ApiService);
  payrollRecords = signal<PayrollRecord[]>([]);

  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();
  employees = signal<Employee[]>([]);

  page = signal(1);
  pageSize = signal(25);
  totalCount = signal(0);

  ngOnInit(): void {
    this.loadPayroll();
    this.api.getEmployees(1, 200).subscribe({
      next: (res) => { if (res?.items) this.employees.set(res.items); }
    });
  }

  deptCosts(): { dept: string; count: number; gross: number; net: number }[] {
    const map = new Map<string, { count: number; gross: number; net: number }>();
    for (const p of this.payrollRecords()) {
      const emp = this.employees().find(e => e.id === p.employeeId);
      const dept = emp?.departmentName || 'Unknown';
      const cur = map.get(dept) || { count: 0, gross: 0, net: 0 };
      cur.count++;
      cur.gross += p.grossSalary ?? 0;
      cur.net += p.netSalary ?? 0;
      map.set(dept, cur);
    }
    return Array.from(map.entries()).map(([dept, v]) => ({ dept, ...v })).sort((a, b) => b.net - a.net);
  }

  loadPayroll(): void {
    this.api.getPayroll(this.currentMonth, this.currentYear, this.page(), this.pageSize()).subscribe({
      next: (res) => {
        if (res?.items) this.payrollRecords.set(res.items);
        if (res?.totalCount !== undefined) this.totalCount.set(res.totalCount);
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadPayroll();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.page.set(1);
    this.loadPayroll();
  }

  generateMonthlyPayroll(): void {
    this.api.generatePayroll(this.currentMonth, this.currentYear).subscribe({
      next: () => this.loadPayroll()
    });
  }

  markPaid(id: string): void {
    this.api.markPayrollPaid(id).subscribe({
      next: () => this.loadPayroll()
    });
  }
}
