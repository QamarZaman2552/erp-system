using ERP.Application.DTOs.Employee;
using FluentValidation;

namespace ERP.Application.Validators;

public class CreateEmployeeDtoValidator : AbstractValidator<CreateEmployeeDto>
{
    public CreateEmployeeDtoValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(100);
        RuleFor(x => x.Phone)
            .Matches(@"^\+?[0-9\s\-()]{7,20}$")
            .When(x => !string.IsNullOrWhiteSpace(x.Phone))
            .WithMessage("Phone number format is invalid");
        RuleFor(x => x.DateOfBirth)
            .GreaterThan(new DateTime(1900, 1, 1))
            .LessThan(DateTime.UtcNow).WithMessage("Date of birth cannot be in the future");
        RuleFor(x => x.DateOfJoining)
            .LessThan(DateTime.UtcNow.AddYears(1)).WithMessage("Date of joining cannot be more than a year in the future")
            .GreaterThan(x => x.DateOfBirth).WithMessage("Date of joining must be after date of birth");
        RuleFor(x => x.BasicSalary).GreaterThan(0);
        RuleFor(x => x.DepartmentId).NotEmpty();
        RuleFor(x => x.DesignationId).NotEmpty();
    }
}

public class UpdateEmployeeDtoValidator : AbstractValidator<UpdateEmployeeDto>
{
    public UpdateEmployeeDtoValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Phone)
            .Matches(@"^\+?[0-9\s\-()]{7,20}$")
            .When(x => !string.IsNullOrWhiteSpace(x.Phone))
            .WithMessage("Phone number format is invalid");
        RuleFor(x => x.DateOfBirth)
            .GreaterThan(new DateTime(1900, 1, 1))
            .LessThan(DateTime.UtcNow).WithMessage("Date of birth cannot be in the future");
        RuleFor(x => x.BasicSalary).GreaterThan(0);
        RuleFor(x => x.DepartmentId).NotEmpty();
        RuleFor(x => x.DesignationId).NotEmpty();
    }
}

public class CreateDepartmentDtoValidator : AbstractValidator<CreateDepartmentDto>
{
    public CreateDepartmentDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(500);
    }
}

public class UpdateDepartmentDtoValidator : AbstractValidator<UpdateDepartmentDto>
{
    public UpdateDepartmentDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(500);
    }
}

public class CreateDesignationDtoValidator : AbstractValidator<CreateDesignationDto>
{
    public CreateDesignationDtoValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DepartmentId).NotEmpty();
        RuleFor(x => x.MinSalary).GreaterThanOrEqualTo(0);
        RuleFor(x => x.MaxSalary)
            .GreaterThanOrEqualTo(x => x.MinSalary)
            .WithMessage("Max salary must be greater than or equal to min salary");
    }
}

public class UpdateDesignationDtoValidator : AbstractValidator<UpdateDesignationDto>
{
    public UpdateDesignationDtoValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DepartmentId).NotEmpty();
        RuleFor(x => x.MinSalary).GreaterThanOrEqualTo(0);
        RuleFor(x => x.MaxSalary)
            .GreaterThanOrEqualTo(x => x.MinSalary)
            .WithMessage("Max salary must be greater than or equal to min salary");
    }
}
