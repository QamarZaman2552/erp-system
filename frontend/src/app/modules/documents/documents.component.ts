import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { PaginationComponent } from '../../shared/components/pagination.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="h3 mb-1"><i class="bi bi-folder2-open me-2 text-info"></i>Documents</h2>
        <p class="text-secondary small mb-0">Upload &amp; manage files (PDF, JPG, PNG, DOCX — max 5MB) with expiry tracking</p>
      </div>
      <div class="d-flex gap-2">
        <div class="btn-group" *ngIf="isAdmin()">
          <button class="btn btn-outline-secondary btn-sm" [class.active]="!mineOnly" (click)="toggleMine(false)">All</button>
          <button class="btn btn-outline-secondary btn-sm" [class.active]="mineOnly" (click)="toggleMine(true)">My Uploads</button>
        </div>
        <button class="btn btn-primary" (click)="showModal.set(true)">
          <i class="bi bi-cloud-arrow-up me-1"></i> Upload
        </button>
      </div>
    </div>

    <div *ngIf="flash()" class="alert py-2 small" [ngClass]="flashError() ? 'alert-danger' : 'alert-success'">{{ flash() }}</div>

    <!-- Expiring Soon -->
    <div class="alert alert-warning py-2 small d-flex align-items-center gap-2" *ngIf="expiring().length > 0">
      <i class="bi bi-exclamation-triangle"></i>
      <strong>{{ expiring().length }}</strong>&nbsp;document(s) expiring within 30 days:
      <span *ngFor="let d of expiring(); let last = last">
        {{ d.name }} ({{ d.expiryDate | date:'dd MMM' }}){{ last ? '' : ',' }}
      </span>
    </div>

    <!-- Search -->
    <div class="card border-0 shadow-sm p-3 mb-3">
      <input type="text" [(ngModel)]="search" (ngModelChange)="applySearch()" class="form-control form-control-sm"
             placeholder="🔍 Search documents by name..." />
    </div>

    <!-- Table -->
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-dark table-hover align-middle mb-0">
          <thead>
            <tr><th>Name</th><th>Type</th><th>Size</th><th>Attached To</th><th>Expiry</th><th>Uploaded</th><th class="text-end">Actions</th></tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of docs()">
              <td class="fw-semibold"><i class="bi me-2" [ngClass]="iconFor(d.fileType)"></i>{{ d.name }}</td>
              <td><span class="badge bg-secondary">{{ d.fileType }}</span></td>
              <td>{{ formatSize(d.fileSizeBytes) }}</td>
              <td>{{ d.entityType }}<br /><small class="font-monospace text-secondary">{{ shortId(d.entityId) }}</small></td>
              <td>
                <span *ngIf="d.expiryDate" [ngClass]="expiringSoon(d.expiryDate) ? 'text-warning fw-bold' : 'text-secondary'">
                  {{ d.expiryDate | date:'dd MMM yyyy' }}
                </span>
                <span class="text-secondary" *ngIf="!d.expiryDate">—</span>
              </td>
              <td>{{ d.createdAt | date:'mediumDate' }}</td>
              <td class="text-end">
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-light" (click)="preview(d)" title="Open / preview">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn btn-outline-primary" (click)="download(d)" title="Download">
                    <i class="bi bi-download"></i>
                  </button>
                  <button class="btn btn-outline-danger" (click)="remove(d)" title="Delete (uploader/admin only)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="docs().length === 0">
              <td colspan="7" class="text-center py-5 text-secondary">No documents found. Click "Upload" to add one.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <app-pagination
      [page]="page()"
      [pageSize]="pageSize()"
      [totalCount]="totalCount()"
      (pageChange)="onPageChange($event)"
      (pageSizeChange)="onPageSizeChange($event)"
    />

    <!-- Upload Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="showModal()">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Upload Document</h5>
            <button type="button" class="btn-close btn-close-white" (click)="showModal.set(false)"></button>
          </div>
          <form (ngSubmit)="upload()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label small">Attach To *</label>
                <select [(ngModel)]="uploadForm.entityType" name="det" class="form-select" (change)="onEntityTypeChange()">
                  <option value="Employee">Employee</option>
                  <option value="Project">Project</option>
                  <option value="Task">Task</option>
                  <option value="Expense">Expense</option>
                  <option value="LeaveRequest">Leave Request</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label small">{{ uploadForm.entityType }} ID *</label>
                <input type="text" [(ngModel)]="uploadForm.entityId" name="deid" required class="form-control font-monospace"
                       placeholder="Paste the entity's GUID" />
                <small class="text-secondary" *ngIf="uploadForm.entityType === 'Employee' && employees().length > 0">
                  or pick:
                  <a href="javascript:void(0)" *ngFor="let e of employees()" (click)="uploadForm.entityId = e.id" class="me-2">
                    {{ e.employeeCode }}
                  </a>
                </small>
              </div>
              <div class="mb-3">
                <label class="form-label small">File * (PDF, JPG, PNG, DOCX — max 5MB)</label>
                <input type="file" (change)="onFileSelected($event)" accept=".pdf,.jpg,.jpeg,.png,.docx" class="form-control" />
              </div>
              <div class="mb-3">
                <label class="form-label small">Expiry Date (optional)</label>
                <input type="date" [(ngModel)]="uploadForm.expiryDate" name="dexp" class="form-control" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showModal.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!selectedFile || !uploadForm.entityId">
                Upload
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class DocumentsComponent implements OnInit {
  api = inject(ApiService);
  private auth = inject(AuthService);

  docs = signal<any[]>([]);
  expiring = signal<any[]>([]);
  employees = signal<any[]>([]);
  showModal = signal(false);
  flashMsg = signal('');
  flashIsError = false;

  search = '';
  mineOnly = false;
  selectedFile: File | null = null;
  uploadForm = { entityType: 'Employee', entityId: '', expiryDate: '' };
  private searchTimer: any;

  page = signal(1);
  pageSize = signal(25);
  totalCount = signal(0);

  ngOnInit(): void {
    this.load();
    this.api.getExpiringDocuments(30).subscribe({ next: list => this.expiring.set(list || []) });
    this.api.getEmployees(1, 10).subscribe({
      next: res => { if (res?.items) this.employees.set(res.items); },
      error: () => {}
    });
  }

  isAdmin(): boolean { return this.auth.hasRole(['Admin']); }

  load(): void {
    this.api.getDocuments(this.page(), this.pageSize(), this.search || undefined, undefined, this.mineOnly).subscribe({
      next: res => {
        if (res?.items) this.docs.set(res.items);
        if (res?.totalCount !== undefined) this.totalCount.set(res.totalCount);
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.load();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.page.set(1);
    this.load();
  }

  toggleMine(mine: boolean): void {
    this.mineOnly = mine;
    this.load();
  }

  applySearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.load(), 350);
  }

  onEntityTypeChange(): void {
    if (this.uploadForm.entityType !== 'Employee') return;
  }

  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
  }

  upload(): void {
    if (!this.selectedFile || !this.uploadForm.entityId) return;
    const expiry = this.uploadForm.expiryDate ? new Date(this.uploadForm.expiryDate).toISOString() : undefined;
    this.api.uploadDocument(this.selectedFile, this.uploadForm.entityType, this.uploadForm.entityId, expiry)
      .subscribe({
        next: () => {
          this.showModal.set(false);
          this.selectedFile = null;
          this.uploadForm.entityId = '';
          this.notify('Document uploaded');
          this.load();
        },
        error: () => this.notify('Upload failed', true)
      });
  }

  preview(d: any): void {
    this.api.downloadDocument(d.id).subscribe({
      next: res => this.openBlob(res.body!, d.fileType),
      error: () => this.notify('Preview failed', true)
    });
  }

  download(d: any): void {
    this.api.downloadDocument(d.id).subscribe({
      next: res => {
        const blob = new Blob([res.body!]);
        const a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.download = `${d.name}.${String(d.fileType).toLowerCase()}`;
        a.click();
        window.URL.revokeObjectURL(a.href);
      }
    });
  }

  private openBlob(blob: Blob, fileType: string): void {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
  }

  remove(d: any): void {
    if (!confirm(`Delete "${d.name}"?`)) return;
    this.api.deleteDocument(d.id).subscribe({
      next: () => { this.notify('Document deleted'); this.load(); },
      error: () => this.notify('Delete failed (only uploader or Admin)', true)
    });
  }

  iconFor(type: string): string {
    switch ((type || '').toUpperCase()) {
      case 'PDF': return 'bi-file-earmark-pdf text-danger';
      case 'PNG':
      case 'JPG':
      case 'JPEG': return 'bi-file-earmark-image text-info';
      case 'DOCX': return 'bi-file-earmark-word text-primary';
      default: return 'bi-file-earmark';
    }
  }

  formatSize(bytes: number): string {
    if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  expiringSoon(date: string): boolean {
    const diff = new Date(date).getTime() - Date.now();
    return diff < 30 * 864e5 && diff > -365 * 864e5;
  }

  shortId(id?: string): string { return id ? id.substring(0, 8) : '-'; }

  private notify(msg: string, isError = false): void {
    this.flashIsError = isError;
    this.flashMsg.set(msg);
    setTimeout(() => this.flashMsg.set(''), 4000);
  }

  flash(): string { return this.flashMsg(); }
  flashError(): boolean { return this.flashIsError; }
}
