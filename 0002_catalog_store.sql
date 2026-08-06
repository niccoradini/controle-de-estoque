PRAGMA foreign_keys = ON;

CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  brand TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('phone', 'case', 'screen_protector', 'accessory')),
  option1_label TEXT NOT NULL DEFAULT '',
  option2_label TEXT NOT NULL DEFAULT '',
  option3_label TEXT NOT NULL DEFAULT '',
  presets_json TEXT NOT NULL DEFAULT '{}',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id),
  option1_value TEXT NOT NULL DEFAULT '' COLLATE NOCASE,
  option2_value TEXT NOT NULL DEFAULT '' COLLATE NOCASE,
  option3_value TEXT NOT NULL DEFAULT '' COLLATE NOCASE,
  sku TEXT COLLATE NOCASE UNIQUE,
  stock_mode TEXT NOT NULL CHECK (stock_mode IN ('serialized', 'quantity')),
  quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (product_id, option1_value, option2_value, option3_value)
);

ALTER TABLE devices ADD COLUMN variant_id INTEGER REFERENCES product_variants(id);

CREATE TABLE withdrawal_quantity_items (
  request_id TEXT NOT NULL REFERENCES withdrawal_requests(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL REFERENCES product_variants(id),
  product_name_snapshot TEXT NOT NULL,
  option1_label_snapshot TEXT NOT NULL DEFAULT '',
  option1_value_snapshot TEXT NOT NULL DEFAULT '',
  option2_label_snapshot TEXT NOT NULL DEFAULT '',
  option2_value_snapshot TEXT NOT NULL DEFAULT '',
  option3_label_snapshot TEXT NOT NULL DEFAULT '',
  option3_value_snapshot TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (request_id, variant_id)
);

CREATE TABLE active_quantity_reservations (
  variant_id INTEGER NOT NULL REFERENCES product_variants(id),
  request_id TEXT NOT NULL REFERENCES withdrawal_requests(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (variant_id, request_id)
);

INSERT INTO products
  (name, brand, category, option1_label, option2_label, option3_label, presets_json, sort_order)
VALUES
  ('iPhone 17', 'Apple', 'phone', 'Versão', 'Cor', 'Memória', '{"option1":["Normal","Pro","Pro Max"],"option2":[],"option3":[]}', 10),
  ('iPhone 16', 'Apple', 'phone', 'Versão', 'Cor', 'Memória', '{"option1":["Normal","Pro","Pro Max"],"option2":[],"option3":[]}', 20),
  ('iPhone 15', 'Apple', 'phone', 'Cor', 'Memória', '', '{"option1":["Azul","Preto"],"option2":["256 GB"],"option3":[]}', 30),
  ('iPhone 13', 'Apple', 'phone', 'Cor', 'Memória', '', '{"option1":["Preto"],"option2":["256 GB"],"option3":[]}', 40),
  ('iPhone 16e', 'Apple', 'phone', 'Cor', 'Memória', '', '{"option1":[],"option2":["256 GB"],"option3":[]}', 50),
  ('iPhone 17e', 'Apple', 'phone', 'Cor', 'Memória', '', '{"option1":[],"option2":[],"option3":[]}', 60),
  ('Galaxy S26', 'Samsung', 'phone', 'Versão', 'Cor', 'Memória', '{"option1":["S26","S26+","S26 Ultra"],"option2":[],"option3":[]}', 110),
  ('Galaxy S25', 'Samsung', 'phone', 'Versão', 'Cor', 'Memória', '{"option1":["S25","S25+","S25 Ultra","S25 FE"],"option2":[],"option3":[]}', 120),
  ('Galaxy Z Fold7', 'Samsung', 'phone', 'Cor', 'Memória', '', '{"option1":["Preto"],"option2":["512 GB"],"option3":[]}', 130),
  ('Galaxy Z Flip7', 'Samsung', 'phone', 'Cor', 'Memória', '', '{"option1":["Preto"],"option2":["256 GB","512 GB"],"option3":[]}', 140),
  ('Galaxy Z Flip FE', 'Samsung', 'phone', 'Cor', 'Memória', '', '{"option1":["Preto"],"option2":["256 GB"],"option3":[]}', 150),
  ('Galaxy A06', 'Samsung', 'phone', 'Cor', 'Memória', '', '{"option1":["Preto","Branco"],"option2":["128 GB"],"option3":[]}', 160),
  ('Galaxy A36', 'Samsung', 'phone', 'Cor', 'Memória', '', '{"option1":["Preto","Branco"],"option2":["256 GB"],"option3":[]}', 170),
  ('Galaxy A56', 'Samsung', 'phone', 'Cor', 'Memória', '', '{"option1":["Preto","Branco"],"option2":["256 GB"],"option3":[]}', 180),
  ('Galaxy A57', 'Samsung', 'phone', 'Cor', 'Memória', '', '{"option1":["Preto","Cinza","Azul"],"option2":["256 GB"],"option3":[]}', 190),
  ('Galaxy A37', 'Samsung', 'phone', 'Cor', 'Memória', '', '{"option1":["Preto","Branco"],"option2":["256 GB"],"option3":[]}', 200),
  ('Galaxy A17', 'Samsung', 'phone', 'Cor', 'Memória', '', '{"option1":["Preto","Branco"],"option2":["128 GB","256 GB"],"option3":[]}', 210),
  ('Galaxy A07', 'Samsung', 'phone', 'Cor', 'Memória', '', '{"option1":["Preto","Branco"],"option2":["128 GB"],"option3":[]}', 220),
  ('Edge 60 Pro', 'Motorola', 'phone', 'Cor', 'Memória', '', '{"option1":[],"option2":["256 GB"],"option3":[]}', 310),
  ('Edge 60 Fusion', 'Motorola', 'phone', 'Cor', 'Memória', '', '{"option1":[],"option2":["256 GB"],"option3":[]}', 320),
  ('Edge 70', 'Motorola', 'phone', 'Cor', 'Memória', '', '{"option1":[],"option2":["512 GB"],"option3":[]}', 330),
  ('Edge 70 Fusion', 'Motorola', 'phone', 'Cor', 'Memória', '', '{"option1":[],"option2":["256 GB"],"option3":[]}', 340),
  ('Moto G67', 'Motorola', 'phone', 'Cor', 'Memória', '', '{"option1":[],"option2":["256 GB"],"option3":[]}', 350),
  ('Moto G77', 'Motorola', 'phone', 'Cor', 'Memória', '', '{"option1":[],"option2":["256 GB"],"option3":[]}', 360),
  ('Moto G86', 'Motorola', 'phone', 'Cor', 'Memória', '', '{"option1":[],"option2":["256 GB"],"option3":[]}', 370),
  ('Motorola Signature', 'Motorola', 'phone', 'Cor', 'Memória', '', '{"option1":[],"option2":["512 GB"],"option3":[]}', 380),
  ('Moto G35', 'Motorola', 'phone', 'Cor', 'Memória', '', '{"option1":["Preto"],"option2":["128 GB"],"option3":[]}', 390),
  ('Capinhas', 'Acessórios', 'case', 'Compatibilidade', '', '', '{"option1":[],"option2":[],"option3":[]}', 500),
  ('Películas', 'Acessórios', 'screen_protector', 'Compatibilidade', 'Tipo', '', '{"option1":[],"option2":["Transparente","Transparente Pro","Fosca","Fosca Pro","Privacidade","Privacidade Pro"],"option3":[]}', 510);

-- Converte os modelos já existentes em produtos/variações sem apagar nenhum aparelho.
INSERT OR IGNORE INTO products
  (name, brand, category, option1_label, option2_label, option3_label, presets_json, sort_order)
SELECT DISTINCT TRIM(model), 'Outros', 'phone', '', '', '', '{}', 900
FROM devices
WHERE TRIM(model) <> '';

INSERT OR IGNORE INTO product_variants
  (product_id, option1_value, option2_value, option3_value, stock_mode)
SELECT DISTINCT p.id,
       CASE WHEN p.option1_label <> '' THEN 'Não informado' ELSE '' END,
       CASE WHEN p.option2_label <> '' THEN 'Não informado' ELSE '' END,
       CASE WHEN p.option3_label <> '' THEN 'Não informado' ELSE '' END,
       'serialized'
FROM devices d
JOIN products p ON p.name = d.model COLLATE NOCASE;

UPDATE devices
SET variant_id = (
  SELECT v.id
  FROM product_variants v
  JOIN products p ON p.id = v.product_id
  WHERE p.name = devices.model COLLATE NOCASE
    AND v.option1_value = CASE WHEN p.option1_label <> '' THEN 'Não informado' ELSE '' END
    AND v.option2_value = CASE WHEN p.option2_label <> '' THEN 'Não informado' ELSE '' END
    AND v.option3_value = CASE WHEN p.option3_label <> '' THEN 'Não informado' ELSE '' END
  LIMIT 1
)
WHERE variant_id IS NULL;

CREATE TRIGGER quantity_reservation_requires_stock
BEFORE INSERT ON active_quantity_reservations
FOR EACH ROW
WHEN NEW.quantity <= 0 OR NOT EXISTS (
  SELECT 1
  FROM product_variants v
  WHERE v.id = NEW.variant_id
    AND v.active = 1
    AND v.stock_mode = 'quantity'
    AND v.quantity_on_hand - COALESCE((
      SELECT SUM(r.quantity) FROM active_quantity_reservations r WHERE r.variant_id = v.id
    ), 0) >= NEW.quantity
)
BEGIN
  SELECT RAISE(ABORT, 'QUANTITY_NOT_AVAILABLE');
END;

CREATE TRIGGER quantity_reservation_captures_item
AFTER INSERT ON active_quantity_reservations
FOR EACH ROW
BEGIN
  INSERT INTO withdrawal_quantity_items
    (request_id, variant_id, product_name_snapshot,
     option1_label_snapshot, option1_value_snapshot,
     option2_label_snapshot, option2_value_snapshot,
     option3_label_snapshot, option3_value_snapshot, quantity)
  SELECT NEW.request_id, v.id, p.name,
         p.option1_label, v.option1_value,
         p.option2_label, v.option2_value,
         p.option3_label, v.option3_value, NEW.quantity
  FROM product_variants v
  JOIN products p ON p.id = v.product_id
  WHERE v.id = NEW.variant_id;
END;

CREATE TRIGGER quantity_stock_cannot_cross_reservations
BEFORE UPDATE OF quantity_on_hand ON product_variants
FOR EACH ROW
WHEN NEW.quantity_on_hand < 0 OR NEW.quantity_on_hand < COALESCE((
  SELECT SUM(quantity) FROM active_quantity_reservations WHERE variant_id = NEW.id
), 0)
BEGIN
  SELECT RAISE(ABORT, 'QUANTITY_BELOW_RESERVED');
END;

DROP TRIGGER approval_requires_complete_reservation;

CREATE TRIGGER approval_requires_complete_reservation
BEFORE UPDATE OF status ON withdrawal_requests
FOR EACH ROW
WHEN NEW.status = 'approved' AND (
  (
    (SELECT COUNT(*) FROM withdrawal_items WHERE request_id = NEW.id)
    + (SELECT COUNT(*) FROM withdrawal_quantity_items WHERE request_id = NEW.id)
  ) = 0
  OR (SELECT COUNT(*) FROM withdrawal_items WHERE request_id = NEW.id)
       <> (SELECT COUNT(*) FROM active_reservations WHERE request_id = NEW.id)
  OR (SELECT COUNT(*) FROM withdrawal_quantity_items WHERE request_id = NEW.id)
       <> (SELECT COUNT(*) FROM active_quantity_reservations WHERE request_id = NEW.id)
  OR EXISTS (
    SELECT 1
    FROM withdrawal_quantity_items i
    LEFT JOIN active_quantity_reservations r
      ON r.request_id = i.request_id AND r.variant_id = i.variant_id
    WHERE i.request_id = NEW.id AND (r.variant_id IS NULL OR r.quantity <> i.quantity)
  )
)
BEGIN
  SELECT RAISE(ABORT, 'RESERVATION_MISMATCH');
END;

CREATE TRIGGER approved_request_withdraws_quantities
AFTER UPDATE OF status ON withdrawal_requests
FOR EACH ROW
WHEN NEW.status = 'approved'
BEGIN
  DELETE FROM active_quantity_reservations WHERE request_id = NEW.id;

  UPDATE product_variants
  SET quantity_on_hand = quantity_on_hand - COALESCE((
        SELECT quantity
        FROM withdrawal_quantity_items i
        WHERE i.request_id = NEW.id AND i.variant_id = product_variants.id
      ), 0),
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id IN (
    SELECT variant_id FROM withdrawal_quantity_items WHERE request_id = NEW.id
  );
END;

CREATE TRIGGER rejected_request_releases_quantities
AFTER UPDATE OF status ON withdrawal_requests
FOR EACH ROW
WHEN NEW.status IN ('rejected', 'cancelled')
BEGIN
  DELETE FROM active_quantity_reservations WHERE request_id = NEW.id;
END;

CREATE INDEX idx_products_category ON products(category, active, sort_order);
CREATE INDEX idx_variants_product ON product_variants(product_id, active);
CREATE INDEX idx_devices_variant ON devices(variant_id, status);
CREATE INDEX idx_quantity_reservations_request ON active_quantity_reservations(request_id);
CREATE INDEX idx_quantity_reservations_variant ON active_quantity_reservations(variant_id);
