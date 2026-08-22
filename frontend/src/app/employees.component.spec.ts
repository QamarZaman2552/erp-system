import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { NotificationService } from './core/services/notification.service';
import { EmployeesComponent } from './modules/employees/employees.component';

describe('EmployeesComponent (UI)', () => {
  let fixture: ComponentFixture<EmployeesComponent>;
  let component: EmployeesComponent;
  let httpMock: HttpTestingController;
  let notificationService: NotificationService;

  const departments = [
    { id: 'd1', name: 'Engineering', createdAt: '', updatedAt: '' },
    { id: 'd2', name: 'Sales', createdAt: '', updatedAt: '' }
  ];
  const designations = [
    { id: 'g1', departmentId: 'd1', title: 'Software Engineer', level: 0, createdAt: '', updatedAt: '' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeesComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeesComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    notificationService = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    fixture?.destroy();
    httpMock.verify();
  });

  function flushInitialRequests(): void {
    httpMock.match((r: any) => r.url.includes('/employees') && !r.url.includes('linkable-users'))
      .forEach((r) => r.flush({ items: [], page: 1, pageSize: 50, totalCount: 0 }));
    httpMock.match((r: any) => r.url.includes('/departments'))
      .forEach((r) => r.flush(departments));
    httpMock.match((r: any) => r.url.includes('/designations'))
      .forEach((r) => r.flush(designations));
    httpMock.match((r: any) => r.url.includes('linkable-users'))
      .forEach((r) => r.flush([
        { id: 'u1', email: 'new.user@company.com', fullName: 'New User', role: 'Employee', isLinked: false },
        { id: 'u2', email: 'linked.user@company.com', fullName: 'Linked User', role: 'Admin', isLinked: true }
      ]));
  }

  function bootstrap(): void {
    fixture.detectChanges();
    flushInitialRequests();
  }

  function openModal(): void {
    bootstrap();
    component.openCreateModal();
    fixture.detectChanges();
    flushInitialRequests();
  }

  it('renders the employees table', async () => {
    bootstrap();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.erp-table')).not.toBeNull();
  });

  it('opens the create modal using proper bootstrap markup (.modal-content wrapper)', () => {
    openModal();

    const modal = fixture.nativeElement.querySelector('.modal.d-block');
    expect(modal).not.toBeNull();
    const content = modal?.querySelector('.modal-content');
    expect(content).not.toBeNull();
    expect(content?.querySelector('input[name="fn"]') as HTMLInputElement | null).not.toBeNull();
  });

  it('renders all employee form fields with ngModel name attributes', () => {
    openModal();

    ['fn', 'ln', 'em', 'ph', 'dob', 'doj', 'gr', 'bs', 'ct', 'dept', 'desig'].forEach((name) => {
      const el = fixture.debugElement.query(By.css(`[name="${name}"]`));
      if (!el) throw new Error(`form field "${name}" is missing from the create-employee modal`);
      expect((el.nativeElement as HTMLInputElement).getAttribute('name')).toBe(name);
    });
  });

  it('submits a new employee and closes the modal on success', () => {
    openModal();
    const notifySpy = vi.spyOn(notificationService, 'addNotification');

    component.newEmp.firstName = 'Sara';
    component.newEmp.lastName = 'Khan';
    component.newEmp.email = 'sara.khan@company.com';
    component.saveEmployee();

    const postReq = httpMock.expectOne((r: any) => r.url.endsWith('/employees') && r.method === 'POST');
    expect(postReq.request.body.email).toBe('sara.khan@company.com');
    postReq.flush({ success: true, message: 'Employee created successfully!', data: null });

    httpMock.match((r: any) => r.url.includes('/employees') && r.method === 'GET')
      .forEach((r) => r.flush({ items: [], page: 1, pageSize: 50, totalCount: 0 }));

    expect(component.showModal()).toBe(false);
    expect(notifySpy).toHaveBeenCalled();
  });

  it('keeps modal open on validation error and shows an error toast', () => {
    openModal();
    const notifySpy = vi.spyOn(notificationService, 'addNotification');

    component.newEmp.firstName = 'Sara';
    component.newEmp.lastName = 'Khan';
    component.newEmp.email = 'not-an-email';
    component.saveEmployee();

    const postReq = httpMock.expectOne((r: any) => r.url.endsWith('/employees') && r.method === 'POST');
    postReq.flush(
      { success: false, message: 'Validation failed', errors: { email: ['Email is not valid'] } },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(component.showModal()).toBe(true);
    expect(notifySpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', message: expect.stringContaining('email') })
    );
  });
});
