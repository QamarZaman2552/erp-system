using ERP.Application.DTOs.Employee;
using FluentValidation;

namespace ERP.Application.Validators;

public class CheckInDtoValidator : AbstractValidator<CheckInDto>
{
    public CheckInDtoValidator()
    {
        RuleFor(x => x.EmployeeId).NotEmpty();
        RuleFor(x => x.Remarks).MaximumLength(500);
    }
}

public class CheckOutDtoValidator : AbstractValidator<CheckOutDto>
{
    public CheckOutDtoValidator()
    {
        RuleFor(x => x.EmployeeId).NotEmpty();
    }
}

public class CreateLeaveRequestDtoValidator : AbstractValidator<CreateLeaveRequestDto>
{
    public CreateLeaveRequestDtoValidator()
    {
        RuleFor(x => x.EmployeeId).NotEmpty();
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(500);
        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate)
            .WithMessage("End date must be on or after the start date");
    }
}

public class ApproveLeaveDtoValidator : AbstractValidator<ApproveLeaveDto>
{
    public ApproveLeaveDtoValidator()
    {
        RuleFor(x => x.RejectionReason)
            .NotEmpty().WithMessage("Rejection reason is required when rejecting a leave request")
            .When(x => !x.IsApproved);
        RuleFor(x => x.RejectionReason).MaximumLength(500);
    }
}

public class GeneratePayrollDtoValidator : AbstractValidator<GeneratePayrollDto>
{
    public GeneratePayrollDtoValidator()
    {
        RuleFor(x => x.Month).InclusiveBetween(1, 12);
        RuleFor(x => x.Year).InclusiveBetween(2000, 2100);
    }
}
