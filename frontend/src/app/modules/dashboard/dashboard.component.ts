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

      <!-- KPI Metric Cards Grid -->
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

      <!-- Content Sections: Charts & Activity Feeds -->
      <div class="analytics-row">
        <!-- Monthly Cash Flow Bar Visualization -->
        <div class="chart-card erp-card">
          <div class="card-header-flex">
            <h3>Monthly Financial Performance</h3>
            <span class="badge badge-info">FY 2026</span>
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
  `]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  user = this.auth.currentUser;
  stats = signal<DashboardStats | null>(null);
  monthlyData = signal<MonthlyRevenue[]>([
    { month: 'Jan', revenue: 45000, expenses: 32000 },
    { month: 'Feb', revenue: 52000, expenses: 28000 },
    { month: 'Mar', revenue: 61000, expenses: 35000 },
    { month: 'Apr', revenue: 58000, expenses: 31000 },
    { month: 'May', revenue: 72000, expenses: 40000 },
    { month: 'Jun', revenue: 84000, expenses: 42000 },
    { month: 'Jul', revenue: 79000, expenses: 38000 },
    { month: 'Aug', revenue: 95000, expenses: 46000 },
    { month: 'Sep', revenue: 88000, expenses: 44000 },
    { month: 'Oct', revenue: 102000, expenses: 51000 },
    { month: 'Nov', revenue: 110000, expenses: 54000 },
    { month: 'Dec', revenue: 124500, expenses: 62000 },
  ]);
  activities = signal<RecentActivity[]>([]);

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.api.getDashboardStats().subscribe({
      next: (res) => this.stats.set(res),
      error: () => {}
    });

    this.api.getRevenueChart(new Date().getFullYear()).subscribe({
      next: (res) => {
        if (res && res.length > 0) this.monthlyData.set(res);
      },
      error: () => {}
    });

    this.api.getRecentActivities().subscribe({
      next: (res) => this.activities.set(res),
      error: () => {}
    });
  }

  getBarHeight(val: number): number {
    const max = 130000;
    return Math.min(100, Math.max(10, (val / max) * 100));
  }
}
