import { map, Observable, take, tap } from 'rxjs';
import { AuthService } from './../../services/auth/auth.service';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateFn,
  GuardResult,
  MaybeAsync,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.checkAuthState().pipe(
    tap((isAuthenticated) => {
      if (!isAuthenticated) {
        router.navigate(['/']);
      }
    })
  );
};
