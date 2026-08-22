# 📖 Enterprise ERP API Documentation

## Overview
The Enterprise ERP Web API is built on **ASP.NET Core 9 / 8**, structured according to **Clean Architecture** patterns, and authenticated via **JWT Bearer Tokens**.

Base URL (Local): `https://localhost:7001/api`  
Swagger Endpoint: `https://localhost:7001/swagger`

---

## 🔐 Authentication & Security

All private endpoints require the `Authorization` header:
```
Authorization: Bearer <your_jwt_access_token>
```

### Endpoints
- `POST /api/auth/login` — Login with email and password
- `POST /api/auth/refresh-token` — Exchange refresh token for new access token
- `POST /api/auth/forgot-password` — Request password reset email
- `POST /api/auth/reset-password` — Reset password using token
- `POST /api/auth/change-password` — Change password for authenticated user
- `POST /api/auth/logout` — Revoke refresh token

---

## 👥 Human Resources & Employee Management

- `GET /api/employees` — Paginated list of employees with search and filters
- `GET /api/employees/{id}` — Get single employee profile
- `POST /api/employees` — Create new employee (Admin, HR)
- `PUT /api/employees/{id}` — Update employee details (Admin, HR)
- `DELETE /api/employees/{id}` — Soft delete employee (Admin)
- `GET /api/departments` — List all departments
- `POST /api/departments` — Create new department
- `GET /api/designations` — List designations
- `POST /api/attendance/check-in` — Clock in for today
- `POST /api/attendance/check-out` — Clock out for today
- `GET /api/attendance/today` — Current day attendance summary
- `GET /api/leaves` — List leave requests
- `POST /api/leaves` — Submit new leave request
- `POST /api/leaves/{id}/approve` — Approve or reject leave request
- `GET /api/payroll` — Monthly payroll records
- `POST /api/payroll/generate` — Generate monthly payroll for all or selected employees
- `GET /api/payroll/{id}/payslip` — Download payslip PDF

---

## 🤝 CRM (Customer Relationship Management)

- `GET /api/customers` — List customers
- `POST /api/customers` — Create customer
- `PUT /api/customers/{id}` — Update customer
- `DELETE /api/customers/{id}` — Delete customer
- `GET /api/leads` — Lead pipeline
- `POST /api/leads` — Create lead
- `PUT /api/leads/{id}` — Update lead status & deal value

---

## 📋 Projects & Task Management

- `GET /api/projects` — List projects
- `POST /api/projects` — Create project with budget and milestones
- `PUT /api/projects/{id}` — Update project status and progress
- `GET /api/tasks/project/{projectId}` — Kanban board tasks for project
- `GET /api/tasks/my-tasks` — Tasks assigned to current user
- `POST /api/tasks` — Create task
- `PUT /api/tasks/{id}` — Update task status (Todo, InProgress, Review, Done)

---

## 📦 Inventory Management

- `GET /api/products` — List products with stock levels
- `POST /api/products` — Create product
- `POST /api/products/adjust-stock` — Stock In / Stock Out adjustment
- `GET /api/products/low-stock` — Low stock warning alerts

---

## 🛒 Sales & Purchases

- `GET /api/salesorders` — List sales orders
- `POST /api/salesorders` — Create sales invoice / order
- `PATCH /api/salesorders/{id}/status` — Update order progress
- `GET /api/purchaseorders` — List purchase orders
- `POST /api/purchaseorders` — Create vendor purchase order

---

## 💰 Finance & Expenses

- `GET /api/finance/transactions` — Income & expense transactions ledger
- `POST /api/finance/transactions` — Record transaction
- `GET /api/finance/expenses` — Expense claims
- `POST /api/finance/expenses` — Submit expense claim with receipts
- `POST /api/finance/expenses/{id}/approve` — Approve / reject expense claim
- `GET /api/finance/budgets` — Departmental budgets vs actual spending

---

## 📊 Analytics & Dashboard

- `GET /api/dashboard/stats` — Executive KPI summary (revenue, profits, headcount, orders)
- `GET /api/dashboard/revenue-chart` — 12-month revenue vs expense comparison
- `GET /api/dashboard/top-products` — Highest selling items
- `GET /api/dashboard/recent-activities` — System audit logs and recent actions
