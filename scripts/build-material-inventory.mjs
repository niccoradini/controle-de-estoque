import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const modulePath = fileURLToPath(import.meta.url);

const samsungModels = new Map([
  ['A066M', 'A06'],
  ['A076M', 'A07'],
  ['A176B', 'A17 5G'],
  ['A266M', 'A26 5G'],
  ['A366E', 'A36 5G'],
  ['A376B', 'A37 5G'],
  ['A576B', 'A57 5G'],
  ['F761B', 'Z FLIP7 FE'],
  ['F766B', 'Z FLIP7'],
  ['F776B', 'Z FLIP8'],
  ['F966B/DS', 'Z FOLD7'],
  ['F971B', 'Z FOLD8'],
  ['S731B', 'S25 FE'],
  ['S931B', 'S25'],
  ['S938B', 'S25 ULTRA'],
  ['S942B', 'S26'],
  ['S947B', 'S26+'],
  ['S948B', 'S26 ULTRA'],
]);

const motorolaModels = new Map([
  ['XT2433-1', 'MOTO G35'],
  ['XT2503-1', 'EDGE 60 FUSION'],
  ['XT2507-1', 'EDGE 60 PRO'],
  ['XT2527-1', 'MOTO G86'],
  ['XT2529-1', 'MOTO G56'],
  ['XT2601-3', 'EDGE 70'],
  ['XT2603-2', 'SIGNATURE'],
  ['XT2605-3', 'EDGE 70 FUSION'],
  ['XT2621-1', 'MOTO G67'],
  ['XT2621-3', 'MOTO G77'],
  ['XT2621-5', 'MOTO G87'],
  ['XT2625-1', 'MOTO G47'],
]);

const finalColors = new Map([
  ['PT', 'PRETO'],
  ['PR', 'PRATA'],
  ['BR', 'BRANCO'],
  ['AZ', 'AZUL'],
  ['AZM', 'AZUL-MARINHO'],
  ['CZ', 'CINZA'],
  ['VD', 'VERDE'],
  ['RS', 'ROSA'],
  ['VM', 'VERMELHO'],
  ['GF', 'GRAFITE'],
  ['MR', 'MARROM'],
  ['LJ', 'LARANJA'],
  ['TPT', 'TRANSPARENTE'],
  ['RX', 'ROXO'],
  ['VT', 'VIOLETA'],
  ['BG', 'BEGE'],
  ['DR', 'DOURADO'],
]);

export function simplifyName(technicalName) {
  let name = technicalName.toUpperCase().normalize('NFC').trim();

  name = name
    .replace(/^SSG\b/, 'SAMSUNG')
    .replace(/\s*PPB\s*\/P291\/\d+\s*$/i, '')
    .replace(/\s*PPB\s*\/\d+\s*$/i, '')
    .replace(/([A-Z]{2,3})PPB\s*\/P291\/\d+\s*$/i, ' $1')
    .replace(/\s+N(?=\s+(?:BR|PT|AZ|AZM|PR|CZ|VD|RS|VM|GF|MR|LJ|VT)\b|$)/g, '')
    .replace(/\bTN PT\b/g, 'TITÂNIO PRETO');

  for (const [code, model] of samsungModels) {
    name = name.replace(new RegExp(`\\b${code.replace('/', '\\/')}\\b`, 'g'), model);
  }
  for (const [code, model] of motorolaModels) {
    name = name.replace(new RegExp(`\\b${code}\\b`, 'g'), model);
  }

  name = name
    .replace(/\bSMARTPHONE\b/g, '')
    .replace(/^CM\s+(?:CP|CAPA)\s+/, 'CAPA ')
    .replace(/^OVVI\s+(?:AF|CM)\s+/, 'OVVI ')
    .replace(/^OVVI\s+CP\s+/, 'OVVI CAPA ')
    .replace(/^SAMSUNG\s+CP\s+/, 'SAMSUNG CAPA ')
    .replace(/\bCP\b/g, 'CAPA')
    .replace(/\bPMAX\b/g, 'PRO MAX')
    .replace(/\b(\d{2})PMAX\b/g, '$1 PRO MAX')
    .replace(/\b(\d{2})PRO\b/g, '$1 PRO')
    .replace(/\bUSBC\b/g, 'USB-C')
    .replace(/\bMGSAFE\b/g, 'MAGSAFE')
    .replace(/\bMGNETIC\b/g, 'MAGNÉTICO')
    .replace(/(^|\s)MAGN(?=\s|$)/g, '$1MAGNÉTICA')
    .replace(/\bSILIC\b/g, 'SILICONE')
    .replace(/\bANTIBAC\b/g, 'ANTIBACTERIANA')
    .replace(/\bCLEAR\b/g, 'TRANSPARENTE')
    .replace(/\bULT\b/g, 'ULTRA')
    .replace(/\bSUPT\b/g, 'SUPORTE')
    .replace(/\bCARREG\.\s*/g, 'CARREGADOR ')
    .replace(/\bCARREG\b/g, 'CARREGADOR')
    .replace(/\bCAR\.\s*/g, 'CARREGADOR ')
    .replace(/\bGER\b/g, 'GERAÇÃO')
    .replace(/\bPOL\b/g, 'POLEGADAS')
    .replace(/\bBT\b/g, 'BLUETOOTH')
    .replace(/\bS\/FIO\b/g, 'SEM FIO')
    .replace(/\b3EM1\b/gi, '3 EM 1')
    .replace(/\b4EM1\b/gi, '4 EM 1')
    .replace(/\bFONE OUVIDO\b/g, 'FONE DE OUVIDO')
    .replace(/^SAMSUNG FONE DE OUVIDO GALAXY\b/g, 'SAMSUNG GALAXY')
    .replace(/\bRELOGIO\b/g, 'RELÓGIO')
    .replace(/\bTEXTU\./g, 'TEXTURIZADA')
    .replace(/\bC\/\s+/g, 'COM ')
    .replace(/\bCANCEL\. DE RUIDO\b/g, 'CANCELAMENTO DE RUÍDO')
    .replace(/\bPROTECAO\b/g, 'PROTEÇÃO')
    .replace(/\bCONECT\./g, 'CONECTOR')
    .replace(/\bALCA\b/g, 'ALÇA')
    .replace(/\bROBO\b/g, 'ROBÔ')
    .replace(/\bPO\b/g, 'PÓ')
    .replace(/\bLAMPADA\b/g, 'LÂMPADA')
    .replace(/\bMAGNETICO\b/g, 'MAGNÉTICO')
    .replace(/\bPORTATIL\b/g, 'PORTÁTIL')
    .replace(/\bBALANCA\b/g, 'BALANÇA')
    .replace(/\bMASSAG\.\b/g, 'MASSAGEADORA')
    .replace(/\s+/g, ' ')
    .trim();

  const demoColor = name.match(/\s([A-Z]{2,3})\s+DEMO$/)?.[1];
  if (demoColor && finalColors.has(demoColor)) {
    name = name.replace(new RegExp(`\\b${demoColor}\\s+DEMO$`), `${finalColors.get(demoColor)} DEMO`);
  } else {
    const lastToken = name.match(/\s([A-Z]{2,3})$/)?.[1];
    if (lastToken && finalColors.has(lastToken)) {
      name = `${name.slice(0, -(lastToken.length)).trim()} ${finalColors.get(lastToken)}`;
    }
  }
  return name;
}

export function categoryFor(name) {
  if (/\bFILME\b/.test(name)) return 'screen_protector';
  if (/\bCAPA\b/.test(name)) return 'case';
  if (/^APPLE (?:IPHONE|IPAD|WATCH)/.test(name)
      || /^SAMSUNG GALAXY (?:A\d|S\d|Z |TAB )/.test(name)
      || /^MOTOROLA (?:MOTO G|EDGE \d|SIGNATURE)/.test(name)
      || /^(?:ACER NOTEBOOK|AMAZON KINDLE)/.test(name)) return 'phone';
  return 'accessory';
}

export function clusterFor(name, category) {
  if (category === 'case') return 'cases';
  if (category === 'screen_protector') return 'screen_protectors';
  if (/\bNOTEBOOK\b/.test(name)) return 'notebooks';
  if (/^SAMSUNG SMART TV\b/.test(name)) return 'tvs';
  if (/\b(?:CAIXA SOM|CAIXA AMPLIF|SPEAKER|ECHO SPOT)\b/.test(name)) return 'speakers';
  if (/\b(?:CARREGADOR|POWERBANK|POWER BANK)\b/.test(name)) return 'chargers';
  if (/\bCABO\b/.test(name)) return 'cables';
  if (category === 'phone' || /\b(?:SMARTWATCH|WATCH)\b/.test(name)) return 'devices';
  return 'misc';
}

export function brandFor(name) {
  if (name.startsWith('CAPA GALAXY')) return 'Case-Mate';
  if (name.startsWith('CAPA MOTO') || name.startsWith('CAPA MOTOROLA')) return 'Case-Mate';
  if (name.startsWith('SIM CARD') || name.startsWith('CARTÃO REC.')) return 'Vivo';
  const token = name.split(' ')[0];
  const known = new Map([['I2GO', 'i2GO'], ['OVVI', 'Ovvi'], ['GSHIELD', 'GShield'], ['DPC', 'DPC'], ['RM', 'Renpho'], ['UP2', 'UP2'], ['VIVO', 'Vivo'], ['WAP', 'WAP']]);
  return known.get(token) || token[0] + token.slice(1).toLowerCase();
}

export function sqlText(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function buildLegacyInventory(sourcePath) {
const source = JSON.parse(await readFile(resolve(sourcePath), 'utf8'));
const inventory = source
  .filter((row) => row.material !== '33' && Number(row.freeQuantity) > 0)
  .map((row) => {
    const technicalName = String(row.names[0]).trim();
    const displayName = simplifyName(technicalName);
    const category = categoryFor(displayName);
    return {
      materialCode: String(row.material).trim(),
      displayName,
      technicalName,
      category,
      cluster: clusterFor(displayName, category),
      brand: brandFor(displayName),
      quantity: Number(row.freeQuantity),
    };
  })
  .sort((a, b) => a.displayName.localeCompare(b.displayName, 'pt-BR') || a.materialCode.localeCompare(b.materialCode));

if (inventory.length !== 282) throw new Error(`Esperados 282 materiais, encontrados ${inventory.length}.`);
const total = inventory.reduce((sum, item) => sum + item.quantity, 0);
if (total !== 1140) throw new Error(`Esperadas 1.140 unidades, encontradas ${total}.`);
if (new Set(inventory.map((item) => item.materialCode)).size !== inventory.length) throw new Error('Há códigos materiais duplicados.');

const dataPath = resolve(projectRoot, 'data/inventory-2026-07-20.json');
await mkdir(dirname(dataPath), { recursive: true });
await writeFile(dataPath, `${JSON.stringify({ importedAt: '2026-07-20', source: 'EXPORT_20260720_093306.XLSX', productCount: inventory.length, totalQuantity: total, products: inventory }, null, 2)}\n`);

const productValues = inventory.map((item, index) => `  (${sqlText(`${item.displayName} · ${item.materialCode}`)}, ${sqlText(item.displayName)}, ${sqlText(item.technicalName)}, ${sqlText(item.brand)}, ${sqlText(item.category)}, '', '', '', '{}', 1, ${index + 1})`).join(',\n');
const variantValues = inventory.map((item) => `  ((SELECT id FROM products WHERE name = ${sqlText(`${item.displayName} · ${item.materialCode}`)}), '', '', '', ${sqlText(item.materialCode)}, 'quantity', ${item.quantity}, 1)`).join(',\n');

const migration = `PRAGMA foreign_keys = ON;

-- Importação única do estoque em 20/07/2026.
-- Mantém usuários, sessões e configuração. Limpa estoque, pedidos e histórico anteriores.
DROP TRIGGER IF EXISTS reservation_requires_available_device;
DROP TRIGGER IF EXISTS reservation_captures_device;
DROP TRIGGER IF EXISTS approved_request_withdraws_devices;
DROP TRIGGER IF EXISTS rejected_request_releases_devices;
DROP TRIGGER IF EXISTS approval_requires_complete_reservation;
DROP TRIGGER IF EXISTS quantity_reservation_captures_item;

DELETE FROM active_reservations;
DELETE FROM withdrawal_items;
DELETE FROM active_quantity_reservations;
DELETE FROM withdrawal_quantity_items;
DELETE FROM withdrawal_requests;
DELETE FROM devices;
DELETE FROM product_variants;
DELETE FROM products;
DELETE FROM audit_logs;

DROP TABLE active_reservations;
DROP TABLE withdrawal_items;
DROP TABLE devices;

ALTER TABLE products ADD COLUMN display_name TEXT;
ALTER TABLE products ADD COLUMN technical_name TEXT;
ALTER TABLE withdrawal_quantity_items ADD COLUMN material_code_snapshot TEXT NOT NULL DEFAULT '';

INSERT INTO products
  (name, display_name, technical_name, brand, category, option1_label, option2_label, option3_label, presets_json, active, sort_order)
VALUES
${productValues};

INSERT INTO product_variants
  (product_id, option1_value, option2_value, option3_value, sku, stock_mode, quantity_on_hand, active)
VALUES
${variantValues};

CREATE TRIGGER quantity_reservation_captures_item
AFTER INSERT ON active_quantity_reservations
FOR EACH ROW
BEGIN
  INSERT INTO withdrawal_quantity_items
    (request_id, variant_id, product_name_snapshot, material_code_snapshot,
     option1_label_snapshot, option1_value_snapshot,
     option2_label_snapshot, option2_value_snapshot,
     option3_label_snapshot, option3_value_snapshot, quantity)
  SELECT NEW.request_id, v.id, COALESCE(p.display_name, p.name), COALESCE(v.sku, ''),
         '', '', '', '', '', '', NEW.quantity
  FROM product_variants v
  JOIN products p ON p.id = v.product_id
  WHERE v.id = NEW.variant_id;
END;

CREATE TRIGGER approval_requires_complete_reservation
BEFORE UPDATE OF status ON withdrawal_requests
FOR EACH ROW
WHEN NEW.status = 'approved' AND (
  (SELECT COUNT(*) FROM withdrawal_quantity_items WHERE request_id = NEW.id) = 0
  OR (SELECT COUNT(*) FROM withdrawal_quantity_items WHERE request_id = NEW.id)
       <> (SELECT COUNT(*) FROM active_quantity_reservations WHERE request_id = NEW.id)
  OR EXISTS (
    SELECT 1
    FROM withdrawal_quantity_items i
    LEFT JOIN active_quantity_reservations r
      ON r.request_id = i.request_id AND r.variant_id = i.variant_id
    WHERE i.request_id = NEW.id AND (r.variant_id IS NULL OR r.quantity <> i.quantity)
  )
)
BEGIN
  SELECT RAISE(ABORT, 'RESERVATION_MISMATCH');
END;
`;

const migrationPath = resolve(projectRoot, 'migrations/0004_material_inventory.sql');
await writeFile(migrationPath, migration);
console.log(`Gerados ${inventory.length} materiais e ${total} unidades.`);
}

if (resolve(process.argv[1] || '') === modulePath) {
  const sourcePath = process.argv[2];
  if (!sourcePath) throw new Error('Uso: node scripts/build-material-inventory.mjs caminho/inventory-products.json');
  await buildLegacyInventory(sourcePath);
}
