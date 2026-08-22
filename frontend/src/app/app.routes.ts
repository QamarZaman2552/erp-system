import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./modules/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: 'employees',
    canActivate: [authGuard],
    data: { roles: ['Admin', 'HR'] },
    loadComponent: () => import('./modules/employees/employees.component').then(m => m.EmployeesComponent)
  },
  {
    path: 'attendance',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/attendance/attendance.component').then(m => m.AttendanceComponent)
  },
  {
    path: 'leaves',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/leaves/leaves.component').then(m => m.LeavesComponent)
  },
  {
    path: 'payroll',
    canActivate: [authGuard],
    data: { roles: ['Admin', 'HR'] },
    loadComponent: () => import('./modules/payroll/payroll.component').then(m => m.PayrollComponent)
  },
  {
    path: 'crm',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/crm/crm.component').then(m => m.CrmComponent)
  },
  {
    path: 'projects',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/projects/projects.component').then(m => m.ProjectsComponent)
  },
  {
    path: 'team',
    canActivate: [authGuard],
    data: { roles: ['Admin', 'HR', 'Manager'] },
    loadComponent: () => import('./modules/team/team.component').then(m => m.TeamComponent)
  },
  {
    path: 'inventory',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/inventory/inventory.component').then(m => m.InventoryComponent)
  },
  {
    path: 'sales',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/sales/sales.component').then(m => m.SalesComponent)
  },
  {
    path: 'finance',
    canActivate: [authGuard],
    data: { roles: ['Admin', 'HR', 'Manager'] },
    loadComponent: () => import('./modules/finance/finance.component').then(m => m.FinanceComponent)
  },
  {
    path: 'users',
    canActivate: [authGuard],
    data: { roles: ['Admin'] },
    loadComponent: () => import('./modules/users/users.component').then(m => m.UsersComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
