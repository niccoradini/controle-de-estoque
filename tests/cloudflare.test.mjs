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
  const [workerSource, securitySource, migration1, migration2, migration3, migration4, migration5, migration6, migration7, migration8, migration9, migration10, migration11, migration12, migration13, migration14, migration15, migration16, migration17, migration18, migration19, migration20, migration21, migration22, migration23, migration24, migration25, migration26, migration27, migration28, migration29, migration30, migration31, migration32, migration33, migration34, migration35, migration36, migration37, migration38, migration39, migration40, migration41, migration42, migration45, migration46, migration47, migration48, migration49, migration50, migration51, migration52, migration53, migration54, migration55, migration56, migration57, migration58, migration59, migration60, migration61] = await Promise.all([
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
    readFile(new URL('../migrations/0032_renova_boosts_2026_08_12.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0033_semana_gamer_controle_news.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0034_renova_intake.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0035_renova_imei.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0036_renova_registration_code.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0037_inventory_refresh_2026_08_18.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0038_renova_boosts_2026_08_17.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0039_pricing_refresh_2026_08_18.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0040_waaw_second_item_news.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0041_inventory_refresh_2026_08_19.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0042_product_images_2026_08_20.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0045_pricing_refresh_2026_08_25.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0046_inventory_refresh_2026_08_25.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0047_inventory_refresh_2026_08_25.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0048_incoming_inventory_details_2026_08_25.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0049_incoming_delivery_dates_2026_08_25.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0050_inventory_refresh_2026_08_26.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0051_incoming_inventory_details_2026_08_26.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0052_employee_re_login.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0053_s26_case_retail_prices.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0054_employee_point_qr.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0055_employee_point_punches.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0056_pricing_and_renova_refresh_2026_08_27.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0057_replenishment_orders.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0058_inventory_refresh_2026_08_28.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0059_incoming_inventory_details_2026_08_28.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0060_network_inventory_2026_08_29.sql', import.meta.url), 'utf8'),
    readFile(new URL('../migrations/0061_renova_boosts_2026_09_01.sql', import.meta.url), 'utf8'),
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
    database.prepare(`INSERT INTO users (id, name, email, password_hash, role) VALUES (99, 'Usuário legado', 'legado@exemplo.com', 'hash', 'seller')`),
    database.prepare(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ('sessao-legada', 99, '2099-01-01T00:00:00.000Z')`),
    database.prepare(`INSERT INTO devices (model, imei, registration_code, created_by) VALUES ('Produto antigo', '350000000000001', 'REG-ANTIGO', 99)`),
    database.prepare(`INSERT INTO withdrawal_requests (id, seller_id, notes) VALUES ('pedido-antigo', 99, 'Será apagado')`),
    database.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type) VALUES (99, 'legacy.action', 'legacy')`),
  ]);
  await applyMigration(migration4);
  await applyMigration(migration5);

  const preservedVariant = await database.prepare(`SELECT id FROM product_variants WHERE sku = '22022613'`).first();
  await database.batch([
    database.prepare(`INSERT INTO withdrawal_requests (id, seller_id, notes) VALUES ('pedido-preservado-v3', 99, 'Pedido que deve permanecer')`),
    database.prepare(`INSERT INTO active_quantity_reservations (variant_id, request_id, quantity) VALUES (?, 'pedido-preservado-v3', 1)`).bind(preservedVariant.id),
    database.prepare(`UPDATE withdrawal_requests SET status = 'rejected', decision_note = 'Teste de preservação', decided_by = 99 WHERE id = 'pedido-preservado-v3'`),
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
    database.prepare(`INSERT INTO withdrawal_requests (id, seller_id, notes) VALUES ('pedido-serie-preservado-v33', 99, 'Pedido serializado histórico')`),
    database.prepare(`INSERT INTO active_quantity_reservations (variant_id, request_id, quantity) VALUES (?, 'pedido-serie-preservado-v33', 1)`).bind(historicalSerial.variant_id),
    database.prepare(`
      INSERT INTO request_serial_assignments
        (request_id, variant_id, serial_id, serial_number_snapshot)
      VALUES ('pedido-serie-preservado-v33', ?, ?, ?)
    `).bind(historicalSerial.variant_id, historicalSerial.serial_id, historicalSerial.serial_number),
    database.prepare(`
      UPDATE withdrawal_requests
      SET status = 'approved', decision_note = 'Aprovado antes da atualização',
          decided_by = 99, decided_at = '2026-07-28T12:00:00.000Z'
      WHERE id = 'pedido-serie-preservado-v33'
    `),
    database.prepare(`INSERT INTO audit_logs (actor_user_id, action, entity_type) VALUES (99, 'v33.serial.approved', 'request')`),
    database.prepare(`INSERT INTO withdrawal_requests (id, seller_id, notes) VALUES ('pedido-pendente-preservado-v33', 99, 'Pendente durante a atualização')`),
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
  await applyMigration(migration32);
  await applyMigration(migration33);
  await applyMigration(migration34);
  await applyMigration(migration35);
  await applyMigration(migration36);
  await applyMigration(migration37);
  await applyMigration(migration38);
  await applyMigration(migration39);
  await applyMigration(migration40);
  await applyMigration(migration41);
  await applyMigration(migration42);
  await applyMigration(migration45);
  await applyMigration(migration46);
  await applyMigration(migration47);
  await applyMigration(migration48);
  await applyMigration(migration49);
  await applyMigration(migration50);
  await applyMigration(migration51);
  await applyMigration(migration52);
  await applyMigration(migration53);
  await applyMigration(migration54);
  await applyMigration(migration55);
  await applyMigration(migration56);
  await applyMigration(migration57);
  await applyMigration(migration58);
  await applyMigration(migration59);
  await applyMigration(migration60);
  await applyMigration(migration61);
});

after(async () => mf?.dispose());

describe('Controle de estoque por código material', () => {
  const manager = new Client('198.51.100.10');
  const seller = new Client('198.51.100.11');
  const stocker = new Client('198.51.100.12');

  test('atualiza o relatório de 28/08, exclui RPAR e preserva pedidos e chips distribuídos', async () => {
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM products')).count), 338);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM products WHERE active = 1')).count), 330);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM product_variants')).count), 338);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM product_variants WHERE active = 1')).count), 330);
    assert.equal(Number((await row('SELECT SUM(quantity_on_hand) AS total FROM product_variants')).total), 928);
    assert.equal(Number((await row('SELECT SUM(quantity_on_hand) AS total FROM product_variants WHERE active = 1')).total), 928);
    assert.equal(Number((await row(`SELECT COUNT(*) AS count FROM inventory_serials WHERE status = 'available'`)).count), 928);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM repair_inventory')).count), 110);
    assert.equal(Number((await row('SELECT COUNT(DISTINCT material_code) AS count FROM repair_inventory')).count), 14);
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
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'inventory_snapshot_date'`)).value, '2026-08-28');
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'inventory_snapshot_source'`)).value, 'ESTOQUE28.08.xlsx');
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'inventory_snapshot_incoming_depots'`)).value, 'DEPS,NREM');
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'inventory_snapshot_incoming_units'`)).value, '203');
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM incoming_inventory')).count), 57);
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
      FROM withdrawal_requests r
      JOIN request_serial_assignments a ON a.request_id = r.id
      JOIN inventory_serials i ON i.id = a.serial_id
      WHERE r.id = 'pedido-serie-preservado-v33'
    `);
    assert.equal(historical.status, 'approved');
    assert.equal(historical.serial_number_snapshot, '352501903274752');
    assert.equal(historical.serial_status, 'withdrawn');

    const iphone = await row(`SELECT p.display_name, p.technical_name, v.quantity_on_hand FROM products p JOIN product_variants v ON v.product_id = p.id WHERE v.sku = 'DGAP27743000'`);
    assert.equal(iphone.display_name, 'APPLE IPHONE 17 PRO MAX 256GB PRATA');
    assert.equal(iphone.technical_name, 'APPLE IPHONE 17 PRO MAX 256GB PR');
    assert.equal(Number(iphone.quantity_on_hand), 0);
    assert.equal(Number((await row(`SELECT quantity_on_hand FROM product_variants WHERE sku = '22022613'`)).quantity_on_hand), 3);
    assert.equal(Number((await row(`SELECT quantity_on_hand FROM product_variants WHERE sku = '22022526'`)).quantity_on_hand), 14);
    assert.equal((await row(`SELECT status FROM inventory_serials WHERE serial_number = '22022526370124'`)).status, 'available');
    assert.equal((await row(`SELECT status FROM inventory_serials WHERE serial_number = '22022526351919'`)).status, 'withdrawn');
    assert.equal((await row(`SELECT status FROM inventory_serials WHERE serial_number = '220233860385832'`)).status, 'withdrawn');
    assert.equal((await row(`SELECT status FROM inventory_serials WHERE serial_number = '220248011005026'`)).status, 'withdrawn');
    assert.equal((await row(`SELECT status FROM inventory_serials WHERE serial_number = '357497950988037'`)).status, 'withdrawn');

    const clusterRows = (await database.prepare(`
      SELECT p.cluster, COUNT(*) AS products, SUM(v.quantity_on_hand) AS units
      FROM products p JOIN product_variants v ON v.product_id = p.id
      WHERE p.active = 1 AND v.active = 1
      GROUP BY p.cluster
    `).all()).results;
    const clusters = Object.fromEntries(clusterRows.map((item) => [item.cluster, { products: Number(item.products), units: Number(item.units) }]));
    assert.deepEqual(clusters, {
      cables: { products: 22, units: 61 },
      cases: { products: 117, units: 167 },
      chargers: { products: 24, units: 71 },
      devices: { products: 97, units: 139 },
      misc: { products: 49, units: 257 },
      notebooks: { products: 2, units: 1 },
      screen_protectors: { products: 7, units: 207 },
      speakers: { products: 10, units: 13 },
      tvs: { products: 2, units: 12 },
    });
    assert.equal(Number((await row(`SELECT active FROM product_variants WHERE sku = 'YBSC001A1000'`)).active), 1);
    assert.equal(Number((await row(`SELECT active FROM product_variants WHERE sku = 'TGSA56224000'`)).active), 1);

    const newMotorola = await row(`
      SELECT p.display_name, v.quantity_on_hand
      FROM products p JOIN product_variants v ON v.product_id = p.id
      WHERE v.sku = 'TGMO61152000'
    `);
    assert.equal(newMotorola.display_name, 'MOTOROLA MOTO G47 128GB GRAFITE');
    assert.equal(Number(newMotorola.quantity_on_hand), 2);

    const newMotoG56 = await row(`
      SELECT p.display_name, p.cluster, v.quantity_on_hand
      FROM products p JOIN product_variants v ON v.product_id = p.id
      WHERE v.sku = 'TGMO50152000'
    `);
    assert.equal(newMotoG56.display_name, 'MOTOROLA MOTO G56 256GB GRAFITE');
    assert.equal(newMotoG56.cluster, 'devices');
    assert.equal(Number(newMotoG56.quantity_on_hand), 0);

    const addedMotorola = await row(`
      SELECT p.display_name, v.quantity_on_hand
      FROM products p JOIN product_variants v ON v.product_id = p.id
      WHERE v.sku = 'TGMO47952000'
    `);
    assert.equal(addedMotorola.display_name, 'MOTOROLA MOTO G35 128GB GRAFITE');
    assert.equal(Number(addedMotorola.quantity_on_hand), 3);

    const addedNintendo = await row(`
      SELECT p.display_name, p.cluster, v.quantity_on_hand
      FROM products p JOIN product_variants v ON v.product_id = p.id
      WHERE v.sku = '22023954'
    `);
    assert.equal(addedNintendo.display_name, 'UP2 CONSOLE NINTENDO SWITCH OLED BRANCO');
    assert.equal(addedNintendo.cluster, 'misc');
    assert.equal(Number(addedNintendo.quantity_on_hand), 1);
    assert.equal(Number((await row(`SELECT quantity_on_hand FROM product_variants WHERE sku = 'DGAP22722000'`)).quantity_on_hand), 4);

    await database.prepare(`DELETE FROM chips WHERE id = 'chip-preservado-0026'`).run();

    const newProducts = (await database.prepare(`
      SELECT v.sku, p.display_name, p.cluster, v.quantity_on_hand
      FROM products p JOIN product_variants v ON v.product_id = p.id
      WHERE v.sku IN ('22022936', '22024837', '22024888', 'TGMO586C2000')
      ORDER BY v.sku
    `).all()).results;
    assert.deepEqual(newProducts.map((item) => ({
      sku: item.sku,
      name: item.display_name,
      cluster: item.cluster,
      quantity: Number(item.quantity_on_hand),
    })), [
      { sku: '22022936', name: 'AMAZON ECHO SPOT 2024 ALEXA RELÓGIO PRETO', cluster: 'speakers', quantity: 1 },
      { sku: '22024837', name: 'OVVI I2GO CAPA GALAXY S26+ SILICONE MAGNÉTICA PRETO', cluster: 'cases', quantity: 1 },
      { sku: '22024888', name: 'SAMSUNG GALAXY BUDS4 PRO PRETO', cluster: 'misc', quantity: 1 },
      { sku: 'TGMO586C2000', name: 'MOTOROLA MOTO G67 128GB CINZA', cluster: 'devices', quantity: 2 },
    ]);
  });

  test('configura o gerente e protege a sessão', async () => {
    const initial = await manager.request('/api/setup');
    assert.equal(initial.status, 200);
    assert.equal(initial.payload.needsSetup, true);

    const missingCsrf = await manager.request('/api/setup', {
      method: 'POST', csrf: false,
      body: { name: 'Gerente', email: 'gerente@exemplo.com', password: 'SenhaForte123' },
    });
    assert.equal(missingCsrf.status, 403);

    const setup = await manager.request('/api/setup', {
      method: 'POST', body: { name: 'Gerente Geral', email: 'gerente@exemplo.com', password: 'SenhaForte123' },
    });
    assert.equal(setup.status, 201);
    assert.equal(setup.payload.user.role, 'manager');
    assert.match(manager.cookie, /^estoque_session=/);
    assert.match(setup.headers.get('set-cookie'), /HttpOnly; Secure; SameSite=Lax/);

    const changedWithoutOldPassword = await manager.request('/api/auth/password', {
      method: 'PATCH', body: { newPassword: 'NovaSenhaGerente123' },
    });
    assert.equal(changedWithoutOldPassword.status, 200);
    assert.equal((await manager.request('/api/dashboard')).status, 200);

    const oldPassword = new Client('198.51.100.12');
    assert.equal((await oldPassword.request('/api/auth/login', {
      method: 'POST', body: { email: 'gerente@exemplo.com', password: 'SenhaForte123' },
    })).status, 401);
  });

  test('organiza o estoque do painel gerencial nos nove grupos', async () => {
    const dashboard = await manager.request('/api/dashboard');
    assert.equal(dashboard.status, 200);
    assert.deepEqual(dashboard.payload.inventoryGroups.map((group) => group.cluster), [
      'devices', 'cases', 'screen_protectors', 'speakers', 'notebooks', 'tvs', 'chargers', 'cables', 'misc',
    ]);
    assert.equal(dashboard.payload.inventoryGroups.reduce((sum, group) => sum + group.materialCount, 0), 330);
    assert.equal(dashboard.payload.inventoryGroups.reduce((sum, group) => sum + group.onHand, 0), 928);
    assert.equal(
      dashboard.payload.inventoryGroups.reduce((sum, group) => sum + group.available, 0),
      dashboard.payload.stock.available,
    );
    assert.ok(dashboard.payload.inventoryGroups.every((group) => group.topProducts.length <= 3));
    assert.doesNotMatch(JSON.stringify(dashboard.payload.inventoryGroups), /serialNumber|serialNumbers|serial_number/i);
    assert.equal(dashboard.payload.management.outOfStockMaterials, 37);
    assert.equal(dashboard.payload.management.incomingUnits, 203);
    assert.equal(dashboard.payload.management.incomingMaterials, 57);
    assert.equal(dashboard.payload.management.shortageProducts.length, 12);
    assert.equal(dashboard.payload.management.incomingProducts.length, 57);
    assert.ok(dashboard.payload.management.incomingProducts.some((product) => (
      product.materialCode === '22018137'
      && product.incoming === 1
      && product.incomingDeposits['DEPS NREM'] === 1
    )));
    assert.equal(dashboard.payload.management.snapshot.source, 'ESTOQUE28.08.xlsx');
    assert.ok(dashboard.payload.management.deviceProducts.length > 0);
    assert.ok(dashboard.payload.management.deviceProducts.every((product) => product.cluster === 'devices'));
    assert.doesNotMatch(JSON.stringify(dashboard.payload.management.deviceProducts), /serialNumber|serialNumbers|serial_number/i);

    const devices = dashboard.payload.inventoryGroups.find((group) => group.cluster === 'devices');
    assert.equal(devices.materialCount, 97);
    assert.equal(devices.onHand, 139);
    const repairs = await manager.request('/api/repairs');
    assert.equal(repairs.status, 200);
    assert.deepEqual(repairs.payload.summary, { units: 110, materials: 14, snapshotDate: '2026-08-28' });
    assert.equal(repairs.payload.items.length, 110);
    assert.ok(repairs.payload.items.every((item) => item.deposit === 'RPAR'));
    assert.equal((await seller.request('/api/repairs')).status, 401);
  });

  test('mostra ao gerente o estoque comparativo das outras lojas sem expor séries', async () => {
    const response = await manager.request('/api/network-inventory');
    assert.equal(response.status, 200);
    assert.deepEqual(response.payload.stores.map((store) => store.name).sort(), ['Avenida', 'BQ Lucas', 'Pátio'].sort());
    assert.equal(response.payload.stores.reduce((sum, store) => sum + store.totalUnits, 0), 3511);
    assert.equal(response.payload.stores.reduce((sum, store) => sum + store.available, 0), 3132);
    assert.equal(response.payload.stores.reduce((sum, store) => sum + store.incoming, 0), 328);
    assert.equal(response.payload.stores.reduce((sum, store) => sum + store.repair, 0), 51);
    assert.equal(response.payload.items.length, 790);
    assert.ok(response.payload.items.some((item) => item.cluster === 'devices' && item.available > 0));
    assert.doesNotMatch(JSON.stringify(response.payload), /serialNumber|serialNumbers|serial_number/i);
    assert.equal((await new Client('198.51.100.55').request('/api/network-inventory')).status, 401);
  });

  test('cria vendedor, exige a troca provisória e permite ao gerente editar todos os dados', async () => {
    const created = await manager.request('/api/users', {
      method: 'POST', body: { name: 'Vendedor Um', email: 'vendedor@exemplo.com', employeeRe: '81234567', password: 'Provisoria123', role: 'seller' },
    });
    assert.equal(created.status, 201);
    assert.equal(created.payload.user.mustChangePassword, true);

    const login = await seller.request('/api/auth/login', {
      method: 'POST', body: { identifier: '81234567', password: 'Provisoria123' },
    });
    assert.equal(login.status, 200);
    assert.equal((await seller.request('/api/catalog')).status, 403);

    const changed = await seller.request('/api/auth/password', {
      method: 'PATCH', body: { currentPassword: 'Provisoria123', newPassword: 'SenhaVendedor123' },
    });
    assert.equal(changed.status, 200);
    assert.equal((await seller.request('/api/catalog')).status, 200);
    assert.equal((await seller.request('/api/users')).status, 403);

    const updated = await manager.request(`/api/users/${created.payload.user.id}`, {
      method: 'PUT',
      body: {
        name: 'Vendedor Atualizado',
        email: 'vendedor.novo@exemplo.com',
        employeeRe: '81234568',
        password: 'SenhaDefinidaGerente123',
        role: 'seller',
        active: true,
      },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.payload.user.name, 'Vendedor Atualizado');
    assert.equal(updated.payload.user.email, 'vendedor.novo@exemplo.com');
    assert.equal(updated.payload.user.employeeRe, '81234568');
    assert.equal(updated.payload.user.mustChangePassword, false);
    assert.equal((await seller.request('/api/catalog')).status, 401);

    const oldAccess = new Client('198.51.100.13');
    assert.equal((await oldAccess.request('/api/auth/login', {
      method: 'POST', body: { email: 'vendedor@exemplo.com', password: 'SenhaVendedor123' },
    })).status, 401);
    const newLogin = await seller.request('/api/auth/login', {
      method: 'POST', body: { email: 'vendedor.novo@exemplo.com', password: 'SenhaDefinidaGerente123' },
    });
    assert.equal(newLogin.status, 200);
    assert.equal(newLogin.payload.user.mustChangePassword, false);
    const reLogin = await new Client('198.51.100.131').request('/api/auth/login', {
      method: 'POST', body: { identifier: '81234568', password: 'SenhaDefinidaGerente123' },
    });
    assert.equal(reLogin.status, 200);
    assert.equal((await new Client('198.51.100.132').request('/api/auth/login', {
      method: 'POST', body: { identifier: '81234567', password: 'SenhaDefinidaGerente123' },
    })).status, 401);
    assert.equal((await seller.request('/api/catalog')).status, 200);
  });

  test('entrega a cada funcionário somente o próprio QR Code do ponto', async () => {
    const sellerUser = await row(`SELECT id FROM users WHERE email = 'vendedor.novo@exemplo.com'`);
    const emptyPoint = await seller.request('/api/point/me');
    assert.equal(emptyPoint.status, 200);
    assert.equal(emptyPoint.payload.qrCode, null);
    assert.equal(emptyPoint.headers.get('cache-control'), 'private, no-store, max-age=0');

    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    const forbiddenUpload = await seller.request(`/api/users/${sellerUser.id}/point-qr`, {
      method: 'PUT', body: { mimeType: 'image/png', imageBase64: pngBase64 },
    });
    assert.equal(forbiddenUpload.status, 403);

    const uploaded = await manager.request(`/api/users/${sellerUser.id}/point-qr`, {
      method: 'PUT', body: { mimeType: 'image/png', imageBase64: pngBase64 },
    });
    assert.equal(uploaded.status, 200);
    assert.equal(uploaded.payload.hasPointQr, true);

    const ownPoint = await seller.request('/api/point/me');
    assert.equal(ownPoint.status, 200);
    assert.equal(ownPoint.payload.employee.employeeRe, '81234568');
    assert.equal(ownPoint.payload.qrCode.imageDataUrl, `data:image/png;base64,${pngBase64}`);
    assert.equal((await seller.request('/api/users')).status, 403);
    assert.equal((await seller.request(`/api/users/${sellerUser.id}/point-qr`)).status, 404);

    const users = await manager.request('/api/users');
    assert.equal(users.payload.users.find((user) => user.id === Number(sellerUser.id)).hasPointQr, true);
    assert.ok(users.payload.users.filter((user) => user.id !== Number(sellerUser.id)).every((user) => !user.hasPointQr));
  });

  test('registra o horário do ponto no servidor e mantém o histórico individual', async () => {
    const before = Date.now();
    const punched = await seller.request('/api/point/me/punch', { method: 'POST' });
    assert.equal(punched.status, 201);
    assert.equal(punched.payload.message, 'Ponto registrado com sucesso.');
    assert.ok(Date.parse(punched.payload.punch.punchedAt) >= before);

    const duplicate = await seller.request('/api/point/me/punch', { method: 'POST' });
    assert.equal(duplicate.status, 409);

    const ownPoint = await seller.request('/api/point/me');
    assert.equal(ownPoint.status, 200);
    assert.equal(ownPoint.payload.punches.length, 1);
    assert.equal(ownPoint.payload.punches[0].punchedAt, punched.payload.punch.punchedAt);
    assert.equal(ownPoint.headers.get('cache-control'), 'private, no-store, max-age=0');

    const otherPoint = await manager.request('/api/point/me');
    assert.deepEqual(otherPoint.payload.punches, []);
    const audit = await row(`SELECT actor_user_id, action, details_json FROM audit_logs WHERE action = 'point.punched'`);
    assert.equal(audit.action, 'point.punched');
    assert.equal(JSON.parse(audit.details_json).punchedAt, punched.payload.punch.punchedAt);
  });

  test('gerente acompanha o ponto da equipe sem registrar o próprio ponto', async () => {
    assert.equal((await manager.request('/api/point/me/punch', { method: 'POST' })).status, 403);
    assert.equal((await seller.request('/api/point/team')).status, 403);

    const overview = await manager.request('/api/point/team');
    assert.equal(overview.status, 200);
    assert.equal(overview.headers.get('cache-control'), 'private, no-store, max-age=0');
    assert.ok(overview.payload.generatedAt);
    assert.ok(overview.payload.members.length >= 1);
    assert.ok(overview.payload.members.every((member) => member.role !== 'manager'));
    const sellerMember = overview.payload.members.find((member) => member.employeeRe === '81234568');
    assert.ok(sellerMember);
    assert.equal(sellerMember.punches.length, 1);
  });

  test('expõe o catálogo sem vazar séries e bloqueia movimentação manual', async () => {
    assert.equal((await seller.request('/api/repairs')).status, 403);
    const catalog = await manager.request('/api/catalog');
    assert.equal(catalog.status, 200);
    assert.equal(catalog.payload.products.length, 330);
    assert.equal(catalog.payload.products.reduce((sum, product) => sum + product.onHand, 0), 928);
    assert.ok(catalog.payload.products.every((product) => Object.hasOwn(product, 'imagem_url')));
    const currentProductsWithImages = catalog.payload.products.filter((product) => (
      product.variants.some((variant) => variant.materialCode === 'DGAP20312000')
      && /^https:\/\//.test(product.imagem_url)
    ));
    assert.equal(currentProductsWithImages.length, 1);
    assert.match(currentProductsWithImages[0].imagem_url, /iphone-15|4314552/i);
    const imageCoverage = await row(`SELECT COUNT(*) AS count FROM products WHERE trim(COALESCE(imagem_url, '')) <> ''`);
    assert.equal(Number(imageCoverage.count), 324);
    assert.ok(catalog.payload.products.every((product) => !Object.hasOwn(product, 'imageUrl')));
    assert.ok(catalog.payload.products.every((product) => product.variants.length === 1
      && product.variants[0].stockMode === 'quantity' && product.variants[0].serialTracked === true));
    assert.deepEqual(new Set(catalog.payload.products.map((product) => product.cluster)), new Set([
      'devices', 'cases', 'screen_protectors', 'speakers', 'notebooks', 'tvs', 'chargers', 'cables', 'misc',
    ]));

    const iphone = catalog.payload.products.find((product) => product.variants[0].materialCode === 'DGAP27943000');
    assert.equal(iphone.name, 'APPLE IPHONE 17 PRO MAX 1TB PRATA');
    assert.equal(catalog.payload.pricing.tableDate, '2026-08-27');
    assert.equal(catalog.payload.pricing.retailTableDate, '2026-08-04');
    assert.equal(catalog.payload.pricing.categories.length, 9);
    assert.equal(catalog.payload.products.filter((product) => product.pricing).length, 79);
    assert.equal(catalog.payload.products.filter((product) => product.retailPrice).length, 234);
    const sellerCatalog = await seller.request('/api/catalog');
    assert.equal(sellerCatalog.payload.products.filter((product) => product.pricing).length, 56);
    assert.equal(iphone.pricing.model, 'iPhone 17 Pro Max 1TB');
    assert.equal(iphone.pricing.prices['VIVO V'], 1119900);
    const iphone15 = catalog.payload.products.find((product) => product.variants[0].materialCode === 'DGAP20312000');
    assert.equal(iphone15.pricing.model, 'iPhone 15 256GB');
    assert.equal(iphone15.pricing.prices['PRÉ'], 479900);
    assert.equal(iphone15.pricing.prices['CONTROLE BTL'], 479900);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM device_price_profiles')).count), 47);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM device_price_values')).count), 423);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM product_retail_prices')).count), 234);
    assert.equal((await row(`SELECT price_cents FROM product_retail_prices WHERE material_code = '22023768'`)).price_cents, 12900);
    assert.equal((await row(`SELECT price_cents FROM product_retail_prices WHERE material_code = '22023386'`)).price_cents, 6900);
    assert.equal((await row(`SELECT price_cents FROM product_retail_prices WHERE material_code = '22023388'`)).price_cents, 8900);
    assert.equal(Number((await row(`SELECT price_cents FROM product_retail_prices WHERE material_code = '22025161'`)).price_cents), 299900);
    assert.equal(Number((await row(`SELECT price_cents FROM product_retail_prices WHERE material_code = 'TGSA62254000'`)).price_cents), 329900);
    assert.equal(Number((await row(`SELECT price_cents FROM product_retail_prices WHERE material_code = 'YBSC001A4000'`)).price_cents), 0);
    const newMoto = catalog.payload.products.find((product) => product.variants[0].materialCode === 'TGMO611B2000');
    assert.equal(newMoto.pricing.model, 'Moto G47 5G 128GB');
    assert.equal(newMoto.pricing.prices['FAMILIA 3'], 90900);
    const motoG56 = catalog.payload.products.find((product) => product.variants[0].materialCode === 'TGMO50152000');
    assert.equal(motoG56.pricing.model, 'Moto G56 5G 256GB');
    assert.equal(motoG56.pricing.prices['VIVO V'], 119900);
    const motoG67 = catalog.payload.products.find((product) => product.variants[0].materialCode === 'TGMO586C2000');
    assert.equal(motoG67.pricing.model, 'Motorola Moto G67 5G 128GB');
    assert.equal(motoG67.pricing.tableDate, '2026-08-27');
    assert.deepEqual(motoG67.pricing.prices, {
      'PRÉ': 149900,
      'CONTROLE BTL': 149900,
      'CONTROLE ENTRADA': 139900,
      'CONTROLE ALTO VALOR': 129900,
      'PÓS INDIVIDUAL': 124900,
      'FAMILIA 2': 119900,
      'FAMILIA 3': 114900,
      'FAMILIA 4/5': 109900,
      'VIVO V': 104900,
    });
    for (const code of ['22022936', '22024888']) {
      const accessoryWithoutSimulatorPrice = catalog.payload.products
        .find((product) => product.variants[0].materialCode === code);
      assert.equal(accessoryWithoutSimulatorPrice.pricing, null);
      assert.equal(accessoryWithoutSimulatorPrice.retailPrice, null);
    }
    const pricedS26Case = catalog.payload.products.find((product) => product.variants[0].materialCode === '22024837');
    assert.equal(pricedS26Case.pricing, null);
    assert.equal(pricedS26Case.retailPrice.priceCents, 19900);
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'pricing_last_verification_date'`)).value, '2026-08-27');
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'pricing_last_verification_source_table_date'`)).value, '2026-08-27');
    const iphone14 = catalog.payload.products.find((product) => product.variants[0].materialCode === 'DGAP17622000');
    assert.equal(iphone14.pricing.model, 'iPhone 14 256GB');
    assert.equal(iphone14.pricing.prices['VIVO V'], 269900);
    const flip8 = catalog.payload.products.find((product) => product.variants[0].materialCode === 'TGSA61762000');
    assert.equal(flip8.pricing.model, 'Samsung Galaxy Z Flip 8 512GB');
    assert.equal(flip8.pricing.prices['FAMILIA 3'], 639900);
    const fold8Catalog = catalog.payload.products.find((product) => product.variants[0].materialCode === 'TGSA61962000');
    assert.equal(fold8Catalog.pricing.model, 'Samsung Galaxy Z Fold 8 512GB');
    assert.equal(fold8Catalog.pricing.prices['FAMILIA 3'], 819900);
    const fold8 = catalog.payload.products.find((product) => product.available === 0 && product.incoming > 0 && product.pricing);
    assert.ok(fold8);
    const blockedIncomingWithoutVerifiedPrice = await seller.request('/api/requests', {
      method: 'POST',
      body: { lines: [{ variantId: fold8.variants[0].id, quantity: 1 }], priceCategory: 'FAMILIA 3' },
    });
    assert.equal(blockedIncomingWithoutVerifiedPrice.status, 409);
    assert.match(blockedIncomingWithoutVerifiedPrice.payload.error, /quantidade solicitada/i);
    const hiddenSerial = await row(`SELECT serial_number FROM inventory_serials WHERE variant_id = ? LIMIT 1`, iphone.variants[0].id);
    assert.doesNotMatch(JSON.stringify(catalog.payload), new RegExp(hiddenSerial.serial_number.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    const adjusted = await manager.request('/api/inventory/quantity', {
      method: 'POST', body: { variantId: iphone.variants[0].id, quantityDelta: 2 },
    });
    assert.equal(adjusted.status, 409);
    assert.match(adjusted.payload.error, /número de série/i);
    assert.equal((await seller.request('/api/inventory/quantity', { method: 'POST', body: { variantId: iphone.variants[0].id, quantityDelta: 1 } })).status, 403);
    assert.equal((await manager.request('/api/devices')).status, 404);
  });

  test('mantém os 423 preços de aparelhos iguais à auditoria integral', async () => {
    const [audit, source] = await Promise.all([
      readFile(new URL('../scripts/pricing-audit-2026-08-25.json', import.meta.url), 'utf8').then(JSON.parse),
      readFile(new URL('../scripts/pricing-source-2026-08-25-final.json', import.meta.url), 'utf8').then(JSON.parse),
    ]);
    const result = await database.prepare(`
      SELECT price_key, category, price_cents
      FROM device_price_values
      ORDER BY price_key, category
    `).all();
    const databasePrices = new Map(result.results.map((item) => [
      `${item.price_key}\u0000${item.category}`,
      Number(item.price_cents),
    ]));
    const sourceByKey = new Map(source.map((item) => [item.key, item]));
    const moneyToCents = (value) => {
      const normalized = String(value).replace(/[^0-9,]/g, '').replace(',', '.');
      return Math.round(Number(normalized) * 100);
    };
    let checked = 0;
    for (const model of audit.models) {
      const sourceModel = sourceByKey.get(model.key);
      assert.ok(sourceModel, `Fonte ausente: ${model.name}`);
      for (const category of audit.pricedCategories) {
        const expected = model.prices[category];
        assert.equal(databasePrices.get(`${model.key}\u0000${category}`), expected, `${model.name} · ${category} no banco`);
        assert.equal(moneyToCents(sourceModel.prices[category]), expected, `${model.name} · ${category} na fonte`);
        checked += 1;
      }
    }
    assert.equal(checked, 423);
    assert.equal(databasePrices.size, 423);
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'pricing_audit_value_count'`)).value, '423');
  });

  test('organiza os produtos no painel do vendedor sem revelar dados gerenciais', async () => {
    const dashboard = await seller.request('/api/dashboard');
    assert.equal(dashboard.status, 200);
    assert.equal(dashboard.payload.role, 'seller');
    assert.deepEqual(dashboard.payload.inventoryGroups.map((group) => group.cluster), [
      'devices', 'cases', 'screen_protectors', 'speakers', 'notebooks', 'tvs', 'chargers', 'cables', 'misc',
    ]);
    assert.equal(
      dashboard.payload.inventoryGroups.reduce((sum, group) => sum + group.materialCount, 0),
      dashboard.payload.modelsAvailable,
    );
    assert.equal(
      dashboard.payload.inventoryGroups.reduce((sum, group) => sum + group.available, 0),
      dashboard.payload.stock.available,
    );
    assert.ok(dashboard.payload.inventoryGroups.every((group) => group.topProducts.length <= 3));
    assert.doesNotMatch(
      JSON.stringify(dashboard.payload.inventoryGroups),
      /serialNumber|serialNumbers|serial_number|onHand|reserved|withdrawn|outOfStock/i,
    );
  });

  test('restringe e detalha os produtos a caminho para gerente e estoquista', async () => {
    const managerIncoming = await manager.request('/api/incoming');
    assert.equal(managerIncoming.status, 200);
    assert.deepEqual(managerIncoming.payload.summary, {
      units: 203, materials: 57, snapshotDate: '2026-08-28', source: 'ESTOQUE28.08.xlsx', status: 'DEPS NREM',
    });
    assert.equal(managerIncoming.payload.products.reduce((sum, product) => sum + product.quantity, 0), 203);
    assert.ok(managerIncoming.payload.products.every((product) => product.serials.length === product.quantity));
    assert.ok(managerIncoming.payload.products.flatMap((product) => product.serials).every((serial) => serial.status === 'DEPS NREM'));
    const incomingSerials = managerIncoming.payload.products.flatMap((product) => product.serials);
    assert.ok(incomingSerials.every((serial) => /^\d{4}-\d{2}-\d{2}$/.test(serial.deliveryStartedOn)));
    assert.equal(incomingSerials.find((serial) => serial.serialNumber === '220231691007770').deliveryStartedOn, '2026-05-31');
    assert.ok(managerIncoming.payload.products.every((product) => product.firstDeliveryOn && product.lastDeliveryOn));
    assert.equal((await seller.request('/api/incoming')).status, 403);
    const sellerDashboard = await seller.request('/api/dashboard');
    assert.equal(Object.hasOwn(sellerDashboard.payload.stock, 'incoming'), false);
    assert.equal(Object.hasOwn(sellerDashboard.payload, 'incomingProducts'), false);
    const sellerCatalog = await seller.request('/api/catalog');
    assert.ok(sellerCatalog.payload.products.every((product) => product.available > 0));
  });

  test('monta e mantém a lista compartilhada de reposição', async () => {
    const overview = await manager.request('/api/replenishment?threshold=2');
    assert.equal(overview.status, 200);
    assert.ok(overview.payload.items.length > 0);
    assert.ok(overview.payload.items.every((item) => item.available <= 2 || item.selected));
    assert.ok(overview.payload.items.some((item) => item.available === 0));
    const target = overview.payload.items[0];
    const saved = await manager.request('/api/replenishment', {
      method: 'POST', body: { variantId: target.variantId, requestedQuantity: 12 },
    });
    assert.equal(saved.status, 201);
    const sharedOverview = await manager.request('/api/replenishment?threshold=2');
    assert.equal(sharedOverview.status, 200, JSON.stringify(sharedOverview.payload));
    const selected = sharedOverview.payload.items.find((item) => item.variantId === target.variantId);
    assert.equal(selected.selected, true);
    assert.equal(selected.requestedQuantity, 12);
    const exported = await mf.dispatchFetch('https://controleestoque.app.br/api/replenishment/export', {
      headers: { Cookie: manager.cookie, 'CF-Connecting-IP': manager.ip },
    });
    assert.equal(exported.status, 200);
    assert.match(exported.headers.get('content-type'), /spreadsheetml\.sheet/i);
    assert.match(exported.headers.get('content-disposition'), /lista-reposicao-\d{4}-\d{2}-\d{2}\.xlsx/);
    const workbook = new Uint8Array(await exported.arrayBuffer());
    assert.deepEqual([...workbook.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
    const workbookSource = new TextDecoder().decode(workbook);
    assert.ok(workbookSource.indexOf('<autoFilter') < workbookSource.indexOf('<mergeCells'));
    assert.equal((await seller.request('/api/replenishment')).status, 403);
    assert.equal((await manager.request(`/api/replenishment/${target.variantId}`, { method: 'DELETE' })).status, 204);
    const cleared = await manager.request('/api/replenishment?threshold=2');
    assert.equal(cleared.payload.items.find((item) => item.variantId === target.variantId)?.selected || false, false);
  });

  test('agrupa aparelhos por modelo e relaciona somente capas compatíveis', async () => {
    const catalog = (await seller.request('/api/catalog')).payload.products;
    const groups = groupDeviceProducts(catalog);
    assert.equal(groups.reduce((sum, group) => sum + group.products.length, 0), 69);
    assert.equal(groups.length, 43);

    const iphoneProMax = groups.find((group) => group.familyName === 'APPLE IPHONE 17 PRO MAX');
    assert.deepEqual(iphoneProMax.memories, ['256GB', '512GB', '1TB']);
    assert.deepEqual(
      [...new Set(iphoneProMax.options.filter((option) => option.memory === '256GB').map((option) => option.color))],
      ['AZUL-MARINHO', 'LARANJA'],
    );
    assert.deepEqual(parseDeviceName('APPLE IPHONE 17 512GB BRANCO'), {
      familyName: 'APPLE IPHONE 17', memory: '512GB', color: 'BRANCO',
    });

    const cases = catalog.filter((product) => product.cluster === 'cases');
    const iphone17Cases = compatibleCaseChoices(cases, 'APPLE IPHONE 17');
    assert.ok(iphone17Cases.length > 0);
    assert.ok(iphone17Cases.every((choice) => !/\bPRO\b/i.test(choice.name)));
    assert.equal(compatibleCaseChoices(cases, 'MOTOROLA MOTO G67').some((choice) => /G67\/G77/i.test(choice.name)), true);
    const s26PlusCases = compatibleCaseChoices(cases, 'SAMSUNG GALAXY S26+');
    assert.ok(s26PlusCases.length > 0);
    assert.ok(s26PlusCases.every((choice) => /S26\+/i.test(choice.name)));
  });

  test('sistema escolhe o IMEI e o gerente pode cancelar devolvendo tudo ao estoque', async () => {
    const catalog = (await seller.request('/api/catalog')).payload.products;
    const product = catalog.find((item) => item.variants[0].materialCode === 'DGAP20362000');
    const variant = product.variants[0];
    const initialAvailable = variant.available;
    const expectedSerial = await row(`
      SELECT id, serial_number
      FROM inventory_serials
      WHERE variant_id = ? AND status = 'available'
      ORDER BY serial_number COLLATE NOCASE
      LIMIT 1
    `, variant.id);
    const missingPlan = await seller.request('/api/requests', {
      method: 'POST', body: { lines: [{ variantId: variant.id, quantity: 1 }], notes: 'Sem plano' },
    });
    assert.equal(missingPlan.status, 400);
    assert.match(missingPlan.payload.error, /categoria do plano/i);
    const created = await seller.request('/api/requests', {
      method: 'POST', body: { lines: [{ variantId: variant.id, quantity: 1 }], notes: 'Venda balcão', priceCategory: 'VIVO V' },
    });
    assert.equal(created.status, 201);
    assert.equal(created.payload.request.status, 'approved');
    assert.equal(created.payload.request.items[0].materialCode, 'DGAP20362000');
    assert.equal(created.payload.request.items[0].productName, 'APPLE IPHONE 15 256GB PRETO');
    assert.equal(created.payload.request.items[0].unitPriceCents, 349900);
    assert.equal(created.payload.request.items[0].lineTotalCents, 349900);
    assert.deepEqual(created.payload.request.pricing, {
      category: 'VIVO V', deviceTotalCents: 349900, orderTotalCents: 349900, tableDate: '2026-08-27',
    });
    assert.deepEqual(created.payload.request.items[0].serialNumbers, [expectedSerial.serial_number]);
    assert.equal((await manager.request(`/api/requests/${created.payload.request.id}/serial-options`)).status, 404);
    assert.equal((await manager.request(`/api/requests/${created.payload.request.id}/approve`, {
      method: 'POST', body: {},
    })).status, 404);

    const unavailable = (await seller.request('/api/catalog')).payload.products;
    assert.equal(unavailable.find((item) => item.variants[0].materialCode === 'DGAP20362000').variants[0].available, initialAvailable - 1);

    const sellerRequests = await seller.request('/api/requests');
    const released = sellerRequests.payload.requests.find((request) => request.id === created.payload.request.id);
    assert.deepEqual(released.items[0].serialNumbers, [expectedSerial.serial_number]);
    assert.equal((await row('SELECT status FROM inventory_serials WHERE id = ?', expectedSerial.id)).status, 'withdrawn');
    assert.equal(Number((await row(`SELECT quantity_on_hand FROM product_variants WHERE sku = 'DGAP20362000'`)).quantity_on_hand), initialAvailable - 1);
    assert.equal(Number((await row(`
      SELECT COUNT(*) AS count FROM audit_logs
      WHERE action = 'request.auto_approved' AND entity_id = ?
    `, created.payload.request.id)).count), 1);

    const sellerCancellation = await seller.request(`/api/requests/${created.payload.request.id}/cancel`, {
      method: 'POST', body: {},
    });
    assert.equal(sellerCancellation.status, 409);
    assert.match(sellerCancellation.payload.error, /equipe de estoque ou a gerência/i);

    const cancelled = await manager.request(`/api/requests/${created.payload.request.id}/cancel`, {
      method: 'POST', body: {},
    });
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.payload.request.status, 'cancelled');
    assert.match(cancelled.payload.request.decisionNote, /Cancelado pelo gerente/i);
    assert.deepEqual(cancelled.payload.request.items[0].serialNumbers, [expectedSerial.serial_number]);
    assert.equal((await row('SELECT status FROM inventory_serials WHERE id = ?', expectedSerial.id)).status, 'available');
    assert.equal(Number((await row(`SELECT quantity_on_hand FROM product_variants WHERE sku = 'DGAP20362000'`)).quantity_on_hand), initialAvailable);
    assert.equal(Number((await row(`
      SELECT COUNT(*) AS count
      FROM request_serial_assignments
      WHERE request_id = ?
    `, created.payload.request.id)).count), 0);
    assert.equal(Number((await row(`
      SELECT COUNT(*) AS count
      FROM cancelled_request_serials
      WHERE request_id = ? AND serial_id = ?
    `, created.payload.request.id, expectedSerial.id)).count), 1);

    const availableAgain = (await seller.request('/api/catalog')).payload.products;
    assert.equal(availableAgain.find((item) => item.variants[0].materialCode === 'DGAP20362000').variants[0].available, initialAvailable);
    const cancellationAudit = await row(`
      SELECT details_json
      FROM audit_logs
      WHERE action = 'request.cancelled' AND entity_id = ?
      ORDER BY id DESC
      LIMIT 1
    `, created.payload.request.id);
    const details = JSON.parse(cancellationAudit.details_json);
    assert.equal(details.previousStatus, 'approved');
    assert.equal(details.restoredStock, true);
    assert.equal(details.restoredUnits, 1);
    assert.deepEqual(details.serials[0].serialNumbers, [expectedSerial.serial_number]);
  });

  test('calcula o Renova no servidor e ignora voucher e bônus adulterados', async () => {
    const catalogResponse = await seller.request('/api/catalog');
    assert.equal(catalogResponse.status, 200);
    assert.equal(catalogResponse.payload.renova.tableDate, '2026-08-04');
    assert.equal(catalogResponse.payload.renova.devices.length, 1042);
    const activeBoostCount = await row(`
      SELECT COUNT(*) AS count
      FROM renova_manufacturer_boosts
      WHERE active = 1
        AND (starts_on IS NULL OR date(starts_on) <= date('now'))
        AND (ends_on IS NULL OR date(ends_on) >= date('now'))
    `);
    assert.equal(catalogResponse.payload.renova.boosts.length, Number(activeBoostCount.count));
    assert.equal(Number((await row(`SELECT COUNT(*) AS count FROM renova_manufacturer_boosts`)).count), 74);
    assert.equal(Number((await row(`SELECT bonus_cents FROM renova_manufacturer_boosts WHERE device_name = 'Motorola Signature 512GB'`)).bonus_cents), 160000);
    assert.equal((await row(`SELECT ends_on FROM renova_manufacturer_boosts WHERE device_name = 'iPhone 15 256GB'`)).ends_on, '2026-09-14');
    assert.equal((await row(`SELECT ends_on FROM renova_manufacturer_boosts WHERE device_name = 'Samsung Galaxy S26 Ultra 256GB'`)).ends_on, '2026-09-08');
    assert.equal(Number((await row(`SELECT bonus_cents FROM renova_manufacturer_boosts WHERE device_name = 'Samsung Galaxy Z Fold 6 512GB'`)).bonus_cents), 40000);
    assert.equal(Number((await row(`SELECT bonus_cents FROM renova_manufacturer_boosts WHERE device_name = 'JOVI X300 Ultra 512GB'`)).bonus_cents), 120000);
    assert.equal(Number((await row(`SELECT bonus_cents FROM renova_manufacturer_boosts WHERE device_name = 'JOVI X300 FE 256GB'`)).bonus_cents), 60000);
    assert.equal((await row(`SELECT starts_on FROM renova_manufacturer_boosts WHERE device_name = 'JOVI X300 Ultra 512GB'`)).starts_on, '2026-08-25');
    assert.equal((await row(`SELECT ends_on FROM renova_manufacturer_boosts WHERE device_name = 'JOVI X300 FE 256GB'`)).ends_on, '2026-09-30');
    assert.equal((await row(`SELECT ends_on FROM renova_manufacturer_boosts WHERE device_name = 'Motorola Edge 70 512GB'`)).ends_on, '2026-09-14');
    assert.equal((await row(`SELECT ends_on FROM renova_manufacturer_boosts WHERE device_name = 'JOVI V70 5G 512GB'`)).ends_on, '2026-09-14');
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'renova_boost_table_date'`)).value, '2026-09-01');
    const samsungBoost = catalogResponse.payload.renova.boosts.find((boost) => boost.name === 'Samsung Galaxy S26 Ultra 256GB');
    if (samsungBoost) assert.equal(samsungBoost.bonusCents, 120000);
    const iphone15BoostCents = Number(catalogResponse.payload.renova.boosts.find((boost) => boost.name === 'iPhone 15 256GB')?.bonusCents || 0);
    const tradeIn = catalogResponse.payload.renova.devices.find((device) => device.name === 'APPLE IPHONE 14 128GB');
    assert.deepEqual(tradeIn, {
      id: tradeIn.id,
      name: 'APPLE IPHONE 14 128GB',
      manufacturer: 'APPLE',
      productType: 'SMARTPHONE',
      goodCents: 121600,
      defectiveCents: 28000,
    });

    const device = catalogResponse.payload.products.find((product) => product.variants[0].materialCode === 'DGAP20362000');
    const cable = catalogResponse.payload.products.find((product) => product.variants[0].materialCode === '22023025');
    const invalidCondition = await seller.request('/api/requests', {
      method: 'POST',
      body: {
        lines: [{ variantId: device.variants[0].id, quantity: 1 }],
        priceCategory: 'VIVO V',
        renova: { deviceId: tradeIn.id, condition: 'alterado' },
      },
    });
    assert.equal(invalidCondition.status, 400);
    assert.match(invalidCondition.payload.error, /estado correto/i);

    const created = await seller.request('/api/requests', {
      method: 'POST',
      body: {
        lines: [
          { variantId: device.variants[0].id, quantity: 1 },
          { variantId: cable.variants[0].id, quantity: 1 },
        ],
        notes: 'Renova protegido',
        priceCategory: 'VIVO V',
        renova: {
          deviceId: tradeIn.id,
          usedDevice: 'Aparelho adulterado',
          condition: 'bom',
          voucherCents: 99999999,
          manufacturerBonusCents: 99999999,
        },
      },
    });
    assert.equal(created.status, 201);
    assert.equal(created.payload.request.pricing.deviceTotalCents, 349900);
    assert.equal(created.payload.request.pricing.orderTotalCents, 233200 - iphone15BoostCents);
    assert.deepEqual(created.payload.request.pricing.renova, {
      usedDevice: 'APPLE IPHONE 14 128GB',
      condition: 'bom',
      voucherCents: 121600,
      manufacturerBonusCents: iphone15BoostCents,
      discountCents: 121600 + iphone15BoostCents,
    });
    assert.equal(created.payload.request.items.find((item) => item.variantId === cable.variants[0].id).unitPriceCents, 4900);
    const stored = await row(`
      SELECT renova_used_device, renova_voucher_cents,
             renova_manufacturer_bonus_cents, renova_discount_cents, order_total_cents
      FROM withdrawal_requests
      WHERE id = ?
    `, created.payload.request.id);
    assert.equal(stored.renova_used_device, 'APPLE IPHONE 14 128GB');
    assert.equal(Number(stored.renova_voucher_cents), 121600);
    assert.equal(Number(stored.renova_manufacturer_bonus_cents), iphone15BoostCents);
    assert.equal(Number(stored.renova_discount_cents), 121600 + iphone15BoostCents);
    assert.equal(Number(stored.order_total_cents), 233200 - iphone15BoostCents);

    const cancelled = await manager.request(`/api/requests/${created.payload.request.id}/cancel`, {
      method: 'POST', body: {},
    });
    assert.equal(cancelled.status, 200);

    const s25Fe = catalogResponse.payload.products.find((product) => product.variants[0].materialCode === 'TGSA590B4000');
    const s25FePrice = Number(s25Fe.pricing.prices['VIVO V']);
    const withoutFalseBoost = await seller.request('/api/requests', {
      method: 'POST',
      body: {
        lines: [{ variantId: s25Fe.variants[0].id, quantity: 1 }],
        priceCategory: 'VIVO V',
        renova: { deviceId: tradeIn.id, condition: 'defeituoso' },
      },
    });
    assert.equal(withoutFalseBoost.status, 201);
    assert.equal(withoutFalseBoost.payload.request.pricing.renova.manufacturerBonusCents, 0);
    assert.equal(withoutFalseBoost.payload.request.pricing.renova.voucherCents, 28000);
    assert.equal(withoutFalseBoost.payload.request.pricing.orderTotalCents, s25FePrice - 28000);
    assert.equal((await manager.request(`/api/requests/${withoutFalseBoost.payload.request.id}/cancel`, {
      method: 'POST', body: {},
    })).status, 200);
  });

  test('libera conjunto escolhendo aparelho, capa e película de forma automática', async () => {
    const catalog = (await seller.request('/api/catalog')).payload.products;
    const productByCode = (code) => catalog.find((product) => product.variants[0].materialCode === code);
    const device = productByCode('DGAP27022000');
    const deviceVariant = device.variants[0];
    const caseProduct = productByCode('22023768');
    const caseVariant = caseProduct.variants[0];
    const film = productByCode('22023386');
    const filmVariant = film.variants[0];
    const expectedDeviceSerial = await row(`
      SELECT serial_number
      FROM inventory_serials
      WHERE variant_id = ? AND status = 'available'
      ORDER BY serial_number COLLATE NOCASE
      LIMIT 1
    `, deviceVariant.id);

    const created = await seller.request('/api/requests', {
      method: 'POST',
      body: {
        lines: [
          { variantId: deviceVariant.id, quantity: 1 },
          { variantId: caseVariant.id, quantity: 1 },
          { variantId: filmVariant.id, quantity: 1 },
        ],
        notes: 'Conjunto completo',
        priceCategory: 'FAMILIA 2',
      },
    });
    assert.equal(created.status, 201);
    assert.equal(created.payload.request.status, 'approved');
    assert.equal(created.payload.request.items.filter((item) => item.automaticSerial).length, 2);
    const approvedDevice = created.payload.request.items.find((item) => item.variantId === deviceVariant.id);
    assert.deepEqual(approvedDevice.serialNumbers, [expectedDeviceSerial.serial_number]);
    assert.equal(approvedDevice.unitPriceCents, 759900);
    assert.equal(created.payload.request.items.find((item) => item.variantId === caseVariant.id).unitPriceCents, 12900);
    assert.equal(created.payload.request.items.find((item) => item.variantId === filmVariant.id).unitPriceCents, 6900);
    assert.equal(created.payload.request.pricing.deviceTotalCents, 759900);
    assert.equal(created.payload.request.pricing.orderTotalCents, 779700);
    assert.ok(created.payload.request.items
      .filter((item) => item.automaticSerial)
      .every((item) => item.serialNumbers.length === 0));

    const assignments = (await database.prepare(`
      SELECT p.cluster, COUNT(*) AS count
      FROM request_serial_assignments a
      JOIN product_variants v ON v.id = a.variant_id
      JOIN products p ON p.id = v.product_id
      WHERE a.request_id = ?
      GROUP BY p.cluster
    `).bind(created.payload.request.id).all()).results;
    assert.deepEqual(Object.fromEntries(assignments.map((item) => [item.cluster, Number(item.count)])), {
      cases: 1,
      devices: 1,
      screen_protectors: 1,
    });
    assert.equal(Number((await row(`SELECT quantity_on_hand FROM product_variants WHERE sku = 'DGAP27022000'`)).quantity_on_hand), 0);
    assert.equal(Number((await row(`SELECT quantity_on_hand FROM product_variants WHERE sku = '22023768'`)).quantity_on_hand), 1);
    assert.equal(Number((await row(`SELECT quantity_on_hand FROM product_variants WHERE sku = '22023386'`)).quantity_on_hand), 29);
  });

  test('registra preço fixo de acessórios sem exigir categoria de plano', async () => {
    const catalog = (await seller.request('/api/catalog')).payload.products;
    const cable = catalog.find((product) => product.variants[0].materialCode === '22023025');
    const created = await seller.request('/api/requests', {
      method: 'POST',
      body: { lines: [{ variantId: cable.variants[0].id, quantity: 2 }], notes: 'Venda de cabos' },
    });
    assert.equal(created.status, 201);
    assert.equal(created.payload.request.items[0].unitPriceCents, 4900);
    assert.equal(created.payload.request.items[0].priceType, 'fixed');
    assert.deepEqual(created.payload.request.pricing, {
      category: '', deviceTotalCents: 0, orderTotalCents: 9800, tableDate: '2026-08-04',
    });
    const cancelled = await manager.request(`/api/requests/${created.payload.request.id}/cancel`, {
      method: 'POST', body: {},
    });
    assert.equal(cancelled.status, 200);
  });

  test('remove a aprovação manual e impede pedidos acima do saldo', async () => {
    const catalog = (await seller.request('/api/catalog')).payload.products;
    const cable = catalog.find((item) => item.variants[0].materialCode === '22022613').variants[0];

    const first = await seller.request('/api/requests', { method: 'POST', body: { lines: [{ variantId: cable.id, quantity: 2 }], notes: '' } });
    assert.equal(first.status, 201);
    assert.equal(first.payload.request.status, 'approved');
    assert.equal((await manager.request(`/api/requests/${first.payload.request.id}/reject`, {
      method: 'POST', body: { decisionNote: 'Teste' },
    })).status, 404);
    assert.equal((await seller.request(`/api/requests/${first.payload.request.id}/cancel`, {
      method: 'POST', body: {},
    })).status, 409);

    const excessive = await seller.request('/api/requests', { method: 'POST', body: { lines: [{ variantId: cable.id, quantity: 2 }], notes: '' } });
    assert.equal(excessive.status, 409);
    assert.equal(Number((await row(`SELECT COALESCE(SUM(quantity), 0) AS total FROM active_quantity_reservations WHERE variant_id = ?`, cable.id)).total), 0);
    assert.equal(Number((await row(`SELECT quantity_on_hand FROM product_variants WHERE id = ?`, cable.id)).quantity_on_hand), 1);
  });

  test('entrega ao estoquista a operação de estoque e o cancelamento com devolução', async () => {
    const created = await manager.request('/api/users', {
      method: 'POST',
      body: { name: 'Estoquista Um', email: 'estoquista@exemplo.com', password: 'ProvisoriaEstoque123', role: 'stocker' },
    });
    assert.equal(created.status, 201);
    assert.equal(created.payload.user.role, 'stocker');
    const stored = await row('SELECT role, access_profile FROM users WHERE id = ?', created.payload.user.id);
    assert.equal(stored.role, 'seller');
    assert.equal(stored.access_profile, 'stocker');

    const login = await stocker.request('/api/auth/login', {
      method: 'POST',
      body: { email: 'estoquista@exemplo.com', password: 'ProvisoriaEstoque123' },
    });
    assert.equal(login.status, 200);
    assert.equal(login.payload.user.role, 'stocker');
    assert.equal((await stocker.request('/api/requests')).status, 403);
    assert.equal((await stocker.request('/api/auth/password', {
      method: 'PATCH',
      body: { currentPassword: 'ProvisoriaEstoque123', newPassword: 'SenhaEstoque123' },
    })).status, 200);
    assert.equal((await stocker.request('/api/repairs')).status, 200);
    assert.equal((await stocker.request('/api/incoming')).status, 200);

    const requests = await stocker.request('/api/requests?status=approved');
    assert.equal(requests.status, 200);
    assert.ok(requests.payload.requests.length > 0);
    assert.ok(requests.payload.requests.every((request) => request.status === 'approved'));
    assert.ok(requests.payload.requests.some((request) => request.items.some((item) => item.serialNumbers.length > 0)));

    const dashboard = await stocker.request('/api/dashboard');
    assert.equal(dashboard.status, 200);
    assert.equal(dashboard.payload.role, 'stocker');
    assert.equal(dashboard.payload.readyRequests, dashboard.payload.requests.approved);
    assert.ok(dashboard.payload.stock.available > 0);
    assert.equal(dashboard.payload.inventoryGroups.length, 9);
    assert.ok(dashboard.payload.inventoryGroups.every((group) => 'reserved' in group && 'available' in group));

    const catalog = await stocker.request('/api/catalog');
    assert.equal(catalog.status, 200);
    const cable = catalog.payload.products.find((product) => product.variants[0].materialCode === '22023025');
    assert.ok(cable);
    assert.ok(cable.variants[0].retailPrice?.priceCents > 0);
    assert.ok('onHand' in cable.variants[0] && 'reserved' in cable.variants[0] && 'available' in cable.variants[0]);

    const stockBefore = Number((await row('SELECT quantity_on_hand FROM product_variants WHERE id = ?', cable.variants[0].id)).quantity_on_hand);
    const createdRequest = await seller.request('/api/requests', {
      method: 'POST', body: { lines: [{ variantId: cable.variants[0].id, quantity: 1 }], notes: 'Conferência do estoquista' },
    });
    assert.equal(createdRequest.status, 201);
    assert.equal(createdRequest.payload.request.status, 'approved');
    assert.equal(Number((await row('SELECT quantity_on_hand FROM product_variants WHERE id = ?', cable.variants[0].id)).quantity_on_hand), stockBefore - 1);

    const cancelled = await stocker.request(`/api/requests/${createdRequest.payload.request.id}/cancel`, {
      method: 'POST', body: {},
    });
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.payload.request.status, 'cancelled');
    assert.match(cancelled.payload.request.decisionNote, /estoquista/i);
    assert.equal(Number((await row('SELECT quantity_on_hand FROM product_variants WHERE id = ?', cable.variants[0].id)).quantity_on_hand), stockBefore);
    const cancellationAudit = await row(`
      SELECT details_json
      FROM audit_logs
      WHERE action = 'request.cancelled' AND entity_id = ?
      ORDER BY id DESC LIMIT 1
    `, createdRequest.payload.request.id);
    assert.equal(JSON.parse(cancellationAudit.details_json).cancelledByRole, 'stocker');
    assert.equal(JSON.parse(cancellationAudit.details_json).restoredStock, true);

    assert.equal((await stocker.request('/api/stock/summary')).status, 200);
    assert.equal((await stocker.request('/api/requests', {
      method: 'POST', body: { lines: [{ variantId: cable.variants[0].id, quantity: 1 }] },
    })).status, 403);
    assert.equal((await stocker.request('/api/inventory/quantity', {
      method: 'POST', body: { variantId: cable.variants[0].id, quantityDelta: 1 },
    })).status, 403);
    assert.equal((await stocker.request('/api/users')).status, 403);
    assert.equal((await stocker.request('/api/audit')).status, 403);
  });

  test('controla chips por material e identifica o ICCID pelos 6 últimos dígitos', async () => {
    assert.equal((await stocker.request('/api/chips')).status, 403);
    assert.equal((await seller.request('/api/chips', {
      method: 'POST',
      body: { inventorySerialId: 1, sellerId: 1 },
    })).status, 403);
    assert.equal((await seller.request('/api/chips/bulk', {
      method: 'POST',
      body: { inventorySerialIds: [1, 2], sellerId: 1 },
    })).status, 403);
    assert.equal((await stocker.request('/api/chips/bulk', {
      method: 'POST',
      body: { inventorySerialIds: [1, 2], sellerId: 1 },
    })).status, 403);
    assert.equal((await seller.request('/api/chips/candidates?materialCode=YBSC001A4000&suffix=123456')).status, 403);
    assert.equal((await stocker.request('/api/chips/candidates?materialCode=YBSC001A4000&suffix=123456')).status, 403);

    const sellerUser = await row(`SELECT id FROM users WHERE email = 'vendedor.novo@exemplo.com'`);
    const secondSeller = await manager.request('/api/users', {
      method: 'POST',
      body: {
        name: 'Vendedor Dois',
        email: 'vendedor.dois@exemplo.com',
        password: 'ProvisoriaDois123',
        role: 'seller',
      },
    });
    assert.equal(secondSeller.status, 201);

    const serials = (await database.prepare(`
      SELECT inventory.id, inventory.serial_number, variant.id AS variant_id
      FROM inventory_serials inventory
      JOIN product_variants variant ON variant.id = inventory.variant_id
      WHERE variant.sku = 'YBSC001A4000' AND inventory.status = 'available'
        AND NOT EXISTS (SELECT 1 FROM chips chip WHERE chip.inventory_serial_id = inventory.id)
        AND NOT EXISTS (SELECT 1 FROM request_serial_assignments assignment WHERE assignment.serial_id = inventory.id)
      ORDER BY inventory.serial_number COLLATE NOCASE
      LIMIT 12
    `).all()).results;
    assert.equal(serials.length, 12);
    const collisionSuffix = String(serials[0].serial_number).slice(-6);
    const collisionSerial = `990000000000${collisionSuffix}`;
    assert.equal(await row('SELECT id FROM inventory_serials WHERE serial_number = ?', collisionSerial), null);
    await database.prepare('UPDATE inventory_serials SET serial_number = ? WHERE id = ?')
      .bind(collisionSerial, serials[1].id).run();
    serials[1].serial_number = collisionSerial;
    const scannedIccid = (index) => `89${serials[index].serial_number}`;
    const chipBody = (index, sellerId = Number(sellerUser.id)) => ({
      inventorySerialId: Number(serials[index].id),
      sellerId,
    });
    const managerSetup = await manager.request('/api/chips');
    assert.equal(managerSetup.status, 200);
    assert.equal(managerSetup.payload.materials.length, 5);
    const simMaterial = managerSetup.payload.materials.find((material) => material.materialCode === 'YBSC001A4000');
    assert.equal(simMaterial.name, 'SIM CARD 5G 2/3/4FF AVULSO P69S MG');
    assert.ok(simMaterial.availableCount >= 12);
    assert.equal('materials' in (await seller.request('/api/chips')).payload, false);
    assert.equal((await manager.request('/api/chips/candidates?materialCode=YBSC001A4000&suffix=12345')).status, 400);
    const matchingCandidates = await manager.request(`/api/chips/candidates?materialCode=YBSC001A4000&suffix=${collisionSuffix}`);
    assert.equal(matchingCandidates.status, 200);
    assert.ok(matchingCandidates.payload.candidates.length >= 2);
    assert.ok(matchingCandidates.payload.candidates.some((candidate) => candidate.inventorySerialId === Number(serials[0].id)));
    assert.ok(matchingCandidates.payload.candidates.some((candidate) => candidate.inventorySerialId === Number(serials[1].id)));
    assert.ok(matchingCandidates.payload.candidates.every((candidate) => candidate.suffix === collisionSuffix));
    const missingSelection = await manager.request('/api/chips', {
      method: 'POST', body: { materialCode: 'YBSC001A4000', suffix: collisionSuffix, sellerId: Number(sellerUser.id) },
    });
    assert.equal(missingSelection.status, 400);
    const catalogBefore = (await seller.request('/api/catalog')).payload.products;
    const simBefore = catalogBefore.find((product) => product.variants[0].materialCode === 'YBSC001A4000').variants[0];

    const first = await manager.request('/api/chips', { method: 'POST', body: chipBody(0) });
    assert.equal(first.status, 201);
    assert.equal(first.payload.chip.materialCode, 'YBSC001A4000');
    assert.equal(first.payload.chip.iccid, scannedIccid(0));
    assert.equal(first.payload.chip.stockLinked, true);
    assert.equal(first.payload.chip.sellerId, Number(sellerUser.id));

    const duplicate = await manager.request('/api/chips', { method: 'POST', body: chipBody(0) });
    assert.equal(duplicate.status, 409);
    assert.match(duplicate.payload.error, /não está mais disponível/i);
    assert.equal((await manager.request('/api/chips/bulk', {
      method: 'POST', body: { sellerId: Number(sellerUser.id), inventorySerialIds: [] },
    })).status, 400);
    assert.equal((await manager.request('/api/chips/bulk', {
      method: 'POST', body: { sellerId: Number(sellerUser.id), inventorySerialIds: [serials[1].id, serials[1].id] },
    })).status, 400);
    const atomicUnavailable = await manager.request('/api/chips/bulk', {
      method: 'POST',
      body: { sellerId: Number(sellerUser.id), inventorySerialIds: [serials[1].id, serials[0].id] },
    });
    assert.equal(atomicUnavailable.status, 409);
    assert.equal(await row('SELECT id FROM chips WHERE inventory_serial_id = ?', serials[1].id), null);
    const candidatesAfterAllocation = await manager.request(`/api/chips/candidates?materialCode=YBSC001A4000&suffix=${collisionSuffix}`);
    assert.equal(candidatesAfterAllocation.status, 200);
    assert.equal(candidatesAfterAllocation.payload.candidates.some((candidate) => candidate.inventorySerialId === Number(serials[0].id)), false);

    const bulkCreated = await manager.request('/api/chips/bulk', {
      method: 'POST',
      body: {
        sellerId: Number(sellerUser.id),
        inventorySerialIds: [serials[1].id, serials[2].id, serials[3].id],
      },
    });
    assert.equal(bulkCreated.status, 201);
    assert.equal(bulkCreated.payload.count, 3);
    assert.equal(bulkCreated.payload.chips.length, 3);
    assert.ok(bulkCreated.payload.chips.every((chip) => chip.sellerId === Number(sellerUser.id) && chip.stockLinked));

    for (let index = 4; index < 10; index += 1) {
      const created = await manager.request('/api/chips', { method: 'POST', body: chipBody(index) });
      assert.equal(created.status, 201);
      assert.equal(created.payload.chip.stockLinked, true);
    }
    const ownWallet = await seller.request('/api/chips');
    assert.equal(ownWallet.status, 200);
    assert.equal(ownWallet.payload.limit, 10);
    assert.equal(ownWallet.payload.summary.available, 10);
    assert.equal(ownWallet.payload.chips.length, 10);
    assert.ok(ownWallet.payload.chips.every((chip) => chip.sellerId === Number(sellerUser.id)));
    assert.doesNotMatch(JSON.stringify(ownWallet.payload), /vendedor\.dois@exemplo\.com/i);

    const catalogAllocated = (await seller.request('/api/catalog')).payload.products;
    const simAllocated = catalogAllocated.find((product) => product.variants[0].materialCode === 'YBSC001A4000').variants[0];
    assert.equal(simAllocated.available, simBefore.available - 10);
    assert.equal(simAllocated.allocatedToSellers, simBefore.allocatedToSellers + 10);
    assert.equal(simAllocated.onHand, simBefore.onHand);

    const sold = await seller.request(`/api/chips/${first.payload.chip.id}/sale`, {
      method: 'POST',
      body: { soldOn: '2026-08-07', registeredPhone: '(11) 99999-1234' },
    });
    assert.equal(sold.status, 200);
    assert.equal(sold.payload.chip.status, 'sold');
    assert.equal(sold.payload.chip.soldOn, '2026-08-07');
    assert.equal(sold.payload.chip.registeredPhone, '11999991234');
    assert.equal((await row('SELECT status FROM inventory_serials WHERE id = ?', serials[0].id)).status, 'withdrawn');
    assert.equal(Number((await row('SELECT quantity_on_hand FROM product_variants WHERE id = ?', serials[0].variant_id)).quantity_on_hand), simBefore.onHand - 1);
    const afterSale = (await seller.request('/api/catalog')).payload.products
      .find((product) => product.variants[0].materialCode === 'YBSC001A4000').variants[0];
    assert.equal(afterSale.available, simBefore.available - 10);

    const capacityRollback = await manager.request('/api/chips/bulk', {
      method: 'POST',
      body: {
        sellerId: Number(sellerUser.id),
        inventorySerialIds: [serials[10].id, serials[11].id],
      },
    });
    assert.equal(capacityRollback.status, 409);
    assert.match(capacityRollback.payload.error, /somente 1 vaga disponível/i);
    assert.equal(await row('SELECT id FROM chips WHERE inventory_serial_id IN (?, ?) LIMIT 1', serials[10].id, serials[11].id), null);

    const replacement = await manager.request('/api/chips', { method: 'POST', body: chipBody(10) });
    assert.equal(replacement.status, 201);
    const transferred = await manager.request(`/api/chips/${replacement.payload.chip.id}`, {
      method: 'PUT',
      body: { sellerId: secondSeller.payload.user.id },
    });
    assert.equal(transferred.status, 200);
    assert.equal(transferred.payload.chip.sellerId, secondSeller.payload.user.id);
    assert.equal((await seller.request(`/api/chips/${replacement.payload.chip.id}/sale`, {
      method: 'POST',
      body: { soldOn: '2026-08-07', registeredPhone: '11988887777' },
    })).status, 403);

    assert.equal((await manager.request(`/api/chips/${replacement.payload.chip.id}`, { method: 'DELETE' })).status, 204);
    assert.equal((await manager.request(`/api/chips/${replacement.payload.chip.id}/restore`, { method: 'POST', body: {} })).status, 200);

    const reopened = await manager.request(`/api/chips/${first.payload.chip.id}/reopen`, { method: 'POST', body: {} });
    assert.equal(reopened.status, 200);
    assert.equal(reopened.payload.chip.status, 'available');
    assert.equal(reopened.payload.chip.soldOn, '');
    assert.equal(reopened.payload.chip.registeredPhone, '');
    assert.equal((await row('SELECT status FROM inventory_serials WHERE id = ?', serials[0].id)).status, 'available');
    assert.equal(Number((await row('SELECT quantity_on_hand FROM product_variants WHERE id = ?', serials[0].variant_id)).quantity_on_hand), simBefore.onHand);

    const overLimit = await manager.request('/api/chips', { method: 'POST', body: chipBody(11) });
    assert.equal(overLimit.status, 409);
    assert.match(overLimit.payload.error, /10 chips disponíveis/i);

    const removable = (await seller.request('/api/chips')).payload.chips.find((chip) => chip.id !== first.payload.chip.id);
    assert.equal((await manager.request(`/api/chips/${removable.id}`, { method: 'DELETE' })).status, 204);
    assert.equal((await seller.request('/api/chips')).payload.summary.available, 9);
    const removedView = await manager.request('/api/chips');
    assert.equal(removedView.payload.summary.removed, 1);
    assert.equal(removedView.payload.chips.find((chip) => chip.id === removable.id).active, false);
    assert.equal((await manager.request(`/api/chips/${removable.id}/restore`, { method: 'POST', body: {} })).status, 200);

    const managerView = await manager.request('/api/chips');
    assert.equal(managerView.status, 200);
    assert.equal(managerView.payload.summary.available, managerView.payload.sellers.reduce((sum, item) => sum + item.availableCount, 0));
    assert.equal(managerView.payload.summary.sold, 0);
    assert.equal(managerView.payload.summary.removed, 0);
    assert.equal(managerView.payload.sellers.find((item) => item.id === Number(sellerUser.id)).availableCount, 10);
    assert.equal(managerView.payload.sellers.find((item) => item.id === secondSeller.payload.user.id).availableCount, 1);
    await assert.rejects(
      database.prepare(`UPDATE users SET active = 0 WHERE id = ?`).bind(sellerUser.id).run(),
      /CHIP_WALLET_NOT_EMPTY/,
    );
    const sellerRecord = await row('SELECT name, email FROM users WHERE id = ?', sellerUser.id);
    const cannotDeactivateWithChips = await manager.request(`/api/users/${sellerUser.id}`, {
      method: 'PUT',
      body: {
        name: sellerRecord.name,
        email: sellerRecord.email,
        role: 'seller',
        active: false,
        password: '',
      },
    });
    assert.equal(cannotDeactivateWithChips.status, 409);
    assert.match(cannotDeactivateWithChips.payload.error, /Transfira ou retire os chips/i);
    const cannotDeleteWithChips = await manager.request(`/api/users/${sellerUser.id}`, { method: 'DELETE' });
    assert.equal(cannotDeleteWithChips.status, 409);
    assert.match(cannotDeleteWithChips.payload.error, /10 chips disponíveis/i);
    const finalCatalog = (await seller.request('/api/catalog')).payload.products;
    const finalSim = finalCatalog.find((product) => product.variants[0].materialCode === 'YBSC001A4000').variants[0];
    assert.equal(finalSim.onHand, simBefore.onHand);
    assert.equal(finalSim.allocatedToSellers, simBefore.allocatedToSellers + 11);
    assert.equal(finalSim.available, simBefore.available - 11);
    const requestWithoutAllocatedChip = await seller.request('/api/requests', {
      method: 'POST',
      body: { lines: [{ variantId: finalSim.id, quantity: 1 }], notes: 'Selecionar somente chip livre' },
    });
    assert.equal(requestWithoutAllocatedChip.status, 201);
    const selectedFreeSerial = await row(`
      SELECT serial_id FROM request_serial_assignments WHERE request_id = ? LIMIT 1
    `, requestWithoutAllocatedChip.payload.request.id);
    assert.ok(selectedFreeSerial);
    assert.equal(Number((await row(`
      SELECT COUNT(*) AS count FROM chips WHERE inventory_serial_id = ? AND active = 1 AND status = 'available'
    `, selectedFreeSerial.serial_id)).count), 0);
    assert.equal((await manager.request(`/api/requests/${requestWithoutAllocatedChip.payload.request.id}/cancel`, {
      method: 'POST', body: {},
    })).status, 200);
    assert.ok(Number((await row(`
      SELECT COUNT(*) AS count FROM audit_logs
      WHERE entity_type = 'chip'
        AND action IN ('chip.created', 'chip.transferred', 'chip.sold', 'chip.sale_reopened', 'chip.removed', 'chip.restored')
    `)).count) >= 17);
  });


  test('controla aparelhos do Renova até a retirada pela empresa', async () => {
    assert.equal((await seller.request('/api/renova-intake')).status, 403);
    assert.equal((await seller.request('/api/renova-intake', {
      method: 'POST',
      body: { model: 'Sem permissão', receivedOn: '2026-08-10', pickupOn: '' },
    })).status, 403);

    const initial = await manager.request('/api/renova-intake');
    assert.equal(initial.status, 200);
    assert.deepEqual(initial.payload.summary, { awaitingPickup: 0, pickedUp: 0, total: 0 });

    const invalidModel = await manager.request('/api/renova-intake', {
      method: 'POST',
      body: { model: 'Aparelho digitado fora da lista', imei: '351234567890122', receivedOn: '2026-08-10', pickupOn: '' },
    });
    assert.equal(invalidModel.status, 400);
    assert.match(invalidModel.payload.error, /lista do Vivo Renova/i);

    const created = await manager.request('/api/renova-intake', {
      method: 'POST',
      body: { model: 'samsung galaxy s23 128gb', imei: '351234567890123', receivedOn: '2026-08-10', pickupOn: '' },
    });
    assert.equal(created.status, 201);
    assert.equal(created.payload.item.registrationCode, '#001');
    assert.equal(created.payload.item.model, 'SAMSUNG GALAXY S23 128GB');
    assert.equal(created.payload.item.imei, '351234567890123');
    assert.equal(created.payload.item.status, 'awaiting_pickup');
    assert.equal(created.payload.item.pickupOn, '');
    assert.equal(created.payload.item.createdByName, 'Gerente Geral');

    const sellerUpdate = await seller.request(`/api/renova-intake/${created.payload.item.id}`, {
      method: 'PUT',
      body: { model: created.payload.item.model, imei: created.payload.item.imei, receivedOn: '2026-08-10', pickupOn: '' },
    });
    assert.equal(sellerUpdate.status, 403);

    const invalidImei = await manager.request('/api/renova-intake', {
      method: 'POST',
      body: { model: 'SAMSUNG GALAXY S23 256GB', imei: '12345', receivedOn: '2026-08-10', pickupOn: '' },
    });
    assert.equal(invalidImei.status, 400);
    assert.match(invalidImei.payload.fields.imei, /15 dígitos/i);

    const duplicateImei = await manager.request('/api/renova-intake', {
      method: 'POST',
      body: { model: 'SAMSUNG GALAXY S23 256GB', imei: created.payload.item.imei, receivedOn: '2026-08-10', pickupOn: '' },
    });
    assert.equal(duplicateImei.status, 409);
    assert.match(duplicateImei.payload.error, /IMEI já está cadastrado/i);

    const secondDevice = await manager.request('/api/renova-intake', {
      method: 'POST',
      body: { model: 'SAMSUNG GALAXY S23 256GB', imei: '351234567890124', receivedOn: '2026-08-10', pickupOn: '' },
    });
    assert.equal(secondDevice.status, 201);
    assert.equal(secondDevice.payload.item.registrationCode, '#002');
    assert.equal((await manager.request(`/api/renova-intake/${secondDevice.payload.item.id}`, { method: 'DELETE' })).status, 204);

    const stockerView = await stocker.request('/api/renova-intake');
    assert.equal(stockerView.status, 200);
    assert.equal(stockerView.payload.summary.awaitingPickup, 1);
    assert.equal(stockerView.payload.items.length, 1);

    const invalidPickup = await stocker.request(`/api/renova-intake/${created.payload.item.id}`, {
      method: 'PUT',
      body: { model: created.payload.item.model, receivedOn: '2026-08-10', pickupOn: '2026-08-09' },
    });
    assert.equal(invalidPickup.status, 400);
    assert.match(invalidPickup.payload.error, /anterior ao recebimento/i);

    const pickedUp = await stocker.request(`/api/renova-intake/${created.payload.item.id}`, {
      method: 'PUT',
      body: { model: created.payload.item.model, receivedOn: '2026-08-10', pickupOn: '2026-08-12' },
    });
    assert.equal(pickedUp.status, 200);
    assert.equal(pickedUp.payload.item.status, 'picked_up');
    assert.equal(pickedUp.payload.item.pickupOn, '2026-08-12');
    assert.equal(pickedUp.payload.item.updatedByName, 'Estoquista Um');

    const corrected = await manager.request(`/api/renova-intake/${created.payload.item.id}`, {
      method: 'PUT',
      body: { model: 'SAMSUNG GALAXY S23 ULTRA 256GB', receivedOn: '2026-08-10', pickupOn: '' },
    });
    assert.equal(corrected.status, 200);
    assert.equal(corrected.payload.item.model, 'SAMSUNG GALAXY S23 ULTRA 256GB');
    assert.equal(corrected.payload.item.imei, '351234567890123');
    assert.equal(corrected.payload.item.status, 'awaiting_pickup');
    assert.equal((await manager.request('/api/renova-intake')).payload.summary.awaitingPickup, 1);
    assert.equal(Number((await row(`
      SELECT COUNT(*) AS count FROM audit_logs
      WHERE entity_type = 'renova_intake' AND entity_id = ?
        AND action IN ('renova.received', 'renova.pickup_registered', 'renova.pickup_cleared')
    `, created.payload.item.id)).count), 3);

    assert.equal((await seller.request(`/api/renova-intake/${created.payload.item.id}`, { method: 'DELETE' })).status, 403);
    const removed = await stocker.request(`/api/renova-intake/${created.payload.item.id}`, { method: 'DELETE' });
    assert.equal(removed.status, 204);
    const afterRemoval = await manager.request('/api/renova-intake');
    assert.deepEqual(afterRemoval.payload.summary, { awaitingPickup: 0, pickedUp: 0, total: 0 });
    assert.equal(Number((await row(`
      SELECT COUNT(*) AS count FROM audit_logs
      WHERE entity_type = 'renova_intake' AND entity_id = ? AND action = 'renova.deleted'
    `, created.payload.item.id)).count), 1);
  });

  test('publica, edita, oculta e republica notícias com permissões por perfil', async () => {
    const initialSellerNews = await seller.request('/api/news');
    assert.equal(initialSellerNews.status, 200);
    assert.equal(initialSellerNews.payload.news.length, 10);
    const gamerCampaign = initialSellerNews.payload.news.find((item) => item.id === 'campaign-gamer-week-2026-08');
    assert.equal(gamerCampaign.validityLabel, '11 a 31/08/2026');
    assert.equal(gamerCampaign.imagePath, '/news/semana-gamer-2026-08.jpeg');
    assert.match(gamerCampaign.body, /PS5 Digital R\$ 3\.299/);
    const tvCampaign = initialSellerNews.payload.news.find((item) => item.id === 'campaign-tv-samsung-vivo-total-55-98-2026-08');
    assert.equal(tvCampaign.validityLabel, '11 a 17/08/2026');
    assert.equal(tvCampaign.imagePath, '/news/tv-samsung-vivo-total-55-98-2026-08.jpg');
    assert.match(tvCampaign.body, /R\$ 15\.999 por R\$ 14\.599/);
    assert.match(tvCampaign.body, /Prateleira Infinita/);
    const controleCampaign = initialSellerNews.payload.news.find((item) => item.id === 'campaign-semana-gamer-controle-2026-08');
    assert.equal(controleCampaign.validityLabel, '11 a 31/08/2026');
    assert.equal(controleCampaign.imagePath, '/news/semana-gamer-controle-2026-08.webp');
    assert.match(controleCampaign.body, /30GB de bônus de internet móvel por 12 meses/);
    assert.match(controleCampaign.body, /Netflix Padrão com anúncios/);
    const waawSpeakers = initialSellerNews.payload.news.find((item) => item.id === 'campaign-waaw-caixas-segundo-item-2026-08');
    assert.equal(waawSpeakers.validityLabel, '04 a 31/08/2026');
    assert.equal(waawSpeakers.imagePath, '/news/waaw-caixas-30-segundo-2026-08.jpeg');
    assert.match(waawSpeakers.body, /WAAW US 200SB DUO/);
    const waawHeadphones = initialSellerNews.payload.news.find((item) => item.id === 'campaign-waaw-fones-segundo-item-2026-08');
    assert.equal(waawHeadphones.validityLabel, '04 a 31/08/2026');
    assert.equal(waawHeadphones.imagePath, '/news/waaw-fones-30-segundo-2026-08.jpeg');
    assert.match(waawHeadphones.body, /WAAW Mob 500 ANC/);
    assert.doesNotMatch(JSON.stringify(initialSellerNews.payload), /@/);

    assert.equal((await seller.request('/api/news', {
      method: 'POST', body: { title: 'Sem permissão', body: 'Não deve publicar.', category: 'notice' },
    })).status, 403);
    assert.equal((await stocker.request('/api/news', {
      method: 'POST', body: { title: 'Sem permissão', body: 'Não deve publicar.', category: 'notice' },
    })).status, 403);

    const created = await manager.request('/api/news', {
      method: 'POST',
      body: {
        title: 'Oferta especial da semana',
        body: 'Condição válida enquanto durar o estoque.\nConsulte o gerente em caso de dúvida.',
        category: 'promotion',
      },
    });
    assert.equal(created.status, 201);
    assert.equal(created.payload.news.active, true);
    assert.equal(created.payload.news.category, 'promotion');
    assert.equal(created.payload.news.authorName, 'Gerente Geral');

    for (const client of [seller, stocker]) {
      const visible = await client.request('/api/news');
      assert.equal(visible.status, 200);
      assert.equal(visible.payload.news.length, 11);
      assert.ok(visible.payload.news.some((item) => item.title === 'Oferta especial da semana'));
      assert.doesNotMatch(JSON.stringify(visible.payload), /gerente@exemplo\.com/i);
    }

    assert.equal((await stocker.request(`/api/news/${created.payload.news.id}`, {
      method: 'PUT', body: { title: 'Tentativa', body: 'Sem acesso.', category: 'notice' },
    })).status, 403);

    const updated = await manager.request(`/api/news/${created.payload.news.id}`, {
      method: 'PUT',
      body: { title: 'Oferta atualizada', body: 'Nova condição informada para toda a equipe.', category: 'update' },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.payload.news.title, 'Oferta atualizada');
    assert.equal(updated.payload.news.category, 'update');

    const hidden = await manager.request(`/api/news/${created.payload.news.id}/visibility`, {
      method: 'PATCH', body: { active: false },
    });
    assert.equal(hidden.status, 200);
    assert.equal(hidden.payload.news.active, false);
    assert.equal((await seller.request('/api/news')).payload.news.length, 10);
    assert.equal((await stocker.request('/api/news')).payload.news.length, 10);
    assert.ok(!(await seller.request('/api/news')).payload.news.some((item) => item.id === created.payload.news.id));

    const managerView = await manager.request('/api/news');
    assert.equal(managerView.status, 200);
    assert.equal(managerView.payload.news.length, 11);
    assert.equal(managerView.payload.news.find((item) => item.id === created.payload.news.id).active, false);

    const republished = await manager.request(`/api/news/${created.payload.news.id}/visibility`, {
      method: 'PATCH', body: { active: true },
    });
    assert.equal(republished.status, 200);
    assert.equal(republished.payload.news.active, true);
    assert.equal((await seller.request('/api/news')).payload.news.length, 11);

    assert.equal((await manager.request('/api/news', {
      method: 'POST', body: { title: 'Tipo inválido', body: 'Teste de validação.', category: 'qualquer' },
    })).status, 400);
    assert.equal(Number((await row(`
      SELECT COUNT(*) AS count FROM audit_logs
      WHERE entity_type = 'news' AND entity_id = ?
        AND action IN ('news.created', 'news.updated', 'news.hidden', 'news.published')
    `, created.payload.news.id)).count), 4);
  });

  test('exclui acessos, encerra sessões e preserva pedidos e histórico anonimizados', async () => {
    const removable = await manager.request('/api/users', {
      method: 'POST',
      body: { name: 'Usuário Temporário', email: 'temporario@exemplo.com', password: 'ProvisoriaExcluir123', role: 'seller' },
    });
    assert.equal(removable.status, 201);
    const temporary = new Client('198.51.100.14');
    assert.equal((await temporary.request('/api/auth/login', {
      method: 'POST', body: { email: 'temporario@exemplo.com', password: 'ProvisoriaExcluir123' },
    })).status, 200);

    assert.equal((await manager.request(`/api/users/${removable.payload.user.id}`, { method: 'DELETE' })).status, 204);
    assert.equal((await temporary.request('/api/auth/me')).status, 401);
    assert.equal((await temporary.request('/api/auth/login', {
      method: 'POST', body: { email: 'temporario@exemplo.com', password: 'ProvisoriaExcluir123' },
    })).status, 401);
    const deletedTemporary = await row('SELECT name, email, active, deleted_at FROM users WHERE id = ?', removable.payload.user.id);
    assert.equal(deletedTemporary.name, 'Usuário excluído');
    assert.match(deletedTemporary.email, /^excluido\+/);
    assert.equal(Number(deletedTemporary.active), 0);
    assert.ok(deletedTemporary.deleted_at);

    const historicalRequestsBefore = Number((await row('SELECT COUNT(*) AS count FROM withdrawal_requests WHERE seller_id = 99')).count);
    const historicalAuditBefore = Number((await row('SELECT COUNT(*) AS count FROM audit_logs WHERE actor_user_id = 99')).count);
    await database.prepare(`
      UPDATE chips
      SET status = 'sold', active = 0, sold_on = '2026-08-26', registered_phone = '31999999999',
          removed_at = '2026-08-26T00:00:00.000Z'
      WHERE assigned_seller_id = 99
    `).run();
    assert.equal((await manager.request('/api/users/99', { method: 'DELETE' })).status, 204);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM withdrawal_requests WHERE seller_id = 99')).count), historicalRequestsBefore);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM audit_logs WHERE actor_user_id = 99')).count), historicalAuditBefore);
    const deletedLegacy = await row('SELECT name, email, deleted_at FROM users WHERE id = 99');
    assert.equal(deletedLegacy.name, 'Usuário excluído');
    assert.notEqual(deletedLegacy.email, 'legado@exemplo.com');
    assert.ok(deletedLegacy.deleted_at);

    const users = await manager.request('/api/users');
    assert.equal(users.status, 200);
    assert.equal(users.payload.users.some((user) => user.id === 99 || user.id === removable.payload.user.id), false);
    const historicalRequest = (await manager.request('/api/requests')).payload.requests
      .find((request) => request.seller.id === 99);
    assert.equal(historicalRequest.seller.name, 'Usuário excluído');
    assert.notEqual(historicalRequest.seller.email, 'legado@exemplo.com');
    const managerUser = await row(`SELECT id FROM users WHERE email = 'gerente@exemplo.com'`);
    const ownDeletion = await manager.request(`/api/users/${managerUser.id}`, { method: 'DELETE' });
    assert.equal(ownDeletion.status, 400);
    assert.match(ownDeletion.payload.error, /próprio cadastro/i);
  });

  test('entrega o configurador por modelo sem dependências externas', async () => {
    const [appSource, groupsSource, indexSource, headersSource, symbolSource, packageSource, stylesSource, updaterSource, deploymentWorkflow, workerSource] = await Promise.all([
      readFile(new URL('../public/app.js', import.meta.url), 'utf8'),
      readFile(new URL('../public/catalog-groups.js', import.meta.url), 'utf8'),
      readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
      readFile(new URL('../public/_headers', import.meta.url), 'utf8'),
      readFile(new URL('../public/estoque-symbol.svg', import.meta.url), 'utf8'),
      readFile(new URL('../package.json', import.meta.url), 'utf8'),
      readFile(new URL('../public/styles.css', import.meta.url), 'utf8'),
      readFile(new URL('../ATUALIZAR-SISTEMA.bat', import.meta.url), 'utf8'),
      readFile(new URL('../.github/workflows/deploy-cloudflare.yml', import.meta.url), 'utf8'),
      readFile(new URL('../src/worker.js', import.meta.url), 'utf8'),
    ]);
    assert.doesNotMatch(appSource, /ZXing|scan-device|\/api\/devices/i);
    assert.doesNotMatch(appSource, /BarcodeDetector|getUserMedia|start-chip-camera/i);
    assert.doesNotMatch(appSource, /[▯▢◇♫▰▣ϟ⌁◆♙◷⇄⌂☰↪×]/);
    assert.doesNotMatch(indexSource, /zxing|vendor\/zxing/i);
    assert.doesNotMatch(packageSource, /@zxing/i);
    assert.doesNotMatch(stylesSource, /@import|url\(\s*['"]?https?:/i);
    assert.equal(JSON.parse(packageSource).version, '6.8.31');
    assert.match(appSource, /\/api\/replenishment\/export/);
    assert.doesNotMatch(appSource, /print-replenishment|printing-replenishment/);
    assert.match(appSource, /function normalizeSearch\(value = ''\)/);
    assert.match(appSource, /código material/i);
    assert.match(appSource, /function clusterGraphic/);
    assert.match(appSource, /material-code-box/);
    assert.match(stylesSource, /\.cluster-graphic/);
    assert.match(stylesSource, /\.material-code-box/);
    assert.match(appSource, /Números de série liberados/i);
    assert.match(appSource, /data-action="toggle-device-family"/);
    assert.match(appSource, /action:\s*'device-case'/);
    assert.match(appSource, /action:\s*'device-film'/);
    assert.match(appSource, /Pedido liberado com o preço registrado\. O IMEI já está disponível/i);
    assert.match(appSource, /data-action="pricing-category"/);
    assert.match(appSource, /Total do pedido/i);
    assert.match(appSource, /Subtotal ao vivo/i);
    assert.match(appSource, /id="cart-fab"/i);
    assert.match(appSource, /data-action="close-cart-drawer"/i);
    assert.match(appSource, /data-action="increase-cart-item"/i);
    assert.match(appSource, /data-action="decrease-cart-item"/i);
    assert.match(appSource, /Revisar e finalizar pedido/i);
    assert.match(appSource, /class="request-review-form"/i);
    assert.match(stylesSource, /\.cart-fab[\s\S]*position:\s*fixed/i);
    assert.match(stylesSource, /\.cart-drawer[\s\S]*transform:\s*translateX\(104%\)/i);
    assert.match(stylesSource, /\.cart-drawer\.is-open/);
    assert.doesNotMatch(appSource, /cart-bar__finish/);
    assert.match(stylesSource, /\.request-review-form \.modal__footer[\s\S]*position:\s*sticky/i);
    assert.match(appSource, /todos os produtos estão incluídos/i);
    assert.match(appSource, /Valor automático e não editável/i);
    assert.match(appSource, /Aguardando a inclusão deste aparelho no simulador de preços/i);
    assert.match(appSource, /Este aparelho ainda não possui preço verificado no simulador/i);
    assert.match(appSource, /aparelhos aceitos pela ASSURANT/i);
    assert.match(appSource, /type="search"[\s\S]*data-action="renova-used-device-search"/i);
    assert.match(appSource, /normalizeRenovaModelKey/);
    assert.doesNotMatch(appSource, /iphone 17 pro max|moto g35/i);
    assert.doesNotMatch(appSource, /data-action="renova-voucher"|Voucher \(R\$\).*editável|state\.renova\.voucherCents/i);
    assert.match(stylesSource, /\.store-card__price/);
    assert.match(stylesSource, /\.pricing-selector/);
    assert.match(appSource, /Cancelar e devolver ao estoque/i);
    assert.match(appSource, /Quantidades e IMEIs devolvidos ao estoque/i);
    assert.doesNotMatch(appSource, /serial-options|Aprovar retirada|Confirmar aprovação/i);
    assert.match(groupsSource, /function groupDeviceProducts/);
    assert.match(groupsSource, /function compatibleCaseChoices/);
    assert.match(stylesSource, /\.device-family-card\.is-expanded/);
    assert.match(stylesSource, /\.device-accessory-grid/);
    assert.match(appSource, /data-form="delete-user"/);
    assert.match(appSource, /Nova senha[\s\S]*opcional/i);
    assert.match(appSource, /A senha atual não será solicitada/i);
    assert.match(appSource, /function managerInventoryOverview/);
    assert.match(appSource, /function sellerInventoryOverview/);
    assert.doesNotMatch(appSource, /function sellerInventoryGroupCard[\s\S]*const incomingAlert = Number\(group\.incoming \|\| 0\)/);
    assert.match(appSource, /function renderIncoming/);
    assert.match(appSource, /api\/incoming/);
    assert.match(appSource, /function stockerInventoryOverview/);
    assert.match(appSource, /data-action="open-stock-group"/);
    assert.match(appSource, /data-action="open-store-group"/);
    assert.match(appSource, /data-action="filter-stock-category"/);
    assert.match(stylesSource, /\.inventory-group-grid/);
    assert.match(stylesSource, /\.inventory-group-card/);
    assert.match(appSource, /option value="stocker"/);
    assert.match(appSource, /function managementClusterChart/);
    assert.match(appSource, /function orderDonut/);
    assert.match(appSource, /function teamBreakSchedule/);
    assert.match(appSource, /Ana[\s\S]*11:00[\s\S]*12:36/);
    assert.match(appSource, /Thalia[\s\S]*11:30[\s\S]*13:06/);
    assert.match(appSource, /Luiz[\s\S]*12:36[\s\S]*14:12/);
    assert.match(appSource, /Joice[\s\S]*13:06[\s\S]*14:42/);
    assert.match(appSource, /Pedro[\s\S]*14:12[\s\S]*15:48/);
    assert.match(appSource, /Próxima saída somente após o retorno confirmado do funcionário anterior/);
    assert.match(appSource, /point-schedule[\s\S]*teamBreakSchedule\('point'\)/);
    assert.doesNotMatch(appSource, /teamBreakSchedule\('alignment'\)/);
    assert.match(stylesSource, /\.team-schedule/);
    assert.match(stylesSource, /\.team-schedule__bar/);
    assert.match(stylesSource, /\.management-dashboard-grid/);
    assert.match(stylesSource, /\.requests-list--stocker/);
    assert.match(stylesSource, /\.balance-tracked-badge/);
    assert.match(stylesSource, /--brand:\s*#b58cff/i);
    assert.doesNotMatch(stylesSource, /--brand:\s*#(?:e32646|ff2d55)/i);
    assert.match(stylesSource, /--background:\s*#0a0a0c/i);
    assert.match(stylesSource, /color-scheme:\s*dark/i);
    assert.match(stylesSource, /Tema Liquid Glass/i);
    assert.match(stylesSource, /backdrop-filter:\s*saturate\(135%\)\s*blur\(22px\)/i);
    assert.match(stylesSource, /content-visibility:\s*auto/i);
    assert.match(stylesSource, /-apple-system,\s*BlinkMacSystemFont/i);
    assert.match(stylesSource, /prefers-reduced-motion:\s*reduce/i);
    assert.match(appSource, /Central de Alinhamento/i);
    assert.match(appSource, /data-action="open-alignment"/i);
    assert.match(appSource, /Roteiro · até 20 min/);
    assert.match(appSource, /minutes:\s*6[\s\S]*minutes:\s*6[\s\S]*minutes:\s*4[\s\S]*minutes:\s*4/);
    assert.match(appSource, /Resumo guiado · 2 min/);
    assert.match(appSource, /A loja exclusiva Vivo deve atender presencialmente e tratar demandas de todos os serviços do grupo/);
    assert.match(appSource, /Resolver o problema do cliente não é um favor/i);
    assert.match(appSource, /function alignmentLeadershipMessages/);
    assert.match(appSource, /Renato Dal Negro[\s\S]*Supervisor Comercial/);
    assert.match(appSource, /Maria Caldas[\s\S]*Dona da empresa/);
    assert.match(appSource, /Ainda temos CN\/ lojas enviando ou pedindo para clientes ligarem na central/);
    assert.match(appSource, /Vcs são a GRAMCELL e eu me orgulho muito disso!/);
    assert.doesNotMatch(appSource, /src="\/alignment\/orientacao-resolucao-[12]\.webp"/);
    assert.match(appSource, /Troca de chip/i);
    assert.match(appSource, /Ativação de Pré/i);
    assert.match(appSource, /Gerente geral[\s\S]*Gerente de operações[\s\S]*Consultores/i);
    assert.match(appSource, /Cozinha e sala de estoque/i);
    assert.match(appSource, /state\.user\.role !== 'manager'[\s\S]*\['users', 'audit'\]/i);
    assert.match(appSource, /function renderSimpleAlignment/);
    assert.match(appSource, /Quatro combinados para o dia funcionar bem/i);
    assert.match(appSource, /Checklist de 30 segundos/i);
    assert.match(stylesSource, /\.simple-alignment-grid/);
    assert.match(appSource, /function renderNews/);
    assert.match(appSource, /data-action="open-news"/);
    assert.match(appSource, /data-action="toggle-news"/);
    assert.match(appSource, /data-action="view-news-art"/);
    assert.match(appSource, /function safeNewsImagePath/);
    assert.match(appSource, /Formatação rápida/);
    assert.match(appSource, /Ocultar da aba/);
    assert.match(appSource, /Publicar novamente/);
    assert.match(stylesSource, /\.news-hero/);
    assert.match(stylesSource, /\.news-card/);
    assert.match(appSource, /function renderChips/);
    assert.match(appSource, /Meus chips/);
    assert.match(appSource, /Adicione vários ICCIDs à fila e confirme todos de uma vez/);
    assert.match(appSource, /data-action="select-chip-material"/);
    assert.match(appSource, /data-action="select-chip-candidate"/);
    assert.match(appSource, /data-action="add-chip-to-batch"/);
    assert.match(appSource, /data-action="remove-chip-batch-item"/);
    assert.match(appSource, /\/api\/chips\/bulk/);
    assert.match(appSource, /\/api\/chips\/candidates/);
    assert.match(appSource, /Correspondência identificada automaticamente/);
    assert.match(appSource, /correspondências encontradas · selecione a correta/);
    assert.match(appSource, /data-form="sell-chip"/);
    assert.match(appSource, /allocatedToSellers/);
    assert.match(stylesSource, /\.chips-hero/);
    assert.match(appSource, /\['renova-intake', 'renova', 'Renova'\]/);
    assert.match(appSource, /function renderRenovaIntake/);
    assert.match(appSource, /RENOVA_INTAKE_ROLES = new Set\(\['manager', 'stocker'\]\)/);
    assert.match(appSource, /view === 'renova-intake' && !canAccessRenovaIntake\(\)/);
    assert.match(appSource, /data-action="pickup-renova-intake"/);
    assert.match(appSource, /list="renova-intake-device-options"/);
    assert.match(appSource, /name="imei"[\s\S]*pattern="\[0-9\]\{15\}"/);
    assert.match(appSource, /data-action="delete-renova-intake"/);
    assert.match(appSource, /data-form="delete-renova-intake"/);
    assert.match(appSource, /item\.registrationCode/);
    assert.match(appSource, /Buscar código, modelo ou IMEI/);
    assert.match(stylesSource, /\.renova-intake-code/);
    assert.match(appSource, /Selecione um aparelho da lista do Vivo Renova/);
    assert.match(appSource, /Data da retirada pela empresa/);
    assert.match(stylesSource, /\.renova-intake-hero/);
    assert.match(stylesSource, /\.renova-intake-card/);
    assert.match(stylesSource, /\.chip-owner-card/);
    assert.match(updaterSource, /npm run check/);
    assert.match(updaterSource, /npm test/);
    assert.match(updaterSource, /wrangler d1 export controle-estoque-db --remote/);
    assert.match(updaterSource, /wrangler d1 migrations apply controle-estoque-db --remote/);
    assert.match(updaterSource, /wrangler deploy --dry-run --keep-vars/);
    assert.match(updaterSource, /wrangler deploy --keep-vars/);
    assert.match(updaterSource, /if errorlevel 1 goto :failed/);
    assert.match(deploymentWorkflow, /push:[\s\S]*branches:[\s\S]*- main/);
    assert.match(deploymentWorkflow, /pull_request:[\s\S]*branches:[\s\S]*- main/);
    assert.match(deploymentWorkflow, /permissions:[\s\S]*contents: read/);
    assert.match(deploymentWorkflow, /needs: test/);
    assert.match(deploymentWorkflow, /CLOUDFLARE_API_TOKEN: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}/);
    assert.match(deploymentWorkflow, /CLOUDFLARE_ACCOUNT_ID: \$\{\{ secrets\.CLOUDFLARE_ACCOUNT_ID \}\}/);
    assert.match(deploymentWorkflow, /wrangler deploy --dry-run --keep-vars/);
    assert.match(deploymentWorkflow, /wrangler d1 migrations apply controle-estoque-db --remote/);
    assert.match(deploymentWorkflow, /wrangler deploy --keep-vars/);
    assert.match(deploymentWorkflow, /https:\/\/controleestoque\.app\.br\//);
    assert.match(stylesSource, /\.chip-material-option/);
    assert.match(stylesSource, /\.chip-candidate-option/);
    assert.match(stylesSource, /\.chip-batch-item/);
    assert.doesNotMatch(stylesSource, /\.chip-camera|\.chip-scanner/);
    assert.match(appSource, /class="alignment-workspace"/);
    assert.match(appSource, /role="tablist"/);
    assert.match(appSource, /Tema \$\{topicIndex \+ 1\} de \$\{alignmentTopics\.length\}/);
    assert.doesNotMatch(appSource, /data-action="close-alignment"/);
    assert.match(stylesSource, /\.alignment-navigator/);
    assert.match(stylesSource, /\.alignment-nav__item/);
    assert.match(stylesSource, /\.alignment-detail__pager/);
    assert.match(stylesSource, /\.alignment-conversation/);
    assert.match(stylesSource, /\.alignment-message__bubble/);
    assert.match(stylesSource, /\.alignment-detail/);
    assert.match(appSource, /A função do consultor vai além de vender/i);
    assert.match(appSource, /Resolução Anatel nº 765\/2023 · art\. 20/i);
    assert.match(appSource, /Arts\. 9º, 10 e 60–65/i);
    assert.match(appSource, /Anatel 21, 36 e 40–42 · CDC 30, 31 e 37/i);
    assert.match(appSource, /Arts\. 34 e 39/i);
    assert.match(appSource, /Arts\. 6º, 39, 46 e 47/i);
    assert.match(appSource, /CLT · art\. 462/i);
    assert.match(appSource, /informacoes\.anatel\.gov\.br/i);
    assert.match(appSource, /planalto\.gov\.br/i);
    assert.match(stylesSource, /Central de Alinhamento — v5\.9/i);
    assert.match(stylesSource, /\.alignment-checklist li[\s\S]*font-size:\s*18px/i);
    assert.match(stylesSource, /\.alignment-legal/);
    assert.match(stylesSource, /\.alignment-law-grid/);
    assert.match(stylesSource, /Tema Lavanda Pastel/i);
    assert.match(stylesSource, /\.product-visual--cases[\s\S]*#70588f/i);
    assert.match(indexSource, /name="theme-color" content="#0b0b0d"/i);
    assert.match(headersSource, /img-src 'self' data: https:/);
    assert.match(indexSource, /rel="icon" type="image\/svg\+xml" href="\/estoque-symbol\.svg"/);
    assert.match(appSource, /brand-mark[^>]*>\s*<img src="\/estoque-symbol\.svg" alt="">/);
    assert.match(symbolSource, /Caixa de estoque com marca de conferência/);
    assert.match(indexSource, /id="cart-root" data-cart-bar/);
    assert.match(indexSource, /styles\.css\?v=6\.8\.31/);
    assert.match(indexSource, /app\.js\?v=6\.8\.31/);
    assert.match(stylesSource, /Consolidação responsiva/);
    assert.match(stylesSource, /@media screen and \(max-width: 380px\)/);
    assert.match(stylesSource, /max-height: calc\(100dvh - 10px\)/);
    assert.match(stylesSource, /overscroll-behavior-x: contain/);
    assert.match(appSource, /Produtos a caminho/);
    assert.match(appSource, /Produtos em reparo/);
    assert.match(workerSource, /\/api\/repairs/);
    assert.match(appSource, /data-incoming-catalog/);
    assert.match(appSource, /incomingDepositsText/);
    assert.match(stylesSource, /\.incoming-showcase/);
    assert.match(stylesSource, /\.incoming-product-card/);
    assert.match(stylesSource, /\.cart-fab\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?right:\s*20px;[\s\S]*?bottom:\s*20px;[\s\S]*?z-index:\s*9999;/);
    assert.match(appSource, /function productImageMarkup\(produto, className, width, height\)/);
    assert.match(appSource, /function productImageUrl\(produto\)[\s\S]*typeof produto\?\.imagem_url === 'string' \? produto\.imagem_url\.trim\(\)/);
    assert.match(appSource, /escapeHtml\(productImageUrl\(produto\)\)/);
    assert.match(appSource, /cart-drawer-item__thumb[^\n]*\$\{productImageMarkup\(produto, 'cart-drawer-item__image', 64, 64\)\}/);
    assert.match(appSource, /data-product-image="true"/);
    assert.match(appSource, /function handleProductImageError\(event\)/);
    assert.match(appSource, /document\.addEventListener\('error', handleProductImageError, true\)/);
    assert.doesNotMatch(appSource, /onerror=/);
    assert.doesNotMatch(appSource, /CHAVE_DA_IMAGEM_AQUI|Inspecionando dados do produto|via\.placeholder\.com|placehold\.co/);
    assert.match(appSource, /stock-product-cell__image/);
    assert.match(appSource, /cart-drawer-item__image/);
    assert.match(appSource, /picker-product__image/);
    assert.match(appSource, /cart-review__image/);
    assert.match(stylesSource, /\.product-image-media__image[\s\S]*max-width:\s*100%/);
    assert.match(stylesSource, /\.product-image-media__image[\s\S]*object-fit:\s*contain/);
    assert.match(stylesSource, /\.picker-product__image[\s\S]*object-fit:\s*contain/);
    assert.match(appSource, /Etiquetas de capas/);
    assert.match(appSource, /function caseLabelName/);
    assert.match(appSource, /row\.transparent \? 'transparent' : 'other'/);
    assert.match(appSource, /TRANSPARENTE\|TRANSPARENT\|CRISTAL\|CLEAR/);
    assert.match(appSource, /function caseMaterialLabel/);
    assert.match(appSource, /shelf-label__prices/);
    assert.match(appSource, /S\\d\{2,3\}\(\?:\\\+\|/);
    assert.match(appSource, /45 x 30 mm/);
    assert.match(appSource, /window\.print\(\)/);
    assert.match(appSource, /function printSelectedLabels/);
    assert.match(appSource, /label-print-portal/);
    assert.match(stylesSource, /\.label-print-sheet/);
    assert.match(stylesSource, /grid-template-columns:\s*repeat\(4, 45mm\)/);
    assert.match(stylesSource, /body > \*:not\(\.label-print-portal\)/);
    assert.match(appSource, /async function renderPoint/);
    assert.match(appSource, /user\.role === 'seller' \? 'point' : 'dashboard'/);
    assert.match(appSource, /data-action="upload-point-qr"/);
    assert.match(appSource, /data-action="punch-point"/);
    assert.match(appSource, /BATI MEU PONTO/);
    assert.match(appSource, /async function renderTeamPoint/);
    assert.match(appSource, /Ponto da equipe/);
    assert.match(stylesSource, /\.point-qr__frame/);
    assert.match(stylesSource, /\.point-punch-button/);
    assert.match(workerSource, /async function myPoint/);
    assert.match(workerSource, /Cache-Control.*private, no-store/);
    assert.match(appSource, /const representativeProduct = option\?\.product \|\| group\.products\[0\]/);
    assert.match(appSource, /document\.addEventListener\('DOMContentLoaded'/);
    assert.match(appSource, /getElementById\('cart-root'\)\?\.addEventListener\('click', handleCartRootClick\)/);
    assert.match(appSource, /button\.id === 'cart-fab'/);
    assert.doesNotMatch(appSource, /picsum\.photos|data:image\/svg\+xml|DEFAULT_PRODUCT_IMAGE_URL|product-default\.svg|data-fallback-src/);
    assert.doesNotMatch(workerSource, /PRODUCT_IMAGE_BY_CLUSTER|product-images\/category-/);
    assert.doesNotMatch(appSource, /<div data-cart-bar><\/div>/);
    for (const label of ['Aparelhos', 'Capas', 'Películas', 'Caixas de som', 'Notebooks', 'TVs', 'Carregadores', 'Cabos', 'Acessórios diversos']) {
      assert.match(appSource, new RegExp(label, 'i'));
    }

    const page = await mf.dispatchFetch('https://controleestoque.app.br/');
    const script = await mf.dispatchFetch('https://controleestoque.app.br/app.js?v=6.8.31');
    const renderedScript = await script.text();
    const groupsScript = await mf.dispatchFetch('https://controleestoque.app.br/catalog-groups.js');
    const alignmentImage = await mf.dispatchFetch('https://controleestoque.app.br/alignment/atitudes-profissionais.webp');
    const newsImage = await mf.dispatchFetch('https://controleestoque.app.br/news/semana-gamer-2026-08.jpeg');
    const tvNewsImage = await mf.dispatchFetch('https://controleestoque.app.br/news/tv-samsung-vivo-total-55-98-2026-08.jpg');
    const tvNewsImageCompact = await mf.dispatchFetch('https://controleestoque.app.br/news/tv-samsung-vivo-total-32-43-50-2026-08.jpg');
    const tvNewsCardImage = await mf.dispatchFetch('https://controleestoque.app.br/news/tv-samsung-vivo-total-55-98-2026-08-card.jpg');
    const tvNewsCardImageCompact = await mf.dispatchFetch('https://controleestoque.app.br/news/tv-samsung-vivo-total-32-43-50-2026-08-card.jpg');
    const controleNewsImage = await mf.dispatchFetch('https://controleestoque.app.br/news/semana-gamer-controle-2026-08.webp');
    const controleNewsCardImage = await mf.dispatchFetch('https://controleestoque.app.br/news/semana-gamer-controle-2026-08-card.jpg');
    const additionalNewsCardImages = await Promise.all([
      'semana-gamer-2026-08-card.jpg',
      'campanhas-acessorios-2026-08-card.jpg',
      'bundle-samsung-2026-08-card.jpg',
      'bundle-motorola-2026-08-card.jpg',
      'bundle-apple-2026-08-card.jpg',
    ].map((fileName) => mf.dispatchFetch(`https://controleestoque.app.br/news/${fileName}`)));
    assert.equal(page.headers.get('cache-control'), 'no-store');
    assert.equal(page.headers.get('permissions-policy'), 'camera=(), microphone=(), geolocation=()');
    assert.match(page.headers.get('content-security-policy') || '', /img-src 'self' data: https:/);
    assert.equal(script.headers.get('cache-control'), 'no-cache');
    assert.equal(groupsScript.headers.get('cache-control'), 'no-cache');
    assert.equal(alignmentImage.status, 200);
    assert.equal(newsImage.status, 200);
    assert.match(newsImage.headers.get('content-type') || '', /image\/jpeg/i);
    assert.equal(tvNewsImage.status, 200);
    assert.match(tvNewsImage.headers.get('content-type') || '', /image\/jpeg/i);
    assert.equal(tvNewsImageCompact.status, 200);
    assert.match(tvNewsImageCompact.headers.get('content-type') || '', /image\/jpeg/i);
    assert.equal(tvNewsCardImage.status, 200);
    assert.match(tvNewsCardImage.headers.get('content-type') || '', /image\/jpeg/i);
    assert.equal(tvNewsCardImageCompact.status, 200);
    assert.match(tvNewsCardImageCompact.headers.get('content-type') || '', /image\/jpeg/i);
    assert.equal(controleNewsImage.status, 200);
    assert.match(controleNewsImage.headers.get('content-type') || '', /image\/webp/i);
    assert.equal(controleNewsCardImage.status, 200);
    assert.match(controleNewsCardImage.headers.get('content-type') || '', /image\/jpeg/i);
    for (const response of additionalNewsCardImages) {
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type') || '', /image\/jpeg/i);
    }
    assert.match(renderedScript, /tv-samsung-vivo-total-55-98-2026-08-card\.jpg/);
    assert.match(renderedScript, /bundle-apple-2026-08-card\.jpg/);
    assert.match(renderedScript, /semana-gamer-controle-2026-08-card\.jpg/);
  });
});
