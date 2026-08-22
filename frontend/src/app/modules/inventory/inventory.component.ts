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

    <!-- Stats Cards -->
    <div class="row g-3 mb-3">
      <div class="col-md-3"><div class="card p-3 text-center"><div class="h5 mb-0">{{ products().length }}</div><div class="metric-title small">Products</div></div></div>
      <div class="col-md-3"><div class="card p-3 text-center"><div class="h5 mb-0">\${{ totalStockValue() | number:'1.0-0' }}</div><div class="metric-title small">Stock Value (cost)</div></div></div>
      <div class="col-md-3"><div class="card p-3 text-center"><div class="h5 mb-0 text-danger">{{ lowCount() }}</div><div class="metric-title small">Low Stock Items</div></div></div>
      <div class="col-md-3">
        <label class="form-label small mb-1">Category Filter</label>
        <select [(ngModel)]="filterCat" (change)="filterCat.set($any($event.target).value)" class="form-select form-select-sm">
          <option value="">All Categories</option>
          <option *ngFor="let c of categories()" [value]="c.name">{{ c.name }} ({{ c.productCount }})</option>
        </select>
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
              <th>History</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filteredProducts()">
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
              <td>
                <button class="btn btn-sm btn-outline-info py-0 px-1" title="Movement history" (click)="openMovements(p)">
                  <i class="bi bi-clock-history"></i>
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredProducts().length === 0">
              <td colspan="8" class="text-center py-4 text-secondary">No products found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Category-wise Report -->
    <div class="card p-3 mt-3" *ngIf="catReport().length > 0">
      <h5 class="h6 mb-3"><i class="bi bi-tags me-2"></i>Category-wise Stock Report</h5>
      <table class="table table-sm table-hover align-middle mb-0">
        <thead><tr class="small text-secondary"><th>Category</th><th class="text-center">Products</th><th class="text-end">Units in Stock</th><th class="text-end">Stock Value</th></tr></thead>
        <tbody>
          <tr *ngFor="let r of catReport()">
            <td class="fw-semibold">{{ r.cat }}</td>
            <td class="text-center">{{ r.items }}</td>
            <td class="text-center">{{ r.units }}</td>
            <td class="text-end">\${{ r.value | number:'1.0-0' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Movements History Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="movementsProduct()">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title"><i class="bi bi-clock-history me-2"></i>{{ movementsProduct()?.name }} — Movement History</h5>
            <button type="button" class="btn-close btn-close-white" (click)="movementsProduct.set(null)"></button>
          </div>
          <div class="modal-body">
            <table class="table table-sm table-hover align-middle mb-0" *ngIf="movements().length > 0; else noMovs">
              <thead><tr class="small text-secondary"><th>Date</th><th>Type</th><th class="text-center">Qty</th><th class="text-center">Stock</th><th>Notes</th></tr></thead>
              <tbody>
                <tr *ngFor="let m of movements()">
                  <td class="small">{{ m.createdAt | date:'MMM d, y HH:mm' }}</td>
                  <td><span class="badge" [class.bg-success]="m.type === 'In'" [class.bg-warning]="m.type === 'Out'" [class.bg-info]="m.type === 'Adjustment' || m.type === 'Return'">{{ m.type }}</span></td>
                  <td class="text-center fw-bold">{{ m.quantity }}</td>
                  <td class="text-center text-secondary small">{{ m.previousStock }} → {{ m.newStock }}</td>
                  <td class="small">{{ m.notes || '—' }}</td>
                </tr>
              </tbody>
            </table>
            <ng-template #noMovs><p class="text-secondary small mb-0">No stock movements recorded yet.</p></ng-template>
          </div>
        </div>
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
                    <option value="In">Stock In (+)</option>
                    <option value="Out">Stock Out (-)</option>
                    <option value="Adjustment">Adjustment</option>
                    <option value="Return">Return</option>
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
    type: 'In',
    notes: 'Warehouse restock'
  };

  ngOnInit(): void {
    this.loadProducts();
    this.api.getCategories().subscribe({
      next: (res) => this.categories.set(res || [])
    });
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

  categories = signal<any[]>([]);
  filterCat = signal<string>('');
  movementsProduct = signal<Product | null>(null);
  movements = signal<any[]>([]);

  filteredProducts(): Product[] {
    if (!this.filterCat()) return this.products();
    return this.products().filter(p => p.categoryName === this.filterCat());
  }

  totalStockValue(): number {
    return this.products().reduce((s, p) => s + (p.costPrice * p.currentStock), 0);
  }

  lowCount(): number {
    return this.products().filter(p => p.currentStock <= p.minimumStock).length;
  }

  catReport(): { cat: string; items: number; units: number; value: number }[] {
    const map = new Map<string, { items: number; units: number; value: number }>();
    for (const p of this.products()) {
      const cur = map.get(p.categoryName) || { items: 0, units: 0, value: 0 };
      cur.items++;
      cur.units += p.currentStock;
      cur.value += p.costPrice * p.currentStock;
      map.set(p.categoryName, cur);
    }
    return Array.from(map.entries()).map(([cat, v]) => ({ cat, ...v }));
  }

  openMovements(p: Product): void {
    this.movementsProduct.set(p);
    this.api.getProductMovements(p.id).subscribe({
      next: (res) => this.movements.set(res || [])
    });
  }
}
