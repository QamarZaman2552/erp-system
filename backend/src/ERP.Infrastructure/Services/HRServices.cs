using ERP.Application.Common;
using ERP.Application.DTOs.Employee;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Enums;
using ERP.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace ERP.Infrastructure.Services;

public class EmployeeService : IEmployeeService
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public EmployeeService(AppDbContext db, UserManager<ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    public async Task<PagedResult<EmployeeDto>> GetAllAsync(PaginationParams pagination, Guid? departmentId = null, int? status = null)
    {
        var query = _db.Employees
            .Include(e => e.Department)
            .Include(e => e.Designation)
            .AsNoTracking();

        if (departmentId.HasValue && departmentId.Value != Guid.Empty)
            query = query.Where(e => e.DepartmentId == departmentId.Value);

        if (status.HasValue && status.Value >= 0)
            query = query.Where(e => e.Status == (EmployeeStatus)status.Value);

        if (!string.IsNullOrWhiteSpace(pagination.SearchTerm))
        {
            var pattern = $"%{pagination.SearchTerm}%";
            query = query.Where(e =>
                EF.Functions.Like(e.FirstName, pattern) ||
                EF.Functions.Like(e.LastName, pattern) ||
                EF.Functions.Like(e.Email, pattern) ||
                EF.Functions.Like(e.EmployeeCode, pattern) ||
                EF.Functions.Like(e.Department.Name, pattern)
            );
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(e => new EmployeeDto(
                e.Id,
                e.EmployeeCode,
                e.FirstName,
                e.LastName,
                $"{e.FirstName} {e.LastName}",
                e.Email,
                e.Phone,
                e.Department.Name,
                e.Designation.Title,
                e.BasicSalary,
                e.Status,
                e.DateOfJoining,
                e.ProfileImageUrl
            ))
            .ToListAsync();

        return new PagedResult<EmployeeDto>
        {
            Items = items,
            TotalCount = total,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<ApiResponse<EmployeeDto>> GetByIdAsync(Guid id)
    {
        var e = await _db.Employees
            .Include(x => x.Department)
            .Include(x => x.Designation)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (e == null) return ApiResponse<EmployeeDto>.Fail("Employee not found");

        var dto = new EmployeeDto(
            e.Id,
            e.EmployeeCode,
            e.FirstName,
            e.LastName,
            $"{e.FirstName} {e.LastName}",
            e.Email,
            e.Phone,
            e.Department.Name,
            e.Designation.Title,
            e.BasicSalary,
            e.Status,
            e.DateOfJoining,
            e.ProfileImageUrl
        );

        return ApiResponse<EmployeeDto>.Ok(dto);
    }

    public async Task<List<LinkableUserDto>> GetLinkableUsersAsync()
    {
        return await _db.Users
            .AsNoTracking()
            .OrderBy(u => u.Email)
            .Select(u => new LinkableUserDto(
                u.Id,
                u.Email ?? "",
                string.IsNullOrWhiteSpace(u.FirstName) && string.IsNullOrWhiteSpace(u.LastName)
                    ? u.UserName ?? u.Email ?? u.Id
                    : $"{u.FirstName} {u.LastName}".Trim(),
                _db.UserRoles
                    .Where(ur => ur.UserId == u.Id)
                    .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name!)
                    .FirstOrDefault() ?? "Employee",
                _db.Employees.Any(e => e.ApplicationUserId == u.Id)
            ))
            .ToListAsync();
    }

    public async Task<ApiResponse<EmployeeDto>> CreateAsync(CreateEmployeeDto dto)
    {
        if (!string.IsNullOrEmpty(dto.ApplicationUserId))
        {
            var userExists = await _db.Users.AnyAsync(u => u.Id == dto.ApplicationUserId);
            if (!userExists)
                return ApiResponse<EmployeeDto>.Fail("Selected login account does not exist.");

            var alreadyLinked = await _db.Employees.AnyAsync(e => e.ApplicationUserId == dto.ApplicationUserId);
            if (alreadyLinked)
                return ApiResponse<EmployeeDto>.Fail("This login account is already linked to another employee profile.");
        }

        var count = await _db.Employees.CountAsync() + 1;
        var code = $"EMP-{count:D4}";

        string? newUserId = null;
        if (string.IsNullOrEmpty(dto.ApplicationUserId) && !string.IsNullOrWhiteSpace(dto.NewUserPassword))
        {
            if (dto.NewUserPassword.Length < 6)
                return ApiResponse<EmployeeDto>.Fail("Login password must be at least 6 characters.");

            if (await _userManager.FindByEmailAsync(dto.Email) != null)
                return ApiResponse<EmployeeDto>.Fail("A user account with this email already exists.");

            var newUser = new ApplicationUser
            {
                UserName = dto.Email,
                Email = dto.Email,
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            var createResult = await _userManager.CreateAsync(newUser, dto.NewUserPassword);
            if (!createResult.Succeeded)
                return ApiResponse<EmployeeDto>.Fail(string.Join("; ", createResult.Errors.Select(er => er.Description)));

            await _userManager.AddToRoleAsync(newUser, "Employee");
            newUserId = newUser.Id;
        }

        var employee = new Employee
        {
            EmployeeCode = code,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            Phone = dto.Phone,
            DateOfBirth = dto.DateOfBirth,
            DateOfJoining = dto.DateOfJoining,
            Gender = dto.Gender,
            Address = dto.Address,
            City = dto.City,
            Country = dto.Country,
            BasicSalary = dto.BasicSalary,
            DepartmentId = dto.DepartmentId,
            DesignationId = dto.DesignationId,
            ManagerId = dto.ManagerId,
            ApplicationUserId = dto.ApplicationUserId ?? newUserId,
            Status = EmployeeStatus.Active
        };

        _db.Employees.Add(employee);
        await _db.SaveChangesAsync();

        var dept = await _db.Departments.FindAsync(dto.DepartmentId);
        var desig = await _db.Designations.FindAsync(dto.DesignationId);

        var resultDto = new EmployeeDto(
            employee.Id,
            employee.EmployeeCode,
            employee.FirstName,
            employee.LastName,
            $"{employee.FirstName} {employee.LastName}",
            employee.Email,
            employee.Phone,
            dept?.Name ?? "",
            desig?.Title ?? "",
            employee.BasicSalary,
            employee.Status,
            employee.DateOfJoining,
            employee.ProfileImageUrl
        );

        return ApiResponse<EmployeeDto>.Ok(resultDto, "Employee created successfully");
    }

    public async Task<ApiResponse<EmployeeDto>> UpdateAsync(Guid id, UpdateEmployeeDto dto)
    {
        var e = await _db.Employees.Include(x => x.Department).Include(x => x.Designation).FirstOrDefaultAsync(x => x.Id == id);
        if (e == null) return ApiResponse<EmployeeDto>.Fail("Employee not found");

        e.FirstName = dto.FirstName;
        e.LastName = dto.LastName;
        e.Phone = dto.Phone;
        e.DateOfBirth = dto.DateOfBirth;
        e.Gender = dto.Gender;
        e.Address = dto.Address;
        e.City = dto.City;
        e.Country = dto.Country;
        e.BasicSalary = dto.BasicSalary;
        e.DepartmentId = dto.DepartmentId;
        e.DesignationId = dto.DesignationId;
        e.ManagerId = dto.ManagerId;
        e.Status = dto.Status;
        e.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        if (!string.IsNullOrEmpty(e.ApplicationUserId))
        {
            var linkedUser = await _userManager.FindByIdAsync(e.ApplicationUserId);
            if (linkedUser != null)
            {
                var shouldBeActive = dto.Status != EmployeeStatus.Terminated;
                if (linkedUser.IsActive != shouldBeActive)
                {
                    linkedUser.IsActive = shouldBeActive;
                    await _userManager.UpdateAsync(linkedUser);
                }
            }
        }

        var dept = await _db.Departments.FindAsync(dto.DepartmentId);
        var desig = await _db.Designations.FindAsync(dto.DesignationId);

        var resultDto = new EmployeeDto(
            e.Id,
            e.EmployeeCode,
            e.FirstName,
            e.LastName,
            $"{e.FirstName} {e.LastName}",
            e.Email,
            e.Phone,
            dept?.Name ?? "",
            desig?.Title ?? "",
            e.BasicSalary,
            e.Status,
            e.DateOfJoining,
            e.ProfileImageUrl
        );

        return ApiResponse<EmployeeDto>.Ok(resultDto, "Employee updated successfully");
    }

    public async Task<ApiResponse<string>> DeleteAsync(Guid id)
    {
        var e = await _db.Employees.FindAsync(id);
        if (e == null) return ApiResponse<string>.Fail("Employee not found");

        e.IsDeleted = true;
        e.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return ApiResponse<string>.Ok("Employee deleted successfully");
    }

    public async Task<ApiResponse<string>> UploadProfileImageAsync(Guid id, Stream imageStream, string fileName)
    {
        var e = await _db.Employees.FindAsync(id);
        if (e == null) return ApiResponse<string>.Fail("Employee not found");

        var url = $"/uploads/profiles/{id}_{fileName}";
        e.ProfileImageUrl = url;
        await _db.SaveChangesAsync();

        return ApiResponse<string>.Ok(url, "Profile image updated");
    }

    public async Task<ApiResponse<MyProfileDto>> GetMeAsync(string userId)
    {
        var e = await _db.Employees
            .AsNoTracking()
            .Include(x => x.Department)
            .Include(x => x.Designation)
            .FirstOrDefaultAsync(x => x.ApplicationUserId == userId && !x.IsDeleted);

        if (e == null)
            return ApiResponse<MyProfileDto>.Fail("No employee profile is linked to your account");

        return ApiResponse<MyProfileDto>.Ok(new MyProfileDto(
            e.Id, e.EmployeeCode, $"{e.FirstName} {e.LastName}", e.Email, e.Phone,
            e.Department.Name, e.Designation.Title, e.Status.ToString(), e.DateOfJoining,
            e.ProfileImageUrl, e.City, e.Country));
    }

    public async Task<ApiResponse<MyProfileDto>> UpdateMeAsync(string userId, UpdateMeDto dto)
    {
        var e = await _db.Employees
            .FirstOrDefaultAsync(x => x.ApplicationUserId == userId && !x.IsDeleted);

        if (e == null)
            return ApiResponse<MyProfileDto>.Fail("No employee profile is linked to your account");

        e.Phone = dto.Phone ?? e.Phone;
        e.City = dto.City ?? e.City;
        e.Country = dto.Country ?? e.Country;
        await _db.SaveChangesAsync();

        return await GetMeAsync(userId);
    }

    public async Task<List<TeamMemberDto>> GetMyTeamAsync(string userId)
    {        var manager = await _db.Employees.AsNoTracking()
            .FirstOrDefaultAsync(e => e.ApplicationUserId == userId);
        if (manager == null) return new List<TeamMemberDto>();

        var managerIdStr = manager.Id.ToString();

        return await _db.Employees
            .AsNoTracking()
            .Where(e => !e.IsDeleted && e.ManagerId == managerIdStr)
            .OrderBy(e => e.FirstName)
            .Select(e => new TeamMemberDto(
                e.Id,
                e.EmployeeCode,
                e.FirstName + " " + e.LastName,
                e.Email,
                e.Department.Name,
                e.Designation.Title,
                _db.TaskAssignments.Count(ta => ta.EmployeeId == e.Id
                    && ta.Task.Status != ERP.Domain.Enums.TaskStatus.Done
                    && ta.Task.Status != ERP.Domain.Enums.TaskStatus.Cancelled)
            ))
            .ToListAsync();
    }
}

public class DepartmentService : IDepartmentService
{
    private readonly AppDbContext _db;

    public DepartmentService(AppDbContext db) => _db = db;

    public async Task<List<DepartmentDto>> GetAllAsync()
    {
        return await _db.Departments
            .Select(d => new DepartmentDto(
                d.Id,
                d.Name,
                d.Description,
                d.Employees.Count(e => !e.IsDeleted),
                d.IsActive
            ))
            .ToListAsync();
    }

    public async Task<ApiResponse<DepartmentDto>> GetByIdAsync(Guid id)
    {
        var d = await _db.Departments.Include(x => x.Employees).FirstOrDefaultAsync(x => x.Id == id);
        if (d == null) return ApiResponse<DepartmentDto>.Fail("Department not found");

        return ApiResponse<DepartmentDto>.Ok(new DepartmentDto(
            d.Id, d.Name, d.Description, d.Employees.Count(e => !e.IsDeleted), d.IsActive
        ));
    }

    public async Task<ApiResponse<DepartmentDto>> CreateAsync(CreateDepartmentDto dto)
    {
        var dept = new Department
        {
            Name = dto.Name,
            Description = dto.Description,
            IsActive = true
        };
        _db.Departments.Add(dept);
        await _db.SaveChangesAsync();

        return ApiResponse<DepartmentDto>.Ok(new DepartmentDto(dept.Id, dept.Name, dept.Description, 0, dept.IsActive), "Department created");
    }

    public async Task<ApiResponse<DepartmentDto>> UpdateAsync(Guid id, UpdateDepartmentDto dto)
    {
        var dept = await _db.Departments.Include(x => x.Employees).FirstOrDefaultAsync(x => x.Id == id);
        if (dept == null) return ApiResponse<DepartmentDto>.Fail("Department not found");

        dept.Name = dto.Name;
        dept.Description = dto.Description;
        dept.IsActive = dto.IsActive;
        dept.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return ApiResponse<DepartmentDto>.Ok(new DepartmentDto(
            dept.Id, dept.Name, dept.Description, dept.Employees.Count(e => !e.IsDeleted), dept.IsActive
        ), "Department updated");
    }

    public async Task<ApiResponse<string>> DeleteAsync(Guid id)
    {
        var dept = await _db.Departments.FindAsync(id);
        if (dept == null) return ApiResponse<string>.Fail("Department not found");

        dept.IsDeleted = true;
        dept.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return ApiResponse<string>.Ok("Department deleted");
    }
}

public class DesignationService : IDesignationService
{
    private readonly AppDbContext _db;

    public DesignationService(AppDbContext db) => _db = db;

    public async Task<List<DesignationDto>> GetAllAsync()
    {
        return await _db.Designations
            .Include(d => d.Department)
            .Select(d => new DesignationDto(
                d.Id, d.Title, d.Department.Name, d.MinSalary, d.MaxSalary, d.IsActive
            ))
            .ToListAsync();
    }

    public async Task<List<DesignationDto>> GetByDepartmentAsync(Guid departmentId)
    {
        return await _db.Designations
            .Where(d => d.DepartmentId == departmentId)
            .Include(d => d.Department)
            .Select(d => new DesignationDto(
                d.Id, d.Title, d.Department.Name, d.MinSalary, d.MaxSalary, d.IsActive
            ))
            .ToListAsync();
    }

    public async Task<ApiResponse<DesignationDto>> CreateAsync(CreateDesignationDto dto)
    {
        var desig = new Designation
        {
            Title = dto.Title,
            Description = dto.Description,
            DepartmentId = dto.DepartmentId,
            MinSalary = dto.MinSalary,
            MaxSalary = dto.MaxSalary,
            IsActive = true
        };
        _db.Designations.Add(desig);
        await _db.SaveChangesAsync();

        var dept = await _db.Departments.FindAsync(dto.DepartmentId);
        return ApiResponse<DesignationDto>.Ok(new DesignationDto(
            desig.Id, desig.Title, dept?.Name ?? "", desig.MinSalary, desig.MaxSalary, desig.IsActive
        ), "Designation created");
    }

    public async Task<ApiResponse<DesignationDto>> UpdateAsync(Guid id, UpdateDesignationDto dto)
    {
        var desig = await _db.Designations.Include(d => d.Department).FirstOrDefaultAsync(d => d.Id == id);
        if (desig == null) return ApiResponse<DesignationDto>.Fail("Designation not found");

        desig.Title = dto.Title;
        desig.Description = dto.Description;
        desig.DepartmentId = dto.DepartmentId;
        desig.MinSalary = dto.MinSalary;
        desig.MaxSalary = dto.MaxSalary;
        desig.IsActive = dto.IsActive;
        desig.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var dept = await _db.Departments.FindAsync(dto.DepartmentId);
        return ApiResponse<DesignationDto>.Ok(new DesignationDto(
            desig.Id, desig.Title, dept?.Name ?? "", desig.MinSalary, desig.MaxSalary, desig.IsActive
        ), "Designation updated");
    }

    public async Task<ApiResponse<string>> DeleteAsync(Guid id)
    {
        var desig = await _db.Designations.FindAsync(id);
        if (desig == null) return ApiResponse<string>.Fail("Designation not found");

        desig.IsDeleted = true;
        desig.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return ApiResponse<string>.Ok("Designation deleted");
    }
}

public class AttendanceService : IAttendanceService
{
    private readonly AppDbContext _db;

    public AttendanceService(AppDbContext db) => _db = db;

    public async Task<PagedResult<AttendanceDto>> GetByEmployeeAsync(Guid employeeId, int month, int year, PaginationParams pagination)
    {
        var query = _db.Attendances
            .Include(a => a.Employee)
            .Where(a => a.EmployeeId == employeeId && a.AttendanceDate.Month == month && a.AttendanceDate.Year == year);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(a => a.AttendanceDate)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(a => new AttendanceDto(
                a.Id, a.EmployeeId, $"{a.Employee.FirstName} {a.Employee.LastName}",
                a.AttendanceDate, a.CheckInTime, a.CheckOutTime, a.WorkingHours,
                a.IsPresent, a.IsLateArrival, a.Remarks
            ))
            .ToListAsync();

        return new PagedResult<AttendanceDto>
        {
            Items = items,
            TotalCount = total,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<PagedResult<AttendanceDto>> GetTodayAsync(PaginationParams pagination)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var query = _db.Attendances
            .Include(a => a.Employee)
            .Where(a => a.AttendanceDate == today);

        var total = await query.CountAsync();
        var items = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(a => new AttendanceDto(
                a.Id, a.EmployeeId, $"{a.Employee.FirstName} {a.Employee.LastName}",
                a.AttendanceDate, a.CheckInTime, a.CheckOutTime, a.WorkingHours,
                a.IsPresent, a.IsLateArrival, a.Remarks
            ))
            .ToListAsync();

        return new PagedResult<AttendanceDto>
        {
            Items = items,
            TotalCount = total,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<List<MonthlyAttendanceSummaryDto>> GetMonthlyReportAsync(int month, int year)
    {
        var rows = await _db.Attendances
            .AsNoTracking()
            .Where(a => a.AttendanceDate.Month == month && a.AttendanceDate.Year == year)
            .Select(a => new
            {
                a.EmployeeId,
                Name = a.Employee.FirstName + " " + a.Employee.LastName,
                Dept = a.Employee.Department.Name,
                a.IsPresent,
                a.IsLateArrival,
                a.WorkingHours
            })
            .ToListAsync();

        return rows
            .GroupBy(r => new { r.EmployeeId, r.Name, r.Dept })
            .Select(g => new MonthlyAttendanceSummaryDto(
                g.Key.EmployeeId,
                g.Key.Name,
                g.Key.Dept,
                g.Count(x => x.IsPresent),
                g.Count(x => x.IsLateArrival),
                g.Sum(x => x.WorkingHours ?? 0)))
            .OrderBy(r => r.EmployeeName)
            .ToList();
    }

    public async Task<List<AttendanceDto>> GetLateArrivalsAsync(int month, int year)
    {
        return await _db.Attendances
            .AsNoTracking()
            .Where(a => a.IsLateArrival && a.AttendanceDate.Month == month && a.AttendanceDate.Year == year)
            .OrderByDescending(a => a.AttendanceDate)
            .Select(a => new AttendanceDto(
                a.Id, a.EmployeeId, $"{a.Employee.FirstName} {a.Employee.LastName}",
                a.AttendanceDate, a.CheckInTime, a.CheckOutTime, a.WorkingHours,
                a.IsPresent, a.IsLateArrival, a.Remarks
            ))
            .ToListAsync();
    }

    public async Task<List<AbsenteeDto>> GetAbsenteesAsync(DateOnly date)
    {
        var markedEmployeeIds = _db.Attendances
            .Where(a => a.AttendanceDate == date)
            .Select(a => a.EmployeeId);

        return await _db.Employees
            .AsNoTracking()
            .Where(e => !e.IsDeleted
                && e.Status == EmployeeStatus.Active
                && !_db.Attendances.Any(a => a.AttendanceDate == date && a.EmployeeId == e.Id))
            .OrderBy(e => e.FirstName)
            .Select(e => new AbsenteeDto(
                e.Id,
                e.EmployeeCode,
                $"{e.FirstName} {e.LastName}",
                e.Department.Name
            ))
            .ToListAsync();
    }

    public async Task<ApiResponse<AttendanceDto>> CheckInAsync(CheckInDto dto)
    {
        var employeeExists = await _db.Employees.AnyAsync(e => e.Id == dto.EmployeeId);
        if (!employeeExists)
            return ApiResponse<AttendanceDto>.Fail("Employee not found. Please create an employee profile first.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var existing = await _db.Attendances.FirstOrDefaultAsync(a => a.EmployeeId == dto.EmployeeId && a.AttendanceDate == today);

        var nowTime = TimeOnly.FromDateTime(DateTime.UtcNow);
        var isLate = nowTime > new TimeOnly(9, 30);

        if (existing != null)
        {
            if (existing.CheckInTime.HasValue)
                return ApiResponse<AttendanceDto>.Fail("Already checked in today");

            existing.CheckInTime = nowTime;
            existing.IsPresent = true;
            existing.IsLateArrival = isLate;
            existing.Remarks = dto.Remarks ?? existing.Remarks;
            await _db.SaveChangesAsync();

            var emp = await _db.Employees.FindAsync(dto.EmployeeId);
            return ApiResponse<AttendanceDto>.Ok(new AttendanceDto(
                existing.Id, existing.EmployeeId, $"{emp?.FirstName} {emp?.LastName}",
                existing.AttendanceDate, existing.CheckInTime, existing.CheckOutTime,
                existing.WorkingHours, existing.IsPresent, existing.IsLateArrival, existing.Remarks
            ), "Checked in successfully");
        }

        var att = new Attendance
        {
            EmployeeId = dto.EmployeeId,
            AttendanceDate = today,
            CheckInTime = nowTime,
            IsPresent = true,
            IsLateArrival = isLate,
            Remarks = dto.Remarks
        };
        _db.Attendances.Add(att);
        await _db.SaveChangesAsync();

        var employee = await _db.Employees.FindAsync(dto.EmployeeId);
        return ApiResponse<AttendanceDto>.Ok(new AttendanceDto(
            att.Id, att.EmployeeId, $"{employee?.FirstName} {employee?.LastName}",
            att.AttendanceDate, att.CheckInTime, att.CheckOutTime,
            att.WorkingHours, att.IsPresent, att.IsLateArrival, att.Remarks
        ), "Checked in successfully");
    }

    public async Task<ApiResponse<AttendanceDto>> CheckOutAsync(CheckOutDto dto)
    {
        var employeeExists = await _db.Employees.AnyAsync(e => e.Id == dto.EmployeeId);
        if (!employeeExists)
            return ApiResponse<AttendanceDto>.Fail("Employee not found. Please create an employee profile first.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var existing = await _db.Attendances.Include(a => a.Employee)
            .FirstOrDefaultAsync(a => a.EmployeeId == dto.EmployeeId && a.AttendanceDate == today);

        if (existing == null || !existing.CheckInTime.HasValue)
            return ApiResponse<AttendanceDto>.Fail("No check-in record found for today");

        var nowTime = TimeOnly.FromDateTime(DateTime.UtcNow);
        existing.CheckOutTime = nowTime;

        var duration = nowTime - existing.CheckInTime.Value;
        existing.WorkingHours = Math.Round(duration.TotalHours, 2);
        if (dto.Remarks != null) existing.Remarks = dto.Remarks;

        await _db.SaveChangesAsync();

        return ApiResponse<AttendanceDto>.Ok(new AttendanceDto(
            existing.Id, existing.EmployeeId, $"{existing.Employee.FirstName} {existing.Employee.LastName}",
            existing.AttendanceDate, existing.CheckInTime, existing.CheckOutTime,
            existing.WorkingHours, existing.IsPresent, existing.IsLateArrival, existing.Remarks
        ), "Checked out successfully");
    }

    public async Task<ApiResponse<AttendanceDto>> CheckInForCurrentUserAsync(string userId, string? remarks)
    {
        var employee = await _db.Employees.FirstOrDefaultAsync(e => e.ApplicationUserId == userId);
        if (employee == null)
            return ApiResponse<AttendanceDto>.Fail("No employee profile is linked to your account. Ask an admin to create your employee profile.");

        return await CheckInAsync(new CheckInDto(employee.Id, remarks));
    }

    public async Task<ApiResponse<AttendanceDto>> CheckOutForCurrentUserAsync(string userId, string? remarks)
    {
        var employee = await _db.Employees.FirstOrDefaultAsync(e => e.ApplicationUserId == userId);
        if (employee == null)
            return ApiResponse<AttendanceDto>.Fail("No employee profile is linked to your account. Ask an admin to create your employee profile.");

        return await CheckOutAsync(new CheckOutDto(employee.Id, remarks));
    }

    public async Task<ApiResponse<string>> ManualMarkAsync(Guid employeeId, DateOnly date, bool isPresent, string? remarks)
    {
        var existing = await _db.Attendances.FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.AttendanceDate == date);
        if (existing != null)
        {
            existing.IsPresent = isPresent;
            existing.Remarks = remarks;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.Attendances.Add(new Attendance
            {
                EmployeeId = employeeId,
                AttendanceDate = date,
                IsPresent = isPresent,
                Remarks = remarks
            });
        }
        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok("Attendance marked successfully");
    }
}

public class LeaveService : ILeaveService
{
    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;

    public LeaveService(AppDbContext db, IEmailService emailService)
    {
        _db = db;
        _emailService = emailService;
    }

    public async Task<PagedResult<LeaveRequestDto>> GetAllAsync(PaginationParams pagination)
    {
        var query = _db.LeaveRequests.Include(l => l.Employee).AsNoTracking();
        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(l => new LeaveRequestDto(
                l.Id, l.EmployeeId, $"{l.Employee.FirstName} {l.Employee.LastName}",
                l.LeaveType, l.StartDate, l.EndDate, l.TotalDays, l.Reason, l.Status, l.CreatedAt
            ))
            .ToListAsync();

        return new PagedResult<LeaveRequestDto>
        {
            Items = items,
            TotalCount = total,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<PagedResult<LeaveRequestDto>> GetByEmployeeAsync(Guid employeeId, PaginationParams pagination)
    {
        var query = _db.LeaveRequests.Where(l => l.EmployeeId == employeeId).Include(l => l.Employee).AsNoTracking();
        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(l => new LeaveRequestDto(
                l.Id, l.EmployeeId, $"{l.Employee.FirstName} {l.Employee.LastName}",
                l.LeaveType, l.StartDate, l.EndDate, l.TotalDays, l.Reason, l.Status, l.CreatedAt
            ))
            .ToListAsync();

        return new PagedResult<LeaveRequestDto>
        {
            Items = items,
            TotalCount = total,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<PagedResult<LeaveRequestDto>> GetMyLeavesAsync(string userId, PaginationParams pagination)
    {
        var empId = await _db.Employees.AsNoTracking()
            .Where(e => e.ApplicationUserId == userId && !e.IsDeleted)
            .Select(e => (Guid?)e.Id)
            .FirstOrDefaultAsync();

        var query = _db.LeaveRequests
            .Where(l => l.EmployeeId == empId)
            .Include(l => l.Employee)
            .AsNoTracking();

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(l => new LeaveRequestDto(
                l.Id, l.EmployeeId, $"{l.Employee.FirstName} {l.Employee.LastName}",
                l.LeaveType, l.StartDate, l.EndDate, l.TotalDays, l.Reason, l.Status, l.CreatedAt
            ))
            .ToListAsync();

        return new PagedResult<LeaveRequestDto>
        {
            Items = items,
            TotalCount = total,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<ApiResponse<LeaveRequestDto>> CreateAsync(CreateLeaveRequestDto dto)
    {
        var days = 0;
        for (var d = dto.StartDate; d <= dto.EndDate; d = d.AddDays(1))
        {
            if (d.DayOfWeek != DayOfWeek.Saturday && d.DayOfWeek != DayOfWeek.Sunday)
                days++;
        }
        if (days <= 0)
            return ApiResponse<LeaveRequestDto>.Fail("Invalid date range (no working days in the selected range).");

        var hasOverlap = await _db.LeaveRequests.AnyAsync(l => l.EmployeeId == dto.EmployeeId
            && l.Status != LeaveStatus.Rejected && l.Status != LeaveStatus.Cancelled
            && l.StartDate <= dto.EndDate && l.EndDate >= dto.StartDate);
        if (hasOverlap)
            return ApiResponse<LeaveRequestDto>.Fail("You already have a pending or approved leave overlapping these dates.");

        var leave = new LeaveRequest
        {
            EmployeeId = dto.EmployeeId,
            LeaveType = dto.LeaveType,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            TotalDays = days,
            Reason = dto.Reason,
            Status = LeaveStatus.Pending
        };

        _db.LeaveRequests.Add(leave);
        await _db.SaveChangesAsync();

        var emp = await _db.Employees.FindAsync(dto.EmployeeId);
        return ApiResponse<LeaveRequestDto>.Ok(new LeaveRequestDto(
            leave.Id, leave.EmployeeId, $"{emp?.FirstName} {emp?.LastName}",
            leave.LeaveType, leave.StartDate, leave.EndDate, leave.TotalDays, leave.Reason, leave.Status, leave.CreatedAt
        ), "Leave request submitted");
    }

    public async Task<ApiResponse<LeaveRequestDto>> ApproveAsync(Guid id, ApproveLeaveDto dto, string approverId)
    {
        var leave = await _db.LeaveRequests.Include(l => l.Employee).FirstOrDefaultAsync(l => l.Id == id);
        if (leave == null) return ApiResponse<LeaveRequestDto>.Fail("Leave request not found");

        if (!dto.IsApproved && string.IsNullOrWhiteSpace(dto.RejectionReason))
            return ApiResponse<LeaveRequestDto>.Fail("Rejection reason is required.");

        if (leave.Status != LeaveStatus.Pending)
            return ApiResponse<LeaveRequestDto>.Fail($"Only pending requests can be processed. This request is already {leave.Status}.");

        leave.Status = dto.IsApproved ? LeaveStatus.Approved : LeaveStatus.Rejected;
        leave.ApprovedById = approverId;
        leave.ApprovedAt = DateTime.UtcNow;
        leave.RejectionReason = dto.RejectionReason;
        leave.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        if (!string.IsNullOrEmpty(leave.Employee?.Email))
        {
            await _emailService.SendLeaveApprovalEmailAsync(
                leave.Employee.Email,
                $"{leave.Employee.FirstName} {leave.Employee.LastName}",
                dto.IsApproved
            );
        }

        return ApiResponse<LeaveRequestDto>.Ok(new LeaveRequestDto(
            leave.Id, leave.EmployeeId, $"{leave.Employee.FirstName} {leave.Employee.LastName}",
            leave.LeaveType, leave.StartDate, leave.EndDate, leave.TotalDays, leave.Reason, leave.Status, leave.CreatedAt
        ), $"Leave request {(dto.IsApproved ? "approved" : "rejected")}");
    }

    public async Task<ApiResponse<string>> CancelAsync(Guid id, string requesterId)
    {
        var leave = await _db.LeaveRequests.FindAsync(id);
        if (leave == null) return ApiResponse<string>.Fail("Leave request not found");

        leave.Status = LeaveStatus.Cancelled;
        leave.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return ApiResponse<string>.Ok("Leave request cancelled");
    }
}

public class PayrollService : IPayrollService
{
    private readonly AppDbContext _db;

    public PayrollService(AppDbContext db) => _db = db;

    public async Task<PagedResult<PayrollDto>> GetAllAsync(int month, int year, PaginationParams pagination)
    {
        var query = _db.PayrollRecords
            .Include(p => p.Employee)
            .Where(p => p.Month == month && p.Year == year)
            .AsNoTracking();

        var total = await query.CountAsync();
        var items = await query
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(p => new PayrollDto(
                p.Id, p.EmployeeId, $"{p.Employee.FirstName} {p.Employee.LastName}",
                p.Month, p.Year, p.BasicSalary, p.GrossSalary, p.NetSalary, p.Status, p.PaidAt
            ))
            .ToListAsync();

        return new PagedResult<PayrollDto>
        {
            Items = items,
            TotalCount = total,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<PagedResult<PayrollDto>> GetMyPayrollsAsync(string userId, PaginationParams pagination)
    {
        var empId = await _db.Employees.AsNoTracking()
            .Where(e => e.ApplicationUserId == userId && !e.IsDeleted)
            .Select(e => (Guid?)e.Id)
            .FirstOrDefaultAsync();

        var query = _db.PayrollRecords
            .Include(p => p.Employee)
            .Where(p => p.EmployeeId == empId)
            .AsNoTracking();

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.Year).ThenByDescending(p => p.Month)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(p => new PayrollDto(
                p.Id, p.EmployeeId, $"{p.Employee.FirstName} {p.Employee.LastName}",
                p.Month, p.Year, p.BasicSalary, p.GrossSalary, p.NetSalary, p.Status, p.PaidAt
            ))
            .ToListAsync();

        return new PagedResult<PayrollDto>
        {
            Items = items,
            TotalCount = total,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<PagedResult<PayrollDto>> GetByEmployeeAsync(Guid employeeId, PaginationParams pagination)
    {        var query = _db.PayrollRecords
            .Include(p => p.Employee)
            .Where(p => p.EmployeeId == employeeId)
            .AsNoTracking();

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.Year).ThenByDescending(p => p.Month)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(p => new PayrollDto(
                p.Id, p.EmployeeId, $"{p.Employee.FirstName} {p.Employee.LastName}",
                p.Month, p.Year, p.BasicSalary, p.GrossSalary, p.NetSalary, p.Status, p.PaidAt
            ))
            .ToListAsync();

        return new PagedResult<PayrollDto>
        {
            Items = items,
            TotalCount = total,
            Page = pagination.Page,
            PageSize = pagination.PageSize
        };
    }

    public async Task<ApiResponse<List<PayrollDto>>> GeneratePayrollAsync(GeneratePayrollDto dto)
    {
        var employeesQuery = _db.Employees.Where(e => e.Status == EmployeeStatus.Active);
        if (dto.EmployeeIds != null && dto.EmployeeIds.Count > 0)
        {
            employeesQuery = employeesQuery.Where(e => dto.EmployeeIds.Contains(e.Id));
        }

        var employees = await employeesQuery.ToListAsync();
        var resultList = new List<PayrollDto>();

        foreach (var emp in employees)
        {
            var existing = await _db.PayrollRecords.FirstOrDefaultAsync(p => p.EmployeeId == emp.Id && p.Month == dto.Month && p.Year == dto.Year);
            if (existing != null)
            {
                resultList.Add(new PayrollDto(existing.Id, emp.Id, $"{emp.FirstName} {emp.LastName}", existing.Month, existing.Year, existing.BasicSalary, existing.GrossSalary, existing.NetSalary, existing.Status, existing.PaidAt));
                continue;
            }

            var house = emp.BasicSalary * 0.20m;
            var transport = emp.BasicSalary * 0.10m;
            var medical = emp.BasicSalary * 0.10m;
            var gross = emp.BasicSalary + house + transport + medical;
            var tax = gross * 0.05m;
            var pf = gross * 0.05m;
            var net = gross - (tax + pf);

            var payroll = new PayrollRecord
            {
                EmployeeId = emp.Id,
                Month = dto.Month,
                Year = dto.Year,
                BasicSalary = emp.BasicSalary,
                HouseAllowance = house,
                TransportAllowance = transport,
                MedicalAllowance = medical,
                GrossSalary = gross,
                TaxDeduction = tax,
                ProvidentFund = pf,
                NetSalary = net,
                WorkingDays = 22,
                PresentDays = 22,
                Status = PayrollStatus.Processed
            };

            _db.PayrollRecords.Add(payroll);
            await _db.SaveChangesAsync();

            resultList.Add(new PayrollDto(payroll.Id, emp.Id, $"{emp.FirstName} {emp.LastName}", payroll.Month, payroll.Year, payroll.BasicSalary, payroll.GrossSalary, payroll.NetSalary, payroll.Status, payroll.PaidAt));
        }

        return ApiResponse<List<PayrollDto>>.Ok(resultList, "Payroll generated successfully");
    }

    public async Task<ApiResponse<string>> MarkAsPaidAsync(Guid id)
    {
        var p = await _db.PayrollRecords.FindAsync(id);
        if (p == null) return ApiResponse<string>.Fail("Payroll record not found");

        p.Status = PayrollStatus.Paid;
        p.PaidAt = DateTime.UtcNow;
        p.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return ApiResponse<string>.Ok("Payroll marked as paid");
    }

    public async Task<byte[]> GeneratePayslipPdfAsync(Guid payrollId)
    {
        var record = await _db.PayrollRecords.Include(p => p.Employee).FirstOrDefaultAsync(p => p.Id == payrollId);
        var text = $"PAYSLIP - {record?.Employee?.FirstName} {record?.Employee?.LastName}\nMonth: {record?.Month}/{record?.Year}\nNet Salary: ${record?.NetSalary:F2}";
        return Encoding.UTF8.GetBytes(text);
    }
}
