using ERP.Application.Common;
using ERP.Application.DTOs.Auth;

namespace ERP.Application.Interfaces;

public interface IUserService
{
    Task<PagedResult<UserListDto>> GetAllAsync(PaginationParams pagination);
    Task<ApiResponse<UserListDto>> CreateAsync(CreateUserDto dto);
    Task<ApiResponse<string>> ChangeRoleAsync(string userId, UpdateUserRoleDto dto);
    Task<ApiResponse<string>> SetStatusAsync(string userId, UpdateUserStatusDto dto);
    Task<ApiResponse<string>> AdminResetPasswordAsync(string userId, AdminResetPasswordDto dto);
}
