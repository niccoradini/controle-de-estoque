PRAGMA foreign_keys = ON;

-- Guarda saldos, reservas e itens de pedidos antes de unir as variações por compatibilidade.
CREATE TABLE _migration_0003_stock (
  product_id INTEGER NOT NULL,
  type_value TEXT NOT NULL DEFAULT '',
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, type_value)
);

INSERT INTO _migration_0003_stock (product_id, type_value, quantity_on_hand)
SELECT p.id,
       CASE WHEN p.category = 'screen_protector'
            THEN COALESCE(NULLIF(v.option2_value, ''), NULLIF(v.option1_value, ''), 'Transparente')
            ELSE '' END,
       SUM(v.quantity_on_hand)
FROM products p
JOIN product_variants v ON v.product_id = p.id AND v.stock_mode = 'quantity'
WHERE p.category IN ('case', 'screen_protector')
GROUP BY p.id,
         CASE WHEN p.category = 'screen_protector'
              THEN COALESCE(NULLIF(v.option2_value, ''), NULLIF(v.option1_value, ''), 'Transparente')
              ELSE '' END;

INSERT OR IGNORE INTO _migration_0003_stock (product_id, type_value, quantity_on_hand)
SELECT id, '', 0 FROM products WHERE category = 'case';

INSERT OR IGNORE INTO _migration_0003_stock (product_id, type_value, quantity_on_hand)
SELECT id, 'Transparente', 0 FROM products WHERE category = 'screen_protector';

INSERT OR IGNORE INTO _migration_0003_stock (product_id, type_value, quantity_on_hand)
SELECT id, 'Transparente Pro', 0 FROM products WHERE category = 'screen_protector';

INSERT OR IGNORE INTO _migration_0003_stock (product_id, type_value, quantity_on_hand)
SELECT id, 'Fosca', 0 FROM products WHERE category = 'screen_protector';

INSERT OR IGNORE INTO _migration_0003_stock (product_id, type_value, quantity_on_hand)
SELECT id, 'Fosca Pro', 0 FROM products WHERE category = 'screen_protector';

INSERT OR IGNORE INTO _migration_0003_stock (product_id, type_value, quantity_on_hand)
SELECT id, 'Privacidade', 0 FROM products WHERE category = 'screen_protector';

INSERT OR IGNORE INTO _migration_0003_stock (product_id, type_value, quantity_on_hand)
SELECT id, 'Privacidade Pro', 0 FROM products WHERE category = 'screen_protector';

CREATE TABLE _migration_0003_reservations (
  product_id INTEGER NOT NULL,
  type_value TEXT NOT NULL DEFAULT '',
  request_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (product_id, type_value, request_id)
);

INSERT INTO _migration_0003_reservations
  (product_id, type_value, request_id, quantity, created_at)
SELECT p.id,
       CASE WHEN p.category = 'screen_protector'
            THEN COALESCE(NULLIF(v.option2_value, ''), NULLIF(v.option1_value, ''), 'Transparente')
            ELSE '' END,
       r.request_id,
       SUM(r.quantity),
       MIN(r.created_at)
FROM active_quantity_reservations r
JOIN product_variants v ON v.id = r.variant_id
JOIN products p ON p.id = v.product_id
WHERE p.category IN ('case', 'screen_protector')
GROUP BY p.id,
         CASE WHEN p.category = 'screen_protector'
              THEN COALESCE(NULLIF(v.option2_value, ''), NULLIF(v.option1_value, ''), 'Transparente')
              ELSE '' END,
         r.request_id;

CREATE TABLE _migration_0003_items (
  product_id INTEGER NOT NULL,
  type_value TEXT NOT NULL DEFAULT '',
  request_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  PRIMARY KEY (product_id, type_value, request_id)
);

INSERT INTO _migration_0003_items
  (product_id, type_value, request_id, product_name, quantity)
SELECT p.id,
       CASE WHEN p.category = 'screen_protector'
            THEN COALESCE(
              NULLIF(i.option2_value_snapshot, ''),
              NULLIF(v.option2_value, ''),
              NULLIF(i.option1_value_snapshot, ''),
              NULLIF(v.option1_value, ''),
              'Transparente'
            )
            ELSE '' END,
       i.request_id,
       p.name,
       SUM(i.quantity)
FROM withdrawal_quantity_items i
JOIN product_variants v ON v.id = i.variant_id
JOIN products p ON p.id = v.product_id
WHERE p.category IN ('case', 'screen_protector')
GROUP BY p.id,
         CASE WHEN p.category = 'screen_protector'
              THEN COALESCE(
                NULLIF(i.option2_value_snapshot, ''),
                NULLIF(v.option2_value, ''),
                NULLIF(i.option1_value_snapshot, ''),
                NULLIF(v.option1_value, ''),
                'Transparente'
              )
              ELSE '' END,
         i.request_id;

INSERT OR IGNORE INTO _migration_0003_stock (product_id, type_value, quantity_on_hand)
SELECT product_id, type_value, 0 FROM _migration_0003_reservations;

INSERT OR IGNORE INTO _migration_0003_stock (product_id, type_value, quantity_on_hand)
SELECT product_id, type_value, 0 FROM _migration_0003_items;

DROP TRIGGER quantity_reservation_requires_stock;
DROP TRIGGER quantity_reservation_captures_item;
DROP TRIGGER quantity_stock_cannot_cross_reservations;

UPDATE products
SET option1_label = '', option2_label = '', option3_label = '',
    presets_json = '{"option1":[],"option2":[],"option3":[]}',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE category = 'case';

UPDATE products
SET option1_label = 'Tipo', option2_label = '', option3_label = '',
    presets_json = '{"option1":["Transparente","Transparente Pro","Fosca","Fosca Pro","Privacidade","Privacidade Pro"],"option2":[],"option3":[]}',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE category = 'screen_protector';

INSERT OR IGNORE INTO product_variants
  (product_id, option1_value, option2_value, option3_value, stock_mode, quantity_on_hand)
SELECT product_id, type_value, '', '', 'quantity', 0
FROM _migration_0003_stock;

CREATE TABLE _migration_0003_targets (
  product_id INTEGER NOT NULL,
  type_value TEXT NOT NULL DEFAULT '',
  variant_id INTEGER NOT NULL,
  PRIMARY KEY (product_id, type_value),
  UNIQUE (variant_id)
);

INSERT INTO _migration_0003_targets (product_id, type_value, variant_id)
SELECT s.product_id, s.type_value, v.id
FROM _migration_0003_stock s
JOIN product_variants v
  ON v.product_id = s.product_id
 AND v.option1_value = s.type_value COLLATE NOCASE
 AND v.option2_value = '' COLLATE NOCASE
 AND v.option3_value = '' COLLATE NOCASE;

DELETE FROM withdrawal_quantity_items
WHERE variant_id IN (
  SELECT v.id
  FROM product_variants v
  JOIN products p ON p.id = v.product_id
  WHERE p.category IN ('case', 'screen_protector')
);

DELETE FROM active_quantity_reservations
WHERE variant_id IN (
  SELECT v.id
  FROM product_variants v
  JOIN products p ON p.id = v.product_id
  WHERE p.category IN ('case', 'screen_protector')
);

UPDATE product_variants
SET quantity_on_hand = 0, active = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE product_id IN (
  SELECT id FROM products WHERE category IN ('case', 'screen_protector')
);

UPDATE product_variants
SET stock_mode = 'quantity', active = 1,
    quantity_on_hand = COALESCE((
      SELECT s.quantity_on_hand
      FROM _migration_0003_stock s
      JOIN _migration_0003_targets t
        ON t.product_id = s.product_id AND t.type_value = s.type_value
      WHERE t.variant_id = product_variants.id
    ), 0),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id IN (SELECT variant_id FROM _migration_0003_targets);

INSERT INTO active_quantity_reservations (variant_id, request_id, quantity, created_at)
SELECT t.variant_id, r.request_id, r.quantity, r.created_at
FROM _migration_0003_reservations r
JOIN _migration_0003_targets t
  ON t.product_id = r.product_id AND t.type_value = r.type_value;

INSERT INTO withdrawal_quantity_items
  (request_id, variant_id, product_name_snapshot,
   option1_label_snapshot, option1_value_snapshot,
   option2_label_snapshot, option2_value_snapshot,
   option3_label_snapshot, option3_value_snapshot, quantity)
SELECT i.request_id, t.variant_id, i.product_name,
       CASE WHEN p.category = 'screen_protector' THEN 'Tipo' ELSE '' END,
       CASE WHEN p.category = 'screen_protector' THEN i.type_value ELSE '' END,
       '', '', '', '', i.quantity
FROM _migration_0003_items i
JOIN _migration_0003_targets t
  ON t.product_id = i.product_id AND t.type_value = i.type_value
JOIN products p ON p.id = i.product_id;

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

DROP TABLE _migration_0003_targets;
DROP TABLE _migration_0003_items;
DROP TABLE _migration_0003_reservations;
DROP TABLE _migration_0003_stock;
