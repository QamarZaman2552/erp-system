# 🗄️ Database Design (EF Core Code-First)

## 📌 Architecture
The ERP data layer utilizes **Microsoft Entity Framework Core** with SQL Server as the relational store. All database tables inherit from `BaseEntity` providing soft deletion (`IsDeleted`), timestamp tracking (`CreatedAt`, `UpdatedAt`), and audit user fields.

---

## 🏛️ Schema Map

### 1. Identity & Access Control
- `AspNetUsers` (`ApplicationUser`): Extended with FullName, RefreshToken, Expiry, Active status.
- `AspNetRoles`: Admin, HR, Manager, Employee.
- `AspNetUserRoles`: User-to-Role mappings.

### 2. Human Resources (HR)
- `Departments`: Id, Name, Description, ManagerId, IsActive.
- `Designations`: Id, DepartmentId, Title, MinSalary, MaxSalary, IsActive.
- `Employees`: Id, EmployeeCode, FirstName, LastName, Email, Phone, DateOfBirth, DateOfJoining, DepartmentId, DesignationId, BasicSalary, Status, ProfileImageUrl.
- `Attendances`: Id, EmployeeId, AttendanceDate, CheckInTime, CheckOutTime, WorkingHours, IsPresent, IsLateArrival, Remarks.
- `LeaveRequests`: Id, EmployeeId, LeaveType, StartDate, EndDate, TotalDays, Reason, Status, ApprovedById.
- `PayrollRecords`: Id, EmployeeId, Month, Year, BasicSalary, HouseAllowance, TransportAllowance, MedicalAllowance, GrossSalary, TaxDeduction, ProvidentFund, NetSalary, Status, PaidAt.

### 3. CRM & Customers
- `Customers`: Id, Name, Email, Phone, Company, Address, City, Country, TotalPurchaseValue, IsActive.
- `Leads`: Id, CustomerId, Title, ContactName, EstimatedValue, Status (New, Contacted, Qualified, Won, Lost).
- `Interactions`: Id, CustomerId, Type (Call, Email, Meeting), Subject, Notes, InteractionDate, FollowUpDate.

### 4. Projects & Tasks
- `Projects`: Id, Name, Description, StartDate, EndDate, Status, Budget, ActualCost, Progress, ManagerId.
- `ProjectTasks`: Id, ProjectId, Title, Description, Priority, Status (Todo, InProgress, Review, Done), DueDate, EstimatedHours, ActualHours, ParentTaskId.
- `TaskAssignments`: Id, TaskId, EmployeeId.

### 5. Inventory & Supply Chain
- `ProductCategories`: Id, Name, Description.
- `Suppliers`: Id, Name, ContactPerson, Email, Phone, Country, TotalPurchaseValue.
- `Products`: Id, Code, Name, CategoryId, SupplierId, CostPrice, SellingPrice, CurrentStock, MinimumStock, ReorderLevel.
- `StockMovements`: Id, ProductId, Type (In, Out, Adjustment), Quantity, PreviousStock, NewStock, Notes.

### 6. Sales & Purchases
- `SalesOrders`: Id, OrderNumber, CustomerId, OrderDate, DeliveryDate, Status, PaymentStatus, SubTotal, TaxAmount, TotalAmount, PaidAmount.
- `SalesOrderItems`: Id, SalesOrderId, ProductId, Quantity, UnitPrice, Discount, TotalPrice.
- `PurchaseOrders`: Id, OrderNumber, SupplierId, OrderDate, DeliveryDate, Status, SubTotal, TaxAmount, TotalAmount.
- `PurchaseOrderItems`: Id, PurchaseOrderId, ProductId, Quantity, UnitPrice, TotalPrice.

### 7. Finance & Accounting
- `FinanceCategories`: Id, Name, Type (Income, Expense).
- `FinanceTransactions`: Id, CategoryId, Type, Amount, TransactionDate, Description, Reference.
- `Expenses`: Id, Title, Amount, ExpenseDate, Category, ReceiptUrl, Status, SubmittedByUserId, ApprovedByUserId.
- `Budgets`: Id, Name, AllocatedAmount, SpentAmount, Department, Month, Year.

### 8. System & Audit
- `Notifications`: Id, UserId, Title, Message, Type, IsRead, ReadAt.
- `ActivityLogs`: Id, UserId, UserName, Action, EntityType, EntityId, IpAddress, Timestamp.
