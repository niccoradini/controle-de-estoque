import { readFile, writeFile } from 'node:fs/promises';
import { brandFor, clusterFor, simplifyName, sqlText } from './build-material-inventory.mjs';

const sourcePath = process.argv[2] || 'data/network-inventory-2026-08-29.json';
const migrationNumber = String(Number(process.argv[3] || 60)).padStart(4, '0');
const source = JSON.parse(await readFile(sourcePath, 'utf8'));
if (!Array.isArray(source.stores) || source.stores.length === 0) throw new Error('Nenhuma loja encontrada.');

const storeValues = [];
const itemValues = [];
const chunkedInsert = (values, size = 75) => {
  const statements = [];
  for (let index = 0; index < values.length; index += size) {
    statements.push(`INSERT INTO network_inventory
  (store_code, material_code, technical_name, display_name, brand, cluster,
   available_quantity, incoming_quantity, repair_quantity, ignored_quantity, latest_modified_on)
VALUES
${values.slice(index, index + size).join(',\n')};`);
  }
  return statements.join('\n\n');
};
for (const store of source.stores) {
  const totals = store.items.reduce((sum, item) => ({
    available: sum.available + Number(item.available),
    incoming: sum.incoming + Number(item.incoming),
    repair: sum.repair + Number(item.repair),
    ignored: sum.ignored + Number(item.ignored),
  }), { available: 0, incoming: 0, repair: 0, ignored: 0 });
  storeValues.push(`  (${sqlText(store.code)}, ${sqlText(store.name)}, ${sqlText(store.center)}, ${sqlText(store.snapshotDate)}, ${sqlText(store.sourceFile)}, ${store.sourceRows}, ${store.items.length}, ${totals.available}, ${totals.incoming}, ${totals.repair}, ${totals.ignored})`);
  for (const item of store.items) {
    const displayName = simplifyName(item.technicalName);
    itemValues.push(`  (${sqlText(store.code)}, ${sqlText(item.materialCode)}, ${sqlText(item.technicalName)}, ${sqlText(displayName)}, ${sqlText(brandFor(item.technicalName))}, ${sqlText(clusterFor(item.technicalName))}, ${Number(item.available)}, ${Number(item.incoming)}, ${Number(item.repair)}, ${Number(item.ignored)}, ${sqlText(item.latestModifiedOn)})`);
  }
}

const migration = `PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS network_stores (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  center TEXT NOT NULL,
  snapshot_date TEXT NOT NULL,
  source_file TEXT NOT NULL,
  total_units INTEGER NOT NULL,
  material_count INTEGER NOT NULL,
  available_units INTEGER NOT NULL,
  incoming_units INTEGER NOT NULL,
  repair_units INTEGER NOT NULL,
  ignored_units INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS network_inventory (
  store_code TEXT NOT NULL REFERENCES network_stores(code) ON DELETE CASCADE,
  material_code TEXT NOT NULL,
  technical_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  cluster TEXT NOT NULL,
  available_quantity INTEGER NOT NULL,
  incoming_quantity INTEGER NOT NULL,
  repair_quantity INTEGER NOT NULL,
  ignored_quantity INTEGER NOT NULL,
  latest_modified_on TEXT NOT NULL,
  PRIMARY KEY (store_code, material_code)
);

CREATE INDEX IF NOT EXISTS idx_network_inventory_cluster ON network_inventory (cluster, brand, display_name);

DELETE FROM network_inventory;
DELETE FROM network_stores;

INSERT INTO network_stores
  (code, name, center, snapshot_date, source_file, total_units, material_count,
   available_units, incoming_units, repair_units, ignored_units)
VALUES
${storeValues.join(',\n')};

${chunkedInsert(itemValues)}

CREATE TABLE _migration_${migrationNumber}_guard (valid INTEGER NOT NULL CHECK (valid = 1));
INSERT INTO _migration_${migrationNumber}_guard (valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM network_stores) = ${source.stores.length}
  AND (SELECT SUM(total_units) FROM network_stores) = ${source.stores.reduce((sum, store) => sum + store.sourceRows, 0)}
  AND (SELECT COUNT(*) FROM network_inventory) = ${source.stores.reduce((sum, store) => sum + store.items.length, 0)}
  THEN 1 ELSE 0 END;
DROP TABLE _migration_${migrationNumber}_guard;
`;

const migrationPath = `migrations/${migrationNumber}_network_inventory_2026_08_29.sql`;
await writeFile(migrationPath, migration);
console.log(JSON.stringify({ stores: source.stores.length, items: itemValues.length, migrationPath }));
