import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PayrollRecord } from '../../core/models/erp.models';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
            <th>Basic Salary</th>
            <th>Gross Salary</th>
            <th>Net Salary</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of payrollRecords()">
            <td class="font-semibold">{{ p.employeeName }}</td>
            <td><span class="badge badge-info">{{ p.month }}/{{ p.year }}</span></td>
            <td>\${{ p.basicSalary | number:'1.2-2' }}</td>
            <td class="text-indigo-300 font-semibold">\${{ p.grossSalary | number:'1.2-2' }}</td>
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
            <td colspan="7" class="text-center py-8 text-gray-400">
              No payroll processed for this period yet. Click "Generate Payroll" above to compute salaries.
            </td>
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

  ngOnInit(): void {
    this.loadPayroll();
  }

  loadPayroll(): void {
    this.api.getPayroll(this.currentMonth, this.currentYear, 1, 50).subscribe({
      next: (res) => {
        if (res?.items) this.payrollRecords.set(res.items);
      }
    });
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
