PRAGMA foreign_keys = ON;

-- Controle dos aparelhos usados recebidos pelo Vivo Renova e da coleta
-- posterior realizada pela empresa. Os registros permanecem no histórico.
CREATE TABLE renova_intake_items (
  id TEXT PRIMARY KEY,
  model TEXT NOT NULL
    CHECK (length(trim(model)) BETWEEN 2 AND 120),
  received_on TEXT NOT NULL
    CHECK (
      length(received_on) = 10
      AND received_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
    ),
  pickup_on TEXT
    CHECK (
      pickup_on IS NULL
      OR (
        length(pickup_on) = 10
        AND pickup_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
        AND pickup_on >= received_on
      )
    ),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_renova_intake_status
ON renova_intake_items (pickup_on, received_on DESC, updated_at DESC);

CREATE INDEX idx_renova_intake_model
ON renova_intake_items (model COLLATE NOCASE);
