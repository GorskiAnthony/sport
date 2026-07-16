export type NotificationType = 'MATCH_STARTED' | 'MATCH_FINISHED' | 'GOAL_SCORED';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  read: boolean;
  tournamentId: number;
  matchId: number | null;
  createdAt: string;
}
