using ERP.Application.Common;
using ERP.Application.DTOs.Business;
using ERP.Application.Interfaces;
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
    public SalesOrdersController(ISalesOrderService salesOrderService) => _salesOrderService = salesOrderService;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PaginationParams pagination)
    {
        var result = await _salesOrderService.GetAllAsync(pagination);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var res = await _salesOrderService.GetByIdAsync(id);
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
    public PurchaseOrdersController(IPurchaseOrderService purchaseOrderService) => _purchaseOrderService = purchaseOrderService;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PaginationParams pagination)
    {
        var result = await _purchaseOrderService.GetAllAsync(pagination);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var res = await _purchaseOrderService.GetByIdAsync(id);
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
    public async Task<IActionResult> GetTransactions([FromQuery] PaginationParams pagination)
    {
        var result = await financeService.GetTransactionsAsync(pagination);
        return Ok(result);
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
}
