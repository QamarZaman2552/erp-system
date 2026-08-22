import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { Customer, Lead } from '../../core/models/erp.models';

@Component({
  selector: 'app-crm',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Leads Pipeline View -->
    <div *ngIf="activeTab === 'leads'">
      <div class="erp-table-container">
        <table class="erp-table">
          <thead>
            <tr>
              <th>Deal Opportunity</th>
              <th>Contact Person</th>
              <th>Company</th>
              <th>Estimated Value</th>
              <th>Stage</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let l of leads()">
              <td class="font-semibold">{{ l.title }}</td>
              <td>{{ l.contactName || '—' }}</td>
              <td>{{ l.company || '—' }}</td>
              <td class="font-semibold text-indigo-400">\${{ l.estimatedValue | number:'1.2-2' }}</td>
              <td><span class="badge badge-info">{{ l.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Customer Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="showCustomerModal()">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add New Client Account</h5>
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
    this.api.getCustomers(1, 50).subscribe({
      next: (res) => { if (res?.items) this.customers.set(res.items); },
      error: () => this.notify('CRM', 'Failed to load customers.', 'error')
    });
    this.api.getLeads(1, 50).subscribe({
      next: (res) => { if (res?.items) this.leads.set(res.items); },
      error: () => this.notify('CRM', 'Failed to load leads.', 'error')
    });
  }

  openCreateModal(): void {
    if (this.activeTab === 'customers') {
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
    this.api.createCustomer(this.newCust).subscribe({
      next: () => {
        this.showCustomerModal.set(false);
        this.loadData();
        this.notify('CRM', 'Customer saved successfully!', 'success');
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
