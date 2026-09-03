import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { Employee, Department, Designation, LinkableUser } from '../../core/models/erp.models';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header-row">
      <div>
        <h2>Employee Management</h2>
        <p class="text-sm text-gray-400">Manage company staff, designations, compensation and departments</p>
      </div>
      <button class="btn btn-primary" (click)="openCreateModal()">
        <span>+ Add New Employee</span>
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar erp-card">
      <div class="search-field">
        <input type="text" [ngModel]="searchTerm" (ngModelChange)="onSearch($event)" placeholder="Search by name, email, code..." class="form-control" />
      </div>
      <select [(ngModel)]="filterDeptId" (change)="loadEmployees()" class="form-select form-select-sm" style="max-width: 180px;">
        <option [ngValue]="null">All Departments</option>
        <option *ngFor="let d of departments()" [ngValue]="d.id">{{ d.name }}</option>
      </select>
      <select [(ngModel)]="filterStatus" (change)="loadEmployees()" class="form-select form-select-sm" style="max-width: 150px;">
        <option [ngValue]="null">All Statuses</option>
        <option [ngValue]="0">Active</option>
        <option [ngValue]="1">Inactive</option>
        <option [ngValue]="2">Terminated</option>
        <option [ngValue]="3">On Leave</option>
      </select>
      <button class="btn btn-sm btn-outline-secondary" (click)="clearFilters()" *ngIf="filterDeptId || filterStatus !== null">Clear</button>
      <button class="btn btn-sm btn-outline-primary ms-2" (click)="downloadCsv()" title="Export employees as CSV">📥 Export CSV</button>
      <div class="stats-counter ms-auto">
        Total Staff: <strong>{{ employees().length }}</strong>
      </div>
    </div>

    <!-- Data Table -->
    @if (loading()) {
    <div class="erp-table-container">
      @for (i of [1,2,3,4,5]; track i) {
        <div class="skeleton-row">
          <div class="skeleton skeleton-circle"></div>
          <div class="skeleton-text-group"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line narrow"></div>
          <div class="skeleton-line narrow"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line narrow"></div>
        </div>
      }
    </div>
    } @else {
    <div class="erp-table-container">
      <table class="erp-table">
        <thead>
          <tr>
            <th class="sortable" [class.active]="sortField() === 'employeeCode'" (click)="onSort('employeeCode')">Code <span class="sort-icon">{{ sortField() === 'employeeCode' ? (sortDir() === 'asc' ? '▲' : '▼') : '⇅' }}</span></th>
            <th class="sortable" [class.active]="sortField() === 'fullName'" (click)="onSort('fullName')">Employee Name <span class="sort-icon">{{ sortField() === 'fullName' ? (sortDir() === 'asc' ? '▲' : '▼') : '⇅' }}</span></th>
            <th>Email &amp; Phone</th>
            <th class="sortable" [class.active]="sortField() === 'departmentName'" (click)="onSort('departmentName')">Department <span class="sort-icon">{{ sortField() === 'departmentName' ? (sortDir() === 'asc' ? '▲' : '▼') : '⇅' }}</span></th>
            <th class="sortable" [class.active]="sortField() === 'designationTitle'" (click)="onSort('designationTitle')">Designation <span class="sort-icon">{{ sortField() === 'designationTitle' ? (sortDir() === 'asc' ? '▲' : '▼') : '⇅' }}</span></th>
            <th class="sortable" [class.active]="sortField() === 'basicSalary'" (click)="onSort('basicSalary')">Salary <span class="sort-icon">{{ sortField() === 'basicSalary' ? (sortDir() === 'asc' ? '▲' : '▼') : '⇅' }}</span></th>
            <th class="sortable" [class.active]="sortField() === 'status'" (click)="onSort('status')">Status <span class="sort-icon">{{ sortField() === 'status' ? (sortDir() === 'asc' ? '▲' : '▼') : '⇅' }}</span></th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let emp of sortedEmployees()">
            <td><span class="font-mono text-indigo-400">{{ emp.employeeCode }}</span></td>
            <td>
              <div class="emp-profile-cell">
                <div class="emp-avatar">{{ emp.firstName.charAt(0) }}</div>
                <div>
                  <div class="font-semibold">{{ emp.fullName }}</div>
                  <div class="text-xs text-gray-400">Joined: {{ emp.dateOfJoining | date:'mediumDate' }}</div>
                </div>
              </div>
            </td>
            <td>
              <div>{{ emp.email }}</div>
              <div class="text-xs text-gray-400">{{ emp.phone || 'N/A' }}</div>
            </td>
            <td><span class="badge badge-info">{{ emp.departmentName }}</span></td>
            <td>{{ emp.designationTitle }}</td>
            <td class="font-semibold">\${{ emp.basicSalary | number:'1.2-2' }}</td>
            <td>
              <span class="badge" [ngClass]="getStatusBadge(emp.status)">
                {{ emp.status }}
              </span>
            </td>
            <td>
              <div class="action-btn-group">
                <button class="btn btn-sm btn-secondary" (click)="openEdit(emp)" title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" (click)="deleteEmployee(emp.id)">Delete</button>
              </div>
            </td>
          </tr>

          <tr *ngIf="sortedEmployees().length === 0">
            <td colspan="8" class="text-center py-8">
              <div class="empty-state-card">
                <div class="empty-state-icon">📭</div>
                <div class="font-semibold">No employees found</div>
                <div class="text-sm text-gray-400">Adjust your search or filters to see more results.</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    }

    <!-- Create Employee Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="showModal()">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingId() ? 'Edit Employee — ' + editingCode : 'Add New Staff Member' }}</h5>
            <button type="button" class="btn-close btn-close-white" (click)="closeModal()"></button>
          </div>
          <form (ngSubmit)="saveEmployee()">
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label small">First Name *</label>
                  <input type="text" [(ngModel)]="newEmp.firstName" name="fn" required class="form-control" placeholder="e.g. Ahmed" />
                </div>
                <div class="col-md-6">
                  <label class="form-label small">Last Name *</label>
                  <input type="text" [(ngModel)]="newEmp.lastName" name="ln" required class="form-control" placeholder="e.g. Raza" />
                </div>
                <div class="col-md-6">
                  <label class="form-label small">Email Address *</label>
                  <input type="email" [(ngModel)]="newEmp.email" name="em" required class="form-control"
                         placeholder="name@company.com" [disabled]="!!editingId()" />
                </div>
                <div class="col-md-6">
                  <label class="form-label small">Phone</label>
                  <input type="text" [(ngModel)]="newEmp.phone" name="ph" class="form-control" placeholder="+92 300 1234567" />
                </div>
                <div class="col-md-4">
                  <label class="form-label small">Date of Birth *</label>
                  <input type="date" [(ngModel)]="newEmp.dateOfBirth" name="dob" required class="form-control" />
                </div>
                <div class="col-md-4">
                  <label class="form-label small">Date of Joining *</label>
                  <input type="date" [(ngModel)]="newEmp.dateOfJoining" name="doj" required class="form-control" />
                </div>
                <div class="col-md-4">
                  <label class="form-label small">Gender *</label>
                  <select [(ngModel)]="newEmp.gender" name="gr" required class="form-select">
                    <option [value]="0">Male</option>
                    <option [value]="1">Female</option>
                    <option [value]="2">Other</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label small">Basic Salary ($) *</label>
                  <input type="number" [(ngModel)]="newEmp.basicSalary" name="bs" required min="1" class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label small">City</label>
                  <input type="text" [(ngModel)]="newEmp.city" name="ct" class="form-control" placeholder="e.g. Karachi" />
                </div>
                <div class="col-md-6">
                  <label class="form-label small">Department *</label>
                  <select [(ngModel)]="newEmp.departmentId" name="dept" required class="form-select" (change)="loadDesignationsForDept()">
                    <option *ngFor="let d of departments()" [value]="d.id">{{ d.name }}</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label small">Designation *</label>
                  <select [(ngModel)]="newEmp.designationId" name="desig" required class="form-select">
                    <option *ngFor="let des of designations()" [value]="des.id">{{ des.title }}</option>
                  </select>
                </div>
                @if (!editingId()) {
                  <div class="col-md-6">
                    <label class="form-label small">Link Login Account</label>
                    <select [(ngModel)]="newEmp.applicationUserId" name="usr" class="form-select">
                      <option value="">— No login (HR marks attendance) —</option>
                      <option *ngFor="let u of linkableUsers()" [value]="u.id" [disabled]="u.isLinked">
                        {{ u.fullName }} ({{ u.role }}){{ u.isLinked ? ' • already linked' : '' }}
                      </option>
                    </select>
                    <small class="form-hint">Optional — linked employees can clock in from the header.</small>
                  </div>
                  <div class="col-md-6" *ngIf="!newEmp.applicationUserId">
                    <label class="form-label small">
                      <input type="checkbox" [(ngModel)]="newEmp.createLogin" name="cl" class="form-check-input me-1" />
                      Auto-create login account
                    </label>
                     <input type="text" *ngIf="newEmp.createLogin" [(ngModel)]="newEmp.newPassword" (ngModelChange)="onPasswordInput($event)" name="npwd"
                            class="form-control form-control-sm mt-1" placeholder="Login password (min 6 chars)" />
                     <div class="password-strength mt-1" *ngIf="newEmp.newPassword">
                       <div class="strength-bar" *ngFor="let s of [1,2,3,4,5]" [class.active]="passwordStrength() >= s" [style.background-color]="passwordStrength() >= s ? strengthColor(s) : 'var(--bg-tertiary)'"></div>
                       <small class="form-hint" [style.color]="strengthColor(passwordStrength())">{{ strengthLabel() }}</small>
                     </div>
                     <small class="form-hint">Creates a system user (Employee role) with this password.</small>
                   </div>
                }
                <div class="col-md-6">
                  <label class="form-label small">Reporting Manager</label>
                  <select [(ngModel)]="newEmp.managerId" name="mgr" class="form-select">
                    <option value="">— None —</option>
                    <option *ngFor="let e of employees()" [value]="e.id" [disabled]="e.id === editingId()">
                      {{ e.employeeCode }} — {{ e.fullName }}
                    </option>
                  </select>
                </div>
                @if (editingId()) {
                  <div class="col-md-6">
                    <label class="form-label small">Employment Status *</label>
                    <select [(ngModel)]="newEmp.statusIndex" name="st" required class="form-select">
                      <option [ngValue]="0">Active</option>
                      <option [ngValue]="1">Inactive</option>
                      <option [ngValue]="2">Terminated</option>
                      <option [ngValue]="3">On Leave</option>
                    </select>
                    <small class="form-hint">Terminated = employee exit; linked login account is deactivated automatically.</small>
                  </div>
                }
              </div>
              <p class="form-hint mt-2 mb-0">* Required fields. Employee code is generated automatically.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ saving() ? 'Saving...' : (editingId() ? 'Save Changes' : 'Create Employee') }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .emp-profile-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .emp-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--accent-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      color: #10141f;
      flex-shrink: 0;
    }

    .font-mono { font-family: var(--font-mono); }
    .text-sm { font-size: 13px; }
    .text-xs { font-size: 11px; }
    .text-gray-400 { color: var(--text-secondary); }
    .text-indigo-400 { color: #ededed; }
    .text-center { text-align: center; }
    .py-8 { padding-top: 32px; padding-bottom: 32px; }

    .empty-state-card {
      padding: 40px 16px;
      text-align: center;
    }

    .empty-state-icon {
      font-size: 40px;
      margin-bottom: 12px;
    }

    .password-strength {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 6px;
    }

    .strength-bar {
      height: 4px;
      flex: 1;
      border-radius: 2px;
      background: var(--bg-tertiary);
      transition: background 0.2s;
    }

    @media (max-width: 767.98px) {
      .page-header-row {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class EmployeesComponent implements OnInit {
  private api = inject(ApiService);
  private notifications = inject(NotificationService);

  employees = signal<Employee[]>([]);
  departments = signal<Department[]>([]);
  designations = signal<Designation[]>([]);
  linkableUsers = signal<LinkableUser[]>([]);
  searchTerm = '';
  showModal = signal(false);
  saving = signal(false);
  editingId = signal<string | null>(null);
  editingCode = '';
  loading = signal(true);
  sortField = signal<string>('employeeCode');
  sortDir = signal<'asc' | 'desc'>('asc');

  private searchTimer: any;

  newEmp: any = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '1995-01-01',
    dateOfJoining: new Date().toISOString().split('T')[0],
    gender: 0,
    basicSalary: 65000,
    city: '',
    country: 'Pakistan',
    departmentId: '',
    designationId: '',
    applicationUserId: '',
    createLogin: false,
    newPassword: ''
  };

  filterDeptId: string | null = null;
  filterStatus: number | null = null;

  sortedEmployees = computed(() => {
    const list = this.employees();
    const field = this.sortField();
    const dir = this.sortDir();
    return [...list].sort((a, b) => {
      const va = (a as any)[field] ?? '';
      const vb = (b as any)[field] ?? '';
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  onSort(field: string): void {
    if (this.sortField() === field) {
      this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDir.set('asc');
    }
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.loadMetadata();
  }

  clearFilters(): void {
    this.filterDeptId = null;
    this.filterStatus = null;
    this.loadEmployees();
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadEmployees(), 400);
  }

  loadEmployees(): void {
    this.loading.set(true);
    this.api.getEmployees(1, 50, this.searchTerm, this.filterDeptId || undefined, this.filterStatus).subscribe({
      next: (res) => {
        if (res?.items) { this.employees.set(res.items); this.loading.set(false); }
        else this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.notifications.addNotification({
        id: Math.random().toString(),
        title: 'Employees',
        message: 'Failed to load employees.',
        type: 'error',
        timestamp: new Date()
      }) }
    });
  }

  loadMetadata(): void {
    this.api.getDepartments().subscribe({
      next: (depts) => {
        this.departments.set(depts);
        if (depts.length > 0 && !this.newEmp.departmentId) {
          this.newEmp.departmentId = depts[0].id;
          this.loadDesignationsForDept();
        }
      }
    });
    this.api.getDesignations().subscribe({
      next: (desigs) => {
        this.designations.set(desigs);
        if (desigs.length > 0 && !this.newEmp.designationId) {
          this.newEmp.designationId = desigs[0].id;
        }
      }
    });
  }

  loadDesignationsForDept(): void {
    const deptId = this.newEmp.departmentId;
    if (!deptId) return;
    this.api.getDesignationsByDepartment(deptId).subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : [];
        this.designations.set(list);
        if (list.length > 0 && !list.some((d: Designation) => d.id === this.newEmp.designationId)) {
          this.newEmp.designationId = list[0].id;
        }
      }
    });
  }

  openCreateModal(): void {
    this.resetForm();
    this.editingId.set(null);
    this.editingCode = '';
    this.showModal.set(true);
    this.api.getLinkableUsers().subscribe({
      next: (users) => this.linkableUsers.set(Array.isArray(users) ? users : [])
    });
  }

  openEdit(emp: Employee): void {
    this.editingId.set(emp.id);
    this.editingCode = emp.employeeCode;
    const statusMap: Record<string, number> = { Active: 0, Inactive: 1, Terminated: 2, OnLeave: 3 };
    this.newEmp = {
      ...this.newEmp,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || '',
      basicSalary: emp.basicSalary,
      city: '',
      departmentId: '',
      designationId: '',
      managerId: (emp as any).managerId || '',
      applicationUserId: '',
      statusIndex: statusMap[emp.status] ?? 0
    };
    // resolve department/designation ids from loaded metadata by name
    const dept = this.departments().find(d => d.name === emp.departmentName);
    if (dept) {
      this.newEmp.departmentId = dept.id;
      this.api.getDesignationsByDepartment(dept.id).subscribe({
        next: (res) => {
          const list = Array.isArray(res) ? res : [];
          this.designations.set(list);
          const desig = list.find((d: Designation) => d.title === emp.designationTitle);
          this.newEmp.designationId = desig?.id || list[0]?.id || '';
        }
      });
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
    this.editingCode = '';
  }

  resetForm(): void {
    this.newEmp = {
      ...this.newEmp,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '1995-01-01',
      dateOfJoining: new Date().toISOString().split('T')[0],
      gender: 0,
      basicSalary: 65000,
      city: '',
      applicationUserId: ''
    };
  }

  private notify(title: string, message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
    this.notifications.addNotification({
      id: Math.random().toString(),
      title,
      message,
      type,
      timestamp: new Date()
    });
  }

  saveEmployee(): void {
    if (!this.newEmp.firstName || !this.newEmp.lastName || !this.newEmp.email) {
      this.notify('Employees', 'Please fill all required fields.', 'warning');
      return;
    }

    if (this.editingId()) {
      this.saving.set(true);
      const payload = {
        firstName: this.newEmp.firstName,
        lastName: this.newEmp.lastName,
        phone: this.newEmp.phone || null,
        dateOfBirth: this.newEmp.dateOfBirth || '1995-01-01',
        gender: Number(this.newEmp.gender) || 0,
        address: null,
        city: this.newEmp.city || null,
        country: 'Pakistan',
        basicSalary: Number(this.newEmp.basicSalary) || 0,
        departmentId: this.newEmp.departmentId,
        designationId: this.newEmp.designationId,
        status: Number(this.newEmp.statusIndex ?? 0),
        managerId: this.newEmp.managerId || null
      };
      this.api.updateEmployee(this.editingId()!, payload).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.closeModal();
          this.loadEmployees();
          this.notify('Employees', res?.message || 'Employee updated successfully!', 'success');
        },
        error: (err) => {
          this.saving.set(false);
          const errors = err?.error?.errors;
          const firstError = errors ? Object.values(errors)[0] : null;
          const msg = firstError
            ? `${Object.keys(errors)[0]}: ${Array.isArray(firstError) ? firstError[0] : firstError}`
            : (err?.error?.message || 'Update failed.');
          this.notify('Employees', msg, 'error');
        }
      });
      return;
    }

    this.saving.set(true);
    const createPayload: any = { ...this.newEmp, applicationUserId: this.newEmp.applicationUserId || null };
    if (createPayload.createLogin && createPayload.newPassword && createPayload.newPassword.length >= 6) {
      createPayload.newUserPassword = createPayload.newPassword;
    }
    delete createPayload.createLogin;
    delete createPayload.newPassword;
    this.api.createEmployee(createPayload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.closeModal();
        this.loadEmployees();
        this.notify('Employees', res?.message || 'Employee created successfully!', 'success');
      },
      error: (err) => {
        this.saving.set(false);
        const errors = err?.error?.errors;
        const firstError = errors ? Object.values(errors)[0] : null;
        const msg = firstError
          ? `${Object.keys(errors)[0]}: ${Array.isArray(firstError) ? firstError[0] : firstError}`
          : err?.error?.message || 'Could not create employee.';
        this.notify('Employees', msg, 'error');
      }
    });
  }

  deleteEmployee(id: string): void {
    if (!confirm('Are you sure you want to remove this employee?')) return;
    this.api.deleteEmployee(id).subscribe({
      next: () => {
        this.loadEmployees();
        this.notify('Employees', 'Employee deleted.', 'info');
      },
      error: () => this.notify('Employees', 'Could not delete employee.', 'error')
    });
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'Active': return 'badge-success';
      case 'OnLeave': return 'badge-warning';
      case 'Terminated': return 'badge-danger';
      default: return 'badge-neutral';
    }
  }

  downloadCsv(): void {
    const emps = this.employees();
    if (emps.length === 0) { this.notify('Employees', 'No data to export.', 'warning'); return; }
    const headers = ['Code', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Salary', 'Status', 'Joined'];
    const rows = emps.map(e => [
      e.employeeCode, e.fullName, e.email, e.phone || '', e.departmentName, e.designationTitle,
      String(e.basicSalary), e.status, e.dateOfJoining ? new Date(e.dateOfJoining).toLocaleDateString('en-GB') : ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `employees_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    this.notify('Employees', `${emps.length} employees exported.`, 'success');
  }

  passwordStrength = signal(0);

  onPasswordInput(pw: string): void {
    const s = pw || '';
    let sc = 0;
    if (s.length >= 6) sc++;
    if (s.length >= 10) sc++;
    if (/[A-Z]/.test(s)) sc++;
    if (/[0-9]/.test(s)) sc++;
    if (/[^A-Za-z0-9]/.test(s)) sc++;
    this.passwordStrength.set(sc);
  }

  strengthLabel(): string {
    const l = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    return l[this.passwordStrength()] || '';
  }

  strengthColor(lvl: number): string {
    const c = ['', '#e74c3c', '#e74c3c', '#f39c12', '#2ecc71', '#2ecc71'];
    return c[lvl] || 'transparent';
  }
}
