import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats, MonthlyRevenue, RecentActivity, TopProduct } from '../../core/models/erp.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-page">
      <!-- Welcome Banner -->
      <div class="welcome-banner erp-card">
        <div>
          <h2>Welcome back, {{ user()?.fullName }} 👋</h2>
          <p class="subtitle">Here is what is happening across your enterprise operations today.</p>
        </div>
        <div class="quick-stats-pill">
          <span class="live-dot"></span> Live Enterprise Status: <strong>Operational</strong>
        </div>
      </div>

      <!-- KPI Metric Cards Grid (company-wide: management only) -->
      @if (loading()) {
      <div class="metrics-grid">
        @for (i of [1,2,3,4]; track i) {
          <div class="skeleton-card"><div class="skeleton-line short"></div><div class="skeleton-line"></div><div class="skeleton-line narrow"></div></div>
        }
      </div>
      } @else {
      @if (canSeeAnalytics()) {
      <div class="metrics-grid">
        <div class="metric-card erp-card">
          <div class="metric-header">
            <span class="metric-title">Total Revenue</span>
            <span class="metric-icon">💰</span>
          </div>
          <div class="metric-value">\${{ (stats()?.totalRevenue || 124500) | number:'1.2-2' }}</div>
          <div class="metric-footer text-emerald-400">
            <span>↑ 12.5%</span> from last month
          </div>
        </div>

        <div class="metric-card erp-card">
          <div class="metric-header">
            <span class="metric-title">Net Profit</span>
            <span class="metric-icon">📈</span>
          </div>
          <div class="metric-value">\${{ (stats()?.netProfit || 84200) | number:'1.2-2' }}</div>
          <div class="metric-footer text-emerald-400">
            <span>↑ 8.3%</span> margin
          </div>
        </div>

        <div class="metric-card erp-card">
          <div class="metric-header">
            <span class="metric-title">Active Employees</span>
            <span class="metric-icon">👥</span>
          </div>
          <div class="metric-value">{{ stats()?.activeEmployees || 28 }}</div>
          <div class="metric-footer text-blue-400">
            <span>{{ stats()?.todayAttendance || 26 }}</span> present today
          </div>
        </div>

        <div class="metric-card erp-card">
          <div class="metric-header">
            <span class="metric-title">Active Projects</span>
            <span class="metric-icon">🚀</span>
          </div>
          <div class="metric-value">{{ stats()?.activeProjects || 6 }}</div>
          <div class="metric-footer text-indigo-400">
            <span>{{ stats()?.pendingOrders || 3 }}</span> orders pending
          </div>
        </div>
      </div>
      } @else {
      <!-- Personal KPI cards for employees -->
      <div class="metrics-grid">
        <div class="metric-card erp-card">
          <div class="metric-header">
            <span class="metric-title">Attendance Today</span>
            <span class="metric-icon">⏰</span>
          </div>
          <div class="metric-value">{{ (stats()?.todayAttendance || 0) > 0 ? 'Present' : 'Not marked' }}</div>
          <div class="metric-footer text-blue-400">
            Use Clock In / Clock Out from the header
          </div>
        </div>

        <div class="metric-card erp-card">
          <div class="metric-header">
            <span class="metric-title">My Pending Leaves</span>
            <span class="metric-icon">🌴</span>
          </div>
          <div class="metric-value">{{ stats()?.pendingLeaves || 0 }}</div>
          <div class="metric-footer text-indigo-400">
            Awaiting approval
          </div>
        </div>

        <div class="metric-card erp-card">
          <div class="metric-header">
            <span class="metric-title">My Tasks</span>
            <span class="metric-icon">📋</span>
          </div>
          <div class="metric-value">{{ stats()?.myTasksTotal || 0 }}</div>
          <div class="metric-footer text-emerald-400">
            <span>{{ stats()?.myTasksDone || 0 }}</span> completed
          </div>
        </div>

        <div class="metric-card erp-card">
          <div class="metric-header">
            <span class="metric-title">My Documents</span>
            <span class="metric-icon">📁</span>
          </div>
          <div class="metric-value">—</div>
          <div class="metric-footer text-blue-400">
            Manage files in Documents page
          </div>
        </div>
      </div>
      }
      }

      <!-- Charts Row -->
      @if (loading()) {
      <div class="analytics-row">
        @for (i of [1,2]; track i) {
          <div class="chart-card erp-card"><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line medium"></div><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>
          <div class="feed-card erp-card"><div class="skeleton-line"></div><div class="skeleton-row"><div class="skeleton skeleton-avatar"></div><div class="skeleton-text-group"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>@for(j of [1,2,3]; track j){<div class="skeleton-row"><div class="skeleton skeleton-avatar"></div><div class="skeleton-text-group"><div class="skeleton-line"></div><div class="skeleton-line short"></div></div></div>}
          </div>
        }
      </div>
      } @else {
      <div class="analytics-row">
        <!-- Monthly Cash Flow Bar Visualization -->
        <div class="chart-card erp-card">
          <div class="card-header-flex">
            <h3>Monthly Financial Performance</h3>
            <span class="badge badge-info">FY {{ reportYear() }}</span>
          </div>

          <div class="bars-container">
            <div class="bar-col" *ngFor="let item of monthlyData()">
              <div class="bar-visual-group">
                <div class="bar bar-revenue" [style.height.%]="getBarHeight(item.revenue)"></div>
                <div class="bar bar-expense" [style.height.%]="getBarHeight(item.expenses)"></div>
              </div>
              <span class="bar-month">{{ item.month }}</span>
            </div>
          </div>

          <div class="chart-legend">
            <div class="legend-item"><span class="dot dot-revenue"></span> Revenue</div>
            <div class="legend-item"><span class="dot dot-expense"></span> Expenses</div>
          </div>
        </div>

        <!-- Recent Activity Feed -->
        <div class="feed-card erp-card">
          <div class="card-header-flex">
            <h3>Recent System Activities</h3>
            <span class="badge badge-neutral">Audit Log</span>
          </div>

          <div class="activities-list">
            <div class="activity-item" *ngFor="let act of activities()">
              <div class="activity-dot"></div>
              <div class="activity-content">
                <div class="activity-desc">{{ act.description }}</div>
                <div class="activity-meta">{{ act.userName }} • {{ act.timestamp | date:'shortTime' }}</div>
              </div>
              <span class="badge badge-sm badge-info">{{ act.type }}</span>
            </div>

            <div class="empty-feed" *ngIf="activities().length === 0">
              <div class="activity-item">
                <div class="activity-dot"></div>
                <div class="activity-content">
                  <div class="activity-desc">System initialization completed</div>
                  <div class="activity-meta">System Admin • Just now</div>
                </div>
                <span class="badge badge-sm badge-success">System</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      }

      <!-- ─── Reports & Analytics Section (Admin/HR/Manager) ─── -->
      @if (loading()) {
      <div class="analytics-section">
        @for (i of [1,2,3]; track i) {
          <div class="erp-card p-3 h-100"><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div>
        }
      </div>
      } @else {
      <div *ngIf="canSeeAnalytics()" class="analytics-section">
        <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <h3 style="font-size:18px;margin:0"><i class="bi bi-graph-up-arrow me-2"></i>Reports &amp; Analytics</h3>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-outline-secondary" [class.active]="period() === '6M'" (click)="setPeriod('6M')">6M</button>
            <button class="btn btn-sm btn-outline-secondary" [class.active]="period() === '1Y'" (click)="setPeriod('1Y')">1Y</button>
            <button class="btn btn-sm btn-outline-secondary" [class.active]="period() === '2Y'" (click)="setPeriod('2Y')">2Y</button>
          </div>
        </div>

        <div class="row g-3">
          <!-- Attendance Trends -->
          <div class="col-md-6 col-xl-4">
            <div class="erp-card p-3 h-100">
              <h6 class="mb-3"><i class="bi bi-calendar-week me-2 text-info"></i>Attendance Trends (weekly %)</h6>
              <div class="mini-bars" *ngIf="attendanceTrends().length > 0">
                <div class="mini-bar-row" *ngFor="let t of attendanceTrends()" [title]="t.weekLabel + ': ' + t.presentRate + '% (' + t.presentDays + ' days)'">
                  <span class="mini-bar-label">{{ t.weekLabel }}</span>
                  <div class="mini-bar-track"><div class="mini-bar-fill bg-info" [style.width.%]="t.presentRate"></div></div>
                  <span class="mini-bar-value">{{ t.presentRate }}%</span>
                </div>
              </div>
              <p class="text-secondary small mb-0" *ngIf="attendanceTrends().length === 0">No attendance data yet</p>
            </div>
          </div>

          <!-- Dept Distribution -->
          <div class="col-md-6 col-xl-4">
            <div class="erp-card p-3 h-100">
              <h6 class="mb-3"><i class="bi bi-building me-2 text-primary"></i>Department Distribution</h6>
              <div *ngIf="deptDist().length > 0">
                <div class="mini-bar-row" *ngFor="let d of deptDist()" [title]="d.department + ': ' + d.employeeCount + ' employees'">
                  <span class="mini-bar-label">{{ d.department }}</span>
                  <div class="mini-bar-track"><div class="mini-bar-fill bg-primary" [style.width.%]="pct(d.employeeCount, maxDept())"></div></div>
                  <span class="mini-bar-value">{{ d.employeeCount }}</span>
                </div>
              </div>
              <p class="text-secondary small mb-0" *ngIf="deptDist().length === 0">No data</p>
            </div>
          </div>

          <!-- Lead Funnel -->
          <div class="col-md-6 col-xl-4">
            <div class="erp-card p-3 h-100">
              <h6 class="mb-3"><i class="bi bi-filter-square me-2 text-warning"></i>Lead Conversion Funnel</h6>
              <div *ngIf="leadFunnel().length > 0">
                <div class="funnel-row" *ngFor="let s of leadFunnel()" [title]="s.stage + ': ' + s.count + ' leads ($' + (s.value | number) + ')'">
                  <span class="mini-bar-label">{{ s.stage }}</span>
                  <div class="mini-bar-track">
                    <div class="mini-bar-fill funnel-fill" [style.width.%]="pct(s.count, funnelMax())"></div>
                  </div>
                  <span class="mini-bar-value">{{ s.count }}</span>
                </div>
              </div>
              <p class="text-secondary small mb-0" *ngIf="leadFunnel().length === 0">No leads yet</p>
            </div>
          </div>

          <!-- Project Completion -->
          <div class="col-md-6 col-xl-4">
            <div class="erp-card p-3 h-100">
              <h6 class="mb-3"><i class="bi bi-kanban me-2 text-success"></i>Project Completion</h6>
              <div *ngFor="let p of projects()">
                <div class="d-flex justify-content-between small mb-1">
                  <span>{{ p.projectName }}</span>
                  <span class="text-secondary">{{ p.status }} · {{ p.progress }}%</span>
                </div>
                <div class="progress mb-2" style="height:6px;">
                  <div class="progress-bar" [ngClass]="p.progress >= 75 ? 'bg-success' : p.progress >= 40 ? 'bg-warning' : 'bg-primary'" [style.width.%]="p.progress"></div>
                </div>
              </div>
              <p class="text-secondary small mb-0" *ngIf="projects().length === 0">No projects</p>
            </div>
          </div>

          <!-- Top Employees -->
          <div class="col-md-6 col-xl-4">
            <div class="erp-card p-3 h-100">
              <h6 class="mb-3"><i class="bi bi-trophy me-2 text-warning"></i>Top Performing Employees</h6>
              <table class="table table-sm table-dark mb-0" *ngIf="topEmployees().length > 0">
                <thead><tr><th>#</th><th>Employee</th><th>Done</th><th>Total</th></tr></thead>
                <tbody>
                  <tr *ngFor="let e of topEmployees(); let i = index">
                    <td>{{ i + 1 }}</td>
                    <td>{{ e.employeeName }}<br /><small class="text-secondary">{{ e.department }}</small></td>
                    <td class="fw-bold text-success">{{ e.tasksCompleted }}</td>
                    <td>{{ e.totalAssigned }}</td>
                  </tr>
                </tbody>
              </table>
              <p class="text-secondary small mb-0" *ngIf="topEmployees().length === 0">No task data</p>
            </div>
          </div>

          <!-- Inventory Valuation -->
          <div class="col-md-6 col-xl-4">
            <div class="erp-card p-3 h-100">
              <h6 class="mb-3"><i class="bi bi-box-seam me-2 text-danger"></i>Inventory Valuation</h6>
              <table class="table table-sm table-dark mb-0" *ngIf="inventoryVal().length > 0">
                <thead><tr><th>Category</th><th>Units</th><th>Value</th></tr></thead>
                <tbody>
                  <tr *ngFor="let v of inventoryVal()">
                    <td>{{ v.categoryName }}</td>
                    <td>{{ v.totalUnits }}</td>
                    <td class="fw-bold text-success">\${{ v.stockValue | number:'1.0-0' }}</td>
                  </tr>
                </tbody>
              </table>
              <p class="text-secondary small mb-0" *ngIf="inventoryVal().length === 0">No inventory</p>
            </div>
          </div>

          <!-- Payroll Cost Trend -->
          <div class="col-md-6 col-xl-4">
            <div class="erp-card p-3 h-100">
              <h6 class="mb-3"><i class="bi bi-cash-stack me-2 text-success"></i>Payroll Cost Trend</h6>
              <div class="bars-container compact" *ngIf="payrollCosts().length > 0">
                <div class="bar-col" *ngFor="let p of payrollCosts()" [title]="'Month ' + p.month + ': $' + (p.totalCost | number)">
                  <div class="bar-visual-group">
                    <div class="bar bar-revenue" [style.height.%]="pct(p.totalCost, maxPayroll()) || 5"></div>
                  </div>
                  <span class="bar-month">{{ p.month }}</span>
                </div>
              </div>
              <p class="text-secondary small mb-0" *ngIf="payrollCosts().length === 0">No payroll processed</p>
            </div>
          </div>

          <!-- Leave Utilization -->
          <div class="col-md-6 col-xl-4">
            <div class="erp-card p-3 h-100">
              <h6 class="mb-3"><i class="bi bi-airplane me-2 text-primary"></i>Leave Utilization (approved days)</h6>
              <div class="mini-bars" *ngIf="leaveUtil().length > 0">
                <div class="mini-bar-row" *ngFor="let l of leaveUtil()" [title]="l.month + ': ' + l.approvedLeaveDays + ' days'">
                  <span class="mini-bar-label">{{ l.month }}</span>
                  <div class="mini-bar-track"><div class="mini-bar-fill bg-secondary" [style.width.%]="pct(l.approvedLeaveDays, maxLeave())"></div></div>
                  <span class="mini-bar-value">{{ l.approvedLeaveDays }}</span>
                </div>
              </div>
              <p class="text-secondary small mb-0" *ngIf="leaveUtil().length === 0">No approved leaves</p>
            </div>
          </div>

          <!-- Customer Acquisition -->
          <div class="col-md-6 col-xl-4">
            <div class="erp-card p-3 h-100">
              <h6 class="mb-3"><i class="bi bi-person-plus me-2 text-info"></i>Customer Acquisition {{ reportYear() }}</h6>
              <div *ngIf="custAcq().length > 0">
                <div class="mini-bar-row" *ngFor="let c of custAcq()" [title]="c.month + ': +' + c.newCustomers + ' customers'">
                  <span class="mini-bar-label">{{ c.month }}</span>
                  <div class="mini-bar-track"><div class="mini-bar-fill bg-info" [style.width.%]="pct(c.newCustomers, maxCustAcq())"></div></div>
                  <span class="mini-bar-value">+{{ c.newCustomers }}</span>
                </div>
              </div>
              <p class="text-secondary small mb-0" *ngIf="custAcq().length === 0">No new customers this year</p>
            </div>
          </div>
        </div>
      </div>
        }
      </div>
    `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .welcome-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, rgba(192, 192, 192, 0.15) 0%, rgba(166, 166, 166, 0.1) 100%), var(--bg-glass-card);
    }

    .welcome-banner h2 {
      font-size: 22px;
      margin-bottom: 4px;
    }

    .subtitle {
      color: var(--text-secondary);
      font-size: 13px;
    }

    .quick-stats-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--bg-tertiary);
      border-radius: 9999px;
      font-size: 12px;
      border: 1px solid var(--border-color);
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
      box-shadow: 0 0 8px var(--success);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .metric-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .metric-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .metric-title {
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .metric-icon {
      font-size: 18px;
    }

    .metric-value {
      font-family: var(--font-heading);
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .metric-footer {
      font-size: 12px;
    }

    .text-emerald-400 { color: #34d399; }
    .text-blue-400 { color: #60a5fa; }
    .text-indigo-400 { color: #ededed; }

    .analytics-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }

    @media (max-width: 1024px) {
      .analytics-row {
        grid-template-columns: 1fr;
      }
    }

    .card-header-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .bars-container {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      height: 200px;
      padding: 10px 0;
      gap: 8px;
      border-bottom: 1px solid var(--border-color);
    }

    .bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      flex: 1;
      height: 100%;
      justify-content: flex-end;
    }

    .bar-visual-group {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 160px;
      width: 100%;
      justify-content: center;
    }

    .bar {
      width: 12px;
      border-radius: 4px 4px 0 0;
      transition: height 0.4s ease;
    }

    .bar-revenue {
      background: var(--accent-gradient);
    }

    .bar-expense {
      background: rgba(239, 68, 68, 0.7);
    }

    .bar-month {
      font-size: 11px;
      color: var(--text-muted);
    }

    .chart-legend {
      display: flex;
      gap: 20px;
      margin-top: 16px;
      justify-content: center;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-secondary);
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }

    .dot-revenue { background: var(--accent-primary); }
    .dot-expense { background: var(--danger); }

    .activities-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .activity-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent-primary);
    }

    .activity-content {
      flex: 1;
    }

    .activity-desc {
      font-size: 13px;
      color: var(--text-primary);
      font-weight: 500;
    }

    .activity-meta {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
    }

    .analytics-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .mini-bars {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .mini-bar-row {
      display: grid;
      grid-template-columns: 70px 1fr 48px;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }

    .mini-bar-label {
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mini-bar-track {
      height: 8px;
      background: var(--bg-tertiary);
      border-radius: 4px;
      overflow: hidden;
    }

    .mini-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    .mini-bar-value {
      text-align: right;
      color: var(--text-primary);
      font-weight: 600;
    }

    .funnel-fill {
      background: linear-gradient(90deg, #f59e0b, #ef4444);
    }

    .bars-container.compact {
      height: 120px;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  user = this.auth.currentUser;
  stats = signal<DashboardStats | null>(null);
  loading = signal(true);
  period = signal<'6M' | '1Y' | '2Y'>('1Y');
  monthlyData = signal<MonthlyRevenue[]>([]);
  activities = signal<RecentActivity[]>([]);
  reportYear = signal(new Date().getFullYear());
  attendanceTrends = signal<any[]>([]);
  deptDist = signal<any[]>([]);
  projects = signal<any[]>([]);
  leaveUtil = signal<any[]>([]);
  payrollCosts = signal<any[]>([]);
  topEmployees = signal<any[]>([]);
  inventoryVal = signal<any[]>([]);
  custAcq = signal<any[]>([]);
  leadFunnelData = signal<any[]>([]);

  ngOnInit(): void {
    this.loadStats();
  }

  setPeriod(p: '6M' | '1Y' | '2Y'): void {
    this.period.set(p);
    this.loadStats();
  }

  getYearForPeriod(): number {
    const y = new Date().getFullYear();
    if (this.period() === '2Y') return y - 1;
    return y;
  }

  canSeeAnalytics(): boolean {
    return this.auth.hasRole(['Admin', 'HR', 'Manager']);
  }

  loadAnalytics(): void {
    const y = this.getYearForPeriod();
    this.api.attendanceTrends().subscribe({ next: r => this.attendanceTrends.set(r || []), error: () => {} });
    this.api.deptDistribution().subscribe({ next: r => this.deptDist.set(r || []), error: () => {} });
    this.api.projectCompletion().subscribe({ next: r => this.projects.set(r || []), error: () => {} });
    this.api.leaveUtilization(y).subscribe({ next: r => this.leaveUtil.set(r || []), error: () => {} });
    this.api.payrollCost(y).subscribe({ next: r => this.payrollCosts.set(r || []), error: () => {} });
    this.api.topEmployees(5).subscribe({ next: r => this.topEmployees.set(r || []), error: () => {} });
    this.api.inventoryValuation().subscribe({ next: r => this.inventoryVal.set(r || []), error: () => {} });
    this.api.customerAcquisition(y).subscribe({ next: r => this.custAcq.set(r || []), error: () => {} });
    this.api.leadFunnel().subscribe({ next: r => this.leadFunnelData.set(r || []), error: () => {} });
  }

  leadFunnel() { return this.leadFunnelData(); }
  pct(val: number, max: number): number { return max > 0 ? Math.max(2, Math.round(val * 100 / max)) : 0; }
  maxDept(): number { return Math.max(...this.deptDist().map(d => d.employeeCount), 1); }
  funnelMax(): number { return Math.max(...this.leadFunnelData().map(s => s.count), 1); }
  maxPayroll(): number { return Math.max(...this.payrollCosts().map(p => p.totalCost), 1); }
  maxLeave(): number { return Math.max(...this.leaveUtil().map(l => l.approvedLeaveDays), 1); }
  maxCustAcq(): number { return Math.max(...this.custAcq().map(c => c.newCustomers), 1); }

  loadStats(): void {
    this.loading.set(true);
    this.api.getDashboardStats().subscribe({
      next: (res) => { this.stats.set(res); this.loading.set(false); },
      error: () => this.loading.set(false)
    });

    if (!this.canSeeAnalytics()) return;

    this.api.getRevenueChart(this.getYearForPeriod()).subscribe({
      next: (res) => {
        if (res && res.length > 0) this.monthlyData.set(res);
      },
      error: () => {}
    });

    this.api.getRecentActivities().subscribe({
      next: (res) => this.activities.set(res),
      error: () => {}
    });

    this.loadAnalytics();
  }

  getBarHeight(val: number): number {
    const max = 130000;
    return Math.min(100, Math.max(10, (val / max) * 100));
  }
}
