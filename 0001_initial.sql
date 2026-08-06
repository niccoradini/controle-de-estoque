PRAGMA foreign_keys = ON;

CREATE TABLE system_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'seller')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  must_change_password INTEGER NOT NULL DEFAULT 0 CHECK (must_change_password IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model TEXT NOT NULL,
  imei TEXT NOT NULL UNIQUE,
  registration_code TEXT NOT NULL COLLATE NOCASE UNIQUE,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'reserved', 'withdrawn')),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  withdrawn_at TEXT
);

CREATE TABLE withdrawal_requests (
  id TEXT PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  notes TEXT,
  decision_note TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  decided_at TEXT,
  decided_by INTEGER REFERENCES users(id)
);

CREATE TABLE withdrawal_items (
  request_id TEXT NOT NULL REFERENCES withdrawal_requests(id) ON DELETE CASCADE,
  device_id INTEGER NOT NULL REFERENCES devices(id),
  model_snapshot TEXT NOT NULL,
  imei_snapshot TEXT NOT NULL,
  registration_code_snapshot TEXT NOT NULL,
  PRIMARY KEY (request_id, device_id)
);

CREATE TABLE active_reservations (
  device_id INTEGER PRIMARY KEY REFERENCES devices(id),
  request_id TEXT NOT NULL REFERENCES withdrawal_requests(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE login_attempts (
  client_key TEXT PRIMARY KEY,
  failed_count INTEGER NOT NULL DEFAULT 0,
  window_started_at TEXT NOT NULL,
  blocked_until TEXT
);

CREATE TRIGGER reservation_requires_available_device
BEFORE INSERT ON active_reservations
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1 FROM devices WHERE id = NEW.device_id AND status = 'available'
)
BEGIN
  SELECT RAISE(ABORT, 'DEVICE_NOT_AVAILABLE');
END;

CREATE TRIGGER reservation_captures_device
AFTER INSERT ON active_reservations
FOR EACH ROW
BEGIN
  INSERT INTO withdrawal_items
    (request_id, device_id, model_snapshot, imei_snapshot, registration_code_snapshot)
  SELECT NEW.request_id, id, model, imei, registration_code
  FROM devices WHERE id = NEW.device_id;

  UPDATE devices
  SET status = 'reserved', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id = NEW.device_id;
END;

CREATE TRIGGER request_transition_only_from_pending
BEFORE UPDATE OF status ON withdrawal_requests
FOR EACH ROW
WHEN OLD.status <> 'pending' OR NEW.status NOT IN ('approved', 'rejected', 'cancelled')
BEGIN
  SELECT RAISE(ABORT, 'INVALID_REQUEST_TRANSITION');
END;

CREATE TRIGGER approval_requires_complete_reservation
BEFORE UPDATE OF status ON withdrawal_requests
FOR EACH ROW
WHEN NEW.status = 'approved' AND (
  (SELECT COUNT(*) FROM withdrawal_items WHERE request_id = NEW.id) = 0
  OR
  (SELECT COUNT(*) FROM withdrawal_items WHERE request_id = NEW.id)
    <> (SELECT COUNT(*) FROM active_reservations WHERE request_id = NEW.id)
)
BEGIN
  SELECT RAISE(ABORT, 'RESERVATION_MISMATCH');
END;

CREATE TRIGGER approved_request_withdraws_devices
AFTER UPDATE OF status ON withdrawal_requests
FOR EACH ROW
WHEN NEW.status = 'approved'
BEGIN
  UPDATE devices
  SET status = 'withdrawn',
      withdrawn_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id IN (SELECT device_id FROM active_reservations WHERE request_id = NEW.id);

  DELETE FROM active_reservations WHERE request_id = NEW.id;
END;

CREATE TRIGGER rejected_request_releases_devices
AFTER UPDATE OF status ON withdrawal_requests
FOR EACH ROW
WHEN NEW.status IN ('rejected', 'cancelled')
BEGIN
  UPDATE devices
  SET status = 'available', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id IN (SELECT device_id FROM active_reservations WHERE request_id = NEW.id);

  DELETE FROM active_reservations WHERE request_id = NEW.id;
END;

CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_model ON devices(model COLLATE NOCASE);
CREATE INDEX idx_requests_seller ON withdrawal_requests(seller_id);
CREATE INDEX idx_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_requests_created ON withdrawal_requests(created_at DESC);
CREATE INDEX idx_reservations_request ON active_reservations(request_id);
CREATE INDEX idx_sessions_expiry ON sessions(expires_at);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
