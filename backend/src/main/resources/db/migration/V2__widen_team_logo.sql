-- The logo field stores an uploaded image as a base64 data URI, which is far longer
-- than the original 255-character limit and was causing save failures.
ALTER TABLE teams ALTER COLUMN logo TYPE TEXT;
