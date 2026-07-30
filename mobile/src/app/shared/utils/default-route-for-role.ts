import { Role } from '../../core/models/user.model';

// Miroir de frontend/src/app/shared/utils/default-route-for-role.ts, adapté aux écrans
// disponibles côté mobile (organisateur et arbitre pour l'instant).
export function defaultRouteForRole(role: Role): string {
  switch (role) {
    case 'REFEREE':
      return '/referee/matches';
    case 'ORGANIZER':
    default:
      return '/tournaments';
  }
}
