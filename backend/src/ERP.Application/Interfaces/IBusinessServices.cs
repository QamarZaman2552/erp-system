using ERP.Application.Common;
using ERP.Application.DTOs.Business;

namespace ERP.Application.Interfaces;

public interface ICustomerService
{
    Task<PagedResult<CustomerDto>> GetAllAsync(PaginationParams pagination);
    Task<ApiResponse<CustomerDto>> GetByIdAsync(Guid id);
    Task<ApiResponse<CustomerDto>> CreateAsync(CreateCustomerDto dto);
    Task<ApiResponse<CustomerDto>> UpdateAsync(Guid id, UpdateCustomerDto dto);
    Task<ApiResponse<string>> DeleteAsync(Guid id);
}

public interface ILeadService
{
    Task<PagedResult<LeadDto>> GetAllAsync(PaginationParams pagination);
    Task<ApiResponse<LeadDto>> GetByIdAsync(Guid id);
    Task<ApiResponse<LeadDto>> CreateAsync(CreateLeadDto dto);
    Task<ApiResponse<LeadDto>> UpdateAsync(Guid id, UpdateLeadDto dto);
    Task<ApiResponse<string>> DeleteAsync(Guid id);
}

public interface IProjectService
{
    Task<PagedResult<ProjectDto>> GetAllAsync(PaginationParams pagination);
    Task<ApiResponse<ProjectDto>> GetByIdAsync(Guid id);
    Task<ApiResponse<ProjectDto>> CreateAsync(CreateProjectDto dto);
    Task<ApiResponse<ProjectDto>> UpdateAsync(Guid id, UpdateProjectDto dto);
    Task<ApiResponse<string>> DeleteAsync(Guid id);
}

public interface ITaskService
{
    Task<PagedResult<TaskDto>> GetByProjectAsync(Guid projectId, PaginationParams pagination);
    Task<PagedResult<TaskDto>> GetMyTasksAsync(string userId, PaginationParams pagination);
    Task<List<TaskDto>> GetOverdueTasksAsync();
    Task<ApiResponse<TaskDto>> CreateAsync(CreateTaskDto dto);
    Task<ApiResponse<TaskDto>> UpdateAsync(Guid id, UpdateTaskDto dto);
    Task<ApiResponse<string>> DeleteAsync(Guid id);
}

public interface IProductService
{
    Task<PagedResult<ProductDto>> GetAllAsync(PaginationParams pagination);
    Task<ApiResponse<ProductDto>> GetByIdAsync(Guid id);
    Task<ApiResponse<ProductDto>> CreateAsync(CreateProductDto dto);
    Task<ApiResponse<ProductDto>> UpdateAsync(Guid id, UpdateProductDto dto);
    Task<ApiResponse<string>> DeleteAsync(Guid id);
    Task<ApiResponse<string>> AdjustStockAsync(StockAdjustmentDto dto);
    Task<List<ProductDto>> GetLowStockAsync();
    Task<List<StockMovementDto>> GetMovementsAsync(Guid productId);
}

public interface ISupplierService
{
    Task<List<SupplierDto>> GetAllAsync();
    Task<ApiResponse<SupplierDto>> CreateAsync(CreateSupplierDto dto);
    Task<ApiResponse<SupplierDto>> UpdateAsync(Guid id, CreateSupplierDto dto);
}

public interface IProductCategoryService
{
    Task<List<ProductCategoryDto>> GetAllAsync();
    Task<ApiResponse<ProductCategoryDto>> CreateAsync(CreateProductCategoryDto dto);
}

public interface ISalesOrderService
{
    Task<PagedResult<SalesOrderDto>> GetAllAsync(PaginationParams pagination);
    Task<ApiResponse<SalesOrderDto>> GetByIdAsync(Guid id);
    Task<ApiResponse<SalesOrderDto>> CreateAsync(CreateSalesOrderDto dto);
    Task<ApiResponse<string>> UpdateStatusAsync(Guid id, string status);
    Task<ApiResponse<string>> DeleteAsync(Guid id);
}

public interface IPurchaseOrderService
{
    Task<PagedResult<PurchaseOrderDto>> GetAllAsync(PaginationParams pagination);
    Task<ApiResponse<PurchaseOrderDto>> GetByIdAsync(Guid id);
    Task<ApiResponse<PurchaseOrderDto>> CreateAsync(CreatePurchaseOrderDto dto);
    Task<ApiResponse<string>> UpdateStatusAsync(Guid id, string status);
    Task<ApiResponse<string>> DeleteAsync(Guid id);
}

public interface IFinanceService
{
    Task<PagedResult<FinanceTransactionDto>> GetTransactionsAsync(PaginationParams pagination);
    Task<ApiResponse<FinanceTransactionDto>> CreateTransactionAsync(CreateFinanceTransactionDto dto);
    Task<PagedResult<ExpenseDto>> GetExpensesAsync(PaginationParams pagination);
    Task<ApiResponse<ExpenseDto>> CreateExpenseAsync(CreateExpenseDto dto);
    Task<ApiResponse<ExpenseDto>> ApproveExpenseAsync(Guid id, ApproveExpenseDto dto, string approverId);
    Task<List<BudgetDto>> GetBudgetsAsync(int month, int year);
    Task<ApiResponse<BudgetDto>> CreateBudgetAsync(CreateBudgetDto dto);
}

public interface IDashboardService
{
    Task<DashboardStatsDto> GetStatsAsync();
    Task<List<MonthlyRevenueDto>> GetMonthlyRevenueAsync(int year);
    Task<List<TopProductDto>> GetTopProductsAsync(int count = 5);
    Task<List<RecentActivityDto>> GetRecentActivitiesAsync(int count = 10);
}

public interface IInteractionService
{
    Task<List<InteractionDto>> GetByCustomerAsync(Guid customerId);
    Task<List<InteractionDto>> GetDueFollowUpsAsync();
    Task<ApiResponse<InteractionDto>> CreateAsync(CreateInteractionDto dto, string userId);
}
