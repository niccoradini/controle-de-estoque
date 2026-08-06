import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, describe, test } from 'node:test';
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
  const modulesRoot = new URL('../src/', import.meta.url).pathname;
  const [workerSource, securitySource, migration1, migration2, migration3, migration4, migration5, migration6, migration7, migration8, migration9, migration10, migration11, migration12, migration13, migration14, migration15, migration16, migration17, migration18, migration19, migration20] = await Promise.all([
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
      directory: new URL('../public/', import.meta.url).pathname,
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
});

after(async () => mf?.dispose());

describe('Controle de estoque por código material', () => {
  const manager = new Client('198.51.100.10');
  const seller = new Client('198.51.100.11');
  const stocker = new Client('198.51.100.12');

  test('atualiza o relatório de 05/08, exclui RPAR e preserva pedidos', async () => {
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM products')).count), 314);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM products WHERE active = 1')).count), 297);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM product_variants')).count), 314);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM product_variants WHERE active = 1')).count), 297);
    assert.equal(Number((await row('SELECT SUM(quantity_on_hand) AS total FROM product_variants')).total), 1072);
    assert.equal(Number((await row('SELECT SUM(quantity_on_hand) AS total FROM product_variants WHERE active = 1')).total), 1072);
    assert.equal(Number((await row(`SELECT COUNT(*) AS count FROM inventory_serials WHERE status = 'available'`)).count), 1072);
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
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'inventory_snapshot_date'`)).value, '2026-08-05');
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'inventory_snapshot_source'`)).value, 'ESTOQUE05.08.2026.txt');
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'inventory_snapshot_incoming_depots'`)).value, 'DEPS,NREM');
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'inventory_snapshot_incoming_units'`)).value, '0');
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM incoming_inventory')).count), 0);

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
    assert.equal(Number(iphone.quantity_on_hand), 1);
    assert.equal(Number((await row(`SELECT quantity_on_hand FROM product_variants WHERE sku = '22022613'`)).quantity_on_hand), 3);
    assert.equal(Number((await row(`SELECT quantity_on_hand FROM product_variants WHERE sku = '22022526'`)).quantity_on_hand), 7);
    assert.equal((await row(`SELECT status FROM inventory_serials WHERE serial_number = '22022526351919'`)).status, 'available');
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
      cables: { products: 22, units: 65 },
      cases: { products: 104, units: 178 },
      chargers: { products: 24, units: 62 },
      devices: { products: 84, units: 146 },
      misc: { products: 44, units: 347 },
      notebooks: { products: 2, units: 2 },
      screen_protectors: { products: 6, units: 229 },
      speakers: { products: 9, units: 22 },
      tvs: { products: 2, units: 21 },
    });
    assert.equal(Number((await row(`SELECT active FROM product_variants WHERE sku = 'YBSC001A1000'`)).active), 0);
    assert.equal(Number((await row(`SELECT active FROM product_variants WHERE sku = 'TGSA56224000'`)).active), 0);

    const newMotorola = await row(`
      SELECT p.display_name, v.quantity_on_hand
      FROM products p JOIN product_variants v ON v.product_id = p.id
      WHERE v.sku = 'TGMO61152000'
    `);
    assert.equal(newMotorola.display_name, 'MOTOROLA MOTO G47 128GB GRAFITE');
    assert.equal(Number(newMotorola.quantity_on_hand), 2);

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
    assert.equal(Number((await row(`SELECT quantity_on_hand FROM product_variants WHERE sku = 'DGAP22722000'`)).quantity_on_hand), 0);

    const newProducts = (await database.prepare(`
      SELECT v.sku, p.display_name, p.cluster, v.quantity_on_hand
      FROM products p JOIN product_variants v ON v.product_id = p.id
      WHERE v.sku IN ('22025161', 'TGMO611B2000', 'TGSA61762000', 'TGSA61962000', 'TGSA62254000', 'YBSC001A4000')
      ORDER BY v.sku
    `).all()).results;
    assert.deepEqual(newProducts.map((item) => ({
      sku: item.sku,
      name: item.display_name,
      cluster: item.cluster,
      quantity: Number(item.quantity_on_hand),
    })), [
      { sku: '22025161', name: 'SAMSUNG WATCH 9 40MM 32GB BLUETOOTH GRAFITE', cluster: 'devices', quantity: 1 },
      { sku: 'TGMO611B2000', name: 'MOTOROLA MOTO G47 128GB AZUL-MARINHO', cluster: 'devices', quantity: 1 },
      { sku: 'TGSA61762000', name: 'SAMSUNG GALAXY Z FLIP8 512GB PRETO', cluster: 'devices', quantity: 2 },
      { sku: 'TGSA61962000', name: 'SAMSUNG GALAXY Z FOLD8 512GB PRETO', cluster: 'devices', quantity: 2 },
      { sku: 'TGSA62254000', name: 'SAMSUNG WATCH 9 40MM 32GB LTE GRAFITE', cluster: 'devices', quantity: 2 },
      { sku: 'YBSC001A4000', name: 'SIM CARD 5G 2/3/4FF AVULSO P69S MG', cluster: 'misc', quantity: 100 },
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
    assert.equal(dashboard.payload.inventoryGroups.reduce((sum, group) => sum + group.materialCount, 0), 297);
    assert.equal(dashboard.payload.inventoryGroups.reduce((sum, group) => sum + group.onHand, 0), 1072);
    assert.equal(
      dashboard.payload.inventoryGroups.reduce((sum, group) => sum + group.available, 0),
      dashboard.payload.stock.available,
    );
    assert.ok(dashboard.payload.inventoryGroups.every((group) => group.topProducts.length <= 3));
    assert.doesNotMatch(JSON.stringify(dashboard.payload.inventoryGroups), /serialNumber|serialNumbers|serial_number/i);
    assert.equal(dashboard.payload.management.outOfStockMaterials, 4);
    assert.equal(dashboard.payload.management.incomingUnits, 0);
    assert.equal(dashboard.payload.management.incomingMaterials, 0);
    assert.equal(dashboard.payload.management.shortageProducts.length, 4);
    assert.deepEqual(dashboard.payload.management.incomingProducts, []);
    assert.equal(dashboard.payload.management.snapshot.source, 'ESTOQUE05.08.2026.txt');

    const devices = dashboard.payload.inventoryGroups.find((group) => group.cluster === 'devices');
    assert.equal(devices.materialCount, 84);
    assert.equal(devices.onHand, 146);
  });

  test('cria vendedor, exige a troca provisória e permite ao gerente editar todos os dados', async () => {
    const created = await manager.request('/api/users', {
      method: 'POST', body: { name: 'Vendedor Um', email: 'vendedor@exemplo.com', password: 'Provisoria123', role: 'seller' },
    });
    assert.equal(created.status, 201);
    assert.equal(created.payload.user.mustChangePassword, true);

    const login = await seller.request('/api/auth/login', {
      method: 'POST', body: { email: 'vendedor@exemplo.com', password: 'Provisoria123' },
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
        password: 'SenhaDefinidaGerente123',
        role: 'seller',
        active: true,
      },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.payload.user.name, 'Vendedor Atualizado');
    assert.equal(updated.payload.user.email, 'vendedor.novo@exemplo.com');
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
    assert.equal((await seller.request('/api/catalog')).status, 200);
  });

  test('expõe o catálogo sem vazar séries e bloqueia movimentação manual', async () => {
    const catalog = await manager.request('/api/catalog');
    assert.equal(catalog.status, 200);
    assert.equal(catalog.payload.products.length, 297);
    assert.equal(catalog.payload.products.reduce((sum, product) => sum + product.onHand, 0), 1072);
    assert.ok(catalog.payload.products.every((product) => product.variants.length === 1
      && product.variants[0].stockMode === 'quantity' && product.variants[0].serialTracked === true));
    assert.deepEqual(new Set(catalog.payload.products.map((product) => product.cluster)), new Set([
      'devices', 'cases', 'screen_protectors', 'speakers', 'notebooks', 'tvs', 'chargers', 'cables', 'misc',
    ]));

    const iphone = catalog.payload.products.find((product) => product.variants[0].materialCode === 'DGAP27943000');
    assert.equal(iphone.name, 'APPLE IPHONE 17 PRO MAX 1TB PRATA');
    assert.equal(catalog.payload.pricing.tableDate, '2026-08-04');
    assert.equal(catalog.payload.pricing.retailTableDate, '2026-08-04');
    assert.equal(catalog.payload.pricing.categories.length, 9);
    assert.equal(catalog.payload.products.filter((product) => product.pricing).length, 68);
    assert.equal(catalog.payload.products.filter((product) => product.retailPrice).length, 226);
    const sellerCatalog = await seller.request('/api/catalog');
    assert.equal(sellerCatalog.payload.products.filter((product) => product.pricing).length, 65);
    assert.equal(iphone.pricing.model, 'iPhone 17 Pro Max 1TB');
    assert.equal(iphone.pricing.prices['VIVO V'], 1119900);
    const iphone15 = catalog.payload.products.find((product) => product.variants[0].materialCode === 'DGAP20312000');
    assert.equal(iphone15.pricing.model, 'iPhone 15 256GB');
    assert.equal(iphone15.pricing.prices['PRÉ'], 479900);
    assert.equal(iphone15.pricing.prices['CONTROLE BTL'], 479900);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM device_price_profiles')).count), 42);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM device_price_values')).count), 378);
    assert.equal(Number((await row('SELECT COUNT(*) AS count FROM product_retail_prices')).count), 226);
    assert.equal((await row(`SELECT price_cents FROM product_retail_prices WHERE material_code = '22023768'`)).price_cents, 12900);
    assert.equal((await row(`SELECT price_cents FROM product_retail_prices WHERE material_code = '22023386'`)).price_cents, 6900);
    assert.equal((await row(`SELECT price_cents FROM product_retail_prices WHERE material_code = '22023388'`)).price_cents, 8900);
    assert.equal(Number((await row(`SELECT price_cents FROM product_retail_prices WHERE material_code = '22025161'`)).price_cents), 299900);
    assert.equal(Number((await row(`SELECT price_cents FROM product_retail_prices WHERE material_code = 'TGSA62254000'`)).price_cents), 329900);
    assert.equal(Number((await row(`SELECT price_cents FROM product_retail_prices WHERE material_code = 'YBSC001A4000'`)).price_cents), 0);
    const newMoto = catalog.payload.products.find((product) => product.variants[0].materialCode === 'TGMO611B2000');
    assert.equal(newMoto.pricing.model, 'Moto G47 5G 128GB');
    assert.equal(newMoto.pricing.prices['FAMILIA 3'], 104900);
    for (const code of ['TGSA61762000', 'TGSA61962000']) {
      const unlisted = catalog.payload.products.find((product) => product.variants[0].materialCode === code);
      assert.equal(unlisted.pricing, null);
      assert.equal(unlisted.retailPrice, null);
    }
    const fold8 = catalog.payload.products.find((product) => product.variants[0].materialCode === 'TGSA61962000');
    const blockedWithoutVerifiedPrice = await seller.request('/api/requests', {
      method: 'POST',
      body: { lines: [{ variantId: fold8.variants[0].id, quantity: 1 }], priceCategory: 'FAMILIA 3' },
    });
    assert.equal(blockedWithoutVerifiedPrice.status, 409);
    assert.match(blockedWithoutVerifiedPrice.payload.error, /preço não disponível/i);
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

  test('mantém os 378 preços de aparelhos iguais à auditoria integral', async () => {
    const [audit, source] = await Promise.all([
      readFile(new URL('../scripts/pricing-audit-2026-08-04.json', import.meta.url), 'utf8').then(JSON.parse),
      readFile(new URL('../scripts/pricing-source-2026-08-04.json', import.meta.url), 'utf8').then(JSON.parse),
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
      for (const category of audit.unavailableCategories) assert.equal(model.prices[category], null);
    }
    assert.equal(checked, 378);
    assert.equal(databasePrices.size, 378);
    assert.equal((await row(`SELECT value FROM system_state WHERE key = 'pricing_audit_value_count'`)).value, '378');
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

  test('agrupa aparelhos por modelo e relaciona somente capas compatíveis', async () => {
    const catalog = (await seller.request('/api/catalog')).payload.products;
    const groups = groupDeviceProducts(catalog);
    assert.equal(groups.reduce((sum, group) => sum + group.products.length, 0), 81);
    assert.equal(groups.length, 48);

    const iphoneProMax = groups.find((group) => group.familyName === 'APPLE IPHONE 17 PRO MAX');
    assert.deepEqual(iphoneProMax.memories, ['256GB', '512GB', '1TB']);
    assert.deepEqual(
      [...new Set(iphoneProMax.options.filter((option) => option.memory === '256GB').map((option) => option.color))],
      ['AZUL-MARINHO', 'LARANJA DEMO', 'PRATA'],
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
    const product = catalog.find((item) => item.variants[0].materialCode === 'DGAP27743000');
    const variant = product.variants[0];
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
    assert.equal(created.payload.request.items[0].materialCode, 'DGAP27743000');
    assert.equal(created.payload.request.items[0].productName, 'APPLE IPHONE 17 PRO MAX 256GB PRATA');
    assert.equal(created.payload.request.items[0].unitPriceCents, 959900);
    assert.equal(created.payload.request.items[0].lineTotalCents, 959900);
    assert.deepEqual(created.payload.request.pricing, {
      category: 'VIVO V', deviceTotalCents: 959900, orderTotalCents: 959900, tableDate: '2026-08-04',
    });
    assert.deepEqual(created.payload.request.items[0].serialNumbers, [expectedSerial.serial_number]);
    assert.equal((await manager.request(`/api/requests/${created.payload.request.id}/serial-options`)).status, 404);
    assert.equal((await manager.request(`/api/requests/${created.payload.request.id}/approve`, {
      method: 'POST', body: {},
    })).status, 404);

    const unavailable = (await seller.request('/api/catalog')).payload.products;
    assert.equal(unavailable.some((item) => item.variants[0].materialCode === 'DGAP27743000'), false);

    const sellerRequests = await seller.request('/api/requests');
    const released = sellerRequests.payload.requests.find((request) => request.id === created.payload.request.id);
    assert.deepEqual(released.items[0].serialNumbers, [expectedSerial.serial_number]);
    assert.equal((await row('SELECT status FROM inventory_serials WHERE id = ?', expectedSerial.id)).status, 'withdrawn');
    assert.equal(Number((await row(`SELECT quantity_on_hand FROM product_variants WHERE sku = 'DGAP27743000'`)).quantity_on_hand), 0);
    assert.equal(Number((await row(`
      SELECT COUNT(*) AS count FROM audit_logs
      WHERE action = 'request.auto_approved' AND entity_id = ?
    `, created.payload.request.id)).count), 1);

    const sellerCancellation = await seller.request(`/api/requests/${created.payload.request.id}/cancel`, {
      method: 'POST', body: {},
    });
    assert.equal(sellerCancellation.status, 409);
    assert.match(sellerCancellation.payload.error, /somente o gerente/i);

    const cancelled = await manager.request(`/api/requests/${created.payload.request.id}/cancel`, {
      method: 'POST', body: {},
    });
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.payload.request.status, 'cancelled');
    assert.match(cancelled.payload.request.decisionNote, /Cancelado pelo gerente/i);
    assert.deepEqual(cancelled.payload.request.items[0].serialNumbers, [expectedSerial.serial_number]);
    assert.equal((await row('SELECT status FROM inventory_serials WHERE id = ?', expectedSerial.id)).status, 'available');
    assert.equal(Number((await row(`SELECT quantity_on_hand FROM product_variants WHERE sku = 'DGAP27743000'`)).quantity_on_hand), 1);
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
    assert.equal(availableAgain.some((item) => item.variants[0].materialCode === 'DGAP27743000'), true);
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
    assert.equal(catalogResponse.payload.renova.boosts.length, 72);
    assert.equal(catalogResponse.payload.renova.boosts.find((boost) => boost.name === 'iPhone 17 Pro Max 256GB').bonusCents, 50000);
    assert.equal(catalogResponse.payload.renova.boosts.find((boost) => boost.name === 'Samsung Galaxy S26 Ultra 256GB').bonusCents, 120000);
    const tradeIn = catalogResponse.payload.renova.devices.find((device) => device.name === 'APPLE IPHONE 14 128GB');
    assert.deepEqual(tradeIn, {
      id: tradeIn.id,
      name: 'APPLE IPHONE 14 128GB',
      manufacturer: 'APPLE',
      productType: 'SMARTPHONE',
      goodCents: 121600,
      defectiveCents: 28000,
    });

    const device = catalogResponse.payload.products.find((product) => product.variants[0].materialCode === 'DGAP27743000');
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
    assert.equal(created.payload.request.pricing.deviceTotalCents, 959900);
    assert.equal(created.payload.request.pricing.orderTotalCents, 793200);
    assert.deepEqual(created.payload.request.pricing.renova, {
      usedDevice: 'APPLE IPHONE 14 128GB',
      condition: 'bom',
      voucherCents: 121600,
      manufacturerBonusCents: 50000,
      discountCents: 171600,
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
    assert.equal(Number(stored.renova_manufacturer_bonus_cents), 50000);
    assert.equal(Number(stored.renova_discount_cents), 171600);
    assert.equal(Number(stored.order_total_cents), 793200);

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
    assert.equal(approvedDevice.unitPriceCents, 779900);
    assert.equal(created.payload.request.items.find((item) => item.variantId === caseVariant.id).unitPriceCents, 12900);
    assert.equal(created.payload.request.items.find((item) => item.variantId === filmVariant.id).unitPriceCents, 6900);
    assert.equal(created.payload.request.pricing.deviceTotalCents, 779900);
    assert.equal(created.payload.request.pricing.orderTotalCents, 799700);
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
    assert.equal(Number((await row(`SELECT quantity_on_hand FROM product_variants WHERE sku = '22023768'`)).quantity_on_hand), 2);
    assert.equal(Number((await row(`SELECT quantity_on_hand FROM product_variants WHERE sku = '22023386'`)).quantity_on_hand), 41);
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

  test('cria estoquista com acesso exclusivo aos pedidos', async () => {
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

    const requests = await stocker.request('/api/requests?status=approved');
    assert.equal(requests.status, 200);
    assert.ok(requests.payload.requests.length > 0);
    assert.ok(requests.payload.requests.every((request) => request.status === 'approved'));
    assert.ok(requests.payload.requests.some((request) => request.items.some((item) => item.serialNumbers.length > 0)));
    assert.equal((await stocker.request(`/api/requests/${requests.payload.requests[0].id}/cancel`, {
      method: 'POST', body: {},
    })).status, 403);
    assert.equal((await stocker.request('/api/dashboard')).status, 403);
    assert.equal((await stocker.request('/api/catalog')).status, 403);
    assert.equal((await stocker.request('/api/users')).status, 403);
    assert.equal((await stocker.request('/api/audit')).status, 403);
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
    const [appSource, groupsSource, indexSource, packageSource, stylesSource] = await Promise.all([
      readFile(new URL('../public/app.js', import.meta.url), 'utf8'),
      readFile(new URL('../public/catalog-groups.js', import.meta.url), 'utf8'),
      readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
      readFile(new URL('../package.json', import.meta.url), 'utf8'),
      readFile(new URL('../public/styles.css', import.meta.url), 'utf8'),
    ]);
    assert.doesNotMatch(appSource, /BarcodeDetector|ZXing|scan-device|\/api\/devices/i);
    assert.doesNotMatch(appSource, /[▯▢◇♫▰▣ϟ⌁◆♙◷⇄⌂☰↪×]/);
    assert.doesNotMatch(indexSource, /zxing|vendor\/zxing/i);
    assert.doesNotMatch(packageSource, /@zxing/i);
    assert.doesNotMatch(stylesSource, /@import|url\(\s*['"]?https?:/i);
    assert.equal(JSON.parse(packageSource).version, '6.3.0');
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
    assert.match(appSource, /state\.user\.role === 'stocker' \? teamBreakSchedule\('dashboard'\)/);
    assert.match(appSource, /teamBreakSchedule\('alignment'\)/);
    assert.match(stylesSource, /\.team-schedule/);
    assert.match(stylesSource, /\.team-schedule__bar/);
    assert.match(stylesSource, /\.management-dashboard-grid/);
    assert.match(stylesSource, /\.requests-list--stocker/);
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
    assert.match(appSource, /state\.user\.role !== 'manager'[\s\S]*\['alignment', 'users', 'audit'\]/i);
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
    assert.match(indexSource, /styles\.css\?v=6\.3\.0/);
    assert.match(indexSource, /app\.js\?v=6\.3\.0/);
    for (const label of ['Aparelhos', 'Capas', 'Películas', 'Caixas de som', 'Notebooks', 'TVs', 'Carregadores', 'Cabos', 'Acessórios diversos']) {
      assert.match(appSource, new RegExp(label, 'i'));
    }

    const page = await mf.dispatchFetch('https://controleestoque.app.br/');
    const script = await mf.dispatchFetch('https://controleestoque.app.br/app.js?v=6.3.0');
    const groupsScript = await mf.dispatchFetch('https://controleestoque.app.br/catalog-groups.js');
    const alignmentImage = await mf.dispatchFetch('https://controleestoque.app.br/alignment/atitudes-profissionais.webp');
    assert.equal(page.headers.get('cache-control'), 'no-store');
    assert.equal(script.headers.get('cache-control'), 'no-cache');
    assert.equal(groupsScript.headers.get('cache-control'), 'no-cache');
    assert.equal(alignmentImage.status, 200);
  });
});
