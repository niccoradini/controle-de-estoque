import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brandFor, categoryFor, clusterFor, simplifyName, sqlText } from './build-material-inventory.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = process.argv[2];

if (!sourcePath) {
  throw new Error('Uso: node scripts/build-management-refresh.mjs caminho/basis-serial-stock.json');
}

const source = JSON.parse(await readFile(resolve(sourcePath), 'utf8'));
if (!Array.isArray(source.rows) || !Array.isArray(source.incomingRows) || !Array.isArray(source.repairRows)) {
  throw new Error('O arquivo de origem não contém as listas de estoque.');
}
if (!source.excludedDeposits?.includes('RPAR')) {
  throw new Error('A origem não confirma a exclusão do depósito RPAR.');
}
if (!source.incomingDeposits?.includes('DEPS') || !source.incomingDeposits?.includes('NREM')) {
  throw new Error('A origem não identifica DEPS e NREM como depósitos em entrega.');
}

const snapshotDate = String(source.importedAt || '').trim();
if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshotDate)) {
  throw new Error('A origem não contém importedAt no formato AAAA-MM-DD.');
}
const snapshotDatePath = snapshotDate.replaceAll('-', '_');
const migrationNumber = String(Number(source.migrationNumber || 12)).padStart(4, '0');
const temporaryPrefix = `_migration_${migrationNumber}`;
const expectedProductCount = Number(source.expectedProductCount ?? new Set(
  [...source.rows, ...source.incomingRows].map((row) => String(row.material || '').trim()),
).size);
const expectedAvailableQuantity = Number(source.expectedAvailableQuantity ?? source.rows.length);
const expectedExcludedRowCount = Number(source.expectedExcludedRowCount ?? source.excludedRowCount);
if (![expectedProductCount, expectedAvailableQuantity, expectedExcludedRowCount].every(Number.isInteger)) {
  throw new Error('A origem não contém os totais esperados para validação.');
}

const sourceDataPath = resolve(projectRoot, `data/basis-serial-stock-${snapshotDate}-excluding-rpar-with-incoming.json`);
await mkdir(dirname(sourceDataPath), { recursive: true });
await writeFile(sourceDataPath, `${JSON.stringify(source, null, 2)}\n`);

const availableByMaterial = new Map();
const incomingByMaterial = new Map();
const technicalNamesByMaterial = new Map();
const allSerials = new Set();

function validateAndRegisterRow(row, index, kind) {
  const materialCode = String(row.material || '').trim();
  const technicalName = String(row.technicalName || '').trim();
  const serialNumber = String(row.serialNumber || '').trim();
  const deposit = String(row.deposit || '').trim().toUpperCase();
  if (!materialCode || !technicalName || !serialNumber || !deposit) {
    throw new Error(`Linha ${index + 2} (${kind}) incompleta.`);
  }
  const serialKey = serialNumber.toLocaleLowerCase('pt-BR');
  if (allSerials.has(serialKey)) throw new Error(`Número de série duplicado: ${serialNumber}.`);
  allSerials.add(serialKey);
  if (!technicalNamesByMaterial.has(materialCode)) technicalNamesByMaterial.set(materialCode, new Set());
  technicalNamesByMaterial.get(materialCode).add(technicalName);
  return { materialCode, technicalName, serialNumber, deposit };
}

for (const [index, row] of source.rows.entries()) {
  const parsed = validateAndRegisterRow(row, index, 'disponível');
  const availableStatus = String(row.systemStatus || '').trim().toUpperCase();
  if (Array.isArray(source.availableStatuses) && source.availableStatuses.length > 0) {
    if (!source.availableStatuses.includes(availableStatus)) {
      throw new Error(`O status ${availableStatus || '(vazio)'} não está configurado como disponível.`);
    }
  } else if (source.excludedDeposits.includes(parsed.deposit) || source.incomingDeposits.includes(parsed.deposit)) {
    throw new Error(`O depósito ${parsed.deposit} foi incluído incorretamente no estoque disponível.`);
  }
  if (!availableByMaterial.has(parsed.materialCode)) availableByMaterial.set(parsed.materialCode, []);
  availableByMaterial.get(parsed.materialCode).push(parsed.serialNumber);
}

for (const [index, row] of source.incomingRows.entries()) {
  const parsed = validateAndRegisterRow(row, index, 'em entrega');
  const incomingStatus = String(row.systemStatus || '').trim().toUpperCase();
  if (Array.isArray(source.incomingStatuses) && source.incomingStatuses.length > 0) {
    if (!source.incomingStatuses.includes(incomingStatus) || !/(^|\s)NREM($|\s)/.test(incomingStatus)) {
      throw new Error(`O status ${incomingStatus || '(vazio)'} não está configurado como em entrega.`);
    }
  } else if (!source.incomingDeposits.includes(parsed.deposit)) {
    throw new Error(`O depósito ${parsed.deposit} não está configurado como em entrega.`);
  }
  if (!incomingByMaterial.has(parsed.materialCode)) {
    incomingByMaterial.set(parsed.materialCode, { serialNumbers: [], deposits: new Map() });
  }
  const group = incomingByMaterial.get(parsed.materialCode);
  group.serialNumbers.push(parsed.serialNumber);
  const incomingLabel = incomingStatus || parsed.deposit;
  group.deposits.set(incomingLabel, (group.deposits.get(incomingLabel) || 0) + 1);
}

const materialCodes = new Set([...availableByMaterial.keys(), ...incomingByMaterial.keys()]);
const inventory = [...materialCodes].map((materialCode) => {
  const technicalNames = technicalNamesByMaterial.get(materialCode) || new Set();
  if (technicalNames.size !== 1) throw new Error(`O material ${materialCode} possui nomes diferentes.`);
  const technicalName = [...technicalNames][0];
  const displayName = simplifyName(technicalName);
  const category = categoryFor(displayName);
  const serialNumbers = (availableByMaterial.get(materialCode) || [])
    .sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  const incomingGroup = incomingByMaterial.get(materialCode);
  return {
    materialCode,
    displayName,
    technicalName,
    category,
    cluster: clusterFor(displayName, category),
    brand: brandFor(displayName),
    quantity: serialNumbers.length,
    serialNumbers,
    incomingQuantity: incomingGroup?.serialNumbers.length || 0,
    incomingDeposits: Object.fromEntries(
      [...(incomingGroup?.deposits || new Map())].sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
}).sort((a, b) => a.displayName.localeCompare(b.displayName, 'pt-BR')
  || a.materialCode.localeCompare(b.materialCode));

const availableTotal = inventory.reduce((sum, item) => sum + item.quantity, 0);
const incomingTotal = inventory.reduce((sum, item) => sum + item.incomingQuantity, 0);
const availableSerialCount = inventory.reduce((sum, item) => sum + item.serialNumbers.length, 0);
if (inventory.length !== expectedProductCount) {
  throw new Error(`Esperados ${expectedProductCount} materiais, encontrados ${inventory.length}.`);
}
if (availableTotal !== expectedAvailableQuantity) {
  throw new Error(`Esperadas ${expectedAvailableQuantity} unidades disponíveis, encontradas ${availableTotal}.`);
}
if (incomingTotal !== Number(source.incomingRowCount)) {
  throw new Error(`O total em entrega não confere: ${incomingTotal}.`);
}
if (Number(source.excludedRowCount) !== expectedExcludedRowCount) {
  throw new Error(`Esperadas ${expectedExcludedRowCount} linhas RPAR excluídas, encontradas ${source.excludedRowCount}.`);
}
if (availableSerialCount + incomingTotal !== allSerials.size) {
  throw new Error('A quantidade de números de série não confere.');
}

const dataPath = resolve(projectRoot, `data/inventory-serialized-${snapshotDate}-excluding-rpar-with-incoming.json`);
await mkdir(dirname(dataPath), { recursive: true });
await writeFile(dataPath, `${JSON.stringify({
  importedAt: snapshotDate,
  source: source.source,
  excludedDeposits: source.excludedDeposits,
  excludedRowCount: Number(source.excludedRowCount),
  incomingDeposits: source.incomingDeposits,
  incomingQuantity: incomingTotal,
  productCount: inventory.length,
  availableQuantity: availableTotal,
  serialCount: allSerials.size,
  products: inventory,
}, null, 2)}\n`);

const productValues = inventory.map((item, index) => `  (${sqlText(item.materialCode)}, ${sqlText(item.displayName)}, ${sqlText(item.technicalName)}, ${sqlText(item.brand)}, ${sqlText(item.category)}, ${sqlText(item.cluster)}, ${item.quantity}, ${item.incomingQuantity}, ${sqlText(JSON.stringify(item.incomingDeposits))}, ${index + 1})`).join(',\n');
const serialValues = inventory
  .flatMap((item) => item.serialNumbers.map((serialNumber) => `  (${sqlText(item.materialCode)}, ${sqlText(serialNumber)})`))
  .join(',\n');
const repairValues = source.repairRows.map((row) => `  (${sqlText(String(row.serialNumber).trim())}, ${sqlText(String(row.material).trim())}, ${sqlText(String(row.technicalName).trim())}, ${sqlText(String(row.center).trim())}, 'RPAR', '${snapshotDate}')`).join(',\n');

const migrationTemplate = `PRAGMA foreign_keys = ON;

-- Atualização do retrato do estoque em ${snapshotDate.split('-').reverse().join('/')}.
-- Exclui RPAR, separa DEPS/NREM como itens em entrega e preserva usuários, sessões,
-- pedidos, cancelamentos, números de série já retirados e todo o histórico.

CREATE TABLE IF NOT EXISTS repair_inventory (
  serial_number TEXT PRIMARY KEY COLLATE NOCASE,
  material_code TEXT NOT NULL COLLATE NOCASE,
  technical_name TEXT NOT NULL,
  center TEXT NOT NULL,
  deposit TEXT NOT NULL CHECK (deposit = 'RPAR'),
  snapshot_date TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_repair_inventory_material
ON repair_inventory (material_code, technical_name);

DELETE FROM repair_inventory;

INSERT INTO repair_inventory
  (serial_number, material_code, technical_name, center, deposit, snapshot_date)
VALUES
${repairValues};

DROP TRIGGER IF EXISTS quantity_stock_cannot_cross_reservations;

CREATE TABLE _migration_0010_previous_active (
  material_code TEXT PRIMARY KEY COLLATE NOCASE
);

INSERT INTO _migration_0010_previous_active (material_code)
SELECT sku
FROM product_variants
WHERE active = 1 AND sku IS NOT NULL AND trim(sku) <> '';

CREATE TABLE _migration_0010_products (
  material_code TEXT PRIMARY KEY COLLATE NOCASE,
  display_name TEXT NOT NULL,
  technical_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
  cluster TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  incoming_quantity INTEGER NOT NULL CHECK (incoming_quantity >= 0),
  incoming_deposits_json TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

INSERT INTO _migration_0010_products
  (material_code, display_name, technical_name, brand, category, cluster,
   quantity, incoming_quantity, incoming_deposits_json, sort_order)
VALUES
${productValues};

CREATE TABLE _migration_0010_serials (
  material_code TEXT NOT NULL COLLATE NOCASE,
  serial_number TEXT PRIMARY KEY COLLATE NOCASE
);

INSERT INTO _migration_0010_serials (material_code, serial_number)
VALUES
${serialValues};

CREATE TABLE _migration_0010_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);

INSERT INTO _migration_0010_guard (valid)
SELECT CASE
  WHEN (SELECT COUNT(*) FROM _migration_0010_products) = ${inventory.length}
   AND (SELECT SUM(quantity) FROM _migration_0010_products) = ${availableTotal}
   AND (SELECT SUM(incoming_quantity) FROM _migration_0010_products) = ${incomingTotal}
   AND (SELECT COUNT(*) FROM _migration_0010_serials) = ${availableTotal}
  THEN 1 ELSE 0 END;

UPDATE products
SET name = (
      SELECT s.display_name || ' · ' || s.material_code
      FROM product_variants v
      JOIN _migration_0010_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    display_name = (
      SELECT s.display_name FROM product_variants v
      JOIN _migration_0010_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    technical_name = (
      SELECT s.technical_name FROM product_variants v
      JOIN _migration_0010_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    brand = (
      SELECT s.brand FROM product_variants v
      JOIN _migration_0010_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    category = (
      SELECT s.category FROM product_variants v
      JOIN _migration_0010_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    cluster = (
      SELECT s.cluster FROM product_variants v
      JOIN _migration_0010_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    sort_order = (
      SELECT s.sort_order FROM product_variants v
      JOIN _migration_0010_products s ON s.material_code = v.sku COLLATE NOCASE
      WHERE v.product_id = products.id LIMIT 1
    ),
    active = 1,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE EXISTS (
  SELECT 1 FROM product_variants v
  JOIN _migration_0010_products s ON s.material_code = v.sku COLLATE NOCASE
  WHERE v.product_id = products.id
);

INSERT INTO products
  (name, display_name, technical_name, brand, category, cluster,
   option1_label, option2_label, option3_label, presets_json, active, sort_order)
SELECT s.display_name || ' · ' || s.material_code,
       s.display_name, s.technical_name, s.brand, s.category, s.cluster,
       '', '', '', '{}', 1, s.sort_order
FROM _migration_0010_products s
WHERE NOT EXISTS (
  SELECT 1 FROM product_variants v WHERE v.sku = s.material_code COLLATE NOCASE
);

INSERT INTO product_variants
  (product_id, option1_value, option2_value, option3_value, sku, stock_mode,
   quantity_on_hand, active, serial_tracking)
SELECT p.id, '', '', '', s.material_code, 'quantity', 0, 1, 1
FROM _migration_0010_products s
JOIN products p ON p.name = s.display_name || ' · ' || s.material_code COLLATE NOCASE
WHERE NOT EXISTS (
  SELECT 1 FROM product_variants v WHERE v.sku = s.material_code COLLATE NOCASE
);

UPDATE product_variants
SET active = 1,
    serial_tracking = 1,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE EXISTS (
    SELECT 1 FROM _migration_0010_products s
    WHERE s.material_code = product_variants.sku COLLATE NOCASE
  )
  OR EXISTS (
    SELECT 1 FROM _migration_0010_previous_active p
    WHERE p.material_code = product_variants.sku COLLATE NOCASE
  );

UPDATE product_variants
SET quantity_on_hand = 0,
    active = 0,
    serial_tracking = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE sku IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM _migration_0010_products s
    WHERE s.material_code = product_variants.sku COLLATE NOCASE
  )
  AND NOT EXISTS (
    SELECT 1 FROM _migration_0010_previous_active p
    WHERE p.material_code = product_variants.sku COLLATE NOCASE
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
    SELECT 1 FROM _migration_0010_serials s
    WHERE s.serial_number = inventory_serials.serial_number COLLATE NOCASE
  )
  AND NOT EXISTS (
    SELECT 1 FROM chips chip
    WHERE chip.inventory_serial_id = inventory_serials.id
      AND chip.active = 1
      AND chip.status = 'available'
  );

UPDATE inventory_serials
SET variant_id = (
      SELECT v.id
      FROM _migration_0010_serials s
      JOIN product_variants v ON v.sku = s.material_code COLLATE NOCASE
      WHERE s.serial_number = inventory_serials.serial_number COLLATE NOCASE
    ),
    status = 'available',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE EXISTS (
    SELECT 1 FROM _migration_0010_serials s
    WHERE s.serial_number = inventory_serials.serial_number COLLATE NOCASE
  )
  AND NOT EXISTS (
    SELECT 1 FROM request_serial_assignments a
    WHERE a.serial_id = inventory_serials.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM chips chip
    WHERE chip.inventory_serial_id = inventory_serials.id
      AND chip.status = 'sold'
  );

INSERT INTO inventory_serials (variant_id, serial_number, status)
SELECT v.id, s.serial_number, 'available'
FROM _migration_0010_serials s
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

DELETE FROM incoming_inventory;

INSERT INTO incoming_inventory (variant_id, quantity, deposits_json)
SELECT v.id, s.incoming_quantity, s.incoming_deposits_json
FROM _migration_0010_products s
JOIN product_variants v ON v.sku = s.material_code COLLATE NOCASE
WHERE s.incoming_quantity > 0;

-- Pedidos antigos que ainda estavam pendentes são resolvidos automaticamente.
DELETE FROM request_serial_assignments
WHERE request_id IN (
  SELECT id FROM withdrawal_requests WHERE status = 'pending'
);

CREATE TABLE _migration_0010_pending_requirements AS
SELECT r.id AS request_id,
       i.variant_id,
       i.quantity,
       COALESCE(SUM(i.quantity) OVER (
         PARTITION BY i.variant_id
         ORDER BY r.created_at, r.id
         ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
       ), 0) AS prior_quantity
FROM withdrawal_requests r
JOIN withdrawal_quantity_items i ON i.request_id = r.id
WHERE r.status = 'pending';

CREATE TABLE _migration_0010_ranked_serials AS
SELECT s.id AS serial_id,
       s.variant_id,
       s.serial_number,
       ROW_NUMBER() OVER (
         PARTITION BY s.variant_id ORDER BY s.serial_number COLLATE NOCASE
       ) AS serial_position
FROM inventory_serials s
WHERE s.status = 'available'
  AND NOT EXISTS (
    SELECT 1 FROM request_serial_assignments a WHERE a.serial_id = s.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM chips chip
    WHERE chip.inventory_serial_id = s.id
      AND chip.active = 1
      AND chip.status = 'available'
  );

CREATE TABLE _migration_0010_fulfillable_requests (
  request_id TEXT PRIMARY KEY
);

INSERT INTO _migration_0010_fulfillable_requests (request_id)
SELECT r.id
FROM withdrawal_requests r
WHERE r.status = 'pending'
  AND EXISTS (
    SELECT 1 FROM _migration_0010_pending_requirements q WHERE q.request_id = r.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM _migration_0010_pending_requirements q
    WHERE q.request_id = r.id
      AND (
        SELECT COUNT(*)
        FROM _migration_0010_ranked_serials s
        WHERE s.variant_id = q.variant_id
      ) < q.prior_quantity + q.quantity
  );

INSERT INTO request_serial_assignments
  (request_id, variant_id, serial_id, serial_number_snapshot)
SELECT q.request_id, q.variant_id, s.serial_id, s.serial_number
FROM _migration_0010_pending_requirements q
JOIN _migration_0010_fulfillable_requests f ON f.request_id = q.request_id
JOIN _migration_0010_ranked_serials s ON s.variant_id = q.variant_id
WHERE s.serial_position > q.prior_quantity
  AND s.serial_position <= q.prior_quantity + q.quantity;

INSERT INTO audit_logs
  (actor_user_id, action, entity_type, entity_id, details_json)
SELECT NULL, 'request.auto_approved', 'request', r.id,
       '{"source":"migration-0012","automatic":true}'
FROM withdrawal_requests r
JOIN _migration_0010_fulfillable_requests f ON f.request_id = r.id
WHERE r.status = 'pending';

UPDATE withdrawal_requests
SET status = 'approved',
    decision_note = 'Liberado automaticamente pelo sistema',
    decided_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    decided_by = NULL
WHERE status = 'pending'
  AND id IN (SELECT request_id FROM _migration_0010_fulfillable_requests);

INSERT INTO audit_logs
  (actor_user_id, action, entity_type, entity_id, details_json)
SELECT NULL, 'request.auto_rejected', 'request', r.id,
       '{"source":"migration-0012","reason":"insufficient_stock","automatic":true}'
FROM withdrawal_requests r
WHERE r.status = 'pending';

UPDATE withdrawal_requests
SET status = 'rejected',
    decision_note = 'Cancelado automaticamente por falta de estoque',
    decided_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    decided_by = NULL
WHERE status = 'pending';

INSERT INTO system_state (key, value)
VALUES
  ('inventory_snapshot_date', '2026-08-04'),
  ('inventory_snapshot_source', ${sqlText(source.source)}),
  ('inventory_snapshot_excluded_depots', 'RPAR'),
  ('inventory_snapshot_incoming_depots', 'DEPS,NREM'),
  ('inventory_snapshot_incoming_units', ${sqlText(String(incomingTotal))}),
  ('inventory_snapshot_available_depots', ${sqlText(source.availableDeposits.join(','))})
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

DROP TABLE _migration_0010_fulfillable_requests;
DROP TABLE _migration_0010_ranked_serials;
DROP TABLE _migration_0010_pending_requirements;
DROP TABLE _migration_0010_guard;
DROP TABLE _migration_0010_serials;
DROP TABLE _migration_0010_products;
DROP TABLE _migration_0010_previous_active;
`;

const migration = migrationTemplate
  .replace("('inventory_snapshot_date', '2026-08-04')", `('inventory_snapshot_date', '${snapshotDate}')`)
  .replaceAll('_migration_0010', temporaryPrefix)
  .replaceAll('migration-0012', `migration-${migrationNumber}`);
const migrationPath = resolve(projectRoot, `migrations/${migrationNumber}_inventory_refresh_${snapshotDatePath}.sql`);
await writeFile(migrationPath, migration);

const clusters = Object.fromEntries(
  [...inventory.reduce((map, item) => {
    const current = map.get(item.cluster) || { products: 0, available: 0, incoming: 0 };
    current.products += 1;
    current.available += item.quantity;
    current.incoming += item.incomingQuantity;
    map.set(item.cluster, current);
    return map;
  }, new Map())].sort(([a], [b]) => a.localeCompare(b)),
);

console.log(JSON.stringify({
  products: inventory.length,
  available: availableTotal,
  incoming: incomingTotal,
  serials: allSerials.size,
  excludedRpar: Number(source.excludedRowCount),
  clusters,
  files: { sourceDataPath, dataPath, migrationPath },
}, null, 2));
