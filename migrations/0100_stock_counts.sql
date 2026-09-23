PRAGMA foreign_keys = ON;

CREATE TABLE stock_counts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'all'
    CHECK (category IN ('all','devices','cases','screen_protectors','chargers','chips','accessories')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','completed','adjusted')),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  finalized_at TEXT,
  adjusted_at TEXT,
  adjusted_by INTEGER REFERENCES users(id)
);

CREATE TABLE stock_count_items (
  count_id TEXT NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL REFERENCES product_variants(id),
  material_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  stock_mode TEXT NOT NULL CHECK (stock_mode IN ('quantity','serialized')),
  expected_quantity INTEGER NOT NULL CHECK (expected_quantity >= 0),
  counted_quantity INTEGER CHECK (counted_quantity IS NULL OR counted_quantity >= 0),
  note TEXT NOT NULL DEFAULT '',
  updated_at TEXT,
  PRIMARY KEY (count_id, variant_id)
);

CREATE TABLE stock_count_serials (
  count_id TEXT NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL REFERENCES product_variants(id),
  serial_number TEXT NOT NULL COLLATE NOCASE,
  expected INTEGER NOT NULL DEFAULT 0 CHECK (expected IN (0,1)),
  found INTEGER NOT NULL DEFAULT 0 CHECK (found IN (0,1)),
  created_at TEXT NOT NULL,
  PRIMARY KEY (count_id, serial_number)
);

CREATE INDEX idx_stock_counts_status ON stock_counts(status, updated_at DESC);
CREATE INDEX idx_stock_count_items_count ON stock_count_items(count_id, category, material_code);
CREATE INDEX idx_stock_count_serials_count ON stock_count_serials(count_id, variant_id);
