using ERP.Application.DTOs.Employee;
using ERP.Domain.Enums;
using ERP.Infrastructure.Services;
using ERP.UnitTests.Services;

namespace ERP.UnitTests.PayrollServiceTests;

public class PayrollServiceTests : ServiceTestBase
{
    private async Task<(AppDbContext db, List<Guid> empIds)> SeedEmployeesAsync(params decimal[] salaries)
    {
        var db = CreateDbContext();
        var dept = Department();
        db.Departments.Add(dept);
        await db.SaveChangesAsync();
        var desig = Designation(dept.Id);
        db.Designations.Add(desig);
        await db.SaveChangesAsync();

        var ids = new List<Guid>();
        foreach (var salary in salaries)
        {
            var emp = Employee(dept.Id, desig.Id, salary);
            db.Employees.Add(emp);
            ids.Add(emp.Id);
        }
        await db.SaveChangesAsync();
        return (db, ids);
    }

    [Fact]
    public async Task GeneratePayrollAsync_ComputesAllowancesAndDeductionsCorrectly()
    {
        const decimal basic = 100000m;
        var (db, ids) = await SeedEmployeesAsync(basic);
        var service = new PayrollService(db);

        var result = await service.GeneratePayrollAsync(new GeneratePayrollDto(8, 2026, null));

        Assert.True(result.Success);
        var record = result.Data!.Single();

        var house = basic * 0.20m;
        var transport = basic * 0.10m;
        var medical = basic * 0.10m;
        var gross = basic + house + transport + medical;   // 140000
        var net = gross - (gross * 0.05m * 2);             // tax 5% + pf 5%

        Assert.Equal(140000m, record.GrossSalary);
        Assert.Equal(126000m, record.NetSalary);
        Assert.Equal(PayrollStatus.Processed, record.Status);
    }

    [Fact]
    public async Task GeneratePayrollAsync_IsIdempotentPerMonth()
    {
        var (db, ids) = await SeedEmployeesAsync(80000);
        var service = new PayrollService(db);
        var dto = new GeneratePayrollDto(8, 2026, null);

        var firstRun = await service.GeneratePayrollAsync(dto);
        var secondRun = await service.GeneratePayrollAsync(dto);

        Assert.Single(firstRun.Data!);
        Assert.Single(secondRun.Data!);
        Assert.Equal(firstRun.Data![0].Id, secondRun.Data![0].Id);
        Assert.Equal(1, db.PayrollRecords.Count());
    }

    [Fact]
    public async Task GeneratePayrollAsync_FiltersByEmployeeIds_WhenProvided()
    {
        var (db, ids) = await SeedEmployeesAsync(70000, 70000, 70000);
        var service = new PayrollService(db);

        var result = await service.GeneratePayrollAsync(new GeneratePayrollDto(8, 2026, [ids[0]]));

        Assert.Single(result.Data!);
    }

    [Fact]
    public async Task MarkAsPaidAsync_SetsStatusAndTimestamp()
    {
        var (db, ids) = await SeedEmployeesAsync(60000);
        var service = new PayrollService(db);
        var generated = await service.GeneratePayrollAsync(new GeneratePayrollDto(8, 2026, null));

        var paid = await service.MarkAsPaidAsync(generated.Data!.Single().Id);

        Assert.True(paid.Success);
        var record = db.PayrollRecords.Single();
        Assert.Equal(PayrollStatus.Paid, record.Status);
        Assert.NotNull(record.PaidAt);
    }

    [Fact]
    public async Task GeneratePayslipPdfAsync_ReturnsNonEmptyContent()
    {
        var (db, ids) = await SeedEmployeesAsync(50000);
        var service = new PayrollService(db);
        var generated = await service.GeneratePayrollAsync(new GeneratePayrollDto(8, 2026, null));

        var pdf = await service.GeneratePayslipPdfAsync(generated.Data!.Single().Id);

        Assert.NotEmpty(pdf);
    }
}
