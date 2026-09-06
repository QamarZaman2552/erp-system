import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Expense, FinanceTransaction, Budget } from '../../core/models/erp.models';
import { PaginationComponent } from '../../shared/components/pagination.component';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="h3 mb-1"><i class="bi bi-wallet2 me-2 text-primary"></i>Finance &amp; Budget</h2>
        <p class="text-secondary small mb-0">Ledger, expense claims, budgets with alerts, reports &amp; exports</p>
      </div>
      <div class="d-flex gap-2">
        <div class="btn-group">
          <button class="btn btn-outline-secondary" [class.active]="tab === 'expenses'" (click)="switchTab('expenses')">
            <i class="bi bi-receipt me-1"></i> Expenses
          </button>
          <button class="btn btn-outline-secondary" [class.active]="tab === 'transactions'" (click)="switchTab('transactions')">
            <i class="bi bi-journal-text me-1"></i> Transactions
          </button>
          <button class="btn btn-outline-secondary" [class.active]="tab === 'budgets'" (click)="switchTab('budgets')">
            <i class="bi bi-pie-chart me-1"></i> Budgets
          </button>
          <button class="btn btn-outline-secondary" [class.active]="tab === 'reports'" (click)="switchTab('reports')">
            <i class="bi bi-file-earmark-bar-graph me-1"></i> Reports
          </button>
        </div>
        <button class="btn btn-primary" (click)="showExpenseModal.set(true)" *ngIf="tab === 'expenses'">
          <i class="bi bi-plus-lg me-1"></i> Submit Expense
        </button>
      </div>
    </div>

    <div *ngIf="flash()" class="alert py-2 small" [ngClass]="flashError() ? 'alert-danger' : 'alert-success'">{{ flash() }}</div>

    <!-- KPI Cards -->
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm p-3">
          <div class="small text-secondary">Total Income</div>
          <div class="h4 mb-0 text-success">\${{ summary()?.totalIncome | number:'1.2-2' }}</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm p-3">
          <div class="small text-secondary">Total Expense</div>
          <div class="h4 mb-0 text-danger">\${{ summary()?.totalExpense | number:'1.2-2' }}</div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm p-3">
          <div class="small text-secondary">Net Profit / (Loss)</div>
          <div class="h4 mb-0" [ngClass]="(summary()?.netProfit || 0) >= 0 ? 'text-success' : 'text-danger'">
            \${{ summary()?.netProfit | number:'1.2-2' }}
          </div>
        </div>
      </div>
    </div>

    <!-- Expenses View -->
    <div *ngIf="tab === 'expenses'">
      <div class="card border-0 shadow-sm">
        <div class="table-responsive">
          <table class="table table-dark table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Expense Item</th><th>Category</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let exp of expenses()">
                <td class="fw-semibold">{{ exp.title }}</td>
                <td><span class="badge bg-secondary">{{ exp.category }}</span></td>
                <td class="fw-bold text-danger">\${{ exp.amount | number:'1.2-2' }}</td>
                <td>{{ exp.expenseDate | date:'mediumDate' }}</td>
                <td><span class="badge" [ngClass]="getExpenseBadge(exp.status)">{{ exp.status }}</span></td>
                <td>
                  <div class="btn-group btn-group-sm" *ngIf="exp.status === 'Pending' && canApprove()">
                    <button class="btn btn-outline-success py-0 px-2" (click)="approveExpense(exp.id, true)">Approve</button>
                    <button class="btn btn-outline-danger py-0 px-2" (click)="rejectExpense(exp)">Reject</button>
                  </div>
                  <span class="text-secondary small" *ngIf="exp.status !== 'Pending'">Reviewed</span>
                </td>
              </tr>
              <tr *ngIf="expenses().length === 0">
                <td colspan="6" class="text-center py-5 text-secondary">No expense claims found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <app-pagination [page]="page()" [pageSize]="pageSize()" [totalCount]="totalCount()" (pageChange)="onPageChange($event)" (pageSizeChange)="onPageSizeChange($event)"></app-pagination>

    <!-- Transactions View -->
    <div *ngIf="tab === 'transactions'">
      <div class="card border-0 shadow-sm p-3 mb-3">
        <div class="row g-2 align-items-end">
          <div class="col-md-3">
            <label class="form-label small mb-1">From</label>
            <input type="date" [(ngModel)]="txFilter.from" (change)="loadTransactions()" class="form-control form-control-sm" />
          </div>
          <div class="col-md-3">
            <label class="form-label small mb-1">To</label>
            <input type="date" [(ngModel)]="txFilter.to" (change)="loadTransactions()" class="form-control form-control-sm" />
          </div>
          <div class="col-md-3">
            <label class="form-label small mb-1">Type</label>
            <select [(ngModel)]="txFilter.type" (change)="loadTransactions()" class="form-select form-select-sm">
              <option value="">All</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <div class="col-md-3 text-end">
            <a class="btn btn-outline-success btn-sm" [href]="api.transactionsCsvUrl(txFilter.from || undefined, txFilter.to || undefined)">
              <i class="bi bi-filetype-csv me-1"></i> Export CSV (Excel)
            </a>
          </div>
        </div>
      </div>
      <div class="card border-0 shadow-sm">
        <div class="table-responsive">
          <table class="table table-dark table-hover align-middle mb-0">
            <thead><tr><th>Description</th><th>Category</th><th>Type</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>
              <tr *ngFor="let tx of transactions()">
                <td class="fw-semibold">{{ tx.description }}</td>
                <td><span class="badge bg-secondary">{{ tx.categoryName }}</span></td>
                <td><span class="badge" [ngClass]="tx.type === 'Income' ? 'bg-success' : 'bg-danger'">{{ tx.type }}</span></td>
                <td class="fw-bold" [ngClass]="tx.type === 'Income' ? 'text-success' : 'text-danger'">
                  {{ tx.type === 'Income' ? '+' : '-' }}\${{ tx.amount | number:'1.2-2' }}
                </td>
                <td>{{ tx.transactionDate | date:'mediumDate' }}</td>
              </tr>
              <tr *ngIf="transactions().length === 0"><td colspan="5" class="text-center py-5 text-secondary">No transactions in range.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <app-pagination [page]="page()" [pageSize]="pageSize()" [totalCount]="totalCount()" (pageChange)="onPageChange($event)" (pageSizeChange)="onPageSizeChange($event)"></app-pagination>

    <!-- Budgets View -->
    <div *ngIf="tab === 'budgets'">
      <div *ngIf="alerts().length > 0" class="mb-4">
        <h6 class="text-warning"><i class="bi bi-exclamation-triangle me-2"></i>Budget Alerts (≥80% used)</h6>
        <div class="alert alert-warning py-2 small" *ngFor="let a of alerts()">
          <strong>{{ a.department }}</strong> — "{{ a.name }}": \${{ a.spentAmount | number:'1.0-0' }} of \${{ a.allocatedAmount | number:'1.0-0' }}
          (<span [ngClass]="a.alertLevel === 'Exceeded' ? 'text-danger fw-bold' : ''">{{ a.alertLevel }}</span>, {{ a.percentUsed | number:'1.0-0' }}%)
        </div>
      </div>
      <div class="row g-3">
        <div class="col-md-4" *ngFor="let b of budgets()">
          <div class="card p-3 h-100">
            <h5 class="h6 mb-2">{{ b.name }} ({{ b.department }})</h5>
            <div class="d-flex justify-content-between small text-secondary mb-1">
              <span>Spent: \${{ b.spentAmount | number:'1.0-0' }}</span>
              <span>Allocated: \${{ b.allocatedAmount | number:'1.0-0' }}</span>
            </div>
            <div class="progress mb-2" style="height: 6px;">
              <div class="progress-bar" [ngClass]="budgetBarClass(b)" [style.width.%]="budgetPct(b)"></div>
            </div>
            <div class="small fw-bold" [ngClass]="b.remaining < 0 ? 'text-danger' : 'text-success'">
              Remaining: \${{ b.remaining | number:'1.2-2' }}
            </div>
          </div>
        </div>
        <div class="col-12" *ngIf="budgets().length === 0">
          <div class="card p-4 text-center text-secondary">No budgets set for this month.</div>
        </div>
      </div>
    </div>

    <!-- Reports View -->
    <div *ngIf="tab === 'reports'">
      <div class="card border-0 shadow-sm p-3 mb-4">
        <div class="row g-2 align-items-end">
          <div class="col-md-3">
            <label class="form-label small mb-1">Year</label>
            <input type="number" [(ngModel)]="reportYear" class="form-control form-control-sm" />
          </div>
          <div class="col-md-6 d-flex gap-2">
            <a class="btn btn-outline-danger btn-sm" [href]="api.financeReportPdfUrl(reportYear)">
              <i class="bi bi-file-earmark-pdf me-1"></i> Annual PDF
            </a>
            <a class="btn btn-outline-danger btn-sm" [href]="api.financeReportPdfUrl(reportYear, currentQuarter)">
              <i class="bi bi-file-earmark-pdf me-1"></i> Q{{ currentQuarter }} PDF
            </a>
            <a class="btn btn-outline-danger btn-sm" [href]="api.financeReportPdfUrl(reportYear, undefined, currentMonth)">
              <i class="bi bi-file-earmark-pdf me-1"></i> This Month PDF
            </a>
            <a class="btn btn-outline-success btn-sm" [href]="api.transactionsCsvUrl()">
              <i class="bi bi-filetype-csv me-1"></i> All Txns CSV
            </a>
          </div>
        </div>
      </div>

      <!-- Monthly Income vs Expense -->
      <div class="row g-4">
        <div class="col-lg-7">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-body">
              <h6 class="mb-3"><i class="bi bi-graph-up me-2 text-primary"></i>Monthly Income vs Expense {{ reportYear }}</h6>
              <table class="table table-sm table-dark mb-0">
                <thead><tr><th>Month</th><th>Income</th><th>Expense</th><th>Net</th></tr></thead>
                <tbody>
                  <tr *ngFor="let m of summary()?.monthly || []">
                    <td>{{ m.month }}</td>
                    <td class="text-success">\${{ m.income | number:'1.0-0' }}</td>
                    <td class="text-danger">\${{ m.expense | number:'1.0-0' }}</td>
                    <td [ngClass]="(m.income - m.expense) >= 0 ? 'text-success fw-bold' : 'text-danger fw-bold'">\${{ m.income - m.expense | number:'1.0-0' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="col-lg-5">
          <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
              <h6 class="mb-3"><i class="bi bi-building me-2 text-primary"></i>Department-wise Expenses</h6>
              <table class="table table-sm table-dark mb-0">
                <thead><tr><th>Department</th><th>Claims</th><th>Amount</th></tr></thead>
                <tbody>
                  <tr *ngFor="let d of deptReport()"><td>{{ d.department }}</td><td>{{ d.count }}</td><td class="text-danger">\${{ d.amount | number:'1.0-0' }}</td></tr>
                  <tr *ngIf="deptReport().length === 0"><td colspan="3" class="text-center text-secondary py-2">No data</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="card border-0 shadow-sm">
            <div class="card-body">
              <h6 class="mb-3"><i class="bi bi-tags me-2 text-primary"></i>Category-wise Expenses</h6>
              <table class="table table-sm table-dark mb-0">
                <thead><tr><th>Category</th><th>Claims</th><th>Amount</th></tr></thead>
                <tbody>
                  <tr *ngFor="let c of catReport()"><td>{{ c.category }}</td><td>{{ c.count }}</td><td class="text-danger">\${{ c.amount | number:'1.0-0' }}</td></tr>
                  <tr *ngIf="catReport().length === 0"><td colspan="3" class="text-center text-secondary py-2">No data</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Submit Expense Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="showExpenseModal()">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Submit Expense Claim</h5>
            <button type="button" class="btn-close btn-close-white" (click)="showExpenseModal.set(false)"></button>
          </div>
          <form (ngSubmit)="saveExpense()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label small">Expense Title *</label>
                <input type="text" [(ngModel)]="newExp.title" name="et" required class="form-control" placeholder="e.g. Travel to client site" />
              </div>
              <div class="row g-2 mb-3">
                <div class="col">
                  <label class="form-label small">Amount ($) *</label>
                  <input type="number" [(ngModel)]="newExp.amount" name="ea" required class="form-control" />
                </div>
                <div class="col">
                  <label class="form-label small">Category</label>
                  <select [(ngModel)]="newExp.category" name="ec" class="form-select">
                    <option value="Travel">Travel &amp; Transport</option>
                    <option value="Meals">Meals &amp; Entertainment</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Software">Software &amp; Subscriptions</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label small">Expense Date</label>
                <input type="date" [(ngModel)]="newExp.expenseDate" name="ed" class="form-control" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showExpenseModal.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Submit Claim</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class FinanceComponent implements OnInit {
  api = inject(ApiService);
  private auth = inject(AuthService);

  tab: 'expenses' | 'transactions' | 'budgets' | 'reports' = 'expenses';
  expenses = signal<Expense[]>([]);
  transactions = signal<FinanceTransaction[]>([]);
  budgets = signal<Budget[]>([]);
  alerts = signal<any[]>([]);
  summary = signal<any>(null);
  deptReport = signal<any[]>([]);
  catReport = signal<any[]>([]);
  showExpenseModal = signal(false);
  flashMsg = signal('');
  flashIsError = false;

  page = signal(1);
  pageSize = signal(25);
  totalCount = signal(0);

  reportYear = new Date().getFullYear();
  get currentQuarter(): number { return Math.floor(new Date().getMonth() / 3) + 1; }
  get currentMonth(): number { return new Date().getMonth() + 1; }

  txFilter = { from: '', to: '', type: '' };

  newExp = {
    title: '',
    description: '',
    amount: 150,
    category: 'Travel',
    expenseDate: new Date().toISOString().split('T')[0],
    receiptUrl: null as string | null
  };

  ngOnInit(): void {
    this.loadData();
    this.loadAnalytics();
  }

  loadData(): void {
    this.api.getExpenses(this.page(), this.pageSize()).subscribe({ next: (res) => { if (res?.items) { this.expenses.set(res.items); this.totalCount.set(res.totalCount || 0); } } });
    this.loadTransactions();
    this.loadBudgets();
  }

  loadTransactions(): void {
    this.api.getTransactions(this.page(), this.pageSize(), this.txFilter.from || undefined, this.txFilter.to || undefined, this.txFilter.type || undefined)
      .subscribe({ next: (res) => { if (res?.items) { this.transactions.set(res.items); this.totalCount.set(res.totalCount || 0); } } });
  }

  loadBudgets(): void {
    const m = new Date().getMonth() + 1;
    const y = new Date().getFullYear();
    this.api.getBudgets(m, y).subscribe({ next: (res) => { if (res) this.budgets.set(res); } });
    this.api.budgetAlerts(m, y).subscribe({ next: (res) => this.alerts.set(res || []) });
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    if (this.tab === 'expenses') {
      this.loadData();
    } else if (this.tab === 'transactions') {
      this.loadTransactions();
    }
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.page.set(1);
    if (this.tab === 'expenses') {
      this.loadData();
    } else if (this.tab === 'transactions') {
      this.loadTransactions();
    }
  }

  loadAnalytics(): void {
    this.api.getFinanceSummary().subscribe({ next: (res) => this.summary.set(res) });
    this.deptExpenseReport().subscribe({ next: (r) => this.deptReport.set(r || []) });
    this.categoryExpenseReport().subscribe({ next: (r) => this.catReport.set(r || []) });
  }

  switchTab(t: 'expenses' | 'transactions' | 'budgets' | 'reports'): void {
    this.tab = t;
    if (t === 'reports') this.loadAnalytics();
  }

  saveExpense(): void {
    this.api.createExpense(this.newExp).subscribe({
      next: () => {
        this.showExpenseModal.set(false);
        this.notify('Expense claim submitted for approval');
        this.loadData();
      }
    });
  }

  approveExpense(id: string, isApproved: boolean): void {
    this.api.approveExpense(id, isApproved).subscribe({
      next: (res: any) => {
        this.notify(res?.message || 'Approved');
        this.loadData();
        this.loadAnalytics();
      },
      error: () => this.notify('Approve failed', true)
    });
  }

  rejectExpense(exp: Expense): void {
    const reason = prompt('Rejection reason:');
    if (reason === null) return;
    this.api.approveExpense(exp.id, false, reason).subscribe({
      next: () => {
        this.notify(`Rejected: ${reason}`);
        this.loadData();
      }
    });
  }

  canApprove(): boolean {
    return this.auth.hasRole(['Admin', 'Manager']);
  }

  budgetPct(b: Budget): number {
    return b.allocatedAmount > 0 ? Math.min(100, (b.spentAmount / b.allocatedAmount) * 100) : 0;
  }

  budgetBarClass(b: Budget): string {
    const pct = b.allocatedAmount > 0 ? (b.spentAmount / b.allocatedAmount) * 100 : 0;
    if (pct >= 100) return 'bg-danger';
    if (pct >= 80) return 'bg-warning';
    return 'bg-info';
  }

  private notify(msg: string, isError = false): void {
    this.flashIsError = isError;
    this.flashMsg.set(msg);
    setTimeout(() => this.flashMsg.set(''), 5000);
  }

  flash(): string { return this.flashMsg(); }
  flashError(): boolean { return this.flashIsError; }

  deptExpenseReport(from?: string, to?: string) { return this.api.deptExpenseReport(from, to); }
  categoryExpenseReport(from?: string, to?: string) { return this.api.categoryExpenseReport(from, to); }

  getExpenseBadge(status: string): string {
    switch (status) {
      case 'Approved': return 'bg-success';
      case 'Pending': return 'bg-warning';
      case 'Rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
}
