# ERP Project — Session Handoff

> **Naye session me pehle ye file parho, phir user ko pooche bina kaam continue karo.**

## Project
Enterprise ERP — .NET 9 clean architecture API + Angular 19 SPA + SQL Server.
Repo: `https://github.com/QamarZaman2552/erp-system.git` (branch `master`)
Root: `D:\NexGen Internship\Enterprise ERP & Business Management System`
- Backend: `backend/` (ERP.API on https://localhost:7001)
- Frontend: `frontend/` (Angular)

## Run / Test Commands
```powershell
# Backend (from backend/)
Get-Process dotnet | Stop-Process -Force   # agar purana chal raha ho
dotnet build --nologo -v q                 # 0 Errors hona chahiye
Start-Process dotnet -ArgumentList "run","--project","src\ERP.API\ERP.API.csproj","--no-build","--launch-profile","https" -WindowStyle Hidden
# API up check: https://localhost:7001/swagger/index.html (~16s wait)

dotnet test          # 51 unit + 14 integration — sab pass hone chahiye

# Frontend (from frontend/)
npm run build        # Output location line = success
npm test             # 7 tests pass
```

## Credentials
- admin@company.com / Admin@1234 (linked EMP-0001 System Admin)
- hr@company.com / Hr@12345 (linked EMP-0003 HR Manager)
- JWT: Bearer token from `/api/auth/login` → `$admin.data.accessToken`

## Workflow Rules (user ke rules)
1. Har module complete → **git commit + push** turant
2. Sirf essential core banao, non-essential skip (user approve karta hai summary me skipped list se)
3. Live API test PowerShell se karo (`Invoke-RestMethod`), phir build+tests
4. User Urdu/Roman-Urdu me baat karta hai — jawab concise Roman-Urdu me do

## Completed Modules (all pushed)
| Module | Commit | Key features |
|---|---|---|
| HR Core | initial | employees CRUD, auto EMP codes, dept/designation/salary/manager edits, terminate→deactivate login, filters |
| Manager/Team | initial | my-team endpoint, overdue tasks, kanban DnD, task reassign/clone/delete, project status/progress/budget panel |
| Employee Self-Service | initial | /profile page (edit contact, change pwd, attendance calendar, payslips), forgot password, leaves scoping, my-tasks |
| Attendance | a797ab5 | OT hours + leave days in monthly report, dept comparison, backdated punches, manual correction endpoint, team today view |
| Payroll | 007282d | attendance-driven calc (absent deduction, OT pay 1.5x, leave paid), breakdown DTO, dept cost report |
| CRM | 4c1278b | lead→customer auto-conversion on Won, stage pipeline + stats, interactions log/history/follow-ups API+UI |
| Inventory | f417d7d | suppliers/categories APIs, movements history, stock value stats, category report |
| Sales & Purchase | 75e29a5 | SO/PO lifecycle (confirm→stock deduct/restore, cancel, return+refund), Payment entity (full/partial, auto Partial/Paid status, auto finance Income/Expense txns), PO receive partial/full→inventory auto-add→auto-Delivered, supplier invoice #, invoice PDF (SimplePdfGenerator, no deps) + email w/ attachment, overdue reminders endpoint, sales reports (monthly/customer/product-wise), purchase reports (monthly/supplier-wise), /purchase page + upgraded /sales page w/ actions+reports |
| Finance Polish | ac17ba2 | transactions date-range+type filter, income/expense/net summary API+KPI cards, approve expense→auto ledger txn + budget SpentAmount update + exceed/80% warning in response, budget alerts endpoint (≥80%), dept-wise + category-wise expense reports, financial report PDF export (annual/quarter/monthly), transactions CSV (Excel) export, payroll generation→auto "Payroll Expense" txn (idempotent ref PAYROLL-YYYY-MM), /finance page: 4 tabs incl Reports tab w/ exports |
| Notifications | c0f2179 | INotificationService (DB persist via Notification entity + SignalR real-time; hub moved to ERP.Infrastructure.Hubs), APIs: list/unread-count/mark-read/read-all/clear + Admin announce-to-all; events wired: task assigned→assignee users, leave request→HR+Manager+Admin roles, leave approved/rejected→employee (+existing email), SO confirm low-stock→Admins, budget exceeded/80%→Admins; header bell = DB-backed dropdown w/ type icons, unread badge, click→mark read+navigate actionUrl, mark-all-read, clear, 📢 announce button (Admin) |
| Reports & Analytics | 64d90fd | /dashboard/reports/* 9 endpoints (attendance weekly trends w/ present %, dept employee distribution, project completion progress, leave utilization monthly, payroll cost trend, top employees by tasks completed, inventory valuation by category, customer acquisition monthly, lead funnel stage counts+value); dashboard "Reports & Analytics" section (Admin/HR/Manager) — 9 cards w/ CSS bars/funnel/progress + hover tooltips |

## BAQI Modules (is order me karo)
1. **Role-Based Permissions** — roles/guards/sidebar hiding already work. Add: Access Denied page component + route.
2. **Audit Logs** — ActivityLog entity exists but kuch use nahi hota; add action-filter (Create/Update/Delete logging) + Admin viewer page.
3. **File Upload** — profile image upload endpoint exists; Document entity exists; generic document module heavy — user se poochho kitna chahiye.

## Notification Skipped Items (user-approved pending)
- Task deadline reminder (1 day before), overdue task notifications, project deadline reminders → need background job/scheduler
- HR birthday & probation-end reminders, notification preferences per-type, announcement email broadcast

## Technical Gotchas (IMPORTANT)
- **Enums**: global `JsonStringEnumConverter` laga hai (Program.cs) — input/output dono strings ("Active", "High", "Todo"). Numbers bhi bind hote hain.
- **EF gotcha**: `OrderBy` after `Select` into constructed DTO → translation FAIL (500). OrderBy entity property BEFORE Select. GroupBy aggregates → fetch flat rows then group in-memory.
- **Build lock**: agar "file locked by ERP.API" aaye → `Get-Process dotnet | Stop-Process -Force` phir rebuild.
- **PS 5.1 quirks**: `$pid` read-only variable hai (use $prodId). Error body capture: `New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())`. Nested quotes avoid karo — steps me todo. Single-element array `@(...) | ConvertTo-Json` object ban jata hai — `ConvertTo-Json -InputObject @(...)` use karo.
- **TLS**: PS 5.1 se API call pehle `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12` chahiye.
- **Angular templates**: backtick template literal mein `${{ ... }}` JS interpolation ban jata hai — `\${{` escape karo.
- **Migration auto-apply**: DataSeeder startup pe `Database.MigrateAsync()` karta hai, lekin naya migration add karne ke baad API restart zaroori hai; doubt ho to explicit `dotnet ef database update`.
- **SMTP**: appsettings me credentials empty → EmailService fail-safe hai (skip+log, no exception).
- **Payroll idempotent**: existing month record regenerate nahi hota.
- **Leave overlap**: backend rejects overlapping pending/approved leaves; weekends excluded everywhere (working days only).
- Frontend models: `src/app/core/models/erp.models.ts`; API methods: `api.service.ts`; pages: `modules/<name>/<name>.component.ts`.
- README.md already repo me hai — update karna ho modules badalne par.

## Demo Data Status
EMP-0001..0004 employees; Qamar (Engineering) manager=System Admin; "ERP Rollout 2026" project (Active 35%) w/ tasks incl 1 overdue; Acme Corporation customer (250k value, converted from lead); Wireless Mouse product (45 stock); Oct payroll for Qamar shows deductions/OT demo.
