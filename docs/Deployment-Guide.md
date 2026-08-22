# 🚀 Deployment Guide

## 1. 🐳 Docker Deployment (Recommended for Local/Staging)

Ensure Docker Desktop is running, then run:

```bash
docker-compose up --build -d
```

Services will start at:
- **Backend API**: `http://localhost:7001`
- **Frontend SPA**: `http://localhost:4200`
- **SQL Server**: `localhost:1433`

---

## 2. ☁️ Cloud Deployment (Microsoft Azure)

### Prerequisites
- Azure CLI (`az login`)
- Azure Resource Group (`az group create --name erp-rg --location eastus`)

### Step 1: Azure SQL Database
```bash
az sql server create --name erp-sql-srv --resource-group erp-rg --location eastus --admin-user erpadmin --admin-password "YourStrongPassword123!"
az sql db create --resource-group erp-rg --server erp-sql-srv --name EnterpriseERP_DB --service-objective S0
```

### Step 2: Backend API (Azure App Service)
```bash
cd backend
dotnet publish src/ERP.API -c Release -o ./publish
az webapp up --name erp-api-backend --resource-group erp-rg --plan erp-app-plan --sku B1 --location eastus
```

### Step 3: Frontend (Azure Static Web Apps)
```bash
cd frontend
npm run build
az staticwebapp create --name erp-web-client --resource-group erp-rg --source ./dist/frontend/browser --location eastus2
```
