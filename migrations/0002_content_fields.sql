-- Optional manual migration. The deployed API also creates these columns automatically if missing.
ALTER TABLE chapters ADD COLUMN image_url TEXT DEFAULT '';
ALTER TABLE chapters ADD COLUMN content_type TEXT DEFAULT 'content';
ALTER TABLE chapters ADD COLUMN sort_order INTEGER DEFAULT 0;
