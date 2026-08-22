using ERP.Domain.Enums;

namespace ERP.Application.DTOs.Business;

// ─── CRM ──────────────────────────────────────────────────────────────────────

public record CustomerDto(
    Guid Id, string Name, string? Email, string? Phone, string? Company,
    string? City, string? Country, decimal TotalPurchaseValue, bool IsActive
);
public record CreateCustomerDto(string Name, string? Email, string? Phone, string? Company,
    string? Address, string? City, string? Country, string? Website, string? Notes);
public record UpdateCustomerDto(string Name, string? Email, string? Phone, string? Company,
    string? Address, string? City, string? Country, string? Website, string? Notes, bool IsActive);

public record LeadDto(Guid Id, string Title, string? ContactName, string? Company,
    LeadStatus Status, decimal EstimatedValue, DateTime? ExpectedCloseDate, string? AssignedToId);
public record CreateLeadDto(string Title, string? ContactName, string? ContactEmail, string? ContactPhone,
    string? Company, string? Source, decimal EstimatedValue, DateTime? ExpectedCloseDate, Guid? CustomerId, string? Notes);
public record UpdateLeadDto(string Title, string? ContactName, string? ContactEmail, string? ContactPhone,
    string? Company, LeadStatus Status, decimal EstimatedValue, DateTime? ExpectedCloseDate, string? Notes);

public record InteractionDto(Guid Id, Guid CustomerId, string CustomerName, string Type,
    string Subject, string? Notes, DateTime InteractionDate, DateTime? FollowUpDate);
public record CreateInteractionDto(Guid CustomerId, string Type, string Subject, string? Notes,
    DateTime InteractionDate, DateTime? FollowUpDate);

// ─── Projects ─────────────────────────────────────────────────────────────────

public record ProjectDto(
    Guid Id, string Name, string? Description, DateTime StartDate, DateTime? EndDate,
    ProjectStatus Status, decimal Budget, decimal ActualCost, int Progress, string? ManagerId
);
public record CreateProjectDto(string Name, string? Description, DateTime StartDate, DateTime? EndDate,
    decimal Budget, string? ManagerId, Guid? CustomerId);
public record UpdateProjectDto(string Name, string? Description, DateTime StartDate, DateTime? EndDate,
    ProjectStatus Status, decimal Budget, int Progress, string? ManagerId);

public record TaskDto(
    Guid Id, string Title, string? Description, Guid ProjectId, string ProjectName,
    ERP.Domain.Enums.TaskStatus Status, TaskPriority Priority, DateTime? DueDate,
    int EstimatedHours, int ActualHours, List<string> AssigneeNames
);
public record CreateTaskDto(string Title, string? Description, Guid ProjectId,
    TaskPriority Priority, DateTime? DueDate, int EstimatedHours, List<Guid>? AssigneeIds, Guid? ParentTaskId);
public record UpdateTaskDto(string Title, string? Description,
    ERP.Domain.Enums.TaskStatus Status, TaskPriority Priority, DateTime? DueDate,
    int EstimatedHours, int ActualHours, List<Guid>? AssigneeIds = null);

// ─── Inventory ────────────────────────────────────────────────────────────────

public record ProductDto(Guid Id, string Code, string Name, string? Description,
    string CategoryName, string? SupplierName, decimal CostPrice, decimal SellingPrice,
    int CurrentStock, int MinimumStock, bool IsActive);
public record CreateProductDto(string Name, string? Description, Guid CategoryId, Guid? SupplierId,
    decimal CostPrice, decimal SellingPrice, int MinimumStock, int ReorderLevel, string? Unit);
public record UpdateProductDto(string Name, string? Description, Guid CategoryId, Guid? SupplierId,
    decimal CostPrice, decimal SellingPrice, int MinimumStock, int ReorderLevel, string? Unit, bool IsActive);

public record StockAdjustmentDto(Guid ProductId, int Quantity, StockMovementType Type, string? Notes);

public record SupplierDto(Guid Id, string Name, string? ContactPerson, string? Email, string? Phone,
    string? Country, decimal TotalPurchaseValue, bool IsActive);
public record CreateSupplierDto(string Name, string? ContactPerson, string? Email, string? Phone,
    string? Address, string? Country);

public record ProductCategoryDto(Guid Id, string Name, string? Description, int ProductCount, bool IsActive);
public record CreateProductCategoryDto(string Name, string? Description);

// ─── Sales & Purchase ─────────────────────────────────────────────────────────

public record SalesOrderDto(
    Guid Id, string OrderNumber, string CustomerName, DateTime OrderDate,
    OrderStatus Status, PaymentStatus PaymentStatus, decimal TotalAmount, decimal PaidAmount);
public record CreateSalesOrderDto(Guid CustomerId, DateTime OrderDate, DateTime? DeliveryDate,
    string? Notes, List<SalesOrderItemDto> Items);
public record SalesOrderItemDto(Guid ProductId, int Quantity, decimal UnitPrice, decimal Discount);

public record PurchaseOrderDto(
    Guid Id, string OrderNumber, string SupplierName, DateTime OrderDate,
    OrderStatus Status, PaymentStatus PaymentStatus, decimal TotalAmount);
public record CreatePurchaseOrderDto(Guid SupplierId, DateTime OrderDate, DateTime? DeliveryDate,
    string? Notes, List<PurchaseOrderItemDto> Items);
public record PurchaseOrderItemDto(Guid ProductId, int Quantity, decimal UnitPrice);

// ─── Finance ──────────────────────────────────────────────────────────────────

public record FinanceTransactionDto(Guid Id, string CategoryName, TransactionType Type,
    decimal Amount, DateTime TransactionDate, string Description, string? Reference);
public record CreateFinanceTransactionDto(Guid CategoryId, TransactionType Type, decimal Amount,
    DateTime TransactionDate, string Description, string? Reference);

public record ExpenseDto(Guid Id, string Title, decimal Amount, DateTime ExpenseDate,
    string Category, ExpenseStatus Status, string? SubmittedBy, DateTime CreatedAt);
public record CreateExpenseDto(string Title, string? Description, decimal Amount,
    DateTime ExpenseDate, string Category, string? ReceiptUrl);
public record ApproveExpenseDto(bool IsApproved, string? RejectionReason);

public record BudgetDto(Guid Id, string Name, decimal AllocatedAmount, decimal SpentAmount,
    decimal Remaining, string Department, int Month, int Year);
public record CreateBudgetDto(string Name, decimal AllocatedAmount, string Department, int Month, int Year, string? Notes);

// ─── Dashboard ────────────────────────────────────────────────────────────────

public record DashboardStatsDto(
    int TotalEmployees,
    int ActiveEmployees,
    int TotalCustomers,
    int ActiveProjects,
    int PendingLeaves,
    int PendingExpenses,
    decimal TotalRevenue,
    decimal TotalExpenses,
    decimal NetProfit,
    int LowStockProducts,
    int PendingOrders,
    int TodayAttendance
);

public record MonthlyRevenueDto(string Month, decimal Revenue, decimal Expenses);
public record TopProductDto(string Name, int SoldQuantity, decimal Revenue);
public record RecentActivityDto(string Description, string UserName, DateTime Timestamp, string Type);
