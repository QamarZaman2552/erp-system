import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { RecurringTask } from '../../core/models/erp.models';

@Component({
  selector: 'app-recurring-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="tasks-page">
      <div class="page-header-row">
        <div>
          <h2>Recurring Tasks</h2>
          <p class="text-sm text-gray-400">Manage tasks that repeat daily, weekly, or monthly</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          <span>+ Add Recurring Task</span>
        </button>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar erp-card">
        <select [(ngModel)]="filterStatus" (change)="loadTasks()" class="form-select form-select-sm" style="max-width: 150px;">
          <option [ngValue]="null">All Statuses</option>
          <option [ngValue]="'Active'">Active</option>
          <option [ngValue]="'Paused'">Paused</option>
          <option [ngValue]="'Completed'">Completed</option>
          <option [ngValue]="'Cancelled'">Cancelled</option>
        </select>
        <select [(ngModel)]="filterFreq" (change)="loadTasks()" class="form-select form-select-sm" style="max-width: 150px;">
          <option [ngValue]="null">All Frequencies</option>
          <option [ngValue]="'Daily'">Daily</option>
          <option [ngValue]="'Weekly'">Weekly</option>
          <option [ngValue]="'Monthly'">Monthly</option>
        </select>
        <div class="stats-counter ms-auto">
          Total: <strong>{{ tasks().length }}</strong> | Next run: <strong>{{ nextRunCount() }}</strong>
        </div>
      </div>

      <!-- Loading Skeletons -->
      @if (loading()) {
      <div class="tasks-list">
        @for (i of [1,2,3]; track i) {
          <div class="skeleton-task-card"><div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-line narrow"></div></div>
        }
      </div>
      } @else {
      <!-- Task Cards -->
      @if (filteredTasks().length === 0) {
      <div class="empty-state-card">
        <div class="empty-state-icon">📋</div>
        <div class="font-semibold">No recurring tasks found</div>
        <div class="text-sm text-gray-400">Create a new recurring task to get started.</div>
      </div>
      } @else {
      <div class="tasks-list">
        @for (task of filteredTasks(); track task.id) {
        <div class="task-card erp-card" [class.task-disabled]="!task.isActive">
          <div class="task-card-header">
            <div class="task-title-row">
              <span class="task-title">{{ task.title }}</span>
              <span class="badge" [ngClass]="getStatusBadge(task.status)">{{ task.status }}</span>
            </div>
            <span class="badge badge-info">{{ task.frequency }}</span>
          </div>
          <div class="task-card-body">
            <div *ngIf="task.description" class="task-description">{{ task.description }}</div>
            <div class="task-meta">
              <span class="task-meta-item">📅 Start: {{ task.startDate | date:'mediumDate' }}</span>
              <span *ngIf="task.endDate" class="task-meta-item">🏁 End: {{ task.endDate | date:'mediumDate' }}</span>
              <span class="task-meta-item">🔄 Next: {{ task.nextExecutionDate | date:'mediumDate' }}</span>
            </div>
            <div *ngIf="task.category" class="task-category">Category: {{ task.category }}</div>
          </div>
          <div class="task-card-footer">
            <span class="task-progress">Completed: {{ task.completedCount }} times</span>
            <div class="action-btn-group">
              <button class="btn btn-sm btn-secondary" (click)="toggleTask(task)" title="Toggle active">
                {{ task.isActive ? '⏸️ Pause' : '▶️ Resume' }}
              </button>
              <button class="btn btn-sm btn-outline-primary" (click)="openEdit(task)" title="Edit">
                ✏️ Edit
              </button>
              <button class="btn btn-sm btn-danger" (click)="deleteTask(task.id)" title="Delete">
                🗑️
              </button>
            </div>
          </div>
        </div>
        }
      </div>
      }
      }
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal d-block bg-black bg-opacity-75" tabindex="-1" *ngIf="showModal()">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingId() ? 'Edit Task' : 'New Recurring Task' }}</h5>
            <button type="button" class="btn-close btn-close-white" (click)="closeModal()"></button>
          </div>
          <form (ngSubmit)="saveTask()">
            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label small">Task Title *</label>
                <input type="text" [(ngModel)]="newTask.title" name="title" required class="form-control" placeholder="e.g. Daily Standup" />
              </div>
              <div class="mb-3">
                <label class="form-label small">Description</label>
                <textarea [(ngModel)]="newTask.description" name="description" class="form-control" rows="3" placeholder="Optional description..."></textarea>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label small">Frequency *</label>
                  <select [(ngModel)]="newTask.frequency" name="frequency" required class="form-select">
                    <option [ngValue]="'Daily'">Daily</option>
                    <option [ngValue]="'Weekly'">Weekly</option>
                    <option [ngValue]="'Monthly'">Monthly</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label small">Category</label>
                  <input type="text" [(ngModel)]="newTask.category" name="category" class="form-control" placeholder="e.g. HR, Finance, Operations" />
                </div>
              </div>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label small">Start Date *</label>
                  <input type="date" [(ngModel)]="newTask.startDate" name="startDate" required class="form-control" />
                </div>
                <div class="col-md-6">
                  <label class="form-label small">End Date (optional)</label>
                  <input type="date" [(ngModel)]="newTask.endDate" name="endDate" class="form-control" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ saving() ? 'Saving...' : (editingId() ? 'Save Changes' : 'Create Task') }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tasks-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .filter-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .filter-bar .form-select {
      font-size: 13px;
    }

    .stats-counter {
      font-size: 13px;
    }

    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .task-card {
      padding: 20px;
    }

    .task-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .task-title-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .task-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .task-card-body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .task-description {
      font-size: 13px;
      color: var(--text-secondary);
    }

    .task-meta {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .task-meta-item {
      font-size: 12px;
      color: var(--text-muted);
    }

    .task-category {
      font-size: 11px;
      color: var(--text-muted);
      background: var(--bg-tertiary);
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
      width: fit-content;
    }

    .task-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }

    .task-progress {
      font-size: 12px;
      color: var(--text-muted);
    }

    .task-disabled {
      opacity: 0.5;
    }

    .skeleton-task-card {
      padding: 20px;
      background: var(--bg-glass-card);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .empty-state-card {
      padding: 48px 16px;
      text-align: center;
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    @media (max-width: 767.98px) {
      .filter-bar {
        flex-direction: column;
        align-items: stretch;
      }
      .task-card-footer {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class RecurringTasksComponent implements OnInit {
  private api = inject(ApiService);
  private notifications = inject(NotificationService);

  tasks = signal<RecurringTask[]>([]);
  loading = signal(true);
  showModal = signal(false);
  saving = signal(false);
  editingId = signal<string | null>(null);

  filterStatus: string | null = null;
  filterFreq: string | null = null;

  newTask: Partial<RecurringTask> = {
    title: '',
    description: '',
    frequency: 'Daily',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true,
    status: 'Active',
    category: ''
  };

  filteredTasks = computed(() => {
    let list = this.tasks();
    if (this.filterStatus) {
      list = list.filter(t => t.status === this.filterStatus);
    }
    if (this.filterFreq) {
      list = list.filter(t => t.frequency === this.filterFreq);
    }
    return list;
  });

  nextRunCount = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.tasks().filter(t => t.isActive && t.nextExecutionDate <= today).length;
  });

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading.set(true);
    this.api.getRecurringTasks().subscribe({
      next: (res) => {
        this.tasks.set(Array.isArray(res) ? res : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreateModal(): void {
    this.resetForm();
    this.editingId.set(null);
    this.showModal.set(true);
  }

  openEdit(task: RecurringTask): void {
    this.editingId.set(task.id);
    this.newTask = { ...task };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingId.set(null);
    this.resetForm();
  }

  resetForm(): void {
    this.newTask = {
      title: '',
      description: '',
      frequency: 'Daily',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true,
      status: 'Active',
      category: ''
    };
  }

  async saveTask(): Promise<void> {
    if (!this.newTask.title) return;
    this.saving.set(true);
    try {
      if (this.editingId()) {
        const res = await this.api.updateRecurringTask(this.editingId()!, this.newTask).toPromise();
        if (res?.success) {
          this.tasks.update(list => list.map(t => t.id === this.editingId()! ? { ...t, ...this.newTask } : t));
          this.notifications.addNotification({
            id: Math.random().toString(), title: 'Recurring Tasks',
            message: 'Task updated successfully!', type: 'success', timestamp: new Date()
          });
        }
      } else {
        const res = await this.api.createRecurringTask(this.newTask).toPromise();
        if (res?.success && res.data) {
          this.tasks.update(list => [...list, res.data!]);
          this.notifications.addNotification({
            id: Math.random().toString(), title: 'Recurring Tasks',
            message: 'Task created successfully!', type: 'success', timestamp: new Date()
          });
        }
      }
      this.closeModal();
      this.loadTasks();
    } catch {
      this.notifications.addNotification({
        id: Math.random().toString(), title: 'Recurring Tasks',
        message: 'Operation failed.', type: 'error', timestamp: new Date()
      });
    } finally {
      this.saving.set(false);
    }
  }

  toggleTask(task: RecurringTask): void {
    this.api.toggleRecurringTask(task.id).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.tasks.update(list => list.map(t => t.id === task.id ? res.data! : t));
          this.notifications.addNotification({
            id: Math.random().toString(), title: 'Recurring Tasks',
            message: `${task.isActive ? 'Paused' : 'Resumed'}: ${task.title}`,
            type: 'info', timestamp: new Date()
          });
        }
      },
      error: () => this.notifications.addNotification({
        id: Math.random().toString(), title: 'Recurring Tasks',
        message: 'Failed to toggle task.', type: 'error', timestamp: new Date()
      })
    });
  }

  deleteTask(id: string): void {
    if (!confirm('Are you sure you want to delete this recurring task?')) return;
    this.api.deleteRecurringTask(id).subscribe({
      next: () => {
        this.tasks.update(list => list.filter(t => t.id !== id));
        this.notifications.addNotification({
          id: Math.random().toString(), title: 'Recurring Tasks',
          message: 'Task deleted.', type: 'info', timestamp: new Date()
        });
      },
      error: () => this.notifications.addNotification({
        id: Math.random().toString(), title: 'Recurring Tasks',
        message: 'Failed to delete task.', type: 'error', timestamp: new Date()
      })
    });
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'Active': return 'badge-success';
      case 'Paused': return 'badge-warning';
      case 'Completed': return 'badge-info';
      case 'Cancelled': return 'badge-danger';
      default: return 'badge-neutral';
    }
  }
}
