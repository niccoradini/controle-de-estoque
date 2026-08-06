import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sqlText } from './build-material-inventory.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const inventoryPath = resolve(projectRoot, 'migrations/0012_inventory_refresh_2026_08_04.sql');
const devicePricingPath = resolve(projectRoot, 'migrations/0013_pricing_catalog_2026_08_04.sql');
const outputPath = resolve(projectRoot, 'migrations/0014_retail_pricing_catalog_2026_08_04.sql');
const auditPath = resolve(projectRoot, 'scripts/retail-pricing-source-2026-08-04.json');

const TABLE_DATE = '2026-08-04';
const SIMULATOR = 'Gramcell · Simulador Produtos';
const FAMILY_REFERENCE = 'Gramcell · referência equivalente do Simulador Produtos';
const VIVO_REFERENCE = 'Loja Vivo · referência de catálogo';
const MOTOROLA_REFERENCE = 'Motorola Brasil · produto equivalente';

const priceRules = [];

function fixed(pattern, priceCents, referenceName, sourceLabel = SIMULATOR, priceKind = 'fixed') {
  priceRules.push({ pattern, priceCents, referenceName, sourceLabel, priceKind });
}

// Notebooks, TVs e caixas de som.
fixed(/ACER NOTEBOOK ASPIRE/, 359900, 'Acer Aspire Go 15 i5 8GB 256GB');
fixed(/UP2 NOTEBOOK LENOVO/, 379900, 'Lenovo IdeaPad Slim 3i i5 8GB 512GB');
fixed(/SMART TV 32"/, 114900, 'Smart TV Samsung HD H5000F 32"');
fixed(/SMART TV 43"/, 199900, 'Smart TV Samsung UHD Crystal 4K U8600F 43"');
fixed(/AMAZON ECHO DOT/, 45900, 'Echo Dot 5ª geração');
fixed(/AMAZON ECHO POP/, 37900, 'Echo Pop');
fixed(/AMVOX CAIXA AMPLIF/, 16900, 'Amvox ACA 251 New X');
fixed(/WAAW BOOM 200/, 44900, 'WAAW Boom 200');
fixed(/WAAW BY ALOK ME110/, 14900, 'WAAW ME110');
fixed(/WAAW US 200SB DUO/, 29900, 'WAAW US 200SB Duo');
fixed(/WAAW HYPERBOOM 1000/, 119900, 'WAAW Hyperboom 1000');

// Cabos.
fixed(/APPLE CABO USB-C PARA LIGHTNING/, 22900, 'Apple cabo USB-C para Lightning 1m');
fixed(/CABO GEONAV PREMIUM 3X1/, 9900, 'Geonav Premium 3 em 1 1,5m');
fixed(/GEONAV CABO USB-C CONECTOR LIGHTNING/, 7900, 'Geonav USB-C para Lightning 2m');
fixed(/I2GO ALÇA CABO C\/C 1,5M/, 14900, 'i2GO alça cabo USB-C/USB-C 1,5m CBF');
fixed(/I2GO ALÇA CABO C\/C 30CM/, 9900, 'i2GO alça cabo USB-C/USB-C 30cm CBF');
fixed(/I2GO CABO C\/C 2M CBF/, 7900, 'i2GO cabo USB-C/USB-C 2m CBF');
fixed(/I2GO CABO DUAL C\/C/, 9900, 'i2GO cabo Dual USB-C/USB-C 1,5m');
fixed(/I2GO CABO FLAT LIGHTNING/, 4900, 'i2GO cabo Flat Lightning/USB-C 1,2m');
fixed(/I2GO CABO FLAT USB-C \+ USB-C/, 5900, 'i2GO cabo Flat USB-C/USB-C 1,2m');
fixed(/I2GO CABO FLAT USB-C A/, 4900, 'i2GO cabo Flat USB-C/USB-A 1,2m');
fixed(/I2GO CABO LIGHTNING 1,5M/, 6900, 'i2GO cabo Lightning 1,5m');
fixed(/I2GO CABO MAGNÉTICO LIGHTNING/, 10900, 'i2GO cabo magnético Lightning/USB-C 1,2m');
fixed(/I2GO CABO MAGNÉTICO USB-C PARA C/, 9900, 'i2GO cabo magnético USB-C/USB-C 1,2m');
fixed(/I2GO CABO USB-C 1,5M/, 3900, 'i2GO cabo USB-C 1,5m');
fixed(/I2GO CABO USB-C 3M/, 5900, 'i2GO cabo USB-C/USB-A 3m');
fixed(/I2GO CABO USB-C\+USB-C 2M/, 4900, 'i2GO cabo USB-C/USB-C 2m 60W');
fixed(/OVVI CABO 2X1/, 9900, 'Ovvi cabo 2 em 1 Kevlar 2m');
fixed(/OVVI CABO 3X1/, 10900, 'Ovvi cabo 3 em 1 Kevlar 2m');
fixed(/OVVI CABO USB-C LIGHTNING/, 7900, 'Ovvi cabo USB-C/Lightning 2m Kevlar');
fixed(/OVVI CABO USB-C USB-C/, 11900, 'Ovvi cabo USB-C/USB-C 2m Kevlar');

// Carregadores e baterias portáteis.
fixed(/APPLE CARREGADOR USB-C 20W/, 21900, 'Apple carregador USB-C 20W');
fixed(/CARREGADOR MAGNÉTICO APPLE WATCH/, 34900, 'Apple cabo magnético para Watch 2m');
fixed(/GEONAV CARREGADOR PORTÁTIL 5000/, 4900, 'Geonav power bank 5.000mAh');
fixed(/GEONAV CARREGADOR S POWER GAN DUO 65W/, 13900, 'Geonav carregador GaN Duo 65W');
fixed(/I2GO CARREGADOR PAREDE 20W 1 USB-C/, 8900, 'i2GO carregador de parede 20W USB-C');
fixed(/I2GO CARREGADOR PAREDE PD PROWAL028/, 10900, 'i2GO carregador de parede 36W PROWAL028');
fixed(/I2GO CARREGADOR PAREDE PD PROWAL030/, 18900, 'i2GO carregador de parede 65W PROWAL030');
fixed(/I2GO CARREGADOR PAREDE PD USB-C PROWAL024/, 7900, 'i2GO carregador de parede 20W PROWAL024');
fixed(/I2GO CARREGADOR PAREDE USB I2GWAL029BK/, 3900, 'i2GO carregador de parede USB 10W');
fixed(/I2GO KIT CARREGADOR PD 20W/, 11900, 'i2GO kit carregador PD 20W e cabo USB-C');
fixed(/I2GO POWER BANK 10\.000MAH 4 EM 1/, 19900, 'i2GO power bank 10.000mAh 4 em 1 CBF');
fixed(/I2GO POWER BANK 10000MAH PROBAT017/, 14900, 'i2GO power bank 10.000mAh PROBAT017');
fixed(/I2GO POWERBANK POCKET 5\.000 LIGHTNING/, 13900, 'i2GO power bank Pocket Lightning 5.000mAh');
fixed(/I2GO POWERBANK POCKET 5\.000 USB-C/, 13900, 'i2GO power bank Pocket USB-C 5.000mAh');
fixed(/OVVI CARREGADOR 3X1 BASE Z APPLE/, 44900, 'Carregador 3 em 1 dobrável Apple', FAMILY_REFERENCE);
fixed(/OVVI CARREGADOR 3X1 ESTEIRA APPLE/, 19900, 'Ovvi carregador 3 em 1 Esteira Apple');
fixed(/OVVI CARREGADOR 3X1 ESTEIRA SAMSUNG/, 19900, 'Ovvi carregador 3 em 1 Esteira Samsung');
fixed(/OVVI CARREGADOR PAREDE UNIV 35W/, 15900, 'Ovvi carregador de parede universal 35W');
fixed(/OVVI CARREGADOR PAREDE UNIV 65W/, 24900, 'Ovvi carregador de parede universal 65W');
fixed(/OVVI CARREGADOR VEICULAR UNIV 38W/, 6900, 'Ovvi carregador veicular universal 38W');
fixed(/OVVI POWERBANK 5000MAH MAGSAFE SLIM/, 39900, 'Ovvi power bank 5.000mAh MagSafe Slim');

// Capas Case-Mate/Customic e Motorola.
fixed(/CAPA GALAXY (A17|A37|A57).*IMPACTOR/, 9900, 'Customic Impactor — linha atual Galaxy');
fixed(/CAPA GALAXY (A17|A37|A57).*SOFT/, 7900, 'Customic Soft Series 1.5 — linha atual Galaxy');
fixed(/CAPA MOTO G67\/G77 IMPACTOR/, 9900, 'Customic Impactor Moto G67/G77');
fixed(/CAPA MOTO G67\/G77 SOFT/, 7900, 'Customic Soft Series Moto G67/G77');
fixed(/^(?:CAPA|CM CAPA).*?(?:A16|A26|A36|A56|S25 EDGE|EDGE 60|MOTO G56|MOTO G86|MOTOROLA G15|MOTOROLA G35|MOTOROLA G55|MOTOROLA G75)/, 4900, 'Customic capa da linha Essenciais');
fixed(/MOTO CAPA PROTETORA EDGE 70 FUSION/, 9900, 'Motorola capa protetora Edge 70 Fusion');
fixed(/MOTOROLA CAPA PROTETORA EDGE 70/, 9900, 'Motorola capa protetora Edge 70');
fixed(/MOTOROLA CAPA SIGNATURE/, 14900, 'Motorola capa Signature');
fixed(/I2GO CAPA IPHONE 17 CBF/, 7900, 'i2GO capa iPhone 17 CBF');
fixed(/I2GO CAPA IPHONE 17 PRO MAX CBF/, 7900, 'i2GO capa iPhone 17 Pro Max CBF');

// Capas Ovvi para Samsung.
fixed(/OVVI CAPA GALAXY S25 FE SILICONE MAGSAFE/, 13900, 'Ovvi capa Galaxy S25 FE silicone magnética');
fixed(/OVVI CAPA GALAXY S25 FE SILICONE/, 9900, 'Ovvi capa Galaxy S25 FE silicone');
fixed(/OVVI CAPA GALAXY S25 ULTRA SILICONE/, 4900, 'Ovvi capa Galaxy S25 Ultra silicone');
fixed(/OVVI CAPA GALAXY S25\+ ANTIBACTERIANA/, 4900, 'Ovvi capa Galaxy S25+ antibacteriana');
fixed(/OVVI CAPA GALAXY S25\+ SILICONE/, 4900, 'Ovvi capa Galaxy S25+ silicone');
fixed(/OVVI CAPA GALAXY S25 ANTIBACTERIANA/, 9900, 'Ovvi capa Galaxy S25 antibacteriana');
fixed(/OVVI CAPA GALAXY S25 SILICONE/, 9900, 'Ovvi capa Galaxy S25 silicone');
fixed(/OVVI (?:I2GO )?CAPA (?:GLX|GALAXY) S26 ULTRA SILICONE MAGNÉTICA/, 19900, 'Ovvi capa Galaxy S26 Ultra silicone magnética');
fixed(/OVVI (?:I2GO )?CAPA (?:GLX|GALAXY) S26 ULTRA TRANSPARENTE MAGNÉTICA/, 19900, 'Ovvi capa Galaxy S26 Ultra transparente magnética');
fixed(/OVVI (?:I2GO )?CAPA (?:GLX|GALAXY) S26 ULTRA TRANSPARENTE$/, 12900, 'Ovvi capa Galaxy S26 Ultra transparente');
fixed(/OVVI CAPA GALAXY S26\+ HOLO MAGNÉTICA/, 21900, 'Ovvi capa Galaxy S26+ Holo magnética');
fixed(/OVVI CAPA GALAXY S26\+ SILICONE MAGNÉTICA/, 19900, 'Ovvi capa Galaxy S26+ silicone magnética');
fixed(/OVVI CAPA GALAXY S26\+ TRANSPARENTE MAGNÉTICA/, 19900, 'Ovvi capa Galaxy S26+ transparente magnética');
fixed(/OVVI CAPA GALAXY S26\+ FLEX ECO/, 12900, 'Ovvi Flex Eco Galaxy S26+', FAMILY_REFERENCE);
fixed(/OVVI CAPA GALAXY S26 HOLO MAGNÉTICA/, 21900, 'Ovvi capa Galaxy S26 Holo magnética');
fixed(/OVVI CAPA GALAXY S26 SILICONE MAGNÉTICA/, 19900, 'Ovvi capa Galaxy S26 silicone magnética');
fixed(/OVVI CAPA GALAXY S26 TECIDO MAGNÉTICA/, 23900, 'Ovvi capa Galaxy S26 tecido magnética');
fixed(/OVVI CAPA GALAXY S26 TRANSPARENTE MAGNÉTICA/, 19900, 'Ovvi capa Galaxy S26 transparente magnética');
fixed(/OVVI CAPA GALAXY S26 FLEX ECO/, 12900, 'Ovvi Flex Eco Galaxy S26', FAMILY_REFERENCE);

// Capas Ovvi para iPhone.
fixed(/OVVI CAPA IPHONE 13 SILICONE MAGSAFE/, 4900, 'Ovvi capa iPhone 13 silicone MagSafe');
fixed(/OVVI CAPA IPHONE 15 SILICONE MAGSAFE/, 9900, 'Ovvi capa iPhone 15 silicone MagSafe');
fixed(/OVVI CAPA IPHONE 16 PRO MAX (?:SILICONE|TRANSPARENTE) MAGSAFE/, 4900, 'Ovvi capa iPhone 16 Pro Max MagSafe');
fixed(/OVVI CAPA IPHONE 16 PRO (?:ANTIBACTERIANA|SILICONE|TRANSPARENTE)/, 4900, 'Ovvi capa iPhone 16 Pro');
fixed(/OVVI CAPA IPHONE 16E TRANSPARENTE MAGSAFE/, 4900, 'Ovvi capa iPhone 16E transparente MagSafe');
fixed(/OVVI CAPA IPHONE 16 (?:ANTIBACTERIANA|SILICONE|TRANSPARENTE)/, 9900, 'Ovvi capa iPhone 16');
fixed(/OVVI CAPA IPHONE 17 PRO MAX FLEX ECO/, 12900, 'Ovvi Flex Eco iPhone 17 Pro Max');
fixed(/OVVI CAPA IPHONE 17 PRO MAX (?:SILICONE|TRANSPARENTE) MAGSAFE/, 12900, 'Ovvi capa iPhone 17 Pro Max MagSafe');
fixed(/OVVI CAPA IPHONE 17 PRO FLEX ECO/, 12900, 'Ovvi Flex Eco iPhone 17 Pro');
fixed(/OVVI CAPA IPHONE 17 PRO SILICONE MAGSAFE/, 12900, 'Ovvi capa iPhone 17 Pro silicone MagSafe');
fixed(/OVVI CAPA IPHONE 17E FLEX ECO/, 12900, 'Ovvi Flex Eco iPhone 17E', FAMILY_REFERENCE);
fixed(/OVVI CAPA IPHONE 17E (?:SILICONE|TRANSPARENTE) MAGNÉTICA/, 19900, 'Ovvi capa iPhone 17E magnética');
fixed(/OVVI CAPA IPHONE 17 FLEX ECO/, 12900, 'Ovvi Flex Eco iPhone 17');
fixed(/OVVI CAPA IPHONE 17 (?:SILICONE|TRANSPARENTE) MAGSAFE/, 19900, 'Ovvi capa iPhone 17 MagSafe');
fixed(/OVVI CAPA SUPER PROTEÇÃO IPHONE 16 PRO MAX/, 4900, 'Ovvi Super Proteção iPhone 16 Pro Max');
fixed(/OVVI CAPA SUPER PROTEÇÃO IPHONE 17 PRO/, 12900, 'Ovvi Super Proteção iPhone 17 Pro');

// Capas Samsung originais.
fixed(/SAMSUNG CAPA C\/ARGOLA GALAXY FLIP 7/, 26900, 'Samsung capa Galaxy Z Flip7 com argola');
fixed(/SAMSUNG CAPA GALAXY FLIP 7 TRANSPARENTE/, 19900, 'Samsung capa Galaxy Z Flip7 transparente');
fixed(/SAMSUNG CAPA PROTETORA GALAXY S24 FE/, 4900, 'Samsung capa protetora Galaxy S24 FE', FAMILY_REFERENCE);
fixed(/SAMSUNG CAPA PROTETORA GALAXY S25/, 4900, 'Samsung capa protetora Galaxy S25', FAMILY_REFERENCE);

// Películas: as seis opções da tabela do simulador.
fixed(/GSHIELD FILME PRO FOSCA/, 12900, 'Película Fosca Pro');
fixed(/GSHIELD FILME PRO PRIVACIDADE/, 12900, 'Película Privacidade Pro');
fixed(/GSHIELD FILME PRO TRANSPARENTE/, 8900, 'Película Transparente Pro');
fixed(/GSHIELD FILME FOSCA/, 8900, 'Película Fosca');
fixed(/GSHIELD FILME PRIVACIDADE/, 8900, 'Película Privacidade');
fixed(/GSHIELD FILME TRANSPARENTE/, 6900, 'Película Transparente');

// Aparelhos sem matriz por plano e acessórios diversos.
fixed(/AMAZON KINDLE 11/, 64900, 'Kindle 11ª geração 16GB');
fixed(/APPLE IPAD 11 POLEGADAS/, 629900, 'Apple iPad 11 Wi-Fi + Cellular 128GB', VIVO_REFERENCE);
fixed(/APPLE WATCH SE 3 GPS 40MM/, 249900, 'Apple Watch SE 3 GPS 40mm');
fixed(/APPLE WATCH SE 3 GPS 44MM/, 269900, 'Apple Watch SE 3 GPS 44mm');
fixed(/APPLE WATCH ULTRA 2/, 629900, 'Apple Watch Ultra 2 GPS + Cellular');
fixed(/I2GO SMARTWATCH TRACK R200/, 15900, 'i2GO Track R200');
fixed(/I2GO SMARTWATCH TRACK S200/, 14900, 'i2GO Track S200');
fixed(/MOTOROLA MOTO G87 256GB/, 224910, 'Motorola Moto g Max 5G 256GB — equivalente brasileiro', MOTOROLA_REFERENCE, 'reference');
fixed(/SAMSUNG GALAXY TAB S10 FE 5G/, 329900, 'Samsung Galaxy Tab S10 FE 5G 128GB', VIVO_REFERENCE);
fixed(/SAMSUNG GALAXY TAB S10 ULTRA/, 699900, 'Samsung Galaxy Tab S10 Ultra 512GB');
fixed(/SAMSUNG SMARTWATCH FIT 3/, 39900, 'Samsung Galaxy Fit3');
fixed(/SAMSUNG WATCH 8 40MM/, 129900, 'Samsung Galaxy Watch8 BT 40mm');
fixed(/APPLE AIRPODS 4/, 159900, 'Apple AirPods 4 com cancelamento de ruído');
fixed(/HARMAN JBL HEADPHONE TUNE 520/, 18900, 'JBL Tune 520BT');
fixed(/UP2 FONE DE OUVIDO SEM FIO JBL TUNE 520BT/, 18900, 'JBL Tune 520BT');
fixed(/I2GO FONE USB-C METAL BEATS/, 4900, 'i2GO Metal Beats USB-C');
fixed(/I2GO HEADPHONE BLUETOOTH BASS 550 ANC/, 14900, 'i2GO Bass 550 ANC');
fixed(/MOTO FONE DE OUVIDO BUDS BASS/, 29900, 'Moto Buds Bass');
fixed(/WAAW SENSE 210/, 21900, 'WAAW Sense 210');
fixed(/DPC MASSAGEADOR SHIATSU DE PÉS/, 94900, 'Renpho massageador Shiatsu para pés');
fixed(/HUAWEI ROTEADOR 5G CPE 5S/, 129900, 'Huawei roteador 5G');
fixed(/I2GO CORDÃO LANYARD/, 6900, 'i2GO cordão Lanyard Premium', VIVO_REFERENCE);
fixed(/I2GO SUPORTE VEICULAR AIR VENT/, 5900, 'i2GO suporte veicular Air Vent');
fixed(/I2GO SUPORTE VEICULAR ULTRA MAGNETIC/, 6900, 'i2GO suporte Ultra Magnetic');
fixed(/I2GO VENTOSA SUPORTE C\/ MAGNÉTICA/, 9900, 'i2GO suporte magnético com ventosa CBF');
fixed(/OVVI ALÇA UNIVERSAL AZUL/, 14900, 'Ovvi alça universal Azul/Urbano');
fixed(/OVVI ALÇA UNIVERSAL BEGE/, 16900, 'Ovvi alça universal Areia');
fixed(/OVVI ALÇA UNIVERSAL PRETO/, 14900, 'Ovvi alça universal Urbano');
fixed(/OVVI ALÇA UNIVERSAL VERMELHO/, 16900, 'Ovvi alça universal Hibisco');
fixed(/POSITIVO ROBÔ ASPIRADOR/, 69900, 'Positivo robô aspirador Smart Wi-Fi');
fixed(/POSITIVO SMART ALIMENTADOR PET/, 34900, 'Positivo Smart Alimentador Pet');
fixed(/POSITIVO SMART CONTROLE UNIVERSAL/, 7900, 'Positivo Smart Controle Universal');
fixed(/POSITIVO SMART LÂMPADA/, 3900, 'Positivo Smart Lâmpada');
fixed(/POSITIVO SMART PLUG/, 6900, 'Positivo Smart Plug');
fixed(/RM ALMOFADA MASSAG/, 28900, 'Relaxmedic Shiatsu Pillow');
fixed(/RM BALANÇA DIGITAL GO BALANCE/, 9900, 'Relaxmedic Go Balance');
fixed(/RM MINI PISTOLA MASSAG/, 31900, 'Relaxmedic Deep Therapy Mini');
fixed(/SAMSUNG PROJETOR THE FREESTYLE/, 269900, 'Samsung The Freestyle 2ª geração');
fixed(/SIM CARD/, 0, 'Chip Vivo — sem cobrança no pedido', SIMULATOR, 'no_charge');
fixed(/STECK CAMERA 360° PTZ/, 13900, 'Steck câmera 360° PTZ');
fixed(/TELLESCOM REPETIDOR SMT WIFI/, 19900, 'Vivo Smart Wi-Fi RG3110W');
fixed(/UP2 CONSOLE NINTENDO SWITCH OLED/, 209900, 'Nintendo Switch OLED');
fixed(/UP2 CONSOLE PS5 825GB DIGITAL/, 409900, 'PlayStation 5 Slim Digital');
fixed(/VIVO PLAY SMART TV STICK/, 17900, 'Vivo Play Smart TV Stick');
fixed(/VIVO REPETIDOR WI-FI 6/, 44900, 'Vivo repetidor Wi-Fi 6');
fixed(/WAP ROBÔ ASPIRADOR.*W90/, 32900, 'WAP robô aspirador W90');

function parseInventory(source) {
  const linePattern = /^  \('([^']*)', '([^']*)', '([^']*)', '([^']*)', '([^']*)', '([^']*)', (\d+), (\d+), '[^']*', (\d+)\)[,;]$/gm;
  return [...source.matchAll(linePattern)].map((match) => ({
    materialCode: match[1],
    displayName: match[2],
    technicalName: match[3],
    brand: match[4],
    category: match[5],
    cluster: match[6],
  }));
}

function parseMatrixPatterns(source) {
  const marker = 'INSERT INTO device_price_match_rules';
  const section = source.slice(source.indexOf(marker));
  return [...section.matchAll(/^  \('[^']+', '([^']+)', \d+\)[,;]$/gm)].map((match) => match[1]);
}

function likeMatches(value, pattern) {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replaceAll('%', '.*').replaceAll('_', '.');
  return new RegExp(`^${escaped}$`, 'iu').test(value);
}

const [inventorySource, devicePricingSource] = await Promise.all([
  readFile(inventoryPath, 'utf8'),
  readFile(devicePricingPath, 'utf8'),
]);
const inventory = parseInventory(inventorySource);
const matrixPatterns = parseMatrixPatterns(devicePricingSource);

if (inventory.length !== 287) throw new Error(`Esperados 287 materiais no estoque, encontrados ${inventory.length}.`);
if (matrixPatterns.length !== 42) throw new Error(`Esperadas 42 regras de aparelhos, encontradas ${matrixPatterns.length}.`);

const matrixMaterials = inventory.filter((item) => matrixPatterns.some((pattern) => likeMatches(item.displayName.toUpperCase(), pattern)));
const retailMaterials = inventory.filter((item) => !matrixMaterials.includes(item));
const mapped = [];
const unmatched = [];

for (const item of retailMaterials) {
  const rule = priceRules.find((candidate) => candidate.pattern.test(item.displayName));
  if (!rule) {
    unmatched.push(item);
    continue;
  }
  mapped.push({
    materialCode: item.materialCode,
    displayName: item.displayName,
    cluster: item.cluster,
    priceCents: rule.priceCents,
    priceKind: rule.priceKind,
    tableDate: TABLE_DATE,
    sourceLabel: rule.sourceLabel,
    referenceName: rule.referenceName,
  });
}

if (unmatched.length) {
  throw new Error(`Materiais sem preço (${unmatched.length}):\n${unmatched.map((item) => `${item.materialCode}\t${item.displayName}`).join('\n')}`);
}
if (mapped.length + matrixMaterials.length !== inventory.length) {
  throw new Error('A cobertura do catálogo de preços não corresponde ao estoque.');
}

const values = mapped.map((item) => `  (${[
  sqlText(item.materialCode),
  sqlText(item.displayName),
  sqlText(item.cluster),
  item.priceCents,
  sqlText(item.priceKind),
  sqlText(item.tableDate),
  sqlText(item.sourceLabel),
  sqlText(item.referenceName),
].join(', ')})`);

const migration = `PRAGMA foreign_keys = ON;

-- Preços fixos dos demais produtos disponíveis na opção "Adicionar outro produto à venda".
-- Os aparelhos que variam por plano continuam usando as tabelas da migração 0013.

CREATE TABLE product_retail_prices (
  material_code TEXT PRIMARY KEY COLLATE NOCASE,
  display_name TEXT NOT NULL,
  cluster TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  price_kind TEXT NOT NULL CHECK (price_kind IN ('fixed', 'reference', 'no_charge')),
  table_date TEXT NOT NULL,
  source_label TEXT NOT NULL,
  reference_name TEXT NOT NULL
);

ALTER TABLE withdrawal_requests ADD COLUMN order_total_cents INTEGER;
ALTER TABLE withdrawal_quantity_items ADD COLUMN price_type_snapshot TEXT;

INSERT INTO product_retail_prices
  (material_code, display_name, cluster, price_cents, price_kind, table_date, source_label, reference_name)
VALUES
${values.join(',\n')};

UPDATE withdrawal_requests
SET order_total_cents = device_total_cents
WHERE order_total_cents IS NULL AND device_total_cents IS NOT NULL;

INSERT OR REPLACE INTO system_state (key, value) VALUES
  ('retail_pricing_table_date', ${sqlText(TABLE_DATE)}),
  ('retail_pricing_table_source', ${sqlText(SIMULATOR)}),
  ('retail_pricing_material_count', ${sqlText(String(mapped.length))}),
  ('pricing_inventory_coverage', ${sqlText(String(inventory.length))});

CREATE INDEX idx_product_retail_prices_cluster
  ON product_retail_prices(cluster, display_name);
`;

await Promise.all([
  writeFile(outputPath, migration),
  writeFile(auditPath, `${JSON.stringify({
    tableDate: TABLE_DATE,
    inventoryCount: inventory.length,
    planPricedMaterialCount: matrixMaterials.length,
    fixedPricedMaterialCount: mapped.length,
    items: mapped,
  }, null, 2)}\n`),
]);

console.log(`Migração gerada: ${outputPath}`);
console.log(`${matrixMaterials.length} materiais com preço por plano + ${mapped.length} com preço fixo = ${inventory.length} materiais cobertos.`);
