import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Miniflare } from 'miniflare';
import {
  compatibleCaseChoices,
  groupDeviceProducts,
  parseDeviceName,
} from '../public/catalog-groups.js';

let mf;
let database;

class Client {
  constructor(ip) {
    this.cookie = '';
    this.ip = ip;
  }

  async request(path, { method = 'GET', body, headers = {}, csrf = true } = {}) {
    const requestHeaders = { Accept: 'application/json', 'CF-Connecting-IP': this.ip, ...headers };
    if (this.cookie) requestHeaders.Cookie = this.cookie;
    if (csrf && !['GET', 'HEAD'].includes(method)) requestHeaders['X-Requested-With'] = 'estoque-web';
    if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
    const response = await mf.dispatchFetch(`https://controleestoque.app.br${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) this.cookie = setCookie.split(';', 1)[0];
    const payload = response.status === 204 ? null : await response.json();
    return { status: response.status, payload, headers: response.headers };
  }
}

function migrationStatements(sql) {
  const statements = [];
  let current = '';
  let trigger = false;
  for (const line of sql.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^CREATE TRIGGER\b/i.test(trimmed)) trigger = true;
    current += `${line}\n`;
    const finished = trigger ? /^END;$/i.test(trimmed) : trimmed.endsWith(';');
    if (finished) {
      statements.push(current.trim().replace(/;$/, ''));
      current = '';
      trigger = false;
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

async function applyMigration(sql) {
  for (const statement of migrationStatements(sql)) await database.prepare(statement).run();
}

async function row(sql, ...params) {
  return database.prepare(sql).bind(...params).first();
}

before(async () => {
  const modulesRoot = fileURLToPath(new URL('../src/', import.meta.url));
  const [workerSource, securitySource, migration1, migration2, migration3, migration4, migration5, migration6, migration7, migration8, migration9, migration10, migration11, migration12, migration13, migration14, migration15, migration16, migration17, migration18, migration19, migration20, migration21, migration22, migration23, migration24, migration25, migration26, migration27, migration28, migration29, migration30, migration31] = await Promise.all([
    readFile(new URL('../src/worker.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/security.js', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0001_initial.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0002_catalog_store.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0003_generic_accessories.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0004_material_inventory.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0005_product_clusters.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0006_serialized_inventory.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0007_inventory_refresh_excluding_rpar.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0008_user_management.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0009_inventory_refresh_2026_07_29_v2.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0010_management_inventory_2026_07_30.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0011_manager_order_cancellation.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0012_inventory_refresh_2026_08_04.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0013_pricing_catalog_2026_08_04.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0014_retail_pricing_catalog_2026_08_04.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0015_device_pricing_correction_2026_08_04.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0016_vivo_renova.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0017_renova_authoritative_values.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0018_renova_values_2026_08_04.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0019_inventory_refresh_2026_08_05.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0020_pricing_new_products_2026_08_05.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0021_news.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0022_chips.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0023_inventory_refresh_2026_08_07.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0024_pricing_verification_2026_08_07.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0025_chip_suffix_lookup.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0026_inventory_refresh_2026_08_10.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0027_product_images.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0028_product_image_fixes.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0029_tv_samsung_vivo_total_news.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0030_inventory_refresh_2026_08_12.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0031_pricing_refresh_2026_08_13.sql', import.meta.url), 'utf8'),
  ]);
  mf = new Miniflare({
    compatibilityDate: '2026-07-15',
    modulesRoot,
    modules: [
      { type: 'ESModule', path: `${modulesRoot}worker.js`, contents: workerSource },
      { type: 'ESModule', path: `${modulesRoot}security.js`, contents: securitySource },
    ],
    d1Databases: { DB: 'controle-estoque-test-v3' },
    assets: {
      directory: fileURLToPath(new URL('../public/', import.meta.url)),
      binding: 'ASSETS',
      routerConfig: { has_user_worker: true, invoke_user_worker_ahead_of_assets: true },
      assetConfig: { not_found_handling: 'single-page-application' },
    },
  });
  database = await mf.getD1Database('DB');
  await applyMigration(migration1);
  await applyMigration(migration2);
  await applyMigration(migration3);

  await database.batch([
    database.prepare(`INSERT INTO users (id, name, email, password_hash, role) VALUES (99, 'UsuÃ¡rio legado', 'legado@exemplo.com', 'hash', 'seller')`),
    database.prepare(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ('sessao-legada', 99, '2099-01-01T00:00:00.000Z')`),
    database.prepare(`INSERT INTO devices (model, imei, registration_code, created_by) VALUES ('Produto antigo', '350000000000001', 'REG-ANTIGO', 99)`),
    database.prepare(`INSERT INTO withdrawal_requests (id, seller_id, notes) VALUES ('pedido-antigo', 99, 'SerÃ¡ apagado')`),
    database.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type) VALUES (99, 'legacy.action', 'legacy')`),
  ]);
  await applyMigration(migration4);
  await applyMigration(migration5);

  const preservedVariant = await database.prepare(`SELECT id FROM product_variants WHERE sku = '22022613'`).first();
  await database.batch([
    database.prepare(`INSERT INTO withdrawal_requests (id, seller_id, notes) VALUES ('pedido-preservado-v3', 99, 'Pedido que deve permanecer')`),
    database.prepare(`INSERT INTO active_quantity_reservations (variant_id, request_id, quantity) VALUES (?, 'pedido-preservado-v3', 1)`).bind(preservedVariant.id),
    database.prepare(`UPDATE withdrawal_requests SET status = 'rejected', decision_note = 'Teste de preservaÃ§Ã£o', decided_by = 99 WHERE id = 'pedido-preservado-v3'`),
    database.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type) VALUES (99, 'v3.action', 'legacy')`),
  ]);
  await applyMigration(migration6);

  const historicalSerial = await database.prepare(`
    SELECT i.id AS serial_id, i.serial_number, v.id AS variant_id
    FROM inventory_serials i
    JOIN product_variants v ON v.id = i.variant_id
    WHERE i.serial_number = '352501903274752'
  `).first();
  const pendingVariant = await database.prepare(`SELECT id FROM product_variants WHERE sku = '22019904'`).first();
  await database.batch([
    database.prepare(`INSERT INTO withdrawal_requests (id, seller_id, notes) VALUES ('pedido-serie-preservado-v33', 99, 'Pedido serializado histÃ³rico')`),
    database.prepare(`INSERT INTO active_quantity_reservations (variant_id, request_id, quantity) VALUES (?, 'pedido-serie-preservado-v33', 1)`).bind(historicalSerial.variant_id),
    database.prepare(`
      INSERT INTO request_serial_assignments
        (request_id, variant_id, serial_id, serial_number_snapshot)
      VALUES ('pedido-serie-preservado-v33', ?, ?, ?)
    `).bind(historicalSerial.variant_id, historicalSerial.serial_id, historicalSerial.serial_number),
    database.prepare(`
      UPDATE withdrawal_requests
      SET status = 'approved', decision_note = 'Aprovado antes da atualizaÃ§Ã£o',
          decided_by = 99, decided_at = '2026-07-28T12:00:00.000Z'
      WHERE id = 'pedido-serie-preservado-v33'
    `),
    database.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type) VALUES (99, 'v33.serial.approved', 'request')`),
    database.prepare(`INSERT INTO withdrawal_requests (id, seller_id, notes) VALUES ('pedido-pendente-preservado-v33', 99, 'Pendente durante a atualizaÃ§Ã£o')`),
    database.prepare(`INSERT INTO active_quantity_reservations (variant_id, request_id, quantity) VALUES (?, 'pedido-pendente-preservado-v33', 1)`).bind(pendingVariant.id),
  ]);
  await applyMigration(migration7);
  await applyMigration(migration8);
  await applyMigration(migration9);
  await applyMigration(migration10);
  await applyMigration(migration11);
  await applyMigration(migration12);
  await applyMigration(migration13);
  await applyMigration(migration14);
  await applyMigration(migration15);
  await applyMigration(migration16);
  await applyMigration(migration17);
  await applyMigration(migration18);
  await applyMigration(migration19);
  await applyMigration(migration20);
  await applyMigration(migration21);
  await applyMigration(migration22);
  await applyMigration(migration23);
  await applyMigration(migration24);
  await applyMigration(migration25);
  const allocatedChipSerial = await database.prepare(`
    SELECT id FROM inventory_serials WHERE serial_number = '552355469004340503'
  `).first();
  await database.prepare(`
    INSERT INTO chips
      (id, material_code, iccid, inventory_serial_id, assigned_seller_id, created_by, updated_by)
    VALUES ('chip-preservado-0026', 'YBSC001A4000', '89552355469004340503', ?, 99, 99, 99)
  `).bind(allocatedChipSerial.id).run();
  await applyMigration(migration26);
  await applyMigration(migration27);
  await applyMigration(migration28);
  await applyMigration(migration29);
  await applyMigration(migration30);
  await applyMigration(migration31);
});

after(async () => mf?.dispose());

describe('Controle de estoque por cÃ³digo material', () => {
  const manager = new Client('198.51.100.10');
  const seller = new Client('198.51.100.11');
  const stocker = new Client('198.51.100.12');

  test('atualiza o relatÃ³rio de 12/08, exclui RPAR e preserva pedidos e chips distribuÃ­dos', async () => {
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM products')).count), 324);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM products WHERE active = 1')).count), 309);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM product_variants')).count), 324);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM product_variants WHERE active = 1')).count), 309);
    assert.equal(Number((await row('SELECT SUM(quantity_on_hand) AS total FROM product_variants')).total), 1047);
    assert.equal(Number((await row('SELECT SUM(quantity_on_hand) AS total FROM product_variants WHERE active = 1')).total), 1047);
    assert.equal(Number((await row(`SELECT COUNT(*) AS count FROM inventory_serials WHERE status = 'available'`)).count), 1047);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM users WHERE id = 99')).count), 1);
    assert.equal(Number((await row(`SELECT COUNT(*) AS count FROM sessions WHERE token_hash = 'sessao-legada'`)).count), 1);
    assert.equal(Number((await row(`SELECT COUNT(*) AS count FROM withdrawal_requests WHERE id = 'pedido-preservado-v3'`)).count), 1);
    assert.equal(Number((await row(`SELECT COUNT(*) AS count FROM audit_logs WHERE action = 'v3.action'`)).count), 1);
    assert.equal(Number((await row(`SELECT COUNT(*) AS count FROM audit_logs WHERE action = 'v33.serial.approved'`)).count), 1);
    assert.equal((await row(`SELECT status FROM withdrawal_requests WHERE id = 'pedido-pendente-preservado-v33'`)).status, 'approved');
    assert.equal(Number((await row(`SELECT COUNT(*) AS count FROM active_quantity_reservations WHERE request_id = 'pedido-pendente-preservado-v33'`)).count), 0);
    assert.equal(Number((await row(`SELECT COUNT(*) AS count FROM request_serial_assignments WHERE request_id = 'pedido-pendente-preservado-v33'`)).count), 1);
    assert.equal(await row(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'devices'`), null);
    assert.equal(await row(`SELECT id FROM product_variants WHERE sku = '33'`), null);
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'inventory_snapshot_excluded_depots'`)).value, 'RPAR');
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'inventory_snapshot_date'`)).value, '2026-08-12');
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'inventory_snapshot_source'`)).value, 'estoque12.08.xlsx');
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'inventory_snapshot_incoming_depots'`)).value, 'DEPS,NREM');
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'inventory_snapshot_incoming_units'`)).value, '0');
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM incoming_inventory')).count), 0);
    const preservedChip = await row(`
      SELECT c.status, c.active, i.status AS inventory_status
      FROM chips c JOIN inventory_serials i ON i.id = c.inventory_serial_id
      WHERE c.id = 'chip-preservado-0026'
    `);
    assert.equal(preservedChip.status, 'available');
    assert.equal(Number(preservedChip.active), 1);
    assert.equal(preservedChip.inventory_status, 'available');

    const historical = await row(`
      SELECT r.status, a.serial_number_snapshot, i.status AS serial_status
      FROM wÛ}ûîÚ$z{-®éÜj×f:|:6òö’“°¢76W'BæÖF6‚†w&÷W56÷W&6RÂögVæ7F–öâw&÷WFWf–6U&öGV7G2ò“°¢76W'BæÖF6‚†w&÷W56÷W&6RÂögVæ7F–öâ6ö×F–&ÆT66T6†ö–6W2ò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæFWf–6RÖfÖ–Ç’Ö6&EÂæ—2ÖW‡æFVBò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæFWf–6RÖ66W76÷'’Öw&–Bò“°¢76W'BæÖF6‚†6÷W&6RÂöFFÖf÷&ÓÒ&FVÆWFR×W6W""ò“°¢76W'BæÖF6‚†6÷W&6RÂôæ÷f6Væ†µÇ5Å5Ò¦÷6–öæÂö’“°¢76W'BæÖF6‚†6÷W&6RÂô6Væ†GVÂì:6ò6W,:6öÆ–6—FFö’“°¢76W'BæÖF6‚†6÷W&6RÂögVæ7F–öâÖævW$–çfVçF÷'”÷fW'f–Wrò“°¢76W'BæÖF6‚†6÷W&6RÂögVæ7F–öâ6VÆÆW$–çfVçF÷'”÷fW'f–Wrò“°¢76W'BæÖF6‚†6÷W&6RÂögVæ7F–öâ7Fö6¶W$–çfVçF÷'”÷fW'f–Wrò“°¢76W'BæÖF6‚†6÷W&6RÂöFFÖ7F–öãÒ&÷Vâ×7Fö6²Öw&÷W"ò“°¢76W'BæÖF6‚†6÷W&6RÂöFFÖ7F–öãÒ&÷Vâ×7F÷&RÖw&÷W"ò“°¢76W'BæÖF6‚†6÷W&6RÂöFFÖ7F–öãÒ&f–ÇFW"×7Fö6²Ö6FVv÷'’"ò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæ–çfVçF÷'’Öw&÷WÖw&–Bò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæ–çfVçF÷'’Öw&÷WÖ6&Bò“°¢76W'BæÖF6‚†6÷W&6RÂö÷F–öâfÇVSÒ'7Fö6¶W""ò“°¢76W'BæÖF6‚†6÷W&6RÂögVæ7F–öâÖævVÖVçD6ÇW7FW$6†'Bò“°¢76W'BæÖF6‚†6÷W&6RÂögVæ7F–öâ÷&FW$FöçWBò“°¢76W'BæÖF6‚†6÷W&6RÂögVæ7F–öâFVÔ'&Vµ66†VGVÆRò“°¢76W'BæÖF6‚†6÷W&6RÂôæµÇ5Å5Ò££µÇ5Å5Ò£#£3bò“°¢76W'BæÖF6‚†6÷W&6RÂõF†Æ–µÇ5Å5Ò££3µÇ5Å5Ò£3£bò“°¢76W'BæÖF6‚†6÷W&6RÂôÇV—¥µÇ5Å5Ò£#£3eµÇ5Å5Ò£C£"ò“°¢76W'BæÖF6‚†6÷W&6RÂô¦ö–6UµÇ5Å5Ò£3£eµÇ5Å5Ò£C£C"ò“°¢76W'BæÖF6‚†6÷W&6RÂõVG&õµÇ5Å5Ò£C£%µÇ5Å5Ò£S£C‚ò“°¢76W'BæÖF6‚†6÷W&6RÂõ,;7†–Ö6:ÖF6öÖVçFR;72ò&WF÷&æò6öæf—&ÖFòFògVæ6–öì:&–òçFW&–÷"ò“°¢76W'BæÖF6‚†6÷W&6RÂöVÇ6R–bÂ‡7FFUÂçW6W%Âç&öÆRÓÓÒw7Fö6¶W"uÂ•µÇ5Å5Ò§FVÔ'&Vµ66†VGVÆUÂ‚vF6†&ö&BuÂ’ò“°¢76W'BæÖF6‚†6÷W&6RÂ÷FVÔ'&Vµ66†VGVÆUÂ‚vÆ–væÖVçBuÂ’ò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂçFVÒ×66†VGVÆRò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂçFVÒ×66†VGVÆUõö&"ò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæÖævVÖVçBÖF6†&ö&BÖw&–Bò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂç&WVW7G2ÖÆ—7BÒ×7Fö6¶W"ò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæ&Ææ6R×G&6¶VBÖ&FvRò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂòÒÖ'&æC¥Ç2¢6#S†6fbö’“°¢76W'BæFöW4æ÷DÖF6‚‡7G–ÆW56÷W&6RÂòÒÖ'&æC¥Ç2¢2ƒó¦S3#cCgÆfc&CSR’ö’“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂòÒÖ&6¶w&÷VæC¥Ç2¢32ö’“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂö6öÆ÷"×66†VÖS¥Ç2¦F&²ö’“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõFVÖÆ—V–BvÆ72ö’“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂö&6¶G&÷Öf–ÇFW#¥Ç2§6GW&FUÂƒ3RUÂ•Ç2¦&ÇW%Âƒ#'…Â’ö’“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂö6öçFVçB×f—6–&–Æ—G“¥Ç2¦WFòö’“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂòÖÆR×7—7FVÒÅÇ2¤&Æ–æ´Ö57—7FVÔföçBö’“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂ÷&VfW'2×&VGV6VBÖÖ÷F–öã¥Ç2§&VGV6Rö’“°¢76W'BæÖF6‚†6÷W&6RÂô6VçG&ÂFRÆ–æ†ÖVçFòö’“°¢76W'BæÖF6‚†6÷W&6RÂöFFÖ7F–öãÒ&÷VâÖÆ–væÖVçB"ö’“°¢76W'BæÖF6‚†6÷W&6RÂõ&÷FV—&ò+rL:’#Ö–âò“°¢76W'BæÖF6‚†6÷W&6RÂöÖ–çWFW3¥Ç2£eµÇ5Å5Ò¦Ö–çWFW3¥Ç2£eµÇ5Å5Ò¦Ö–çWFW3¥Ç2£EµÇ5Å5Ò¦Ö–çWFW3¥Ç2£Bò“°¢76W'BæÖF6‚†6÷W&6RÂõ&W7VÖòwV–Fò+r"Ö–âò“°¢76W'BæÖF6‚†6÷W&6RÂôÆö¦W†6ÇW6—ff—fòFWfRFVæFW"&W6Væ6–ÆÖVçFRRG&F"FVÖæF2FRFöF÷2÷26W'fœ:v÷2Fòw'Wòò“°¢76W'BæÖF6‚†6÷W&6RÂõ&W6öÇfW"ò&ö&ÆVÖFò6Æ–VçFRì:6ò:’VÒff÷"ö’“°¢76W'BæÖF6‚†6÷W&6RÂögVæ7F–öâÆ–væÖVçDÆVFW'6†—ÖW76vW2ò“°¢76W'BæÖF6‚†6÷W&6RÂõ&VæFòFÂæVw&õµÇ5Å5Ò¥7WW'f—6÷"6öÖW&6–Âò“°¢76W'BæÖF6‚†6÷W&6RÂôÖ&–6ÆF5µÇ5Å5Ò¤FöæFV×&W6ò“°¢76W'BæÖF6‚†6÷W&6RÂô–æFFVÖ÷24åÂòÆö¦2Vçf–æFò÷RVF–æFò&6Æ–VçFW2Æ–v&VÒæ6VçG&Âò“°¢76W'BæÖF6‚†6÷W&6RÂõf72<:6òu$Ô4TÄÂRWRÖR÷&wVÆ†ò×V—FòF—76òò“°¢76W'BæFöW4æ÷DÖF6‚†6÷W&6RÂ÷7&3Ò%ÂöÆ–væÖVçEÂö÷&–VçF6ò×&W6öÇV6òÕ³%ÕÂçvV'"ò“°¢76W'BæÖF6‚†6÷W&6RÂõG&ö6FR6†—ö’“°¢76W'BæÖF6‚†6÷W&6RÂôF—f:|:6òFR,:’ö’“°¢76W'BæÖF6‚†6÷W&6RÂôvW&VçFRvW&ÅµÇ5Å5Ò¤vW&VçFRFR÷W&:|;VW5µÇ5Å5Ò¤6öç7VÇF÷&W2ö’“°¢76W'BæÖF6‚†6÷W&6RÂô6÷¦–æ†R6ÆFRW7F÷VRö’“°¢76W'BæÖF6‚†6÷W&6RÂ÷7FFUÂçW6W%Âç&öÆRÓÒvÖævW"uµÇ5Å5Ò¥Å²wW6W'2rÂvVF—BuÅÒö’“°¢76W'BæÖF6‚†6÷W&6RÂögVæ7F–öâ&VæFW%6–×ÆTÆ–væÖVçBò“°¢76W'BæÖF6‚†6÷W&6RÂõVG&ò6öÖ&–æF÷2&òF–gVæ6–öæ"&VÒö’“°¢76W'BæÖF6‚†6÷W&6RÂô6†V6¶Æ—7BFR36VwVæF÷2ö’“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂç6–×ÆRÖÆ–væÖVçBÖw&–Bò“°¢76W'BæÖF6‚†6÷W&6RÂögVæ7F–öâ&VæFW$æWw2ò“°¢76W'BæÖF6‚†6÷W&6RÂöFFÖ7F–öãÒ&÷VâÖæWw2"ò“°¢76W'BæÖF6‚†6÷W&6RÂöFFÖ7F–öãÒ'FövvÆRÖæWw2"ò“°¢76W'BæÖF6‚†6÷W&6RÂöFFÖ7F–öãÒ'f–WrÖæWw2Ö'B"ò“°¢76W'BæÖF6‚†6÷W&6RÂögVæ7F–öâ6fTæWw4–ÖvUF‚ò“°¢76W'BæÖF6‚†6÷W&6RÂôf÷&ÖF:|:6ò,:–Fò“°¢76W'BæÖF6‚†6÷W&6RÂôö7VÇF"F&ò“°¢76W'BæÖF6‚†6÷W&6RÂõV&Æ–6"æ÷fÖVçFRò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂææWw2Ö†W&òò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂææWw2Ö6&Bò“°¢76W'BæÖF6‚†6÷W&6RÂögVæ7F–öâ&VæFW$6†—2ò“°¢76W'BæÖF6‚†6÷W&6RÂôÖWW26†—2ò“°¢76W'BæÖF6‚†6÷W&6RÂôF–6–öæRl:&–÷2”44”G2:f–ÆR6öæf—&ÖRFöF÷2FRVÖfW¢ò“°¢76W'BæÖF6‚†6÷W&6RÂöFFÖ7F–öãÒ'6VÆV7BÖ6†—ÖÖFW&–Â"ò“°¢76W'BæÖF6‚†6÷W&6RÂöFFÖ7F–öãÒ'6VÆV7BÖ6†—Ö6æF–FFR"ò“°¢76W'BæÖF6‚†6÷W&6RÂöFFÖ7F–öãÒ&FBÖ6†—×FòÖ&F6‚"ò“°¢76W'BæÖF6‚†6÷W&6RÂöFFÖ7F–öãÒ'&VÖ÷fRÖ6†—Ö&F6‚Ö—FVÒ"ò“°¢76W'BæÖF6‚†6÷W&6RÂõÂö•Âö6†—5Âö'VÆ²ò“°¢76W'BæÖF6‚†6÷W&6RÂõÂö•Âö6†—5Âö6æF–FFW2ò“°¢76W'BæÖF6‚†6÷W&6RÂô6÷'&W7öæL:¦æ6––FVçF–f–6FWFöÖF–6ÖVçFRò“°¢76W'BæÖF6‚†6÷W&6RÂö6÷'&W7öæL:¦æ6–2Væ6öçG&F2+r6VÆV6–öæR6÷'&WFò“°¢76W'BæÖF6‚†6÷W&6RÂöFFÖf÷&ÓÒ'6VÆÂÖ6†—"ò“°¢76W'BæÖF6‚†6÷W&6RÂöÆÆö6FVEFõ6VÆÆW'2ò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæ6†—2Ö†W&òò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæ6†—Ö÷væW"Ö6&Bò“°¢76W'BæÖF6‚‡WFFW%6÷W&6RÂöçÒ'Vâ6†V6²ò“°¢76W'BæÖF6‚‡WFFW%6÷W&6RÂöçÒFW7Bò“°¢76W'BæÖF6‚‡WFFW%6÷W&6RÂ÷w&ævÆW"CW‡÷'B6öçG&öÆRÖW7F÷VRÖF"Ò×&VÖ÷FRò“°¢76W'BæÖF6‚‡WFFW%6÷W&6RÂ÷w&ævÆW"CÖ–w&F–öç2Ç’6öçG&öÆRÖW7F÷VRÖF"Ò×&VÖ÷FRò“°¢76W'BæÖF6‚‡WFFW%6÷W&6RÂ÷w&ævÆW"FWÆ÷’ÒÖG'’×'VâÒÖ¶VW×f'2ò“°¢76W'BæÖF6‚‡WFFW%6÷W&6RÂ÷w&ævÆW"FWÆ÷’ÒÖ¶VW×f'2ò“°¢76W'BæÖF6‚‡WFFW%6÷W&6RÂö–bW'&÷&ÆWfVÂv÷Fò¦f–ÆVBò“°¢76W'BæÖF6‚†FWÆ÷–ÖVçEv÷&¶fÆ÷rÂ÷W6ƒ¥µÇ5Å5Ò¦'&æ6†W3¥µÇ5Å5Ò¢ÒÖ–âò“°¢76W'BæÖF6‚†FWÆ÷–ÖVçEv÷&¶fÆ÷rÂ÷VÆÅ÷&WVW7C¥µÇ5Å5Ò¦'&æ6†W3¥µÇ5Å5Ò¢ÒÖ–âò“°¢76W'BæÖF6‚†FWÆ÷–ÖVçEv÷&¶fÆ÷rÂ÷W&Ö—76–öç3¥µÇ5Å5Ò¦6öçFVçG3¢&VBò“°¢76W'BæÖF6‚†FWÆ÷–ÖVçEv÷&¶fÆ÷rÂöæVVG3¢FW7Bò“°¢76W'BæÖF6‚†FWÆ÷–ÖVçEv÷&¶fÆ÷rÂô4ÄõTDdÄ$Uô•õDô´Tã¢ÂEÇµÇ²6V7&WG5Âä4ÄõTDdÄ$Uô•õDô´TâÇÕÇÒò“°¢76W'BæÖF6‚†FWÆ÷–ÖVçEv÷&¶fÆ÷rÂô4ÄõTDdÄ$Uô44õTåEô”C¢ÂEÇµÇ²6V7&WG5Âä4ÄõTDdÄ$Uô44õTåEô”BÇÕÇÒò“°¢76W'BæÖF6‚†FWÆ÷–ÖVçEv÷&¶fÆ÷rÂ÷w&ævÆW"FWÆ÷’ÒÖG'’×'VâÒÖ¶VW×f'2ò“°¢76W'BæÖF6‚†FWÆ÷–ÖVçEv÷&¶fÆ÷rÂ÷w&ævÆW"CÖ–w&F–öç2Ç’6öçG&öÆRÖW7F÷VRÖF"Ò×&VÖ÷FRò“°¢76W'BæÖF6‚†FWÆ÷–ÖVçEv÷&¶fÆ÷rÂ÷w&ævÆW"FWÆ÷’ÒÖ¶VW×f'2ò“°¢76W'BæÖF6‚†FWÆ÷–ÖVçEv÷&¶fÆ÷rÂö‡GG3¥ÂõÂö6öçG&öÆVW7F÷VUÂæÂæ'%Âòò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæ6†—ÖÖFW&–ÂÖ÷F–öâò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæ6†—Ö6æF–FFRÖ÷F–öâò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæ6†—Ö&F6‚Ö—FVÒò“°¢76W'BæFöW4æ÷DÖF6‚‡7G–ÆW56÷W&6RÂõÂæ6†—Ö6ÖW&ÅÂæ6†—×66ææW"ò“°¢76W'BæÖF6‚†6÷W&6RÂö6Æ73Ò&Æ–væÖVçB×v÷&·76R"ò“°¢76W'BæÖF6‚†6÷W&6RÂ÷&öÆSÒ'F&Æ—7B"ò“°¢76W'BæÖF6‚†6÷W&6RÂõFVÖÂEÇ·F÷–4–æFW‚Â²ÇÒFRÂEÇ¶Æ–væÖVçEF÷–75ÂæÆVæwF…ÇÒò“°¢76W'BæFöW4æ÷DÖF6‚†6÷W&6RÂöFFÖ7F–öãÒ&6Æ÷6RÖÆ–væÖVçB"ò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæÆ–væÖVçBÖæf–vF÷"ò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæÆ–væÖVçBÖæeõö—FVÒò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæÆ–væÖVçBÖFWF–Åõ÷vW"ò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæÆ–væÖVçBÖ6öçfW'6F–öâò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæÆ–væÖVçBÖÖW76vUõö'V&&ÆRò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæÆ–væÖVçBÖFWF–Âò“°¢76W'BæÖF6‚†6÷W&6RÂôgVì:|:6òFò6öç7VÇF÷"f’Ì:–ÒFRfVæFW"ö’“°¢76W'BæÖF6‚†6÷W&6RÂõ&W6öÇ\:|:6òæFVÂì+¢scUÂó##2+r'EÂâ#ö’“°¢76W'BæÖF6‚†6÷W&6RÂô'G5Ââœ+¢ÂRc(	3cRö’“°¢76W'BæÖF6‚†6÷W&6RÂôæFVÂ#Â3bRC(	3C"+r4D23Â3R3rö’“°¢76W'BæÖF6‚†6÷W&6RÂô'G5Ââ3BR3’ö’“°¢76W'BæÖF6‚†6÷W&6RÂô'G5Ââl+¢Â3’ÂCbRCrö’“°¢76W'BæÖF6‚†6÷W&6RÂô4ÅB+r'EÂâCc"ö’“°¢76W'BæÖF6‚†6÷W&6RÂö–æf÷&Ö6öW5ÂææFVÅÂæv÷eÂæ'"ö’“°¢76W'BæÖF6‚†6÷W&6RÂ÷ÆæÇFõÂæv÷eÂæ'"ö’“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂô6VçG&ÂFRÆ–æ†ÖVçFò(	BcUÂã’ö’“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæÆ–væÖVçBÖ6†V6¶Æ—7BÆ•µÇ5Å5Ò¦föçB×6—¦S¥Ç2£‡‚ö’“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæÆ–væÖVçBÖÆVvÂò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæÆ–væÖVçBÖÆrÖw&–Bò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõFVÖÆfæF7FVÂö’“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂç&öGV7B×f—7VÂÒÖ66W5µÇ5Å5Ò¢3sSƒ†bö’“°¢76W'BæÖF6‚†–æFW…6÷W&6RÂöæÖSÒ'F†VÖRÖ6öÆ÷""6öçFVçCÒ"3##B"ö’“°¢76W'BæÖF6‚††VFW'56÷W&6RÂö–Ör×7&2w6VÆbrFF¢‡GG3¢ò“°¢76W'BæÖF6‚†–æFW…6÷W&6RÂ÷&VÃÒ&–6öâ"G—SÒ&–ÖvUÂ÷7fuÂ·†ÖÂ"‡&VcÒ%ÂöW7F÷VR×7–Ö&öÅÂç7fr"ò“°¢76W'BæÖF6‚†6÷W&6RÂö'&æBÖÖ&µµãåÒ£åÇ2£Æ–Ör7&3Ò%ÂöW7F÷VR×7–Ö&öÅÂç7fr"ÇCÒ"#âò“°¢76W'BæÖF6‚‡7–Ö&öÅ6÷W&6RÂô6—†FRW7F÷VR6öÒÖ&6FR6öæfW,:¦æ6–ò“°¢76W'BæÖF6‚†–æFW…6÷W&6RÂö–CÒ&6'B×&ö÷B"FFÖ6'BÖ&"ò“°¢76W'BæÖF6‚†–æFW…6÷W&6RÂ÷7G–ÆW5Âæ775Ã÷cÓeÂãeÂãBò“°¢76W'BæÖF6‚†–æFW…6÷W&6RÂöÂæ§5Ã÷cÓeÂãeÂãBò“°¢76W'BæÖF6‚†6÷W&6RÂõ&öGWF÷26Ö–æ†òò“°¢76W'BæÖF6‚†6÷W&6RÂöFFÖ–æ6öÖ–ærÖ6FÆörò“°¢76W'BæÖF6‚†6÷W&6RÂö–æ6öÖ–ætFW÷6—G5FW‡Bò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæ–æ6öÖ–ær×6†÷v66Rò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæ–æ6öÖ–ær×&öGV7BÖ6&Bò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂæ6'BÖf%Ç2¥ÇµµÇ5Å5Ò£÷÷6—F–öã¥Ç2¦f—†VCµµÇ5Å5Ò£÷&–v‡C¥Ç2£#ƒµµÇ5Å5Ò£ö&÷GFöÓ¥Ç2£#ƒµµÇ5Å5Ò£÷¢Ö–æFWƒ¥Ç2£““““²ò“°¢76W'BæÖF6‚†6÷W&6RÂögVæ7F–öâ&öGV7D–ÖvTÖ&·WÂ‡&öGWFòÂ6Æ74æÖRÂv–GF‚Â†V–v‡EÂ’ò“°¢76W'BæÖF6‚†6÷W&6RÂögVæ7F–öâ&öGV7D–ÖvUW&ÅÂ‡&öGWFõÂ•µÇ5Å5Ò§G—Vöb&öGWFõÃõÂæ–ÖvVÕ÷W&ÂÓÓÒw7G&–ærrÃò&öGWFõÂæ–ÖvVÕ÷W&ÅÂçG&–ÕÂ…Â’ò“°¢76W'BæÖF6‚†6÷W&6RÂöW66T‡FÖÅÂ‡&öGV7D–ÖvUW&ÅÂ‡&öGWFõÂ•Â’ò“°¢76W'BæÖF6‚†6÷W&6RÂö6'BÖG&vW"Ö—FVÕõ÷F‡VÖ%µåÆåÒ¥ÂEÇ·&öGV7D–ÖvTÖ&·WÂ‡&öGWFòÂv6'BÖG&vW"Ö—FVÕõö–ÖvRrÂcBÂcEÂ•ÇÒò“°¢76W'BæÖF6‚†6÷W&6RÂöFF×&öGV7BÖ–ÖvSÒ'G'VR"ò“°¢76W'BæÖF6‚†6÷W&6RÂögVæ7F–öâ†æFÆU&öGV7D–ÖvTW'&÷%Â†WfVçEÂ’ò“°¢76W'BæÖF6‚†6÷W&6RÂöFö7VÖVçEÂæFDWfVçDÆ—7FVæW%Â‚vW'&÷"rÂ†æFÆU&öGV7D–ÖvTW'&÷"ÂG'VUÂ’ò“°¢76W'BæFöW4æ÷DÖF6‚†6÷W&6RÂööæW'&÷#Òò“°¢76W'BæFöW4æ÷DÖF6‚†6÷W&6RÂô4„dUôDô”ÔtTÕôT—Ä–ç7V6–öææFòFF÷2Fò&öGWF÷Çf–ÂçÆ6V†öÆFW%Âæ6ö×ÇÆ6V†öÆEÂæ6òò“°¢76W'BæÖF6‚†6÷W&6RÂ÷7Fö6²×&öGV7BÖ6VÆÅõö–ÖvRò“°¢76W'BæÖF6‚†6÷W&6RÂö6'BÖG&vW"Ö—FVÕõö–ÖvRò“°¢76W'BæÖF6‚†6÷W&6RÂ÷–6¶W"×&öGV7Eõö–ÖvRò“°¢76W'BæÖF6‚†6÷W&6RÂö6'B×&Wf–Wuõö–ÖvRò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂç&öGV7BÖ–ÖvRÖÖVF–õö–ÖvUµÇ5Å5Ò¦Ö‚×v–GFƒ¥Ç2£Rò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂç&öGV7BÖ–ÖvRÖÖVF–õö–ÖvUµÇ5Å5Ò¦ö&¦V7BÖf—C¥Ç2¦6öçF–âò“°¢76W'BæÖF6‚‡7G–ÆW56÷W&6RÂõÂç–6¶W"×&öGV7Eõö–ÖvUµÇ5Å5Ò¦ö&¦V7BÖf—C¥Ç2¦6öçF–âò“°¢76W'BæÖF6‚†6÷W&6RÂö6öç7B&W&W6VçFF—fU&öGV7BÒ÷F–öåÃõÂç&öGV7BÇÅÇÂw&÷WÂç&öGV7G5Å³ÅÒò“°¢76W'BæÖF6‚†6÷W&6RÂöFö7VÖVçEÂæFDWfVçDÆ—7FVæW%Â‚tDôÔ6öçFVçDÆöFVBrò“°¢76W'BæÖF6‚†6÷W&6RÂövWDVÆVÖVçD'”–EÂ‚v6'B×&ö÷BuÂ•ÃõÂæFDWfVçDÆ—7FVæW%Â‚v6Æ–6²rÂ†æFÆT6'E&ö÷D6Æ–6µÂ’ò“°¢76W'BæÖF6‚†6÷W&6RÂö'WGFöåÂæ–BÓÓÒv6'BÖf"rò“°¢76W'BæFöW4æ÷DÖF6‚†6÷W&6RÂ÷–77VÕÂç†÷F÷7ÆFF¦–ÖvUÂ÷7fuÂ·†ÖÇÄDTdTÅEõ$ôET5Eô”ÔtUõU$ÇÇ&öGV7BÖFVfVÇEÂç7fwÆFFÖfÆÆ&6²×7&2ò“°¢76W'BæFöW4æ÷DÖF6‚‡v÷&¶W%6÷W&6RÂõ$ôET5Eô”ÔtUô%•ô4ÅU5DU'Ç&öGV7BÖ–ÖvW5Âö6FVv÷'’Òò“°¢76W'BæFöW4æ÷DÖF6‚†6÷W&6RÂóÆF—bFFÖ6'BÖ&#ãÅÂöF—câò“°¢f÷"†6öç7BÆ&VÂöb²t&VÆ†÷2rÂt62rÂuVÌ:Ö7VÆ2rÂt6—†2FR6öÒrÂtæ÷FV&öö·2rÂuEg2rÂt6'&VvF÷&W2rÂt6&÷2rÂt6W7<;7&–÷2F—fW'6÷2uÒ’°¢76W'BæÖF6‚†6÷W&6RÂæWr&VtW‡†Æ&VÂÂv’r’“°¢Ğ ¢6öç7BvRÒv—BÖbæF—7F6„fWF6‚‚v‡GG3¢òö6öçG&öÆVW7F÷VRææ'"òr“°¢6öç7B67&—BÒv—BÖbæF—7F6„fWF6‚‚v‡GG3¢òö6öçG&öÆVW7F÷VRææ'"öæ§3÷cÓbãbãBr“°¢6öç7Bw&÷W567&—BÒv—BÖbæF—7F6„fWF6‚‚v‡GG3¢òö6öçG&öÆVW7F÷VRææ'"ö6FÆörÖw&÷W2æ§2r“°¢6öç7BÆ–væÖVçD–ÖvRÒv—BÖbæF—7F6„fWF6‚‚v‡GG3¢òö6öçG&öÆVW7F÷VRææ'"öÆ–væÖVçBöF—GVFW2×&öf—76–öæ—2çvV'r“°¢6öç7BæWw4–ÖvRÒv—BÖbæF—7F6„fWF6‚‚v‡GG3¢òö6öçG&öÆVW7F÷VRææ'"öæWw2÷6VÖæÖvÖW"Ó##bÓ‚æ§Vrr“°¢6öç7BGdæWw4–ÖvRÒv—BÖbæF—7F6„fWF6‚‚v‡GG3¢òö6öçG&öÆVW7F÷VRææ'"öæWw2÷Gb×6×7Vær×f—fò×F÷FÂÓSRÓ“‚Ó##bÓ‚æ§rr“°¢6öç7BGdæWw4–ÖvT6ö×7BÒv—BÖbæF—7F6„fWF6‚‚v‡GG3¢òö6öçG&öÆVW7F÷VRææ'"öæWw2÷Gb×6×7Vær×f—fò×F÷FÂÓ3"ÓC2ÓSÓ##bÓ‚æ§rr“°¢6öç7BGdæWw46&D–ÖvRÒv—BÖbæF—7F6„fWF6‚‚v‡GG3¢òö6öçG&öÆVW7F÷VRææ'"öæWw2÷Gb×6×7Vær×f—fò×F÷FÂÓSRÓ“‚Ó##bÓ‚Ö6&Bæ§rr“°¢6öç7BGdæWw46&D–ÖvT6ö×7BÒv—BÖbæF—7F6„fWF6‚‚v‡GG3¢òö6öçG&öÆVW7F÷VRææ'"öæWw2÷Gb×6×7Vær×f—fò×F÷FÂÓ3"ÓC2ÓSÓ##bÓ‚Ö6&Bæ§rr“°¢6öç7BFF—F–öæÄæWw46&D–ÖvW2Òv—B&öÖ—6RæÆÂ…°¢w6VÖæÖvÖW"Ó##bÓ‚Ö6&Bæ§rrÀ¢v6×æ†2Ö6W76÷&–÷2Ó##bÓ‚Ö6&Bæ§rrÀ¢v'VæFÆR×6×7VærÓ##bÓ‚Ö6&Bæ§rrÀ¢v'VæFÆRÖÖ÷F÷&öÆÓ##bÓ‚Ö6&Bæ§rrÀ¢v'VæFÆRÖÆRÓ##bÓ‚Ö6&Bæ§rrÀ¢ÒæÖ‚†f–ÆTæÖR’ÓâÖbæF—7F6„fWF6‚†‡GG3¢òö6öçG&öÆVW7F÷VRææ'"öæWw2òG¶f–ÆTæÖWÖ’’“°¢76W'BæWVÂ‡vRæ†VFW'2ævWB‚v66†RÖ6öçG&öÂr’Âvæò×7F÷&Rr“°¢76W'BæWVÂ‡vRæ†VFW'2ævWB‚wW&Ö—76–öç2×öÆ–7’r’Âv6ÖW&Ò‚’ÂÖ–7&÷†öæSÒ‚’ÂvVöÆö6F–öãÒ‚’r“°¢76W'BæÖF6‚‡vRæ†VFW'2ævWB‚v6öçFVçB×6V7W&—G’×öÆ–7’r’ÇÂrrÂö–Ör×7&2w6VÆbrFF¢‡GG3¢ò“°¢76W'BæWVÂ‡67&—Bæ†VFW'2ævWB‚v66†RÖ6öçG&öÂr’ÂvæòÖ66†Rr“°¢76W'BæWVÂ†w&÷W567&—Bæ†VFW'2ævWB‚v66†RÖ6öçG&öÂr’ÂvæòÖ66†Rr“°¢76W'BæWVÂ†Æ–væÖVçD–ÖvRç7FGW2Â#“°¢76W'BæWVÂ†æWw4–ÖvRç7FGW2Â#“°¢76W'BæÖF6‚†æWw4–ÖvRæ†VFW'2ævWB‚v6öçFVçB×G—Rr’ÇÂrrÂö–ÖvUÂö§Vrö’“°¢76W'BæWVÂ‡GdæWw4–ÖvRç7FGW2Â#“°¢76W'BæÖF6‚‡GdæWw4–ÖvRæ†VFW'2ævWB‚v6öçFVçB×G—Rr’ÇÂrrÂö–ÖvUÂö§Vrö’“°¢76W'BæWVÂ‡GdæWw4–ÖvT6ö×7Bç7FGW2Â#“°¢76W'BæÖF6‚‡GdæWw4–ÖvT6ö×7Bæ†VFW'2ævWB‚v6öçFVçB×G—Rr’ÇÂrrÂö–ÖvUÂö§Vrö’“°¢76W'BæWVÂ‡GdæWw46&D–ÖvRç7FGW2Â#“°¢76W'BæÖF6‚‡GdæWw46&D–ÖvRæ†VFW'2ævWB‚v6öçFVçB×G—Rr’ÇÂrrÂö–ÖvUÂö§Vrö’“°¢76W'BæWVÂ‡GdæWw46&D–ÖvT6ö×7Bç7FGW2Â#“°¢76W'BæÖF6‚‡GdæWw46&D–ÖvT6ö×7Bæ†VFW'2ævWB‚v6öçFVçB×G—Rr’ÇÂrrÂö–ÖvUÂö§Vrö’“°¢f÷"†6öç7B&W7öç6RöbFF—F–öæÄæWw46&D–ÖvW2’°¢76W'BæWVÂ‡&W7öç6Rç7FGW2Â#“°¢76W'BæÖF6‚‡&W7öç6Ræ†VFW'2ævWB‚v6öçFVçB×G—Rr’ÇÂrrÂö–ÖvUÂö§Vrö’“°¢Ğ¢6öç7B&VæFW&VE67&—BÒv—B67&—BçFW‡B‚“°¢76W'BæÖF6‚‡&VæFW&VE67&—BÂ÷Gb×6×7Vær×f—fò×F÷FÂÓSRÓ“‚Ó##bÓ‚Ö6&EÂæ§rò“°¢76W'BæÖF6‚‡&VæFW&VE67&—BÂö'VæFÆRÖÆRÓ##bÓ‚Ö6&EÂæ§rò“°¢Ò“°§Ò“°