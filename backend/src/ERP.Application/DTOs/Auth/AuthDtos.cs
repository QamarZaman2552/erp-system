namespace ERP.Application.DTOs.Auth;

public record LoginDto(string Email, string Password);

public record RegisterDto(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string Role = "Employee"
);

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    UserInfoDto User
);

public record UserInfoDto(
    string Id,
    string FullName,
    string Email,
    string Role,
    string? ProfileImageUrl
);

public record RefreshTokenDto(string RefreshToken);

public record ForgotPasswordDto(string Email);

public record ResetPasswordDto(string Email, string Token, string NewPassword);

public record ChangePasswordDto(string CurrentPassword, string NewPassword);
