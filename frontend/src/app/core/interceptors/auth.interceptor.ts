import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

// The JWT lives in an httpOnly cookie now (see AuthService) — nothing here reads it, but the
// browser only attaches cookies to a request if it's told to. In prod this is same-origin
// (nginx proxies /api/* on the same domain the page was loaded from) where withCredentials is a
// no-op; in dev the frontend and backend run on different ports, which makes it required.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  return next(req.clone({ withCredentials: true }));
};
