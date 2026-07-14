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
