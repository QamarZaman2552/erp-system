using ERP.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ERP.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // HR
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Designation> Designations => Set<Designation>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<PayrollRecord> PayrollRecords => Set<PayrollRecord>();

    // CRM
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<Interaction> Interactions => Set<Interaction>();

    // Projects
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectTask> ProjectTasks => Set<ProjectTask>();
    public DbSet<TaskAssignment> TaskAssignments => Set<TaskAssignment>();
    public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();

    // Inventory
    public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();

    // Sales & Purchase
    public DbSet<SalesOrder> SalesOrders => Set<SalesOrder>();
    public DbSet<SalesOrderItem> SalesOrderItems => Set<SalesOrderItem>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<PurchaseOrderItem> PurchaseOrderItems => Set<PurchaseOrderItem>();

    // Finance
    public DbSet<FinanceCategory> FinanceCategories => Set<FinanceCategory>();
    public DbSet<FinanceTransaction> FinanceTransactions => Set<FinanceTransaction>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Budget> Budgets => Set<Budget>();

    // System
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<Document> Documents => Set<Document>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Global query filter for soft delete
        builder.Entity<Department>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Designation>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Employee>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Attendance>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<LeaveRequest>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<PayrollRecord>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Customer>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Lead>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Interaction>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Project>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<ProjectTask>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<TaskAssignment>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<ProjectMember>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<ProductCategory>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Supplier>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Product>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<StockMovement>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<SalesOrder>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<SalesOrderItem>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<PurchaseOrder>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<PurchaseOrderItem>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<FinanceCategory>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<FinanceTransaction>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Expense>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Budget>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Notification>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<ActivityLog>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Document>().HasQueryFilter(e => !e.IsDeleted);

        // Precision for money
        builder.Entity<Employee>().Property(e => e.BasicSalary).HasPrecision(18, 2);
        builder.Entity<Designation>().Property(e => e.MinSalary).HasPrecision(18, 2);
        builder.Entity<Designation>().Property(e => e.MaxSalary).HasPrecision(18, 2);
        builder.Entity<PayrollRecord>().Property(e => e.BasicSalary).HasPrecision(18, 2);
        builder.Entity<PayrollRecord>().Property(e => e.GrossSalary).HasPrecision(18, 2);
        builder.Entity<PayrollRecord>().Property(e => e.NetSalary).HasPrecision(18, 2);
        builder.Entity<PayrollRecord>().Property(e => e.HouseAllowance).HasPrecision(18, 2);
        builder.Entity<PayrollRecord>().Property(e => e.MedicalAllowance).HasPrecision(18, 2);
        builder.Entity<PayrollRecord>().Property(e => e.TransportAllowance).HasPrecision(18, 2);
        builder.Entity<PayrollRecord>().Property(e => e.OtherAllowances).HasPrecision(18, 2);
        builder.Entity<PayrollRecord>().Property(e => e.TaxDeduction).HasPrecision(18, 2);
        builder.Entity<PayrollRecord>().Property(e => e.ProvidentFund).HasPrecision(18, 2);
        builder.Entity<PayrollRecord>().Property(e => e.OtherDeductions).HasPrecision(18, 2);
        builder.Entity<Customer>().Property(e => e.TotalPurchaseValue).HasPrecision(18, 2);
        builder.Entity<Lead>().Property(e => e.EstimatedValue).HasPrecision(18, 2);
        builder.Entity<Project>().Property(e => e.Budget).HasPrecision(18, 2);
        builder.Entity<Project>().Property(e => e.ActualCost).HasPrecision(18, 2);
        builder.Entity<Product>().Property(e => e.CostPrice).HasPrecision(18, 2);
        builder.Entity<Product>().Property(e => e.SellingPrice).HasPrecision(18, 2);
        builder.Entity<Supplier>().Property(e => e.TotalPurchaseValue).HasPrecision(18, 2);
        builder.Entity<SalesOrder>().Property(e => e.SubTotal).HasPrecision(18, 2);
        builder.Entity<SalesOrder>().Property(e => e.TaxAmount).HasPrecision(18, 2);
        builder.Entity<SalesOrder>().Property(e => e.DiscountAmount).HasPrecision(18, 2);
        builder.Entity<SalesOrder>().Property(e => e.TotalAmount).HasPrecision(18, 2);
        builder.Entity<SalesOrder>().Property(e => e.PaidAmount).HasPrecision(18, 2);
        builder.Entity<SalesOrderItem>().Property(e => e.UnitPrice).HasPrecision(18, 2);
        builder.Entity<SalesOrderItem>().Property(e => e.Discount).HasPrecision(18, 2);
        builder.Entity<SalesOrderItem>().Property(e => e.TotalPrice).HasPrecision(18, 2);
        builder.Entity<PurchaseOrder>().Property(e => e.SubTotal).HasPrecision(18, 2);
        builder.Entity<PurchaseOrder>().Property(e => e.TaxAmount).HasPrecision(18, 2);
        builder.Entity<PurchaseOrder>().Property(e => e.TotalAmount).HasPrecision(18, 2);
        builder.Entity<PurchaseOrder>().Property(e => e.PaidAmount).HasPrecision(18, 2);
        builder.Entity<PurchaseOrderItem>().Property(e => e.UnitPrice).HasPrecision(18, 2);
        builder.Entity<PurchaseOrderItem>().Property(e => e.TotalPrice).HasPrecision(18, 2);
        builder.Entity<FinanceTransaction>().Property(e => e.Amount).HasPrecision(18, 2);
        builder.Entity<Expense>().Property(e => e.Amount).HasPrecision(18, 2);
        builder.Entity<Budget>().Property(e => e.AllocatedAmount).HasPrecision(18, 2);
        builder.Entity<Budget>().Property(e => e.SpentAmount).HasPrecision(18, 2);

        // Indexes
        builder.Entity<Employee>().HasIndex(e => e.EmployeeCode).IsUnique();
        builder.Entity<Employee>().HasIndex(e => e.Email).IsUnique();
        builder.Entity<Product>().HasIndex(e => e.Code).IsUnique();
        builder.Entity<SalesOrder>().HasIndex(e => e.OrderNumber).IsUnique();
        builder.Entity<PurchaseOrder>().HasIndex(e => e.OrderNumber).IsUnique();
        builder.Entity<Attendance>().HasIndex(e => new { e.EmployeeId, e.AttendanceDate }).IsUnique();

        // Self-referencing ProjectTask
        builder.Entity<ProjectTask>()
            .HasOne(t => t.ParentTask)
            .WithMany(t => t.SubTasks)
            .HasForeignKey(t => t.ParentTaskId)
            .OnDelete(DeleteBehavior.Restrict);

        // Avoid cycle or multiple cascade paths for Employee
        builder.Entity<Employee>()
            .HasOne(e => e.Department)
            .WithMany(d => d.Employees)
            .HasForeignKey(e => e.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Employee>()
            .HasOne(e => e.Designation)
            .WithMany(d => d.Employees)
            .HasForeignKey(e => e.DesignationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
