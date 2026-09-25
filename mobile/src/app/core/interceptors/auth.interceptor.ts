import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { TournamentSessionService } from '../auth/tournament-session.service';

// Ne joindre le Bearer token qu'aux appels vers notre propre API — sans ce garde-fou, le token
// (JWT organisateur ou session arbitre) partirait vers n'importe quel host appelé via
// HttpClient. Rien n'appelle un autre host aujourd'hui, mais un futur appel externe (SDK tiers,
// image distante chargée via HttpClient...) ne doit jamais recevoir ce header par accident.
//
// Sur le build web, AuthService/TournamentSessionService.getToken() renvoient toujours null (le
// JWT vit dans un cookie httpOnly, voir leur doc de classe) — on ne pose donc jamais le header
// Authorization là-bas, et withCredentials fait suivre le cookie automatiquement à la place. En
// natif, getToken() renvoie le vrai token comme avant ; withCredentials y est un no-op inoffensif
// (pas de cookie à faire suivre).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const token = inject(AuthService).getToken() ?? inject(TournamentSessionService).getToken();
  const withCredentials = req.clone({ withCredentials: true });

  if (!token) {
    return next(withCredentials);
  }

  return next(withCredentials.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
