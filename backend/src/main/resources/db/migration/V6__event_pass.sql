CREATE TABLE event_pass_purchases (
    id                          BIGSERIAL PRIMARY KEY,
    user_id                     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_checkout_session_id  VARCHAR(255) NOT NULL UNIQUE,
    status                      VARCHAR(20)  NOT NULL,
    tournament_id               BIGINT       REFERENCES tournaments(id) ON DELETE SET NULL,
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    used_at                     TIMESTAMPTZ
);

CREATE INDEX idx_event_pass_purchases_user_id ON event_pass_purchases(user_id);

ALTER TABLE tournaments ADD COLUMN event_pass_expires_at TIMESTAMPTZ;
