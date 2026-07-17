CREATE TABLE tournament_views (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tournament_id    BIGINT       NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    first_viewed_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_viewed_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (user_id, tournament_id)
);

CREATE INDEX idx_tournament_views_user_id ON tournament_views(user_id);
CREATE INDEX idx_tournament_views_tournament_id ON tournament_views(tournament_id);
