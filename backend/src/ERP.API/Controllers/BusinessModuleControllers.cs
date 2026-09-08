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
        var filterUserId = _currentUser.IsInRole("Employee") ? _currentUser.UserId : null;
        var result = await _salesOrderService.GetAllAsync(pagination, filterUserId);
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
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> GetTransactions([FromQuery] PaginationParams pagination,
        [FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] TransactionType? type)
    {
        var result = await financeService.GetTransactionsAsync(pagination, from, to, type);
        return Ok(result);
    }

    [HttpGet("transactions/export-csv")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> ExportCsv([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var csv = await financeService.ExportTransactionsCsvAsync(from, to);
        return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", $"transactions-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    [HttpGet("summary")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> GetSummary([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => Ok(await financeService.GetSummaryAsync(from, to));

    [HttpGet("reports/by-department")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> DeptExpenseReport([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => Ok(await financeService.GetDepartmentExpenseReportAsync(from, to));

    [HttpGet("reports/by-category")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> CategoryExpenseReport([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        => Ok(await financeService.GetCategoryExpenseReportAsync(from, to));

    [HttpGet("budgets/alerts")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> BudgetAlerts([FromQuery] int month, [FromQuery] int year)
        => Ok(await financeService.GetBudgetAlertsAsync(month, year));

    [HttpGet("reports/export-pdf")]
    [Authorize(Roles = "Admin,HR,Manager")]
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
    [Authorize(Roles = "Admin,HR,Manager")]
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
    private readonly ICurrentUserService _currentUser;
    public DashboardController(IDashboardService dashboardService, ICurrentUserService currentUser)
    {
        _dashboardService = dashboardService;
        _currentUser = currentUser;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = _currentUser.IsInRole("Employee") && !string.IsNullOrEmpty(_currentUser.UserId)
            ? await _dashboardService.GetPersonalStatsAsync(_currentUser.UserId)
            : await _dashboardService.GetStatsAsync();
        return Ok(stats);
    }

    [HttpGet("revenue-chart")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> GetRevenueChart([FromQuery] int year)
    {
        if (year == 0) year = DateTime.UtcNow.Year;
        var data = await _dashboardService.GetMonthlyRevenueAsync(year);
        return Ok(data);
    }

    [HttpGet("top-products")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> GetTopProducts()
    {
        var list = await _dashboardService.GetTopProductsAsync();
        return Ok(list);
    }

    [HttpGet("recent-activities")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> GetRecentActivities()
    {
        var list = await _dashboardService.GetRecentActivitiesAsync();
        return Ok(list);
    }

    // ─── Reports & Analytics (management only) ────────────────────────────────

    [HttpGet("reports/attendance-trends")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> AttendanceTrends([FromQuery] int weeks = 8)
        => Ok(await _dashboardService.GetAttendanceTrendsAsync(weeks));

    [HttpGet("reports/dept-distribution")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> DeptDistribution()
        => Ok(await _dashboardService.GetDeptDistributionAsync());

    [HttpGet("reports/project-completion")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> ProjectCompletion()
        => Ok(await _dashboardService.GetProjectCompletionAsync());

    [HttpGet("reports/leave-utilization")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> LeaveUtilization([FromQuery] int year = 0)
        => Ok(await _dashboardService.GetLeaveUtilizationAsync(year == 0 ? DateTime.UtcNow.Year : year));

    [HttpGet("reports/payroll-cost")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> PayrollCost([FromQuery] int year = 0)
        => Ok(await _dashboardService.GetPayrollCostTrendAsync(year == 0 ? DateTime.UtcNow.Year : year));

    [HttpGet("reports/top-employees")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> TopEmployees([FromQuery] int limit = 5)
        => Ok(await _dashboardService.GetTopEmployeesAsync(limit));

    [HttpGet("reports/inventory-valuation")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> InventoryValuation()
        => Ok(await _dashboardService.GetInventoryValuationAsync());

    [HttpGet("reports/customer-acquisition")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> CustomerAcquisition([FromQuery] int year = 0)
        => Ok(await _dashboardService.GetCustomerAcquisitionAsync(year == 0 ? DateTime.UtcNow.Year : year));

    [HttpGet("reports/lead-funnel")]
    [Authorize(Roles = "Admin,HR,Manager")]
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
[Authorize(Roles = "Admin")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;
    public AuditLogsController(IAuditLogService auditLogService) => _auditLogService = auditLogService;

    [HttpGet]
    public async Task<IActionResult> GetLogs([FromQuery] PaginationParams pagination,
        [FromQuery] string? userId = null, [FromQuery] string? module = null,
        [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
        => Ok(await _auditLogService.GetLogsAsync(pagination, userId, module, from, to));

    [HttpGet("export-csv")]
    public async Task<IActionResult> ExportCsv([FromQuery] string? userId = null, [FromQuery] string? module = null,
        [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        var csv = await _auditLogService.ExportCsvAsync(userId, module, from, to);
        return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", $"audit-trail-{DateTime.UtcNow:yyyyMMdd}.csv");
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentsController(
    IDocumentService documentService,
    ICurrentUserService currentUser) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Upload([FromForm] string entityType,
        [FromForm] string entityId, [FromForm] DateTime? expiryDate)
    {
        var file = Request.Form.Files.FirstOrDefault();
        if (file == null || file.Length == 0) return BadRequest(new { success = false, message = "No file provided" });

        var res = await documentService.UploadAsync(file.OpenReadStream(), file.FileName, file.Length,
            entityType, entityId, expiryDate, currentUser.UserId ?? "System");
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PaginationParams pagination,
        [FromQuery] string? search = null, [FromQuery] string? entityType = null, [FromQuery] bool mineOnly = false)
    {
        var filterToMe = mineOnly || currentUser.IsInRole("Employee");
        var result = await documentService.SearchAsync(pagination, search, entityType,
            filterToMe ? currentUser.UserId : null);
        return Ok(result);
    }

    [HttpGet("expiring")]
    public async Task<IActionResult> Expiring([FromQuery] int days = 30)
        => Ok(await documentService.GetExpiringAsync(days));

    [HttpGet("{id:guid}/download")]
    public async Task<IActionResult> Download(Guid id)
    {
        var result = await documentService.DownloadAsync(id);
        if (result == null) return NotFound(new { success = false, message = "Document not found" });
        var (content, contentType, name) = result.Value;
        return File(content, contentType, name);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var res = await documentService.DeleteAsync(id, currentUser.UserId ?? "", currentUser.IsInRole("Admin"));
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }
}

[ApiController]
[Route("api/email-templates")]
[Authorize]
public class EmailTemplatesController : ControllerBase
{
    [HttpGet]
    public IActionResult GetAll()
    {
        var templates = new[]
        {
            new
            {
                id = "password-reset",
                name = "Password Reset",
                subject = "Enterprise ERP — Password Reset",
                description = "Sent when a user requests a password reset link.",
                htmlContent = """
                    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:32px;background:#0f172a;color:#f1f5f9;border-radius:16px">
                      <h2 style="color:#6366f1;margin-bottom:16px">🔑 Password Reset</h2>
                      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
                      <a href="{{resetLink}}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;margin:24px 0;font-weight:600">Reset Password</a>
                      <p style="color:#94a3b8;font-size:13px">If you didn't request a password reset, ignore this email.</p>
                    </div>
                    """,
                sampleData = new Dictionary<string, string>
                {
                    { "resetLink", "https://erp.company.com/reset-password?token=abc123" }
                }
            },
            new
            {
                id = "leave-approved",
                name = "Leave Approved",
                subject = "Leave Request Approved ✅",
                description = "Sent when a leave request is approved by HR/Manager.",
                htmlContent = """
                    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:32px;background:#f0fdf4;color:#1a1a2e;border-radius:16px;border:1px solid #bbf7d0">
                      <h2 style="color:#16a34a;margin-bottom:16px">✅ Leave Approved</h2>
                      <p>Dear {{employeeName}},</p>
                      <p>Your leave request has been <strong style="color:#16a34a">Approved</strong>.</p>
                      <div style="background:#dcfce7;padding:16px;border-radius:8px;margin:16px 0">
                        <p style="margin:4px 0"><strong>From:</strong> {{startDate}}</p>
                        <p style="margin:4px 0"><strong>To:</strong> {{endDate}}</p>
                        <p style="margin:4px 0"><strong>Days:</strong> {{totalDays}}</p>
                      </div>
                      <p style="color:#64748b;font-size:13px">Enjoy your time off!</p>
                    </div>
                    """,
                sampleData = new Dictionary<string, string>
                {
                    { "employeeName", "Ahmed Khan" },
                    { "startDate", "2026-09-15" },
                    { "endDate", "2026-09-19" },
                    { "totalDays", "5" }
                }
            },
            new
            {
                id = "leave-rejected",
                name = "Leave Rejected",
                subject = "Leave Request Rejected ❌",
                description = "Sent when a leave request is rejected by HR/Manager.",
                htmlContent = """
                    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:32px;background:#fef2f2;color:#1a1a2e;border-radius:16px;border:1px solid #fecaca">
                      <h2 style="color:#dc2626;margin-bottom:16px">❌ Leave Rejected</h2>
                      <p>Dear {{employeeName}},</p>
                      <p>Your leave request has been <strong style="color:#dc2626">Rejected</strong>.</p>
                      <div style="background:#fee2e2;padding:16px;border-radius:8px;margin:16px 0">
                        <p style="margin:4px 0"><strong>From:</strong> {{startDate}}</p>
                        <p style="margin:4px 0"><strong>To:</strong> {{endDate}}</p>
                        <p style="margin:4px 0"><strong>Reason:</strong> {{rejectionReason}}</p>
                      </div>
                      <p style="color:#64748b;font-size:13px">Please contact HR for more information.</p>
                    </div>
                    """,
                sampleData = new Dictionary<string, string>
                {
                    { "employeeName", "Sara Ali" },
                    { "startDate", "2026-10-01" },
                    { "endDate", "2026-10-05" },
                    { "rejectionReason", "Peak business period — limited staffing" }
                }
            },
            new
            {
                id = "payslip",
                name = "Payslip Delivery",
                subject = "Your Payslip",
                description = "Sent with payslip PDF attached when payroll is processed.",
                htmlContent = """
                    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:32px;background:#ffffff;color:#1a1a2e;border-radius:16px;border:1px solid #e2e8f0">
                      <h2 style="color:#6366f1;margin-bottom:16px">💰 Payslip</h2>
                      <p>Dear {{employeeName}},</p>
                      <p>Please find your payslip for <strong>{{payPeriod}}</strong> attached to this email.</p>
                      <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:16px 0">
                        <p style="margin:4px 0"><strong>Employee:</strong> {{employeeName}}</p>
                        <p style="margin:4px 0"><strong>Period:</strong> {{payPeriod}}</p>
                        <p style="margin:4px 0"><strong>Net Pay:</strong> {{netPay}}</p>
                      </div>
                      <p style="color:#64748b;font-size:13px">For any queries, please contact the HR department.</p>
                    </div>
                    """,
                sampleData = new Dictionary<string, string>
                {
                    { "employeeName", "Bilal Ahmed" },
                    { "payPeriod", "August 2026" },
                    { "netPay", "PKR 185,000" }
                }
            },
            new
            {
                id = "sales-invoice",
                name = "Sales Invoice",
                subject = "Invoice #{{invoiceNumber}}",
                description = "Sent when emailing a sales invoice to a customer.",
                htmlContent = """
                    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:32px;background:#ffffff;color:#1a1a2e;border-radius:16px;border:1px solid #e2e8f0">
                      <div style="background:#6366f1;color:#fff;padding:24px;border-radius:12px;margin-bottom:24px">
                        <h2 style="margin:0">📄 Invoice #{{invoiceNumber}}</h2>
                        <p style="margin:8px 0 0;opacity:0.8">Enterprise ERP System</p>
                      </div>
                      <p>Dear {{customerName}},</p>
                      <p>Please find your invoice details below:</p>
                      <table style="width:100%;border-collapse:collapse;margin:16px 0">
                        <tr style="background:#f1f5f9">
                          <td style="padding:10px;font-weight:600">Description</td>
                          <td style="padding:10px;text-align:right;font-weight:600">Amount</td>
                        </tr>
                        {{lineItems}}
                      </table>
                      <div style="background:#6366f1;color:#fff;padding:16px;border-radius:8px;text-align:right;font-size:18px;font-weight:700">
                        Total: {{totalAmount}}
                      </div>
                      <p style="color:#64748b;font-size:13px;margin-top:16px">Thank you for your business!</p>
                    </div>
                    """,
                sampleData = new Dictionary<string, string>
                {
                    { "invoiceNumber", "INV-2026-0042" },
                    { "customerName", "Tech Solutions Pvt Ltd" },
                    { "lineItems", "<tr><td style='padding:10px;border-bottom:1px solid #e2e8f0'>Web Development Services</td><td style='padding:10px;text-align:right;border-bottom:1px solid #e2e8f0'>PKR 250,000</td></tr><tr><td style='padding:10px;border-bottom:1px solid #e2e8f0'>UI/UX Design</td><td style='padding:10px;text-align:right;border-bottom:1px solid #e2e8f0'>PKR 85,000</td></tr>" },
                    { "totalAmount", "PKR 335,000" }
                }
            },
            new
            {
                id = "overdue-reminder",
                name = "Overdue Payment Reminder",
                subject = "⚠️ Payment Overdue — {{invoiceNumber}}",
                description = "Sent as a reminder for overdue invoice payments.",
                htmlContent = """
                    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:32px;background:#fffbeb;color:#1a1a2e;border-radius:16px;border:1px solid #fde68a">
                      <h2 style="color:#d97706;margin-bottom:16px">⚠️ Payment Overdue</h2>
                      <p>Dear {{customerName}},</p>
                      <p>This is a friendly reminder that your payment for invoice <strong>{{invoiceNumber}}</strong> is <strong style="color:#dc2626">{{daysOverdue}} days overdue</strong>.</p>
                      <div style="background:#fef3c7;padding:16px;border-radius:8px;margin:16px 0">
                        <p style="margin:4px 0"><strong>Invoice:</strong> {{invoiceNumber}}</p>
                        <p style="margin:4px 0"><strong>Amount Due:</strong> {{totalAmount}}</p>
                        <p style="margin:4px 0"><strong>Due Date:</strong> {{dueDate}}</p>
                        <p style="margin:4px 0"><strong>Days Overdue:</strong> {{daysOverdue}}</p>
                      </div>
                      <p>Please settle the outstanding amount at your earliest convenience.</p>
                      <p style="color:#64748b;font-size:13px">If you've already paid, please disregard this reminder.</p>
                    </div>
                    """,
                sampleData = new Dictionary<string, string>
                {
                    { "customerName", "Global Traders" },
                    { "invoiceNumber", "INV-2026-0038" },
                    { "totalAmount", "PKR 425,000" },
                    { "dueDate", "2026-08-15" },
                    { "daysOverdue", "22" }
                }
            },
            new
            {
                id = "po-to-supplier",
                name = "Purchase Order to Supplier",
                subject = "Purchase Order #{{poNumber}}",
                description = "Sent when emailing a purchase order to a supplier.",
                htmlContent = """
                    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto;padding:32px;background:#ffffff;color:#1a1a2e;border-radius:16px;border:1px solid #e2e8f0">
                      <div style="background:#0f172a;color:#fff;padding:24px;border-radius:12px;margin-bottom:24px">
                        <h2 style="margin:0">📦 Purchase Order #{{poNumber}}</h2>
                        <p style="margin:8px 0 0;opacity:0.8">Enterprise ERP System</p>
                      </div>
                      <p>Dear {{supplierName}},</p>
                      <p>Please find our purchase order details below:</p>
                      <table style="width:100%;border-collapse:collapse;margin:16px 0">
                        <tr style="background:#f1f5f9">
                          <td style="padding:10px;font-weight:600">Item</td>
                          <td style="padding:10px;text-align:center;font-weight:600">Qty</td>
                          <td style="padding:10px;text-align:right;font-weight:600">Unit Price</td>
                        </tr>
                        {{lineItems}}
                      </table>
                      <div style="background:#0f172a;color:#fff;padding:16px;border-radius:8px;text-align:right;font-size:18px;font-weight:700">
                        Total: {{totalAmount}}
                      </div>
                      <p style="color:#64748b;font-size:13px;margin-top:16px">Please confirm receipt of this order.</p>
                    </div>
                    """,
                sampleData = new Dictionary<string, string>
                {
                    { "poNumber", "PO-2026-0015" },
                    { "supplierName", "Raw Materials Co." },
                    { "lineItems", "<tr><td style='padding:10px;border-bottom:1px solid #e2e8f0'>Steel Sheets (4mm)</td><td style='padding:10px;text-align:center;border-bottom:1px solid #e2e8f0'>200</td><td style='padding:10px;text-align:right;border-bottom:1px solid #e2e8f0'>PKR 4,500</td></tr><tr><td style='padding:10px;border-bottom:1px solid #e2e8f0'>Aluminum Bars</td><td style='padding:10px;text-align:center;border-bottom:1px solid #e2e8f0'>150</td><td style='padding:10px;text-align:right;border-bottom:1px solid #e2e8f0'>PKR 3,200</td></tr>" },
                    { "totalAmount", "PKR 1,380,000" }
                }
            }
        };

        return Ok(templates);
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
