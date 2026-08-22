using ERP.Application.DTOs.Auth;
using FluentValidation;

namespace ERP.Application.Validators;

public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
{
    private static readonly string[] AllowedRoles = { "Admin", "HR", "Manager", "Employee" };

    public CreateUserDtoValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).StrongPassword();
        RuleFor(x => x.Role).NotEmpty()
            .Must(r => AllowedRoles.Contains(r))
            .WithMessage("Role must be one of: Admin, HR, Manager, Employee.");
    }
}

public class UpdateUserRoleDtoValidator : AbstractValidator<UpdateUserRoleDto>
{
    public UpdateUserRoleDtoValidator()
    {
        RuleFor(x => x.Role).NotEmpty()
            .Must(r => new[] { "Admin", "HR", "Manager", "Employee" }.Contains(r))
            .WithMessage("Role must be one of: Admin, HR, Manager, Employee.");
    }
}

public class UpdateUserStatusDtoValidator : AbstractValidator<UpdateUserStatusDto>
{
    public UpdateUserStatusDtoValidator()
    {
        RuleFor(x => x.IsActive).NotNull();
    }
}

public class AdminResetPasswordDtoValidator : AbstractValidator<AdminResetPasswordDto>
{
    public AdminResetPasswordDtoValidator()
    {
        RuleFor(x => x.NewPassword).StrongPassword();
    }
}

public static class ValidationRules
{
    public static IRuleBuilderOptions<T, string> StrongPassword<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().MinimumLength(8)
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter")
            .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter")
            .Matches("[0-9]").WithMessage("Password must contain at least one digit")
            .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain at least one special character");
}

public class LoginDtoValidator : AbstractValidator<LoginDto>
{
    public LoginDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class RefreshTokenDtoValidator : AbstractValidator<RefreshTokenDto>
{
    public RefreshTokenDtoValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

public class ForgotPasswordDtoValidator : AbstractValidator<ForgotPasswordDto>
{
    public ForgotPasswordDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
    }
}

public class ResetPasswordDtoValidator : AbstractValidator<ResetPasswordDto>
{
    public ResetPasswordDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.NewPassword).StrongPassword();
    }
}

public class ChangePasswordDtoValidator : AbstractValidator<ChangePasswordDto>
{
    public ChangePasswordDtoValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty();
        RuleFor(x => x.NewPassword)
            .StrongPassword()
            .NotEqual(x => x.CurrentPassword)
            .WithMessage("New password must be different from the current password");
    }
}
