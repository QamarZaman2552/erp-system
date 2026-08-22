using ERP.Application.DTOs.Auth;
using ERP.Application.Validators;

namespace ERP.UnitTests.ValidatorTests;

public class AuthValidatorTests
{
    private readonly LoginDtoValidator _login = new();
    private readonly ResetPasswordDtoValidator _reset = new();
    private readonly ChangePasswordDtoValidator _change = new();
    private readonly ForgotPasswordDtoValidator _forgot = new();

    [Theory]
    [InlineData("admin@company.com", "Admin@1234", true)]
    [InlineData("", "Admin@1234", false)]
    [InlineData("not-an-email", "Admin@1234", false)]
    [InlineData("admin@company.com", "", false)]
    public void LoginDto_ValidatesEmailAndPassword(string email, string password, bool expectedValid)
    {
        var result = _login.Validate(new LoginDto(email, password));
        Assert.Equal(expectedValid, result.IsValid);
    }

    [Theory]
    [InlineData("Str0ng!Pass", true)]
    [InlineData("weakpass", false)]      // no upper, digit, special
    [InlineData("SHORT!a1", true)]       // exactly 8 chars with complexity
    [InlineData("NoDigits!", false)]
    [InlineData("NOLOWERCASE1!", false)]
    [InlineData("NoSpecial123", false)]
    public void PasswordRules_EnforceComplexity(string password, bool expectedValid)
    {
        var result = _reset.Validate(new ResetPasswordDto("user@test.com", "token-123", password));
        Assert.Equal(expectedValid, result.IsValid);
    }

    [Fact]
    public void ChangePassword_RejectsSamePassword()
    {
        var result = _change.Validate(new ChangePasswordDto("Same@1234", "Same@1234"));
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("different"));
    }

    [Fact]
    public void ForgotPassword_RejectsInvalidEmail()
    {
        Assert.False(_forgot.Validate(new ForgotPasswordDto("nope")).IsValid);
        Assert.True(_forgot.Validate(new ForgotPasswordDto("user@corp.com")).IsValid);
    }
}
