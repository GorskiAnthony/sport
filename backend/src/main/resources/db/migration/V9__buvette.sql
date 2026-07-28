CREATE TABLE buvette_products (
    id             BIGSERIAL       PRIMARY KEY,
    tournament_id  BIGINT          NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name           VARCHAR(255)    NOT NULL,
    price          NUMERIC(10, 2)  NOT NULL,
    created_at     TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE TABLE buvette_sales (
    id             BIGSERIAL       PRIMARY KEY,
    tournament_id  BIGINT          NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    items          TEXT            NOT NULL,
    total          NUMERIC(10, 2)  NOT NULL,
    created_at     TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_buvette_products_tournament ON buvette_products(tournament_id);
CREATE INDEX idx_buvette_sales_tournament ON buvette_sales(tournament_id);
