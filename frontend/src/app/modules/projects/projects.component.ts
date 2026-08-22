import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, ProjectTask, Employee, Customer } from '../../core/models/erp.models';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 class="h3 mb-1"><i class="bi bi-kanban me-2 text-primary"></i>Projects &amp; Tasks</h2>
        <p class="text-secondary small mb-0">Kanban task board, project milestones, budgets, and team allocations</p>
      </div>
      <button class="btn btn-primary" (click)="showProjectModal.set(true)">
        <i class="bi bi-plus-circle me-1"></i> New Project
      </button>
    </div>

    <!-- Filters -->
    <div class="card p-2 px-3 mb-3 d-flex flex-row align-items-center gap-3 flex-wrap">
      <div class="d-flex align-items-center gap-2">
        <span class="small text-secondary">Status:</span>
        <select [(ngModel)]="filterStatus" (change)="filterStatus.set($any($event.target).value)" class="form-select form-select-sm" style="max-width: 140px;">
          <option value="">All</option>
          <option value="0">Planning</option>
          <option value="1">Active</option>
          <option value="2">On Hold</option>
          <option value="3">Completed</option>
          <option value="4">Cancelled</option>
        </select>
      </div>
      <div class="form-check form-switch mb-0">
        <input type="checkbox" class="form-check-input" id="ovrOnly" [checked]="overdueOnly()" (change)="overdueOnly.set(!overdueOnly())" />
        <label class="form-check-label small" for="ovrOnly">Overdue only</label>
      </div>
      <span class="ms-auto small text-secondary">{{ filteredProjects().length }} project(s)</span>
    </div>

    <!-- Active Projects Selector Strip -->
    <div class="row g-3 mb-4">
      <div class="col-md-4" *ngFor="let p of filteredProjects()">
        <div class="card p-3 h-100 cursor-pointer" [class.border-primary]="selectedProject()?.id === p.id" (click)="selectProject(p)">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="card-title h6 mb-0">{{ p.name }}</h5>
            <span class="badge bg-primary">{{ statusLabel(p.status) }}</span>
          </div>
          <p class="text-secondary small mb-3 text-truncate">{{ p.description || 'Enterprise project workflow' }}</p>
          <div *ngIf="isOverdue(p)" class="alert alert-danger py-1 px-2 small mb-2">
            <i class="bi bi-exclamation-triangle-fill me-1"></i>Overdue — deadline passed
          </div>
          <div *ngIf="budgetExceeded(p)" class="alert alert-warning py-1 px-2 small mb-2">
            <i class="bi bi-cash-coin me-1"></i>Budget exceeded by \${{ p.actualCost - p.budget | number:'1.0-0' }}
          </div>
          <div class="d-flex justify-content-between text-secondary small mb-1">
            <span>Progress: {{ p.progress }}%</span>
            <span>Spent: \${{ p.actualCost | number:'1.0-0' }} / \${{ p.budget | number:'1.0-0' }}</span>
          </div>
          <div class="progress mb-2" style="height: 6px;">
            <div class="progress-bar bg-primary" [style.width.%]="p.progress"></div>
          </div>
          <div class="progress" style="height: 4px;" *ngIf="p.budget > 0">
            <div class="progress-bar" [class.bg-success]="p.actualCost <= p.budget" [class.bg-danger]="p.actualCost > p.budget" [style.width.%]="(p.actualCost / p.budget) * 100"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Project Summary Report -->
    <div class="card p-3 mb-3" *ngIf="selectedProject()">
      <h5 class="h6 mb-3"><i class="bi bi-file-earmark-bar-graph me-2"></i>Project Summary — {{ selectedProject()?.name }}</h5>
      <div class="row g-3 text-center">
        <div class="col">
          <div class="metric-value h5 mb-0">{{ tasks().length }}</div>
          <div class="metric-title small">Total Tasks</div>
        </div>
        <div class="col">
          <div class="h5 mb-0 text-secondary">{{ getTasksByStatus('Todo').length }}</div>
          <div class="metric-title small">To Do</div>
        </div>
        <div class="col">
          <div class="h5 mb-0 text-primary">{{ getTasksByStatus('InProgress').length + getTasksByStatus('Review').length }}</div>
          <div class="metric-title small">In Flight</div>
        </div>
        <div class="col">
          <div class="h5 mb-0 text-success">{{ getTasksByStatus('Done').length }}</div>
          <div class="metric-title small">Done</div>
        </div>
        <div class="col">
          <div class="h5 mb-0" [class.text-danger]="isOverdue(selectedProject()!)" [class.text-success]="!isOverdue(selectedProject()!)">{{ daysRemaining(selectedProject()!) }}</div>
          <div class="metric-title small">{{ isOverdue(selectedProject()!) ? 'Days Overdue' : 'Days Left' }}</div>
        </div>
        <div class="col">
          <div class="h5 mb-0" [class.text-danger]="budgetExceeded(selectedProject()!)" [class.text-success]="!budgetExceeded(selectedProject()!)">{{ budgetUsage(selectedProject()!) }}%</div>
          <div class="metric-title small">Budget Used</div>
        </div>
      </div>
    </div>

    <!-- Kanban Board Header -->
    <div class="d-flex justify-content-between align-items-center mb-3" *ngIf="selectedProject()">
      <h4 class="h5 mb-0">Task Board: <span class="text-primary">{{ selectedProject()?.name }}</span></h4>
      <button class="btn btn-sm btn-outline-light" (click)="openCreateTask()">
        <i class="bi bi-plus-lg me-1"></i> Add Task
      </button>
    </div>

    <!-- Project Status / Progress Controls -->
    <div class="card p-3 mb-3" *ngIf="selectedProject()">
      <div class="row g-2 align-items-end">
        <div class="col-md-2">
          <label class="form-label small mb-1">Status</label>
          <select [(ngModel)]="projForm.status" class="form-select form-select-sm">
            <option [ngValue]="0">Planning</option>
            <option [ngValue]="1">Active</option>
            <option [ngValue]="2">On Hold</option>
            <option [ngValue]="3">Completed</option>
            <option [ngValue]="4">Cancelled</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label small mb-1">Progress % (0–100)</label>
          <input type="number" min="0" max="100" [(ngModel)]="projForm.progress" class="form-control form-control-sm" />
        </div>
        <div class="col-md-2">
          <label class="form-label small mb-1">Deadline (End Date)</label>
          <input type="date" [(ngModel)]="projForm.endDate" class="form-control form-control-sm" />
          <small class="text-secondary" style="font-size: 11px;">Extend deadline here when needed</small>
        </div>
        <div class="col-md-2">
          <label class="form-label small mb-1">Budget ($)</label>
          <input type="number" min="0" [(ngModel)]="projForm.budget" class="form-control form-control-sm" />
        </div>
        <div class="col-md-2">
          <label class="form-label small mb-1">Project Manager</label>
          <select [(ngModel)]="projForm.managerId" class="form-select form-select-sm">
            <option [ngValue]="null">— None —</option>
            <option *ngFor="let e of employees()" [ngValue]="e.id">{{ e.fullName }}</option>
          </select>
        </div>
        <div class="col-md-2">
          <button class="btn btn-sm btn-primary w-100" (click)="saveProjectUpdates()" [disabled]="savingProject()">
            <span class="spinner-border spinner-border-sm me-1" *ngIf="savingProject()"></span>
            Update Project
          </button>
        </div>
      </div>
      <div class="small text-secondary mt-2">
        <i class="bi bi-info-circle me-1"></i>Archive/Close = set status Completed. Cancel = set status Cancelled.
      </div>
    </div>

    <!-- Kanban Columns (Bootstrap Grid, drag & drop) -->
    <div class="row g-3" *ngIf="selectedProject()">
      <!-- Todo Column -->
      <div class="col-md-3">
        <div class="card bg-dark bg-opacity-50 p-3 h-100" (dragover)="onDragOver($event)" (drop)="onDrop($event, 'Todo')">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="fw-bold small text-secondary">TO DO</span>
            <span class="badge bg-secondary rounded-pill">{{ getTasksByStatus('Todo').length }}</span>
          </div>
          <div class="d-flex flex-column gap-2">
            <div class="card p-3 shadow-sm border-0 kanban-card" draggable="true" (dragstart)="onDragStart($event, t)"
                 *ngFor="let t of getTasksByStatus('Todo')">
              <div class="d-flex justify-content-between mb-1">
                <span class="badge small" [class.bg-warning]="t.priority === 'High'" [class.bg-danger]="t.priority === 'Critical'" [class.bg-info]="t.priority === 'Medium'" [class.bg-secondary]="t.priority === 'Low'">{{ t.priority }}</span>
                <span class="text-secondary small">{{ t.estimatedHours }}h</span>
              </div>
              <div class="fw-semibold small mb-2">{{ t.title }}</div>
              <div class="d-flex justify-content-between align-items-center">
                <span class="text-muted small"><i class="bi bi-clock me-1"></i>{{ t.dueDate ? (t.dueDate | date:'MMM d') : 'No date' }}</span>
                <span>
                  <button class="btn btn-sm btn-outline-primary py-0 px-1" title="Move to In Progress" (click)="moveTask(t, 'InProgress')">→</button>
                  <button class="btn btn-sm btn-outline-secondary py-0 px-1 ms-1" title="Clone task" *ngIf="canManageTasks()" (click)="cloneTask(t)"><i class="bi bi-copy"></i></button>
                  <button class="btn btn-sm btn-outline-danger py-0 px-1 ms-1" title="Delete task" *ngIf="canManageTasks()" (click)="deleteTask(t)">✕</button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- In Progress Column -->
      <div class="col-md-3">
        <div class="card bg-dark bg-opacity-50 p-3 h-100" (dragover)="onDragOver($event)" (drop)="onDrop($event, 'InProgress')">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="fw-bold small text-primary">IN PROGRESS</span>
            <span class="badge bg-primary rounded-pill">{{ getTasksByStatus('InProgress').length }}</span>
          </div>
          <div class="d-flex flex-column gap-2">
            <div class="card p-3 shadow-sm border-0 kanban-card" draggable="true" (dragstart)="onDragStart($event, t)"
                 *ngFor="let t of getTasksByStatus('InProgress')">
              <div class="d-flex justify-content-between mb-1">
                <span class="badge small" [class.bg-warning]="t.priority === 'High'" [class.bg-danger]="t.priority === 'Critical'" [class.bg-info]="t.priority === 'Medium'" [class.bg-secondary]="t.priority === 'Low'">{{ t.priority }}</span>
                <span class="text-secondary small">{{ t.estimatedHours }}h</span>
              </div>
              <div class="fw-semibold small mb-2">{{ t.title }}</div>
              <div class="d-flex justify-content-between align-items-center">
                <button class="btn btn-sm btn-outline-secondary py-0 px-1" (click)="moveTask(t, 'Todo')">←</button>
                <span>
                  <button class="btn btn-sm btn-outline-primary py-0 px-1" title="Send for Review" (click)="moveTask(t, 'Review')">→</button>
                  <button class="btn btn-sm btn-outline-secondary py-0 px-1 ms-1" title="Clone task" *ngIf="canManageTasks()" (click)="cloneTask(t)"><i class="bi bi-copy"></i></button>
                  <button class="btn btn-sm btn-outline-danger py-0 px-1 ms-1" title="Delete task" *ngIf="canManageTasks()" (click)="deleteTask(t)">✕</button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Review Column -->
      <div class="col-md-3">
        <div class="card bg-dark bg-opacity-50 p-3 h-100" (dragover)="onDragOver($event)" (drop)="onDrop($event, 'Review')">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="fw-bold small text-warning">IN REVIEW</span>
            <span class="badge bg-warning rounded-pill">{{ getTasksByStatus('Review').length }}</span>
          </div>
          <div class="d-flex flex-column gap-2">
            <div class="card p-3 shadow-sm border-0 kanban-card" draggable="true" (dragstart)="onDragStart($event, t)"
                 *ngFor="let t of getTasksByStatus('Review')">
              <div class="fw-semibold small mb-2">{{ t.title }}</div>
              <div class="d-flex justify-content-between align-items-center">
                <button class="btn btn-sm btn-outline-secondary py-0 px-1" title="Reject → back to In Progress" (click)="moveTask(t, 'InProgress')">←</button>
                <span>
                  <button class="btn btn-sm btn-outline-success py-0 px-1" title="Approve → Done" (click)="moveTask(t, 'Done')">✓</button>
                  <button class="btn btn-sm btn-outline-danger py-0 px-1 ms-1" title="Delete task" *ngIf="canManageTasks()" (click)="deleteTask(t)">✕</button>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Done Column -->
      <div class="col-md-3">
        <div class="card bg-dark bg-opacity-50 p-3 h-100" (dragover)="onDragOver($event)" (drop)="onDrop($event, 'Done')">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <span class="fw-bold small text-success">COMPLETED</span>
            <span class="badge bg-success rounded-pill">{{ getTasksByStatus('Done').length }}</span>
          </div>
          <div class="d-flex flex-column gap-2">
            <div class="card p-3 shadow-sm border-0 bg-success bg-opacity-10" *ngFor="let t of getTasksByStatus('Done')">
              <div class="fw-semibold small text-decoration-line-through text-secondary mb-1">{{ t.title }}</div>
              <span class="text-success small"><i class="bi bi-check-circle-fill me-1"></i>Finished</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- My Tasks (assigned to me) -->
    <div class="card p-3 mt-4">
      <h5 class="h6 mb-3"><i class="bi bi-person-check me-2"></i>My Tasks</h5>
      <div class="table-responsive" *ngIf="myTasks().length > 0; else noMyTasks">
        <table class="table table-hover align-middle mb-0">
          <thead>
            <tr class="small text-secondary">
              <th>Task</th>
              <th>Project</th>
              <th>Priority</th>
              <th style="width: 150px;">Deadline</th>
              <th style="width: 140px;">Status</th>
              <th style="width: 170px;">Reassign</th>
              <th *ngIf="canManageTasks()" style="width: 80px;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of myTasks()">
              <td class="fw-semibold small">{{ t.title }}<div class="text-muted" style="font-size: 11px;">{{ t.assigneeNames.join(', ') }}</div></td>
              <td class="text-secondary small">{{ t.projectName }}</td>
              <td><span class="badge" [class.bg-secondary]="t.priority === 'Low'" [class.bg-info]="t.priority === 'Medium'" [class.bg-warning]="t.priority === 'High'" [class.bg-danger]="t.priority === 'Critical'">{{ t.priority }}</span></td>
              <td><input type="date" class="form-control form-control-sm" [value]="t.dueDate ? (t.dueDate | date:'yyyy-MM-dd') : ''"
                         (change)="extendDeadline(t, $any($event.target).value)" /></td>
              <td>
                <select class="form-select form-select-sm" [value]="t.status"
                        (change)="updateMyTaskStatus(t, $any($event.target).value)">
                  <option value="Todo">To Do</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Review">Review</option>
                  <option value="Done">Done</option>
                </select>
              </td>
              <td>
                <select class="form-select form-select-sm" [value]="''" (change)="reassignTask(t, $any($event.target).value); $any($event.target).value = ''">
                  <option value="" disabled>{{ t.assigneeNames[0] || 'Unassigned' }}</option>
                  <option *ngFor="let e of employees()" [value]="e.id">{{ e.fullName }}</option>
                </select>
              </td>
              <td *ngIf="canManageTasks()">
                <button class="btn btn-sm btn-outline-secondary py-0 px-1 me-1" title="Clone task" (click)="cloneTask(t)"><i class="bi bi-copy"></i></button>
                <button class="btn btn-sm btn-outline-danger py-0 px-1" title="Delete task" (click)="deleteTask(t)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <ng-template #noMyTasks>
        <p class="text-secondary small mb-0">No tasks assigned to you yet.</p>
      </ng-template>
    </div>

    <!-- Create Task Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="showTaskModal()">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">New Task — {{ selectedProject()?.name }}</h5>
            <button type="button" class="btn-close btn-close-white" (click)="showTaskModal.set(false)"></button>
          </div>
          <form (ngSubmit)="saveTask()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label small">Task Title *</label>
                <input type="text" [(ngModel)]="newTask.title" name="tt" required class="form-control" />
              </div>
              <div class="mb-3">
                <label class="form-label small">Description</label>
                <textarea [(ngModel)]="newTask.description" name="td" rows="2" class="form-control"></textarea>
              </div>
              <div class="row g-2 mb-3">
                <div class="col-6">
                  <label class="form-label small">Assign To *</label>
                  <select [(ngModel)]="newTask.assigneeId" name="ta" required class="form-select">
                    <option [ngValue]="null" disabled>Select employee…</option>
                    <option *ngFor="let e of employees()" [ngValue]="e.id">{{ e.fullName }}</option>
                  </select>
                </div>
                <div class="col-6">
                  <label class="form-label small">Priority</label>
                  <select [(ngModel)]="newTask.priority" name="tp" class="form-select">
                    <option [ngValue]="0">Low</option>
                    <option [ngValue]="1">Medium</option>
                    <option [ngValue]="2">High</option>
                    <option [ngValue]="3">Urgent / Critical</option>
                  </select>
                </div>
              </div>
              <div class="row g-2 mb-3">
                <div class="col-6">
                  <label class="form-label small">Deadline</label>
                  <input type="date" [(ngModel)]="newTask.dueDate" name="tdt" class="form-control" />
                </div>
                <div class="col-6">
                  <label class="form-label small">Estimated Hours</label>
                  <input type="number" min="1" [(ngModel)]="newTask.estimatedHours" name="th" class="form-control" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showTaskModal.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Task</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Create Project Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="showProjectModal()">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create New Project</h5>
            <button type="button" class="btn-close btn-close-white" (click)="showProjectModal.set(false)"></button>
          </div>
          <form (ngSubmit)="saveProject()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label small">Project Name *</label>
                <input type="text" [(ngModel)]="newProj.name" name="pn" required class="form-control" />
              </div>
              <div class="mb-3">
                <label class="form-label small">Description</label>
                <textarea [(ngModel)]="newProj.description" name="pd" rows="2" class="form-control"></textarea>
              </div>
              <div class="row g-2 mb-3">
                <div class="col-6">
                  <label class="form-label small">Budget ($) *</label>
                  <input type="number" [(ngModel)]="newProj.budget" name="pb" required min="0" class="form-control" />
                </div>
                <div class="col-6">
                  <label class="form-label small">Client</label>
                  <select [(ngModel)]="newProj.customerId" name="pc" class="form-select">
                    <option [ngValue]="null">— Internal / No client —</option>
                    <option *ngFor="let c of customers()" [ngValue]="c.id">{{ c.name }}</option>
                  </select>
                </div>
              </div>
              <div class="row g-2 mb-3">
                <div class="col">
                  <label class="form-label small">Start Date *</label>
                  <input type="date" [(ngModel)]="newProj.startDate" name="ps" required class="form-control" />
                </div>
                <div class="col">
                  <label class="form-label small">End Date</label>
                  <input type="date" [(ngModel)]="newProj.endDate" name="pe" class="form-control" />
                  <small class="text-secondary" style="font-size: 11px;">Optional</small>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showProjectModal.set(false)">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Project</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cursor-pointer { cursor: pointer; }
    .kanban-card { cursor: grab; }
    .kanban-card:active { cursor: grabbing; }
  `]
})
export class ProjectsComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  toast = inject(ToastService);

  private draggedTask: ProjectTask | null = null;

  canManageTasks(): boolean {
    return this.auth.hasRole(['Admin', 'Manager']);
  }

  onDragStart(event: DragEvent, t: ProjectTask): void {
    this.draggedTask = t;
    event.dataTransfer?.setData('text/plain', t.id);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, newStatus: string): void {
    event.preventDefault();
    if (this.draggedTask && this.draggedTask.status !== newStatus) {
      this.moveTask(this.draggedTask, newStatus);
    }
    this.draggedTask = null;
  }

  projects = signal<Project[]>([]);
  selectedProject = signal<Project | null>(null);
  tasks = signal<ProjectTask[]>([]);
  employees = signal<Employee[]>([]);
  customers = signal<Customer[]>([]);
  myTasks = signal<ProjectTask[]>([]);
  showProjectModal = signal(false);
  showTaskModal = signal(false);
  savingProject = signal(false);
  filterStatus = signal<string>('');
  overdueOnly = signal(false);

  projForm = {
    status: 0 as number,
    progress: 0,
    endDate: '',
    budget: 0,
    managerId: null as string | null
  };

  filteredProjects(): Project[] {
    return this.projects().filter(p => {
      if (this.filterStatus() !== '' && String(this.statusIndex(p.status)) !== this.filterStatus()) return false;
      if (this.overdueOnly() && !this.isOverdue(p)) return false;
      return true;
    });
  }

  statusIndex(status: string): number {
    return ['Planning', 'Active', 'OnHold', 'Completed', 'Cancelled'].indexOf(status);
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = { Planning: 'Planning', Active: 'Active', OnHold: 'On Hold', Completed: 'Completed', Cancelled: 'Cancelled' };
    return labels[status] || status;
  }

  isOverdue(p: Project): boolean {
    if (!p.endDate || p.status === 'Completed' || p.status === 'Cancelled') return false;
    return new Date(p.endDate).getTime() < Date.now();
  }

  budgetExceeded(p: Project): boolean {
    return p.budget > 0 && p.actualCost > p.budget;
  }

  daysRemaining(p: Project): number {
    if (!p.endDate) return 0;
    const diff = Math.ceil((new Date(p.endDate).getTime() - Date.now()) / 86400000);
    return Math.abs(diff);
  }

  budgetUsage(p: Project): number {
    if (p.budget <= 0) return 0;
    return Math.round((p.actualCost / p.budget) * 100);
  }

  newTask = {
    title: '',
    description: '',
    assigneeId: null as string | null,
    priority: 1,
    dueDate: '',
    estimatedHours: 4
  };

  newProj = {
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: 50000,
    managerId: null,
    customerId: null
  };

  ngOnInit(): void {
    this.loadProjects();
    this.loadMyTasks();
    this.api.getEmployees(1, 100).subscribe({
      next: (res) => { if (res?.items) this.employees.set(res.items); }
    });
    this.api.getCustomers(1, 100).subscribe({
      next: (res) => { if (res?.items) this.customers.set(res.items); }
    });
  }

  loadMyTasks(): void {
    this.api.getMyTasks().subscribe({
      next: (res) => this.myTasks.set(res?.items || [])
    });
  }

  updateMyTaskStatus(t: ProjectTask, newStatus: string): void {
    this.api.updateTask(t.id, { title: t.title, description: t.description || '', status: newStatus,
      priority: t.priority, dueDate: t.dueDate ? t.dueDate.split('T')[0] : null,
      estimatedHours: t.estimatedHours, actualHours: t.actualHours }).subscribe({
      next: () => {
        this.toast.success('Tasks', `"${t.title}" moved to ${newStatus === 'Review' ? 'Under Review' : newStatus}.`);
        this.loadMyTasks();
        if (this.selectedProject()) this.selectProject(this.selectedProject()!);
      }
    });
  }

  loadProjects(): void {
    this.api.getProjects(1, 20).subscribe({
      next: (res) => {
        if (res?.items) {
          this.projects.set(res.items);
          if (res.items.length > 0 && !this.selectedProject()) {
            this.selectProject(res.items[0]);
          } else if (this.selectedProject()) {
            const updated = res.items.find(p => p.id === this.selectedProject()!.id);
            if (updated) this.selectedProject.set(updated);
          }
        }
      }
    });
  }

  selectProject(p: Project): void {
    this.selectedProject.set(p);
    this.projForm = {
      status: this.statusIndex(p.status),
      progress: p.progress,
      endDate: p.endDate ? p.endDate.split('T')[0] : '',
      budget: p.budget,
      managerId: p.managerId || null
    };
    this.api.getTasksByProject(p.id).subscribe({
      next: (res) => {
        if (res?.items) this.tasks.set(res.items);
      }
    });
  }

  saveProjectUpdates(): void {
    const p = this.selectedProject();
    if (!p) return;

    const progress = Number(this.projForm.progress);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      this.toast.warning('Projects', 'Progress must be between 0 and 100.');
      return;
    }

    this.savingProject.set(true);
    this.api.updateProject(p.id, {
      name: p.name,
      description: p.description,
      startDate: p.startDate,
      endDate: this.projForm.endDate || null,
      status: Number(this.projForm.status),
      budget: Number(this.projForm.budget) || 0,
      progress,
      managerId: this.projForm.managerId
    }).subscribe({
      next: () => {
        this.savingProject.set(false);
        this.toast.success('Projects', 'Project updated successfully!');
        this.loadProjects();
      },
      error: () => this.savingProject.set(false)
    });
  }

  getTasksByStatus(status: string): ProjectTask[] {
    return this.tasks().filter(t => t.status === status);
  }

  moveTask(t: ProjectTask, newStatus: any): void {
    this.api.updateTask(t.id, { title: t.title, description: t.description || '', status: newStatus,
      priority: t.priority, dueDate: t.dueDate ? t.dueDate.split('T')[0] : null,
      estimatedHours: t.estimatedHours, actualHours: t.actualHours }).subscribe({
      next: () => {
        this.toast.success('Tasks', `"${t.title}" → ${newStatus === 'Review' ? 'Under Review' : newStatus}.`);
        this.loadMyTasks();
        if (this.selectedProject()) this.selectProject(this.selectedProject()!);
      }
    });
  }

  reassignTask(t: ProjectTask, employeeId: string): void {
    if (!employeeId) return;
    this.api.updateTask(t.id, { title: t.title, description: t.description || '', status: t.status,
      priority: t.priority, dueDate: t.dueDate ? t.dueDate.split('T')[0] : null,
      estimatedHours: t.estimatedHours, actualHours: t.actualHours,
      assigneeIds: [employeeId] }).subscribe({
      next: () => {
        const name = this.employees().find(e => e.id === employeeId)?.fullName;
        this.toast.success('Tasks', `"${t.title}" reassigned to ${name}.`);
        this.loadMyTasks();
        if (this.selectedProject()) this.selectProject(this.selectedProject()!);
      }
    });
  }

  extendDeadline(t: ProjectTask, dateStr: string): void {
    this.api.updateTask(t.id, { title: t.title, description: t.description || '', status: t.status,
      priority: t.priority, dueDate: dateStr || null,
      estimatedHours: t.estimatedHours, actualHours: t.actualHours }).subscribe({
      next: () => this.toast.success('Tasks', `Deadline updated for "${t.title}".`)
    });
  }

  cloneTask(t: ProjectTask): void {
    this.api.createTask({
      title: `${t.title} (Copy)`,
      description: t.description || '',
      projectId: t.projectId,
      priority: t.priority,
      dueDate: null,
      estimatedHours: t.estimatedHours
    }).subscribe({
      next: () => {
        this.toast.success('Tasks', 'Task cloned to To Do.');
        if (this.selectedProject()?.id === t.projectId) this.selectProject(this.selectedProject()!);
      }
    });
  }

  deleteTask(t: ProjectTask): void {
    if (!confirm(`Delete task "${t.title}"?`)) return;
    this.api.deleteTask(t.id).subscribe({
      next: () => {
        this.toast.success('Tasks', `"${t.title}" deleted.`);
        this.loadMyTasks();
        if (this.selectedProject()) this.selectProject(this.selectedProject()!);
      }
    });
  }

  openCreateTask(): void {
    if (!this.selectedProject()) return;
    this.newTask = { title: '', description: '', assigneeId: null, priority: 1, dueDate: '', estimatedHours: 4 };
    this.showTaskModal.set(true);
  }

  saveTask(): void {
    if (!this.newTask.title?.trim()) {
      this.toast.warning('Tasks', 'Task title is required.');
      return;
    }
    if (!this.newTask.assigneeId) {
      this.toast.warning('Tasks', 'Please assign the task to a team member.');
      return;
    }

    this.api.createTask({
      title: this.newTask.title.trim(),
      description: this.newTask.description || '',
      projectId: this.selectedProject()!.id,
      priority: Number(this.newTask.priority),
      dueDate: this.newTask.dueDate ? this.newTask.dueDate : null,
      estimatedHours: Number(this.newTask.estimatedHours) || 4,
      assigneeIds: [this.newTask.assigneeId]
    }).subscribe({
      next: () => {
        this.toast.success('Tasks', `Task assigned to ${this.employees().find(e => e.id === this.newTask.assigneeId)?.fullName || 'member'}!`);
        this.showTaskModal.set(false);
        if (this.selectedProject()) this.selectProject(this.selectedProject()!);
      }
    });
  }

  saveProject(): void {
    if (!this.newProj.name || !this.newProj.name.trim()) {
      this.toast.warning('Projects', 'Project name is required.');
      return;
    }

    if (!this.newProj.startDate) {
      this.toast.warning('Projects', 'Start date is required.');
      return;
    }

    const payload = {
      ...this.newProj,
      name: this.newProj.name.trim(),
      endDate: this.newProj.endDate ? this.newProj.endDate : null,
      budget: Number(this.newProj.budget) || 0
    };

    this.api.createProject(payload).subscribe({
      next: () => {
        this.toast.success('Projects', 'Project created successfully!');
        this.showProjectModal.set(false);
        this.newProj = {
          name: '',
          description: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          budget: 50000,
          managerId: null,
          customerId: null
        };
        this.loadProjects();
      }
    });
  }
}
