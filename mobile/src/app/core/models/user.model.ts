// Basé sur frontend/src/app/core/models/user.model.ts, avec REFEREE en plus (backend
// domain/Role.java) — le web n'a pas encore d'écran arbitre, garder les deux en tête si le rôle
// évolue côté API.
export type Role = 'ORGANIZER' | 'SPECTATOR' | 'REFEREE' | 'ADMIN';
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
