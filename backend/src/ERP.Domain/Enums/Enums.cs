namespace ERP.Domain.Enums;

public enum EmployeeStatus { Active, Inactive, Terminated, OnLeave }
public enum LeaveType { Annual, Sick, Maternity, Paternity, Unpaid, Emergency }
public enum LeaveStatus { Pending, Approved, Rejected, Cancelled }
public enum PayrollStatus { Pending, Processed, Paid, Failed }
public enum OrderStatus { Draft, Pending, Confirmed, Shipped, Delivered, Cancelled, Returned }
public enum PaymentStatus { Pending, Partial, Paid, Overdue, Refunded }
public enum ProjectStatus { Planning, Active, OnHold, Completed, Cancelled }
public enum TaskPriority { Low, Medium, High, Critical }
public enum TaskStatus { Todo, InProgress, Review, Done, Cancelled }
public enum LeadStatus { New, Contacted, Qualified, Proposal, Negotiation, Won, Lost }
public enum ExpenseStatus { Pending, Approved, Rejected, Reimbursed }
public enum NotificationType { Info, Success, Warning, Error, System }
public enum UserRole { Admin, HR, Manager, Employee }
public enum Gender { Male, Female, Other }
public enum TransactionType { Income, Expense }
public enum StockMovementType { In, Out, Adjustment, Return }
public enum PaymentMethod { Cash, BankTransfer, Card, Cheque }
