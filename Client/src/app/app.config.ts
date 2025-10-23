import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CookieInterceptor } from './services/auth/auth.cookie.interceptor';
import { AuthService } from './services/auth/auth.service';
import { tap } from 'rxjs';

export function initializeApp(authService: AuthService) {
  return () =>
    authService.checkAuthState().pipe(
      tap((isAuthenticated) => {
        console.log('App Initialized: User is authenticated?', isAuthenticated);
      })
    );
}
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    provideHttpClient(
      withInterceptorsFromDi() // 👈 Essencial: Habilita o uso de interceptors baseados em classe
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService], // Dependência da nossa factory
      multi: true,
    },
    // 2. Registra o Interceptor na lista de provedores (providers)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CookieInterceptor,
      multi: true,
    },
    provideToastr({
      timeOut: 2500,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      closeButton: true,
      progressBar: true,
      maxOpened: 3,
      autoDismiss: true,
      newestOnTop: true,
      iconClasses: {
        error: 'toast-error-no-icon',
        info: 'toast-info-no-icon',
        success: 'toast-success-no-icon',
        warning: 'toast-warning-no-icon',
      },
      toastClass: 'ngx-toastr no-icon',
    }),
    provideAnimationsAsync(),
  ],
};
