import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
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
  ],
};
