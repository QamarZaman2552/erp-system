import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, mergeMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();
  const isAuthUrl = req.url.includes('/auth/login') || req.url.includes('/auth/refresh-token');

  let authReq = req;
  if (token && !isAuthUrl) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthUrl) {
        return authService.refreshToken().pipe(
          mergeMap(res => {
            if (res?.success && res.data) {
              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${res.data.accessToken}` }
              });
              return next(retryReq);
            }
            return throwError(() => error);
          }),
          catchError(() => throwError(() => error))
        );
      }
      return throwError(() => error);
    })
  );
};
