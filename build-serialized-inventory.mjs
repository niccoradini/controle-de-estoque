import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brandFor, categoryFor, clusterFor, simplifyName, sqlText } from './build-material-inventory.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = process.argv[2];

if (!sourcePath) {
  throw new Error('Uso: node scripts/build-serialized-inventory.mjs caminho/basis-serial-stock.json');
}

const source = JSON.parse(await readFile(resolve(sourcePath), 'utf8'));
if (!Array.isArray(source.rows)) throw new Error('O arquivo de origem não contém a lista de unidades.');

const byMaterial = new Map();
const allSerials = new Set();
for (const [index, row] of source.rows.entries()) {
  const materialCode = String(row.material || '').trim();
  const technicalName = String(row.technicalName || '').trim();
  const serialNumber = String(row.serialNumber || '').trim();
  if (!materialCode || !technicalName || !serialNumber) throw new Error(`Linha ${index + 2} incompleta.`);
  if (allSerials.has(serialNumber.toLocaleLowerCase('pt-BR'))) throw new Error(`Número de série duplicado: ${serialNumber}.`);
  allSerials.add(serialNumber.toLocaleLowerCase('pt-BR'));
  if (!byMaterial.has(materialCode)) byMaterial.set(materialCode, { technicalNames: new Set(), serialNumbers: [] });
  const group = byMaterial.get(materialCode);
  group.technicalNames.add(technicalName);
  group.serialNumbers.push(serialNumber);
}

const inventory = [...byMaterial].map(([materialCode, group]) => {
  if (group.technicalNames.size !== 1) throw new Error(`O material ${materialCode} possui nomes diferentes.`);
  const technicalName = [...group.technicalNames][0];
  const displayName = simplifyName(technicalName);
  const category = categoryFor(displayName);
  return {
    materialCode,
    displayName,
    technicalName,
    category,
    cluster: clusterFor(displayName, category),
    brand: brandFor(displayName),
    quantity: group.serialNumbers.length,
    serialNumbers: group.serialNumbers.sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true })),
  };
}).sort((a, b) => a.displayName.localeCompare(b.displayName, 'pt-BR') || a.materialCode.localeCompare(b.materialCode));

const total = inventory.reduce((sum, item) => sum + item.quantity, 0);
if (inventory.length !== 298) throw new Error(`Esperados 298 materiais, encontrados ${inventory.length}.`);
if (total !== 1182) throw new Error(`Esperadas 1.182 unidades, encontradas ${total}.`);
if (allSerials.size !== total) throw new Error('A quantidade de números de série não confere.');

const dataPath = resolve(projectRoot, 'data/inventory-serialized-2026-07-21.json');
await mkdir(dirname(dataPath), { recursive: true });
await writeFile(dataPath, `${JSON.stringify({
  importedAt: '2026-07-21',
  source: source.source || 'Planilha em Basis (1).xlsx',
  productCount: inventory.length,
  totalQuantity: total,
  serialCount: allSerials.size,
  products: inventory,
}, null, 2)}\n`);

const productValues = inventory.map((item, index) => `  (${sqlText(item.materialCode)}, ${sqlText(item.displayName)}, ${sqlText(item.technicalName)}, ${sqlText(item.brand)}, ${sqlText(item.category)}, ${sqlText(item.cluster)}, ${item.quantity}, ${index + 1})`).join(',\n');
const serialValues = inventory.flatMap((item) => item.serialNumbers.map((serialNumber) => `  (${sqlText(item.materialCode)}, ${sqlText(serialNumber)})`)).join(',\n');

const migration = `PRAGMA foreign_keys = ON;

-- Atualização do retrato completo do estoque em 21/07/2026.
-- Preserva usuários, sessões, pedidos e histórico. Adiciona rastreio por número de série.
DROP TRIGGER IF EXISTS quantity_stock_cannot_cross_reservations;

ALTER TABLE product_variants ADD COLUMN serial_tracking INTEGER NOT NULL DEFAULT 0
  CHECK (serial_tracking IN (0, 1));

CREATE TABLE inventory_serials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id INTEGER NOT NULL REFERENCES product_variants(id),
  serial_number TEXT NOT NULL COLLATE NOCASE UNIQUE,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'withdrawn')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE request_serial_assignments (
  request_id TEXT NOT NULL REFERENCES withdrawal_requests(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL REFERENCES product_variants(id),
  serial_id INTEGER NOT NULL REFERENCES inventory_serials(id),
  serial_number_snapshot TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (request_id, serial_id),
  UNIQUE (serial_id)
);

CREATE TABLE _migration_0006_products (
  material_code TEXT PRIMARY KEY COLLATE NOCASE,
  display_name TEXT NOT NULL,
  technical_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  cluster TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  sort_order INTEGER NOT NULL
);

INSERT INTO _migration_0006_products
  (material_code, display_name, technical_name, brand, category, cluster, quantity, sort_order)
VALUES
${productValues};

CREATE TABLE _migration_0006_serials (
  material_code TEXT NOT NULL COLLATE NOCASE,
  serial_number TEXT PRIMARY KEY COLLATE NOCASE
);

INSERT INTO _migration_0006_serials (material_code, serial_number)
VALUES
${serialValues};

CREATE TABLE _migration_0006_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);

INSERT INTO _migration_0006_guard (valid)
SELECT CASE
  WHEN (SELECT COUNT(*) FROM _migration_0006_products) = 298
   AND (SELECT SUM(quantity) FROM _migration_0006_products) = 1182
   AND (SELECT COUNT(*) FROM _migration_0006_serials) = 1182
  THEN 1 ELSE 0 END;

UPDATE products
SET name = (
      SELECT s.display_name || ' · ' || s.material_code
      FROM product_variants v
      JOIN _migration_0006_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id
      LIMIT 1
    ),
    display_name = (
      SELECT s.display_name FROM product_variants v
      JOIN _migration_0006_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    technical_name = (
      SELECT s.technical_name FROM product_variants v
      JOIN _migration_0006_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    brand = (
      SELECT s.brand FROM product_variants v
      JOIN _migration_0006_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    category = (
      SELECT s.category FROM product_variants v
      JOIN _migration_0006_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    cluster = (
      SELECT s.cluster FROM product_variants v
      JOIN _migration_0006_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    sort_order = (
      SELECT s.sort_order FROM product_variants v
      JOIN _migration_0006_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    active = 1,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE EXISTS (
  SELECT 1 FROM product_variants v
  JOIN _migration_0006_products s ON s.material_code = v.sku COLLATE NOCASE
  WHERE v.product_id = products.id
);

INSERT INTO products
  (name, display_name, technical_name, brand, category, cluster,
   option1_label, option2_label, option3_label, presets_json, active, sort_order)
SELECT s.display_name || ' · ' || s.material_code,
       s.display_name, s.technical_name, s.brand, s.category, s.cluster,
       '', '', '', '{}', 1, s.sort_order
FROM _migration_0006_products s
WHERE NOT EXISTS (
  SELECT 1 FROM product_variants v WHERE v.sku = s.material_code COLLATE NOCASE
);

INSERT INTO product_variants
  (product_id, option1_value, option2_value, option3_value, sku, stock_mode,
   quantity_on_hand, active, serial_tracking)
SELECT p.id, '', '', '', s.material_code, 'quantity', s.quantity, 1, 1
FROM _migration_0006_products s
JOIN products p ON p.name = s.display_name || ' · ' || s.material_code COLLATE NOCASE
WHERE NOT EXISTS (
  SELECT 1 FROM product_variants v WHERE v.sku = s.material_code COLLATE NOCASE
);

UPDATE product_variants
SET quantity_on_hand = (
      SELECT s.quantity FROM _migration_0006_products s
      WHERE s.material_code = product_variants.sku COLLATE NOCASE
    ),
    active = 1,
    serial_tracking = 1,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE EXISTS (
  SELECT 1 FROM _migration_0006_products s
  WHERE s.material_code = product_variants.sku COLLATE NOCASE
);

UPDATE product_variants
SET quantity_on_hand = 0,
    active = 0,
    serial_tracking = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE sku IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM _migration_0006_products s
    WHERE s.material_code = product_variants.sku COLLATE NOCASE
  );

UPDATE products
SET active = CASE WHEN EXISTS (
      SELECT 1 FROM product_variants v WHERE v.product_id = products.id AND v.active = 1
    ) THEN 1 ELSE 0 END,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');

INSERT INTO inventory_serials (variant_id, serial_number)
SELECT v.id, s.serial_number
FROM _migration_0006_serials s
JOIN product_variants v ON v.sku = s.material_code COLLATE NOCASE;

CREATE TRIGGER serial_assignment_requires_available
BEFORE INSERT ON request_serial_assignments
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1
  FROM inventory_serials s
  JOIN withdrawal_requests r ON r.id = NEW.request_id AND r.status = 'pending'
  JOIN withdrawal_quantity_items i
    ON i.request_id = NEW.request_id AND i.variant_id = NEW.variant_id
  JOIN product_variants v ON v.id = NEW.variant_id AND v.serial_tracking = 1
  WHERE s.id = NEW.serial_id
    AND s.variant_id = NEW.variant_id
    AND s.status = 'available'
    AND s.serial_number = NEW.serial_number_snapshot COLLATE NOCASE
    AND (
      SELECT COUNT(*) FROM request_serial_assignments a
      WHERE a.request_id = NEW.request_id AND a.variant_id = NEW.variant_id
    ) < i.quantity
)
BEGIN
  SELECT RAISE(ABORT, 'SERIAL_NOT_AVAILABLE');
END;

CREATE TRIGGER approval_requires_serial_selection
BEFORE UPDATE OF status ON withdrawal_requests
FOR EACH ROW
WHEN NEW.status = 'approved' AND (
  EXISTS (
    SELECT 1
    FROM withdrawal_quantity_items i
    JOIN product_variants v ON v.id = i.variant_id AND v.serial_tracking = 1
    WHERE i.request_id = NEW.id
      AND (
        SELECT COUNT(*) FROM request_serial_assignments a
        WHERE a.request_id = NEW.id AND a.variant_id = i.variant_id
      ) <> i.quantity
  )
  OR EXISTS (
    SELECT 1
    FROM request_serial_assignments a
    JOIN inventory_serials s ON s.id = a.serial_id
    WHERE a.request_id = NEW.id
      AND (s.status <> 'available' OR s.variant_id <> a.variant_id)
  )
)
BEGIN
  SELECT RAISE(ABORT, 'SERIAL_SELECTION_MISMATCH');
END;

CREATE TRIGGER approved_request_withdraws_serials
AFTER UPDATE OF status ON withdrawal_requests
FOR EACH ROW
WHEN NEW.status = 'approved'
BEGIN
  UPDATE inventory_serials
  SET status = 'withdrawn',
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id IN (
    SELECT serial_id FROM request_serial_assignments WHERE request_id = NEW.id
  );
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

CREATE INDEX idx_inventory_serials_variant_status
  ON inventory_serials(variant_id, status, serial_number);
CREATE INDEX idx_request_serial_assignments_request
  ON request_serial_assignments(request_id, variant_id);

DROP TABLE _migration_0006_guard;
DROP TABLE _migration_0006_serials;
DROP TABLE _migration_0006_products;
`;

const migrationPath = resolve(projectRoot, 'migrations/0006_serialized_inventory.sql');
await writeFile(migrationPath, migration);
console.log(`Gerados ${inventory.length} materiais, ${total} unidades e ${allSerials.size} números de série.`);
