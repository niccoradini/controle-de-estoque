import { readFile, writeFile } from 'node:fs/promises';

const source = JSON.parse(await readFile('data/basis-serial-stock-2026-08-25-excluding-rpar-with-incoming.json', 'utf8'));
const sqlText = (value) => `'${String(value ?? '').replaceAll("'", "''")}'`;
if (!Array.isArray(source.incomingRows) || source.incomingRows.length !== 90) {
  throw new Error('A origem precisa conter exatamente 90 itens DEPS NREM.');
}
if (source.incomingRows.some((row) => !/^\d{4}-\d{2}-\d{2}$/.test(row.modifiedOn || ''))) {
  throw new Error('Todos os itens em entrega precisam ter uma data de modificação válida.');
}
const serials = new Set(source.incomingRows.map((row) => String(row.serialNumber).toLowerCase()));
if (serials.size !== source.incomingRows.length) throw new Error('Existem séries duplicadas em entrega.');

const updates = source.incomingRows.map((row) => `UPDATE incoming_inventory_serials
SET delivery_started_on = ${sqlText(row.modifiedOn)}
WHERE serial_number = ${sqlText(row.serialNumber)};`).join('\n');
const migration = `PRAGMA foreign_keys = ON;

-- A data "Modificado em" representa quando cada unidade foi colocada em entrega.
ALTER TABLE incoming_inventory_serials ADD COLUMN delivery_started_on TEXT NOT NULL DEFAULT '';

${updates}

CREATE TABLE _migration_0049_guard (valid INTEGER NOT NULL CHECK (valid = 1));
INSERT INTO _migration_0049_guard (valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM incoming_inventory_serials) = 90
  AND (SELECT COUNT(*) FROM incoming_inventory_serials WHERE delivery_started_on GLOB '????-??-??') = 90
  THEN 1 ELSE 0 END;
DROP TABLE _migration_0049_guard;
`;

await writeFile('migrations/0049_incoming_delivery_dates_2026_08_25.sql', migration);
console.log(JSON.stringify({
  units: source.incomingRows.length,
  dates: new Set(source.incomingRows.map((row) => row.modifiedOn)).size,
  firstDate: source.incomingRows.map((row) => row.modifiedOn).sort()[0],
  lastDate: source.incomingRows.map((row) => row.modifiedOn).sort().at(-1),
}));
