ALTER TABLE tournaments ADD COLUMN terrains TEXT;
ALTER TABLE tournaments ADD COLUMN sponsor_name VARCHAR(255);
ALTER TABLE tournaments ADD COLUMN sponsor_logo_url TEXT;
ALTER TABLE tournaments ADD COLUMN sponsor_click_url TEXT;
ALTER TABLE tournaments ADD COLUMN sponsor_clicks INTEGER NOT NULL DEFAULT 0;
