using System.Text;
using ERP.Application.Common;
using ERP.Application.DTOs.Business;
using ERP.Application.Interfaces;
using ERP.Domain.Entities;
using ERP.Domain.Enums;
using ERP.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ERP.Infrastructure.Services;

public class CustomerService : ICustomerService
{
    private readonly AppDbContext _db;
    public CustomerService(AppDbContext db) => _db = db;

    public async Task<PagedResult<CustomerDto>> GetAllAsync(PaginationParams pagination)
    {
        var query = _db.Customers.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(pagination.SearchTerm))
        {
            var s = $"%{pagination.SearchTerm}%";
            query = query.Where(c => EF.Functions.Like(c.Name, s) || (c.Email != null && EF.Functions.Like(c.Email, s)) || (c.Company != null && EF.Functions.Like(c.Company, s)));
        }

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(c => c.CreatedAt)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(c => new CustomerDto(c.Id, c.Name, c.Email, c.Phone, c.Company, c.City, c.Country, c.TotalPurchaseValue, c.IsActive, c.Address, c.Website, c.Notes))
            .ToListAsync();

        return new PagedResult<CustomerDto> { Items = items, TotalCount = total, Page = pagination.Page, PageSize = pagination.PageSize };
    }

    public async Task<ApiResponse<CustomerDto>> GetByIdAsync(Guid id)
    {
        var c = await _db.Customers.FindAsync(id);
        if (c == null) return ApiResponse<CustomerDto>.Fail("Customer not found");
        return ApiResponse<CustomerDto>.Ok(new CustomerDto(c.Id, c.Name, c.Email, c.Phone, c.Company, c.City, c.Country, c.TotalPurchaseValue, c.IsActive));
    }

    public async Task<ApiResponse<CustomerDto>> CreateAsync(CreateCustomerDto dto)
    {
        var customer = new Customer
        {
            Name = dto.Name,
            Email = dto.Email,
            Phone = dto.Phone,
            Company = dto.Company,
            Address = dto.Address,
            City = dto.City,
            Country = dto.Country,
            Website = dto.Website,
            Notes = dto.Notes,
            IsActive = true
        };
        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();

        return ApiResponse<CustomerDto>.Ok(new CustomerDto(customer.Id, customer.Name, customer.Email, customer.Phone, customer.Company, customer.City, customer.Country, customer.TotalPurchaseValue, customer.IsActive), "Customer created");
    }

    public async Task<ApiResponse<CustomerDto>> UpdateAsync(Guid id, UpdateCustomerDto dto)
    {
        var c = await _db.Customers.FindAsync(id);
        if (c == null) return ApiResponse<CustomerDto>.Fail("Customer not found");

        c.Name = dto.Name;
        c.Email = dto.Email;
        c.Phone = dto.Phone;
        c.Company = dto.Company;
        c.Address = dto.Address;
        c.City = dto.City;
        c.Country = dto.Country;
        c.Website = dto.Website;
        c.Notes = dto.Notes;
        c.IsActive = dto.IsActive;
        c.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ApiResponse<CustomerDto>.Ok(new CustomerDto(c.Id, c.Name, c.Email, c.Phone, c.Company, c.City, c.Country, c.TotalPurchaseValue, c.IsActive), "Customer updated");
    }

    public async Task<ApiResponse<string>> DeleteAsync(Guid id)
    {
        var c = await _db.Customers.FindAsync(id);
        if (c == null) return ApiResponse<string>.Fail("Customer not found");
        c.IsDeleted = true;
        c.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok("Customer deleted");
    }
}

public class LeadService : ILeadService
{
    private readonly AppDbContext _db;
    public LeadService(AppDbContext db) => _db = db;

    public async Task<PagedResult<LeadDto>> GetAllAsync(PaginationParams pagination)
    {
        var query = _db.Leads.AsNoTracking();
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(l => l.CreatedAt)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(l => new LeadDto(l.Id, l.Title, l.ContactName, l.Company, l.Status, l.EstimatedValue, l.ExpectedCloseDate, l.AssignedToId, l.Source, l.ContactEmail, l.ContactPhone))
            .ToListAsync();

        return new PagedResult<LeadDto> { Items = items, TotalCount = total, Page = pagination.Page, PageSize = pagination.PageSize };
    }

    public async Task<ApiResponse<LeadDto>> GetByIdAsync(Guid id)
    {
        var l = await _db.Leads.FindAsync(id);
        if (l == null) return ApiResponse<LeadDto>.Fail("Lead not found");
        return ApiResponse<LeadDto>.Ok(new LeadDto(l.Id, l.Title, l.ContactName, l.Company, l.Status, l.EstimatedValue, l.ExpectedCloseDate, l.AssignedToId));
    }

    public async Task<ApiResponse<LeadDto>> CreateAsync(CreateLeadDto dto)
    {
        var lead = new Lead
        {
            Title = dto.Title,
            ContactName = dto.ContactName,
            ContactEmail = dto.ContactEmail,
            ContactPhone = dto.ContactPhone,
            Company = dto.Company,
            Source = dto.Source,
            EstimatedValue = dto.EstimatedValue,
            ExpectedCloseDate = dto.ExpectedCloseDate,
            CustomerId = dto.CustomerId,
            Notes = dto.Notes,
            Status = LeadStatus.New
        };
        _db.Leads.Add(lead);
        await _db.SaveChangesAsync();

        return ApiResponse<LeadDto>.Ok(new LeadDto(lead.Id, lead.Title, lead.ContactName, lead.Company, lead.Status, lead.EstimatedValue, lead.ExpectedCloseDate, lead.AssignedToId), "Lead created");
    }

    public async Task<ApiResponse<LeadDto>> UpdateAsync(Guid id, UpdateLeadDto dto)
    {
        var l = await _db.Leads.FindAsync(id);
        if (l == null) return ApiResponse<LeadDto>.Fail("Lead not found");

        var wasWon = l.Status == LeadStatus.Won;
        l.Title = dto.Title;
        l.ContactName = dto.ContactName;
        l.ContactEmail = dto.ContactEmail;
        l.ContactPhone = dto.ContactPhone;
        l.Company = dto.Company;
        l.Status = dto.Status;
        l.EstimatedValue = dto.EstimatedValue;
        l.ExpectedCloseDate = dto.ExpectedCloseDate;
        l.Notes = dto.Notes;
        l.UpdatedAt = DateTime.UtcNow;

        string message = "Lead updated";
        if (dto.Status == LeadStatus.Won && !wasWon)
        {
            var customer = await ConvertLeadToCustomerAsync(l);
            message = $"Lead won! Converted to customer '{customer.Name}'";
        }

        await _db.SaveChangesAsync();
        return ApiResponse<LeadDto>.Ok(new LeadDto(l.Id, l.Title, l.ContactName, l.Company, l.Status, l.EstimatedValue, l.ExpectedCloseDate, l.AssignedToId,
            l.Source, l.ContactEmail, l.ContactPhone), message);
    }

    private async Task<Customer> ConvertLeadToCustomerAsync(Lead lead)
    {
        Customer? customer = null;

        if (!string.IsNullOrWhiteSpace(lead.Company))
            customer = await _db.Customers.FirstOrDefaultAsync(c => c.Company == lead.Company || c.Name == lead.Company);

        if (customer == null && !string.IsNullOrWhiteSpace(lead.ContactEmail))
            customer = await _db.Customers.FirstOrDefaultAsync(c => c.Email == lead.ContactEmail);

        if (customer == null)
        {
            customer = new Customer
            {
                Name = !string.IsNullOrWhiteSpace(lead.Company) ? lead.Company : (lead.ContactName ?? "New Client"),
                Email = lead.ContactEmail,
                Phone = lead.ContactPhone,
                Company = lead.Company,
                TotalPurchaseValue = 0,
                Notes = $"Converted from lead '{lead.Title}'"
            };
            _db.Customers.Add(customer);
        }

        customer.TotalPurchaseValue += lead.EstimatedValue;
        lead.CustomerId = customer.Id;
        return customer;
    }

    public async Task<ApiResponse<string>> DeleteAsync(Guid id)
    {
        var l = await _db.Leads.FindAsync(id);
        if (l == null) return ApiResponse<string>.Fail("Lead not found");
        l.IsDeleted = true;
        l.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok("Lead deleted");
    }
}

public class ProjectService : IProjectService
{
    private readonly AppDbContext _db;
    public ProjectService(AppDbContext db) => _db = db;

    public async Task<PagedResult<ProjectDto>> GetAllAsync(PaginationParams pagination)
    {
        var query = _db.Projects.AsNoTracking();
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(p => p.CreatedAt)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(p => new ProjectDto(p.Id, p.Name, p.Description, p.StartDate, p.EndDate, p.Status, p.Budget, p.ActualCost, p.Progress, p.ManagerId))
            .ToListAsync();

        return new PagedResult<ProjectDto> { Items = items, TotalCount = total, Page = pagination.Page, PageSize = pagination.PageSize };
    }

    public async Task<ApiResponse<ProjectDto>> GetByIdAsync(Guid id)
    {
        var p = await _db.Projects.FindAsync(id);
        if (p == null) return ApiResponse<ProjectDto>.Fail("Project not found");
        return ApiResponse<ProjectDto>.Ok(new ProjectDto(p.Id, p.Name, p.Description, p.StartDate, p.EndDate, p.Status, p.Budget, p.ActualCost, p.Progress, p.ManagerId));
    }

    public async Task<ApiResponse<ProjectDto>> CreateAsync(CreateProjectDto dto)
    {
        var project = new Project
        {
            Name = dto.Name,
            Description = dto.Description,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Budget = dto.Budget,
            ManagerId = dto.ManagerId,
            CustomerId = dto.CustomerId,
            Status = ProjectStatus.Planning,
            Progress = 0
        };
        _db.Projects.Add(project);
        await _db.SaveChangesAsync();

        return ApiResponse<ProjectDto>.Ok(new ProjectDto(project.Id, project.Name, project.Description, project.StartDate, project.EndDate, project.Status, project.Budget, project.ActualCost, project.Progress, project.ManagerId), "Project created");
    }

    public async Task<ApiResponse<ProjectDto>> UpdateAsync(Guid id, UpdateProjectDto dto)
    {
        var p = await _db.Projects.FindAsync(id);
        if (p == null) return ApiResponse<ProjectDto>.Fail("Project not found");

        p.Name = dto.Name;
        p.Description = dto.Description;
        p.StartDate = dto.StartDate;
        p.EndDate = dto.EndDate;
        p.Status = dto.Status;
        p.Budget = dto.Budget;
        p.Progress = dto.Progress;
        p.ManagerId = dto.ManagerId;
        p.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ApiResponse<ProjectDto>.Ok(new ProjectDto(p.Id, p.Name, p.Description, p.StartDate, p.EndDate, p.Status, p.Budget, p.ActualCost, p.Progress, p.ManagerId), "Project updated");
    }

    public async Task<ApiResponse<string>> DeleteAsync(Guid id)
    {
        var p = await _db.Projects.FindAsync(id);
        if (p == null) return ApiResponse<string>.Fail("Project not found");
        p.IsDeleted = true;
        p.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok("Project deleted");
    }
}

public class TaskService : ITaskService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notifications;
    public TaskService(AppDbContext db, INotificationService notificationService)
    {
        _db = db;
        _notifications = notificationService;
    }

    public async Task<PagedResult<TaskDto>> GetByProjectAsync(Guid projectId, PaginationParams pagination)
    {
        var query = _db.ProjectTasks
            .Include(t => t.Project)
            .Include(t => t.Assignments).ThenInclude(a => a.Employee)
            .Where(t => t.ProjectId == projectId)
            .AsNoTracking();

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(t => t.CreatedAt)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(t => new TaskDto(
                t.Id, t.Title, t.Description, t.ProjectId, t.Project.Name,
                t.Status, t.Priority, t.DueDate, t.EstimatedHours, t.ActualHours,
                t.Assignments.Select(a => $"{a.Employee.FirstName} {a.Employee.LastName}").ToList()
            ))
            .ToListAsync();

        return new PagedResult<TaskDto> { Items = items, TotalCount = total, Page = pagination.Page, PageSize = pagination.PageSize };
    }

    public async Task<PagedResult<TaskDto>> GetMyTasksAsync(string userId, PaginationParams pagination)
    {
        var query = _db.ProjectTasks
            .Include(t => t.Project)
            .Include(t => t.Assignments).ThenInclude(a => a.Employee)
            .AsNoTracking();

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(t => t.CreatedAt)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(t => new TaskDto(
                t.Id, t.Title, t.Description, t.ProjectId, t.Project.Name,
                t.Status, t.Priority, t.DueDate, t.EstimatedHours, t.ActualHours,
                t.Assignments.Select(a => $"{a.Employee.FirstName} {a.Employee.LastName}").ToList()
            ))
            .ToListAsync();

        return new PagedResult<TaskDto> { Items = items, TotalCount = total, Page = pagination.Page, PageSize = pagination.PageSize };
    }

    public async Task<List<TaskDto>> GetOverdueTasksAsync()
    {
        var today = DateTime.UtcNow.Date;

        return await _db.ProjectTasks
            .AsNoTracking()
            .Where(t => t.DueDate != null
                && t.DueDate < today
                && t.Status != ERP.Domain.Enums.TaskStatus.Done
                && t.Status != ERP.Domain.Enums.TaskStatus.Cancelled)
            .OrderBy(t => t.DueDate)
            .Select(t => new TaskDto(
                t.Id, t.Title, t.Description, t.ProjectId, t.Project.Name,
                t.Status, t.Priority, t.DueDate, t.EstimatedHours, t.ActualHours,
                t.Assignments.Select(a => $"{a.Employee.FirstName} {a.Employee.LastName}").ToList()
            ))
            .ToListAsync();
    }

    public async Task<ApiResponse<TaskDto>> CreateAsync(CreateTaskDto dto)
    {
        var task = new ProjectTask
        {
            Title = dto.Title,
            Description = dto.Description,
            ProjectId = dto.ProjectId,
            Priority = dto.Priority,
            DueDate = dto.DueDate,
            EstimatedHours = dto.EstimatedHours,
            ParentTaskId = dto.ParentTaskId,
            Status = ERP.Domain.Enums.TaskStatus.Todo
        };
        _db.ProjectTasks.Add(task);
        await _db.SaveChangesAsync();

        if (dto.AssigneeIds != null)
        {
            foreach (var empId in dto.AssigneeIds)
            {
                _db.TaskAssignments.Add(new TaskAssignment { TaskId = task.Id, EmployeeId = empId });
            }
            await _db.SaveChangesAsync();

            // Notify each assignee's linked user account
            var projName = await _db.Projects.Where(p => p.Id == dto.ProjectId).Select(p => p.Name).FirstOrDefaultAsync() ?? "Project";
            foreach (var empId in dto.AssigneeIds.Distinct())
            {
                var assignee = await _db.Employees
                    .Where(e => e.Id == empId)
                    .Select(e => new { e.FirstName, e.LastName, e.ApplicationUserId })
                    .FirstOrDefaultAsync();
                if (assignee?.ApplicationUserId != null)
                    await _notifications.CreateAsync(assignee.ApplicationUserId,
                        "New Task Assigned",
                        $"You have been assigned '{task.Title}' ({projName})" + (task.DueDate.HasValue ? $" — due {task.DueDate:dd MMM}" : ""),
                        NotificationType.Info,
                        "/my-tasks");
            }
        }

        var proj = await _db.Projects.FindAsync(dto.ProjectId);
        return ApiResponse<TaskDto>.Ok(new TaskDto(
            task.Id, task.Title, task.Description, task.ProjectId, proj?.Name ?? "",
            task.Status, task.Priority, task.DueDate, task.EstimatedHours, task.ActualHours, []
        ), "Task created");
    }

    public async Task<ApiResponse<TaskDto>> UpdateAsync(Guid id, UpdateTaskDto dto)
    {
        var task = await _db.ProjectTasks.Include(t => t.Project).Include(t => t.Assignments).ThenInclude(a => a.Employee).FirstOrDefaultAsync(t => t.Id == id);
        if (task == null) return ApiResponse<TaskDto>.Fail("Task not found");

        task.Title = dto.Title;
        task.Description = dto.Description;
        task.Status = dto.Status;
        task.Priority = dto.Priority;
        task.DueDate = dto.DueDate;
        task.EstimatedHours = dto.EstimatedHours;
        task.ActualHours = dto.ActualHours;
        if (dto.Status == ERP.Domain.Enums.TaskStatus.Done && task.CompletedAt == null)
            task.CompletedAt = DateTime.UtcNow;

        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (dto.AssigneeIds != null)
        {
            var oldAssignments = await _db.TaskAssignments
                .Where(a => a.TaskId == task.Id)
                .ToListAsync();
            _db.TaskAssignments.RemoveRange(oldAssignments);

            foreach (var empId in dto.AssigneeIds.Distinct())
            {
                var exists = await _db.Employees.AnyAsync(e => e.Id == empId && !e.IsDeleted);
                if (exists)
                    _db.TaskAssignments.Add(new TaskAssignment { TaskId = task.Id, EmployeeId = empId });
            }
            await _db.SaveChangesAsync();
        }

        var assigneeNames = await _db.TaskAssignments
            .AsNoTracking()
            .Where(a => a.TaskId == task.Id)
            .Select(a => a.Employee.FirstName + " " + a.Employee.LastName)
            .ToListAsync();

        return ApiResponse<TaskDto>.Ok(new TaskDto(
            task.Id, task.Title, task.Description, task.ProjectId, task.Project.Name,
            task.Status, task.Priority, task.DueDate, task.EstimatedHours, task.ActualHours,
            assigneeNames
        ), "Task updated");
    }

    public async Task<ApiResponse<string>> DeleteAsync(Guid id)
    {
        var task = await _db.ProjectTasks.FindAsync(id);
        if (task == null) return ApiResponse<string>.Fail("Task not found");
        task.IsDeleted = true;
        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok("Task deleted");
    }
}

public class ProductService : IProductService
{
    private readonly AppDbContext _db;
    public ProductService(AppDbContext db) => _db = db;

    public async Task<PagedResult<ProductDto>> GetAllAsync(PaginationParams pagination)
    {
        var query = _db.Products.Include(p => p.Category).Include(p => p.Supplier).AsNoTracking();
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(p => p.CreatedAt)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(p => new ProductDto(p.Id, p.Code, p.Name, p.Description, p.Category.Name, p.Supplier != null ? p.Supplier.Name : null, p.CostPrice, p.SellingPrice, p.CurrentStock, p.MinimumStock, p.IsActive))
            .ToListAsync();

        return new PagedResult<ProductDto> { Items = items, TotalCount = total, Page = pagination.Page, PageSize = pagination.PageSize };
    }

    public async Task<ApiResponse<ProductDto>> GetByIdAsync(Guid id)
    {
        var p = await _db.Products.Include(x => x.Category).Include(x => x.Supplier).FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return ApiResponse<ProductDto>.Fail("Product not found");
        return ApiResponse<ProductDto>.Ok(new ProductDto(p.Id, p.Code, p.Name, p.Description, p.Category.Name, p.Supplier?.Name, p.CostPrice, p.SellingPrice, p.CurrentStock, p.MinimumStock, p.IsActive));
    }

    public async Task<ApiResponse<ProductDto>> CreateAsync(CreateProductDto dto)
    {
        var count = await _db.Products.CountAsync() + 1;
        var code = $"PRD-{count:D4}";

        var product = new Product
        {
            Code = code,
            Name = dto.Name,
            Description = dto.Description,
            CategoryId = dto.CategoryId,
            SupplierId = dto.SupplierId,
            CostPrice = dto.CostPrice,
            SellingPrice = dto.SellingPrice,
            MinimumStock = dto.MinimumStock,
            ReorderLevel = dto.ReorderLevel,
            Unit = dto.Unit,
            CurrentStock = 0,
            IsActive = true
        };
        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        var cat = await _db.ProductCategories.FindAsync(dto.CategoryId);
        return ApiResponse<ProductDto>.Ok(new ProductDto(product.Id, product.Code, product.Name, product.Description, cat?.Name ?? "", null, product.CostPrice, product.SellingPrice, 0, product.MinimumStock, product.IsActive), "Product created");
    }

    public async Task<ApiResponse<ProductDto>> UpdateAsync(Guid id, UpdateProductDto dto)
    {
        var p = await _db.Products.Include(x => x.Category).Include(x => x.Supplier).FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return ApiResponse<ProductDto>.Fail("Product not found");

        p.Name = dto.Name;
        p.Description = dto.Description;
        p.CategoryId = dto.CategoryId;
        p.SupplierId = dto.SupplierId;
        p.CostPrice = dto.CostPrice;
        p.SellingPrice = dto.SellingPrice;
        p.MinimumStock = dto.MinimumStock;
        p.ReorderLevel = dto.ReorderLevel;
        p.Unit = dto.Unit;
        p.IsActive = dto.IsActive;
        p.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ApiResponse<ProductDto>.Ok(new ProductDto(p.Id, p.Code, p.Name, p.Description, p.Category.Name, p.Supplier?.Name, p.CostPrice, p.SellingPrice, p.CurrentStock, p.MinimumStock, p.IsActive), "Product updated");
    }

    public async Task<ApiResponse<string>> DeleteAsync(Guid id)
    {
        var p = await _db.Products.FindAsync(id);
        if (p == null) return ApiResponse<string>.Fail("Product not found");
        p.IsDeleted = true;
        p.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok("Product deleted");
    }

    public async Task<ApiResponse<string>> AdjustStockAsync(StockAdjustmentDto dto)
    {
        var product = await _db.Products.FindAsync(dto.ProductId);
        if (product == null) return ApiResponse<string>.Fail("Product not found");

        var prev = product.CurrentStock;
        var next = dto.Type == StockMovementType.In ? prev + dto.Quantity : Math.Max(0, prev - dto.Quantity);
        product.CurrentStock = next;

        _db.StockMovements.Add(new StockMovement
        {
            ProductId = dto.ProductId,
            Type = dto.Type,
            Quantity = dto.Quantity,
            PreviousStock = prev,
            NewStock = next,
            Notes = dto.Notes
        });

        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok($"Stock updated from {prev} to {next}");
    }

    public async Task<List<ProductDto>> GetLowStockAsync()
    {
        return await _db.Products
            .Where(p => p.CurrentStock <= p.MinimumStock)
            .Include(p => p.Category)
            .Include(p => p.Supplier)
            .Select(p => new ProductDto(p.Id, p.Code, p.Name, p.Description, p.Category.Name, p.Supplier != null ? p.Supplier.Name : null, p.CostPrice, p.SellingPrice, p.CurrentStock, p.MinimumStock, p.IsActive))
            .ToListAsync();
    }

    public async Task<List<StockMovementDto>> GetMovementsAsync(Guid productId)
    {
        return await _db.StockMovements
            .AsNoTracking()
            .Where(m => m.ProductId == productId)
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new StockMovementDto(
                m.Id, m.Type, m.Quantity, m.PreviousStock, m.NewStock,
                m.Reference, m.Notes, m.CreatedAt))
            .ToListAsync();
    }
}

public class SupplierService : ISupplierService
{
    private readonly AppDbContext _db;
    public SupplierService(AppDbContext db) => _db = db;

    public async Task<List<SupplierDto>> GetAllAsync()
    {
        return await _db.Suppliers.AsNoTracking()
            .OrderBy(s => s.Name)
            .Select(s => new SupplierDto(s.Id, s.Name, s.ContactPerson, s.Email, s.Phone, s.Country, s.TotalPurchaseValue, s.IsActive))
            .ToListAsync();
    }

    public async Task<ApiResponse<SupplierDto>> CreateAsync(CreateSupplierDto dto)
    {
        var supplier = new Supplier
        {
            Name = dto.Name,
            ContactPerson = dto.ContactPerson,
            Email = dto.Email,
            Phone = dto.Phone,
            Address = dto.Address,
            Country = dto.Country
        };
        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync();

        return ApiResponse<SupplierDto>.Ok(new SupplierDto(
            supplier.Id, supplier.Name, supplier.ContactPerson, supplier.Email,
            supplier.Phone, supplier.Country, 0, true), "Supplier created");
    }

    public async Task<ApiResponse<SupplierDto>> UpdateAsync(Guid id, CreateSupplierDto dto)
    {
        var s = await _db.Suppliers.FindAsync(id);
        if (s == null) return ApiResponse<SupplierDto>.Fail("Supplier not found");

        s.Name = dto.Name;
        s.ContactPerson = dto.ContactPerson;
        s.Email = dto.Email;
        s.Phone = dto.Phone;
        s.Address = dto.Address;
        s.Country = dto.Country;
        await _db.SaveChangesAsync();

        return ApiResponse<SupplierDto>.Ok(new SupplierDto(
            s.Id, s.Name, s.ContactPerson, s.Email, s.Phone, s.Country, s.TotalPurchaseValue, s.IsActive), "Supplier updated");
    }
}

public class ProductCategoryService : IProductCategoryService
{
    private readonly AppDbContext _db;
    public ProductCategoryService(AppDbContext db) => _db = db;

    public async Task<List<ProductCategoryDto>> GetAllAsync()
    {
        return await _db.ProductCategories.AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new ProductCategoryDto(
                c.Id, c.Name, c.Description,
                _db.Products.Count(p => p.CategoryId == c.Id),
                c.IsActive))
            .ToListAsync();
    }

    public async Task<ApiResponse<ProductCategoryDto>> CreateAsync(CreateProductCategoryDto dto)
    {
        var category = new ProductCategory { Name = dto.Name, Description = dto.Description };
        _db.ProductCategories.Add(category);
        await _db.SaveChangesAsync();

        return ApiResponse<ProductCategoryDto>.Ok(new ProductCategoryDto(
            category.Id, category.Name, category.Description, 0, true), "Category created");
    }
}

public class SalesOrderService : ISalesOrderService
{
    private readonly AppDbContext _db;
    private readonly IEmailService _email;
    private readonly INotificationService _notifications;
    public SalesOrderService(AppDbContext db, IEmailService email, INotificationService notifications)
    {
        _db = db;
        _email = email;
        _notifications = notifications;
    }

    public async Task<PagedResult<SalesOrderDto>> GetAllAsync(PaginationParams pagination)
    {
        var query = _db.SalesOrders.Include(s => s.Customer).AsNoTracking();
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(s => s.CreatedAt)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(s => new SalesOrderDto(s.Id, s.OrderNumber, s.Customer.Name, s.OrderDate, s.DueDate, s.Status, s.PaymentStatus, s.TotalAmount, s.PaidAmount))
            .ToListAsync();

        return new PagedResult<SalesOrderDto> { Items = items, TotalCount = total, Page = pagination.Page, PageSize = pagination.PageSize };
    }

    public async Task<ApiResponse<SalesOrderDto>> GetByIdAsync(Guid id)
    {
        var s = await _db.SalesOrders.Include(x => x.Customer).FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return ApiResponse<SalesOrderDto>.Fail("Order not found");
        return ApiResponse<SalesOrderDto>.Ok(new SalesOrderDto(s.Id, s.OrderNumber, s.Customer.Name, s.OrderDate, s.DueDate, s.Status, s.PaymentStatus, s.TotalAmount, s.PaidAmount));
    }

    public async Task<ApiResponse<SalesOrderDetailDto>> GetDetailAsync(Guid id)
    {
        var s = await _db.SalesOrders.Include(x => x.Customer).Include(x => x.Items).ThenInclude(i => i.Product).FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return ApiResponse<SalesOrderDetailDto>.Fail("Order not found");
        return ApiResponse<SalesOrderDetailDto>.Ok(MapDetail(s));
    }

    private static SalesOrderDetailDto MapDetail(SalesOrder s) => new(
        s.Id, s.OrderNumber, s.CustomerId, s.Customer.Name, s.Customer.Email,
        s.OrderDate, s.DeliveryDate, s.DueDate, s.Status, s.PaymentStatus,
        s.SubTotal, s.TaxAmount, s.DiscountAmount, s.TotalAmount, s.PaidAmount, s.Notes,
        s.Items.Select(i => new SalesOrderLineDto(i.ProductId, i.Product.Name, i.Quantity, i.UnitPrice, i.Discount, i.TotalPrice)).ToList());

    public async Task<ApiResponse<SalesOrderDto>> CreateAsync(CreateSalesOrderDto dto)
    {
        var count = await _db.SalesOrders.CountAsync() + 1;
        var orderNumber = $"SO-{DateTime.UtcNow.Year}-{count:D4}";

        decimal subtotal = 0;
        decimal itemDiscounts = 0;
        var orderItems = new List<SalesOrderItem>();

        foreach (var item in dto.Items)
        {
            var lineTotal = (item.Quantity * item.UnitPrice) - item.Discount;
            subtotal += lineTotal;
            itemDiscounts += item.Discount;
            orderItems.Add(new SalesOrderItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Discount = item.Discount,
                TotalPrice = lineTotal
            });
        }

        var tax = Math.Round(subtotal * 0.10m, 2);
        var total = subtotal + tax;

        var order = new SalesOrder
        {
            OrderNumber = orderNumber,
            CustomerId = dto.CustomerId,
            OrderDate = dto.OrderDate,
            DeliveryDate = dto.DeliveryDate,
            DueDate = dto.DueDate ?? dto.OrderDate.AddDays(30),
            SubTotal = subtotal,
            TaxAmount = tax,
            DiscountAmount = itemDiscounts,
            TotalAmount = total,
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            Notes = dto.Notes,
            Items = orderItems
        };

        _db.SalesOrders.Add(order);
        await _db.SaveChangesAsync();

        var cust = await _db.Customers.FindAsync(dto.CustomerId);
        return ApiResponse<SalesOrderDto>.Ok(new SalesOrderDto(order.Id, order.OrderNumber, cust?.Name ?? "", order.OrderDate, order.DueDate, order.Status, order.PaymentStatus, order.TotalAmount, 0), "Sales order created");
    }

    public async Task<ApiResponse<string>> UpdateStatusAsync(Guid id, string status)
    {
        var order = await _db.SalesOrders.FindAsync(id);
        if (order == null) return ApiResponse<string>.Fail("Order not found");

        if (Enum.TryParse<OrderStatus>(status, true, out var orderStatus))
        {
            order.Status = orderStatus;
            order.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return ApiResponse<string>.Ok($"Order status changed to {status}");
        }

        return ApiResponse<string>.Fail("Invalid status value");
    }

    public async Task<ApiResponse<string>> ConfirmAsync(Guid id, string userId)
    {
        var order = await _db.SalesOrders.Include(o => o.Items).ThenInclude(i => i.Product).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return ApiResponse<string>.Fail("Order not found");
        if (order.Status != OrderStatus.Draft && order.Status != OrderStatus.Pending)
            return ApiResponse<string>.Fail($"Only Draft/Pending orders can be confirmed (current: {order.Status})");

        // Validate stock before confirming
        foreach (var item in order.Items)
        {
            if (item.Product.CurrentStock < item.Quantity)
                return ApiResponse<string>.Fail($"Insufficient stock for '{item.Product.Name}' (available: {item.Product.CurrentStock}, required: {item.Quantity})");
        }

        // Deduct stock
        foreach (var item in order.Items)
        {
            var previous = item.Product.CurrentStock;
            item.Product.CurrentStock -= item.Quantity;
            _db.StockMovements.Add(new StockMovement
            {
                ProductId = item.ProductId,
                Type = StockMovementType.Out,
                Quantity = item.Quantity,
                PreviousStock = previous,
                NewStock = item.Product.CurrentStock,
                Reference = order.OrderNumber,
                Notes = "Sales order confirmation",
                CreatedByUserId = userId
            });
        }

        order.Status = OrderStatus.Confirmed;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        // Admin low-stock alerts
        var lowStockProducts = order.Items.Where(i => i.Product.CurrentStock <= i.Product.MinimumStock).ToList();
        foreach (var low in lowStockProducts)
        {
            await _notifications.CreateForRolesAsync(new[] { "Admin" },
                "Low Stock Alert",
                $"'{low.Product.Name}' is running low: {low.Product.CurrentStock} left (minimum: {low.Product.MinimumStock}) after {order.OrderNumber}",
                NotificationType.Warning,
                "/inventory");
        }

        return ApiResponse<string>.Ok($"Order {order.OrderNumber} confirmed — stock deducted, invoice ready");
    }

    public async Task<ApiResponse<string>> CancelAsync(Guid id, string userId)
    {
        var order = await _db.SalesOrders.Include(o => o.Items).ThenInclude(i => i.Product).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return ApiResponse<string>.Fail("Order not found");
        if (order.Status == OrderStatus.Shipped || order.Status == OrderStatus.Delivered)
            return ApiResponse<string>.Fail("Shipped/Delivered orders cannot be cancelled — use return instead");
        if (order.Status == OrderStatus.Cancelled)
            return ApiResponse<string>.Fail("Order is already cancelled");

        var wasConfirmed = order.Status == OrderStatus.Confirmed;

        // Restore stock if it was deducted at confirmation
        if (wasConfirmed)
        {
            foreach (var item in order.Items)
            {
                var previous = item.Product.CurrentStock;
                item.Product.CurrentStock += item.Quantity;
                _db.StockMovements.Add(new StockMovement
                {
                    ProductId = item.ProductId,
                    Type = StockMovementType.In,
                    Quantity = item.Quantity,
                    PreviousStock = previous,
                    NewStock = item.Product.CurrentStock,
                    Reference = order.OrderNumber,
                    Notes = "Sales order cancellation",
                    CreatedByUserId = userId
                });
            }
        }

        order.Status = OrderStatus.Cancelled;
        order.PaymentStatus = order.PaidAmount > 0 ? PaymentStatus.Refunded : PaymentStatus.Pending;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok($"Order {order.OrderNumber} cancelled" + (wasConfirmed ? " and stock restored" : ""));
    }

    public async Task<ApiResponse<string>> DeleteAsync(Guid id)
    {
        var order = await _db.SalesOrders.FindAsync(id);
        if (order == null) return ApiResponse<string>.Fail("Order not found");
        if (order.Status != OrderStatus.Draft && order.Status != OrderStatus.Pending && order.Status != OrderStatus.Cancelled)
            return ApiResponse<string>.Fail("Only Draft/Pending/Cancelled orders can be deleted");
        if (order.PaidAmount > 0) return ApiResponse<string>.Fail("Cannot delete an order with recorded payments");

        order.IsDeleted = true;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok("Order deleted");
    }

    public async Task<ApiResponse<string>> ReturnAsync(Guid id, string userId)
    {
        var order = await _db.SalesOrders.Include(o => o.Items).ThenInclude(i => i.Product).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return ApiResponse<string>.Fail("Order not found");
        if (order.Status == OrderStatus.Returned || order.Status == OrderStatus.Cancelled)
            return ApiResponse<string>.Fail($"Cannot return a {order.Status} order");

        // Restore stock for all items
        foreach (var item in order.Items)
        {
            var previous = item.Product.CurrentStock;
            item.Product.CurrentStock += item.Quantity;
            _db.StockMovements.Add(new StockMovement
            {
                ProductId = item.ProductId,
                Type = StockMovementType.Return,
                Quantity = item.Quantity,
                PreviousStock = previous,
                NewStock = item.Product.CurrentStock,
                Reference = order.OrderNumber,
                Notes = "Sales return",
                CreatedByUserId = userId
            });
        }

        // Refund recorded payments as finance expense
        if (order.PaidAmount > 0 && order.PaymentStatus != PaymentStatus.Refunded)
        {
            var category = await FinanceCategoryHelper.GetOrCreateAsync(_db, "Sales Refund", TransactionType.Expense);
            _db.FinanceTransactions.Add(new FinanceTransaction
            {
                CategoryId = category.Id,
                Type = TransactionType.Expense,
                Amount = order.PaidAmount,
                TransactionDate = DateTime.UtcNow,
                Description = $"Refund for sales order {order.OrderNumber}",
                Reference = order.OrderNumber,
                CreatedByUserId = userId
            });
            order.PaymentStatus = PaymentStatus.Refunded;
        }
        else if (order.PaidAmount == 0)
        {
            order.PaymentStatus = PaymentStatus.Pending;
        }

        order.Status = OrderStatus.Returned;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok($"Order {order.OrderNumber} returned — stock restored" + (order.PaidAmount > 0 ? $", refund of ${order.PaidAmount:F2} recorded" : ""));
    }

    public async Task<ApiResponse<PaymentDto>> RecordPaymentAsync(Guid id, RecordPaymentDto dto, string userId)
    {
        var order = await _db.SalesOrders.FindAsync(id);
        if (order == null) return ApiResponse<PaymentDto>.Fail("Order not found");
        if (order.Status == OrderStatus.Cancelled || order.Status == OrderStatus.Returned)
            return ApiResponse<PaymentDto>.Fail($"Cannot record payment on a {order.Status} order");
        if (dto.Amount <= 0) return ApiResponse<PaymentDto>.Fail("Payment amount must be greater than zero");

        var remaining = order.TotalAmount - order.PaidAmount;
        if (remaining <= 0) return ApiResponse<PaymentDto>.Fail("Invoice is already fully paid");
        if (dto.Amount > remaining) return ApiResponse<PaymentDto>.Fail($"Payment exceeds remaining balance (${remaining:F2})");

        var payment = new Payment
        {
            SalesOrderId = id,
            Amount = dto.Amount,
            Method = dto.Method,
            Reference = dto.Reference,
            Notes = dto.Notes,
            PaidAt = DateTime.UtcNow,
            CreatedByUserId = userId
        };
        _db.Payments.Add(payment);

        order.PaidAmount += dto.Amount;
        order.PaymentStatus = order.PaidAmount >= order.TotalAmount ? PaymentStatus.Paid : PaymentStatus.Partial;

        // Auto-record revenue in finance
        var category = await FinanceCategoryHelper.GetOrCreateAsync(_db, "Sales Revenue", TransactionType.Income);
        _db.FinanceTransactions.Add(new FinanceTransaction
        {
            CategoryId = category.Id,
            Type = TransactionType.Income,
            Amount = dto.Amount,
            TransactionDate = DateTime.UtcNow,
            Description = $"Payment received for {order.OrderNumber}",
            Reference = order.OrderNumber,
            CreatedByUserId = userId
        });

        await _db.SaveChangesAsync();
        return ApiResponse<PaymentDto>.Ok(new PaymentDto(payment.Id, payment.SalesOrderId, payment.PurchaseOrderId, payment.Amount, payment.Method, payment.Reference, payment.Notes, payment.PaidAt), "Payment recorded");
    }

    public async Task<List<PaymentDto>> GetPaymentsAsync(Guid id)
    {
        return await _db.Payments.AsNoTracking()
            .Where(p => p.SalesOrderId == id)
            .OrderByDescending(p => p.PaidAt)
            .Select(p => new PaymentDto(p.Id, p.SalesOrderId, p.PurchaseOrderId, p.Amount, p.Method, p.Reference, p.Notes, p.PaidAt))
            .ToListAsync();
    }

    public async Task<byte[]> GenerateInvoicePdfAsync(Guid id)
    {
        var s = await _db.SalesOrders.Include(x => x.Customer).Include(x => x.Items).ThenInclude(i => i.Product).FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new InvalidOperationException("Order not found");

        var lines = new List<string>
        {
            "##INVOICE",
            $"Invoice #: {s.OrderNumber}",
            $"Customer: {s.Customer.Name}" + (string.IsNullOrWhiteSpace(s.Customer.Email) ? "" : $" ({s.Customer.Email})"),
            $"Order Date: {s.OrderDate:dd MMM yyyy}    Due Date: {s.DueDate:dd MMM yyyy}",
            "",
            "##Items"
        };
        lines.Add(string.Format("{0,-32} {1,6} {2,12} {3,10} {4,14}", "Product", "Qty", "Unit Price", "Discount", "Total"));
        foreach (var i in s.Items)
            lines.Add(string.Format("{0,-32} {1,6} {2,12:N2} {3,10:N2} {4,14:N2}", Trunc(i.Product.Name, 32), i.Quantity, i.UnitPrice, i.Discount, i.TotalPrice));

        lines.Add("");
        lines.Add($"SubTotal: ${s.SubTotal:N2}");
        lines.Add($"Discount: -${s.DiscountAmount:N2}");
        lines.Add($"Tax (10%): ${s.TaxAmount:N2}");
        lines.Add($"##TOTAL: ${s.TotalAmount:N2}");
        lines.Add($"Paid: ${s.PaidAmount:N2}");
        lines.Add($"Balance Due: ${(s.TotalAmount - s.PaidAmount):N2}");
        lines.Add("");
        lines.Add(s.Notes ?? "");
        lines.Add("Thank you for your business!");

        return SimplePdfGenerator.Generate($"Invoice {s.OrderNumber}", lines);
    }

    public async Task<ApiResponse<string>> EmailInvoiceAsync(Guid id)
    {
        var s = await _db.SalesOrders.Include(x => x.Customer).FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return ApiResponse<string>.Fail("Order not found");
        if (string.IsNullOrWhiteSpace(s.Customer.Email)) return ApiResponse<string>.Fail("Customer has no email address on file");

        var pdf = await GenerateInvoicePdfAsync(id);
        var html = $"""
            <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto">
              <h2 style="color:#6366f1">Invoice {s.OrderNumber}</h2>
              <p>Dear {s.Customer.Name},</p>
              <p>Please find your invoice attached.</p>
              <ul>
                <li>Total: <strong>${s.TotalAmount:N2}</strong></li>
                <li>Paid: ${s.PaidAmount:N2}</li>
                <li>Balance Due: <strong>${(s.TotalAmount - s.PaidAmount):N2}</strong></li>
                <li>Due Date: {s.DueDate:dd MMM yyyy}</li>
              </ul>
              <p style="color:#64748b;font-size:13px">Thank you for your business!</p>
            </div>
            """;
        await _email.SendEmailWithAttachmentAsync(s.Customer.Email, $"Invoice {s.OrderNumber}", html, $"invoice-{s.OrderNumber}.pdf", pdf);
        return ApiResponse<string>.Ok($"Invoice emailed to {s.Customer.Email}");
    }

    public async Task<int> SendOverdueRemindersAsync()
    {
        var today = DateTime.UtcNow.Date;
        var overdueOrders = await _db.SalesOrders.Include(s => s.Customer)
            .Where(s => !s.IsDeleted
                && s.DueDate != null && s.DueDate.Value.Date < today
                && s.PaymentStatus != PaymentStatus.Paid
                && s.PaymentStatus != PaymentStatus.Refunded
                && s.Status != OrderStatus.Cancelled
                && s.Status != OrderStatus.Returned)
            .ToListAsync();

        var count = 0;
        foreach (var s in overdueOrders)
        {
            s.PaymentStatus = PaymentStatus.Overdue;
            s.UpdatedAt = DateTime.UtcNow;
            count++;

            if (!string.IsNullOrWhiteSpace(s.Customer.Email))
            {
                var html = $"""
                    <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto">
                      <h2 style="color:#dc2626">Payment Reminder — Invoice {s.OrderNumber}</h2>
                      <p>Dear {s.Customer.Name},</p>
                      <p>This is a reminder that invoice <strong>{s.OrderNumber}</strong> is <strong>overdue</strong>.</p>
                      <ul>
                        <li>Balance Due: <strong>${(s.TotalAmount - s.PaidAmount):N2}</strong></li>
                        <li>Was Due: {s.DueDate:dd MMM yyyy}</li>
                      </ul>
                      <p>Please arrange payment at your earliest convenience.</p>
                    </div>
                    """;
                await _email.SendEmailAsync(s.Customer.Email, $"Overdue Payment Reminder — {s.OrderNumber}", html);
            }
        }

        if (overdueOrders.Count > 0) await _db.SaveChangesAsync();
        return count;
    }

    public async Task<List<MonthlySalesReportDto>> GetMonthlyReportAsync(int year)
    {
        var rows = await _db.SalesOrders.AsNoTracking()
            .Where(s => s.OrderDate.Year == year && s.Status != OrderStatus.Cancelled && s.Status != OrderStatus.Returned)
            .Select(s => new { s.OrderDate.Month, s.SubTotal, s.TaxAmount, s.TotalAmount, s.PaidAmount })
            .ToListAsync();

        return rows.GroupBy(r => r.Month)
            .Select(g => new MonthlySalesReportDto(year, g.Key, g.Count(),
                g.Sum(x => x.SubTotal), g.Sum(x => x.TaxAmount), g.Sum(x => x.TotalAmount), g.Sum(x => x.PaidAmount)))
            .OrderBy(r => r.Month)
            .ToList();
    }

    public async Task<List<CustomerSalesReportDto>> GetCustomerWiseReportAsync(DateTime? from, DateTime? to)
    {
        var query = _db.SalesOrders.AsNoTracking().Where(s => s.Status != OrderStatus.Cancelled && s.Status != OrderStatus.Returned);
        if (from.HasValue) query = query.Where(s => s.OrderDate >= from.Value);
        if (to.HasValue) query = query.Where(s => s.OrderDate <= to.Value);

        var rows = await query.Select(s => new { s.CustomerId, CustomerName = s.Customer.Name, s.TotalAmount, s.PaidAmount }).ToListAsync();

        return rows.GroupBy(r => new { r.CustomerId, r.CustomerName })
            .Select(g => new CustomerSalesReportDto(g.Key.CustomerId, g.Key.CustomerName, g.Count(), g.Sum(x => x.TotalAmount), g.Sum(x => x.PaidAmount)))
            .OrderByDescending(r => r.TotalAmount)
            .ToList();
    }

    public async Task<List<ProductSalesReportDto>> GetProductWiseReportAsync(DateTime? from, DateTime? to, int top = 10)
    {
        var query = _db.SalesOrderItems.AsNoTracking().Where(i => i.SalesOrder.Status != OrderStatus.Cancelled && i.SalesOrder.Status != OrderStatus.Returned);
        if (from.HasValue) query = query.Where(i => i.SalesOrder.OrderDate >= from.Value);
        if (to.HasValue) query = query.Where(i => i.SalesOrder.OrderDate <= to.Value);

        var rows = await query.Select(i => new { i.ProductId, ProductName = i.Product.Name, i.Quantity, Revenue = i.TotalPrice }).ToListAsync();

        return rows.GroupBy(r => new { r.ProductId, r.ProductName })
            .Select(g => new ProductSalesReportDto(g.Key.ProductId, g.Key.ProductName, g.Sum(x => x.Quantity), g.Sum(x => x.Revenue)))
            .OrderByDescending(r => r.Revenue)
            .Take(top)
            .ToList();
    }

    private static string Trunc(string s, int max) => s.Length <= max ? s : s[..max];
}

internal static class FinanceCategoryHelper
{
    public static async Task<FinanceCategory> GetOrCreateAsync(AppDbContext db, string name, TransactionType type)
    {
        var cat = await db.FinanceCategories.FirstOrDefaultAsync(c => c.Name == name);
        if (cat == null)
        {
            cat = new FinanceCategory { Name = name, Type = type };
            db.FinanceCategories.Add(cat);
            await db.SaveChangesAsync();
        }
        return cat;
    }
}

public class PurchaseOrderService : IPurchaseOrderService
{
    private readonly AppDbContext _db;
    private readonly IEmailService _email;
    public PurchaseOrderService(AppDbContext db, IEmailService email) { _db = db; _email = email; }

    public async Task<PagedResult<PurchaseOrderDto>> GetAllAsync(PaginationParams pagination)
    {
        var query = _db.PurchaseOrders.Include(p => p.Supplier).AsNoTracking();
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(p => p.CreatedAt)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(p => new PurchaseOrderDto(p.Id, p.OrderNumber, p.Supplier.Name, p.OrderDate, p.Status, p.PaymentStatus, p.TotalAmount))
            .ToListAsync();

        return new PagedResult<PurchaseOrderDto> { Items = items, TotalCount = total, Page = pagination.Page, PageSize = pagination.PageSize };
    }

    public async Task<ApiResponse<PurchaseOrderDto>> GetByIdAsync(Guid id)
    {
        var p = await _db.PurchaseOrders.Include(x => x.Supplier).FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return ApiResponse<PurchaseOrderDto>.Fail("Purchase order not found");
        return ApiResponse<PurchaseOrderDto>.Ok(new PurchaseOrderDto(p.Id, p.OrderNumber, p.Supplier.Name, p.OrderDate, p.Status, p.PaymentStatus, p.TotalAmount));
    }

    public async Task<ApiResponse<PurchaseOrderDetailDto>> GetDetailAsync(Guid id)
    {
        var po = await _db.PurchaseOrders.Include(x => x.Supplier).Include(x => x.Items).ThenInclude(i => i.Product).FirstOrDefaultAsync(x => x.Id == id);
        if (po == null) return ApiResponse<PurchaseOrderDetailDto>.Fail("Purchase order not found");
        return ApiResponse<PurchaseOrderDetailDto>.Ok(MapDetail(po));
    }

    private static PurchaseOrderDetailDto MapDetail(PurchaseOrder p) => new(
        p.Id, p.OrderNumber, p.SupplierId, p.Supplier.Name, p.Supplier.Email,
        p.OrderDate, p.DeliveryDate, p.Status, p.PaymentStatus,
        p.SubTotal, p.TaxAmount, p.TotalAmount, p.PaidAmount, p.SupplierInvoiceNumber, p.Notes,
        p.Items.Select(i => new PurchaseOrderLineDto(i.ProductId, i.Product.Name, i.Quantity, i.UnitPrice, i.TotalPrice, i.ReceivedQuantity)).ToList());

    public async Task<ApiResponse<PurchaseOrderDto>> CreateAsync(CreatePurchaseOrderDto dto)
    {
        var count = await _db.PurchaseOrders.CountAsync() + 1;
        var orderNumber = $"PO-{DateTime.UtcNow.Year}-{count:D4}";

        decimal subtotal = 0;
        var orderItems = new List<PurchaseOrderItem>();

        foreach (var item in dto.Items)
        {
            var lineTotal = item.Quantity * item.UnitPrice;
            subtotal += lineTotal;
            orderItems.Add(new PurchaseOrderItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                TotalPrice = lineTotal
            });
        }

        var tax = Math.Round(subtotal * 0.10m, 2);
        var total = subtotal + tax;

        var po = new PurchaseOrder
        {
            OrderNumber = orderNumber,
            SupplierId = dto.SupplierId,
            OrderDate = dto.OrderDate,
            DeliveryDate = dto.DeliveryDate,
            SubTotal = subtotal,
            TaxAmount = tax,
            TotalAmount = total,
            Status = OrderStatus.Pending,
            PaymentStatus = PaymentStatus.Pending,
            Notes = dto.Notes,
            Items = orderItems
        };

        _db.PurchaseOrders.Add(po);
        await _db.SaveChangesAsync();

        var supp = await _db.Suppliers.FindAsync(dto.SupplierId);
        return ApiResponse<PurchaseOrderDto>.Ok(new PurchaseOrderDto(po.Id, po.OrderNumber, supp?.Name ?? "", po.OrderDate, po.Status, po.PaymentStatus, po.TotalAmount), "Purchase order created");
    }

    public async Task<ApiResponse<string>> UpdateStatusAsync(Guid id, string status)
    {
        var po = await _db.PurchaseOrders.FindAsync(id);
        if (po == null) return ApiResponse<string>.Fail("Purchase order not found");

        if (Enum.TryParse<OrderStatus>(status, true, out var orderStatus))
        {
            po.Status = orderStatus;
            po.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return ApiResponse<string>.Ok($"Purchase order status changed to {status}");
        }

        return ApiResponse<string>.Fail("Invalid status value");
    }

    public async Task<ApiResponse<string>> ConfirmAsync(Guid id, string userId)
    {
        var po = await _db.PurchaseOrders.FindAsync(id);
        if (po == null) return ApiResponse<string>.Fail("Purchase order not found");
        if (po.Status != OrderStatus.Draft && po.Status != OrderStatus.Pending)
            return ApiResponse<string>.Fail($"Only Draft/Pending orders can be confirmed (current: {po.Status})");

        po.Status = OrderStatus.Confirmed;
        po.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok($"Purchase order {po.OrderNumber} confirmed — can now be sent to supplier and received against");
    }

    public async Task<ApiResponse<string>> CancelAsync(Guid id, string userId)
    {
        var po = await _db.PurchaseOrders.FindAsync(id);
        if (po == null) return ApiResponse<string>.Fail("Purchase order not found");
        if (po.Status == OrderStatus.Delivered || po.Status == OrderStatus.Cancelled)
            return ApiResponse<string>.Fail(po.Status == OrderStatus.Delivered ? "Delivered orders cannot be cancelled" : "Order is already cancelled");

        po.Status = OrderStatus.Cancelled;
        po.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok($"Purchase order {po.OrderNumber} cancelled");
    }

    public async Task<ApiResponse<PurchaseOrderDetailDto>> ReceiveItemsAsync(Guid id, List<ReceiveItemDto> items, string userId)
    {
        var po = await _db.PurchaseOrders.Include(x => x.Supplier).Include(x => x.Items).ThenInclude(i => i.Product).FirstOrDefaultAsync(x => x.Id == id);
        if (po == null) return ApiResponse<PurchaseOrderDetailDto>.Fail("Purchase order not found");
        if (po.Status != OrderStatus.Confirmed && po.Status != OrderStatus.Shipped && po.Status != OrderStatus.Pending)
            return ApiResponse<PurchaseOrderDetailDto>.Fail($"Cannot receive items on a {po.Status} order");
        if (items == null || items.Count == 0) return ApiResponse<PurchaseOrderDetailDto>.Fail("No items to receive");

        foreach (var dto in items)
        {
            var line = po.Items.FirstOrDefault(i => i.ProductId == dto.ProductId);
            if (line == null) return ApiResponse<PurchaseOrderDetailDto>.Fail("Product does not belong to this purchase order");
            if (dto.Quantity <= 0) return ApiResponse<PurchaseOrderDetailDto>.Fail("Receive quantity must be greater than zero");

            var outstanding = line.Quantity - line.ReceivedQuantity;
            if (dto.Quantity > outstanding)
                return ApiResponse<PurchaseOrderDetailDto>.Fail($"Cannot receive {dto.Quantity} of '{line.Product.Name}' — only {outstanding} outstanding");
        }

        // Apply receipts: add to inventory with stock movements
        foreach (var dto in items)
        {
            var line = po.Items.First(i => i.ProductId == dto.ProductId);
            line.ReceivedQuantity += dto.Quantity;

            var product = line.Product;
            var previous = product.CurrentStock;
            product.CurrentStock += dto.Quantity;

            _db.StockMovements.Add(new StockMovement
            {
                ProductId = product.Id,
                Type = StockMovementType.In,
                Quantity = dto.Quantity,
                PreviousStock = previous,
                NewStock = product.CurrentStock,
                Reference = po.OrderNumber,
                Notes = "Purchase order receipt",
                CreatedByUserId = userId
            });
        }

        bool fullyReceived = po.Items.All(i => i.ReceivedQuantity >= i.Quantity);
        po.Status = fullyReceived ? OrderStatus.Delivered : po.Status == OrderStatus.Pending ? OrderStatus.Confirmed : po.Status;
        po.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var message = fullyReceived
            ? $"All items received — stock added to inventory, PO marked Delivered (complete)"
            : $"Partial receipt recorded — {po.Items.Sum(i => i.ReceivedQuantity)}/{po.Items.Sum(i => i.Quantity)} units received so far";
        return ApiResponse<PurchaseOrderDetailDto>.Ok(MapDetail(po), message);
    }

    public async Task<ApiResponse<string>> SetSupplierInvoiceNumberAsync(Guid id, string invoiceNumber)
    {
        var po = await _db.PurchaseOrders.FindAsync(id);
        if (po == null) return ApiResponse<string>.Fail("Purchase order not found");
        po.SupplierInvoiceNumber = invoiceNumber;
        po.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok($"Supplier invoice number saved: {invoiceNumber}");
    }

    public async Task<ApiResponse<string>> EmailToSupplierAsync(Guid id)
    {
        var po = await _db.PurchaseOrders.Include(x => x.Supplier).Include(x => x.Items).ThenInclude(i => i.Product).FirstOrDefaultAsync(x => x.Id == id);
        if (po == null) return ApiResponse<string>.Fail("Purchase order not found");
        if (string.IsNullOrWhiteSpace(po.Supplier.Email)) return ApiResponse<string>.Fail("Supplier has no email address on file");

        var rows = string.Join("", po.Items.Select(i =>
            $"<tr><td style='padding:6px 10px;border:1px solid #e2e8f0'>{i.Product.Name}</td><td style='padding:6px 10px;border:1px solid #e2e8f0;text-align:center'>{i.ReceivedQuantity}/{i.Quantity}</td><td style='padding:6px 10px;border:1px solid #e2e8f0;text-align:right'>${i.UnitPrice:N2}</td><td style='padding:6px 10px;border:1px solid #e2e8f0;text-align:right'>${i.TotalPrice:N2}</td></tr>"));

        var html = $"""
            <div style="font-family:Inter,sans-serif;max-width:600px;margin:auto">
              <h2 style="color:#6366f1">Purchase Order {po.OrderNumber}</h2>
              <p>Dear {po.Supplier.ContactPerson ?? po.Supplier.Name},</p>
              <p>Please find our purchase order below:</p>
              <table style="border-collapse:collapse;width:100%">
                <thead><tr style="background:#f1f5f9"><th style="padding:6px 10px;border:1px solid #e2e8f0">Product</th><th style="padding:6px 10px;border:1px solid #e2e8f0">Qty</th><th style="padding:6px 10px;border:1px solid #e2e8f0">Unit Price</th><th style="padding:6px 10px;border:1px solid #e2e8f0">Total</th></tr></thead>
                <tbody>{rows}</tbody>
              </table>
              <p style="text-align:right"><strong>Grand Total: ${po.TotalAmount:N2}</strong> (incl. tax ${po.TaxAmount:N2})</p>
              <p>Expected delivery: {(po.DeliveryDate?.ToString("dd MMM yyyy") ?? "as per agreement")}</p>
              <p style="color:#64748b;font-size:13px">{po.Notes}</p>
            </div>
            """;
        await _email.SendEmailAsync(po.Supplier.Email, $"Purchase Order {po.OrderNumber}", html);
        return ApiResponse<string>.Ok($"Purchase order emailed to {po.Supplier.Email}");
    }

    public async Task<ApiResponse<PaymentDto>> RecordPaymentAsync(Guid id, RecordPaymentDto dto, string userId)
    {
        var po = await _db.PurchaseOrders.FindAsync(id);
        if (po == null) return ApiResponse<PaymentDto>.Fail("Purchase order not found");
        if (po.Status == OrderStatus.Cancelled) return ApiResponse<PaymentDto>.Fail("Cannot record payment on a cancelled order");
        if (dto.Amount <= 0) return ApiResponse<PaymentDto>.Fail("Payment amount must be greater than zero");

        var remaining = po.TotalAmount - po.PaidAmount;
        if (remaining <= 0) return ApiResponse<PaymentDto>.Fail("This purchase order is already fully paid");
        if (dto.Amount > remaining) return ApiResponse<PaymentDto>.Fail($"Payment exceeds remaining balance (${remaining:F2})");

        var payment = new Payment
        {
            PurchaseOrderId = id,
            Amount = dto.Amount,
            Method = dto.Method,
            Reference = dto.Reference,
            Notes = dto.Notes,
            PaidAt = DateTime.UtcNow,
            CreatedByUserId = userId
        };
        _db.Payments.Add(payment);

        po.PaidAmount += dto.Amount;
        po.PaymentStatus = po.PaidAmount >= po.TotalAmount ? PaymentStatus.Paid : PaymentStatus.Partial;

        // Auto-record expense in finance
        var cat = await FinanceCategoryHelper.GetOrCreateAsync(_db, "Purchase Cost", TransactionType.Expense);
        _db.FinanceTransactions.Add(new FinanceTransaction
        {
            CategoryId = cat.Id,
            Type = TransactionType.Expense,
            Amount = dto.Amount,
            TransactionDate = DateTime.UtcNow,
            Description = $"Supplier payment for {po.OrderNumber}",
            Reference = po.OrderNumber,
            CreatedByUserId = userId
        });

        await _db.SaveChangesAsync();
        return ApiResponse<PaymentDto>.Ok(new PaymentDto(payment.Id, payment.SalesOrderId, payment.PurchaseOrderId, payment.Amount, payment.Method, payment.Reference, payment.Notes, payment.PaidAt), "Payment recorded");
    }

    public async Task<List<PaymentDto>> GetPaymentsAsync(Guid id)
    {
        return await _db.Payments.AsNoTracking()
            .Where(p => p.PurchaseOrderId == id)
            .OrderByDescending(p => p.PaidAt)
            .Select(p => new PaymentDto(p.Id, p.SalesOrderId, p.PurchaseOrderId, p.Amount, p.Method, p.Reference, p.Notes, p.PaidAt))
            .ToListAsync();
    }

    public async Task<List<MonthlyPurchaseReportDto>> GetMonthlyReportAsync(int year)
    {
        var rows = await _db.PurchaseOrders.AsNoTracking()
            .Where(p => p.OrderDate.Year == year && p.Status != OrderStatus.Cancelled)
            .Select(p => new { p.OrderDate.Month, p.TotalAmount, p.PaidAmount })
            .ToListAsync();

        return rows.GroupBy(r => r.Month)
            .Select(g => new MonthlyPurchaseReportDto(year, g.Key, g.Count(), g.Sum(x => x.TotalAmount), g.Sum(x => x.PaidAmount)))
            .OrderBy(r => r.Month)
            .ToList();
    }

    public async Task<List<SupplierPurchaseReportDto>> GetSupplierWiseReportAsync(DateTime? from, DateTime? to)
    {
        var query = _db.PurchaseOrders.AsNoTracking().Where(p => p.Status != OrderStatus.Cancelled);
        if (from.HasValue) query = query.Where(p => p.OrderDate >= from.Value);
        if (to.HasValue) query = query.Where(p => p.OrderDate <= to.Value);

        var rows = await query.Select(p => new { p.SupplierId, SupplierName = p.Supplier.Name, p.TotalAmount, p.PaidAmount }).ToListAsync();

        return rows.GroupBy(r => new { r.SupplierId, r.SupplierName })
            .Select(g => new SupplierPurchaseReportDto(g.Key.SupplierId, g.Key.SupplierName, g.Count(), g.Sum(x => x.TotalAmount), g.Sum(x => x.PaidAmount)))
            .OrderByDescending(r => r.TotalAmount)
            .ToList();
    }

    public async Task<ApiResponse<string>> DeleteAsync(Guid id)
    {
        var po = await _db.PurchaseOrders.FindAsync(id);
        if (po == null) return ApiResponse<string>.Fail("Purchase order not found");
        if (po.Status != OrderStatus.Draft && po.Status != OrderStatus.Pending && po.Status != OrderStatus.Cancelled)
            return ApiResponse<string>.Fail("Only Draft/Pending/Cancelled orders can be deleted");
        if (po.PaidAmount > 0) return ApiResponse<string>.Fail("Cannot delete an order with recorded payments");
        if (po.Items.Any(i => i.ReceivedQuantity > 0)) return ApiResponse<string>.Fail("Cannot delete an order with received items");

        po.IsDeleted = true;
        po.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok("Purchase order deleted");
    }
}

public class FinanceService : IFinanceService
{
    private readonly AppDbContext _db;
    private readonly INotificationService _notifications;
    public FinanceService(AppDbContext db, INotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task<PagedResult<FinanceTransactionDto>> GetTransactionsAsync(PaginationParams pagination,
        DateTime? from = null, DateTime? to = null, TransactionType? type = null)
    {
        var query = _db.FinanceTransactions.Include(t => t.Category).AsNoTracking();
        if (from.HasValue) query = query.Where(t => t.TransactionDate >= from.Value);
        if (to.HasValue) query = query.Where(t => t.TransactionDate <= to.Value);
        if (type.HasValue) query = query.Where(t => t.Type == type.Value);

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(t => t.TransactionDate)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(t => new FinanceTransactionDto(t.Id, t.Category.Name, t.Type, t.Amount, t.TransactionDate, t.Description, t.Reference))
            .ToListAsync();

        return new PagedResult<FinanceTransactionDto> { Items = items, TotalCount = total, Page = pagination.Page, PageSize = pagination.PageSize };
    }

    public async Task<ApiResponse<FinanceTransactionDto>> CreateTransactionAsync(CreateFinanceTransactionDto dto)
    {
        var tx = new FinanceTransaction
        {
            CategoryId = dto.CategoryId,
            Type = dto.Type,
            Amount = dto.Amount,
            TransactionDate = dto.TransactionDate,
            Description = dto.Description,
            Reference = dto.Reference
        };
        _db.FinanceTransactions.Add(tx);
        await _db.SaveChangesAsync();

        var cat = await _db.FinanceCategories.FindAsync(dto.CategoryId);
        return ApiResponse<FinanceTransactionDto>.Ok(new FinanceTransactionDto(tx.Id, cat?.Name ?? "", tx.Type, tx.Amount, tx.TransactionDate, tx.Description, tx.Reference), "Transaction recorded");
    }

    public async Task<PagedResult<ExpenseDto>> GetExpensesAsync(PaginationParams pagination)
    {
        var query = _db.Expenses.AsNoTracking();
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(e => e.CreatedAt)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(e => new ExpenseDto(e.Id, e.Title, e.Amount, e.ExpenseDate, e.Category, e.Status, e.SubmittedByUserId, e.CreatedAt))
            .ToListAsync();

        return new PagedResult<ExpenseDto> { Items = items, TotalCount = total, Page = pagination.Page, PageSize = pagination.PageSize };
    }

    public async Task<ApiResponse<ExpenseDto>> CreateExpenseAsync(CreateExpenseDto dto)
    {
        var expense = new Expense
        {
            Title = dto.Title,
            Description = dto.Description,
            Amount = dto.Amount,
            ExpenseDate = dto.ExpenseDate,
            Category = dto.Category,
            ReceiptUrl = dto.ReceiptUrl,
            Status = ExpenseStatus.Pending
        };
        _db.Expenses.Add(expense);
        await _db.SaveChangesAsync();

        return ApiResponse<ExpenseDto>.Ok(new ExpenseDto(expense.Id, expense.Title, expense.Amount, expense.ExpenseDate, expense.Category, expense.Status, null, expense.CreatedAt), "Expense submitted");
    }

    public async Task<ApiResponse<ExpenseDto>> ApproveExpenseAsync(Guid id, ApproveExpenseDto dto, string approverId)
    {
        var expense = await _db.Expenses.FindAsync(id);
        if (expense == null) return ApiResponse<ExpenseDto>.Fail("Expense not found");
        if (expense.Status != ExpenseStatus.Pending)
            return ApiResponse<ExpenseDto>.Fail($"Expense already {expense.Status}");

        expense.Status = dto.IsApproved ? ExpenseStatus.Approved : ExpenseStatus.Rejected;
        expense.ApprovedByUserId = approverId;
        expense.ApprovedAt = DateTime.UtcNow;
        expense.RejectionReason = dto.RejectionReason;
        expense.UpdatedAt = DateTime.UtcNow;

        var message = $"Expense {(dto.IsApproved ? "approved" : "rejected")}";

        if (dto.IsApproved)
        {
            // Auto-record in finance ledger
            var category = await FinanceCategoryHelper.GetOrCreateAsync(_db, "Employee Expense", TransactionType.Expense);
            _db.FinanceTransactions.Add(new FinanceTransaction
            {
                CategoryId = category.Id,
                Type = TransactionType.Expense,
                Amount = expense.Amount,
                TransactionDate = DateTime.UtcNow,
                Description = $"Approved expense: {expense.Title}",
                Reference = expense.Category,
                CreatedByUserId = approverId
            });

            // Update department budget actuals + exceed check
            var deptName = await _db.Employees
                .Where(e => e.ApplicationUserId == expense.SubmittedByUserId)
                .Select(e => e.Department.Name)
                .FirstOrDefaultAsync();

            if (!string.IsNullOrEmpty(deptName))
            {
                var budget = await _db.Budgets.FirstOrDefaultAsync(b =>
                    b.Department == deptName && b.Month == expense.ExpenseDate.Month && b.Year == expense.ExpenseDate.Year);

                if (budget != null)
                {
                    budget.SpentAmount += expense.Amount;
                    budget.UpdatedAt = DateTime.UtcNow;
                    if (budget.SpentAmount > budget.AllocatedAmount)
                    {
                        message += $" — ⚠ Budget exceeded for {deptName} ({budget.SpentAmount:F0}/{budget.AllocatedAmount:F0})";
                        await _notifications.CreateForRolesAsync(new[] { "Admin" },
                            "Budget Exceeded",
                            $"{deptName} budget exceeded: ${budget.SpentAmount:F0} spent of ${budget.AllocatedAmount:F0} allocated ('{expense.Title}' approved)",
                            NotificationType.Error,
                            "/finance");
                    }
                    else if (budget.AllocatedAmount > 0 && budget.SpentAmount / budget.AllocatedAmount >= 0.8m)
                    {
                        message += $" — ⚠ {deptName} budget at {(budget.SpentAmount / budget.AllocatedAmount * 100m):F0}%";
                        await _notifications.CreateForRolesAsync(new[] { "Admin" },
                            "Budget Warning",
                            $"{deptName} budget at {(budget.SpentAmount / budget.AllocatedAmount * 100m):F0}% used (${budget.SpentAmount:F0}/${budget.AllocatedAmount:F0})",
                            NotificationType.Warning,
                            "/finance");
                    }
                }
            }
        }

        await _db.SaveChangesAsync();
        return ApiResponse<ExpenseDto>.Ok(new ExpenseDto(expense.Id, expense.Title, expense.Amount, expense.ExpenseDate, expense.Category, expense.Status, expense.SubmittedByUserId, expense.CreatedAt), message);
    }

    public async Task<List<BudgetDto>> GetBudgetsAsync(int month, int year)
    {
        return await _db.Budgets
            .Where(b => b.Month == month && b.Year == year)
            .Select(b => new BudgetDto(b.Id, b.Name, b.AllocatedAmount, b.SpentAmount, b.AllocatedAmount - b.SpentAmount, b.Department, b.Month, b.Year))
            .ToListAsync();
    }

    public async Task<ApiResponse<BudgetDto>> CreateBudgetAsync(CreateBudgetDto dto)
    {
        var budget = new Budget
        {
            Name = dto.Name,
            AllocatedAmount = dto.AllocatedAmount,
            Department = dto.Department,
            Month = dto.Month,
            Year = dto.Year,
            SpentAmount = 0,
            Notes = dto.Notes
        };
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();

        return ApiResponse<BudgetDto>.Ok(new BudgetDto(budget.Id, budget.Name, budget.AllocatedAmount, 0, budget.AllocatedAmount, budget.Department, budget.Month, budget.Year), "Budget created");
    }

    public async Task<FinanceSummaryDto> GetSummaryAsync(DateTime? from, DateTime? to)
    {
        var query = _db.FinanceTransactions.AsNoTracking();
        if (from.HasValue) query = query.Where(t => t.TransactionDate >= from.Value);
        if (to.HasValue) query = query.Where(t => t.TransactionDate <= to.Value);
        else query = query.Where(t => t.TransactionDate.Year == DateTime.UtcNow.Year); // default: current year

        var rows = await query.Select(t => new { t.TransactionDate.Month, t.Type, t.Amount }).ToListAsync();

        var monthNames = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
        var monthsToReport = (from.HasValue || to.HasValue)
            ? rows.Select(r => r.Month).Distinct().OrderBy(m => m).ToList()
            : Enumerable.Range(1, 12).ToList();

        var monthly = monthsToReport.Select(m =>
            new MonthlyIncomeExpenseDto(monthNames[m - 1],
                rows.Where(r => r.Month == m && r.Type == TransactionType.Income).Sum(r => r.Amount),
                rows.Where(r => r.Month == m && r.Type == TransactionType.Expense).Sum(r => r.Amount))).ToList();

        var totalIncome = rows.Where(r => r.Type == TransactionType.Income).Sum(r => r.Amount);
        var totalExpense = rows.Where(r => r.Type == TransactionType.Expense).Sum(r => r.Amount);
        return new FinanceSummaryDto(totalIncome, totalExpense, totalIncome - totalExpense, monthly);
    }

    public async Task<List<DepartmentExpenseReportDto>> GetDepartmentExpenseReportAsync(DateTime? from, DateTime? to)
    {
        var query = _db.Expenses.AsNoTracking().Where(e => e.Status == ExpenseStatus.Approved);
        if (from.HasValue) query = query.Where(e => e.ExpenseDate >= from.Value);
        if (to.HasValue) query = query.Where(e => e.ExpenseDate <= to.Value);

        var rows = await query
            .Select(e => new
            {
                e.Amount,
                Dept = _db.Employees.Where(emp => emp.ApplicationUserId == e.SubmittedByUserId).Select(emp => emp.Department.Name).FirstOrDefault()
            })
            .ToListAsync();

        return rows.GroupBy(r => r.Dept ?? "Unassigned")
            .Select(g => new DepartmentExpenseReportDto(g.Key, g.Count(), g.Sum(x => x.Amount)))
            .OrderByDescending(r => r.Amount)
            .ToList();
    }

    public async Task<List<CategoryExpenseReportDto>> GetCategoryExpenseReportAsync(DateTime? from, DateTime? to)
    {
        var query = _db.Expenses.AsNoTracking().Where(e => e.Status == ExpenseStatus.Approved);
        if (from.HasValue) query = query.Where(e => e.ExpenseDate >= from.Value);
        if (to.HasValue) query = query.Where(e => e.ExpenseDate <= to.Value);

        var rows = await query.Select(e => new { e.Category, e.Amount }).ToListAsync();

        return rows.GroupBy(r => r.Category)
            .Select(g => new CategoryExpenseReportDto(g.Key, g.Count(), g.Sum(x => x.Amount)))
            .OrderByDescending(r => r.Amount)
            .ToList();
    }

    public async Task<List<BudgetAlertDto>> GetBudgetAlertsAsync(int month, int year)
    {
        var budgets = await _db.Budgets
            .Where(b => b.Month == month && b.Year == year)
            .Select(b => new BudgetAlertDto(b.Id, b.Name, b.Department, b.AllocatedAmount, b.SpentAmount,
                b.AllocatedAmount - b.SpentAmount,
                b.AllocatedAmount > 0 ? (double)(b.SpentAmount / b.AllocatedAmount * 100m) : 0,
                ""))
            .ToListAsync();

        return budgets
            .Select(b => b with
            {
                AlertLevel = b.PercentUsed >= 100 ? "Exceeded" : b.PercentUsed >= 80 ? "Warning" : "Ok"
            })
            .Where(b => b.AlertLevel != "Ok")
            .OrderByDescending(b => b.PercentUsed)
            .ToList();
    }

    public async Task<byte[]> ExportFinancialReportPdfAsync(int year, int? quarter, int? month)
    {
        string title;
        DateTime? from = null;
        DateTime? to = null;

        if (month.HasValue)
        {
            title = $"Financial Report — {year}/{month:D2}";
            from = new DateTime(year, month.Value, 1);
            to = from.Value.AddMonths(1).AddSeconds(-1);
        }
        else if (quarter.HasValue)
        {
            var startMonth = (quarter.Value - 1) * 3 + 1;
            title = $"Financial Report — Q{quarter} {year}";
            from = new DateTime(year, startMonth, 1);
            to = new DateTime(year, startMonth + 2, DateTime.DaysInMonth(year, startMonth + 2));
        }
        else
        {
            title = $"Annual Financial Report — {year}";
            from = new DateTime(year, 1, 1);
            to = new DateTime(year, 12, 31);
        }

        var summary = await GetSummaryAsync(from, to);
        var deptReport = await GetDepartmentExpenseReportAsync(from, to);
        var catReport = await GetCategoryExpenseReportAsync(from, to);

        var lines = new List<string>
        {
            $"##Period: {(month.HasValue ? $"{year}-{month:D2}" : quarter.HasValue ? $"Q{quarter} {year}" : $"Jan–Dec {year}")}",
            $"Total Income: ${summary.TotalIncome:N2}",
            $"Total Expense: ${summary.TotalExpense:N2}",
            $"##NET PROFIT: ${summary.NetProfit:N2}",
            "",
            "##Monthly Breakdown"
        };
        foreach (var m in summary.Monthly)
            lines.Add($"  {m.Month}: Income ${m.Income:N0} | Expense ${m.Expense:N0} | Net ${(m.Income - m.Expense):N0}");

        lines.Add("");
        lines.Add("##Department-wise Expenses");
        foreach (var d in deptReport.Take(10))
            lines.Add($"  {d.Department}: ${d.Amount:N2} ({d.Count} claims)");
        if (deptReport.Count == 0) lines.Add("  No approved expenses in period");

        lines.Add("");
        lines.Add("##Category-wise Expenses");
        foreach (var c in catReport.Take(10))
            lines.Add($"  {c.Category}: ${c.Amount:N2} ({c.Count} claims)");
        if (catReport.Count == 0) lines.Add("  No data");

        return SimplePdfGenerator.Generate(title, lines);
    }

    public async Task<string> ExportTransactionsCsvAsync(DateTime? from, DateTime? to)
    {
        var query = _db.FinanceTransactions.Include(t => t.Category).AsNoTracking();
        if (from.HasValue) query = query.Where(t => t.TransactionDate >= from.Value);
        if (to.HasValue) query = query.Where(t => t.TransactionDate <= to.Value);

        var rows = await query.OrderBy(t => t.TransactionDate)
            .Select(t => new { t.TransactionDate, t.Type, Category = t.Category.Name, t.Amount, t.Description, Reference = t.Reference ?? "" })
            .ToListAsync();

        var sb = new StringBuilder("Date,Type,Category,Amount,Description,Reference\n");
        foreach (var r in rows)
            sb.Append($"{r.TransactionDate:yyyy-MM-dd},{r.Type},{CsvEscape(r.Category)},{r.Amount:F2},{CsvEscape(r.Description)},{CsvEscape(r.Reference)}\n");

        return sb.ToString();
    }

    private static string CsvEscape(string s) =>
        string.IsNullOrEmpty(s) ? "" : (s.Contains(',') || s.Contains('"') || s.Contains('\n') ? $"\"{s.Replace("\"", "\"\"")}\"" : s);
}

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;
    public DashboardService(AppDbContext db) => _db = db;

    public async Task<DashboardStatsDto> GetStatsAsync()
    {
        var totalEmployees = await _db.Employees.CountAsync();
        var activeEmployees = await _db.Employees.CountAsync(e => e.Status == EmployeeStatus.Active);
        var totalCustomers = await _db.Customers.CountAsync();
        var activeProjects = await _db.Projects.CountAsync(p => p.Status == ProjectStatus.Active);
        var pendingLeaves = await _db.LeaveRequests.CountAsync(l => l.Status == LeaveStatus.Pending);
        var pendingExpenses = await _db.Expenses.CountAsync(e => e.Status == ExpenseStatus.Pending);
        var totalRevenue = await _db.SalesOrders.Where(s => s.PaymentStatus == PaymentStatus.Paid).SumAsync(s => s.TotalAmount);
        var totalExpenses = await _db.Expenses.Where(e => e.Status == ExpenseStatus.Approved).SumAsync(e => e.Amount);
        var lowStock = await _db.Products.CountAsync(p => p.CurrentStock <= p.MinimumStock);
        var pendingOrders = await _db.SalesOrders.CountAsync(s => s.Status == OrderStatus.Pending);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var todayAttendance = await _db.Attendances.CountAsync(a => a.AttendanceDate == today && a.IsPresent);

        return new DashboardStatsDto(
            totalEmployees,
            activeEmployees,
            totalCustomers,
            activeProjects,
            pendingLeaves,
            pendingExpenses,
            totalRevenue,
            totalExpenses,
            totalRevenue - totalExpenses,
            lowStock,
            pendingOrders,
            todayAttendance
        );
    }

    public async Task<List<MonthlyRevenueDto>> GetMonthlyRevenueAsync(int year)
    {
        var months = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
        var list = new List<MonthlyRevenueDto>();

        for (int i = 1; i <= 12; i++)
        {
            var rev = await _db.SalesOrders.Where(s => s.OrderDate.Year == year && s.OrderDate.Month == i).SumAsync(s => s.TotalAmount);
            var exp = await _db.Expenses.Where(e => e.ExpenseDate.Year == year && e.ExpenseDate.Month == i && e.Status == ExpenseStatus.Approved).SumAsync(e => e.Amount);
            list.Add(new MonthlyRevenueDto(months[i - 1], rev, exp));
        }

        return list;
    }

    public async Task<List<TopProductDto>> GetTopProductsAsync(int count = 5)
    {
        return await _db.Products
            .Take(count)
            .Select(p => new TopProductDto(p.Name, p.CurrentStock, p.SellingPrice * p.CurrentStock))
            .ToListAsync();
    }

    public async Task<List<RecentActivityDto>> GetRecentActivitiesAsync(int count = 10)
    {
        var activities = new List<RecentActivityDto>();

        var recentOrders = await _db.SalesOrders.Include(s => s.Customer).OrderByDescending(s => s.CreatedAt).Take(5).ToListAsync();
        foreach (var o in recentOrders)
        {
            activities.Add(new RecentActivityDto($"New Order {o.OrderNumber} by {o.Customer?.Name}", "Sales System", o.CreatedAt, "Sales"));
        }

        var recentLeaves = await _db.LeaveRequests.Include(l => l.Employee).OrderByDescending(l => l.CreatedAt).Take(5).ToListAsync();
        foreach (var l in recentLeaves)
        {
            activities.Add(new RecentActivityDto($"Leave Request from {l.Employee?.FirstName} {l.Employee?.LastName}", "HR System", l.CreatedAt, "HR"));
        }

        return activities.OrderByDescending(a => a.Timestamp).Take(count).ToList();
    }

    public async Task<List<AttendanceTrendDto>> GetAttendanceTrendsAsync(int weeks = 8)
    {
        var today = DateTime.UtcNow.Date;
        var start = today.AddDays(-(int)today.DayOfWeek - 7 * (weeks - 1) + 1); // go back to Sunday of (weeks-1) ago
        if (start > today) start = start.AddDays(-7);

        var rows = await _db.Attendances.AsNoTracking()
            .Where(a => a.AttendanceDate >= DateOnly.FromDateTime(start))
            .Select(a => new { a.AttendanceDate, a.IsPresent })
            .ToListAsync();

        var trends = new List<AttendanceTrendDto>();
        for (var w = 0; w < weeks; w++)
        {
            var weekStart = start.AddDays(w * 7);
            var weekEnd = weekStart.AddDays(6);
            var inWeek = rows.Where(r => r.AttendanceDate >= DateOnly.FromDateTime(weekStart) && r.AttendanceDate <= DateOnly.FromDateTime(weekEnd)).ToList();
            var present = inWeek.Count(r => r.IsPresent);
            trends.Add(new AttendanceTrendDto(
                $"{weekStart:dd MMM}",
                present,
                inWeek.Count > 0 ? Math.Round(present * 100.0 / inWeek.Count, 1) : 0));
        }
        return trends;
    }

    public async Task<List<DeptDistributionDto>> GetDeptDistributionAsync()
    {
        var rows = await _db.Employees.AsNoTracking()
            .Where(e => !e.IsDeleted)
            .Select(e => new { DeptName = e.Department.Name })
            .ToListAsync();

        return rows.GroupBy(r => r.DeptName)
            .Select(g => new DeptDistributionDto(g.Key, g.Count()))
            .OrderByDescending(d => d.EmployeeCount)
            .ToList();
    }

    public async Task<List<ProjectProgressDto>> GetProjectCompletionAsync()
    {
        return await _db.Projects.AsNoTracking()
            .Where(p => !p.IsDeleted)
            .OrderBy(p => p.Name)
            .Select(p => new ProjectProgressDto(p.Name, p.Status.ToString(), p.Progress))
            .ToListAsync();
    }

    public async Task<List<LeaveUtilizationDto>> GetLeaveUtilizationAsync(int year)
    {
        var rows = await _db.LeaveRequests.AsNoTracking()
            .Where(l => l.Status == LeaveStatus.Approved && l.StartDate.Year == year)
            .Select(l => new { l.StartDate.Month, l.TotalDays })
            .ToListAsync();

        var monthNames = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
        return Enumerable.Range(1, 12)
            .Select(m => new LeaveUtilizationDto(monthNames[m - 1], rows.Where(r => r.Month == m).Sum(r => r.TotalDays)))
            .ToList();
    }

    public async Task<List<PayrollCostTrendDto>> GetPayrollCostTrendAsync(int year)
    {
        var rows = await _db.PayrollRecords.AsNoTracking()
            .Where(p => p.Year == year && p.Status != PayrollStatus.Failed)
            .Select(p => new { p.Month, p.NetSalary })
            .ToListAsync();

        return Enumerable.Range(1, 12)
            .Select(m => new PayrollCostTrendDto(
                m,
                rows.Where(r => r.Month == m).Sum(r => r.NetSalary),
                rows.Count(r => r.Month == m)))
            .Where(r => r.TotalCost > 0 || r.EmployeeCount > 0)
            .ToList();
    }

    public async Task<List<TopEmployeeDto>> GetTopEmployeesAsync(int limit = 5)
    {
        var assignments = await _db.TaskAssignments.AsNoTracking()
            .Where(a => !a.Task.IsDeleted)
            .Select(a => new
            {
                a.EmployeeId,
                Name = a.Employee.FirstName + " " + a.Employee.LastName,
                Dept = a.Employee.Department.Name,
                IsDone = a.Task.Status == ERP.Domain.Enums.TaskStatus.Done
            })
            .ToListAsync();

        return assignments.GroupBy(a => a.EmployeeId)
            .Select(g =>
            {
                var first = g.First();
                return new TopEmployeeDto(first.Name, first.Dept, g.Count(x => x.IsDone), g.Count());
            })
            .OrderByDescending(t => t.TasksCompleted)
            .ThenByDescending(t => t.TotalAssigned)
            .Take(limit)
            .ToList();
    }

    public async Task<List<InventoryValuationDto>> GetInventoryValuationAsync()
    {
        var products = await _db.Products.AsNoTracking()
            .Where(p => !p.IsDeleted)
            .Select(p => new { Category = p.Category.Name, p.CurrentStock, Value = p.CurrentStock * p.CostPrice })
            .ToListAsync();

        return products.GroupBy(p => p.Category)
            .Select(g => new InventoryValuationDto(
                g.Key,
                g.Count(),
                g.Sum(x => x.CurrentStock),
                g.Sum(x => x.Value)))
            .OrderByDescending(v => v.StockValue)
            .ToList();
    }

    public async Task<List<CustomerAcquisitionDto>> GetCustomerAcquisitionAsync(int year)
    {
        var rows = await _db.Customers.AsNoTracking()
            .IgnoreQueryFilters()
            .Where(c => c.CreatedAt.Year == year)
            .Select(c => new { c.CreatedAt.Month })
            .ToListAsync();

        var monthNames = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
        return monthNames.Select((name, i) => new CustomerAcquisitionDto(name, rows.Count(r => r.Month == i + 1)))
            .Where(r => r.NewCustomers > 0)
            .ToList();
    }

    public async Task<List<LeadFunnelDto>> GetLeadFunnelAsync()
    {
        var stages = new[] { LeadStatus.New, LeadStatus.Contacted, LeadStatus.Qualified, LeadStatus.Proposal, LeadStatus.Negotiation, LeadStatus.Won };
        var rows = await _db.Leads.AsNoTracking()
            .Where(l => !l.IsDeleted)
            .Select(l => new { l.Status, l.EstimatedValue })
            .ToListAsync();

        return stages.Select(s => new LeadFunnelDto(
                s.ToString(),
                rows.Count(r => r.Status == s),
                rows.Where(r => r.Status == s).Sum(r => r.EstimatedValue)))
            .ToList();
    }
}

public class InteractionService : IInteractionService
{
    private readonly AppDbContext _db;
    public InteractionService(AppDbContext db) => _db = db;

    public async Task<List<InteractionDto>> GetByCustomerAsync(Guid customerId)
    {
        return await _db.Interactions
            .AsNoTracking()
            .Where(i => i.CustomerId == customerId && !i.IsDeleted)
            .OrderByDescending(i => i.InteractionDate)
            .Select(i => new InteractionDto(
                i.Id, i.CustomerId, i.Customer.Name, i.Type,
                i.Subject, i.Notes, i.InteractionDate, i.FollowUpDate))
            .ToListAsync();
    }

    public async Task<List<InteractionDto>> GetDueFollowUpsAsync()
    {
        var today = DateTime.UtcNow.Date;
        return await _db.Interactions
            .AsNoTracking()
            .Where(i => !i.IsDeleted && i.FollowUpDate != null && i.FollowUpDate <= today.AddDays(7))
            .OrderBy(i => i.FollowUpDate)
            .Select(i => new InteractionDto(
                i.Id, i.CustomerId, i.Customer.Name, i.Type,
                i.Subject, i.Notes, i.InteractionDate, i.FollowUpDate))
            .ToListAsync();
    }

    public async Task<ApiResponse<InteractionDto>> CreateAsync(CreateInteractionDto dto, string userId)
    {
        var customer = await _db.Customers.FindAsync(dto.CustomerId);
        if (customer == null) return ApiResponse<InteractionDto>.Fail("Customer not found");

        var interaction = new Interaction
        {
            CustomerId = dto.CustomerId,
            Type = dto.Type,
            Subject = dto.Subject,
            Notes = dto.Notes,
            InteractionDate = dto.InteractionDate == default ? DateTime.UtcNow : dto.InteractionDate,
            FollowUpDate = dto.FollowUpDate,
            CreatedByUserId = userId
        };
        _db.Interactions.Add(interaction);
        await _db.SaveChangesAsync();

        return ApiResponse<InteractionDto>.Ok(new InteractionDto(
            interaction.Id, interaction.CustomerId, customer.Name, interaction.Type,
            interaction.Subject, interaction.Notes, interaction.InteractionDate, interaction.FollowUpDate
        ), "Interaction logged");
    }
}
