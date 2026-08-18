import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sqlText } from './build-material-inventory.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tableDate = '2026-08-18';
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
const notPublishedCategories = ['B2B - 10x', 'B2B - 24x'];
const scraped = await readFile(resolve(projectRoot, 'scraped-pricing-2026-08-18.json'), 'utf8').then(JSON.parse);
if (scraped.tableDate !== '18/08/2026' || scraped.errors.length) {
  throw new Error(`Coleta inválida: tabela ${scraped.tableDate}; ${scraped.errors.length} erros.`);
}
if (scraped.models.length !== 46 || new Set(scraped.models.map((item) => item.key)).size !== 46) {
  throw new Error(`Esperados 46 modelos únicos; encontrados ${scraped.models.length}.`);
}

const money = (value) => value == null ? null : `R$ ${Number(value).toLocaleString('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;
const source = scraped.models.map((item) => ({
  name: item.name,
  brand: item.brand,
  key: item.key,
  listedFrom: item.listedFrom,
  prices: Object.fromEntries(scraped.categories.map((category) => [category, money(item.prices[category])])),
}));
const audit = {
  source: 'Simulador Produtos - Intranet Gramcell',
  checkedAt: tableDate,
  sourceTableDate: tableDate,
  validation: 'Nome exato do aparelho e categoria de plano confirmados no simulador autenticado',
  pricedCategories,
  notPublishedCategories,
  models: scraped.models.map((item) => ({
    key: item.key,
    name: item.name,
    brand: item.brand,
    prices: Object.fromEntries(scraped.categories.map((category) => [
      category,
      item.prices[category] == null ? null : Math.round(Number(item.prices[category]) * 100),
    ])),
  })),
};

const profileValues = scraped.models.map((item) => `  (${sqlText(item.key)}, ${sqlText(item.name)}, ${sqlText(item.brand)}, ${Math.round(Number(item.listedFrom) * 100)}, '${tableDate}', 'Gramcell · Simulador Produtos')`);
const priceValues = scraped.models.flatMap((item) => pricedCategories.map((category) => `  (${sqlText(item.key)}, ${sqlText(category)}, ${Math.round(Number(item.prices[category]) * 100)})`));
const keys = scraped.models.map((item) => sqlText(item.key)).join(', ');
const migration = `PRAGMA foreign_keys = ON;

-- Atualiza integralmente os preços de aparelhos conforme a tabela de 18/08/2026.
-- A coleta foi validada nas nove categorias de plano usadas pelo sistema.

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
  ('iphone 14 256gb', '%IPHONE 14 256GB%', 100),
  ('samsung galaxy z flip 8 512gb', '%GALAXY Z FLIP8 512GB%', 100),
  ('samsung galaxy z fold 8 512gb', '%GALAXY Z FOLD8 512GB%', 100),
  ('moto g56 5g 256gb', '%MOTO G56 256GB%', 100);

INSERT OR REPLACE INTO system_state (key, value) VALUES
  ('pricing_table_date', '${tableDate}'),
  ('pricing_table_source', 'Gramcell · Simulador Produtos'),
  ('pricing_profile_count', '46'),
  ('pricing_audit_value_count', '${priceValues.length}'),
  ('pricing_last_verification_date', '${tableDate}'),
  ('pricing_last_verification_source_table_date', '${tableDate}');
`;

await Promise.all([
  writeFile(resolve(projectRoot, 'scripts/pricing-source-2026-08-18.json'), `${JSON.stringify(source, null, 2)}\n`),
  writeFile(resolve(projectRoot, 'scripts/pricing-audit-2026-08-18.json'), `${JSON.stringify(audit, null, 2)}\n`),
  writeFile(resolve(projectRoot, 'migrations/0039_pricing_refresh_2026_08_18.sql'), migration),
]);

console.log(`Gerados ${source.length} perfis e ${priceValues.length} preços para 18/08/2026.`);
