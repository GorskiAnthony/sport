CREATE TABLE team_follows (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    team_id        BIGINT       NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (user_id, team_id)
);

CREATE TABLE notifications (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tournament_id  BIGINT       NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    match_id       BIGINT       REFERENCES matches(id) ON DELETE CASCADE,
    type           VARCHAR(30)  NOT NULL,
    message        TEXT         NOT NULL,
    read           BOOLEAN      NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_follows_user_id ON team_follows(user_id);
CREATE INDEX idx_team_follows_team_id ON team_follows(team_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
