import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  PagedResult,
  Employee,
  LinkableUser,
  MyProfile,
  UserAccount,
  Department,
  Designation,
  AttendanceRecord,
  LeaveRequest,
  PayrollRecord,
  Customer,
  Lead,
  Project,
  ProjectTask,
  TeamMember,
  Product,
  Supplier,
  SalesOrder,
  PurchaseOrder,
  OrderPayment,
  FinanceTransaction,
  Expense,
  Budget,
  DashboardStats,
  MonthlyRevenue,
  TopProduct,
  RecentActivity
} from '../models/erp.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard/stats`);
  }

  getRevenueChart(year?: number): Observable<MonthlyRevenue[]> {
    const params = year ? new HttpParams().set('year', year.toString()) : undefined;
    return this.http.get<MonthlyRevenue[]>(`${this.baseUrl}/dashboard/revenue-chart`, { params });
  }

  getTopProducts(): Observable<TopProduct[]> {
    return this.http.get<TopProduct[]>(`${this.baseUrl}/dashboard/top-products`);
  }

  getRecentActivities(): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.baseUrl}/dashboard/recent-activities`);
  }

  // ─── Employees ─────────────────────────────────────────────────────────────
  getEmployees(page = 1, pageSize = 10, search = '', departmentId?: string, status?: number | null): Observable<PagedResult<Employee>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('searchTerm', search);
    if (departmentId) params = params.set('departmentId', departmentId);
    if (status !== undefined && status !== null) params = params.set('status', status.toString());
    return this.http.get<PagedResult<Employee>>(`${this.baseUrl}/employees`, { params });
  }

  getEmployee(id: string): Observable<ApiResponse<Employee>> {
    return this.http.get<ApiResponse<Employee>>(`${this.baseUrl}/employees/${id}`);
  }

  getLinkableUsers(): Observable<LinkableUser[]> {
    return this.http.get<LinkableUser[]>(`${this.baseUrl}/employees/linkable-users`);
  }

  getMyProfile(): Observable<ApiResponse<MyProfile>> {
    return this.http.get<ApiResponse<MyProfile>>(`${this.baseUrl}/employees/me`);
  }

  updateMyProfile(data: { phone?: string; city?: string; country?: string }): Observable<ApiResponse<MyProfile>> {
    return this.http.put<ApiResponse<MyProfile>>(`${this.baseUrl}/employees/me`, data);
  }

  changePassword(data: { currentPassword: string; newPassword: string }): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/auth/change-password`, data);
  }

  forgotPassword(email: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/auth/forgot-password`, { email });
  }

  getMyPayrolls(): Observable<PagedResult<PayrollRecord>> {
    return this.http.get<PagedResult<PayrollRecord>>(`${this.baseUrl}/payroll/me`);
  }

  getMyAttendanceHistory(employeeId: string, month: number, year: number): Observable<PagedResult<AttendanceRecord>> {
    const params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString())
      .set('page', '1')
      .set('pageSize', '31');
    return this.http.get<PagedResult<AttendanceRecord>>(`${this.baseUrl}/attendance/employee/${employeeId}`, { params });
  }

  // ─── Users (Admin) ──────────────────────────────────────────────────────────
  getUsers(page = 1, pageSize = 10, search = ''): Observable<PagedResult<UserAccount>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('searchTerm', search);
    return this.http.get<PagedResult<UserAccount>>(`${this.baseUrl}/users`, { params });
  }

  createUser(data: { firstName: string; lastName: string; email: string; password: string; role: string }): Observable<ApiResponse<UserAccount>> {
    return this.http.post<ApiResponse<UserAccount>>(`${this.baseUrl}/users`, data);
  }

  changeUserRole(userId: string, role: string): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.baseUrl}/users/${userId}/role`, { role });
  }

  setUserStatus(userId: string, isActive: boolean): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.baseUrl}/users/${userId}/status`, { isActive });
  }

  adminResetPassword(userId: string, newPassword: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/users/${userId}/reset-password`, { newPassword });
  }

  createEmployee(data: any): Observable<ApiResponse<Employee>> {
    return this.http.post<ApiResponse<Employee>>(`${this.baseUrl}/employees`, data);
  }

  updateEmployee(id: string, data: any): Observable<ApiResponse<Employee>> {
    return this.http.put<ApiResponse<Employee>>(`${this.baseUrl}/employees/${id}`, data);
  }

  deleteEmployee(id: string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/employees/${id}`);
  }

  // ─── Departments & Designations ────────────────────────────────────────────
  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.baseUrl}/departments`);
  }

  createDepartment(data: any): Observable<ApiResponse<Department>> {
    return this.http.post<ApiResponse<Department>>(`${this.baseUrl}/departments`, data);
  }

  getDesignations(): Observable<Designation[]> {
    return this.http.get<Designation[]>(`${this.baseUrl}/designations`);
  }

  getDesignationsByDepartment(departmentId: string): Observable<Designation[]> {
    return this.http.get<Designation[]>(`${this.baseUrl}/designations/by-department/${departmentId}`);
  }

  createDesignation(data: any): Observable<ApiResponse<Designation>> {
    return this.http.post<ApiResponse<Designation>>(`${this.baseUrl}/designations`, data);
  }

  // ─── Attendance ────────────────────────────────────────────────────────────
  getTodayAttendance(page = 1, pageSize = 10): Observable<PagedResult<AttendanceRecord>> {
    const params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    return this.http.get<PagedResult<AttendanceRecord>>(`${this.baseUrl}/attendance/today`, { params });
  }

  checkIn(employeeId: string, remarks?: string, date?: string): Observable<ApiResponse<AttendanceRecord>> {
    return this.http.post<ApiResponse<AttendanceRecord>>(`${this.baseUrl}/attendance/check-in`, { employeeId, remarks, date });
  }

  checkOut(employeeId: string, remarks?: string, date?: string): Observable<ApiResponse<AttendanceRecord>> {
    return this.http.post<ApiResponse<AttendanceRecord>>(`${this.baseUrl}/attendance/check-out`, { employeeId, remarks, date });
  }

  markManualAttendance(data: { employeeId: string; date: string; checkIn: string; checkOut?: string; remarks?: string }): Observable<ApiResponse<AttendanceRecord>> {
    return this.http.post<ApiResponse<AttendanceRecord>>(`${this.baseUrl}/attendance/manual`, data);
  }

  checkInMe(remarks?: string): Observable<ApiResponse<AttendanceRecord>> {
    return this.http.post<ApiResponse<AttendanceRecord>>(`${this.baseUrl}/attendance/me/check-in`, { remarks });
  }

  checkOutMe(remarks?: string): Observable<ApiResponse<AttendanceRecord>> {
    return this.http.post<ApiResponse<AttendanceRecord>>(`${this.baseUrl}/attendance/me/check-out`, { remarks });
  }

  getMonthlyAttendanceReport(month: number, year: number): Observable<any[]> {
    const params = new HttpParams().set('month', month).set('year', year);
    return this.http.get<any[]>(`${this.baseUrl}/attendance/monthly-report`, { params });
  }

  getLateArrivals(month: number, year: number): Observable<AttendanceRecord[]> {
    const params = new HttpParams().set('month', month).set('year', year);
    return this.http.get<AttendanceRecord[]>(`${this.baseUrl}/attendance/late-arrivals`, { params });
  }

  getAbsentees(date?: string): Observable<any[]> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.get<any[]>(`${this.baseUrl}/attendance/absentees`, { params });
  }

  // ─── Leaves ────────────────────────────────────────────────────────────────
  getLeaves(page = 1, pageSize = 10): Observable<PagedResult<LeaveRequest>> {
    const params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    return this.http.get<PagedResult<LeaveRequest>>(`${this.baseUrl}/leaves`, { params });
  }

  createLeave(data: any): Observable<ApiResponse<LeaveRequest>> {
    return this.http.post<ApiResponse<LeaveRequest>>(`${this.baseUrl}/leaves`, data);
  }

  approveLeave(id: string, isApproved: boolean, rejectionReason?: string): Observable<ApiResponse<LeaveRequest>> {
    return this.http.post<ApiResponse<LeaveRequest>>(`${this.baseUrl}/leaves/${id}/approve`, { isApproved, rejectionReason });
  }

  // ─── Payroll ───────────────────────────────────────────────────────────────
  getPayroll(month: number, year: number, page = 1, pageSize = 10): Observable<PagedResult<PayrollRecord>> {
    const params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString())
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PagedResult<PayrollRecord>>(`${this.baseUrl}/payroll`, { params });
  }

  generatePayroll(month: number, year: number, employeeIds?: string[]): Observable<ApiResponse<PayrollRecord[]>> {
    return this.http.post<ApiResponse<PayrollRecord[]>>(`${this.baseUrl}/payroll/generate`, { month, year, employeeIds });
  }

  markPayrollPaid(id: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/payroll/${id}/pay`, {});
  }

  // ─── CRM ───────────────────────────────────────────────────────────────────
  getCustomers(page = 1, pageSize = 10, search = ''): Observable<PagedResult<Customer>> {
    const params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString()).set('searchTerm', search);
    return this.http.get<PagedResult<Customer>>(`${this.baseUrl}/customers`, { params });
  }

  createCustomer(data: any): Observable<ApiResponse<Customer>> {
    return this.http.post<ApiResponse<Customer>>(`${this.baseUrl}/customers`, data);
  }

  updateCustomer(id: string, data: any): Observable<ApiResponse<Customer>> {
    return this.http.put<ApiResponse<Customer>>(`${this.baseUrl}/customers/${id}`, data);
  }

  deleteCustomer(id: string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/customers/${id}`);
  }

  updateLead(id: string, data: any): Observable<ApiResponse<Lead>> {
    return this.http.put<ApiResponse<Lead>>(`${this.baseUrl}/leads/${id}`, data);
  }

  deleteLead(id: string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/leads/${id}`);
  }

  getInteractions(customerId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/interactions/customer/${customerId}`);
  }

  getDueFollowUps(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/interactions/follow-ups`);
  }

  logInteraction(data: { customerId: string; type: string; subject: string; notes?: string; followUpDate?: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/interactions`, data);
  }

  getLeads(page = 1, pageSize = 10): Observable<PagedResult<Lead>> {
    const params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    return this.http.get<PagedResult<Lead>>(`${this.baseUrl}/leads`, { params });
  }

  createLead(data: any): Observable<ApiResponse<Lead>> {
    return this.http.post<ApiResponse<Lead>>(`${this.baseUrl}/leads`, data);
  }

  // ─── Projects & Tasks ──────────────────────────────────────────────────────
  getProjects(page = 1, pageSize = 10): Observable<PagedResult<Project>> {
    const params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    return this.http.get<PagedResult<Project>>(`${this.baseUrl}/projects`, { params });
  }

  createProject(data: any): Observable<ApiResponse<Project>> {
    return this.http.post<ApiResponse<Project>>(`${this.baseUrl}/projects`, data);
  }

  updateProject(id: string, data: any): Observable<ApiResponse<Project>> {
    return this.http.put<ApiResponse<Project>>(`${this.baseUrl}/projects/${id}`, data);
  }

  getMyTeam(): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(`${this.baseUrl}/employees/my-team`);
  }

  getOverdueTasks(): Observable<ProjectTask[]> {
    return this.http.get<ProjectTask[]>(`${this.baseUrl}/tasks/overdue`);
  }

  getTasksByProject(projectId: string): Observable<PagedResult<ProjectTask>> {
    return this.http.get<PagedResult<ProjectTask>>(`${this.baseUrl}/tasks/project/${projectId}`);
  }

  getMyTasks(): Observable<PagedResult<ProjectTask>> {
    return this.http.get<PagedResult<ProjectTask>>(`${this.baseUrl}/tasks/my-tasks`);
  }

  createTask(data: any): Observable<ApiResponse<ProjectTask>> {
    return this.http.post<ApiResponse<ProjectTask>>(`${this.baseUrl}/tasks`, data);
  }

  updateTask(id: string, data: any): Observable<ApiResponse<ProjectTask>> {
    return this.http.put<ApiResponse<ProjectTask>>(`${this.baseUrl}/tasks/${id}`, data);
  }

  deleteTask(id: string): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.baseUrl}/tasks/${id}`);
  }

  // ─── Inventory ─────────────────────────────────────────────────────────────
  getProducts(page = 1, pageSize = 10, search = ''): Observable<PagedResult<Product>> {
    const params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString()).set('searchTerm', search);
    return this.http.get<PagedResult<Product>>(`${this.baseUrl}/products`, { params });
  }

  createProduct(data: any): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.baseUrl}/products`, data);
  }

  adjustStock(data: { productId: string; quantity: number; type: string; notes?: string }): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/products/adjust-stock`, data);
  }

  getProductMovements(productId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/products/${productId}/movements`);
  }

  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.baseUrl}/suppliers`);
  }

  createSupplier(data: any): Observable<ApiResponse<Supplier>> {
    return this.http.post<ApiResponse<Supplier>>(`${this.baseUrl}/suppliers`, data);
  }

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/categories`);
  }

  // ─── Sales & Purchase ──────────────────────────────────────────────────────
  getSalesOrders(page = 1, pageSize = 10): Observable<PagedResult<SalesOrder>> {
    const params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    return this.http.get<PagedResult<SalesOrder>>(`${this.baseUrl}/salesorders`, { params });
  }

  createSalesOrder(data: any): Observable<ApiResponse<SalesOrder>> {
    return this.http.post<ApiResponse<SalesOrder>>(`${this.baseUrl}/salesorders`, data);
  }

  confirmSalesOrder(id: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/salesorders/${id}/confirm`, {});
  }

  cancelSalesOrder(id: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/salesorders/${id}/cancel`, {});
  }

  returnSalesOrder(id: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/salesorders/${id}/return`, {});
  }

  recordSalesPayment(id: string, data: { amount: number; method: string; reference?: string; notes?: string }): Observable<ApiResponse<OrderPayment>> {
    return this.http.post<ApiResponse<OrderPayment>>(`${this.baseUrl}/salesorders/${id}/payments`, data);
  }

  getSalesPayments(id: string): Observable<OrderPayment[]> {
    return this.http.get<OrderPayment[]>(`${this.baseUrl}/salesorders/${id}/payments`);
  }

  emailSalesInvoice(id: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/salesorders/${id}/email-invoice`, {});
  }

  sendOverdueReminders(): Observable<any> {
    return this.http.post(`${this.baseUrl}/salesorders/overdue-reminders`, {});
  }

  salesMonthlyReport(year: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/salesorders/reports/monthly?year=${year}`);
  }

  salesCustomerReport(from?: string, to?: string): Observable<any[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any[]>(`${this.baseUrl}/salesorders/reports/by-customer`, { params });
  }

  salesProductReport(from?: string, to?: string): Observable<any[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any[]>(`${this.baseUrl}/salesorders/reports/by-product`, { params });
  }

  invoicePdfUrl(id: string): string {
    return `${this.baseUrl}/salesorders/${id}/invoice-pdf`;
  }

  getPurchaseOrders(page = 1, pageSize = 10): Observable<PagedResult<PurchaseOrder>> {
    const params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    return this.http.get<PagedResult<PurchaseOrder>>(`${this.baseUrl}/purchaseorders`, { params });
  }

  createPurchaseOrder(data: any): Observable<ApiResponse<PurchaseOrder>> {
    return this.http.post<ApiResponse<PurchaseOrder>>(`${this.baseUrl}/purchaseorders`, data);
  }

  purchaseOrderDetail(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/purchaseorders/${id}/detail`);
  }

  confirmPurchaseOrder(id: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/purchaseorders/${id}/confirm`, {});
  }

  cancelPurchaseOrder(id: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/purchaseorders/${id}/cancel`, {});
  }

  receivePurchaseItems(id: string, items: { productId: string; quantity: number }[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/purchaseorders/${id}/receive`, items);
  }

  setSupplierInvoiceNumber(id: string, invoiceNumber: string): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.baseUrl}/purchaseorders/${id}/supplier-invoice`, { invoiceNumber });
  }

  emailPurchaseOrderToSupplier(id: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.baseUrl}/purchaseorders/${id}/email-to-supplier`, {});
  }

  recordPurchasePayment(id: string, data: { amount: number; method: string; reference?: string; notes?: string }): Observable<ApiResponse<OrderPayment>> {
    return this.http.post<ApiResponse<OrderPayment>>(`${this.baseUrl}/purchaseorders/${id}/payments`, data);
  }

  getPurchasePayments(id: string): Observable<OrderPayment[]> {
    return this.http.get<OrderPayment[]>(`${this.baseUrl}/purchaseorders/${id}/payments`);
  }

  purchaseMonthlyReport(year: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/purchaseorders/reports/monthly?year=${year}`);
  }

  purchaseSupplierReport(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/purchaseorders/reports/by-supplier`);
  }

  // ─── Finance ───────────────────────────────────────────────────────────────
  getTransactions(page = 1, pageSize = 10, from?: string, to?: string, type?: string): Observable<PagedResult<FinanceTransaction>> {
    let params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    if (type) params = params.set('type', type);
    return this.http.get<PagedResult<FinanceTransaction>>(`${this.baseUrl}/finance/transactions`, { params });
  }

  getFinanceSummary(from?: string, to?: string): Observable<any> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get(`${this.baseUrl}/finance/summary`, { params });
  }

  deptExpenseReport(from?: string, to?: string): Observable<any[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any[]>(`${this.baseUrl}/finance/reports/by-department`, { params });
  }

  categoryExpenseReport(from?: string, to?: string): Observable<any[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get<any[]>(`${this.baseUrl}/finance/reports/by-category`, { params });
  }

  budgetAlerts(month: number, year: number): Observable<any[]> {
    const params = new HttpParams().set('month', month.toString()).set('year', year.toString());
    return this.http.get<any[]>(`${this.baseUrl}/finance/budgets/alerts`, { params });
  }

  financeReportPdfUrl(year: number, quarter?: number, month?: number): string {
    let url = `${this.baseUrl}/finance/reports/export-pdf?year=${year}`;
    if (quarter) url += `&quarter=${quarter}`;
    if (month) url += `&month=${month}`;
    return url;
  }

  transactionsCsvUrl(from?: string, to?: string): string {
    let url = `${this.baseUrl}/finance/transactions/export-csv`;
    const qs: string[] = [];
    if (from) qs.push(`from=${from}`);
    if (to) qs.push(`to=${to}`);
    if (qs.length) url += '?' + qs.join('&');
    return url;
  }

  getExpenses(page = 1, pageSize = 10): Observable<PagedResult<Expense>> {
    const params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    return this.http.get<PagedResult<Expense>>(`${this.baseUrl}/finance/expenses`, { params });
  }

  createExpense(data: any): Observable<ApiResponse<Expense>> {
    return this.http.post<ApiResponse<Expense>>(`${this.baseUrl}/finance/expenses`, data);
  }

  approveExpense(id: string, isApproved: boolean, rejectionReason?: string): Observable<ApiResponse<Expense>> {
    return this.http.post<ApiResponse<Expense>>(`${this.baseUrl}/finance/expenses/${id}/approve`, { isApproved, rejectionReason });
  }

  getBudgets(month: number, year: number): Observable<Budget[]> {
    const params = new HttpParams().set('month', month.toString()).set('year', year.toString());
    return this.http.get<Budget[]>(`${this.baseUrl}/finance/budgets`, { params });
  }
}
