PRAGMA foreign_keys = ON;

-- Carteiras de chips por vendedor. ICCID e telefone permanecem como texto
-- para preservar zeros à esquerda. A remoção é lógica e mantém o histórico.
CREATE TABLE chips (
  id TEXT PRIMARY KEY,
  material_code TEXT NOT NULL COLLATE NOCASE
    CHECK (length(trim(material_code)) BETWEEN 1 AND 40),
  iccid TEXT NOT NULL UNIQUE COLLATE NOCASE
    CHECK (
      length(iccid) BETWEEN 18 AND 32
      AND iccid NOT GLOB '*[^0-9]*'
    ),
  inventory_serial_id INTEGER UNIQUE REFERENCES inventory_serials(id),
  assigned_seller_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'sold')),
  sold_on TEXT,
  registered_phone TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  removed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (
    (status = 'available' AND sold_on IS NULL AND registered_phone IS NULL)
    OR
    (status = 'sold' AND sold_on IS NOT NULL AND registered_phone IS NOT NULL)
  ),
  CHECK (
    registered_phone IS NULL
    OR (
      length(registered_phone) BETWEEN 10 AND 13
      AND registered_phone NOT GLOB '*[^0-9]*'
    )
  ),
  CHECK (
    (active = 1 AND removed_at IS NULL)
    OR
    (active = 0 AND removed_at IS NOT NULL)
  )
);

CREATE INDEX idx_chips_seller_status
ON chips (assigned_seller_id, active, status, updated_at DESC);

CREATE INDEX idx_chips_material
ON chips (material_code, active);

CREATE TRIGGER chips_require_active_seller_insert
BEFORE INSERT ON chips
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1
  FROM users u
  WHERE u.id = NEW.assigned_seller_id
    AND u.role = 'seller'
    AND u.access_profile = 'default'
    AND u.active = 1
    AND u.deleted_at IS NULL
)
BEGIN
  SELECT RAISE(ABORT, 'INVALID_CHIP_SELLER');
END;

CREATE TRIGGER chips_require_active_seller_update
BEFORE UPDATE OF assigned_seller_id, active, status ON chips
FOR EACH ROW
WHEN NEW.active = 1
  AND NOT EXISTS (
  SELECT 1
  FROM users u
  WHERE u.id = NEW.assigned_seller_id
    AND u.role = 'seller'
    AND u.access_profile = 'default'
    AND u.active = 1
    AND u.deleted_at IS NULL
)
BEGIN
  SELECT RAISE(ABORT, 'INVALID_CHIP_SELLER');
END;

CREATE TRIGGER chips_limit_available_insert
BEFORE INSERT ON chips
FOR EACH ROW
WHEN NEW.active = 1
  AND NEW.status = 'available'
  AND (
    SELECT COUNT(*)
    FROM chips c
    WHERE c.assigned_seller_id = NEW.assigned_seller_id
      AND c.active = 1
      AND c.status = 'available'
  ) >= 10
BEGIN
  SELECT RAISE(ABORT, 'CHIP_CAPACITY_EXCEEDED');
END;

CREATE TRIGGER chips_limit_available_update
BEFORE UPDATE OF assigned_seller_id, status, active ON chips
FOR EACH ROW
WHEN NEW.active = 1
  AND NEW.status = 'available'
  AND (
    SELECT COUNT(*)
    FROM chips c
    WHERE c.assigned_seller_id = NEW.assigned_seller_id
      AND c.active = 1
      AND c.status = 'available'
      AND c.id <> OLD.id
  ) >= 10
BEGIN
  SELECT RAISE(ABORT, 'CHIP_CAPACITY_EXCEEDED');
END;

CREATE TRIGGER chips_protect_seller_wallet
BEFORE UPDATE OF role, access_profile, active, deleted_at ON users
FOR EACH ROW
WHEN EXISTS (
  SELECT 1
  FROM chips c
  WHERE c.assigned_seller_id = OLD.id
    AND c.active = 1
    AND c.status = 'available'
)
AND NOT (
  NEW.role = 'seller'
  AND NEW.access_profile = 'default'
  AND NEW.active = 1
  AND NEW.deleted_at IS NULL
)
BEGIN
  SELECT RAISE(ABORT, 'CHIP_WALLET_NOT_EMPTY');
END;
