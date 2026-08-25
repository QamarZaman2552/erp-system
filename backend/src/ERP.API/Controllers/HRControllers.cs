using ERP.Application.Common;
using ERP.Application.DTOs.Employee;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeesController : ControllerBase
{
    private readonly IEmployeeService _employeeService;
    private readonly ICurrentUserService _currentUser;
    public EmployeesController(IEmployeeService employeeService, ICurrentUserService currentUser)
    {
        _employeeService = employeeService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PaginationParams pagination, [FromQuery] Guid? departmentId, [FromQuery] int? status)
    {
        var result = await _employeeService.GetAllAsync(pagination, departmentId, status);

        // Security: only Admin/HR can see salary data (endpoint stays open for task assignment pickers)
        if (!_currentUser.IsInRole("Admin") && !_currentUser.IsInRole("HR"))
            result = new PagedResult<EmployeeDto>
            {
                Items = result.Items.Select(e => e with { BasicSalary = 0 }).ToList(),
                TotalCount = result.TotalCount,
                Page = result.Page,
                PageSize = result.PageSize
            };

        return Ok(result);
    }

    [HttpGet("my-team")]
    [Authorize(Roles = "Admin,Manager,HR")]
    public async Task<IActionResult> GetMyTeam()
    {
        var team = await _employeeService.GetMyTeamAsync(_currentUser.UserId ?? "");
        return Ok(team);
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var result = await _employeeService.GetMeAsync(_currentUser.UserId ?? "");
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateMeDto dto)
    {
        var result = await _employeeService.UpdateMeAsync(_currentUser.UserId ?? "", dto);
        if (!result.Success) return NotFound(result);
        return Ok(result);
    }

    [HttpGet("linkable-users")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> GetLinkableUsers()
    {
        var users = await _employeeService.GetLinkableUsersAsync();
        return Ok(users);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _employeeService.GetByIdAsync(id);
        if (!result.Success) return NotFound(result);

        // Security: only Admin/HR can see salary data
        if (!_currentUser.IsInRole("Admin") && !_currentUser.IsInRole("HR"))
            result = ApiResponse<EmployeeDto>.Ok(result.Data! with { BasicSalary = 0 });

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Create([FromBody] CreateEmployeeDto dto)
    {
        var result = await _employeeService.CreateAsync(dto);
        if (!result.Success) return BadRequest(result);
        return CreatedAtAction(nameof(GetById), new { id = result.Data!.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmployeeDto dto)
    {
        var result = await _employeeService.UpdateAsync(id, dto);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _employeeService.DeleteAsync(id);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _departmentService;
    public DepartmentsController(IDepartmentService departmentService) => _departmentService = departmentService;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _departmentService.GetAllAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var res = await _departmentService.GetByIdAsync(id);
        if (!res.Success) return NotFound(res);
        return Ok(res);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentDto dto)
    {
        var res = await _departmentService.CreateAsync(dto);
        return Ok(res);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDepartmentDto dto)
    {
        var res = await _departmentService.UpdateAsync(id, dto);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var res = await _departmentService.DeleteAsync(id);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DesignationsController : ControllerBase
{
    private readonly IDesignationService _designationService;
    public DesignationsController(IDesignationService designationService) => _designationService = designationService;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var list = await _designationService.GetAllAsync();
        return Ok(list);
    }

    [HttpGet("by-department/{departmentId:guid}")]
    public async Task<IActionResult> GetByDepartment(Guid departmentId)
    {
        var list = await _designationService.GetByDepartmentAsync(departmentId);
        return Ok(list);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Create([FromBody] CreateDesignationDto dto)
    {
        var res = await _designationService.CreateAsync(dto);
        return Ok(res);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,HR")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDesignationDto dto)
    {
        var res = await _designationService.UpdateAsync(id, dto);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var res = await _designationService.DeleteAsync(id);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }
}
