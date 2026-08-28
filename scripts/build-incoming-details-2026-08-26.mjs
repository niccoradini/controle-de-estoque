import { readFile, writeFile } from 'node:fs/promises';

const sourcePath = process.argv[2] || 'data/basis-serial-stock-2026-08-26-excluding-rpar-with-incoming.json';
const migrationNumber = String(Number(process.argv[3] || 59)).padStart(4, '0');
const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const sqlText = (value) => `'${String(value ?? '').replaceAll("'", "''")}'`;
if (!Array.isArray(source.incomingRows)) {
  throw new Error('A origem precisa conter a lista de itens em entrega.');
}
if (source.incomingRows.some((row) => !/^\d{4}-\d{2}-\d{2}$/.test(row.modifiedOn || ''))) {
  throw new Error('Todos os itens em entrega precisam ter uma data de modificação válida.');
}
const serials = new Set(source.incomingRows.map((row) => String(row.serialNumber).toLowerCase()));
if (serials.size !== source.incomingRows.length) throw new Error('Existem séries duplicadas em entrega.');

const values = source.incomingRows.map((row) => `  (${sqlText(row.serialNumber)}, ${sqlText(row.material)}, ${sqlText(row.technicalName)}, ${sqlText(row.center)}, ${sqlText(row.deposit)}, ${sqlText(row.stockType)}, ${sqlText(row.systemStatus)}, ${Number(row.sourceRow)}, ${sqlText(source.importedAt)}, ${sqlText(source.source)}, ${sqlText(row.modifiedOn)})`).join(',\n');
const materials = new Set(source.incomingRows.map((row) => row.material)).size;
const migration = `PRAGMA foreign_keys = ON;

-- Detalhamento serializado e datas dos produtos a caminho em ${source.importedAt}.
DELETE FROM incoming_inventory_serials;

INSERT INTO incoming_inventory_serials
  (serial_number, material_code, technical_name, center, deposit, stock_type,
   system_status, source_row, snapshot_date, source_file, delivery_started_on)
VALUES
${values};

CREATE TABLE _migration_${migrationNumber}_guard (valid INTEGER NOT NULL CHECK (valid = 1));
INSERT INTO _migration_${migrationNumber}_guard (valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM incoming_inventory_serials) = ${source.incomingRows.length}
  AND (SELECT COUNT(DISTINCT material_code) FROM incoming_inventory_serials) = ${materials}
  AND (SELECT COUNT(*) FROM incoming_inventory_serials WHERE delivery_started_on GLOB '????-??-??') = ${source.incomingRows.length}
  THEN 1 ELSE 0 END;
DROP TABLE _migration_${migrationNumber}_guard;
`;

const snapshotDatePath = String(source.importedAt).replaceAll('-', '_');
await writeFile(`migrations/${migrationNumber}_incoming_inventory_details_${snapshotDatePath}.sql`, migration);
console.log(JSON.stringify({
  units: source.incomingRows.length,
  materials,
  dates: new Set(source.incomingRows.map((row) => row.modifiedOn)).size,
}));
