import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pagination-bar" *ngIf="totalCount > 0">
      <div class="pagination-info">
        <span class="row-count">Showing {{ startRow() }}–{{ endRow() }} of {{ totalCount }}</span>
      </div>

      <div class="pagination-controls">
        <div class="page-size-selector">
          <label class="page-size-label">Rows:</label>
          <select class="page-size-select" [ngModel]="pageSize" (ngModelChange)="onPageSizeChange($event)">
            <option *ngFor="let size of pageSizeOptions" [value]="size">{{ size }}</option>
          </select>
        </div>

        <div class="page-nav">
          <button class="btn btn-sm btn-nav" [disabled]="page <= 1" (click)="goPage(1)" title="First page">⟨⟨</button>
          <button class="btn btn-sm btn-nav" [disabled]="page <= 1" (click)="goPage(page - 1)" title="Previous page">⟨</button>
          <span class="page-indicator">{{ page }} / {{ totalPages() }}</span>
          <button class="btn btn-sm btn-nav" [disabled]="page >= totalPages()" (click)="goPage(page + 1)" title="Next page">⟩</button>
          <button class="btn btn-sm btn-nav" [disabled]="page >= totalPages()" (click)="goPage(totalPages())" title="Last page">⟩⟩</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      font-size: 13px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .pagination-info {
      color: var(--text-muted);
    }

    .row-count {
      font-weight: 500;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .page-size-label {
      color: var(--text-muted);
      font-size: 12px;
    }

    .page-size-select {
      background: var(--bg-secondary);
      color: var(--text-primary);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      outline: none;
    }

    .page-size-select:focus {
      border-color: var(--accent);
    }

    .page-nav {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .btn-nav {
      background: var(--bg-secondary);
      color: var(--text-primary);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-nav:hover:not(:disabled) {
      background: var(--accent-bg);
      border-color: var(--accent);
      color: var(--accent);
    }

    .btn-nav:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .page-indicator {
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 500;
      padding: 0 8px;
      white-space: nowrap;
    }
  `]
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() pageSize = 25;
  @Input() totalCount = 0;
  @Input() pageSizeOptions = [10, 25, 50, 100];

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount / this.pageSize)));
  startRow = computed(() => this.totalCount === 0 ? 0 : (this.page - 1) * this.pageSize + 1);
  endRow = computed(() => Math.min(this.page * this.pageSize, this.totalCount));

  goPage(p: number): void {
    if (p < 1 || p > this.totalPages() || p === this.page) return;
    this.pageChange.emit(p);
  }

  onPageSizeChange(size: number): void {
    this.pageSizeChange.emit(size);
  }
}
