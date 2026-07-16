export interface Team {
  id: number;
  name: string;
  club: string | null;
  logo: string | null;
  category: string;
  contact: string | null;
  tournamentId: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamRequest {
  name: string;
  club?: string;
  logo?: string;
  category: string;
  contact?: string;
  tournamentId: number;
}
