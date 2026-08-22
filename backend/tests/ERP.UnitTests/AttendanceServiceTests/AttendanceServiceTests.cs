using ERP.Application.DTOs.Employee;
using ERP.Domain.Enums;
using ERP.Infrastructure.Services;
using ERP.UnitTests.Services;

namespace ERP.UnitTests.AttendanceServiceTests;

public class AttendanceServiceTests : ServiceTestBase
{
    private async Task<(AppDbContext db, Guid empId)> SeedEmployeeAsync()
    {
        var db = CreateDbContext();
        var dept = Department();
        db.Departments.Add(dept);
        await db.SaveChangesAsync();
        var desig = Designation(dept.Id);
        db.Designations.Add(desig);
        await db.SaveChangesAsync();
        var emp = Employee(dept.Id, desig.Id);
        db.Employees.Add(emp);
        await db.SaveChangesAsync();
        return (db, emp.Id);
    }

    [Fact]
    public async Task CheckInAsync_CreatesTodaysRecord()
    {
        var (db, empId) = await SeedEmployeeAsync();
        var service = new AttendanceService(db);

        var result = await service.CheckInAsync(new CheckInDto(empId, null));

        Assert.True(result.Success);
        Assert.Equal(1, db.Attendances.Count());
        Assert.NotNull(db.Attendances.Single().CheckInTime);
    }

    [Fact]
    public async Task CheckInAsync_TwicePerDay_IsRejected()
    {
        var (db, empId) = await SeedEmployeeAsync();
        var service = new AttendanceService(db);

        await service.CheckInAsync(new CheckInDto(empId, null));
        var second = await service.CheckInAsync(new CheckInDto(empId, null));

        Assert.False(second.Success);
        Assert.Equal("Already checked in today", second.Message);
    }

    [Fact]
    public async Task CheckOutAsync_Fails_WithoutPriorCheckIn()
    {
        var (db, empId) = await SeedEmployeeAsync();
        var service = new AttendanceService(db);

        var result = await service.CheckOutAsync(new CheckOutDto(empId, null));

        Assert.False(result.Success);
    }

    [Fact]
    public async Task CheckOutAsync_ComputesWorkingHours()
    {
        var (db, empId) = await SeedEmployeeAsync();

        // Simulate a check-in 8 hours ago
        db.Attendances.Add(new Domain.Entities.Attendance
        {
            EmployeeId = empId,
            AttendanceDate = DateOnly.FromDateTime(DateTime.UtcNow),
            CheckInTime = TimeOnly.FromDateTime(DateTime.UtcNow.AddHours(-8)),
            IsPresent = true
        });
        await db.SaveChangesAsync();

        var service = new AttendanceService(db);
        var result = await service.CheckOutAsync(new CheckOutDto(empId, null));

        Assert.True(result.Success);
        var record = db.Attendances.Single();
        Assert.NotNull(record.CheckOutTime);
        Assert.InRange(record.WorkingHours!.Value, 7.9, 8.1);
    }

    [Fact]
    public async Task ManualMarkAsync_UpdatesExistingRecord()
    {
        var (db, empId) = await SeedEmployeeAsync();
        var service = new AttendanceService(db);
        var date = new DateOnly(2026, 8, 10);

        await service.ManualMarkAsync(empId, date, true, "present");
        var second = await service.ManualMarkAsync(empId, date, false, "corrected absent");

        Assert.True(second.Success);
        var record = db.Attendances.Single(a => a.AttendanceDate == date);
        Assert.False(record.IsPresent);
        Assert.Equal("corrected absent", record.Remarks);
    }
}
