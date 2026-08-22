import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error) => {
      if (req.url.includes('/auth/logout')) {
        return throwError(() => error);
      }
      if (error instanceof Object && 'status' in error) {
        toast.showHttpError(error);
      }
      return throwError(() => error);
    })
  );
};
