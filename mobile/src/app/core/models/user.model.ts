// Miroir de frontend/src/app/core/models/user.model.ts — garder synchronisé avec l'API. Les
// arbitres n'ont plus de compte (voir core/auth/tournament-session.service.ts, accès par QR
// code de tournoi plutôt que par rôle utilisateur).
export type Role = 'ORGANIZER' | 'SPECTATOR' | 'ADMIN';
export type Plan = 'FREE' | 'CLASSIC' | 'PRO';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  plan: Plan;
}

export interface AuthResponse {
  token: string;
  user: User;
}
