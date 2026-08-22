using ERP.Domain.Common;
using ERP.Domain.Enums;

namespace ERP.Domain.Entities;

public class Department : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ManagerId { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Employee> Employees { get; set; } = [];
    public ICollection<Designation> Designations { get; set; } = [];
}

public class Designation : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid DepartmentId { get; set; }
    public Department Department { get; set; } = null!;
    public decimal MinSalary { get; set; }
    public decimal MaxSalary { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Employee> Employees { get; set; } = [];
}

public class Employee : BaseEntity
{
    public string EmployeeCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public DateTime DateOfBirth { get; set; }
    public DateTime DateOfJoining { get; set; }
    public DateTime? DateOfLeaving { get; set; }
    public Gender Gender { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? ProfileImageUrl { get; set; }
    public decimal BasicSalary { get; set; }
    public EmployeeStatus Status { get; set; } = EmployeeStatus.Active;
    public string? ApplicationUserId { get; set; }

    public Guid DepartmentId { get; set; }
    public Department Department { get; set; } = null!;

    public Guid DesignationId { get; set; }
    public Designation Designation { get; set; } = null!;

    public string? ManagerId { get; set; }

    public ICollection<Attendance> Attendances { get; set; } = [];
    public ICollection<LeaveRequest> LeaveRequests { get; set; } = [];
    public ICollection<PayrollRecord> PayrollRecords { get; set; } = [];
    public ICollection<TaskAssignment> TaskAssignments { get; set; } = [];
}

public class Attendance : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public DateOnly AttendanceDate { get; set; }
    public TimeOnly? CheckInTime { get; set; }
    public TimeOnly? CheckOutTime { get; set; }
    public double? WorkingHours { get; set; }
    public bool IsPresent { get; set; }
    public bool IsLateArrival { get; set; }
    public bool IsEarlyDeparture { get; set; }
    public string? Remarks { get; set; }
}

public class LeaveRequest : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public LeaveType LeaveType { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int TotalDays { get; set; }
    public string Reason { get; set; } = string.Empty;
    public LeaveStatus Status { get; set; } = LeaveStatus.Pending;
    public string? ApprovedById { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
}

public class PayrollRecord : BaseEntity
{
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal BasicSalary { get; set; }
    public decimal HouseAllowance { get; set; }
    public decimal TransportAllowance { get; set; }
    public decimal MedicalAllowance { get; set; }
    public decimal OtherAllowances { get; set; }
    public decimal GrossSalary { get; set; }
    public decimal TaxDeduction { get; set; }
    public decimal ProvidentFund { get; set; }
    public decimal OtherDeductions { get; set; }
    public decimal NetSalary { get; set; }
    public int WorkingDays { get; set; }
    public int PresentDays { get; set; }
    public int LeaveDays { get; set; }
    public PayrollStatus Status { get; set; } = PayrollStatus.Pending;
    public DateTime? PaidAt { get; set; }
    public string? PayslipUrl { get; set; }
    public string? Remarks { get; set; }
}
