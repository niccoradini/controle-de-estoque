import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sqlText } from './build-material-inventory.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(projectRoot, 'scripts/pricing-source-2026-08-04.json');
const auditPath = resolve(projectRoot, 'scripts/pricing-audit-2026-08-04.json');
const outputPath = resolve(projectRoot, 'migrations/0013_pricing_catalog_2026_08_04.sql');
const [profiles, audit] = await Promise.all([
  readFile(sourcePath, 'utf8').then(JSON.parse),
  readFile(auditPath, 'utf8').then(JSON.parse),
]);

const TABLE_DATE = '2026-08-04';
const SOURCE_LABEL = 'Gramcell · Simulador Produtos';
const PRICE_CATEGORIES = [
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

const matchPatterns = {
  'iphone 13 256gb': '%IPHONE 13 256GB%',
  'iphone 15 256gb': '%IPHONE 15 256GB%',
  'iphone 16 256gb': '%IPHONE 16 256GB%',
  'iphone 16e 256gb': '%IPHONE 16E 256GB%',
  'iphone 17 256gb': '%IPHONE 17 256GB%',
  'iphone 17 512gb': '%IPHONE 17 512GB%',
  'iphone 17 pro 256gb': '%IPHONE 17 PRO 256GB%',
  'iphone 17 pro 512gb': '%IPHONE 17 PRO 512GB%',
  'iphone 17 pro max 1tb': '%IPHONE 17 PRO MAX 1TB%',
  'iphone 17 pro max 256gb': '%IPHONE 17 PRO MAX 256GB%',
  'iphone 17 pro max 512gb': '%IPHONE 17 PRO MAX 512GB%',
  'iphone 17e 256gb': '%IPHONE 17E 256GB%',
  'iphone air 256gb': '%IPHONE AIR 256GB%',
  'moto g35 5g': '%MOTO G35 128GB%',
  'moto g47 5g 128gb': '%MOTO G47 128GB%',
  'moto g86 5g 256gb': '%MOTO G86 256GB%',
  'motorola edge 60 fusion 256gb': '%MOTOROLA EDGE 60 FUSION 256GB%',
  'motorola edge 60 pro 256gb': '%MOTOROLA EDGE 60 PRO 256GB%',
  'motorola edge 70 512gb': '%MOTOROLA EDGE 70 512GB%',
  'motorola edge 70 fusion 256gb': '%MOTOROLA EDGE 70 FUSION 256GB%',
  'motorola moto g67 5g 128gb': '%MOTO G67 128GB%',
  'motorola moto g67 5g 256gb': '%MOTO G67 256GB%',
  'motorola moto g77 5g 256gb': '%MOTO G77 256GB%',
  'motorola signature 512gb': '%MOTOROLA SIGNATURE 512GB%',
  'samsung galaxy a06 4g 128gb': '%GALAXY A06 128GB%',
  'samsung galaxy a07 5g 128gb': '%GALAXY A07 128GB%',
  'samsung galaxy a17 5g 128gb': '%GALAXY A17 5G 128GB%',
  'samsung galaxy a17 5g 256gb': '%GALAXY A17 5G 256GB%',
  'samsung galaxy a37 5g 256gb': '%GALAXY A37 5G 256GB%',
  'samsung galaxy a57 5g 256gb': '%GALAXY A57 5G 256GB%',
  'samsung galaxy s25 256gb': '%GALAXY S25 256GB%',
  'samsung galaxy s25 fe 5g 256gb': '%GALAXY S25 FE 256GB%',
  'samsung galaxy s25 ultra 256gb': '%GALAXY S25 ULTRA 256GB%',
  'samsung galaxy s26 256gb': '%GALAXY S26 256GB%',
  'samsung galaxy s26 512gb': '%GALAXY S26 512GB%',
  'samsung galaxy s26 ultra 256gb': '%GALAXY S26 ULTRA 256GB%',
  'samsung galaxy s26+ 256gb': '%GALAXY S26+ 256GB%',
  'samsung galaxy s26+ 512gb': '%GALAXY S26+ 512GB%',
  'samsung galaxy z flip 7 256gb': '%GALAXY Z FLIP7 256GB%',
  'samsung galaxy z flip 7 512gb': '%GALAXY Z FLIP7 512GB%',
  'samsung galaxy z flip 7 fe 256gb': '%GALAXY Z FLIP7 FE 256GB%',
  'samsung galaxy z fold 7 512gb': '%GALAXY Z FOLD7 512GB%',
};

function moneyToCents(value) {
  const match = String(value || '').match(/^R\$\s*([\d.]+),(\d{2})$/);
  if (!match) throw new Error(`Preço inválido: ${value}`);
  return Number(match[1].replaceAll('.', '')) * 100 + Number(match[2]);
}

if (!Array.isArray(profiles) || profiles.length !== 42) {
  throw new Error(`Esperados 42 modelos, encontrados ${profiles.length}.`);
}
if (!Array.isArray(audit.models) || audit.models.length !== profiles.length) {
  throw new Error('A auditoria integral de preços está ausente ou incompleta.');
}
if (JSON.stringify(audit.pricedCategories) !== JSON.stringify(PRICE_CATEGORIES)) {
  throw new Error('As categorias da fonte divergem da auditoria integral.');
}

const seenKeys = new Set();
const auditedByKey = new Map(audit.models.map((profile) => [profile.key, profile]));
const profileValues = [];
const priceValues = [];
const ruleValues = [];

for (const profile of profiles) {
  if (!profile.key || seenKeys.has(profile.key)) throw new Error(`Chave duplicada ou inválida: ${profile.key}`);
  seenKeys.add(profile.key);
  if (!matchPatterns[profile.key]) throw new Error(`Modelo sem regra de correspondência: ${profile.key}`);
  const categories = Object.keys(profile.prices || {}).filter((category) => profile.prices[category]);
  if (categories.length !== PRICE_CATEGORIES.length || PRICE_CATEGORIES.some((category) => !categories.includes(category))) {
    throw new Error(`Faixas incompletas para ${profile.name}.`);
  }
  const audited = auditedByKey.get(profile.key);
  if (!audited || audited.name !== profile.name || audited.brand !== profile.brand) {
    throw new Error(`Modelo não confirmado pela auditoria: ${profile.name}.`);
  }
  profileValues.push(`  (${sqlText(profile.key)}, ${sqlText(profile.name)}, ${sqlText(profile.brand)}, ${Number(profile.listedFrom) * 100}, ${sqlText(TABLE_DATE)}, ${sqlText(SOURCE_LABEL)})`);
  for (const category of PRICE_CATEGORIES) {
    const priceCents = moneyToCents(profile.prices[category]);
    if (audited.prices[category] !== priceCents) {
      throw new Error(`Preço divergente da auditoria: ${profile.name} · ${category}.`);
    }
    priceValues.push(`  (${sqlText(profile.key)}, ${sqlText(category)}, ${priceCents})`);
  }
  for (const category of audit.unavailableCategories || []) {
    if (audited.prices[category] !== null) throw new Error(`Plano indisponível com preço inesperado: ${profile.name} · ${category}.`);
  }
  ruleValues.push(`  (${sqlText(profile.key)}, ${sqlText(matchPatterns[profile.key])}, 100)`);
}

const categoryCheck = PRICE_CATEGORIES.map(sqlText).join(', ');
const migration = `PRAGMA foreign_keys = ON;

-- Catálogo de preços dos aparelhos disponíveis no Simulador Produtos.
-- A tabela é uma fotografia de 04/08/2026 e não depende da intranet durante a venda.

CREATE TABLE device_price_profiles (
  price_key TEXT PRIMARY KEY COLLATE NOCASE,
  display_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  listed_from_cents INTEGER NOT NULL CHECK (listed_from_cents >= 0),
  table_date TEXT NOT NULL,
  source_label TEXT NOT NULL
);

CREATE TABLE device_price_values (
  price_key TEXT NOT NULL REFERENCES device_price_profiles(price_key) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (${categoryCheck})),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  PRIMARY KEY (price_key, category)
);

CREATE TABLE device_price_match_rules (
  price_key TEXT NOT NULL REFERENCES device_price_profiles(price_key) ON DELETE CASCADE,
  match_pattern TEXT NOT NULL COLLATE NOCASE,
  priority INTEGER NOT NULL DEFAULT 100,
  PRIMARY KEY (price_key, match_pattern)
);

ALTER TABLE withdrawal_requests ADD COLUMN price_category TEXT;
ALTER TABLE withdrawal_requests ADD COLUMN device_total_cents INTEGER;
ALTER TABLE withdrawal_requests ADD COLUMN price_table_date TEXT;

ALTER TABLE withdrawal_quantity_items ADD COLUMN unit_price_cents INTEGER;
ALTER TABLE withdrawal_quantity_items ADD COLUMN price_category_snapshot TEXT;
ALTER TABLE withdrawal_quantity_items ADD COLUMN price_table_date_snapshot TEXT;

INSERT INTO device_price_profiles
  (price_key, display_name, brand, listed_from_cents, table_date, source_label)
VALUES
${profileValues.join(',\n')};

INSERT INTO device_price_values (price_key, category, price_cents)
VALUES
${priceValues.join(',\n')};

INSERT INTO device_price_match_rules (price_key, match_pattern, priority)
VALUES
${ruleValues.join(',\n')};

INSERT OR REPLACE INTO system_state (key, value) VALUES
  ('pricing_table_date', ${sqlText(TABLE_DATE)}),
  ('pricing_table_source', ${sqlText(SOURCE_LABEL)}),
  ('pricing_profile_count', ${sqlText(String(profiles.length))});

CREATE INDEX idx_device_price_rules_priority
  ON device_price_match_rules(priority, price_key);
`;

await writeFile(outputPath, migration);
console.log(`Migração gerada: ${outputPath}`);
console.log(`${profiles.length} modelos e ${priceValues.length} preços.`);
