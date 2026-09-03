CREATE TABLE site_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('seller', 'stocker')),
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('suggestion', 'complaint')),
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  page_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'resolved')),
  manager_note TEXT NOT NULL DEFAULT '',
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_site_feedback_status_created
ON site_feedback(status, created_at DESC);

CREATE INDEX idx_site_feedback_author_created
ON site_feedback(author_user_id, created_at DESC);
