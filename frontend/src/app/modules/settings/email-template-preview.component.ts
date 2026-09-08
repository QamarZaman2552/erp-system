import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  htmlContent: string;
  sampleData: Record<string, string>;
}

@Component({
  selector: 'app-email-template-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header-row">
      <div>
        <h2>Email Templates</h2>
        <p class="text-sm text-gray-400">Preview and review all system email templates</p>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div class="template-grid" *ngIf="loading()">
      <div class="erp-card template-sidebar skeleton-sidebar" *ngFor="let i of [1,2,3,4,5]">
        <div class="skeleton-line" style="width:60%;height:14px;margin-bottom:8px"></div>
        <div class="skeleton-line" style="width:80%;height:10px"></div>
      </div>
      <div class="erp-card skeleton-preview">
        <div class="skeleton-line" style="width:40%;height:18px;margin-bottom:16px"></div>
        <div class="skeleton-line" style="width:100%;height:200px"></div>
      </div>
    </div>

    <!-- Template grid -->
    <div class="template-grid" *ngIf="!loading()">
      <!-- Sidebar: template list -->
      <div class="template-sidebar erp-card">
        <div class="sidebar-header">
          <span class="sidebar-title">Templates ({{ templates().length }})</span>
        </div>
        <div class="template-list">
          <button
            *ngFor="let tpl of templates()"
            class="template-item"
            [class.active]="selectedId() === tpl.id"
            (click)="selectTemplate(tpl)">
            <span class="template-icon" [innerHTML]="getIcon(tpl.id)"></span>
            <div class="template-info">
              <span class="template-name">{{ tpl.name }}</span>
              <span class="template-desc">{{ tpl.description }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Preview panel -->
      <div class="preview-panel erp-card" *ngIf="selected()">
        <div class="preview-header">
          <div>
            <h3 class="preview-title"><span [innerHTML]="getIcon(selected()!.id)"></span> {{ selected()!.name }}</h3>
            <p class="preview-subject">Subject: {{ selected()!.subject }}</p>
          </div>
          <div class="preview-actions">
            <button class="btn btn-sm btn-secondary" (click)="showRaw.set(!showRaw())" [innerHTML]="rawToggleLabel()">
            </button>
            <button class="btn btn-sm btn-secondary" (click)="copyHtml()" [innerHTML]="copyLabel()">
            </button>
          </div>
        </div>

        <!-- Raw HTML view -->
        <div class="raw-html" *ngIf="showRaw()">
          <pre><code>{{ renderedHtml() }}</code></pre>
        </div>

        <!-- Live preview -->
        <div class="preview-frame" *ngIf="!showRaw()">
          <div class="preview-email" [innerHTML]="renderedHtml()"></div>
        </div>

        <!-- Variable reference -->
        <div class="variables-section" *ngIf="selected()!.sampleData | keyvalue as vars">
          <h4 class="variables-title">Sample Variables</h4>
          <div class="variables-grid">
            <div class="variable-item" *ngFor="let v of vars">
              <span class="variable-key">{{ '{{' + v.key + '}}' }}</span>
              <span class="variable-value">{{ v.value }}</span>
            </div>
          </div>
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

    .template-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 20px;
      min-height: 500px;
    }

    .template-sidebar {
      padding: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
    }

    .sidebar-title {
      font-weight: 600;
      font-size: 13px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .template-list {
      overflow-y: auto;
      flex: 1;
    }

    .template-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 12px 20px;
      border: none;
      background: transparent;
      color: var(--text-primary);
      cursor: pointer;
      text-align: left;
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;
    }

    .template-item:hover {
      background: var(--bg-hover);
    }

    .template-item.active {
      background: var(--accent-bg);
      border-left: 3px solid var(--accent);
    }

    .template-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .template-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .template-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .template-desc {
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .preview-panel {
      padding: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
      gap: 12px;
    }

    .preview-title {
      font-size: 16px;
      font-weight: 700;
      margin: 0;
      color: var(--text-primary);
    }

    .preview-subject {
      font-size: 12px;
      color: var(--text-muted);
      margin: 4px 0 0;
    }

    .preview-actions {
      display: flex;
      gap: 8px;
    }

    .preview-frame {
      flex: 1;
      padding: 24px;
      display: flex;
      justify-content: center;
      overflow: auto;
      background: #1a1a2e;
    }

    .preview-email {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.3);
      max-width: 600px;
      width: 100%;
      overflow: hidden;
    }

    .raw-html {
      flex: 1;
      padding: 20px;
      overflow: auto;
      background: var(--bg-secondary);
    }

    .raw-html pre {
      margin: 0;
      font-size: 12px;
      line-height: 1.5;
      color: var(--text-primary);
      white-space: pre-wrap;
      word-break: break-all;
    }

    .variables-section {
      padding: 16px 20px;
      border-top: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .variables-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 12px;
    }

    .variables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 8px;
    }

    .variable-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
    }

    .variable-key {
      font-family: monospace;
      background: var(--accent-bg);
      color: var(--accent);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
    }

    .variable-value {
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .skeleton-sidebar, .skeleton-preview {
      padding: 16px;
    }

    .skeleton-line {
      background: var(--bg-hover);
      border-radius: 4px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.8; }
    }

    .text-sm { font-size: 13px; }
    .text-gray-400 { color: var(--text-secondary); }
  `]
})
export class EmailTemplatePreviewComponent implements OnInit {
  private api = inject(ApiService);

  templates = signal<EmailTemplate[]>([]);
  selectedId = signal<string>('');
  loading = signal(true);
  showRaw = signal(false);
  copied = signal(false);

  selected = computed(() => this.templates().find(t => t.id === this.selectedId()) || null);

  renderedHtml = computed(() => {
    const tpl = this.selected();
    if (!tpl) return '';
    let html = tpl.htmlContent;
    for (const [key, value] of Object.entries(tpl.sampleData)) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return html;
  });

  ngOnInit(): void {
    this.api.getEmailTemplates().subscribe({
      next: (data) => {
        this.templates.set(data);
        if (data.length > 0) this.selectedId.set(data[0].id);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  selectTemplate(tpl: EmailTemplate): void {
    this.selectedId.set(tpl.id);
    this.showRaw.set(false);
    this.copied.set(false);
  }

  getIcon(id: string): string {
    const icons: Record<string, string> = {
      'password-reset': '<i class="bi bi-key-fill"></i>',
      'leave-approved': '<i class="bi bi-check-circle-fill"></i>',
      'leave-rejected': '<i class="bi bi-x-circle-fill"></i>',
      'payslip': '<i class="bi bi-wallet2"></i>',
      'sales-invoice': '<i class="bi bi-file-earmark-text"></i>',
      'overdue-reminder': '<i class="bi bi-exclamation-triangle-fill"></i>',
      'po-to-supplier': '<i class="bi bi-box-seam"></i>'
    };
    return icons[id] || '<i class="bi bi-envelope"></i>';
  }

  copyHtml(): void {
    navigator.clipboard.writeText(this.renderedHtml());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  rawToggleLabel(): string {
    return this.showRaw()
      ? '<i class="bi bi-eye me-1"></i> Preview'
      : '<i class="bi bi-code-slash me-1"></i> Raw HTML';
  }

  copyLabel(): string {
    return this.copied()
      ? '<i class="bi bi-check-lg me-1"></i> Copied!'
      : '<i class="bi bi-clipboard me-1"></i> Copy HTML';
  }
}
