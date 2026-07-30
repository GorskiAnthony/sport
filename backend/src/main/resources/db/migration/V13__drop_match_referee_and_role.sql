-- The referee-assignment feature (V12) is replaced by a QR-code tournament-join flow that
-- doesn't use a users row at all — see MatchActor/TournamentSessionActor. Backfill any
-- role='REFEREE' user before the enum value disappears from the application, otherwise their
-- next login (and anything else loading their User row) breaks on Role.valueOf("REFEREE").
UPDATE users SET role = 'SPECTATOR' WHERE role = 'REFEREE';

ALTER TABLE matches DROP COLUMN referee_id;
