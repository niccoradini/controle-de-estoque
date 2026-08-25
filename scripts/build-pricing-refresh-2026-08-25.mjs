import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sqlText } from './build-material-inventory.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tableDate = '2026-08-25';
const sourceTableDate = '25/08/2026';
const pricedCategories = [
  'PRÉ',
  'CONTROLE BTL',
  'CONTROLE ENTRADA',
  'CONTROLE ALTO VALOR',
  'PÓS INDIVIDUAL',
  'FAMILIA 2',
  'FAMILIA 3',
  'FAMILIA 4/5',
  'VIVO V',
];

const previous = await readFile(resolve(projectRoot, 'scraped-pricing-2026-08-18.json'), 'utf8').then(JSON.parse);
const changes = await readFile(resolve(projectRoot, 'scripts/pricing-changes-2026-08-25.json'), 'utf8').then(JSON.parse);
const simulator = await readFile(resolve(projectRoot, 'scripts/pricing-catalog-2026-08-25.json'), 'utf8').then(JSON.parse);
if (simulator.tabelaData !== sourceTableDate) throw new Error(`Tabela inesperada: ${simulator.tabelaData}`);
if (changes.length !== 5 || changes.some((item) => item.error || Object.values(item.prices).some((value) => value == null))) {
  throw new Error('A coleta das cinco alterações está incompleta.');
}

const currentByKey = new Map(simulator.smartphones.map(([name, brand, key, listedFrom]) => [key, { name, brand, key, listedFrom }]));
const changesByKey = new Map(changes.map((item) => [item.key, item]));
const models = previous.models.map((item) => {
  const current = currentByKey.get(item.key);
  if (!current) throw new Error(`Modelo removido do simulador: ${item.key}`);
  return changesByKey.get(item.key) || { ...item, name: current.name, brand: current.brand, listedFrom: current.listedFrom };
});
for (const item of changes) if (!models.some((model) => model.key === item.key)) models.push(item);
models.sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
if (models.length !== 47 || new Set(models.map((item) => item.key)).size !== 47) {
  throw new Error(`Esperados 47 modelos únicos; encontrados ${models.length}.`);
}

const profileValues = models.map((item) => `  (${sqlText(item.key)}, ${sqlText(item.name)}, ${sqlText(item.brand)}, ${Math.round(Number(item.listedFrom) * 100)}, '${tableDate}', 'Gramcell · Simulador Produtos')`);
const priceValues = models.flatMap((item) => pricedCategories.map((category) => `  (${sqlText(item.key)}, ${sqlText(category)}, ${Math.round(Number(item.prices[category]) * 100)})`));
const keys = models.map((item) => sqlText(item.key)).join(', ');

const migration = `PRAGMA foreign_keys = ON;

-- Tabela vigente em 25/08/2026: 47 aparelhos e nove categorias de plano.
INSERT INTO device_price_profiles
  (price_key, display_name, brand, listed_from_cents, table_date, source_label)
VALUES
${profileValues.join(',\n')}
ON CONFLICT(price_key) DO UPDATE SET
  display_name = excluded.display_name,
  brand = excluded.brand,
  listed_from_cents = excluded.listed_from_cents,
  table_date = excluded.table_date,
  source_label = excluded.source_label;

DELETE FROM device_price_values WHERE price_key IN (${keys});

INSERT INTO device_price_values (price_key, category, price_cents)
VALUES
${priceValues.join(',\n')};

INSERT OR REPLACE INTO device_price_match_rules (price_key, match_pattern, priority)
VALUES
  ('samsung galaxy a36 5g 256gb', '%GALAXY A36%256GB%', 110),
  ('motorola edge 70 512gb', '%MOTOROLA EDGE 70%512GB%', 110),
  ('motorola moto g67 5g 256gb', '%MOTO G67%256GB%', 110),
  ('motorola moto g77 5g 256gb', '%MOTO G77%256GB%', 110);

-- Item confirmado em Catálogo & Etiquetas em 25/08/2026.
INSERT INTO product_retail_prices
  (material_code, display_name, cluster, price_cents, price_kind, table_date, source_label, reference_name)
VALUES
  ('22024486', 'NINTENDO SWITCH OLED BR+SMBW+3 MESES NOS', 'misc', 239900, 'fixed', '${tableDate}', 'Gramcell · Catálogo & Etiquetas', 'Nintendo Switch Oled com Mario Bros Wonder')
ON CONFLICT(material_code) DO UPDATE SET
  display_name = excluded.display_name,
  cluster = excluded.cluster,
  price_cents = excluded.price_cents,
  price_kind = excluded.price_kind,
  table_date = excluded.table_date,
  source_label = excluded.source_label,
  reference_name = excluded.reference_name;

INSERT OR REPLACE INTO system_state (key, value) VALUES
  ('pricing_table_date', '${tableDate}'),
  ('pricing_table_source', 'Gramcell · Simulador Produtos'),
  ('pricing_profile_count', '47'),
  ('pricing_audit_value_count', '${priceValues.length}'),
  ('pricing_last_verification_date', '${tableDate}'),
  ('pricing_last_verification_source_table_date', '${tableDate}');
`;

const audit = {
  source: 'Simulador Produtos e Catálogo & Etiquetas - Intranet Gramcell',
  checkedAt: tableDate,
  sourceTableDate,
  pricedCategories,
  changedModels: changes.map((item) => item.key),
  models: models.map((item) => ({
    ...item,
    listedFrom: Math.round(Number(item.listedFrom) * 100),
    prices: Object.fromEntries(pricedCategories.map((category) => [category, Math.round(Number(item.prices[category]) * 100)])),
  })),
  retailMatches: [{ materialCode: '22024486', referenceName: 'Nintendo Switch Oled com Mario Bros Wonder', priceCents: 239900 }],
};

const source = models.map((item) => ({
  name: item.name,
  brand: item.brand,
  key: item.key,
  listedFrom: item.listedFrom,
  prices: Object.fromEntries(pricedCategories.map((category) => [
    category,
    `R$ ${Number(item.prices[category]).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ])),
}));

await Promise.all([
  writeFile(resolve(projectRoot, 'scripts/pricing-audit-2026-08-25.json'), `${JSON.stringify(audit, null, 2)}\n`),
  writeFile(resolve(projectRoot, 'scripts/pricing-source-2026-08-25-final.json'), `${JSON.stringify(source, null, 2)}\n`),
  writeFile(resolve(projectRoot, 'migrations/0045_pricing_refresh_2026_08_25.sql'), migration),
]);

console.log(`Gerados ${models.length} perfis, ${priceValues.length} preços por plano e 1 preço de catálogo.`);
