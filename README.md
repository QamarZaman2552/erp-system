# 🏢 Enterprise ERP & Business Management System

<p align="center">
  <img src="https://img.shields.io/badge/ASP.NET%20Core-9.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" />
  <img src="https://img.shields.io/badge/Angular-19-DD0031?style=for-the-badge&logo=angular&logoColor=white" />
  <img src="https://img.shields.io/badge/SQL%20Server-2022-CC2927?style=for-the-badge&logo=microsoft-sql-server&logoColor=white" />
  <img src="https://img.shields.io/badge/EF%20Core-Code%20First-512BD4?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

A full-stack **Enterprise Resource Planning** suite covering HR, Projects & Tasks, Leave Management, Attendance, Payroll, CRM, Inventory, Sales, Finance, and User Administration — built with a clean-architecture .NET 9 API and an Angular signals-based SPA.

---

## ✨ Features

### 🔐 Authentication & Security
- JWT auth with access + refresh tokens, automatic silent refresh on 401
- Role-based authorization: `Admin`, `HR`, `Manager`, `Employee`
- Account lockout after repeated failed logins
- Forgot password / reset / change password flows
- Fail-safe email service (graceful skip when SMTP is not configured)

### 🛡️ Role-Based Data Scoping (Security Hardening)
- **Ownership enforcement** — employees can only apply for / cancel their own leave requests; generic check-in/out endpoints are Admin/HR-only (`me/*` endpoints for self-service)
- **Salary privacy** — `BasicSalary` is stripped from employee list/detail responses for non-Admin/HR callers (task-assignment pickers keep working)
- **Personal data isolation** — employees see only their own attendance history, sales orders, documents, expense submissions, and tasks; cross-employee IDs return `403`
- **Management-gated analytics** — finance transactions/reports/budgets, dashboard revenue charts, payroll cost, top-employees and all report endpoints restricted to `Admin, HR, Manager`
- **Personal dashboard** — employees get their own KPI cards (attendance status, pending leaves, task progress) instead of company-wide financials

### 👥 Employee Management (HR)
- Add employees with duplicate-proof auto-generated codes (`EMP-0001`, `EMP-0002`…)
- Optional **auto-created login account** on employee creation
- Edit profile, department transfer, designation promotion, salary revision
- Reporting manager assignment (org hierarchy)
- Terminate **or delete** employee → linked login account deactivates automatically; reactivate on rehire
- Search by name/email/code + filters by department & status
- Link/unlink existing user accounts to employee profiles (Admin/HR only)

### ⏱️ Attendance
- Check-in / check-out (self-service `me/*` endpoints for logged-in employees)
- Admin manual mark attendance with late-arrival detection & working-hours calculation
- **Pakistan Standard Time (UTC+5)** aware — correct check-in times, date rollover and late flag
- Reports: monthly summary per employee, late arrivals, today's absentees (Admin/HR/Manager)

### 🌴 Leave Management
- Apply with leave type, date range, reason — **auto working-days calculation** (weekends excluded)
- **Overlap detection** — blocks duplicate pending/approved leave requests
- Approve / reject flow (**rejection reason mandatory**, double-processing guard)
- "Who's on leave" monthly calendar view
- Department-wise leave report (requests & days per month)
- Employees see only their own requests; approve/reject gated to Admin/HR/Manager

### 💰 Payroll
- Monthly payroll generation from salary data
- Mark as paid, payslip view/print, personal payslips page (`/payroll/me`)
- Email payslip support (SMTP-aware)

### 📋 Projects & Tasks
- Project CRUD: name, description, client link, budget, start/deadline dates
- Status workflow: Planning → Active → On Hold → Completed / Cancelled
- Progress %, deadline extension, budget revision, project manager assignment
- **Overdue alerts** and **budget-exceeded warnings**
- Filters (status / overdue-only) + live project summary report card
- **Kanban board with drag-and-drop**: To Do → In Progress → Review → Done
- Task creation with assignee, priority (Low/Medium/High/Critical), deadline
- Reassign tasks, extend deadlines, clone & delete (manager/admin only)
- "My Tasks" list for every user with inline status updates

### 🧑‍💼 Manager Tools
- My Team page: direct reports with active task workload badges
- Overdue task list across projects with days-overdue counters

### 🙋 Self-Service Profile (`/profile`)
- Personal profile view + contact info edit (phone/city/country)
- Change password with validation
- Today's attendance status with check-in/out buttons
- Month grid of attendance history (present / late / absent color chips)
- Personal salary slips table

### 🛡️ User Administration (Admin)
- User list w/ search, create users, role changes
- Activate/deactivate accounts, admin password reset
- Lockout status display

### 🤝 CRM · 📦 Inventory · 🛒 Sales · 💰 Finance
- Customers & leads pipelines, products & stock movements, sales/purchase orders,
  transactions, expenses, budgets + dashboard KPIs and revenue charts
- Duplicate-proof order numbering (`SO-YYYY-####`, `PO-YYYY-####`) — safe across deletions
- Expense submission with ownership tracking; employees see only their own submissions

---

## 🏗️ Tech Stack & Architecture

| Layer | Technology |
|---|---|
| API | ASP.NET Core 9.0 Web API, SignalR (live notifications) |
| ORM | Entity Framework Core 9 (Code-First, SQL Server) |
| Validation | FluentValidation |
| Auth | ASP.NET Identity + JWT Bearer |
| Docs | Swagger / OpenAPI |
| Frontend | Angular 19 (standalone components, signals, lazy routes) |
| Styling | Bootstrap 5 + custom dark enterprise theme |
| Realtime | SignalR toast notifications |
| Tests | xUnit (51 unit + 14 integration), Vitest (frontend) |

**Clean Architecture:**

```
backend/
├── ERP.API/              # Controllers, Hubs, Filters, Middleware
├── ERP.Application/      # DTOs, Service interfaces, Validators
├── ERP.Domain/           # Entities & Enums
└── ERP.Infrastructure/   # EF Core DbContext, Services, Identity, Email
```

Enums are serialized as strings globally (`JsonStringEnumConverter`) so the API speaks `"Active"`, `"High"`, `"Todo"` etc. in both directions.

---

## 🚀 Getting Started

### Prerequisites
- .NET 9 SDK
- Node.js 18+
- SQL Server (LocalDB or full) — Windows Auth supported

### Backend

```bash
cd backend
dotnet ef database update --project ERP.Infrastructure --startup-project ERP.API
dotnet run --project ERP.API
# Swagger → https://localhost:7001/swagger
```

Seed data (departments, designations, demo users) is applied automatically via seeders.

### Frontend

```bash
cd frontend
npm install
npm start
# App → https://localhost:4200
```

### Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@company.com` | `Admin@1234` |
| HR | `hr@company.com` | `Hr@12345` |

---

## ✅ Quality

```bash
cd backend && dotnet test        # 65 tests (unit + integration)
cd frontend && npm test          # component tests (Vitest)
```

- Global error interceptor + toast notifications
- Unified API response envelope (`{ success, message, data, errors }`)
- FluentValidation pipeline with consistent 400 payloads

---

## 📄 License

MIT — free to use for learning and commercial projects.
