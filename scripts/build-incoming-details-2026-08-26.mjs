import { readFile, writeFile } from 'node:fs/promises';

const source = JSON.parse(await readFile('data/basis-serial-stock-2026-08-26-excluding-rpar-with-incoming.json', 'utf8'));
const sqlText = (value) => `'${String(value ?? '').replaceAll("'", "''")}'`;
if (!Array.isArray(source.incomingRows) || source.incomingRows.length !== 63) {
  throw new Error('A origem precisa conter exatamente 63 itens em entrega.');
}
if (source.incomingRows.some((row) => !/^\d{4}-\d{2}-\d{2}$/.test(row.modifiedOn || ''))) {
  throw new Error('Todos os itens em entrega precisam ter uma data de modificação válida.');
}
const serials = new Set(source.incomingRows.map((row) => String(row.serialNumber).toLowerCase()));
if (serials.size !== source.incomingRows.length) throw new Error('Existem séries duplicadas em entrega.');

const values = source.incomingRows.map((row) => `  (${sqlText(row.serialNumber)}, ${sqlText(row.material)}, ${sqlText(row.technicalName)}, ${sqlText(row.center)}, ${sqlText(row.deposit)}, ${sqlText(row.stockType)}, ${sqlText(row.systemStatus)}, ${Number(row.sourceRow)}, '2026-08-26', ${sqlText(source.source)}, ${sqlText(row.modifiedOn)})`).join(',\n');
const materials = new Set(source.incomingRows.map((row) => row.material)).size;
const migration = `PRAGMA foreign_keys = ON;

-- Detalhamento serializado e datas dos produtos a caminho em 26/08/2026.
DELETE FROM incoming_inventory_serials;

INSERT INTO incoming_inventory_serials
  (serial_number, material_code, technical_name, center, deposit, stock_type,
   system_status, source_row, snapshot_date, source_file, delivery_started_on)
VALUES
${values};

CREATE TABLE _migration_0051_guard (valid INTEGER NOT NULL CHECK (valid = 1));
INSERT INTO _migration_0051_guard (valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM incoming_inventory_serials) = 63
  AND (SELECT COUNT(DISTINCT material_code) FROM incoming_inventory_serials) = ${materials}
  AND (SELECT COUNT(*) FROM incoming_inventory_serials WHERE delivery_started_on GLOB '????-??-??') = 63
  THEN 1 ELSE 0 END;
DROP TABLE _migration_0051_guard;
`;

await writeFile('migrations/0051_incoming_inventory_details_2026_08_26.sql', migration);
console.log(JSON.stringify({
  units: source.incomingRows.length,
  materials,
  dates: new Set(source.incomingRows.map((row) => row.modifiedOn)).size,
}));
