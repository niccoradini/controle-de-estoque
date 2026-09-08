import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourcePath = new URL('./pricing-source-2026-09-07.json', import.meta.url);
const outputPath = new URL('../migrations/0074_pricing_policy_2026_09_07.sql', import.meta.url);
const source = JSON.parse(await readFile(sourcePath, 'utf8'));

const categories = [
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

if (source.profiles.length !== 47) throw new Error('A fonte precisa conter os 47 perfis oficiais.');
for (const profile of source.profiles) {
  const keys = Object.keys(profile.prices);
  if (keys.length !== categories.length || categories.some((category) => !keys.includes(category))) {
    throw new Error(`Categorias incompletas em ${profile.name}.`);
  }
}

const sqlText = (value) => `'${String(value).replaceAll("'", "''")}'`;
const keyFor = (name) => name.toLocaleLowerCase('pt-BR');
const keys = source.profiles.map((profile) => keyFor(profile.name));
const priceRows = source.profiles.flatMap((profile) => categories.map((category) => (
  `  (${sqlText(keyFor(profile.name))}, ${sqlText(category)}, ${Number(profile.prices[category])})`
)));
const installmentPolicy = JSON.stringify(source.installmentSurchargePartsPerMillion);
const valueCount = priceRows.length;

const sql = `-- Tabela integral conferida no Gramcell · Simulador Produtos em ${source.checkedAt}.
-- Vigência da tabela: ${source.tableDate}. 47 perfis e ${valueCount} preços-base.
-- A política publicada e o Catálogo e Etiquetas permitem 21x em todo o portfólio.

UPDATE device_price_profiles
SET table_date = ${sqlText(source.tableDate)},
    source_label = ${sqlText(source.source)}
WHERE price_key IN (${keys.map(sqlText).join(', ')});

DELETE FROM device_price_values
WHERE price_key IN (${keys.map(sqlText).join(', ')});

INSERT INTO device_price_values (price_key, category, price_cents) VALUES
${priceRows.join(',\n')};

INSERT OR REPLACE INTO system_state (key, value) VALUES
  ('pricing_table_date', ${sqlText(source.tableDate)}),
  ('pricing_table_source', ${sqlText(source.source)}),
  ('pricing_profile_count', ${sqlText(source.profiles.length)}),
  ('pricing_audit_value_count', ${sqlText(valueCount)}),
  ('pricing_last_verification_date', ${sqlText(source.checkedAt)}),
  ('pricing_last_verification_source_table_date', ${sqlText(source.tableDate)}),
  ('payment_policy_effective_date', '2026-09-08'),
  ('payment_policy_max_installments', ${sqlText(source.paymentPolicyMaxInstallments)}),
  ('payment_policy_minimum_installment_cents', ${sqlText(source.paymentPolicyMinimumInstallmentCents)}),
  ('payment_policy_pix_discount_basis_points', ${sqlText(source.pixDiscountBasisPoints)}),
  ('payment_policy_installment_surcharge_ppm', ${sqlText(installmentPolicy)}),
  ('payment_policy_note', ${sqlText(source.policyNote)});
`;

await writeFile(outputPath, sql);
console.log(`Gerado ${fileURLToPath(outputPath).replace(`${root}/`, '')}: ${source.profiles.length} perfis e ${valueCount} preços.`);
