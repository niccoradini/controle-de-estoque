PRAGMA foreign_keys = ON;

-- Mapa físico das vitrines e mesas de degustação da loja.
CREATE TABLE showcase_fixtures (
  id TEXT PRIMARY KEY COLLATE NOCASE,
  name TEXT NOT NULL,
  fixture_type TEXT NOT NULL
    CHECK (fixture_type IN ('device_showcase', 'accessory_showcase', 'demo_table')),
  shelf_count INTEGER NOT NULL DEFAULT 1 CHECK (shelf_count BETWEEN 1 AND 8),
  slots_per_shelf INTEGER NOT NULL CHECK (slots_per_shelf BETWEEN 1 AND 8),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE showcase_slots (
  fixture_id TEXT NOT NULL REFERENCES showcase_fixtures(id) ON DELETE CASCADE,
  slot_number INTEGER NOT NULL CHECK (slot_number > 0),
  variant_id INTEGER NOT NULL REFERENCES product_variants(id),
  serial_id INTEGER REFERENCES inventory_serials(id),
  updated_by INTEGER REFERENCES users(id),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (fixture_id, slot_number)
);

CREATE UNIQUE INDEX idx_showcase_slots_serial
ON showcase_slots(serial_id)
WHERE serial_id IS NOT NULL;

CREATE INDEX idx_showcase_slots_variant
ON showcase_slots(variant_id, fixture_id);

INSERT INTO showcase_fixtures
  (id, name, fixture_type, shelf_count, slots_per_shelf, sort_order)
VALUES
  ('devices-1', 'Vitrine de aparelhos 1', 'device_showcase', 4, 4, 10),
  ('devices-2', 'Vitrine de aparelhos 2', 'device_showcase', 4, 4, 20),
  ('accessories-1', 'Vitrine de acessórios 1', 'accessory_showcase', 3, 4, 30),
  ('accessories-2', 'Vitrine de acessórios 2', 'accessory_showcase', 3, 4, 40),
  ('demo-left-1', 'Mesa lateral 1', 'demo_table', 1, 3, 50),
  ('demo-main', 'Mesa principal', 'demo_table', 1, 6, 60),
  ('demo-left-2', 'Mesa lateral 2', 'demo_table', 1, 3, 70);
