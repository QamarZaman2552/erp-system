using ERP.Application.Common;
using ERP.Application.DTOs.Employee;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController(
    IAttendanceService attendanceService,
    ICurrentUserService currentUser) : ControllerBase
{

    [HttpGet("today")]
    public async Task<IActionResult> GetToday([FromQuery] PaginationParams pagination)
    {
        var result = await attendanceService.GetTodayAsync(pagination);
        return Ok(result);
    }

    [HttpGet("monthly-report")]
    public async Task<IActionResult> MonthlyReport([FromQuery] int month, [FromQuery] int year)
        => Ok(await attendanceService.GetMonthlyReportAsync(month, year));

    [HttpGet("late-arrivals")]
    public async Task<IActionResult> LateArrivals([FromQuery] int month, [FromQuery] int year)
        => Ok(await attendanceService.GetLateArrivalsAsync(month, year));

    [HttpGet("absentees")]
    public async Task<IActionResult> Absentees([FromQuery] DateOnly? date)
        => Ok(await attendanceService.GetAbsenteesAsync(date ?? DateOnly.FromDateTime(DateTime.UtcNow)));

    [HttpGet("employee/{employeeId:guid}")]
    public async Task<IActionResult> GetByEmployee(Guid employeeId, [FromQuery] int month, [FromQuery] int year, [FromQuery] PaginationParams pagination)
    {
        var result = await attendanceService.GetByEmployeeAsync(employeeId, month, year, pagination);
        return Ok(result);
    }

    [HttpPost("check-in")]
    public async Task<IActionResult> CheckIn([FromBody] CheckInDto dto)
    {
        var res = await attendanceService.CheckInAsync(dto);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPost("manual")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> ManualEntry([FromBody] ManualAttendanceDto dto)
    {
        var res = await attendanceService.ManualEntryAsync(dto);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPost("me/check-in")]
    public async Task<IActionResult> CheckInMe([FromBody] SelfAttendanceDto? dto)
    {
        var res = await attendanceService.CheckInForCurrentUserAsync(currentUser.UserId!, dto?.Remarks);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPost("me/check-out")]
    public async Task<IActionResult> CheckOutMe([FromBody] SelfAttendanceDto? dto)
    {
        var res = await attendanceService.CheckOutForCurrentUserAsync(currentUser.UserId!, dto?.Remarks);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPost("check-out")]
    public async Task<IActionResult> CheckOut([FromBody] CheckOutDto dto)
    {
        var res = await attendanceService.CheckOutAsync(dto);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeavesController(
    ILeaveService leaveService,
    ICurrentUserService currentUser) : ControllerBase
{

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PaginationParams pagination)
    {
        if (User.IsInRole("Admin") || User.IsInRole("HR") || User.IsInRole("Manager"))
        {
            var result = await leaveService.GetAllAsync(pagination);
            return Ok(result);
        }

        var mine = await leaveService.GetMyLeavesAsync(currentUser.UserId ?? "", pagination);
        return Ok(mine);
    }

    [HttpGet("employee/{employeeId:guid}")]
    public async Task<IActionResult> GetByEmployee(Guid employeeId, [FromQuery] PaginationParams pagination)
    {
        var result = await leaveService.GetByEmployeeAsync(employeeId, pagination);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLeaveRequestDto dto)
    {
        var result = await leaveService.CreateAsync(dto);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id:guid}/approve")]
    [Authorize(Roles = "Admin,HR,Manager")]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveLeaveDto dto)
    {
        var result = await leaveService.ApproveAsync(id, dto, currentUser.UserId ?? "System");
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var result = await leaveService.CancelAsync(id, currentUser.UserId ?? "System");
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PayrollController : ControllerBase
{
    private readonly IPayrollService _payrollService;
    private readonly ICurrentUserService _currentUser;
    public PayrollController(IPayrollService payrollService, ICurrentUserService currentUser)
    {
        _payrollService = payrollService;
        _currentUser = currentUser;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> GetAll([FromQuery] int month, [FromQuery] int year, [FromQuery] PaginationParams pagination)
    {
        var result = await _payrollService.GetAllAsync(month, year, pagination);
        return Ok(result);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyPayrolls([FromQuery] PaginationParams pagination)
    {
        var result = await _payrollService.GetMyPayrollsAsync(_currentUser.UserId ?? "", pagination);
        return Ok(result);
    }

    [HttpGet("employee/{employeeId:guid}")]
    public async Task<IActionResult> GetByEmployee(Guid employeeId, [FromQuery] PaginationParams pagination)
    {
        var result = await _payrollService.GetByEmployeeAsync(employeeId, pagination);
        return Ok(result);
    }

    [HttpPost("generate")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Generate([FromBody] GeneratePayrollDto dto)
    {
        var result = await _payrollService.GeneratePayrollAsync(dto);
        return Ok(result);
    }

    [HttpPost("{id:guid}/pay")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> MarkPaid(Guid id)
    {
        var result = await _payrollService.MarkAsPaidAsync(id);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpGet("{id:guid}/payslip")]
    public async Task<IActionResult> DownloadPayslip(Guid id)
    {
        var pdf = await _payrollService.GeneratePayslipPdfAsync(id);
        return File(pdf, "application/pdf", $"payslip_{id}.pdf");
    }
}
