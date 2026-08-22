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
    public TaskService(AppDbContext db) => _db = db;

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
}

public class SalesOrderService : ISalesOrderService
{
    private readonly AppDbContext _db;
    public SalesOrderService(AppDbContext db) => _db = db;

    public async Task<PagedResult<SalesOrderDto>> GetAllAsync(PaginationParams pagination)
    {
        var query = _db.SalesOrders.Include(s => s.Customer).AsNoTracking();
        var total = await query.CountAsync();
        var items = await query.OrderByDescending(s => s.CreatedAt)
            .Skip((pagination.Page - 1) * pagination.PageSize)
            .Take(pagination.PageSize)
            .Select(s => new SalesOrderDto(s.Id, s.OrderNumber, s.Customer.Name, s.OrderDate, s.Status, s.PaymentStatus, s.TotalAmount, s.PaidAmount))
            .ToListAsync();

        return new PagedResult<SalesOrderDto> { Items = items, TotalCount = total, Page = pagination.Page, PageSize = pagination.PageSize };
    }

    public async Task<ApiResponse<SalesOrderDto>> GetByIdAsync(Guid id)
    {
        var s = await _db.SalesOrders.Include(x => x.Customer).FirstOrDefaultAsync(x => x.Id == id);
        if (s == null) return ApiResponse<SalesOrderDto>.Fail("Order not found");
        return ApiResponse<SalesOrderDto>.Ok(new SalesOrderDto(s.Id, s.OrderNumber, s.Customer.Name, s.OrderDate, s.Status, s.PaymentStatus, s.TotalAmount, s.PaidAmount));
    }

    public async Task<ApiResponse<SalesOrderDto>> CreateAsync(CreateSalesOrderDto dto)
    {
        var count = await _db.SalesOrders.CountAsync() + 1;
        var orderNumber = $"SO-{DateTime.UtcNow.Year}-{count:D4}";

        decimal subtotal = 0;
        var orderItems = new List<SalesOrderItem>();

        foreach (var item in dto.Items)
        {
            var lineTotal = (item.Quantity * item.UnitPrice) - item.Discount;
            subtotal += lineTotal;
            orderItems.Add(new SalesOrderItem
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Discount = item.Discount,
                TotalPrice = lineTotal
            });
        }

        var tax = subtotal * 0.10m;
        var total = subtotal + tax;

        var order = new SalesOrder
        {
            OrderNumber = orderNumber,
            CustomerId = dto.CustomerId,
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

        _db.SalesOrders.Add(order);
        await _db.SaveChangesAsync();

        var cust = await _db.Customers.FindAsync(dto.CustomerId);
        return ApiResponse<SalesOrderDto>.Ok(new SalesOrderDto(order.Id, order.OrderNumber, cust?.Name ?? "", order.OrderDate, order.Status, order.PaymentStatus, order.TotalAmount, 0), "Sales order created");
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

    public async Task<ApiResponse<string>> DeleteAsync(Guid id)
    {
        var order = await _db.SalesOrders.FindAsync(id);
        if (order == null) return ApiResponse<string>.Fail("Order not found");
        order.IsDeleted = true;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok("Order deleted");
    }
}

public class PurchaseOrderService : IPurchaseOrderService
{
    private readonly AppDbContext _db;
    public PurchaseOrderService(AppDbContext db) => _db = db;

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

        var tax = subtotal * 0.10m;
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

    public async Task<ApiResponse<string>> DeleteAsync(Guid id)
    {
        var po = await _db.PurchaseOrders.FindAsync(id);
        if (po == null) return ApiResponse<string>.Fail("Purchase order not found");
        po.IsDeleted = true;
        po.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return ApiResponse<string>.Ok("Purchase order deleted");
    }
}

public class FinanceService : IFinanceService
{
    private readonly AppDbContext _db;
    public FinanceService(AppDbContext db) => _db = db;

    public async Task<PagedResult<FinanceTransactionDto>> GetTransactionsAsync(PaginationParams pagination)
    {
        var query = _db.FinanceTransactions.Include(t => t.Category).AsNoTracking();
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

        expense.Status = dto.IsApproved ? ExpenseStatus.Approved : ExpenseStatus.Rejected;
        expense.ApprovedByUserId = approverId;
        expense.ApprovedAt = DateTime.UtcNow;
        expense.RejectionReason = dto.RejectionReason;
        expense.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ApiResponse<ExpenseDto>.Ok(new ExpenseDto(expense.Id, expense.Title, expense.Amount, expense.ExpenseDate, expense.Category, expense.Status, expense.SubmittedByUserId, expense.CreatedAt), $"Expense {(dto.IsApproved ? "approved" : "rejected")}");
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
