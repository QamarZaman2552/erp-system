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

## BAQI Modules (is order me karo)
1. **Finance & Expense** — ZYADA TAR BANA HAI (transactions/expenses approve/budgets exist; sales/purchase payments ab auto finance mein record hote hain). Add: budget vs actual alerts, date-range filter on transactions, dept/category expense reports.
2. **Notifications & Email** — SignalR toast + bell exists. Add: notification center (list/read/clear), wire notifications to events (task assigned, leave approved).
3. **Reports & Analytics** — dashboard KPIs/charts exist. Add: attendance trends, top employees (task counts), lead funnel, inventory valuation.
4. **Role-Based Permissions** — roles/guards/sidebar hiding already work. Add: Access Denied page component + route.
5. **Audit Logs** — kuch nahi hai; minimal AuditLog entity + middleware/action-filter (Create/Update/Delete logging) + Admin viewer page. NOTE: ActivityLog entity already exists in BusinessEntities.cs.
6. **File Upload** — profile image upload endpoint exists; generic document module heavy — user se poochho kitna chahiye. Document entity already exists.

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
