import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SalesOrder, Customer, Product, OrderPayment } from '../../core/models/erp.models';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="h3 mb-1"><i class="bi bi-cart3 me-2 text-primary"></i>Sales &amp; Invoices</h2>
        <p class="text-secondary small mb-0">Order lifecycle, invoices (PDF/email), payments, returns &amp; reports</p>
      </div>
      <div class="btn-group">
        <button class="btn btn-outline-warning" (click)="sendReminders()" title="Email overdue customers">
          <i class="bi bi-bell me-1"></i> Overdue Reminders
        </button>
        <button class="btn btn-primary" (click)="openCreate()">
          <i class="bi bi-receipt me-1"></i> New Sales Order
        </button>
      </div>
    </div>

    <div *ngIf="flash()" class="alert alert-success py-2 small">{{ flash() }}</div>

    <!-- Sales Order Table -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="table-responsive">
        <table class="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Due</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Payment</th>
              <th>Status</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of orders()">
              <td><span class="font-monospace text-primary fw-bold">{{ order.orderNumber }}</span></td>
              <td class="fw-semibold">{{ order.customerName }}</td>
              <td>{{ order.orderDate | date:'mediumDate' }}</td>
              <td>{{ order.dueDate | date:'mediumDate' }}</td>
              <td class="fw-bold text-success">\${{ order.totalAmount | number:'1.2-2' }}</td>
              <td>\${{ order.paidAmount | number:'1.2-2' }}</td>
              <td><span class="badge" [ngClass]="paymentBadge(order.paymentStatus)">{{ order.paymentStatus }}</span></td>
              <td><span class="badge bg-secondary">{{ order.status }}</span></td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <button *ngIf="order.status === 'Pending' || order.status === 'Draft'" class="btn btn-outline-success" (click)="confirm(order)" title="Confirm & deduct stock">
                    <i class="bi bi-check2-circle"></i>
                  </button>
                  <button
                    *ngIf="order.paymentStatus !== 'Paid' && order.paymentStatus !== 'Refunded' && order.status !== 'Cancelled' && order.status !== 'Returned'"
                    class="btn btn-outline-info" (click)="openPayment(order)" title="Record payment">
                    <i class="bi bi-cash-coin"></i>
                  </button>
                  <a class="btn btn-outline-light" [href]="api.invoicePdfUrl(order.id)" target="_blank" title="Download invoice PDF">
                    <i class="bi bi-file-earmark-pdf"></i>
                  </a>
                  <button class="btn btn-outline-secondary" (click)="emailInvoice(order)" title="Email invoice to customer">
                    <i class="bi bi-envelope"></i>
                  </button>
                  <button
                    *ngIf="order.status === 'Confirmed' || order.status === 'Shipped' || order.status === 'Delivered'"
                    class="btn btn-outline-danger" (click)="returnOrder(order)" title="Sales return / refund">
                    <i class="bi bi-arrow-counterclockwise"></i>
                  </button>
                  <button
                    *ngIf="order.status === 'Pending' || order.status === 'Confirmed'"
                    class="btn btn-outline-dark" (click)="cancel(order)" title="Cancel order">
                    <i class="bi bi-x-circle"></i>
                  </button>
                  <button class="btn btn-outline-primary" (click)="viewPayments(order)" title="Payment history">
                    <i class="bi bi-list-ul"></i>
                  </button>
                </div>
              </td>
            </tr>

            <tr *ngIf="orders().length === 0">
              <td colspan="9" class="text-center py-5 text-secondary">
                No sales orders yet. Click "New Sales Order" to create one.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Reports -->
    <div class="row g-4 mb-4">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h6 class="mb-0"><i class="bi bi-graph-up me-2 text-primary"></i>Monthly Sales {{ reportYear }}</h6>
            </div>
            <table class="table table-sm table-dark mb-0">
              <thead><tr><th>Month</th><th>Orders</th><th>Total</th><th>Paid</th></tr></thead>
              <tbody>
                <tr *ngFor="let m of monthlyReport()">
                  <td>{{ monthName(m.month) }}</td>
                  <td>{{ m.orderCount }}</td>
                  <td class="text-success">\${{ m.total | number:'1.0-0' }}</td>
                  <td>\${{ m.paid | number:'1.0-0' }}</td>
                </tr>
                <tr *ngIf="monthlyReport().length === 0"><td colspan="4" class="text-center text-secondary py-3">No sales this year</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h6 class="mb-3"><i class="bi bi-people me-2 text-primary"></i>Customer-wise Sales</h6>
            <table class="table table-sm table-dark mb-0">
              <thead><tr><th>Customer</th><th>Orders</th><th>Total</th></tr></thead>
              <tbody>
                <tr *ngFor="let c of customerReport()">
                  <td>{{ c.customerName }}</td>
                  <td>{{ c.orderCount }}</td>
                  <td class="text-success">\${{ c.totalAmount | number:'1.0-0' }}</td>
                </tr>
                <tr *ngIf="customerReport().length === 0"><td colspan="3" class="text-center text-secondary py-3">No data</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h6 class="mb-3"><i class="bi bi-box-seam me-2 text-primary"></i>Top Products</h6>
            <table class="table table-sm table-dark mb-0">
              <thead><tr><th>Product</th><th>Qty</th><th>Revenue</th></tr></thead>
              <tbody>
                <tr *ngFor="let p of productReport()">
                  <td>{{ p.productName }}</td>
                  <td>{{ p.quantitySold }}</td>
                  <td class="text-success">\${{ p.revenue | number:'1.0-0' }}</td>
                </tr>
                <tr *ngIf="productReport().length === 0"><td colspan="3" class="text-center text-secondary py-3">No data</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="showModal()">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create Sales Order / Invoice</h5>
            <button type="button" class="btn-close btn-close-white" (click)="showModal.set(false)"></button>
          </div>
          <form (ngSubmit)="saveOrder()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label small">Customer *</label>
                <select [(ngModel)]="newOrder.customerId" name="oc" required class="form-select">
                  <option *ngFor="let c of customers()" [value]="c.id">{{ c.name }} ({{ c.company }})</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label small">Product *</label>
                <select [(ngModel)]="selectedProductId" name="op" class="form-select">
                  <option *ngFor="let p of products()" [value]="p.id">{{ p.name }} — \${{ p.sellingPrice }} (stock: {{ p.currentStock }})</option>
                </select>
              </div>
              <div class="row g-2 mb-3">
                <div class="col">
                  <label class="form-label small">Quantity</label>
                  <input type="number" min="1" [(ngModel)]="quantity" name="oq" class="form-control" />
                </div>
                <div class="col">
                  <label class="form-label small">Unit Discount ($)</label>
                  <input type="number" min="0" [(ngModel)]="discount" name="odisc" class="form-control" />
                </div>
              </div>
              <div class="row g-2 mb-3">
                <div class="col">
                  <label class="form-label small">Order Date</label>
                  <input type="date" [(ngModel)]="newOrder.orderDate" name="odate" class="form-control" />
                </div>
                <div class="col">
                  <label class="form-label small">Payment Due Date</label>
                  <input type="date" [(ngModel)]="newOrder.dueDate" name="odue" class="form-control" />
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label small">Notes</label>
                <input type="text" [(ngModel)]="newOrder.notes" name="onotes" placeholder="Delivery specifications" class="form-control" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showModal.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Generate Invoice</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="payOrder()">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title small">Payment — {{ payOrder()?.orderNumber }}</h5>
            <button type="button" class="btn-close btn-close-white" (click)="payOrder.set(null)"></button>
          </div>
          <form (ngSubmit)="savePayment()">
            <div class="modal-body">
              <p class="small text-secondary mb-2">
                Total: <strong>\${{ payOrder()?.totalAmount | number:'1.2-2' }}</strong> ·
                Paid: \${{ payOrder()?.paidAmount | number:'1.2-2' }} ·
                Remaining: <strong>\${{ remaining() | number:'1.2-2' }}</strong>
              </p>
              <div class="mb-2">
                <label class="form-label small">Amount *</label>
                <input type="number" [(ngModel)]="payment.amount" name="pa" class="form-control" max="{{ remaining() }}" step="0.01" required />
              </div>
              <div class="mb-2">
                <label class="form-label small">Method</label>
                <select [(ngModel)]="payment.method" name="pm" class="form-select">
                  <option value="Cash">Cash</option>
                  <option value="BankTransfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div class="mb-2">
                <label class="form-label small">Reference</label>
                <input type="text" [(ngModel)]="payment.reference" name="pr" class="form-control" placeholder="Receipt # / cheque #" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="payOrder.set(null)">Close</button>
              <button type="submit" class="btn btn-info">Save Payment</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Payment History Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="historyOrder()">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title small">Payments — {{ historyOrder()?.orderNumber }}</h5>
            <button type="button" class="btn-close btn-close-white" (click)="historyOrder.set(null)"></button>
          </div>
          <div class="modal-body">
            <table class="table table-sm table-dark mb-0">
              <thead><tr><th>Date</th><th>Method</th><th>Ref</th><th>Amount</th></tr></thead>
              <tbody>
                <tr *ngFor="let p of payments()">
                  <td>{{ p.paidAt | date:'shortDate' }}</td>
                  <td>{{ p.method }}</td>
                  <td>{{ p.reference || '-' }}</td>
                  <td class="text-success">\${{ p.amount | number:'1.2-2' }}</td>
                </tr>
                <tr *ngIf="payments().length === 0"><td colspan="4" class="text-center text-secondary py-3">No payments recorded</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SalesComponent implements OnInit {
  api = inject(ApiService);
  private auth = inject(AuthService);

  orders = signal<SalesOrder[]>([]);
  customers = signal<Customer[]>([]);
  products = signal<Product[]>([]);
  payments = signal<OrderPayment[]>([]);
  monthlyReport = signal<any[]>([]);
  customerReport = signal<any[]>([]);
  productReport = signal<any[]>([]);

  showModal = signal(false);
  payOrder = signal<SalesOrder | null>(null);
  historyOrder = signal<SalesOrder | null>(null);
  flash = signal('');

  selectedProductId = '';
  quantity = 1;
  discount = 0;
  reportYear = new Date().getFullYear();
  canManage = false;

  payment = { amount: 0, method: 'Cash', reference: '' };

  newOrder = {
    customerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0],
    deliveryDate: null as string | null,
    notes: '',
    items: [] as any[]
  };

  ngOnInit(): void {
    this.canManage = this.auth.hasRole(['Admin', 'Manager']);
    this.loadOrders();
    this.loadMetadata();
    this.loadReports();
  }

  loadOrders(): void {
    this.api.getSalesOrders(1, 50).subscribe({
      next: (res) => { if (res?.items) this.orders.set(res.items); }
    });
  }

  loadMetadata(): void {
    this.api.getCustomers(1, 50).subscribe({
      next: (res) => {
        if (res?.items) {
          this.customers.set(res.items);
          if (res.items.length > 0 && !this.newOrder.customerId) this.newOrder.customerId = res.items[0].id;
        }
      }
    });
    this.api.getProducts(1, 50).subscribe({
      next: (res) => {
        if (res?.items) {
          this.products.set(res.items);
          if (res.items.length > 0 && !this.selectedProductId) this.selectedProductId = res.items[0].id;
        }
      }
    });
  }

  loadReports(): void {
    this.api.salesMonthlyReport(this.reportYear).subscribe({ next: (r) => this.monthlyReport.set(r || []) });
    this.api.salesCustomerReport().subscribe({ next: (r) => this.customerReport.set(r || []) });
    this.api.salesProductReport().subscribe({ next: (r) => this.productReport.set(r || []) });
  }

  openCreate(): void {
    this.newOrder.orderDate = new Date().toISOString().split('T')[0];
    this.newOrder.dueDate = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0];
    this.quantity = 1;
    this.discount = 0;
    this.showModal.set(true);
  }

  saveOrder(): void {
    const prod = this.products().find(p => p.id === this.selectedProductId);
    const payload = {
      ...this.newOrder,
      items: [{
        productId: this.selectedProductId,
        quantity: this.quantity,
        unitPrice: prod ? prod.sellingPrice : 100,
        discount: this.discount
      }]
    };
    this.api.createSalesOrder(payload).subscribe({
      next: () => {
        this.showModal.set(false);
        this.notify('Sales order created');
        this.loadOrders();
        this.loadReports();
      }
    });
  }

  confirm(o: SalesOrder): void {
    this.api.confirmSalesOrder(o.id).subscribe({
      next: (res) => { this.notify(res.message || 'Confirmed'); this.loadOrders(); },
      error: () => this.notify('Confirm failed')
    });
  }

  cancel(o: SalesOrder): void {
    if (!confirm(`Cancel ${o.orderNumber}? Stock will be restored if already deducted.`)) return;
    this.api.cancelSalesOrder(o.id).subscribe({
      next: (res) => { this.notify(res.message || 'Cancelled'); this.loadOrders(); },
      error: () => this.notify('Cancel failed')
    });
  }

  returnOrder(o: SalesOrder): void {
    if (!confirm(`Process full return/refund for ${o.orderNumber}?`)) return;
    this.api.returnSalesOrder(o.id).subscribe({
      next: (res) => { this.notify(res.message || 'Returned'); this.loadOrders(); this.loadReports(); },
      error: () => this.notify('Return failed')
    });
  }

  openPayment(o: SalesOrder): void {
    this.payment = { amount: this.remainingFor(o), method: 'Cash', reference: '' };
    this.payOrder.set(o);
  }

  savePayment(): void {
    const o = this.payOrder();
    if (!o) return;
    this.api.recordSalesPayment(o.id, this.payment).subscribe({
      next: (res) => {
        this.payOrder.set(null);
        this.notify(res.message || 'Payment recorded');
        this.loadOrders();
        this.loadReports();
      },
      error: () => this.notify('Payment failed')
    });
  }

  viewPayments(o: SalesOrder): void {
    this.historyOrder.set(o);
    this.api.getSalesPayments(o.id).subscribe({ next: (list) => this.payments.set(list || []) });
  }

  emailInvoice(o: SalesOrder): void {
    this.api.emailSalesInvoice(o.id).subscribe({
      next: (res) => this.notify(res.message || 'Invoice emailed'),
      error: () => this.notify('Email failed')
    });
  }

  sendReminders(): void {
    if (!this.canManage) return;
    this.api.sendOverdueReminders().subscribe({
      next: (res: any) => this.notify(res?.data || 'Reminders processed'),
      error: () => this.notify('Reminders failed')
    });
  }

  remaining(): number { return this.payOrder() ? this.remainingFor(this.payOrder()!) : 0; }

  private remainingFor(o: SalesOrder): number {
    return Math.max(0, Math.round((o.totalAmount - o.paidAmount) * 100) / 100);
  }

  private notify(msg: string): void {
    this.flash.set(msg);
    setTimeout(() => this.flash.set(''), 4000);
  }

  monthName(m: number): string {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1] || '';
  }

  paymentBadge(status: string): string {
    switch (status) {
      case 'Paid': return 'bg-success';
      case 'Partial': return 'bg-warning';
      case 'Overdue': return 'bg-danger';
      case 'Refunded': return 'bg-info';
      default: return 'bg-secondary';
    }
  }
}
