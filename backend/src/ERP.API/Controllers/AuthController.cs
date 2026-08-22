using ERP.Application.DTOs.Auth;
using ERP.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    IAuthService authService,
    ICurrentUserService currentUser) : ControllerBase
{

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var res = await authService.LoginAsync(dto);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto dto)
    {
        var res = await authService.RefreshTokenAsync(dto.RefreshToken);
        if (!res.Success) return Unauthorized(res);
        return Ok(res);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var res = await authService.ForgotPasswordAsync(dto.Email);
        return Ok(res);
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var res = await authService.ResetPasswordAsync(dto);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (currentUser.UserId == null) return Unauthorized();
        var res = await authService.ChangePasswordAsync(currentUser.UserId, dto);
        if (!res.Success) return BadRequest(res);
        return Ok(res);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        if (currentUser.UserId == null) return Unauthorized();
        var res = await authService.LogoutAsync(currentUser.UserId);
        return Ok(res);
    }
}
