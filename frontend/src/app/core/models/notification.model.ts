export type NotificationType = 'MATCH_STARTED' | 'MATCH_FINISHED';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  read: boolean;
  tournamentId: number;
  matchId: number | null;
  createdAt: string;
}
