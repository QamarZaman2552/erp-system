using ERP.Application.Common;
using ERP.Application.DTOs.Auth;

namespace ERP.Application.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto dto);
    Task<ApiResponse<AuthResponseDto>> RefreshTokenAsync(string refreshToken);
    Task<ApiResponse<string>> ForgotPasswordAsync(string email);
    Task<ApiResponse<string>> ResetPasswordAsync(ResetPasswordDto dto);
    Task<ApiResponse<string>> ChangePasswordAsync(string userId, ChangePasswordDto dto);
    Task<ApiResponse<string>> LogoutAsync(string userId);
}

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string htmlBody);
    Task SendEmailWithAttachmentAsync(string to, string subject, string htmlBody, string fileName, byte[] fileBytes, string contentType = "application/pdf");
    Task SendPasswordResetEmailAsync(string to, string resetLink);
    Task SendPayslipEmailAsync(string to, string employeeName, byte[] payslipPdf);
    Task SendLeaveApprovalEmailAsync(string to, string employeeName, bool isApproved);
}

public interface ITokenService
{
    string GenerateAccessToken(string userId, string email, IList<string> roles);
    string GenerateRefreshToken();
    string? GetUserIdFromToken(string token);
}

public interface ICurrentUserService
{
    string? UserId { get; }
    string? UserName { get; }
    string? UserEmail { get; }
    bool IsAuthenticated { get; }
    bool IsInRole(string role);
}
