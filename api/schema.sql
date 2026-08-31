CREATE TABLE IF NOT EXISTS chapters (
 id TEXT PRIMARY KEY,
 chapter_number INTEGER NOT NULL,
 title TEXT NOT NULL,
 subtitle TEXT DEFAULT '',
 slug TEXT,
 content_html TEXT NOT NULL DEFAULT '',
 seo_title TEXT DEFAULT '',
 seo_description TEXT DEFAULT '',
 status TEXT NOT NULL DEFAULT 'draft',
 created_at TEXT DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_chapters_slug ON chapters(slug);
CREATE INDEX IF NOT EXISTS idx_chapters_status_number ON chapters(status,chapter_number);
