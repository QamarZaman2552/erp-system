import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Product } from '../../core/models/erp.models';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="h3 mb-1"><i class="bi bi-box-seam me-2 text-primary"></i>Inventory &amp; Stock</h2>
        <p class="text-secondary small mb-0">Product master, stock level monitoring, and quantity adjustments</p>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-light" (click)="showAdjustModal.set(true)">
          <i class="bi bi-arrow-left-right me-1"></i> Adjust Stock
        </button>
        <button class="btn btn-primary" (click)="showCreateModal.set(true)">
          <i class="bi bi-plus-lg me-1"></i> Add Product
        </button>
      </div>
    </div>

    <!-- Inventory Table -->
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr>
              <th>SKU Code</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Unit Cost</th>
              <th>Selling Price</th>
              <th>In Stock</th>
              <th>Stock Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of products()">
              <td><span class="font-monospace text-primary small">{{ p.code }}</span></td>
              <td class="fw-semibold">{{ p.name }}</td>
              <td><span class="badge bg-secondary">{{ p.categoryName }}</span></td>
              <td>\${{ p.costPrice | number:'1.2-2' }}</td>
              <td class="fw-bold text-success">\${{ p.sellingPrice | number:'1.2-2' }}</td>
              <td>
                <div class="d-flex align-items-center gap-2">
                  <span class="fw-bold">{{ p.currentStock }}</span>
                  <span class="text-secondary small">/ min {{ p.minimumStock }}</span>
                </div>
              </td>
              <td>
                <span class="badge bg-danger" *ngIf="p.currentStock <= p.minimumStock">
                  <i class="bi bi-exclamation-triangle-fill me-1"></i> Low Stock
                </span>
                <span class="badge bg-success" *ngIf="p.currentStock > p.minimumStock">
                  <i class="bi bi-check-circle-fill me-1"></i> In Stock
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Stock Adjustment Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="showAdjustModal()">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Inventory Stock Adjustment</h5>
            <button type="button" class="btn-close btn-close-white" (click)="showAdjustModal.set(false)"></button>
          </div>
          <form (ngSubmit)="saveAdjustment()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label small">Select Product *</label>
                <select [(ngModel)]="adjustData.productId" name="ap" required class="form-select">
                  <option *ngFor="let p of products()" [value]="p.id">{{ p.name }} (Current: {{ p.currentStock }})</option>
                </select>
              </div>
              <div class="row g-2 mb-3">
                <div class="col">
                  <label class="form-label small">Movement Type</label>
                  <select [(ngModel)]="adjustData.type" name="at" class="form-select">
                    <option [value]="0">Stock In (+)</option>
                    <option [value]="1">Stock Out (-)</option>
                  </select>
                </div>
                <div class="col">
                  <label class="form-label small">Quantity *</label>
                  <input type="number" [(ngModel)]="adjustData.quantity" name="aq" required class="form-control" />
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label small">Reason / Notes</label>
                <input type="text" [(ngModel)]="adjustData.notes" name="an" placeholder="e.g. Shipment receipt" class="form-control" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showAdjustModal.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Apply Adjustment</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class InventoryComponent implements OnInit {
  private api = inject(ApiService);

  products = signal<Product[]>([]);
  showAdjustModal = signal(false);
  showCreateModal = signal(false);

  adjustData = {
    productId: '',
    quantity: 10,
    type: 0,
    notes: 'Warehouse restock'
  };

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.api.getProducts(1, 50).subscribe({
      next: (res) => {
        if (res?.items) {
          this.products.set(res.items);
          if (res.items.length > 0 && !this.adjustData.productId) {
            this.adjustData.productId = res.items[0].id;
          }
        }
      }
    });
  }

  saveAdjustment(): void {
    this.api.adjustStock(this.adjustData).subscribe({
      next: () => {
        this.showAdjustModal.set(false);
        this.loadProducts();
      }
    });
  }
}
