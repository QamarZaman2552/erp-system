using ERP.Application.Common;
using ERP.Application.DTOs.Business;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;

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
public class InteractionsController : ControllerBase
{
    private readonly IInteractionService _interactionService;
    private readonly ICurrentUserService _currentUser;
    public InteractionsController(IInteractionService interactionService, ICurrentUserService currentUser)
    {
        _interactionService = interactionService;
        _currentUser = currentUser;
    }

    [HttpGet("customer/{customerId:guid}")]
    public async Task<IActionResult> GetByCustomer(Guid customerId)
    {
        var result = await _interactionService.GetByCustomerAsync(customerId);
        return Ok(result);
    }

    [HttpGet("follow-ups")]
    public async Task<IActionResult> GetDueFollowUps()
    {
        var result = await _interactionService.GetDueFollowUpsAsync();
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInteractionDto dto)
    {
        var res = await _interactionService.CreateAsync(dto, _currentUser.UserId ?? "System");
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

[ApiController]
[Route("api/tasks/recurring")]
[Authorize]
public class RecurringTasksController : ControllerBase
{
    private static readonly ConcurrentDictionary<string, object> _store = new();
    private static int _counter = 0;

    [HttpGet]
    public IActionResult GetAll()
    {
        var tasks = _store.Values.Cast<dynamic>().ToList();
        return Ok(tasks);
    }

    [HttpPost]
    public IActionResult Create([FromBody] dynamic dto)
    {
        var id = Guid.NewGuid().ToString();
        var task = new
        {
            id,
            title = (string)dto.title,
            description = (string)(dto.description ?? ""),
            frequency = (string)dto.frequency,
            startDate = (string)dto.startDate,
            endDate = (string)(dto.endDate ?? ""),
            isActive = true,
            status = "Active",
            category = (string)(dto.category ?? ""),
            assignedTo = (string)(dto.assignedTo ?? ""),
            createdBy = (string)(dto.createdBy ?? ""),
            lastExecutedAt = (string)"",
            nextExecutionDate = (string)dto.startDate,
            createdAt = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            completedCount = 0
        };
        _store.TryAdd(id, task);
        return Ok(new { success = true, data = task, message = "Recurring task created." });
    }

    [HttpPut("{id}")]
    public IActionResult Update(string id, [FromBody] dynamic dto)
    {
        if (!_store.TryGetValue(id, out var existing))
            return NotFound(new { success = false, message = "Task not found." });

        var task = new
        {
            id,
            title = (string)dto.title,
            description = (string)(dto.description ?? ""),
            frequency = (string)dto.frequency,
            startDate = (string)dto.startDate,
            endDate = (string)(dto.endDate ?? ""),
            isActive = (bool)(dto.isActive ?? true),
            status = (string)(dto.status ?? "Active"),
            category = (string)(dto.category ?? ""),
            assignedTo = (string)(dto.assignedTo ?? ""),
            createdBy = (string)(dto.createdBy ?? ""),
            lastExecutedAt = (string)(dto.lastExecutedAt ?? ""),
            nextExecutionDate = (string)(dto.nextExecutionDate ?? ""),
            createdAt = (string)(dto.createdAt ?? DateTime.UtcNow.ToString("yyyy-MM-dd")),
            completedCount = (int)(dto.completedCount ?? 0)
        };
        _store[id] = task;
        return Ok(new { success = true, data = task, message = "Task updated." });
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(string id)
    {
        if (!_store.TryRemove(id, out _))
            return NotFound(new { success = false, message = "Task not found." });
        return Ok(new { success = true, message = "Task deleted." });
    }

    [HttpPost("{id}/toggle")]
    public IActionResult Toggle(string id)
    {
        if (!_store.TryGetValue(id, out var existing))
            return NotFound(new { success = false, message = "Task not found." });

        var t = (dynamic)existing;
        string newStatus = t.status == "Paused" ? "Active" : "Paused";
        var updated = new
        {
            id = t.id,
            title = t.title,
            description = t.description,
            frequency = t.frequency,
            startDate = t.startDate,
            endDate = t.endDate,
            isActive = t.isActive,
            status = newStatus,
            category = t.category,
            assignedTo = t.assignedTo,
            createdBy = t.createdBy,
            lastExecutedAt = t.lastExecutedAt,
            nextExecutionDate = t.nextExecutionDate,
            createdAt = t.createdAt,
            completedCount = t.completedCount
        };
        _store[id] = updated;
        return Ok(new { success = true, data = updated, message = $"Task {newStatus.ToLower()}." });
    }
}
