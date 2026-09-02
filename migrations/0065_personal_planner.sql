CREATE TABLE personal_planner_days (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_date TEXT NOT NULL,
  main_focus TEXT NOT NULL DEFAULT '',
  intention TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  energy INTEGER NOT NULL DEFAULT 3 CHECK (energy BETWEEN 1 AND 5),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, plan_date)
);

CREATE TABLE personal_planner_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  item_type TEXT NOT NULL DEFAULT 'task' CHECK (item_type IN ('task', 'appointment', 'reminder')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  item_date TEXT NOT NULL,
  item_time TEXT NOT NULL DEFAULT '',
  completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_personal_planner_items_user_date
ON personal_planner_items(user_id, item_date, completed, item_time);
