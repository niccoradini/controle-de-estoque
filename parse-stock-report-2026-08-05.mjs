import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inputPath = process.argv[2];

if (!inputPath) {
  throw new Error('Uso: node scripts/parse-stock-report-2026-08-05.mjs caminho/ESTOQUE05.08.2026.txt');
}

function parseTsvLine(line) {
  const fields = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === '\t' && !quoted) {
      fields.push(field);
      field = '';
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error(`Campo sem fechamento de aspas: ${line}`);
  fields.push(field);
  return fields;
}

const sourceBytes = await readFile(resolve(inputPath));
const sourceText = new TextDecoder('windows-1252').decode(sourceBytes).replace(/^\uFEFF/, '');
const lines = sourceText.split(/\r?\n/).filter((line) => line.length > 0);
const expectedHeaders = ['Material', 'Denominação', 'Nº de série', 'Centro', 'Depósito'];
const headers = parseTsvLine(lines[0]).map((value) => value.trim());
if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
  throw new Error(`Cabeçalho inesperado: ${headers.join(' | ')}`);
}

const excludedDeposits = ['RPAR'];
const incomingDeposits = ['DEPS', 'NREM'];
const availableDeposits = new Set();
const serials = new Set();
const materialNames = new Map();
const rows = [];
const incomingRows = [];
const excludedRows = [];
let blankDepositCount = 0;

for (const [offset, line] of lines.slice(1).entries()) {
  const sourceRow = offset + 2;
  const values = parseTsvLine(line);
  if (values.length !== expectedHeaders.length) {
    throw new Error(`Linha ${sourceRow}: esperadas 5 colunas, encontradas ${values.length}.`);
  }
  const [materialRaw, technicalNameRaw, serialNumberRaw, centerRaw, depositRaw] = values;
  const material = materialRaw.trim();
  const technicalName = technicalNameRaw.trim();
  const serialNumber = serialNumberRaw.trim();
  const center = centerRaw.trim().toUpperCase();
  let deposit = depositRaw.trim().toUpperCase();
  if (!deposit) {
    deposit = '149';
    blankDepositCount += 1;
  }
  if (!material || !technicalName || !serialNumber) throw new Error(`Linha ${sourceRow}: dados obrigatórios ausentes.`);
  if (center !== '209H') throw new Error(`Linha ${sourceRow}: centro inesperado ${center}.`);
  const serialKey = serialNumber.toLocaleLowerCase('pt-BR');
  if (serials.has(serialKey)) throw new Error(`Linha ${sourceRow}: número de série duplicado ${serialNumber}.`);
  serials.add(serialKey);
  if (!materialNames.has(material)) materialNames.set(material, new Set());
  materialNames.get(material).add(technicalName);
  const record = { sourceRow, material, technicalName, serialNumber, deposit };
  if (excludedDeposits.includes(deposit)) excludedRows.push(record);
  else if (incomingDeposits.includes(deposit)) incomingRows.push(record);
  else {
    availableDeposits.add(deposit);
    rows.push(record);
  }
}

for (const [material, names] of materialNames) {
  if (names.size !== 1) throw new Error(`O material ${material} possui denominações diferentes.`);
}

const previousPath = resolve(projectRoot, 'data/basis-serial-stock-2026-08-04-excluding-rpar-with-incoming.json');
const previous = JSON.parse(await readFile(previousPath, 'utf8'));
const previousRows = [...previous.rows, ...previous.incomingRows];
const previousSerials = new Set(previousRows.map((row) => row.serialNumber.toLocaleLowerCase('pt-BR')));
const currentAvailableSerials = new Set([...rows, ...incomingRows].map((row) => row.serialNumber.toLocaleLowerCase('pt-BR')));
const previousMaterials = new Set(previousRows.map((row) => row.material));
const currentMaterials = new Set([...rows, ...incomingRows].map((row) => row.material));

const addedSerials = [...currentAvailableSerials].filter((serial) => !previousSerials.has(serial));
const removedSerials = [...previousSerials].filter((serial) => !currentAvailableSerials.has(serial));
const newMaterials = [...currentMaterials].filter((material) => !previousMaterials.has(material)).sort();
const removedMaterials = [...previousMaterials].filter((material) => !currentMaterials.has(material)).sort();

const expected = {
  sourceRows: 1183,
  materials: 293,
  available: 1073,
  excluded: 110,
  incoming: 0,
  blankDeposits: 144,
  addedSerials: 108,
  removedSerials: 12,
  newMaterials: 6,
  removedMaterials: 0,
};
const actual = {
  sourceRows: lines.length - 1,
  materials: currentMaterials.size,
  available: rows.length,
  excluded: excludedRows.length,
  incoming: incomingRows.length,
  blankDeposits: blankDepositCount,
  addedSerials: addedSerials.length,
  removedSerials: removedSerials.length,
  newMaterials: newMaterials.length,
  removedMaterials: removedMaterials.length,
};
for (const [key, value] of Object.entries(expected)) {
  if (actual[key] !== value) throw new Error(`Validação ${key}: esperado ${value}, encontrado ${actual[key]}.`);
}

const output = {
  source: 'ESTOQUE05.08.2026.txt',
  importedAt: '2026-08-05',
  sourceEncoding: 'windows-1252',
  headers,
  sourceRowCount: actual.sourceRows,
  normalizedBlankDeposit: '149',
  normalizedBlankDepositCount: blankDepositCount,
  excludedDeposits,
  excludedRowCount: excludedRows.length,
  incomingDeposits,
  incomingRowCount: incomingRows.length,
  availableDeposits: [...availableDeposits].sort(),
  expectedProductCount: actual.materials,
  expectedAvailableQuantity: actual.available,
  expectedExcludedRowCount: actual.excluded,
  migrationNumber: 19,
  comparison: {
    previousDate: '2026-08-04',
    previousAvailableQuantity: previous.rows.length,
    addedSerialCount: addedSerials.length,
    removedSerialCount: removedSerials.length,
    netAvailableChange: rows.length - previous.rows.length,
    newMaterials,
    removedMaterials,
  },
  rows,
  incomingRows,
};

const outputPath = resolve(projectRoot, 'data/basis-serial-stock-2026-08-05-excluding-rpar-with-incoming.json');
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, ...actual, newMaterials }, null, 2));
