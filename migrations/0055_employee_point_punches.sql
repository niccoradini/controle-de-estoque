-- Histórico privado de registros de ponto. O horário é sempre gerado pelo Worker.
CREATE TABLE employee_point_punches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  punched_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employee_point_punches_user_time
  ON employee_point_punches(user_id, punched_at DESC);
