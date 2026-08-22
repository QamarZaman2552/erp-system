using ERP.Application.DTOs.Employee;
using ERP.Application.DTOs.Business;
using ERP.Application.Validators;
using ERP.Domain.Enums;

namespace ERP.UnitTests.ValidatorTests;

public class HRAndBusinessValidatorTests
{
    private readonly CreateEmployeeDtoValidator _createEmployee = new();
    private readonly CreateLeaveRequestDtoValidator _leave = new();
    private readonly GeneratePayrollDtoValidator _payroll = new();
    private readonly ApproveLeaveDtoValidator _approveLeave = new();
    private readonly CreateSalesOrderDtoValidator _salesOrder = new();

    public static TheoryData<DateTime> InvalidBirthDates => new()
    {
        new DateTime(1899, 12, 31),
        DateTime.UtcNow.AddDays(1)
    };

    public static CreateEmployeeDto ValidEmployee() => new(
        "John", "Doe", "john@corp.com", "+1-555-0100",
        new DateTime(1995, 5, 10), DateTime.UtcNow.AddYears(-1),
        Gender.Male, null, null, null, 100000,
        Guid.NewGuid(), Guid.NewGuid(), null);

    [Fact]
    public void Employee_AcceptsFullyValidDto()
    {
        Assert.True(_createEmployee.Validate(ValidEmployee()).IsValid);
    }

    [Theory]
    [MemberData(nameof(InvalidBirthDates))]
    public void Employee_RejectsImpossibleBirthDate(DateTime birthDate)
    {
        var dto = ValidEmployee() with { DateOfBirth = birthDate };
        Assert.False(_createEmployee.Validate(dto).IsValid);
    }

    [Fact]
    public void Employee_JoiningBeforeBirth_IsRejected()
    {
        var dto = ValidEmployee() with { DateOfJoining = new DateTime(1990, 1, 1) };
        var result = _createEmployee.Validate(dto);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("after date of birth"));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-500)]
    public void Employee_NonPositiveSalary_IsRejected(decimal salary)
    {
        var dto = ValidEmployee() with { BasicSalary = salary };
        Assert.False(_createEmployee.Validate(dto).IsValid);
    }

    [Theory]
    [InlineData("abc")]
    [InlineData("+12345")]
    [InlineData("phone-with-letters")]
    public void Employee_MalformedPhone_IsRejected(string phone)
    {
        var dto = ValidEmployee() with { Phone = phone };
        Assert.False(_createEmployee.Validate(dto).IsValid);
    }

    [Fact]
    public void Leave_EndBeforeStart_IsRejected()
    {
        var dto = new CreateLeaveRequestDto(Guid.NewGuid(), LeaveType.Annual,
            new DateOnly(2026, 9, 10), new DateOnly(2026, 9, 1), "reason");
        Assert.False(_leave.Validate(dto).IsValid);
    }

    [Fact]
    public void Leave_SameDayRange_IsAccepted()
    {
        var day = new DateOnly(2026, 9, 10);
        var dto = new CreateLeaveRequestDto(Guid.NewGuid(), LeaveType.Annual, day, day, "half-day");
        Assert.True(_leave.Validate(dto).IsValid);
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(13, false)]
    [InlineData(8, true)]
    public void Payroll_MonthMustBeWithinCalendarYear(int month, bool expectedValid)
    {
        var dto = new GeneratePayrollDto(month, 2026, null);
        Assert.Equal(expectedValid, _payroll.Validate(dto).IsValid);
    }

    [Fact]
    public void ApproveLeave_RejectionRequiresReason()
    {
        var rejecting = _approveLeave.Validate(new ApproveLeaveDto(false, null));
        Assert.False(rejecting.IsValid);

        var approving = _approveLeave.Validate(new ApproveLeaveDto(true, null));
        Assert.True(approving.IsValid);
    }

    [Fact]
    public void SalesOrder_EmptyItems_IsRejected()
    {
        var dto = new CreateSalesOrderDto(Guid.NewGuid(), DateTime.UtcNow, null,
            null, []);
        Assert.False(_salesOrder.Validate(dto).IsValid);
    }

    [Fact]
    public void SalesOrder_ItemWithZeroQuantity_IsRejected()
    {
        var dto = new CreateSalesOrderDto(Guid.NewGuid(), DateTime.UtcNow, null,
            null, [new SalesOrderItemDto(Guid.NewGuid(), 0, 100m, 0)]);
        Assert.False(_salesOrder.Validate(dto).IsValid);
    }
}
