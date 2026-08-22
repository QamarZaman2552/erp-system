using ERP.Application.Common;
using ERP.Application.DTOs.Auth;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ERP.Infrastructure.Services;

public class UserService : IUserService
{
    private static readonly string[] AllowedRoles = { "Admin", "HR", "Manager", "Employee" };

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly AppDbContext _db;

    public UserService(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        AppDbContext db)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _db = db;
    }

    public async Task<PagedResult<UserListDto>> GetAllAsync(PaginationParams pagination)
    {
        var query = _userManager.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(pagination.SearchTerm))
        {
            var pattern = $"%{pagination.SearchTerm}%";
            query = query.Where(u =>
                EF.Functions.Like(u.FirstName, pattern) ||
                EF.Functions.Like(u.LastName, pattern) ||
                EF.Functions.Like(u.Email!, pattern));
        }

        var total = await query.CountAsync();
        var users = await query
            .OrderBy(u => u.Email)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .ToListAsync();

        var linkedIds = await _db.Employees.AsNoTracking()
            .Where(e => e.ApplicationUserId != null)
            .Select(e => e.ApplicationUserId!)
            .ToListAsync();

        var linkedSet = linkedIds.ToHashSet();
        var items = new List<UserListDto>();

        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            items.Add(new UserListDto(
                u.Id,
                string.IsNullOrWhiteSpace(u.FullName) ? (u.UserName ?? u.Email ?? u.Id) : u.FullName,
                u.Email ?? "",
                roles.FirstOrDefault() ?? "Employee",
                u.IsActive,
                linkedSet.Contains(u.Id),
                u.LastLoginAt,
                u.LockoutEnd
            ));
        }

        return new PagedResult<UserListDto>
        {
            Items = items,
            TotalCount = total,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<ApiResponse<UserListDto>> CreateAsync(CreateUserDto dto)
    {
        if (!AllowedRoles.Contains(dto.Role))
            return ApiResponse<UserListDto>.Fail($"Invalid role. Allowed: {string.Join(", ", AllowedRoles)}.");

        if (await _userManager.FindByEmailAsync(dto.Email) != null)
            return ApiResponse<UserListDto>.Fail("A user with this email already exists.");

        await EnsureRoleExistsAsync(dto.Role);

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            EmailConfirmed = true,
            IsActive = true
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return ApiResponse<UserListDto>.Fail(
                "User creation failed.",
                result.Errors.Select(e => e.Description).ToList());

        await _userManager.AddToRoleAsync(user, dto.Role);

        return ApiResponse<UserListDto>.Ok(
            new UserListDto(user.Id, user.FullName, user.Email!, dto.Role, true, false, null, null),
            "User created successfully");
    }

    public async Task<ApiResponse<string>> ChangeRoleAsync(string userId, UpdateUserRoleDto dto)
    {
        if (!AllowedRoles.Contains(dto.Role))
            return ApiResponse<string>.Fail($"Invalid role. Allowed: {string.Join(", ", AllowedRoles)}.");

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return ApiResponse<string>.Fail("User not found.");

        var currentRoles = await _userManager.GetRolesAsync(user);

        if (!dto.Role.Equals("Admin", StringComparison.OrdinalIgnoreCase) && currentRoles.Contains("Admin"))
        {
            var activeAdmins = (await _userManager.GetUsersInRoleAsync("Admin")).Count(a => a.IsActive);
            if (activeAdmins <= 1 && user.IsActive)
                return ApiResponse<string>.Fail("Cannot change the last active Admin's role.");
        }

        await EnsureRoleExistsAsync(dto.Role);

        foreach (var role in currentRoles.Where(r => r != dto.Role))
            await _userManager.RemoveFromRoleAsync(user, role);

        if (!currentRoles.Contains(dto.Role))
            await _userManager.AddToRoleAsync(user, dto.Role);

        return ApiResponse<string>.Ok($"Role changed to {dto.Role}.");
    }

    public async Task<ApiResponse<string>> SetStatusAsync(string userId, UpdateUserStatusDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return ApiResponse<string>.Fail("User not found.");

        if (!dto.IsActive && user.IsActive && await IsLastActiveAdminAsync(user))
            return ApiResponse<string>.Fail("Cannot deactivate the last active Admin account.");

        user.IsActive = dto.IsActive;

        if (!dto.IsActive)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            await _userManager.SetLockoutEndDateAsync(user, null);
            await _userManager.ResetAccessFailedCountAsync(user);
        }

        await _userManager.UpdateAsync(user);
        return ApiResponse<string>.Ok(dto.IsActive ? "Account activated." : "Account deactivated.");
    }

    public async Task<ApiResponse<string>> AdminResetPasswordAsync(string userId, AdminResetPasswordDto dto)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return ApiResponse<string>.Fail("User not found.");

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, dto.NewPassword);
        if (!result.Succeeded)
            return ApiResponse<string>.Fail(
                "Password reset failed.",
                result.Errors.Select(e => e.Description).ToList());

        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;
        await _userManager.SetLockoutEndDateAsync(user, null);
        await _userManager.ResetAccessFailedCountAsync(user);
        await _userManager.UpdateAsync(user);

        return ApiResponse<string>.Ok("Password reset successfully.");
    }

    private async Task<bool> IsLastActiveAdminAsync(ApplicationUser user)
    {
        var admins = await _userManager.GetUsersInRoleAsync("Admin");
        return admins.Count(a => a.IsActive) <= 1 && admins.Any(a => a.Id == user.Id);
    }

    private async Task EnsureRoleExistsAsync(string role)
    {
        if (!await _roleManager.RoleExistsAsync(role))
            await _roleManager.CreateAsync(new IdentityRole(role));
    }
}
