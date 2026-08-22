import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { UserAccount } from '../../core/models/erp.models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header-row">
      <div>
        <h2>User Management</h2>
        <p class="text-sm text-gray-400">Create accounts, manage roles, activate / deactivate users</p>
      </div>
      <button class="btn btn-primary" (click)="openCreateModal()">
        <i class="bi bi-person-plus me-1"></i> New User
      </button>
    </div>

    <div class="filter-bar">
      <input type="text" class="form-control" placeholder="Search by name or email..."
             [ngModel]="searchTerm" [ngModelOptions]="{ standalone: true }" (ngModelChange)="onSearch($event)" />
    </div>

    <div class="erp-table-container">
      <table class="erp-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Employee Profile</th>
            <th>Last Login</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (u of users(); track u.id) {
            <tr>
              <td class="font-semibold">{{ u.fullName }}</td>
              <td>{{ u.email }}</td>
              <td><span class="badge" [ngClass]="roleBadgeClass(u.role)">{{ u.role }}</span></td>
              <td>
                <span class="badge badge-success" *ngIf="u.isActive">Active</span>
                <span class="badge badge-danger" *ngIf="!u.isActive">Deactivated</span>
                <span class="badge badge-warning ms-1" *ngIf="u.lockedOutUntil && isLocked(u)">Locked</span>
              </td>
              <td>
                <span class="badge badge-success" *ngIf="u.isLinkedToEmployee">Linked</span>
                <span class="text-gray-500 text-sm" *ngIf="!u.isLinkedToEmployee">—</span>
              </td>
              <td class="text-sm text-gray-400">{{ u.lastLoginAt ? (u.lastLoginAt | date: 'MMM d, h:mm a') : 'Never' }}</td>
              <td>
                <div class="action-btn-group">
                  <button class="btn btn-sm btn-secondary" (click)="openRoleModal(u)" title="Change role">
                    <i class="bi bi-person-gear"></i>
                  </button>
                  <button class="btn btn-sm btn-secondary" (click)="openResetModal(u)" title="Reset password">
                    <i class="bi bi-key"></i>
                  </button>
                  @if (u.isActive) {
                    <button class="btn btn-sm btn-danger-soft" (click)="toggleStatus(u, false)" title="Deactivate"
                            [disabled]="isLastAdmin(u)">
                      <i class="bi bi-person-slash"></i>
                    </button>
                  } @else {
                    <button class="btn btn-sm btn-success-soft" (click)="toggleStatus(u, true)" title="Activate">
                      <i class="bi bi-person-check"></i>
                    </button>
                  }
                </div>
              </td>
            </tr>
          }

          <tr *ngIf="users().length === 0">
            <td colspan="7" class="text-center py-8 text-gray-400">No users found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create User Modal -->
    @if (showCreateModal()) {
      <div class="modal d-block" tabindex="-1" (click)="closeOnBackdrop($event)">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-person-plus me-2"></i>Create User Account</h5>
              <button type="button" class="btn-close btn-close-white" (click)="showCreateModal.set(false)"></button>
            </div>
            <form (ngSubmit)="createUser()">
              <div class="modal-body form-grid two-col">
                <div>
                  <label class="form-label small">First Name *</label>
                  <input type="text" [(ngModel)]="newUser.firstName" name="ufn" required class="form-control" />
                </div>
                <div>
                  <label class="form-label small">Last Name *</label>
                  <input type="text" [(ngModel)]="newUser.lastName" name="uln" required class="form-control" />
                </div>
                <div>
                  <label class="form-label small">Email *</label>
                  <input type="email" [(ngModel)]="newUser.email" name="uem" required class="form-control" placeholder="name@company.com" />
                </div>
                <div>
                  <label class="form-label small">Password *</label>
                  <input type="password" [(ngModel)]="newUser.password" name="upw" required class="form-control" placeholder="Min 8 chars, Aa1!" />
                </div>
                <div>
                  <label class="form-label small">Role *</label>
                  <select [(ngModel)]="newUser.role" name="urole" required class="form-select">
                    <option value="HR">HR</option>
                    <option value="Manager">Manager</option>
                    <option value="Employee">Employee</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <small class="form-hint">Password rule: 8+ chars with uppercase, lowercase, number &amp; special character.</small>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showCreateModal.set(false)">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ saving() ? 'Creating...' : 'Create User' }}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }

    <!-- Change Role Modal -->
    @if (selectedUser()) {
      @if (showRoleModal()) {
        <div class="modal d-block" tabindex="-1" (click)="closeOnBackdrop($event)">
          <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Change Role</h5>
                <button type="button" class="btn-close btn-close-white" (click)="showRoleModal.set(false)"></button>
              </div>
              <div class="modal-body">
                <p class="text-sm text-gray-400">{{ selectedUser()?.fullName }} ({{ selectedUser()?.email }})</p>
                <select [(ngModel)]="newRole" name="chgRole" class="form-select">
                  <option value="HR">HR</option>
                  <option value="Manager">Manager</option>
                  <option value="Employee">Employee</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showRoleModal.set(false)">Cancel</button>
                <button type="button" class="btn btn-primary" [disabled]="saving()" (click)="changeRole()">Update Role</button>
              </div>
            </div>
          </div>
        </div>
      }

      @if (showResetModal()) {
        <div class="modal d-block" tabindex="-1" (click)="closeOnBackdrop($event)">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title"><i class="bi bi-key me-2"></i>Force Reset Password</h5>
                <button type="button" class="btn-close btn-close-white" (click)="showResetModal.set(false)"></button>
              </div>
              <div class="modal-body">
                <p class="text-sm text-gray-400">
                  Set a new password for <strong>{{ selectedUser()?.email }}</strong>.
                  Their current sessions will be logged out.
                </p>
                <input type="password" [(ngModel)]="resetPassword" name="rpw" class="form-control"
                       placeholder="New password (8+ chars, Aa1!)" />
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showResetModal.set(false)">Cancel</button>
                <button type="button" class="btn btn-primary" [disabled]="saving()" (click)="resetPasswordAction()">Reset Password</button>
              </div>
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .page-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .font-semibold { font-weight: 600; }
    .text-sm { font-size: 13px; }
    .text-gray-400 { color: var(--text-secondary); }
    .text-gray-500 { color: var(--text-muted); }
    .text-center { text-align: center; }
    .py-8 { padding-top: 32px; padding-bottom: 32px; }

    .badge.role-admin { background: rgba(239, 68, 68, 0.15); color: #f87171; }
    .badge.role-hr { background: rgba(168, 85, 247, 0.15); color: #c084fc; }
    .badge.role-manager { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
    .badge.role-employee { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; }

    .btn-danger-soft {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #f87171;
    }

    .btn-success-soft {
      background: rgba(34, 197, 94, 0.12);
      border: 1px solid rgba(34, 197, 94, 0.35);
      color: #4ade80;
    }

    @media (max-width: 767px) {
      .page-header-row { flex-direction: column; align-items: flex-start; gap: 12px; }
    }
  `]
})
export class UsersComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  users = signal<UserAccount[]>([]);
  searchTerm = '';
  saving = signal(false);

  showCreateModal = signal(false);
  showRoleModal = signal(false);
  showResetModal = signal(false);
  selectedUser = signal<UserAccount | null>(null);

  newUser = { firstName: '', lastName: '', email: '', password: '', role: 'Employee' };
  newRole = 'Employee';
  resetPassword = '';

  private searchTimer: any;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.api.getUsers(1, 50, this.searchTerm).subscribe({
      next: (res) => { if (res?.items) this.users.set(res.items); }
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadUsers(), 400);
  }

  openCreateModal(): void {
    this.newUser = { firstName: '', lastName: '', email: '', password: '', role: 'Employee' };
    this.showCreateModal.set(true);
  }

  openRoleModal(u: UserAccount): void {
    this.selectedUser.set(u);
    this.newRole = u.role;
    this.showRoleModal.set(true);
  }

  openResetModal(u: UserAccount): void {
    this.selectedUser.set(u);
    this.resetPassword = '';
    this.showResetModal.set(true);
  }

  closeOnBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.showCreateModal.set(false);
      this.showRoleModal.set(false);
      this.showResetModal.set(false);
      this.selectedUser.set(null);
    }
  }

  createUser(): void {
    const n = this.newUser;
    if (!n.firstName || !n.lastName || !n.email || !n.password) {
      this.toast.warning('Users', 'Please fill all required fields.');
      return;
    }
    if (!/[A-Z]/.test(n.password) || !/[a-z]/.test(n.password) || !/[0-9]/.test(n.password) || !/[^a-zA-Z0-9]/.test(n.password) || n.password.length < 8) {
      this.toast.warning('Users', 'Password must be 8+ chars with uppercase, lowercase, number & special character.');
      return;
    }

    this.saving.set(true);
    this.api.createUser(this.newUser).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.showCreateModal.set(false);
        this.toast.success('Users', res?.message || 'User created successfully!');
        this.loadUsers();
      },
      error: () => this.saving.set(false)
    });
  }

  changeRole(): void {
    const u = this.selectedUser();
    if (!u) return;

    this.saving.set(true);
    this.api.changeUserRole(u.id, this.newRole).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.showRoleModal.set(false);
        this.selectedUser.set(null);
        this.toast.success('Users', res?.data || 'Role updated.');
        this.loadUsers();
      },
      error: () => this.saving.set(false)
    });
  }

  toggleStatus(u: UserAccount, isActive: boolean): void {
    this.api.setUserStatus(u.id, isActive).subscribe({
      next: (res) => {
        this.toast.success('Users', res?.data || 'Status updated.');
        this.loadUsers();
      }
    });
  }

  resetPasswordAction(): void {
    const u = this.selectedUser();
    if (!u || !this.resetPassword) {
      this.toast.warning('Users', 'Please enter a new password.');
      return;
    }
    if (!/[A-Z]/.test(this.resetPassword) || !/[a-z]/.test(this.resetPassword) || !/[0-9]/.test(this.resetPassword) || !/[^a-zA-Z0-9]/.test(this.resetPassword) || this.resetPassword.length < 8) {
      this.toast.warning('Users', 'Password must be 8+ chars with uppercase, lowercase, number & special character.');
      return;
    }

    this.saving.set(true);
    this.api.adminResetPassword(u.id, this.resetPassword).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.showResetModal.set(false);
        this.selectedUser.set(null);
        this.toast.success('Users', res?.data || 'Password reset successfully.');
      },
      error: () => this.saving.set(false)
    });
  }

  isLocked(u: UserAccount): boolean {
    return !!u.lockedOutUntil && new Date(u.lockedOutUntil).getTime() > Date.now();
  }

  isLastAdmin(u: UserAccount): boolean {
    return u.role === 'Admin' && this.users().filter(x => x.role === 'Admin' && x.isActive).length === 1;
  }

  roleBadgeClass(role: string): string {
    return 'badge role-' + role.toLowerCase();
  }
}
