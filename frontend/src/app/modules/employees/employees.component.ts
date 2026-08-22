import { Component, OnInit, inject, signal } from '@angular/core';
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
      <div class="stats-counter ms-auto">
        Total Staff: <strong>{{ employees().length }}</strong>
      </div>
    </div>

    <!-- Data Table -->
    <div class="erp-table-container">
      <table class="erp-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Employee Name</th>
            <th>Email &amp; Phone</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Basic Salary</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let emp of employees()">
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

          <tr *ngIf="employees().length === 0">
            <td colspan="8" class="text-center py-8 text-gray-400">
              No employees found matching your criteria.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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
                    <input type="text" *ngIf="newEmp.createLogin" [(ngModel)]="newEmp.newPassword" name="npwd"
                           class="form-control form-control-sm mt-1" placeholder="Login password (min 6 chars)" />
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
    this.api.getEmployees(1, 50, this.searchTerm, this.filterDeptId || undefined, this.filterStatus).subscribe({
      next: (res) => {
        if (res?.items) this.employees.set(res.items);
      },
      error: () => this.notifications.addNotification({
        id: Math.random().toString(),
        title: 'Employees',
        message: 'Failed to load employees.',
        type: 'error',
        timestamp: new Date()
      })
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
}
