import { readFile, writeFile } from 'node:fs/promises';

const source = JSON.parse(await readFile('data/basis-serial-stock-2026-08-25-excluding-rpar-with-incoming.json', 'utf8'));
const sqlText = (value) => `'${String(value ?? '').replaceAll("'", "''")}'`;
if (!Array.isArray(source.incomingRows) || source.incomingRows.length !== 90) {
  throw new Error('A origem precisa conter exatamente 90 itens DEPS NREM.');
}
const serials = new Set(source.incomingRows.map((row) => String(row.serialNumber).toLowerCase()));
if (serials.size !== source.incomingRows.length) throw new Error('Existem séries duplicadas em entrega.');

const values = source.incomingRows.map((row) => `  (${sqlText(row.serialNumber)}, ${sqlText(row.material)}, ${sqlText(row.technicalName)}, ${sqlText(row.center)}, ${sqlText(row.deposit)}, ${sqlText(row.stockType)}, ${sqlText(row.systemStatus)}, ${Number(row.sourceRow)}, '2026-08-25', ${sqlText(source.source)})`).join(',\n');
const migration = `PRAGMA foreign_keys = ON;

-- Detalhamento serializado dos produtos a caminho da posição de 25/08/2026.
CREATE TABLE IF NOT EXISTS incoming_inventory_serials (
  serial_number TEXT PRIMARY KEY COLLATE NOCASE,
  material_code TEXT NOT NULL COLLATE NOCASE,
  technical_name TEXT NOT NULL,
  center TEXT NOT NULL,
  deposit TEXT NOT NULL,
  stock_type TEXT NOT NULL,
  system_status TEXT NOT NULL CHECK (system_status = 'DEPS NREM'),
  source_row INTEGER NOT NULL,
  snapshot_date TEXT NOT NULL,
  source_file TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_incoming_serials_material
ON incoming_inventory_serials (material_code, technical_name);

DELETE FROM incoming_inventory_serials;

INSERT INTO incoming_inventory_serials
  (serial_number, material_code, technical_name, center, deposit, stock_type,
   system_status, source_row, snapshot_date, source_file)
VALUES
${values};

CREATE TABLE _migration_0048_guard (valid INTEGER NOT NULL CHECK (valid = 1));
INSERT INTO _migration_0048_guard (valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM incoming_inventory_serials) = 90
  AND (SELECT COUNT(DISTINCT material_code) FROM incoming_inventory_serials) = 51
  THEN 1 ELSE 0 END;
DROP TABLE _migration_0048_guard;
`;

await writeFile('migrations/0048_incoming_inventory_details_2026_08_25.sql', migration);
console.log(JSON.stringify({ units: source.incomingRows.length, materials: new Set(source.incomingRows.map((row) => row.material)).size }));
