using ERP.Application.Common;
using ERP.Application.DTOs.Employee;
using ERP.Domain.Enums;
using ERP.Infrastructure.Services;
using ERP.UnitTests.Services;

namespace ERP.UnitTests.EmployeeServiceTests;

public class EmployeeServiceTests : ServiceTestBase
{
    private async Task<(AppDbContext db, Guid deptId, Guid desigId)> SeedAsync()
    {
        var db = CreateDbContext();
        var dept = Department();
        db.Departments.Add(dept);
        await db.SaveChangesAsync();
        var desig = Designation(dept.Id);
        db.Designations.Add(desig);
        await db.SaveChangesAsync();
        return (db, dept.Id, desig.Id);
    }

    [Fact]
    public async Task CreateAsync_GeneratesSequentialEmployeeCode()
    {
        var (db, deptId, desigId) = await SeedAsync();
        var service = new EmployeeService(db, CreateUserManager(db));

        var result = await service.CreateAsync(new CreateEmployeeDto(
            "John", "Doe", "john@test.com", "+1-555-0100",
            new DateTime(1995, 5, 10), DateTime.UtcNow.AddYears(-1),
            Gender.Male, null, null, null, 100000, deptId, desigId, null));

        Assert.True(result.Success);
        Assert.Equal("EMP-0001", result.Data!.EmployeeCode);
    }

    [Fact]
    public async Task CreateAsync_SecondEmployeeGetsNextCode()
    {
        var (db, deptId, desigId) = await SeedAsync();
        var service = new EmployeeService(db, CreateUserManager(db));
        var dto = new CreateEmployeeDto("Jane", "Smith", "jane@test.com", null,
            new DateTime(1994, 3, 3), DateTime.UtcNow.AddYears(-1), Gender.Female,
            null, null, null, 90000, deptId, desigId, null);

        await service.CreateAsync(dto with { Email = "a@test.com" });
        var second = await service.CreateAsync(dto with { Email = "b@test.com" });

        Assert.Equal("EMP-0002", second.Data!.EmployeeCode);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsFail_WhenNotFound()
    {
        var db = CreateDbContext();
        var service = new EmployeeService(db, CreateUserManager(db));

        var result = await service.GetByIdAsync(Guid.NewGuid());

        Assert.False(result.Success);
        Assert.Equal("Employee not found", result.Message);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsMappedDto_WhenExists()
    {
        var (db, deptId, desigId) = await SeedAsync();
        var emp = Employee(deptId, desigId, salary: 123000);
        db.Employees.Add(emp);
        await db.SaveChangesAsync();

        var service = new EmployeeService(db, CreateUserManager(db));
        var result = await service.GetByIdAsync(emp.Id);

        Assert.True(result.Success);
        Assert.Equal("John Doe", result.Data!.FullName);
        Assert.Equal(123000, result.Data.BasicSalary);
        Assert.Equal("Engineering", result.Data.DepartmentName);
        Assert.Equal("Software Engineer", result.Data.DesignationTitle);
    }

    [Fact]
    public async Task GetAllAsync_PaginatesCorrectly()
    {
        var (db, deptId, desigId) = await SeedAsync();
        for (var i = 0; i < 15; i++)
            db.Employees.Add(Employee(deptId, desigId));
        await db.SaveChangesAsync();

        var service = new EmployeeService(db, CreateUserManager(db));
        var page1 = await service.GetAllAsync(Pagination(page: 1, pageSize: 10));
        var page2 = await service.GetAllAsync(Pagination(page: 2, pageSize: 10));

        Assert.Equal(15, page1.TotalCount);
        Assert.Equal(10, page1.Items.Count);
        Assert.Equal(5, page2.Items.Count);
        Assert.False(page1.HasPreviousPage);
        Assert.True(page1.HasNextPage);
        Assert.True(page2.HasPreviousPage);
        Assert.False(page2.HasNextPage);
    }

    [Fact]
    public async Task GetAllAsync_SearchTermFiltersByEmail()
    {
        var (db, deptId, desigId) = await SeedAsync();
        db.Employees.Add(Employee(deptId, desigId, email: "unique.marker@corp.com"));
        db.Employees.Add(Employee(deptId, desigId));
        await db.SaveChangesAsync();

        var service = new EmployeeService(db, CreateUserManager(db));
        var result = await service.GetAllAsync(new PaginationParams { SearchTerm = "unique.marker" });

        Assert.Equal(1, result.TotalCount);
        Assert.Contains("unique.marker", result.Items.Single().Email);
    }
}
