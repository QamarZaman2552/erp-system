export interface UserInfo {
  id: string;
  fullName: string;
  email: string;
  role: 'Admin' | 'HR' | 'Manager' | 'Employee';
  profileImageUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserInfo;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  departmentName: string;
  designationTitle: string;
  basicSalary: number;
  status: 'Active' | 'Inactive' | 'Terminated' | 'OnLeave';
  dateOfJoining: string;
  profileImageUrl?: string;
}

export interface LinkableUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isLinked: boolean;
}

export interface MyProfile {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone?: string;
  departmentName: string;
  designationTitle: string;
  status: string;
  dateOfJoining: string;
  profileImageUrl?: string;
  city?: string;
  country?: string;
}

export interface UserAccount {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  isLinkedToEmployee: boolean;
  lastLoginAt?: string;
  lockedOutUntil?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  employeeCount: number;
  isActive: boolean;
}

export interface Designation {
  id: string;
  title: string;
  departmentName: string;
  minSalary: number;
  maxSalary: number;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  attendanceDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  workingHours?: number;
  isPresent: boolean;
  isLateArrival: boolean;
  remarks?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'Annual' | 'Sick' | 'Maternity' | 'Paternity' | 'Unpaid' | 'Emergency';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  createdAt: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  basicSalary: number;
  grossSalary: number;
  netSalary: number;
  status: 'Pending' | 'Processed' | 'Paid' | 'Failed';
  paidAt?: string;
  houseAllowance?: number;
  transportAllowance?: number;
  medicalAllowance?: number;
  overtimePay?: number;
  overtimeHours?: number;
  taxDeduction?: number;
  providentFund?: number;
  absentDeduction?: number;
  workingDays?: number;
  presentDays?: number;
  leaveDays?: number;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  city?: string;
  country?: string;
  totalPurchaseValue: number;
  isActive: boolean;
}

export interface Lead {
  id: string;
  title: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  company?: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  estimatedValue: number;
  expectedCloseDate?: string;
  assignedToId?: string;
  source?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: 'Planning' | 'Active' | 'OnHold' | 'Completed' | 'Cancelled';
  budget: number;
  actualCost: number;
  progress: number;
  managerId?: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  projectName: string;
  status: 'Todo' | 'InProgress' | 'Review' | 'Done' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
  estimatedHours: number;
  actualHours: number;
  assigneeNames: string[];
}

export interface TeamMember {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  email: string;
  departmentName: string;
  designationTitle: string;
  activeTaskCount: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  categoryName: string;
  supplierName?: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  isActive: boolean;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  orderDate: string;
  status: 'Draft' | 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Pending' | 'Partial' | 'Paid' | 'Overdue';
  totalAmount: number;
  paidAmount: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierName: string;
  orderDate: string;
  status: 'Draft' | 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Pending' | 'Partial' | 'Paid';
  totalAmount: number;
}

export interface FinanceTransaction {
  id: string;
  categoryName: string;
  type: 'Income' | 'Expense';
  amount: number;
  transactionDate: string;
  description: string;
  reference?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  expenseDate: string;
  category: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Reimbursed';
  submittedBy?: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
  remaining: number;
  department: string;
  month: number;
  year: number;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalCustomers: number;
  activeProjects: number;
  pendingLeaves: number;
  pendingExpenses: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  lowStockProducts: number;
  pendingOrders: number;
  todayAttendance: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  expenses: number;
}

export interface TopProduct {
  name: string;
  soldQuantity: number;
  revenue: number;
}

export interface RecentActivity {
  description: string;
  userName: string;
  timestamp: string;
  type: string;
}
