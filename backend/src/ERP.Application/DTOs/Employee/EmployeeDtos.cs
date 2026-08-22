using ERP.Domain.Enums;

namespace ERP.Application.DTOs.Employee;

public record EmployeeDto(
    Guid Id,
    string EmployeeCode,
    string FirstName,
    string LastName,
    string FullName,
    string Email,
    string? Phone,
    string DepartmentName,
    string DesignationTitle,
    decimal BasicSalary,
    EmployeeStatus Status,
    DateTime DateOfJoining,
    string? ProfileImageUrl
);

public record CreateEmployeeDto(
    string FirstName,
    string LastName,
    string Email,
    string? Phone,
    DateTime DateOfBirth,
    DateTime DateOfJoining,
    Gender Gender,
    string? Address,
    string? City,
    string? Country,
    decimal BasicSalary,
    Guid DepartmentId,
    Guid DesignationId,
    string? ManagerId,
    string? ApplicationUserId = null,
    string? NewUserPassword = null
);

public record UpdateEmployeeDto(
    string FirstName,
    string LastName,
    string? Phone,
    DateTime DateOfBirth,
    Gender Gender,
    string? Address,
    string? City,
    string? Country,
    decimal BasicSalary,
    Guid DepartmentId,
    Guid DesignationId,
    EmployeeStatus Status,
    string? ManagerId = null
);

public record DepartmentDto(Guid Id, string Name, string? Description, int EmployeeCount, bool IsActive);
public record CreateDepartmentDto(string Name, string? Description);
public record UpdateDepartmentDto(string Name, string? Description, bool IsActive);

public record DesignationDto(Guid Id, string Title, string DepartmentName, decimal MinSalary, decimal MaxSalary, bool IsActive);
public record CreateDesignationDto(string Title, string? Description, Guid DepartmentId, decimal MinSalary, decimal MaxSalary);
public record UpdateDesignationDto(string Title, string? Description, Guid DepartmentId, decimal MinSalary, decimal MaxSalary, bool IsActive);

public record AttendanceDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    DateOnly AttendanceDate,
    TimeOnly? CheckInTime,
    TimeOnly? CheckOutTime,
    double? WorkingHours,
    bool IsPresent,
    bool IsLateArrival,
    string? Remarks
);
public record CheckInDto(Guid EmployeeId, string? Remarks);

public record CheckOutDto(Guid EmployeeId, string? Remarks);

public record SelfAttendanceDto(string? Remarks);

public record LinkableUserDto(string Id, string Email, string FullName, string Role, bool IsLinked);

public record MonthlyAttendanceSummaryDto(
    Guid EmployeeId,
    string EmployeeName,
    string DepartmentName,
    int PresentDays,
    int LateDays,
    double TotalHours
);

public record AbsenteeDto(Guid EmployeeId, string EmployeeCode, string EmployeeName, string DepartmentName);

public record TeamMemberDto(
    Guid EmployeeId,
    string EmployeeCode,
    string EmployeeName,
    string Email,
    string DepartmentName,
    string DesignationTitle,
    int ActiveTaskCount
);

public record MyProfileDto(
    Guid Id,
    string EmployeeCode,
    string FullName,
    string Email,
    string? Phone,
    string DepartmentName,
    string DesignationTitle,
    string Status,
    DateTime DateOfJoining,
    string? ProfileImageUrl,
    string? City,
    string? Country
);

public record UpdateMeDto(string? Phone, string? City, string? Country);

public record LeaveRequestDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    LeaveType LeaveType,
    DateOnly StartDate,
    DateOnly EndDate,
    int TotalDays,
    string Reason,
    LeaveStatus Status,
    DateTime CreatedAt
);

public record CreateLeaveRequestDto(
    Guid EmployeeId,
    LeaveType LeaveType,
    DateOnly StartDate,
    DateOnly EndDate,
    string Reason
);

public record ApproveLeaveDto(bool IsApproved, string? RejectionReason);

public record PayrollDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    int Month,
    int Year,
    decimal BasicSalary,
    decimal GrossSalary,
    decimal NetSalary,
    PayrollStatus Status,
    DateTime? PaidAt
);

public record GeneratePayrollDto(int Month, int Year, List<Guid>? EmployeeIds);
