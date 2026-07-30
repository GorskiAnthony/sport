ALTER TABLE tournaments ADD COLUMN referee_join_token VARCHAR(64) UNIQUE;

-- Backfill existing rows natively (no pgcrypto extension needed) — this value only needs to
-- resist casual guessing, not be cryptographically pristine; tokens minted after this migration
-- go through TournamentService's SecureRandom-based generator instead.
UPDATE tournaments SET referee_join_token = md5(random()::text || clock_timestamp()::text || id::text);

ALTER TABLE tournaments ALTER COLUMN referee_join_token SET NOT NULL;
