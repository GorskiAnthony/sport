// Aligné sur frontend/src/app/core/models/team.model.ts — la gestion d'équipe (créer/éditer/
// supprimer) est portée sur mobile, voir le plan de portage.
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
