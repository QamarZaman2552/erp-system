import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { PurchaseOrder, Supplier, Product, OrderPayment } from '../../core/models/erp.models';

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="h3 mb-1"><i class="bi bi-bag-check me-2 text-warning"></i>Purchase Orders</h2>
        <p class="text-secondary small mb-0">Supplier orders, receiving (partial/full → inventory), payments &amp; reports</p>
      </div>
      <button class="btn btn-primary" (click)="openCreate()">
        <i class="bi bi-plus-lg me-1"></i> New Purchase Order
      </button>
    </div>

    <div *ngIf="flash()" class="alert alert-success py-2 small">{{ flash() }}</div>

    <!-- PO Table -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="table-responsive">
        <table class="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Supplier</th>
              <th>Date</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Payment</th>
              <th>Status</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let po of orders()">
              <td><span class="font-monospace text-warning fw-bold">{{ po.orderNumber }}</span></td>
              <td class="fw-semibold">{{ po.supplierName }}</td>
              <td>{{ po.orderDate | date:'mediumDate' }}</td>
              <td class="fw-bold text-success">\${{ po.totalAmount | number:'1.2-2' }}</td>
              <td>\${{ po.paidAmount | number:'1.2-2' }}</td>
              <td><span class="badge" [ngClass]="paymentBadge(po.paymentStatus)">{{ po.paymentStatus }}</span></td>
              <td><span class="badge bg-secondary">{{ po.status }}</span></td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <button *ngIf="po.status === 'Pending' || po.status === 'Draft'" class="btn btn-outline-success" (click)="confirm(po)" title="Confirm">
                    <i class="bi bi-check2-circle"></i>
                  </button>
                  <button *ngIf="po.status === 'Confirmed'" class="btn btn-outline-info" (click)="openReceive(po)" title="Receive items">
                    <i class="bi bi-box-arrow-in-down"></i>
                  </button>
                  <button class="btn btn-outline-secondary" (click)="emailToSupplier(po)" title="Email PO to supplier">
                    <i class="bi bi-envelope"></i>
                  </button>
                  <button
                    *ngIf="po.status !== 'Cancelled' && po.paymentStatus !== 'Paid'"
                    class="btn btn-outline-warning" (click)="openPayment(po)" title="Pay supplier">
                    <i class="bi bi-cash-coin"></i>
                  </button>
                  <button *ngIf="po.status === 'Pending' || po.status === 'Confirmed'" class="btn btn-outline-dark" (click)="cancel(po)" title="Cancel">
                    <i class="bi bi-x-circle"></i>
                  </button>
                  <button class="btn btn-outline-primary" (click)="viewDetail(po)" title="Detail / history">
                    <i class="bi bi-list-ul"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="orders().length === 0">
              <td colspan="8" class="text-center py-5 text-secondary">No purchase orders yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Reports -->
    <div class="row g-4">
      <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h6 class="mb-3"><i class="bi bi-graph-up me-2 text-warning"></i>Monthly Purchases {{ reportYear }}</h6>
            <table class="table table-sm table-dark mb-0">
              <thead><tr><th>Month</th><th>Orders</th><th>Total</th><th>Paid</th></tr></thead>
              <tbody>
                <tr *ngFor="let m of monthlyReport()">
                  <td>{{ monthName(m.month) }}</td>
                  <td>{{ m.orderCount }}</td>
                  <td class="text-success">\${{ m.total | number:'1.0-0' }}</td>
                  <td>\${{ m.paid | number:'1.0-0' }}</td>
                </tr>
                <tr *ngIf="monthlyReport().length === 0"><td colspan="4" class="text-center text-secondary py-3">No purchases this year</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h6 class="mb-3"><i class="bi bi-truck me-2 text-warning"></i>Supplier-wise Purchases</h6>
            <table class="table table-sm table-dark mb-0">
              <thead><tr><th>Supplier</th><th>Orders</th><th>Total</th><th>Paid</th></tr></thead>
              <tbody>
                <tr *ngFor="let s of supplierReport()">
                  <td>{{ s.supplierName }}</td>
                  <td>{{ s.orderCount }}</td>
                  <td class="text-success">\${{ s.totalAmount | number:'1.0-0' }}</td>
                  <td>\${{ s.paidAmount | number:'1.0-0' }}</td>
                </tr>
                <tr *ngIf="supplierReport().length === 0"><td colspan="4" class="text-center text-secondary py-3">No data</td></tr>
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
            <h5 class="modal-title">New Purchase Order</h5>
            <button type="button" class="btn-close btn-close-white" (click)="showModal.set(false)"></button>
          </div>
          <form (ngSubmit)="saveOrder()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label small">Supplier *</label>
                <select [(ngModel)]="newOrder.supplierId" name="ps" required class="form-select">
                  <option *ngFor="let s of suppliers()" [value]="s.id">{{ s.name }} ({{ s.country }})</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label small">Product *</label>
                <select [(ngModel)]="selectedProductId" name="pp" class="form-select">
                  <option *ngFor="let p of products()" [value]="p.id">{{ p.name }} — cost \${{ p.costPrice }} (stock: {{ p.currentStock }})</option>
                </select>
              </div>
              <div class="row g-2 mb-3">
                <div class="col">
                  <label class="form-label small">Quantity</label>
                  <input type="number" min="1" [(ngModel)]="quantity" name="pq" class="form-control" />
                </div>
                <div class="col">
                  <label class="form-label small">Unit Price ($)</label>
                  <input type="number" min="0" [(ngModel)]="unitPrice" name="pup" class="form-control" />
                </div>
              </div>
              <div class="row g-2 mb-3">
                <div class="col">
                  <label class="form-label small">Order Date</label>
                  <input type="date" [(ngModel)]="newOrder.orderDate" name="pod" class="form-control" />
                </div>
                <div class="col">
                  <label class="form-label small">Expected Delivery</label>
                  <input type="date" [(ngModel)]="newOrder.deliveryDate" name="pdd" class="form-control" />
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label small">Notes</label>
                <input type="text" [(ngModel)]="newOrder.notes" name="pn" class="form-control" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showModal.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Order</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Receive Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="receiveOrder()">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title small">Receive Items — {{ receiveOrder()?.orderNumber }}</h5>
            <button type="button" class="btn-close btn-close-white" (click)="receiveOrder.set(null)"></button>
          </div>
          <form (ngSubmit)="saveReceive()">
            <div class="modal-body">
              <p class="small text-secondary">Received stock is added to inventory automatically.</p>
              <div class="mb-2" *ngFor="let line of receiveLines; let i = index">
                <label class="form-label small">{{ line.productName }} (ordered {{ line.quantity }})</label>
                <input type="number" [(ngModel)]="line.receiveQty" [name]="'rq' + i" min="0" [max]="line.quantity - line.receivedQuantity" class="form-control" />
                <small class="text-secondary">already received: {{ line.receivedQuantity }}</small>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="receiveOrder.set(null)">Close</button>
              <button type="submit" class="btn btn-info">Receive</button>
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
            <h5 class="modal-title small">Pay Supplier — {{ payOrder()?.orderNumber }}</h5>
            <button type="button" class="btn-close btn-close-white" (click)="payOrder.set(null)"></button>
          </div>
          <form (ngSubmit)="savePayment()">
            <div class="modal-body">
              <p class="small text-secondary mb-2">
                Total: <strong>\${{ payOrder()?.totalAmount | number:'1.2-2' }}</strong> ·
                Paid: \${{ payOrder()?.paidAmount | number:'1.2-2' }}
              </p>
              <div class="mb-2">
                <label class="form-label small">Amount *</label>
                <input type="number" [(ngModel)]="payment.amount" name="pa" class="form-control" step="0.01" required />
              </div>
              <div class="mb-2">
                <label class="form-label small">Method</label>
                <select [(ngModel)]="payment.method" name="pm" class="form-select">
                  <option value="Cash">Cash</option>
                  <option value="BankTransfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
              <div class="mb-2">
                <label class="form-label small">Reference</label>
                <input type="text" [(ngModel)]="payment.reference" name="pr" class="form-control" placeholder="Cheque # / txn #" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="payOrder.set(null)">Close</button>
              <button type="submit" class="btn btn-warning">Save Payment</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="detail()">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title small">PO Detail — {{ detail()?.orderNumber }}</h5>
            <button type="button" class="btn-close btn-close-white" (click)="detail.set(null)"></button>
          </div>
          <div class="modal-body">
            <p class="small mb-1">Supplier: <strong>{{ detail()?.supplierName }}</strong> · Supplier Invoice #: <strong>{{ detail()?.supplierInvoiceNumber || '-' }}</strong></p>
            <table class="table table-sm table-dark mb-2">
              <thead><tr><th>Product</th><th>Ordered</th><th>Received</th><th>Unit Price</th><th>Total</th></tr></thead>
              <tbody>
                <tr *ngFor="let l of detail()?.items">
                  <td>{{ l.productName }}</td>
                  <td>{{ l.quantity }}</td>
                  <td [ngClass]="l.receivedQuantity >= l.quantity ? 'text-success fw-bold' : ''">{{ l.receivedQuantity }}</td>
                  <td>\${{ l.unitPrice | number:'1.2-2' }}</td>
                  <td>\${{ l.totalPrice | number:'1.2-2' }}</td>
                </tr>
              </tbody>
            </table>
            <h6 class="small">Payments</h6>
            <table class="table table-sm table-dark mb-0">
              <thead><tr><th>Date</th><th>Method</th><th>Ref</th><th>Amount</th></tr></thead>
              <tbody>
                <tr *ngFor="let p of payments()">
                  <td>{{ p.paidAt | date:'shortDate' }}</td>
                  <td>{{ p.method }}</td>
                  <td>{{ p.reference || '-' }}</td>
                  <td class="text-success">\${{ p.amount | number:'1.2-2' }}</td>
                </tr>
                <tr *ngIf="payments().length === 0"><td colspan="4" class="text-center text-secondary py-2">No payments yet</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PurchaseComponent implements OnInit {
  api = inject(ApiService);
  private auth = inject(AuthService);

  orders = signal<PurchaseOrder[]>([]);
  suppliers = signal<Supplier[]>([]);
  products = signal<Product[]>([]);
  payments = signal<OrderPayment[]>([]);
  monthlyReport = signal<any[]>([]);
  supplierReport = signal<any[]>([]);

  showModal = signal(false);
  receiveOrder = signal<PurchaseOrder | null>(null);
  payOrder = signal<PurchaseOrder | null>(null);
  detail = signal<any>(null);
  flash = signal('');

  selectedProductId = '';
  quantity = 10;
  unitPrice = 0;
  reportYear = new Date().getFullYear();
  canManage = false;

  payment = { amount: 0, method: 'BankTransfer', reference: '' };
  receiveLines: any[] = [];

  newOrder = {
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 14 * 864e5).toISOString().split('T')[0],
    notes: '',
    items: [] as any[]
  };

  ngOnInit(): void {
    this.canManage = this.auth.hasRole(['Admin', 'Manager']);
    this.loadOrders();
    this.api.getSuppliers().subscribe({ next: (list) => {
      this.suppliers.set(list || []);
      if (list?.length && !this.newOrder.supplierId) this.newOrder.supplierId = list[0].id;
    }});
    this.api.getProducts(1, 50).subscribe({ next: (res) => {
      if (res?.items) {
        this.products.set(res.items);
        if (res.items.length && !this.selectedProductId) {
          this.selectedProductId = res.items[0].id;
          this.unitPrice = res.items[0].costPrice;
        }
      }
    }});
    this.loadReports();
  }

  loadOrders(): void {
    this.api.getPurchaseOrders(1, 50).subscribe({
      next: (res) => { if (res?.items) this.orders.set(res.items); }
    });
  }

  loadReports(): void {
    this.api.purchaseMonthlyReport(this.reportYear).subscribe({ next: (r) => this.monthlyReport.set(r || []) });
    this.api.purchaseSupplierReport().subscribe({ next: (r) => this.supplierReport.set(r || []) });
  }

  openCreate(): void {
    const first = this.products()[0];
    this.selectedProductId = first?.id || '';
    this.unitPrice = first?.costPrice || 0;
    this.quantity = 10;
    this.showModal.set(true);
  }

  saveOrder(): void {
    const payload = {
      ...this.newOrder,
      items: [{ productId: this.selectedProductId, quantity: this.quantity, unitPrice: this.unitPrice }]
    };
    this.api.createPurchaseOrder(payload).subscribe({
      next: () => { this.showModal.set(false); this.notify('Purchase order created'); this.loadOrders(); this.loadReports(); }
    });
  }

  confirm(po: PurchaseOrder): void {
    this.api.confirmPurchaseOrder(po.id).subscribe({
      next: (res) => { this.notify(res.message || 'Confirmed'); this.loadOrders(); },
      error: () => this.notify('Confirm failed')
    });
  }

  cancel(po: PurchaseOrder): void {
    if (!confirm(`Cancel ${po.orderNumber}?`)) return;
    this.api.cancelPurchaseOrder(po.id).subscribe({
      next: (res) => { this.notify(res.message || 'Cancelled'); this.loadOrders(); },
      error: () => this.notify('Cancel failed')
    });
  }

  openReceive(po: PurchaseOrder): void {
    this.api.purchaseOrderDetail(po.id).subscribe({
      next: (res) => {
        const d = res.data;
        this.receiveLines = (d.items || []).map((l: any) => ({
          productId: l.productId, productName: l.productName,
          quantity: l.quantity, receivedQuantity: l.receivedQuantity,
          receiveQty: Math.max(0, l.quantity - l.receivedQuantity)
        }));
        this.receiveOrder.set(po);
      }
    });
  }

  saveReceive(): void {
    const po = this.receiveOrder();
    if (!po) return;
    const items = this.receiveLines
      .filter(l => l.receiveQty > 0)
      .map(l => ({ productId: l.productId, quantity: Number(l.receiveQty) }));
    if (items.length === 0) { this.notify('Nothing to receive'); return; }

    this.api.receivePurchaseItems(po.id, items).subscribe({
      next: (res) => {
        this.receiveOrder.set(null);
        this.notify(res.message || 'Items received');
        this.loadOrders();
        this.loadReports();
      },
      error: () => this.notify('Receive failed')
    });
  }

  openPayment(po: PurchaseOrder): void {
    this.payment = { amount: Math.max(0, Math.round((po.totalAmount - po.paidAmount) * 100) / 100), method: 'BankTransfer', reference: '' };
    this.payOrder.set(po);
  }

  savePayment(): void {
    const po = this.payOrder();
    if (!po) return;
    this.api.recordPurchasePayment(po.id, this.payment).subscribe({
      next: (res) => {
        this.payOrder.set(null);
        this.notify(res.message || 'Payment recorded');
        this.loadOrders();
        this.loadReports();
      },
      error: () => this.notify('Payment failed')
    });
  }

  emailToSupplier(po: PurchaseOrder): void {
    this.api.emailPurchaseOrderToSupplier(po.id).subscribe({
      next: (res) => this.notify(res.message || 'Emailed'),
      error: () => this.notify('Email failed')
    });
  }

  viewDetail(po: PurchaseOrder): void {
    this.api.purchaseOrderDetail(po.id).subscribe({
      next: (res) => {
        this.detail.set(res.data);
        this.payments.set([]);
        this.api.getPurchasePayments(po.id).subscribe({ next: (list) => this.payments.set(list || []) });
      }
    });
  }

  monthName(m: number): string {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1] || '';
  }

  paymentBadge(status: string): string {
    switch (status) {
      case 'Paid': return 'bg-success';
      case 'Partial': return 'bg-warning';
      case 'Overdue': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  private notify(msg: string): void {
    this.flash.set(msg);
    setTimeout(() => this.flash.set(''), 4000);
  }
}
