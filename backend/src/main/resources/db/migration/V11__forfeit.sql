ALTER TABLE matches ADD COLUMN forfeited_team_id BIGINT REFERENCES teams(id);
