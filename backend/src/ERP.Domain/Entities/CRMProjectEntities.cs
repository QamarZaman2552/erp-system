using ERP.Domain.Common;
using ERP.Domain.Enums;

namespace ERP.Domain.Entities;

// ─── CRM ──────────────────────────────────────────────────────────────────────

public class Customer : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Company { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? Website { get; set; }
    public decimal TotalPurchaseValue { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
    public string? AssignedToId { get; set; }

    public ICollection<Lead> Leads { get; set; } = [];
    public ICollection<SalesOrder> SalesOrders { get; set; } = [];
    public ICollection<Interaction> Interactions { get; set; } = [];
}

public class Lead : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? ContactName { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public string? Company { get; set; }
    public string? Source { get; set; }
    public LeadStatus Status { get; set; } = LeadStatus.New;
    public decimal EstimatedValue { get; set; }
    public DateTime? ExpectedCloseDate { get; set; }
    public string? AssignedToId { get; set; }
    public Guid? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public string? Notes { get; set; }
}

public class Interaction : BaseEntity
{
    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public string Type { get; set; } = string.Empty; // Call, Email, Meeting, etc.
    public string Subject { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime InteractionDate { get; set; }
    public DateTime? FollowUpDate { get; set; }
    public string? CreatedByUserId { get; set; }
}

// ─── Projects & Tasks ─────────────────────────────────────────────────────────

public class Project : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Planning;
    public decimal Budget { get; set; }
    public decimal ActualCost { get; set; }
    public int Progress { get; set; } // 0-100
    public string? ManagerId { get; set; }
    public Guid? CustomerId { get; set; }
    public Customer? Customer { get; set; }

    public ICollection<ProjectTask> Tasks { get; set; } = [];
    public ICollection<ProjectMember> Members { get; set; } = [];
}

public class ProjectTask : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public ERP.Domain.Enums.TaskStatus Status { get; set; } = ERP.Domain.Enums.TaskStatus.Todo;
    public DateTime? DueDate { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int EstimatedHours { get; set; }
    public int ActualHours { get; set; }
    public Guid? ParentTaskId { get; set; }
    public ProjectTask? ParentTask { get; set; }

    public ICollection<TaskAssignment> Assignments { get; set; } = [];
    public ICollection<ProjectTask> SubTasks { get; set; } = [];
}

public class TaskAssignment : BaseEntity
{
    public Guid TaskId { get; set; }
    public ProjectTask Task { get; set; } = null!;
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}

public class ProjectMember : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public Guid EmployeeId { get; set; }
    public Employee Employee { get; set; } = null!;
    public string Role { get; set; } = "Member";
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
