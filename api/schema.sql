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
CREATE INDEX IF NOT EXISTS idx_chapters_status_number ON chapters(status,chapter_number);

CREATE TABLE IF NOT EXISTS admins (
 id TEXT PRIMARY KEY,
 username TEXT UNIQUE NOT NULL,
 password_hash TEXT NOT NULL,
 password_salt TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT 'admin',
 created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admin_sessions (
 token_hash TEXT PRIMARY KEY,
 admin_id TEXT NOT NULL,
 expires_at INTEGER NOT NULL,
 created_at INTEGER NOT NULL
);
