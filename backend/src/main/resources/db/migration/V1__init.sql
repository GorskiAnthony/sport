CREATE TABLE users (
    id             BIGSERIAL PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    name           VARCHAR(255) NOT NULL,
    role           VARCHAR(20)  NOT NULL DEFAULT 'ORGANIZER',
    plan           VARCHAR(20)  NOT NULL DEFAULT 'FREE',
    stripe_id      VARCHAR(255) UNIQUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
    id                        BIGSERIAL PRIMARY KEY,
    user_id                   BIGINT       NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id    VARCHAR(255) NOT NULL UNIQUE,
    stripe_price_id           VARCHAR(255) NOT NULL,
    status                    VARCHAR(50)  NOT NULL,
    current_period_end        TIMESTAMPTZ  NOT NULL,
    created_at                TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE tournaments (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    sport          VARCHAR(100) NOT NULL,
    category       VARCHAR(100) NOT NULL,
    location       VARCHAR(255) NOT NULL,
    start_date     DATE         NOT NULL,
    end_date       DATE         NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'UPCOMING',
    max_teams      INTEGER      NOT NULL DEFAULT 14,
    description    TEXT,
    format         VARCHAR(100),
    icon           VARCHAR(255),
    split_enabled  BOOLEAN      NOT NULL DEFAULT false,
    organizer_id   BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE teams (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    club           VARCHAR(255),
    logo           VARCHAR(255),
    category       VARCHAR(100) NOT NULL,
    contact        VARCHAR(255),
    tournament_id  BIGINT       NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE matches (
    id             BIGSERIAL PRIMARY KEY,
    tournament_id  BIGINT       NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    home_team_id   BIGINT       NOT NULL REFERENCES teams(id),
    away_team_id   BIGINT       NOT NULL REFERENCES teams(id),
    home_score     INTEGER,
    away_score     INTEGER,
    phase          VARCHAR(100) NOT NULL,
    date           TIMESTAMPTZ  NOT NULL,
    venue          VARCHAR(255),
    status         VARCHAR(20)  NOT NULL DEFAULT 'SCHEDULED',
    events         JSONB        NOT NULL DEFAULT '[]',
    stats          JSONB        NOT NULL DEFAULT '{}',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_tournaments_organizer_id ON tournaments(organizer_id);
CREATE INDEX idx_teams_tournament_id ON teams(tournament_id);
CREATE INDEX idx_matches_tournament_id ON matches(tournament_id);
CREATE INDEX idx_matches_home_team_id ON matches(home_team_id);
CREATE INDEX idx_matches_away_team_id ON matches(away_team_id);
