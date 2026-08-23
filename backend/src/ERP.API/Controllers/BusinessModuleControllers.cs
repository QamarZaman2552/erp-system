using ERP.Application.Common;
using ERP.Application.DTOs.Business;
using ERP.Application.Interfaces;
using ERP.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    public ProductsController(IProductService productService) => _productService = productService;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PaginationParams pagination)
    {
        var result = await _productService.GetAllAsync(pagination);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var res = await _productService.GetByIdAsync(id);
        if (!res.Success) return NotFound(res);
        return Ok(res);
    }

    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock()
    {
        var list = await _productService.GetLowStockAsync();
        return Ok(list);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
    {
        var res = await _productService.CreateAsync(dto);
        return Ok(res);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProductDto dto)
    {
        var res = await _productService.UpdateAsync(id, dto);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPost("adjust-stock")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> AdjustStock([FromBody] StockAdjustmentDto dto)
    {
        var res = await _productService.AdjustStockAsync(dto);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpGet("{id:guid}/movements")]
    public async Task<IActionResult> GetMovements(Guid id)
    {
        var result = await _productService.GetMovementsAsync(id);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var res = await _productService.DeleteAsync(id);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SalesOrdersController : ControllerBase
{
    private readonly ISalesOrderService _salesOrderService;
    private readonly ICurrentUserService _currentUser;
    public SalesOrdersController(ISalesOrderService salesOrderService, ICurrentUserService currentUser)
    {
        _salesOrderService = salesOrderService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PaginationParams pagination)
    {
        var result = await _salesOrderService.GetAllAsync(pagination);
        return Ok(result);
    }

    // Reports must be registered before {id:guid} routes — "reports" is not a guid anyway
    [HttpGet("reports/monthly")]
    public async Task<IActionResult> MonthlyReport([FromQuery] int year = 0)
    {
        if (year == 0) year = DateTime.UtcNow.Year;
        var list = await _salesOrderService.GetMonthlyReportAsync(year);
        return Ok(list);
    }

    [HttpGet("reports/by-customer")]
    public async Task<IActionResult> CustomerWiseReport([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => Ok(await _salesOrderService.GetCustomerWiseReportAsync(from, to));

    [HttpGet("reports/by-product")]
    public async Task<IActionResult> ProductWiseReport([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] int top = 10)
        => Ok(await _salesOrderService.GetProductWiseReportAsync(from, to, top));

    [HttpPost("overdue-reminders")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> SendOverdueReminders()
    {
        var count = await _salesOrderService.SendOverdueRemindersAsync();
        return Ok(new { success = true, data = $"{count} overdue reminder(s) processed" });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var res = await _salesOrderService.GetByIdAsync(id);
        if (!res.Success) return NotFound(res);
        return Ok(res);
    }

    [HttpGet("{id:guid}/detail")]
    public async Task<IActionResult> GetDetail(Guid id)
    {
        var res = await _salesOrderService.GetDetailAsync(id);
        if (!res.Success) return NotFound(res);
        return Ok(res);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSalesOrderDto dto)
    {
        var res = await _salesOrderService.CreateAsync(dto);
        return Ok(res);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromQuery] string status)
    {
        var res = await _salesOrderService.UpdateStatusAsync(id, status);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPost("{id:guid}/confirm")]
    public async Task<IActionResult> Confirm(Guid id)
    {
        var res = await _salesOrderService.ConfirmAsync(id, _currentUser.UserId ?? "System");
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var res = await _salesOrderService.CancelAsync(id, _currentUser.UserId ?? "System");
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPost("{id:guid}/return")]
    public async Task<IActionResult> Return(Guid id)
    {
        var res = await _salesOrderService.ReturnAsync(id, _currentUser.UserId ?? "System");
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPost("{id:guid}/payments")]
    public async Task<IActionResult> RecordPayment(Guid id, [FromBody] RecordPaymentDto dto)
    {
        var res = await _salesOrderService.RecordPaymentAsync(id, dto, _currentUser.UserId ?? "System");
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpGet("{id:guid}/payments")]
    public async Task<IActionResult> GetPayments(Guid id)
        => Ok(await _salesOrderService.GetPaymentsAsync(id));

    [HttpGet("{id:guid}/invoice-pdf")]
    public async Task<IActionResult> InvoicePdf(Guid id)
    {
        try
        {
            var pdf = await _salesOrderService.GenerateInvoicePdfAsync(id);
            return File(pdf, "application/pdf", $"invoice-{id:N}.pdf");
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("{id:guid}/email-invoice")]
    public async Task<IActionResult> EmailInvoice(Guid id)
    {
        var res = await _salesOrderService.EmailInvoiceAsync(id);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var res = await _salesOrderService.DeleteAsync(id);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PurchaseOrdersController : ControllerBase
{
    private readonly IPurchaseOrderService _purchaseOrderService;
    private readonly ICurrentUserService _currentUser;
    public PurchaseOrdersController(IPurchaseOrderService purchaseOrderService, ICurrentUserService currentUser)
    {
        _purchaseOrderService = purchaseOrderService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PaginationParams pagination)
    {
        var result = await _purchaseOrderService.GetAllAsync(pagination);
        return Ok(result);
    }

    [HttpGet("reports/monthly")]
    public async Task<IActionResult> MonthlyReport([FromQuery] int year = 0)
    {
        if (year == 0) year = DateTime.UtcNow.Year;
        var list = await _purchaseOrderService.GetMonthlyReportAsync(year);
        return Ok(list);
    }

    [HttpGet("reports/by-supplier")]
    public async Task<IActionResult> SupplierWiseReport([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => Ok(await _purchaseOrderService.GetSupplierWiseReportAsync(from, to));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var res = await _purchaseOrderService.GetByIdAsync(id);
        if (!res.Success) return NotFound(res);
        return Ok(res);
    }

    [HttpGet("{id:guid}/detail")]
    public async Task<IActionResult> GetDetail(Guid id)
    {
        var res = await _purchaseOrderService.GetDetailAsync(id);
        if (!res.Success) return NotFound(res);
        return Ok(res);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Create([FromBody] CreatePurchaseOrderDto dto)
    {
        var res = await _purchaseOrderService.CreateAsync(dto);
        return Ok(res);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromQuery] string status)
    {
        var res = await _purchaseOrderService.UpdateStatusAsync(id, status);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPost("{id:guid}/confirm")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Confirm(Guid id)
    {
        var res = await _purchaseOrderService.ConfirmAsync(id, _currentUser.UserId ?? "System");
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var res = await _purchaseOrderService.CancelAsync(id, _currentUser.UserId ?? "System");
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPost("{id:guid}/receive")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> ReceiveItems(Guid id, [FromBody] List<ReceiveItemDto> items)
    {
        var res = await _purchaseOrderService.ReceiveItemsAsync(id, items, _currentUser.UserId ?? "System");
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPut("{id:guid}/supplier-invoice")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> SetSupplierInvoiceNumber(Guid id, [FromBody] SetSupplierInvoiceDto dto)
    {
        var res = await _purchaseOrderService.SetSupplierInvoiceNumberAsync(id, dto.InvoiceNumber);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPost("{id:guid}/email-to-supplier")]
    public async Task<IActionResult> EmailToSupplier(Guid id)
    {
        var res = await _purchaseOrderService.EmailToSupplierAsync(id);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPost("{id:guid}/payments")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> RecordPayment(Guid id, [FromBody] RecordPaymentDto dto)
    {
        var res = await _purchaseOrderService.RecordPaymentAsync(id, dto, _currentUser.UserId ?? "System");
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpGet("{id:guid}/payments")]
    public async Task<IActionResult> GetPayments(Guid id)
        => Ok(await _purchaseOrderService.GetPaymentsAsync(id));

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var res = await _purchaseOrderService.DeleteAsync(id);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FinanceController(
    IFinanceService financeService,
    ICurrentUserService currentUser) : ControllerBase
{

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] PaginationParams pagination,
        [FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] TransactionType? type)
    {
        var result = await financeService.GetTransactionsAsync(pagination, from, to, type);
        return Ok(result);
    }

    [HttpGet("transactions/export-csv")]
    public async Task<IActionResult> ExportCsv([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var csv = await financeService.ExportTransactionsCsvAsync(from, to);
        return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", $"transactions-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => Ok(await financeService.GetSummaryAsync(from, to));

    [HttpGet("reports/by-department")]
    public async Task<IActionResult> DeptExpenseReport([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => Ok(await financeService.GetDepartmentExpenseReportAsync(from, to));

    [HttpGet("reports/by-category")]
    public async Task<IActionResult> CategoryExpenseReport([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => Ok(await financeService.GetCategoryExpenseReportAsync(from, to));

    [HttpGet("budgets/alerts")]
    public async Task<IActionResult> BudgetAlerts([FromQuery] int month, [FromQuery] int year)
        => Ok(await financeService.GetBudgetAlertsAsync(month, year));

    [HttpGet("reports/export-pdf")]
    public async Task<IActionResult> ExportReportPdf([FromQuery] int year = 0, [FromQuery] int? quarter = null, [FromQuery] int? month = null)
    {
        if (year == 0) year = DateTime.UtcNow.Year;
        var pdf = await financeService.ExportFinancialReportPdfAsync(year, quarter, month);
        return File(pdf, "application/pdf", $"financial-report-{year}.pdf");
    }

    [HttpPost("transactions")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateFinanceTransactionDto dto)
    {
        var res = await financeService.CreateTransactionAsync(dto);
        return Ok(res);
    }

    [HttpGet("expenses")]
    public async Task<IActionResult> GetExpenses([FromQuery] PaginationParams pagination)
    {
        var result = await financeService.GetExpensesAsync(pagination);
        return Ok(result);
    }

    [HttpPost("expenses")]
    public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseDto dto)
    {
        var res = await financeService.CreateExpenseAsync(dto);
        return Ok(res);
    }

    [HttpPost("expenses/{id:guid}/approve")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> ApproveExpense(Guid id, [FromBody] ApproveExpenseDto dto)
    {
        var res = await financeService.ApproveExpenseAsync(id, dto, currentUser.UserId ?? "System");
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpGet("budgets")]
    public async Task<IActionResult> GetBudgets([FromQuery] int month, [FromQuery] int year)
    {
        var list = await financeService.GetBudgetsAsync(month, year);
        return Ok(list);
    }

    [HttpPost("budgets")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateBudget([FromBody] CreateBudgetDto dto)
    {
        var res = await financeService.CreateBudgetAsync(dto);
        return Ok(res);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    public DashboardController(IDashboardService dashboardService) => _dashboardService = dashboardService;

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _dashboardService.GetStatsAsync();
        return Ok(stats);
    }

    [HttpGet("revenue-chart")]
    public async Task<IActionResult> GetRevenueChart([FromQuery] int year)
    {
        if (year == 0) year = DateTime.UtcNow.Year;
        var data = await _dashboardService.GetMonthlyRevenueAsync(year);
        return Ok(data);
    }

    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopProducts()
    {
        var list = await _dashboardService.GetTopProductsAsync();
        return Ok(list);
    }

    [HttpGet("recent-activities")]
    public async Task<IActionResult> GetRecentActivities()
    {
        var list = await _dashboardService.GetRecentActivitiesAsync();
        return Ok(list);
    }

    // ─── Reports & Analytics ──────────────────────────────────────────────────

    [HttpGet("reports/attendance-trends")]
    public async Task<IActionResult> AttendanceTrends([FromQuery] int weeks = 8)
        => Ok(await _dashboardService.GetAttendanceTrendsAsync(weeks));

    [HttpGet("reports/dept-distribution")]
    public async Task<IActionResult> DeptDistribution()
        => Ok(await _dashboardService.GetDeptDistributionAsync());

    [HttpGet("reports/project-completion")]
    public async Task<IActionResult> ProjectCompletion()
        => Ok(await _dashboardService.GetProjectCompletionAsync());

    [HttpGet("reports/leave-utilization")]
    public async Task<IActionResult> LeaveUtilization([FromQuery] int year = 0)
        => Ok(await _dashboardService.GetLeaveUtilizationAsync(year == 0 ? DateTime.UtcNow.Year : year));

    [HttpGet("reports/payroll-cost")]
    public async Task<IActionResult> PayrollCost([FromQuery] int year = 0)
        => Ok(await _dashboardService.GetPayrollCostTrendAsync(year == 0 ? DateTime.UtcNow.Year : year));

    [HttpGet("reports/top-employees")]
    public async Task<IActionResult> TopEmployees([FromQuery] int limit = 5)
        => Ok(await _dashboardService.GetTopEmployeesAsync(limit));

    [HttpGet("reports/inventory-valuation")]
    public async Task<IActionResult> InventoryValuation()
        => Ok(await _dashboardService.GetInventoryValuationAsync());

    [HttpGet("reports/customer-acquisition")]
    public async Task<IActionResult> CustomerAcquisition([FromQuery] int year = 0)
        => Ok(await _dashboardService.GetCustomerAcquisitionAsync(year == 0 ? DateTime.UtcNow.Year : year));

    [HttpGet("reports/lead-funnel")]
    public async Task<IActionResult> LeadFunnel()
        => Ok(await _dashboardService.GetLeadFunnelAsync());
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController(
    INotificationService notificationService,
    ICurrentUserService currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMy([FromQuery] bool unreadOnly = false, [FromQuery] int limit = 50)
        => Ok(await notificationService.GetMyAsync(currentUser.UserId!, unreadOnly, limit));

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount()
        => Ok(new { count = await notificationService.GetUnreadCountAsync(currentUser.UserId!) });

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        var res = await notificationService.MarkReadAsync(id, currentUser.UserId!);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await notificationService.MarkAllReadAsync(currentUser.UserId!);
        return Ok(new { success = true, data = "All notifications marked as read" });
    }

    [HttpDelete]
    public async Task<IActionResult> ClearAll()
    {
        await notificationService.ClearAllAsync(currentUser.UserId!);
        return Ok(new { success = true, data = "Notifications cleared" });
    }

    [HttpPost("announce")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Announce([FromBody] CreateAnnouncementDto dto)
    {
        await notificationService.CreateForAllAsync(dto.Title, dto.Message, ERP.Domain.Enums.NotificationType.System);
        return Ok(new { success = true, data = "Announcement sent to all users" });
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SuppliersController : ControllerBase
{
    private readonly ISupplierService _supplierService;
    public SuppliersController(ISupplierService supplierService) => _supplierService = supplierService;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _supplierService.GetAllAsync();
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Create([FromBody] CreateSupplierDto dto)
    {
        var res = await _supplierService.CreateAsync(dto);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateSupplierDto dto)
    {
        var res = await _supplierService.UpdateAsync(id, dto);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly IProductCategoryService _categoryService;
    public CategoriesController(IProductCategoryService categoryService) => _categoryService = categoryService;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _categoryService.GetAllAsync();
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Create([FromBody] CreateProductCategoryDto dto)
    {
        var res = await _categoryService.CreateAsync(dto);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }
}
