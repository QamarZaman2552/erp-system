import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, finalize, share } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, UserInfo, ApiResponse } from '../models/erp.models';

const storage: Storage | undefined = typeof localStorage !== 'undefined' ? localStorage : undefined;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = `${environment.apiUrl}/auth`;
  private currentUserSignal = signal<UserInfo | null>(this.getStoredUser());
  private tokenSignal = signal<string | null>(this.getStoredToken());

  currentUser = computed(() => this.currentUserSignal());
  token = computed(() => this.tokenSignal());
  isAuthenticated = computed(() => !!this.tokenSignal());
  userRole = computed(() => this.currentUserSignal()?.role || null);

  // Refresh tokens are single-use (rotated server-side). Concurrent 401s
  // must share one in-flight refresh or the consumed token fails -> logout.
  private refreshInFlight$: Observable<ApiResponse<AuthResponse> | null> | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { email: string; password: string }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  refreshToken(): Observable<ApiResponse<AuthResponse> | null> {
    if (this.refreshInFlight$) return this.refreshInFlight$;
    const refreshToken = storage?.getItem('erp_refresh_token');
    if (!refreshToken) return of(null);

    this.refreshInFlight$ = this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/refresh-token`, { refreshToken }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      }),
      catchError(() => {
        this.logout();
        return of(null);
      }),
      finalize(() => {
        this.refreshInFlight$ = null;
      }),
      share()
    );
    return this.refreshInFlight$;
  }

  logout(): void {
    const token = this.tokenSignal();
    if (token) {
      this.http.post(`${this.baseUrl}/logout`, {}).subscribe({ error: () => {} });
    }
    storage?.removeItem('erp_access_token');
    storage?.removeItem('erp_refresh_token');
    storage?.removeItem('erp_user');
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  hasRole(allowedRoles: string[]): boolean {
    const role = this.userRole();
    if (!role) return false;
    return allowedRoles.includes(role);
  }

  private setSession(authResult: AuthResponse): void {
    storage?.setItem('erp_access_token', authResult.accessToken);
    storage?.setItem('erp_refresh_token', authResult.refreshToken);
    storage?.setItem('erp_user', JSON.stringify(authResult.user));
    this.tokenSignal.set(authResult.accessToken);
    this.currentUserSignal.set(authResult.user);
  }

  private getStoredToken(): string | null {
    return storage?.getItem('erp_access_token') ?? null;
  }

  private getStoredUser(): UserInfo | null {
    const userJson = storage?.getItem('erp_user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson) as UserInfo;
    } catch {
      return null;
    }
  }
}
