import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Expense, FinanceTransaction, Budget } from '../../core/models/erp.models';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="h3 mb-1"><i class="bi bi-wallet2 me-2 text-primary"></i>Finance &amp; Budget</h2>
        <p class="text-secondary small mb-0">General ledger transactions, employee expense claims, and departmental budgets</p>
      </div>
      <div class="d-flex gap-2">
        <div class="btn-group">
          <button class="btn btn-outline-secondary" [class.active]="tab === 'expenses'" (click)="tab = 'expenses'">
            <i class="bi bi-receipt me-1"></i> Expenses
          </button>
          <button class="btn btn-outline-secondary" [class.active]="tab === 'transactions'" (click)="tab = 'transactions'">
            <i class="bi bi-journal-text me-1"></i> Transactions
          </button>
          <button class="btn btn-outline-secondary" [class.active]="tab === 'budgets'" (click)="tab = 'budgets'">
            <i class="bi bi-pie-chart me-1"></i> Budgets
          </button>
        </div>
        <button class="btn btn-primary" (click)="showExpenseModal.set(true)" *ngIf="tab === 'expenses'">
          <i class="bi bi-plus-lg me-1"></i> Submit Expense
        </button>
      </div>
    </div>

    <!-- Expenses View -->
    <div *ngIf="tab === 'expenses'">
      <div class="card border-0 shadow-sm">
        <div class="table-responsive">
          <table class="table table-dark table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Expense Item</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let exp of expenses()">
                <td class="fw-semibold">{{ exp.title }}</td>
                <td><span class="badge bg-secondary">{{ exp.category }}</span></td>
                <td class="fw-bold text-danger">\${{ exp.amount | number:'1.2-2' }}</td>
                <td>{{ exp.expenseDate | date:'mediumDate' }}</td>
                <td>
                  <span class="badge" [ngClass]="getExpenseBadge(exp.status)">
                    {{ exp.status }}
                  </span>
                </td>
                <td>
                  <div class="btn-group btn-group-sm" *ngIf="exp.status === 'Pending' && canApprove()">
                    <button class="btn btn-outline-success py-0 px-2" (click)="approveExpense(exp.id, true)">Approve</button>
                    <button class="btn btn-outline-danger py-0 px-2" (click)="approveExpense(exp.id, false)">Reject</button>
                  </div>
                  <span class="text-secondary small" *ngIf="exp.status !== 'Pending'">Reviewed</span>
                </td>
              </tr>
              <tr *ngIf="expenses().length === 0">
                <td colspan="6" class="text-center py-5 text-secondary">
                  No expense claims found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Transactions View -->
    <div *ngIf="tab === 'transactions'">
      <div class="card border-0 shadow-sm">
        <div class="table-responsive">
          <table class="table table-dark table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let tx of transactions()">
                <td class="fw-semibold">{{ tx.description }}</td>
                <td><span class="badge bg-secondary">{{ tx.categoryName }}</span></td>
                <td>
                  <span class="badge" [ngClass]="tx.type === 'Income' ? 'bg-success' : 'bg-danger'">
                    {{ tx.type }}
                  </span>
                </td>
                <td class="fw-bold" [ngClass]="tx.type === 'Income' ? 'text-success' : 'text-danger'">
                  {{ tx.type === 'Income' ? '+' : '-' }}\${{ tx.amount | number:'1.2-2' }}
                </td>
                <td>{{ tx.transactionDate | date:'mediumDate' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Budgets View -->
    <div *ngIf="tab === 'budgets'">
      <div class="row g-3">
        <div class="col-md-4" *ngFor="let b of budgets()">
          <div class="card p-3 h-100">
            <h5 class="h6 mb-2">{{ b.name }} ({{ b.department }})</h5>
            <div class="d-flex justify-content-between small text-secondary mb-1">
              <span>Spent: \${{ b.spentAmount | number:'1.0-0' }}</span>
              <span>Allocated: \${{ b.allocatedAmount | number:'1.0-0' }}</span>
            </div>
            <div class="progress mb-2" style="height: 6px;">
              <div class="progress-bar bg-info" [style.width.%]="(b.spentAmount / b.allocatedAmount) * 100"></div>
            </div>
            <div class="small fw-bold text-success">
              Remaining: \${{ b.remaining | number:'1.2-2' }}
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
                    <option value="Office">Office Equipment</option>
                    <option value="Software">Software &amp; Subscriptions</option>
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
  private api = inject(ApiService);
  private auth = inject(AuthService);

  tab: 'expenses' | 'transactions' | 'budgets' = 'expenses';
  expenses = signal<Expense[]>([]);
  transactions = signal<FinanceTransaction[]>([]);
  budgets = signal<Budget[]>([]);
  showExpenseModal = signal(false);

  newExp = {
    title: '',
    description: '',
    amount: 150,
    category: 'Travel',
    expenseDate: new Date().toISOString().split('T')[0],
    receiptUrl: null
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.getExpenses(1, 50).subscribe({
      next: (res) => { if (res?.items) this.expenses.set(res.items); }
    });
    this.api.getTransactions(1, 50).subscribe({
      next: (res) => { if (res?.items) this.transactions.set(res.items); }
    });
    this.api.getBudgets(new Date().getMonth() + 1, new Date().getFullYear()).subscribe({
      next: (res) => { if (res) this.budgets.set(res); }
    });
  }

  saveExpense(): void {
    this.api.createExpense(this.newExp).subscribe({
      next: () => {
        this.showExpenseModal.set(false);
        this.loadData();
      }
    });
  }

  approveExpense(id: string, isApproved: boolean): void {
    this.api.approveExpense(id, isApproved).subscribe({
      next: () => this.loadData()
    });
  }

  canApprove(): boolean {
    return this.auth.hasRole(['Admin', 'Manager']);
  }

  getExpenseBadge(status: string): string {
    switch (status) {
      case 'Approved': return 'bg-success';
      case 'Pending': return 'bg-warning';
      case 'Rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
}
