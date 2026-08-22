using ERP.Application.Common;
using ERP.Application.DTOs.Employee;

namespace ERP.Application.Interfaces;

public interface IEmployeeService
{
    Task<PagedResult<EmployeeDto>> GetAllAsync(PaginationParams pagination, Guid? departmentId = null, int? status = null);
    Task<ApiResponse<EmployeeDto>> GetByIdAsync(Guid id);
    Task<List<LinkableUserDto>> GetLinkableUsersAsync();
    Task<ApiResponse<EmployeeDto>> CreateAsync(CreateEmployeeDto dto);
    Task<ApiResponse<EmployeeDto>> UpdateAsync(Guid id, UpdateEmployeeDto dto);
    Task<ApiResponse<string>> DeleteAsync(Guid id);
    Task<ApiResponse<string>> UploadProfileImageAsync(Guid id, Stream imageStream, string fileName);
    Task<List<TeamMemberDto>> GetMyTeamAsync(string userId);
    Task<ApiResponse<MyProfileDto>> GetMeAsync(string userId);
    Task<ApiResponse<MyProfileDto>> UpdateMeAsync(string userId, UpdateMeDto dto);
}

public interface IDepartmentService
{
    Task<List<DepartmentDto>> GetAllAsync();
    Task<ApiResponse<DepartmentDto>> GetByIdAsync(Guid id);
    Task<ApiResponse<DepartmentDto>> CreateAsync(CreateDepartmentDto dto);
    Task<ApiResponse<DepartmentDto>> UpdateAsync(Guid id, UpdateDepartmentDto dto);
    Task<ApiResponse<string>> DeleteAsync(Guid id);
}

public interface IDesignationService
{
    Task<List<DesignationDto>> GetAllAsync();
    Task<List<DesignationDto>> GetByDepartmentAsync(Guid departmentId);
    Task<ApiResponse<DesignationDto>> CreateAsync(CreateDesignationDto dto);
    Task<ApiResponse<DesignationDto>> UpdateAsync(Guid id, UpdateDesignationDto dto);
    Task<ApiResponse<string>> DeleteAsync(Guid id);
}

public interface IAttendanceService
{
    Task<PagedResult<AttendanceDto>> GetByEmployeeAsync(Guid employeeId, int month, int year, PaginationParams pagination);
    Task<PagedResult<AttendanceDto>> GetTodayAsync(PaginationParams pagination);
    Task<ApiResponse<AttendanceDto>> CheckInAsync(CheckInDto dto);
    Task<ApiResponse<AttendanceDto>> CheckOutAsync(CheckOutDto dto);
    Task<ApiResponse<AttendanceDto>> CheckInForCurrentUserAsync(string userId, string? remarks);
    Task<ApiResponse<AttendanceDto>> CheckOutForCurrentUserAsync(string userId, string? remarks);
    Task<ApiResponse<string>> ManualMarkAsync(Guid employeeId, DateOnly date, bool isPresent, string? remarks);
    Task<ApiResponse<AttendanceDto>> ManualEntryAsync(ManualAttendanceDto dto);
    Task<List<MonthlyAttendanceSummaryDto>> GetMonthlyReportAsync(int month, int year);
    Task<List<AttendanceDto>> GetLateArrivalsAsync(int month, int year);
    Task<List<AbsenteeDto>> GetAbsenteesAsync(DateOnly date);
}

public interface ILeaveService
{
    Task<PagedResult<LeaveRequestDto>> GetAllAsync(PaginationParams pagination);
    Task<PagedResult<LeaveRequestDto>> GetByEmployeeAsync(Guid employeeId, PaginationParams pagination);
    Task<PagedResult<LeaveRequestDto>> GetMyLeavesAsync(string userId, PaginationParams pagination);
    Task<ApiResponse<LeaveRequestDto>> CreateAsync(CreateLeaveRequestDto dto);
    Task<ApiResponse<LeaveRequestDto>> ApproveAsync(Guid id, ApproveLeaveDto dto, string approverId);
    Task<ApiResponse<string>> CancelAsync(Guid id, string requesterId);
}

public interface IPayrollService
{
    Task<PagedResult<PayrollDto>> GetAllAsync(int month, int year, PaginationParams pagination);
    Task<PagedResult<PayrollDto>> GetByEmployeeAsync(Guid employeeId, PaginationParams pagination);
    Task<PagedResult<PayrollDto>> GetMyPayrollsAsync(string userId, PaginationParams pagination);
    Task<ApiResponse<List<PayrollDto>>> GeneratePayrollAsync(GeneratePayrollDto dto);
    Task<ApiResponse<string>> MarkAsPaidAsync(Guid id);
    Task<byte[]> GeneratePayslipPdfAsync(Guid payrollId);
}
