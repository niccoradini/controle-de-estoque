import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sqlText } from './build-material-inventory.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const categories = ['PRÉ', 'CONTROLE BTL', 'CONTROLE ENTRADA', 'CONTROLE ALTO VALOR', 'PÓS INDIVIDUAL', 'FAMILIA 2', 'FAMILIA 3', 'FAMILIA 4/5', 'VIVO V'];
const chunkFiles = [
  'scraped-pricing-2026-08-13.ndjson',
  ...Array.from({ length: 10 }, (_, index) => `scraped-pricing-chunk-${String(index + 2).padStart(2, '0')}.json`),
];

const chunks = await Promise.all(chunkFiles.map((file) => readFile(resolve(projectRoot, file), 'utf8').then(JSON.parse)));
const newProduct = await readFile(resolve(projectRoot, 'scraped-pricing-new-products.json'), 'utf8').then(JSON.parse);
const scraped = [...chunks.flat(), newProduct];
if (scraped.length !== 43 || new Set(scraped.map((item) => item.key)).size !== 43) {
  throw new Error(`Coleta incompleta ou duplicada: ${scraped.length} registros.`);
}

const money = (value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const profiles = scraped.map((item) => ({
  name: item.name,
  brand: item.brand,
  key: item.key,
  listedFrom: item.listedFrom,
  prices: {
    ...Object.fromEntries(categories.map((category) => [category, money(item.prices[category])])),
    'B2B - 10x': null,
    'B2B - 24x': null,
  },
}));
const audit = {
  source: 'Simulador Produtos - Intranet Gramcell',
  checkedAt: '2026-08-13',
  validation: 'Nome exato do aparelho e metadado Smartphone · PLANO confirmados antes de aceitar o valor',
  pricedCategories: categories,
  unavailableCategories: ['B2B - 10x', 'B2B - 24x'],
  models: scraped.map((item) => ({
    key: item.key,
    name: item.name,
    brand: item.brand,
    prices: {
      ...Object.fromEntries(categories.map((category) => [category, Number(item.prices[category]) * 100])),
      'B2B - 10x': null,
      'B2B - 24x': null,
    },
  })),
};

const profileValues = profiles.map((profile) => `  (${sqlText(profile.key)}, ${sqlText(profile.name)}, ${sqlText(profile.brand)}, ${Number(profile.listedFrom) * 100}, '2026-08-13', 'Gramcell · Simulador Produtos')`);
const priceValues = scraped.flatMap((profile) => categories.map((category) => `  (${sqlText(profile.key)}, ${sqlText(category)}, ${Number(profile.prices[category]) * 100})`));
const keys = profiles.map((profile) => sqlText(profile.key)).join(', ');
const migration = `PRAGMA foreign_keys = ON;

-- Atualiza integralmente os preços de aparelhos conforme a tabela de 13/08/2026.
-- A coleta foi validada nas nove categorias de plano exibidas pelo simulador.

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
VALUES ('moto g56 5g 256gb', '%MOTO G56 256GB%', 100);

INSERT OR REPLACE INTO system_state (key, value) VALUES
  ('pricing_table_date', '2026-08-13'),
  ('pricing_table_source', 'Gramcell · Simulador Produtos'),
  ('pricing_profile_count', '43'),
  ('pricing_audit_value_count', '387'),
  ('pricing_last_verification_date', '2026-08-13'),
  ('pricing_last_verification_source_table_date', '2026-08-13');
`;

await Promise.all([
  writeFile(resolve(projectRoot, 'scripts/pricing-source-2026-08-13.json'), `${JSON.stringify(profiles, null, 2)}\n`),
  writeFile(resolve(projectRoot, 'scripts/pricing-audit-2026-08-13.json'), `${JSON.stringify(audit, null, 2)}\n`),
  writeFile(resolve(projectRoot, 'migrations/0031_pricing_refresh_2026_08_13.sql'), migration),
]);

console.log(`Gerados ${profiles.length} perfis e ${priceValues.length} preços para 13/08/2026.`);
