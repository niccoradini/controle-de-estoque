CREATE TABLE replenishment_items (
  variant_id INTEGER PRIMARY KEY,
  requested_quantity INTEGER NOT NULL CHECK (requested_quantity > 0 AND requested_quantity <= 100000),
  note TEXT NOT NULL DEFAULT '',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

CREATE INDEX idx_replenishment_items_updated
ON replenishment_items(updated_at DESC);
