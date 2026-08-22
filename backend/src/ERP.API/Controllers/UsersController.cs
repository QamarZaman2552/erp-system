using ERP.Application.Common;
using ERP.Application.DTOs.Auth;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    public UsersController(IUserService userService) => _userService = userService;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PaginationParams pagination)
        => Ok(await _userService.GetAllAsync(pagination));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        var result = await _userService.CreateAsync(dto);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{id}/role")]
    public async Task<IActionResult> ChangeRole(string id, [FromBody] UpdateUserRoleDto dto)
    {
        var result = await _userService.ChangeRoleAsync(id, dto);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> SetStatus(string id, [FromBody] UpdateUserStatusDto dto)
    {
        var result = await _userService.SetStatusAsync(id, dto);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(string id, [FromBody] AdminResetPasswordDto dto)
    {
        var result = await _userService.AdminResetPasswordAsync(id, dto);
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}
