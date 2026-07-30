// Sous-ensemble de frontend/src/app/core/models/tournament.model.ts — seuls les champs utilisés
// par la liste des tournois de l'organisateur (écran d'accueil mobile).
export type TournamentStatus = 'UPCOMING' | 'ONGOING' | 'FINISHED';

export interface TournamentSummary {
  id: number;
  name: string;
  sport: string;
  category: string;
  location: string | null;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  maxTeams: number;
  teamsCount: number;
}

/** token n'est renvoyé qu'à l'organisateur du tournoi — voir TournamentController côté
 *  backend, GET/POST .../referee-token(/regenerate). */
export interface RefereeJoinInfo {
  token: string;
  joinUrl: string;
}
