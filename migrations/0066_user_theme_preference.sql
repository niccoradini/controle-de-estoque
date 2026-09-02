ALTER TABLE users ADD COLUMN ui_theme TEXT NOT NULL DEFAULT 'dark' CHECK (ui_theme IN ('dark', 'light'));
