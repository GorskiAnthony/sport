import { Role } from '../../core/models/user.model';

export function defaultRouteForRole(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'ORGANIZER':
      return '/dashboard';
    default:
      return '/home';
  }
}
