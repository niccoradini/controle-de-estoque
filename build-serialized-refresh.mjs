import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brandFor, categoryFor, clusterFor, simplifyName, sqlText } from './build-material-inventory.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = process.argv[2];

if (!sourcePath) {
  throw new Error('Uso: node scripts/build-serialized-refresh.mjs caminho/basis-serial-stock.json');
}

const source = JSON.parse(await readFile(resolve(sourcePath), 'utf8'));
if (!Array.isArray(source.rows)) throw new Error('O arquivo de origem não contém a lista de unidades.');
if (!source.excludedDeposits?.includes('RPAR')) throw new Error('A origem não confirma a exclusão do depósito RPAR.');
if (Number(source.excludedRowCount) !== 110) throw new Error(`Esperadas 110 linhas excluídas de RPAR, encontradas ${source.excludedRowCount}.`);

const byMaterial = new Map();
const allSerials = new Set();
for (const [index, row] of source.rows.entries()) {
  const materialCode = String(row.material || '').trim();
  const technicalName = String(row.technicalName || '').trim();
  const serialNumber = String(row.serialNumber || '').trim();
  if (!materialCode || !technicalName || !serialNumber) throw new Error(`Linha ${index + 2} incompleta.`);
  const serialKey = serialNumber.toLocaleLowerCase('pt-BR');
  if (allSerials.has(serialKey)) throw new Error(`Número de série duplicado: ${serialNumber}.`);
  allSerials.add(serialKey);
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
if (inventory.length !== 287) throw new Error(`Esperados 287 materiais, encontrados ${inventory.length}.`);
if (total !== 1000) throw new Error(`Esperadas 1.000 unidades, encontradas ${total}.`);
if (allSerials.size !== total) throw new Error('A quantidade de números de série não confere.');

const dataPath = resolve(projectRoot, 'data/inventory-serialized-2026-07-29-v2-excluding-rpar.json');
await mkdir(dirname(dataPath), { recursive: true });
await writeFile(dataPath, `${JSON.stringify({
  importedAt: '2026-07-29',
  source: source.source || 'Planilha em Basis (1)(2).xlsx',
  excludedDeposits: ['RPAR'],
  excludedRowCount: Number(source.excludedRowCount),
  productCount: inventory.length,
  totalQuantity: total,
  serialCount: allSerials.size,
  products: inventory,
}, null, 2)}\n`);

const productValues = inventory.map((item, index) => `  (${sqlText(item.materialCode)}, ${sqlText(item.displayName)}, ${sqlText(item.technicalName)}, ${sqlText(item.brand)}, ${sqlText(item.category)}, ${sqlText(item.cluster)}, ${item.quantity}, ${index + 1})`).join(',\n');
const serialValues = inventory.flatMap((item) => item.serialNumbers.map((serialNumber) => `  (${sqlText(item.materialCode)}, ${sqlText(serialNumber)})`)).join(',\n');

const migration = `PRAGMA foreign_keys = ON;

-- Segunda atualização do retrato completo do estoque em 29/07/2026.
-- Exclui todas as unidades do depósito RPAR e preserva usuários, sessões, pedidos e histórico.
DROP TRIGGER IF EXISTS quantity_stock_cannot_cross_reservations;

CREATE TABLE _migration_0009_products (
  material_code TEXT PRIMARY KEY COLLATE NOCASE,
  display_name TEXT NOT NULL,
  technical_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  cluster TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  sort_order INTEGER NOT NULL
);

INSERT INTO _migration_0009_products
  (material_code, display_name, technical_name, brand, category, cluster, quantity, sort_order)
VALUES
${productValues};

CREATE TABLE _migration_0009_serials (
  material_code TEXT NOT NULL COLLATE NOCASE,
  serial_number TEXT PRIMARY KEY COLLATE NOCASE
);

INSERT INTO _migration_0009_serials (material_code, serial_number)
VALUES
${serialValues};

CREATE TABLE _migration_0009_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);

INSERT INTO _migration_0009_guard (valid)
SELECT CASE
  WHEN (SELECT COUNT(*) FROM _migration_0009_products) = 287
   AND (SELECT SUM(quantity) FROM _migration_0009_products) = 1000
   AND (SELECT COUNT(*) FROM _migration_0009_serials) = 1000
  THEN 1 ELSE 0 END;

UPDATE products
SET name = (
      SELECT s.display_name || ' · ' || s.material_code
      FROM product_variants v
      JOIN _migration_0009_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id
      LIMIT 1
    ),
    display_name = (
      SELECT s.display_name FROM product_variants v
      JOIN _migration_0009_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    technical_name = (
      SELECT s.technical_name FROM product_variants v
      JOIN _migration_0009_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    brand = (
      SELECT s.brand FROM product_variants v
      JOIN _migration_0009_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    category = (
      SELECT s.category FROM product_variants v
      JOIN _migration_0009_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    cluster = (
      SELECT s.cluster FROM product_variants v
      JOIN _migration_0009_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    sort_order = (
      SELECT s.sort_order FROM product_variants v
      JOIN _migration_0009_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    active = 1,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE EXISTS (
  SELECT 1 FROM product_variants v
  JOIN _migration_0009_products s ON s.material_code = v.sku COLLATE NOCASE
  WHERE v.product_id = products.id
);

INSERT INTO products
  (name, display_name, technical_name, brand, category, cluster,
   option1_label, option2_label, option3_label, presets_json, active, sort_order)
SELECT s.display_name || ' · ' || s.material_code,
       s.display_name, s.technical_name, s.brand, s.category, s.cluster,
       '', '', '', '{}', 1, s.sort_order
FROM _migration_0009_products s
WHERE NOT EXISTS (
  SELECT 1 FROM product_variants v WHERE v.sku = s.material_code COLLATE NOCASE
);

INSERT INTO product_variants
  (product_id, option1_value, option2_value, option3_value, sku, stock_mode,
   quantity_on_hand, active, serial_tracking)
SELECT p.id, '', '', '', s.material_code, 'quantity', 0, 1, 1
FROM _migration_0009_products s
JOIN products p ON p.name = s.display_name || ' · ' || s.material_code COLLATE NOCASE
WHERE NOT EXISTS (
  SELECT 1 FROM product_variants v WHERE v.sku = s.material_code COLLATE NOCASE
);

UPDATE product_variants
SET active = 1,
    serial_tracking = 1,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE EXISTS (
  SELECT 1 FROM _migration_0009_products s
  WHERE s.material_code = product_variants.sku COLLATE NOCASE
);

UPDATE product_variants
SET quantity_on_hand = 0,
    active = 0,
    serial_tracking = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE sku IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM _migration_0009_products s
    WHERE s.material_code = product_variants.sku COLLATE NOCASE
  );

UPDATE products
SET active = CASE WHEN EXISTS (
      SELECT 1 FROM product_variants v WHERE v.product_id = products.id AND v.active = 1
    ) THEN 1 ELSE 0 END,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now');

UPDATE inventory_serials
SET status = 'withdrawn',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE status = 'available'
  AND NOT EXISTS (
    SELECT 1 FROM _migration_0009_serials s
    WHERE s.serial_number = inventory_serials.serial_number COLLATE NOCASE
  );

UPDATE inventory_serials
SET variant_id = (
      SELECT v.id
      FROM _migration_0009_serials s
      JOIN product_variants v ON v.sku = s.material_code COLLATE NOCASE
      WHERE s.serial_number = inventory_serials.serial_number COLLATE NOCASE
    ),
    status = 'available',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE EXISTS (
    SELECT 1 FROM _migration_0009_serials s
    WHERE s.serial_number = inventory_serials.serial_number COLLATE NOCASE
  )
  AND NOT EXISTS (
    SELECT 1 FROM request_serial_assignments a
    WHERE a.serial_id = inventory_serials.id
  );

INSERT INTO inventory_serials (variant_id, serial_number, status)
SELECT v.id, s.serial_number, 'available'
FROM _migration_0009_serials s
JOIN product_variants v ON v.sku = s.material_code COLLATE NOCASE
WHERE NOT EXISTS (
  SELECT 1 FROM inventory_serials i
  WHERE i.serial_number = s.serial_number COLLATE NOCASE
);

UPDATE product_variants
SET quantity_on_hand = (
      SELECT COUNT(*) FROM inventory_serials i
      WHERE i.variant_id = product_variants.id AND i.status = 'available'
    ),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE serial_tracking = 1;

INSERT INTO system_state (key, value)
VALUES
  ('inventory_snapshot_date', '2026-07-29'),
  ('inventory_snapshot_source', 'Planilha em Basis (1)(2).xlsx'),
  ('inventory_snapshot_excluded_depots', 'RPAR')
ON CONFLICT(key) DO UPDATE SET value = excluded.value;

CREATE TRIGGER quantity_stock_cannot_cross_reservations
BEFORE UPDATE OF quantity_on_hand ON product_variants
FOR EACH ROW
WHEN NEW.quantity_on_hand < 0 OR NEW.quantity_on_hand < COALESCE((
  SELECT SUM(quantity) FROM active_quantity_reservations WHERE variant_id = NEW.id
), 0)
BEGIN
  SELECT RAISE(ABORT, 'QUANTITY_BELOW_RESERVED');
END;

DROP TABLE _migration_0009_guard;
DROP TABLE _migration_0009_serials;
DROP TABLE _migration_0009_products;
`;

const migrationPath = resolve(projectRoot, 'migrations/0009_inventory_refresh_2026_07_29_v2.sql');
await writeFile(migrationPath, migration);

const clusters = Object.fromEntries(
  [...inventory.reduce((map, item) => {
    const current = map.get(item.cluster) || { products: 0, units: 0 };
    current.products += 1;
    current.units += item.quantity;
    map.set(item.cluster, current);
    return map;
  }, new Map())].sort(([a], [b]) => a.localeCompare(b)),
);
console.log(JSON.stringify({
  products: inventory.length,
  units: total,
  serials: allSerials.size,
  excludedRpar: Number(source.excludedRowCount),
  clusters,
  files: { dataPath, migrationPath },
}, null, 2));
