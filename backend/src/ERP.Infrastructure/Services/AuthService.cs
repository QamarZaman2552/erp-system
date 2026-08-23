using ERP.Application.Common;
using ERP.Application.DTOs.Auth;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace ERP.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ITokenService _tokenService;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;
    private readonly Data.AppDbContext _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ITokenService tokenService,
        IEmailService emailService,
        IConfiguration config,
        Data.AppDbContext db,
        IHttpContextAccessor httpContextAccessor)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _emailService = emailService;
        _config = config;
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    private string? ClientIp =>
        _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

    private async Task WriteLogAsync(string userId, string userName, string action)
    {
        try
        {
            var ua = _httpContextAccessor.HttpContext?.Request.Headers["User-Agent"].ToString() ?? "";
            _db.ActivityLogs.Add(new ActivityLog
            {
                UserId = userId,
                UserName = userName,
                Action = action,
                EntityType = "Auth",
                IpAddress = ClientIp,
                UserAgent = ua.Length > 300 ? ua[..300] : ua,
                Timestamp = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();
        }
        catch { /* audit must never break auth */ }
    }

    public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null || !user.IsActive)
        {
            await WriteLogAsync(dto.Email, dto.Email, "LoginFailed (unknown/inactive account)");
            return ApiResponse<AuthResponseDto>.Fail("Invalid credentials.");
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.Password, lockoutOnFailure: true);
        if (result.IsLockedOut)
        {
            var minutesLeft = user.LockoutEnd.HasValue
                ? Math.Max(1, (int)Math.Ceiling((user.LockoutEnd.Value - DateTimeOffset.UtcNow).TotalMinutes))
                : 15;
            await WriteLogAsync(user.Id, user.UserName ?? user.Email!, $"LoginLockedOut — too many failed attempts");
            return ApiResponse<AuthResponseDto>.Fail(
                $"Account temporarily locked due to multiple failed attempts. Try again in {minutesLeft} minute(s).");
        }
        if (!result.Succeeded)
        {
            await WriteLogAsync(user.Id, user.UserName ?? user.Email!, "LoginFailed (wrong password)");
            return ApiResponse<AuthResponseDto>.Fail("Invalid credentials.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _tokenService.GenerateAccessToken(user.Id, user.Email!, roles);
        var refreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        await WriteLogAsync(user.Id, user.UserName ?? user.Email!, "Login");

        return ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto(
            accessToken, refreshToken, 3600,
            new UserInfoDto(user.Id, user.FullName, user.Email!, roles.FirstOrDefault() ?? "Employee", user.ProfileImageUrl)
        ));
    }

    public async Task<ApiResponse<AuthResponseDto>> RefreshTokenAsync(string refreshToken)
    {
        var user = _userManager.Users.FirstOrDefault(u => u.RefreshToken == refreshToken && u.RefreshTokenExpiry > DateTime.UtcNow);
        if (user == null)
            return ApiResponse<AuthResponseDto>.Fail("Invalid or expired refresh token.");

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _tokenService.GenerateAccessToken(user.Id, user.Email!, roles);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        return ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto(
            accessToken, newRefreshToken, 3600,
            new UserInfoDto(user.Id, user.FullName, user.Email!, roles.FirstOrDefault() ?? "Employee", user.ProfileImageUrl)
        ));
    }

    public async Task<ApiResponse<string>> ForgotPasswordAsync(string email)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
            return ApiResponse<string>.Ok("If the email exists, a reset link has been sent.");

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = Uri.EscapeDataString(token);
        var frontendUrl = _config["FrontendUrl"] ?? "http://localhost:4200";
        var resetLink = $"{frontendUrl}/auth/reset-password?email={email}&token={encodedToken}";

        await _emailService.SendPasswordResetEmailAsync(email, resetLink);
        return ApiResponse<string>.Ok("If the email exists, a reset link has been sent.");
    }

    public async Task<ApiResponse<string>> ResetPasswordAsync(ResetPasswordDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
            return ApiResponse<string>.Fail("Invalid request.");

        var result = await _userManager.ResetPasswordAsync(user, dto.Token, dto.NewPassword);
        if (!result.Succeeded)
            return ApiResponse<string>.Fail("Password reset failed.", result.Errors.Select(e => e.Description).ToList());

        return ApiResponse<string>.Ok("Password reset successfully.");
    }

    public async Task<ApiResponse<string>> ChangePasswordAsync(string userId, ChangePasswordDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return ApiResponse<string>.Fail("User not found.");

        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded)
            return ApiResponse<string>.Fail("Password change failed.", result.Errors.Select(e => e.Description).ToList());

        return ApiResponse<string>.Ok("Password changed successfully.");
    }

    public async Task<ApiResponse<string>> LogoutAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user != null)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            await _userManager.UpdateAsync(user);
            await WriteLogAsync(user.Id, user.UserName ?? user.Email!, "Logout");
        }
        return ApiResponse<string>.Ok("Logged out successfully.");
    }
}
