using ERP.Application.Common;
using ERP.Application.DTOs.Business;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerService _customerService;
    public CustomersController(ICustomerService customerService) => _customerService = customerService;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PaginationParams pagination)
    {
        var result = await _customerService.GetAllAsync(pagination);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var res = await _customerService.GetByIdAsync(id);
        if (!res.Success) return NotFound(res);
        return Ok(res);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerDto dto)
    {
        var res = await _customerService.CreateAsync(dto);
        return Ok(res);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCustomerDto dto)
    {
        var res = await _customerService.UpdateAsync(id, dto);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var res = await _customerService.DeleteAsync(id);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LeadsController : ControllerBase
{
    private readonly ILeadService _leadService;
    public LeadsController(ILeadService leadService) => _leadService = leadService;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PaginationParams pagination)
    {
        var result = await _leadService.GetAllAsync(pagination);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var res = await _leadService.GetByIdAsync(id);
        if (!res.Success) return NotFound(res);
        return Ok(res);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLeadDto dto)
    {
        var res = await _leadService.CreateAsync(dto);
        return Ok(res);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateLeadDto dto)
    {
        var res = await _leadService.UpdateAsync(id, dto);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var res = await _leadService.DeleteAsync(id);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;
    public ProjectsController(IProjectService projectService) => _projectService = projectService;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PaginationParams pagination)
    {
        var result = await _projectService.GetAllAsync(pagination);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var res = await _projectService.GetByIdAsync(id);
        if (!res.Success) return NotFound(res);
        return Ok(res);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Create([FromBody] CreateProjectDto dto)
    {
        var res = await _projectService.CreateAsync(dto);
        return Ok(res);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProjectDto dto)
    {
        var res = await _projectService.UpdateAsync(id, dto);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var res = await _projectService.DeleteAsync(id);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController(
    ITaskService taskService,
    ICurrentUserService currentUser) : ControllerBase
{

    [HttpGet("project/{projectId:guid}")]
    public async Task<IActionResult> GetByProject(Guid projectId, [FromQuery] PaginationParams pagination)
    {
        var result = await taskService.GetByProjectAsync(projectId, pagination);
        return Ok(result);
    }

    [HttpGet("my-tasks")]
    public async Task<IActionResult> GetMyTasks([FromQuery] PaginationParams pagination)
    {
        var result = await taskService.GetMyTasksAsync(currentUser.UserId ?? "", pagination);
        return Ok(result);
    }

    [HttpGet("overdue")]
    [Authorize(Roles = "Admin,Manager,HR")]
    public async Task<IActionResult> GetOverdue()
    {
        var result = await taskService.GetOverdueTasksAsync();
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTaskDto dto)
    {
        var res = await taskService.CreateAsync(dto);
        return Ok(res);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTaskDto dto)
    {
        var res = await taskService.UpdateAsync(id, dto);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var res = await taskService.DeleteAsync(id);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }
}
