import { readFile, writeFile } from 'node:fs/promises';
import { brandFor, categoryFor, clusterFor, simplifyName, sqlText } from './build-material-inventory.mjs';

const sourcePath = process.argv[2];
const migrationNumber = String(Number(process.argv[3] || 62)).padStart(4, '0');
const templatePath = process.argv[4] || 'migrations/0058_inventory_refresh_2026_08_28.sql';
if (!sourcePath) throw new Error('Uso: node scripts/build-inventory-refresh.mjs dados.json numero_migracao [modelo.sql]');

const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const template = await readFile(templatePath, 'utf8');
if (!Array.isArray(source.rows) || !Array.isArray(source.incomingRows) || !Array.isArray(source.repairRows)) {
  throw new Error('A origem precisa conter itens disponíveis, em entrega e em reparo.');
}
const allRows = [...source.rows, ...source.incomingRows];
const byMaterial = new Map();
for (const row of allRows) {
  const materialCode = String(row.material).trim();
  const technicalName = String(row.technicalName).trim();
  if (!byMaterial.has(materialCode)) byMaterial.set(materialCode, { technicalNames: new Set(), available: [], incoming: [] });
  const group = byMaterial.get(materialCode);
  group.technicalNames.add(technicalName);
  (row.systemStatus === 'DEPS NREM' ? group.incoming : group.available).push(row);
}

const products = [...byMaterial].map(([materialCode, group]) => {
  if (group.technicalNames.size !== 1) throw new Error(`O material ${materialCode} possui denominações diferentes.`);
  const technicalName = [...group.technicalNames][0];
  const displayName = simplifyName(technicalName);
  const category = categoryFor(displayName);
  const incomingQuantity = group.incoming.length;
  return {
    materialCode, technicalName, displayName, category,
    cluster: clusterFor(displayName, category), brand: brandFor(displayName),
    quantity: group.available.length, incomingQuantity,
    incomingDepositsJson: incomingQuantity ? JSON.stringify({ 'DEPS NREM': incomingQuantity }) : '{}',
  };
}).sort((left, right) => left.displayName.localeCompare(right.displayName, 'pt-BR') || left.materialCode.localeCompare(right.materialCode, 'pt-BR'));

const available = source.rows.length;
const incoming = source.incomingRows.length;
const serials = new Set(source.rows.map((row) => String(row.serialNumber).toLowerCase()));
if (serials.size !== available) throw new Error('Existem séries disponíveis duplicadas.');
if (products.length !== Number(source.expectedProductCount)) throw new Error('A quantidade de materiais não confere.');
if (available !== Number(source.expectedAvailableQuantity)) throw new Error('A quantidade disponível não confere.');
if (incoming !== Number(source.incomingRowCount)) throw new Error('A quantidade em entrega não confere.');
if (source.repairRows.length !== Number(source.excludedRowCount)) throw new Error('A quantidade em reparo não confere.');

const repairValues = source.repairRows.map((row) => `  (${sqlText(row.serialNumber)}, ${sqlText(row.material)}, ${sqlText(row.technicalName)}, ${sqlText(row.center)}, 'RPAR', ${sqlText(source.importedAt)})`).join(',\n');
const productValues = products.map((item, index) => `  (${sqlText(item.materialCode)}, ${sqlText(item.displayName)}, ${sqlText(item.technicalName)}, ${sqlText(item.brand)}, ${sqlText(item.category)}, ${sqlText(item.cluster)}, ${item.quantity}, ${item.incomingQuantity}, ${sqlText(item.incomingDepositsJson)}, ${index + 1})`).join(',\n');
const serialValues = source.rows.map((row) => `  (${sqlText(row.material)}, ${sqlText(row.serialNumber)})`).join(',\n');

let migration = template
  .replaceAll('_migration_0058', `_migration_${migrationNumber}`)
  .replaceAll('migration-0058', `migration-${migrationNumber}`)
  .replaceAll('28/08/2026', source.importedAt.split('-').reverse().join('/'))
  .replaceAll('2026-08-28', source.importedAt)
  .replaceAll('ESTOQUE28.08.xlsx', source.source)
  .replace(
    /(INSERT INTO repair_inventory\s+\(serial_number, material_code, technical_name, center, deposit, snapshot_date\)\s+VALUES\n)[\s\S]*?(;\n\nDROP TRIGGER)/,
    `$1${repairValues}$2`,
  )
  .replace(
    /(INSERT INTO _migration_\d{4}_products\s+\(material_code, display_name, technical_name, brand, category, cluster,\s+quantity, incoming_quantity, incoming_deposits_json, sort_order\)\s+VALUES\n)[\s\S]*?(;\n\nCREATE TABLE _migration_\d{4}_serials)/,
    `$1${productValues}$2`,
  )
  .replace(
    /(INSERT INTO _migration_\d{4}_serials \(material_code, serial_number\)\s+VALUES\n)[\s\S]*?(;\n\nCREATE TABLE _migration_\d{4}_guard)/,
    `$1${serialValues}$2`,
  )
  .replace(/WHEN \(SELECT COUNT\(\*\) FROM _migration_\d{4}_products\) = \d+/, `WHEN (SELECT COUNT(*) FROM _migration_${migrationNumber}_products) = ${products.length}`)
  .replace(/AND \(SELECT SUM\(quantity\) FROM _migration_\d{4}_products\) = \d+/, `AND (SELECT SUM(quantity) FROM _migration_${migrationNumber}_products) = ${available}`)
  .replace(/AND \(SELECT SUM\(incoming_quantity\) FROM _migration_\d{4}_products\) = \d+/, `AND (SELECT SUM(incoming_quantity) FROM _migration_${migrationNumber}_products) = ${incoming}`)
  .replace(/AND \(SELECT COUNT\(\*\) FROM _migration_\d{4}_serials\) = \d+/, `AND (SELECT COUNT(*) FROM _migration_${migrationNumber}_serials) = ${available}`)
  .replace(/\('inventory_snapshot_incoming_units', '\d+'\)/, `('inventory_snapshot_incoming_units', '${incoming}')`);

if (migration.includes('_migration_0058') || migration.includes('ESTOQUE28.08.xlsx')) throw new Error('O modelo não foi atualizado por completo.');
const migrationPath = `migrations/${migrationNumber}_inventory_refresh_${source.importedAt.replaceAll('-', '_')}.sql`;
await writeFile(migrationPath, migration);
console.log(JSON.stringify({ migrationPath, products: products.length, available, incoming, repair: source.repairRows.length }));
