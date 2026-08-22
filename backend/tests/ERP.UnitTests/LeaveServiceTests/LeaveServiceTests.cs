using ERP.Application.Common;
using ERP.Application.DTOs.Employee;
using ERP.Domain.Entities;
using ERP.Domain.Enums;
using ERP.Infrastructure.Services;
using Moq;
using ERP.UnitTests.Services;

namespace ERP.UnitTests.LeaveServiceTests;

public class LeaveServiceTests : ServiceTestBase
{
    private static Mock<IEmailService> EmailMock() => new();

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
    public async Task CreateAsync_CalculatesTotalDaysCorrectly()
    {
        var (db, empId) = await SeedEmployeeAsync();
        var service = new LeaveService(db, EmailMock().Object);
        var start = new DateOnly(2026, 9, 1);

        var result = await service.CreateAsync(new CreateLeaveRequestDto(
            empId, LeaveType.Annual, start, start.AddDays(4), "Family event"));

        Assert.True(result.Success);
        Assert.Equal(5, result.Data!.TotalDays); // inclusive of both endpoints
        Assert.Equal(LeaveStatus.Pending, result.Data.Status);
    }

    [Fact]
    public async Task CreateAsync_Fails_WhenEndDateBeforeStartDate()
    {
        var (db, empId) = await SeedEmployeeAsync();
        var service = new LeaveService(db, EmailMock().Object);

        var result = await service.CreateAsync(new CreateLeaveRequestDto(
            empId, LeaveType.Sick, new DateOnly(2026, 9, 10), new DateOnly(2026, 9, 5), "Flu"));

        Assert.False(result.Success);
        Assert.Equal("Invalid date range", result.Message);
    }

    [Fact]
    public async Task ApproveAsync_SetsApprovedStatus_AndSendsEmail()
    {
        var (db, empId) = await SeedEmployeeAsync();
        var emailMock = EmailMock();
        var service = new LeaveService(db, emailMock.Object);

        var created = await service.CreateAsync(new CreateLeaveRequestDto(
            empId, LeaveType.Annual, new DateOnly(2026, 9, 1), new DateOnly(2026, 9, 3), "Trip"));

        var approved = await service.ApproveAsync(created.Data!.Id, new ApproveLeaveDto(true, null), "approver-1");

        Assert.True(approved.Success);
        Assert.Equal(LeaveStatus.Approved, approved.Data!.Status);
        Assert.Equal("approver-1", (await db.LeaveRequests.FindAsync(created.Data!.Id))!.ApprovedById);
        emailMock.Verify(e => e.SendLeaveApprovalEmailAsync(
            It.IsAny<string>(), It.IsAny<string>(), true), Times.Once);
    }

    [Fact]
    public async Task ApproveAsync_Rejection_StoresReason()
    {
        var (db, empId) = await SeedEmployeeAsync();
        var service = new LeaveService(db, EmailMock().Object);

        var created = await service.CreateAsync(new CreateLeaveRequestDto(
            empId, LeaveType.Unpaid, new DateOnly(2026, 9, 1), new DateOnly(2026, 9, 2), "Personal"));

        var rejected = await service.ApproveAsync(
            created.Data!.Id, new ApproveLeaveDto(false, "Peak season, no coverage"), "approver-2");

        Assert.True(rejected.Success);
        Assert.Equal(LeaveStatus.Rejected, rejected.Data!.Status);
        var stored = await db.LeaveRequests.FindAsync(created.Data!.Id);
        Assert.Equal("Peak season, no coverage", stored!.RejectionReason);
    }

    [Fact]
    public async Task ApproveAsync_ReturnsFail_WhenNotFound()
    {
        var (db, _) = await SeedEmployeeAsync();
        var service = new LeaveService(db, EmailMock().Object);

        var result = await service.ApproveAsync(Guid.NewGuid(), new ApproveLeaveDto(true, null), "x");

        Assert.False(result.Success);
    }

    [Fact]
    public async Task CancelAsync_MarksCancelled()
    {
        var (db, empId) = await SeedEmployeeAsync();
        var service = new LeaveService(db, EmailMock().Object);

        var created = await service.CreateAsync(new CreateLeaveRequestDto(
            empId, LeaveType.Annual, new DateOnly(2026, 9, 1), new DateOnly(2026, 9, 2), "Plans changed"));

        var cancelled = await service.CancelAsync(created.Data!.Id, "user-1");

        Assert.True(cancelled.Success);
        Assert.Equal(LeaveStatus.Cancelled,
            (await db.LeaveRequests.FindAsync(created.Data!.Id))!.Status);
    }
}
