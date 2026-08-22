namespace ERP.Application.DTOs.Auth;

public record UserListDto(
    string Id,
    string FullName,
    string Email,
    string Role,
    bool IsActive,
    bool IsLinkedToEmployee,
    DateTime? LastLoginAt,
    DateTimeOffset? LockedOutUntil
);

public record CreateUserDto(string FirstName, string LastName, string Email, string Password, string Role);

public record UpdateUserRoleDto(string Role);

public record UpdateUserStatusDto(bool IsActive);

public record AdminResetPasswordDto(string NewPassword);
