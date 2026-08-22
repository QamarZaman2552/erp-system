using ERP.Application.Common;
using ERP.Domain.Entities;
using ERP.Domain.Enums;
using ERP.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace ERP.UnitTests.Services;

public abstract class ServiceTestBase
{
    protected AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: $"erp-tests-{Guid.NewGuid()}")
            .Options;
        return new AppDbContext(options);
    }

    protected static UserManager<ApplicationUser> CreateUserManager(AppDbContext db) =>
        new(
            new UserStore<ApplicationUser>(db),
            Options.Create(new IdentityOptions()),
            new PasswordHasher<ApplicationUser>(),
            Enumerable.Empty<IUserValidator<ApplicationUser>>(),
            Enumerable.Empty<IPasswordValidator<ApplicationUser>>(),
            new UpperInvariantLookupNormalizer(),
            new IdentityErrorDescriber(),
            null!,
            null!);

    protected static Department Department() => new() { Name = "Engineering" };

    protected static Designation Designation(Guid departmentId) =>
        new() { Title = "Software Engineer", DepartmentId = departmentId, MinSalary = 50000, MaxSalary = 150000 };

    protected static Employee Employee(Guid departmentId, Guid designationId, decimal salary = 100000, string? email = null) =>
        new()
        {
            EmployeeCode = $"EMP-{Guid.NewGuid():N}"[..12],
            FirstName = "John",
            LastName = "Doe",
            Email = email ?? $"{Guid.NewGuid():N}@test.com",
            DateOfBirth = new DateTime(1995, 5, 10),
            DateOfJoining = DateTime.UtcNow.AddYears(-2),
            Gender = Gender.Male,
            BasicSalary = salary,
            DepartmentId = departmentId,
            DesignationId = designationId,
            Status = EmployeeStatus.Active
        };

    protected static PaginationParams Pagination(int page = 1, int pageSize = 10) => new() { Page = page, PageSize = pageSize };
}
