import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SalesOrder, Customer, Product } from '../../core/models/erp.models';

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="h3 mb-1"><i class="bi bi-cart3 me-2 text-primary"></i>Sales &amp; Invoices</h2>
        <p class="text-secondary small mb-0">Sales orders, billing invoices, payment statuses, and fulfillment tracking</p>
      </div>
      <button class="btn btn-primary" (click)="showModal.set(true)">
        <i class="bi bi-receipt me-1"></i> New Sales Order
      </button>
    </div>

    <!-- Sales Order Table -->
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total Amount</th>
              <th>Paid Amount</th>
              <th>Payment</th>
              <th>Fulfillment</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of orders()">
              <td><span class="font-monospace text-primary fw-bold">{{ order.orderNumber }}</span></td>
              <td class="fw-semibold">{{ order.customerName }}</td>
              <td>{{ order.orderDate | date:'mediumDate' }}</td>
              <td class="fw-bold text-success">\${{ order.totalAmount | number:'1.2-2' }}</td>
              <td>\${{ order.paidAmount | number:'1.2-2' }}</td>
              <td>
                <span class="badge" [ngClass]="getPaymentBadge(order.paymentStatus)">
                  {{ order.paymentStatus }}
                </span>
              </td>
              <td>
                <span class="badge bg-secondary">{{ order.status }}</span>
              </td>
            </tr>

            <tr *ngIf="orders().length === 0">
              <td colspan="7" class="text-center py-5 text-secondary">
                No sales orders created yet. Click "New Sales Order" to generate one.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Sales Order Modal -->
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
                <label class="form-label small">Select Customer *</label>
                <select [(ngModel)]="newOrder.customerId" name="oc" required class="form-select">
                  <option *ngFor="let c of customers()" [value]="c.id">{{ c.name }} ({{ c.company }})</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label small">Select Product *</label>
                <select [(ngModel)]="selectedProductId" name="op" class="form-select">
                  <option *ngFor="let p of products()" [value]="p.id">{{ p.name }} - \${{ p.sellingPrice }}</option>
                </select>
              </div>

              <div class="row g-2 mb-3">
                <div class="col">
                  <label class="form-label small">Quantity</label>
                  <input type="number" [(ngModel)]="quantity" name="oq" class="form-control" />
                </div>
                <div class="col">
                  <label class="form-label small">Order Date</label>
                  <input type="date" [(ngModel)]="newOrder.orderDate" name="od" class="form-control" />
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label small">Order Notes</label>
                <input type="text" [(ngModel)]="newOrder.notes" name="on" placeholder="Delivery specifications" class="form-control" />
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
  `
})
export class SalesComponent implements OnInit {
  private api = inject(ApiService);

  orders = signal<SalesOrder[]>([]);
  customers = signal<Customer[]>([]);
  products = signal<Product[]>([]);
  showModal = signal(false);

  selectedProductId = '';
  quantity = 1;

  newOrder = {
    customerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: null,
    notes: 'Standard Net-30 invoice',
    items: [] as any[]
  };

  ngOnInit(): void {
    this.loadOrders();
    this.loadMetadata();
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
          if (res.items.length > 0 && !this.newOrder.customerId) {
            this.newOrder.customerId = res.items[0].id;
          }
        }
      }
    });

    this.api.getProducts(1, 50).subscribe({
      next: (res) => {
        if (res?.items) {
          this.products.set(res.items);
          if (res.items.length > 0 && !this.selectedProductId) {
            this.selectedProductId = res.items[0].id;
          }
        }
      }
    });
  }

  saveOrder(): void {
    const prod = this.products().find(p => p.id === this.selectedProductId);
    const price = prod ? prod.sellingPrice : 100;

    const payload = {
      ...this.newOrder,
      items: [
        {
          productId: this.selectedProductId,
          quantity: this.quantity,
          unitPrice: price,
          discount: 0
        }
      ]
    };

    this.api.createSalesOrder(payload).subscribe({
      next: () => {
        this.showModal.set(false);
        this.loadOrders();
      }
    });
  }

  getPaymentBadge(status: string): string {
    switch (status) {
      case 'Paid': return 'bg-success';
      case 'Partial': return 'bg-warning';
      case 'Overdue': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
}
