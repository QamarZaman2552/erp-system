import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Customer, Lead } from '../../core/models/erp.models';
import { PaginationComponent } from '../../shared/components/pagination.component';

@Component({
  selector: 'app-crm',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div class="page-header-row">
      <div>
        <h2>Customer Relationship Management (CRM)</h2>
        <p class="text-sm text-gray-400">Track client accounts, interaction logs, and pipeline deal stages</p>
      </div>
      <div class="header-buttons">
        <button class="btn btn-secondary" (click)="activeTab = 'customers'" [class.active-tab]="activeTab === 'customers'">
          🏢 Customers
        </button>
        <button class="btn btn-secondary" (click)="activeTab = 'leads'" [class.active-tab]="activeTab === 'leads'">
          🎯 Deals &amp; Leads Pipeline
        </button>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span>+ Add {{ activeTab === 'customers' ? 'Customer' : 'Lead' }}</span>
        </button>
      </div>
    </div>

    <!-- Customers View -->
    <div *ngIf="activeTab === 'customers'">
      <!-- Interaction Panel -->
      <div class="erp-card p-3 mb-3">
        <div class="row g-2 align-items-end">
          <div class="col-md-3">
            <label class="form-label small mb-1">Customer</label>
            <select [(ngModel)]="selectedCustomerId" (change)="loadInteractions()" class="form-select form-select-sm">
              <option [ngValue]="null" disabled>Select customer…</option>
              <option *ngFor="let c of customers()" [ngValue]="c.id">{{ c.name }}</option>
            </select>
          </div>
        </div>
        <div *ngIf="selectedCustomerId" class="mt-3">
          <form class="row g-2 align-items-end" (ngSubmit)="saveInteraction()">
            <div class="col-md-2">
              <label class="form-label small mb-1">Type</label>
              <select [(ngModel)]="newInteraction.type" name="itype" class="form-select form-select-sm">
                <option>Call</option><option>Email</option><option>Meeting</option><option>Note</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label small mb-1">Subject *</label>
              <input type="text" [(ngModel)]="newInteraction.subject" name="isub" required class="form-control form-control-sm" />
            </div>
            <div class="col-md-3">
              <label class="form-label small mb-1">Notes</label>
              <input type="text" [(ngModel)]="newInteraction.notes" name="inotes" class="form-control form-control-sm" />
            </div>
            <div class="col-md-2">
              <label class="form-label small mb-1">Follow-up</label>
              <input type="date" [(ngModel)]="newInteraction.followUpDate" name="ifup" class="form-control form-control-sm" />
            </div>
            <div class="col-md-1">
              <button type="submit" class="btn btn-sm btn-primary w-100">Log</button>
            </div>
          </form>
          <table class="table table-sm table-hover align-middle mb-0 mt-3" *ngIf="interactions().length > 0; else noInts">
            <thead><tr class="small text-secondary"><th>Date</th><th>Type</th><th>Subject</th><th>Follow-up</th></tr></thead>
            <tbody>
              <tr *ngFor="let i of interactions()">
                <td class="small">{{ i.interactionDate | date:'MMM d, y' }}</td>
                <td><span class="badge badge-info small">{{ i.type }}</span></td>
                <td class="small fw-semibold">{{ i.subject }}<div class="text-xs text-gray-400">{{ i.notes }}</div></td>
                <td class="small" *ngIf="i.followUpDate"><span class="badge badge-warning">🔔 {{ i.followUpDate | date:'MMM d' }}</span></td>
                <td *ngIf="!i.followUpDate">—</td>
              </tr>
            </tbody>
          </table>
          <ng-template #noInts><p class="text-xs text-gray-400 mt-2 mb-0">No interactions logged yet.</p></ng-template>
        </div>
      </div>

      <div class="erp-table-container">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Company</th>
              <th>Email &amp; Phone</th>
              <th>Location</th>
              <th>Total Purchases</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of customers()">
              <td class="font-semibold">{{ c.name }}</td>
              <td>{{ c.company || '—' }}</td>
              <td>
                <div>{{ c.email }}</div>
                <div class="text-xs text-gray-400">{{ c.phone }}</div>
              </td>
              <td>{{ c.city }}, {{ c.country }}</td>
              <td class="font-semibold text-emerald-400">\${{ c.totalPurchaseValue | number:'1.2-2' }}</td>
              <td>
                <span class="badge badge-success" *ngIf="c.isActive">Active</span>
                <span class="badge badge-neutral" *ngIf="!c.isActive">Inactive</span>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-primary py-0 px-1 me-1" title="Edit" (click)="editCustomer(c)">✏️</button>
                <button class="btn btn-sm btn-outline-danger py-0 px-1" title="Archive" (click)="archiveCustomer(c)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Leads Pipeline View -->
    <div *ngIf="activeTab === 'leads'">
      <!-- Pipeline Stats -->
      <div class="row g-3 mb-3">
        <div class="col"><div class="card p-3 text-center"><div class="h5 mb-0">{{ stageCount('New') }}</div><div class="metric-title small">New</div></div></div>
        <div class="col"><div class="card p-3 text-center"><div class="h5 mb-0">{{ stageCount('Contacted') }}</div><div class="metric-title small">Contacted</div></div></div>
        <div class="col"><div class="card p-3 text-center"><div class="h5 mb-0">{{ stageCount('Qualified') }}</div><div class="metric-title small">Qualified</div></div></div>
        <div class="col"><div class="card p-3 text-center"><div class="h5 mb-0">{{ stageCount('Proposal') + stageCount('Negotiation') }}</div><div class="metric-title small">Proposal/Neg.</div></div></div>
        <div class="col"><div class="card p-3 text-center"><div class="h5 mb-0 text-success">{{ stageCount('Won') }}</div><div class="metric-title small">Won</div></div></div>
        <div class="col"><div class="card p-3 text-center"><div class="h5 mb-0 text-danger">{{ stageCount('Lost') }}</div><div class="metric-title small">Lost</div></div></div>
        <div class="col"><div class="card p-3 text-center"><div class="h5 mb-0 text-info">{{ conversionRate() }}%</div><div class="metric-title small">Conversion</div></div></div>
        <div class="col"><div class="card p-3 text-center"><div class="h5 mb-0">\${{ pipelineValue() | number:'1.0-0' }}</div><div class="metric-title small">Open Pipeline</div></div></div>
      </div>

      <div class="erp-table-container">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Deal Opportunity</th>
              <th>Contact Person</th>
              <th>Company</th>
              <th>Source</th>
              <th>Estimated Value</th>
              <th style="width: 150px;">Stage</th>
              <th *ngIf="canManage()">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let l of leads()">
              <td class="font-semibold">{{ l.title }}</td>
              <td>{{ l.contactName || '—' }}<div class="text-xs text-gray-400">{{ l.contactEmail }}</div></td>
              <td>{{ l.company || '—' }}</td>
              <td><span class="badge badge-neutral">{{ l.source || '—' }}</span></td>
              <td class="font-semibold text-indigo-400">\${{ l.estimatedValue | number:'1.2-2' }}</td>
              <td>
                <select class="form-select form-select-sm" [value]="l.status" (change)="changeStage(l, $any($event.target).value)">
                  <option>New</option><option>Contacted</option><option>Qualified</option>
                  <option>Proposal</option><option>Negotiation</option><option>Won</option><option>Lost</option>
                </select>
              </td>
              <td *ngIf="canManage()">
                <button class="btn btn-sm btn-outline-danger py-0 px-1" title="Delete lead" (click)="deleteLead(l)">✕</button>
              </td>
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
      (pageSizeChange)="onPageSizeChange($event)">
    </app-pagination>

    <!-- Create Customer Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="showCustomerModal()">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingCustomerId ? 'Edit Client Account' : 'Add New Client Account' }}</h5>
            <button type="button" class="btn-close btn-close-white" (click)="showCustomerModal.set(false)"></button>
          </div>
          <form (ngSubmit)="saveCustomer()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label small">Client / Contact Name *</label>
                <input type="text" [(ngModel)]="newCust.name" name="cn" required class="form-control" placeholder="e.g. Acme Corp" />
              </div>
              <div class="row g-3 mb-1">
                <div class="col-md-6">
                  <label class="form-label small">Company Name</label>
                  <input type="text" [(ngModel)]="newCust.company" name="co" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label small">Email Address</label>
                  <input type="email" [(ngModel)]="newCust.email" name="em" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label small">Phone</label>
                  <input type="text" [(ngModel)]="newCust.phone" name="ph" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label small">City</label>
                  <input type="text" [(ngModel)]="newCust.city" name="ct" class="form-control" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showCustomerModal.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Customer</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Create Lead Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="showLeadModal()">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add New Deal / Lead</h5>
            <button type="button" class="btn-close btn-close-white" (click)="showLeadModal.set(false)"></button>
          </div>
          <form (ngSubmit)="saveLead()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label small">Deal Title *</label>
                <input type="text" [(ngModel)]="newLead.title" name="lt2" required class="form-control" placeholder="e.g. ERP implementation for Acme" />
              </div>
              <div class="row g-3 mb-1">
                <div class="col-md-6">
                  <label class="form-label small">Contact Person</label>
                  <input type="text" [(ngModel)]="newLead.contactName" name="lcn" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label small">Company</label>
                  <input type="text" [(ngModel)]="newLead.company" name="lco" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label small">Estimated Value ($) *</label>
                  <input type="number" [(ngModel)]="newLead.estimatedValue" name="lev" required min="1" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label small">Source</label>
                  <select [(ngModel)]="newLead.source" name="lsr" class="form-select">
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="ColdCall">Cold Call</option>
                    <option value="Campaign">Campaign</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showLeadModal.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Lead</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .header-buttons {
      display: flex;
      gap: 10px;
    }

    .active-tab {
      background: var(--bg-primary);
      border-color: var(--accent-primary);
      color: #fff;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .text-emerald-400 { color: #34d399; }
    .text-indigo-400 { color: #ededed; }
    .text-sm { font-size: 13px; }
    .text-xs { font-size: 11px; }
    .text-gray-400 { color: var(--text-secondary); }
  `]
})
export class CrmComponent implements OnInit {
  private api = inject(ApiService);
  private notifications = inject(NotificationService);

  activeTab: 'customers' | 'leads' = 'customers';
  customers = signal<Customer[]>([]);
  leads = signal<Lead[]>([]);
  showCustomerModal = signal(false);
  showLeadModal = signal(false);
  editingCustomerId: string | null = null;
  page = signal(1);
  pageSize = signal(25);
  totalCount = signal(0);

  selectedCustomerId: string | null = null;
  interactions = signal<any[]>([]);
  newInteraction = { type: 'Call', subject: '', notes: '', followUpDate: '' };

  private auth = inject(AuthService);
  canManage(): boolean {
    return this.auth.hasRole(['Admin', 'Manager']);
  }

  newCust = {
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'USA',
    website: '',
    notes: ''
  };

  newLead: any = {
    title: '',
    contactName: '',
    company: '',
    estimatedValue: 10000,
    source: 'Website'
  };

  ngOnInit(): void {
    this.loadData();
  }

  private notify(title: string, message: string, type: 'success' | 'error' | 'warning'): void {
    this.notifications.addNotification({
      id: Math.random().toString(),
      title,
      message,
      type,
      timestamp: new Date()
    });
  }

  loadData(): void {
    this.api.getCustomers(this.page(), this.pageSize()).subscribe({
      next: (res) => { if (res?.items) this.customers.set(res.items); if (res?.totalCount !== undefined) this.totalCount.set(res.totalCount); },
      error: () => this.notify('CRM', 'Failed to load customers.', 'error')
    });
    this.api.getLeads(this.page(), this.pageSize()).subscribe({
      next: (res) => { if (res?.items) this.leads.set(res.items); if (res?.totalCount !== undefined) this.totalCount.set(res.totalCount); },
      error: () => this.notify('CRM', 'Failed to load leads.', 'error')
    });
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.loadData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
    this.loadData();
  }

  openCreateModal(): void {
    if (this.activeTab === 'customers') {
      this.editingCustomerId = null;
      this.newCust = { name: '', company: '', email: '', phone: '', address: '', city: '', country: 'USA', website: '', notes: '' };
      this.showCustomerModal.set(true);
    } else {
      this.newLead = { title: '', contactName: '', company: '', estimatedValue: 10000, source: 'Website' };
      this.showLeadModal.set(true);
    }
  }

  private extractError(err: any): string {
    const errors = err?.error?.errors;
    if (errors) {
      const key = Object.keys(errors)[0];
      const val = errors[key];
      return `${key}: ${Array.isArray(val) ? val[0] : val}`;
    }
    return err?.error?.message || 'Something went wrong.';
  }

  saveCustomer(): void {
    if (!this.newCust.name) {
      this.notify('CRM', 'Client name is required.', 'warning');
      return;
    }
    if (!this.newCust.city) this.newCust.city = 'Unknown';

    if (this.editingCustomerId) {
      this.api.updateCustomer(this.editingCustomerId, { ...this.newCust, isActive: true }).subscribe({
        next: () => {
          this.showCustomerModal.set(false);
          this.loadData();
          this.notify('CRM', 'Customer updated successfully!', 'success');
        },
        error: (err) => this.notify('CRM', this.extractError(err), 'error')
      });
      return;
    }

    this.api.createCustomer(this.newCust).subscribe({
      next: () => {
        this.showCustomerModal.set(false);
        this.loadData();
        this.notify('CRM', 'Customer saved successfully!', 'success');
      },
      error: (err) => this.notify('CRM', this.extractError(err), 'error')
    });
  }

  editCustomer(c: Customer): void {
    this.editingCustomerId = c.id;
    this.newCust = {
      name: c.name,
      company: c.company || '',
      email: c.email || '',
      phone: c.phone || '',
      address: '',
      city: c.city || '',
      country: c.country || '',
      website: '',
      notes: ''
    };
    this.showCustomerModal.set(true);
  }

  archiveCustomer(c: Customer): void {
    if (!confirm(`Archive customer "${c.name}"?`)) return;
    this.api.deleteCustomer(c.id).subscribe({
      next: () => {
        this.loadData();
        this.notify('CRM', `"${c.name}" archived.`, 'success');
      },
      error: (err) => this.notify('CRM', this.extractError(err), 'error')
    });
  }

  changeStage(l: Lead, newStatus: string): void {
    const notes = newStatus === 'Lost' ? prompt(`Loss reason for "${l.title}" (required):`) || '' : l.status === undefined ? '' : undefined;
    if (newStatus === 'Lost' && !notes) {
      this.notify('CRM', 'Loss reason is required.', 'warning');
      this.loadData();
      return;
    }
    const payload: any = {
      title: l.title,
      contactName: l.contactName || null,
      contactEmail: l.contactEmail || null,
      contactPhone: l.contactPhone || null,
      company: l.company || null,
      status: newStatus,
      estimatedValue: l.estimatedValue,
      expectedCloseDate: l.expectedCloseDate || null,
      notes: notes ?? undefined
    };
    this.api.updateLead(l.id, payload).subscribe({
      next: (res) => {
        this.notify('CRM', res?.message || `Lead moved to ${newStatus}.`, 'success');
        this.loadData();
      },
      error: (err) => {
        this.notify('CRM', this.extractError(err), 'error');
        this.loadData();
      }
    });
  }

  deleteLead(l: Lead): void {
    if (!confirm(`Delete lead "${l.title}"?`)) return;
    this.api.deleteLead(l.id).subscribe({
      next: () => { this.loadData(); this.notify('CRM', 'Lead deleted.', 'success'); }
    });
  }

  stageCount(stage: string): number {
    return this.leads().filter(l => l.status === stage).length;
  }

  conversionRate(): number {
    const closed = this.leads().filter(l => l.status === 'Won' || l.status === 'Lost').length;
    if (closed === 0) return 0;
    return Math.round((this.stageCount('Won') / closed) * 100);
  }

  pipelineValue(): number {
    return this.leads()
      .filter(l => !['Won', 'Lost'].includes(l.status))
      .reduce((s, l) => s + (l.estimatedValue || 0), 0);
  }

  loadInteractions(): void {
    if (!this.selectedCustomerId) { this.interactions.set([]); return; }
    this.api.getInteractions(this.selectedCustomerId).subscribe({
      next: (res) => this.interactions.set(res || [])
    });
  }

  saveInteraction(): void {
    if (!this.selectedCustomerId || !this.newInteraction.subject) {
      this.notify('CRM', 'Select a customer and enter a subject.', 'warning');
      return;
    }
    this.api.logInteraction({
      customerId: this.selectedCustomerId,
      type: this.newInteraction.type,
      subject: this.newInteraction.subject,
      notes: this.newInteraction.notes || undefined,
      followUpDate: this.newInteraction.followUpDate || undefined
    }).subscribe({
      next: () => {
        this.newInteraction = { type: 'Call', subject: '', notes: '', followUpDate: '' };
        this.loadInteractions();
        this.notify('CRM', 'Interaction logged!', 'success');
      },
      error: (err) => this.notify('CRM', this.extractError(err), 'error')
    });
  }

  saveLead(): void {
    if (!this.newLead.title) {
      this.notify('CRM', 'Deal title is required.', 'warning');
      return;
    }
    const payload = {
      ...this.newLead,
      estimatedValue: Number(this.newLead.estimatedValue)
    };
    this.api.createLead(payload).subscribe({
      next: () => {
        this.showLeadModal.set(false);
        this.loadData();
        this.notify('CRM', 'Lead saved successfully!', 'success');
      },
      error: (err) => this.notify('CRM', this.extractError(err), 'error')
    });
  }
}
