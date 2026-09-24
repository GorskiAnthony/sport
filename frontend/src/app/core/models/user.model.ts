export type Role = 'ORGANIZER' | 'SPECTATOR' | 'ADMIN';
export type Plan = 'FREE' | 'CLASSIC' | 'PRO';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  plan: Plan;
  avatarUrl: string | null;
  bannerUrl: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}
