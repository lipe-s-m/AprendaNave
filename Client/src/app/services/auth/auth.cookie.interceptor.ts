import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // Ajuste o caminho se necessário

@Injectable()
export class CookieInterceptor implements HttpInterceptor {
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Apenas modifica requisições para a sua própria API
    if (request.url.startsWith(environment.apiUrlDev)) {
      request = request.clone({
        // Adiciona a flag withCredentials a TODAS as requisições da API
        // Isso permite que o navegador anexe e receba cookies
        withCredentials: true,
      });
    }
    return next.handle(request);
  }
}
