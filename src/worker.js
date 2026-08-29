import {
  clearSessionCookie,
  hashPassword,
  newSessionToken,
  parseCookies,
  sessionCookie,
  sessionExpiry,
  sha256Hex,
  verifyPassword,
} from './security.js';

const DUMMY_PASSWORD_HASH = 'pbkdf2-sha256$75000$9GblqRnFBioalVR4R6wWGg$3kcpF84pBCcKWTKnCz4vXLqZbA1Rq9R6hhTdeg0UImU';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const REQUEST_STATUSES = new Set(['pending', 'approved', 'rejected', 'cancelled']);
const AUTOMATIC_SERIAL_CLUSTERS = new Set(['cases', 'screen_protectors']);
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
const PRICE_CATEGORY_SET = new Set(PRICE_CATEGORIES);
const NEWS_CATEGORIES = new Set(['promotion', 'notice', 'update']);
const CHIP_LIMIT_PER_SELLER = 10;
const DASHBOARD_CLUSTER_ORDER = [
  'devices',
  'cases',
  'screen_protectors',
  'speakers',
  'notebooks',
  'tvs',
  'chargers',
  'cables',
  'misc',
];
function normalizeRenovaModelKey(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\b5G\b/g, '')
    .replaceAll('+', ' PLUS ')
    .replace(/[^A-Z0-9]+/g, '');
}

function manufacturerRenovaBonusCents(productName = '', boostRows = []) {
  const productKey = normalizeRenovaModelKey(productName);
  const matchingBoost = [...boostRows]
    .filter((row) => productKey.includes(String(row.match_key || row.matchKey || '')))
    .sort((left, right) => String(right.match_key || right.matchKey || '').length - String(left.match_key || left.matchKey || '').length)[0];
  return matchingBoost ? Number(matchingBoost.bonus_cents ?? matchingBoost.bonusCents ?? 0) : 0;
}

class HttpError extends Error {
  constructor(status, message, fields = undefined) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function securityHeaders(headers = {}) {
  return {
    'Content-Security-Policy': "default-src 'self'; base-uri 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data: https:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'",
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    ...headers,
  };
}

function json(payload, status = 200, headers = {}) {
  return new Response(payload === null ? null : JSON.stringify(payload), {
    status,
    headers: securityHeaders({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    }),
  });
}

function noContent(headers = {}) {
  return new Response(null, { status: 204, headers: securityHeaders({ 'Cache-Control': 'no-store', ...headers }) });
}

function secureAssetResponse(response, request) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders())) headers.set(name, value);
  const contentType = headers.get('Content-Type') || '';
  const pathname = new URL(request.url).pathname.toLowerCase();
  const filename = pathname.split('/').pop() || '';
  const isHtml = contentType.includes('text/html')
    || pathname.endsWith('/')
    || pathname.endsWith('.html')
    || !filename.includes('.');
  const isCode = contentType.includes('text/css')
    || contentType.includes('javascript')
    || /\.(?:css|m?js)$/.test(pathname);
  if (isHtml) headers.set('Cache-Control', 'no-store');
  else if (isCode) headers.set('Cache-Control', 'no-cache');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function readJson(request) {
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > 200_000) throw new HttpError(413, 'Os dados enviados são muito grandes.');
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'Envie os dados no formato correto.');
  }
}

function validateFields(input, rules) {
  const data = {};
  const fields = {};
  for (const [name, rule] of Object.entries(rules)) {
    const result = rule(input?.[name]);
    if (result.error) fields[name] = result.error;
    else data[name] = result.value;
  }
  if (Object.keys(fields).length) throw new HttpError(400, 'Verifique os dados informados.', fields);
  return data;
}

function textRule(label, { min = 1, max = 200, optional = false } = {}) {
  return (value) => {
    const text = typeof value === 'string' ? value.trim() : '';
    if (!text && optional) return { value: '' };
    if (text.length < min) return { error: `Informe ${label}.` };
    if (text.length > max) return { error: `${label} deve ter no máximo ${max} caracteres.` };
    return { value: text };
  };
}

function emailRule(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) return { error: 'Informe um e-mail válido.' };
  return { value: email };
}

function employeeReRule(value) {
  const employeeRe = typeof value === 'string' ? value.trim() : '';
  if (!employeeRe) return { value: '' };
  if (!/^\d{8}$/.test(employeeRe)) return { error: 'O RE deve conter exatamente 8 números.' };
  return { value: employeeRe };
}

function passwordRule(value) {
  if (typeof value !== 'string' || value.length < 8 || value.length > 128) return { error: 'A senha deve ter pelo menos 8 caracteres.' };
  return { value };
}

function optionalPasswordRule(value) {
  if (value === undefined || value === null || value === '') return { value: '' };
  return passwordRule(value);
}

function roleRule(value) {
  if (!['seller', 'manager', 'stocker'].includes(value)) return { error: 'Selecione um perfil válido.' };
  return { value };
}

function booleanRule(value) {
  if (typeof value !== 'boolean') return { error: 'Informe um status válido.' };
  return { value };
}

function newsCategoryRule(value) {
  const category = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!NEWS_CATEGORIES.has(category)) return { error: 'Selecione um tipo de notícia válido.' };
  return { value: category };
}

function materialCodeRule(value) {
  const materialCode = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!materialCode || materialCode.length > 40 || !/^[A-Z0-9._/-]+$/.test(materialCode)) {
    return { error: 'Informe um código material válido.' };
  }
  return { value: materialCode };
}

function iccidSuffixRule(value) {
  const suffix = typeof value === 'string' ? value.trim() : '';
  if (!/^\d{6}$/.test(suffix)) return { error: 'Informe exatamente os 6 últimos dígitos do ICCID.' };
  return { value: suffix };
}

function imeiRule(value, { optional = false } = {}) {
  const imei = typeof value === 'string' ? value.replace(/\D/g, '') : '';
  if (!imei && optional) return { value: '' };
  if (!/^\d{15}$/.test(imei)) return { error: 'Informe um IMEI válido com exatamente 15 dígitos.' };
  return { value: imei };
}

function phoneNumberRule(value) {
  const source = typeof value === 'string' ? value.trim() : '';
  if (!source || /[^0-9()+\s-]/.test(source)) return { error: 'Informe o número cadastrado no chip.' };
  const phoneNumber = source.replace(/\D/g, '');
  if (phoneNumber.length < 10 || phoneNumber.length > 13) {
    return { error: 'Informe um telefone com DDD válido.' };
  }
  return { value: phoneNumber };
}

function todayInSaoPaulo() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function saleDateRule(value) {
  const soldOn = typeof value === 'string' ? value.trim() : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(soldOn)) return { error: 'Informe a data da venda.' };
  const parsed = new Date(`${soldOn}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== soldOn) {
    return { error: 'Informe uma data de venda válida.' };
  }
  if (soldOn > todayInSaoPaulo()) return { error: 'A data da venda não pode estar no futuro.' };
  return { value: soldOn };
}

function renovaDateRule(label, { optional = false } = {}) {
  return (value) => {
    const date = typeof value === 'string' ? value.trim() : '';
    if (!date && optional) return { value: '' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: `Informe ${label}.` };
    const parsed = new Date(`${date}T12:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      return { error: `Informe ${label} válida.` };
    }
    if (date > todayInSaoPaulo()) {
      return { error: `${label[0].toUpperCase()}${label.slice(1)} não pode estar no futuro.` };
    }
    return { value: date };
  };
}

function positiveIdRule(label) {
  return (value) => {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) return { error: `Selecione ${label}.` };
    return { value: id };
  };
}

function chipInventorySerialIdsRule(value) {
  if (!Array.isArray(value) || !value.length || value.length > CHIP_LIMIT_PER_SELLER) {
    return { error: `Adicione de 1 a ${CHIP_LIMIT_PER_SELLER} chips ao lote.` };
  }
  const inventorySerialIds = value.map(Number);
  if (inventorySerialIds.some((id) => !Number.isInteger(id) || id <= 0)) {
    return { error: 'Revise os ICCIDs selecionados para o lote.' };
  }
  if (new Set(inventorySerialIds).size !== inventorySerialIds.length) {
    return { error: 'O mesmo ICCID não pode aparecer duas vezes no lote.' };
  }
  return { value: inventorySerialIds };
}

function quantityDeltaRule(value) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity === 0 || Math.abs(quantity) > 100000) {
    return { error: 'Informe uma quantidade válida, diferente de zero.' };
  }
  return { value: quantity };
}

function requestLinesRule(value) {
  if (!Array.isArray(value) || !value.length || value.length > 30) {
    return { error: 'Adicione de 1 a 30 variações ao pedido.' };
  }
  const combined = new Map();
  for (const line of value) {
    const variantId = Number(line?.variantId);
    const quantity = Number(line?.quantity);
    if (!Number.isInteger(variantId) || variantId <= 0 || !Number.isInteger(quantity) || quantity <= 0 || quantity > 50) {
      return { error: 'Revise as variações e quantidades do pedido.' };
    }
    combined.set(variantId, (combined.get(variantId) || 0) + quantity);
  }
  const lines = [...combined].map(([variantId, quantity]) => ({ variantId, quantity }));
  if (lines.some((line) => line.quantity > 50) || lines.reduce((total, line) => total + line.quantity, 0) > 100) {
    return { error: 'Cada pedido pode ter no máximo 100 itens.' };
  }
  return { value: lines };
}

function effectiveRole(user) {
  return user?.access_profile === 'stocker' ? 'stocker' : user?.role;
}

function storedRole(role) {
  return role === 'stocker'
    ? { role: 'seller', accessProfile: 'stocker' }
    : { role, accessProfile: 'default' };
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    employeeRe: user.employee_re || '',
    role: effectiveRole(user),
    active: Boolean(user.active),
    mustChangePassword: Boolean(user.must_change_password),
    createdAt: user.created_at,
  };
}

function parsePresets(value) {
  try {
    const parsed = JSON.parse(value || '{}');
    return {
      option1: Array.isArray(parsed.option1) ? parsed.option1 : [],
      option2: Array.isArray(parsed.option2) ? parsed.option2 : [],
      option3: Array.isArray(parsed.option3) ? parsed.option3 : [],
    };
  } catch {
    return { option1: [], option2: [], option3: [] };
  }
}

function parseIncomingDeposits(value) {
  try {
    const parsed = JSON.parse(value || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed)
      .map(([deposit, quantity]) => [String(deposit).trim().toUpperCase(), Number(quantity)])
      .filter(([deposit, quantity]) => deposit && Number.isInteger(quantity) && quantity > 0));
  } catch {
    return {};
  }
}

function auditStatement(env, actorId, action, entityType, entityId, details = {}) {
  return env.DB.prepare(`
    INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details_json)
    VALUES (?, ?, ?, ?, ?)
  `).bind(actorId ?? null, action, entityType, entityId == null ? null : String(entityId), JSON.stringify(details));
}

async function createSession(env, userId) {
  const token = newSessionToken();
  const tokenHash = await sha256Hex(token);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(nowIso()),
    env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(tokenHash, userId, sessionExpiry()),
  ]);
  return token;
}

async function deleteSession(env, request) {
  const token = parseCookies(request).estoque_session;
  if (!token) return;
  await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256Hex(token)).run();
}

async function authenticatedUser(env, request) {
  const token = parseCookies(request).estoque_session;
  if (!token) throw new HttpError(401, 'Faça login para continuar.');
  const user = await env.DB.prepare(`
    SELECT u.*
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1 AND u.deleted_at IS NULL
  `).bind(await sha256Hex(token), nowIso()).first();
  if (!user) throw new HttpError(401, 'Sua sessão expirou. Entre novamente.');
  return { ...user, role: effectiveRole(user) };
}

function requireRole(user, role) {
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(user.role)) throw new HttpError(403, 'Você não tem permissão para realizar esta ação.');
}

function validateRequestSource(request) {
  if (!MUTATING_METHODS.has(request.method)) return;
  if (request.headers.get('X-Requested-With') !== 'estoque-web') throw new HttpError(403, 'Requisição não autorizada.');
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) throw new HttpError(403, 'Origem não autorizada.');
}

function clientKey(request) {
  return (request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'local').split(',')[0].trim().slice(0, 80);
}

async function enforceLoginLimit(env, key) {
  const attempt = await env.DB.prepare('SELECT * FROM login_attempts WHERE client_key = ?').bind(key).first();
  if (attempt?.blocked_until && attempt.blocked_until > nowIso()) {
    throw new HttpError(429, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.');
  }
}

async function recordLoginFailure(env, key) {
  const current = await env.DB.prepare('SELECT * FROM login_attempts WHERE client_key = ?').bind(key).first();
  const now = new Date();
  const windowStart = current ? new Date(current.window_started_at) : null;
  const expiredWindow = !windowStart || now.getTime() - windowStart.getTime() > 15 * 60 * 1000;
  const failedCount = expiredWindow ? 1 : Number(current.failed_count) + 1;
  const blockedUntil = failedCount >= 10 ? new Date(now.getTime() + 15 * 60 * 1000).toISOString() : null;
  await env.DB.prepare(`
    INSERT INTO login_attempts (client_key, failed_count, window_started_at, blocked_until)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(client_key) DO UPDATE SET
      failed_count = excluded.failed_count,
      window_started_at = excluded.window_started_at,
      blocked_until = excluded.blocked_until
  `).bind(key, failedCount, expiredWindow ? now.toISOString() : current.window_started_at, blockedUntil).run();
}

async function clearLoginFailures(env, key) {
  await env.DB.prepare('DELETE FROM login_attempts WHERE client_key = ?').bind(key).run();
}

async function listRequests(env, user, status = '', limit = 100) {
  const conditions = [];
  const params = [];
  if (user.role === 'seller') {
    conditions.push('r.seller_id = ?');
    params.push(user.id);
  }
  if (REQUEST_STATUSES.has(status)) {
    conditions.push('r.status = ?');
    params.push(status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
  const query = env.DB.prepare(`
    SELECT r.*, seller.name AS seller_name, seller.email AS seller_email,
           decider.name AS decided_by_name
    FROM withdrawal_requests r
    JOIN users seller ON seller.id = r.seller_id
    LEFT JOIN users decider ON decider.id = r.decided_by
    ${where}
    ORDER BY r.created_at DESC
    LIMIT ?
  `).bind(...params, safeLimit);
  const requests = (await query.all()).results || [];
  if (!requests.length) return [];

  const placeholders = requests.map(() => '?').join(',');
  const requestIds = requests.map((item) => item.id);
  const [quantityResult, serialResult] = await env.DB.batch([
    env.DB.prepare(`
      SELECT i.*, COALESCE(p.cluster, 'misc') AS product_cluster
      FROM withdrawal_quantity_items i
      LEFT JOIN product_variants v ON v.id = i.variant_id
      LEFT JOIN products p ON p.id = v.product_id
      WHERE i.request_id IN (${placeholders})
      ORDER BY i.request_id, i.product_name_snapshot COLLATE NOCASE
    `).bind(...requestIds),
    env.DB.prepare(`
      SELECT request_id, variant_id, serial_number_snapshot
      FROM request_serial_assignments
      WHERE request_id IN (${placeholders})
      UNION ALL
      SELECT request_id, variant_id, serial_number_snapshot
      FROM cancelled_request_serials
      WHERE request_id IN (${placeholders})
      ORDER BY request_id, variant_id, serial_number_snapshot COLLATE NOCASE
    `).bind(...requestIds, ...requestIds),
  ]);
  const quantityRows = quantityResult.results || [];
  const serialsByItem = new Map();
  for (const serial of serialResult.results || []) {
    const key = `${serial.request_id}:${serial.variant_id}`;
    if (!serialsByItem.has(key)) serialsByItem.set(key, []);
    serialsByItem.get(key).push(serial.serial_number_snapshot);
  }
  const itemsByRequest = new Map();
  for (const item of quantityRows) {
    if (!itemsByRequest.has(item.request_id)) itemsByRequest.set(item.request_id, []);
    itemsByRequest.get(item.request_id).push({
      kind: 'quantity',
      variantId: item.variant_id,
      productName: item.product_name_snapshot,
      model: item.product_name_snapshot,
      materialCode: item.material_code_snapshot || '',
      cluster: item.product_cluster || 'misc',
      automaticSerial: AUTOMATIC_SERIAL_CLUSTERS.has(item.product_cluster),
      quantity: Number(item.quantity),
      unitPriceCents: item.unit_price_cents == null ? null : Number(item.unit_price_cents),
      lineTotalCents: item.unit_price_cents == null ? null : Number(item.unit_price_cents) * Number(item.quantity),
      priceCategory: item.price_category_snapshot || '',
      priceType: item.price_type_snapshot || '',
      priceTableDate: item.price_table_date_snapshot || '',
      options: [],
      serialNumbers: serialsByItem.get(`${item.request_id}:${item.variant_id}`) || [],
    });
  }
  return requests.map((requestRow) => {
    const revealSerials = user.role === 'manager' || requestRow.status === 'approved';
    const items = (itemsByRequest.get(requestRow.id) || [])
      .map((item) => ({
        ...item,
        serialNumbers: revealSerials && !item.automaticSerial ? item.serialNumbers : [],
      }))
      .sort((a, b) => a.productName.localeCompare(b.productName, 'pt-BR'));
    return {
      id: requestRow.id,
      status: requestRow.status,
      notes: requestRow.notes || '',
      decisionNote: requestRow.decision_note || '',
      createdAt: requestRow.created_at,
      decidedAt: requestRow.decided_at,
      seller: { id: requestRow.seller_id, name: requestRow.seller_name, email: requestRow.seller_email },
      decidedByName: requestRow.decided_by_name,
      pricing: requestRow.order_total_cents == null && requestRow.device_total_cents == null ? null : {
        category: requestRow.price_category || '',
        deviceTotalCents: requestRow.device_total_cents == null ? 0 : Number(requestRow.device_total_cents),
        orderTotalCents: Number(requestRow.order_total_cents ?? requestRow.device_total_cents),
        tableDate: requestRow.price_table_date || '',
        ...(requestRow.renova_enabled ? { renova: {
          usedDevice: requestRow.renova_used_device || '',
          condition: requestRow.renova_condition || 'bom',
          voucherCents: Number(requestRow.renova_voucher_cents || 0),
          manufacturerBonusCents: Number(requestRow.renova_manufacturer_bonus_cents || 0),
          discountCents: Number(requestRow.renova_discount_cents || 0),
        } } : {}),
      },
      items,
    };
  });
}

async function setupStatus(env) {
  const initialized = await env.DB.prepare(`SELECT value FROM system_state WHERE key = 'initialized'`).first();
  return json({ needsSetup: !initialized });
}

async function initialSetup(request, env) {
  const initialized = await env.DB.prepare(`SELECT value FROM system_state WHERE key = 'initialized'`).first();
  if (initialized) throw new HttpError(409, 'A configuração inicial já foi realizada.');
  const input = await readJson(request);
  const data = validateFields(input, {
    name: textRule('o nome completo', { min: 2, max: 100 }),
    email: emailRule,
    password: passwordRule,
  });
  const passwordHash = await hashPassword(data.password);
  try {
    const results = await env.DB.batch([
      env.DB.prepare(`INSERT INTO system_state (key, value) VALUES ('initialized', '1')`),
      env.DB.prepare(`INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'manager')`)
        .bind(data.name, data.email, passwordHash),
    ]);
    const userId = Number(results[1].meta.last_row_id);
    await env.DB.batch([
      auditStatement(env, userId, 'manager.initial_created', 'user', userId, { email: data.email }),
    ]);
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    const token = await createSession(env, userId);
    return json({ user: publicUser(user) }, 201, { 'Set-Cookie': sessionCookie(token) });
  } catch (error) {
    if (String(error.message).includes('system_state.key')) throw new HttpError(409, 'A configuração inicial já foi realizada.');
    if (String(error.message).includes('users.email')) throw new HttpError(409, 'Este e-mail já está em uso.');
    throw error;
  }
}

async function login(request, env) {
  const key = clientKey(request);
  await enforceLoginLimit(env, key);
  const input = await readJson(request);
  const identifier = typeof (input.identifier ?? input.email) === 'string' ? (input.identifier ?? input.email).trim() : '';
  const emailResult = identifier.includes('@') ? emailRule(identifier) : null;
  if ((!emailResult || emailResult.error) && !/^\d{8}$/.test(identifier)) {
    throw new HttpError(400, 'Informe um e-mail ou RE válido.', { identifier: 'Informe um e-mail ou RE válido.' });
  }
  const password = typeof input.password === 'string' ? input.password.slice(0, 128) : '';
  const user = await env.DB.prepare(`
    SELECT * FROM users
    WHERE deleted_at IS NULL
      AND (email = ? COLLATE NOCASE OR employee_re = ?)
    LIMIT 1
  `).bind(emailResult?.value || '', identifier).first();
  const valid = await verifyPassword(password, user?.password_hash || DUMMY_PASSWORD_HASH);
  if (!user?.active || !valid) {
    await recordLoginFailure(env, key);
    throw new HttpError(401, 'E-mail, RE ou senha incorretos.');
  }
  await clearLoginFailures(env, key);
  const token = await createSession(env, user.id);
  await env.DB.batch([auditStatement(env, user.id, 'auth.login', 'user', user.id, {})]);
  return json({ user: publicUser(user) }, 200, { 'Set-Cookie': sessionCookie(token) });
}

async function changePassword(request, env, user) {
  const input = await readJson(request);
  const rules = { newPassword: passwordRule };
  if (user.role !== 'manager') {
    rules.currentPassword = (value) => ({ value: typeof value === 'string' ? value.slice(0, 128) : '' });
  }
  const data = validateFields(input, rules);
  if (user.role !== 'manager' && !await verifyPassword(data.currentPassword, user.password_hash)) {
    throw new HttpError(400, 'A senha atual está incorreta.');
  }
  const passwordHash = await hashPassword(data.newPassword);
  const token = newSessionToken();
  const tokenHash = await sha256Hex(token);
  await env.DB.batch([
    env.DB.prepare(`UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?`)
      .bind(passwordHash, nowIso(), user.id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
    env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
      .bind(tokenHash, user.id, sessionExpiry()),
    auditStatement(env, user.id, 'user.password_changed', 'user', user.id, {}),
  ]);
  return json({ message: 'Senha alterada com sucesso.' }, 200, { 'Set-Cookie': sessionCookie(token) });
}

async function catalogData(env, user) {
  const [productsResult, variantsResult, pricesResult] = await env.DB.batch([
    env.DB.prepare(`
      SELECT p.*,
        (
          SELECT rule.price_key
          FROM device_price_match_rules rule
          WHERE UPPER(COALESCE(p.display_name, p.name)) LIKE rule.match_pattern COLLATE NOCASE
          ORDER BY rule.priority, length(rule.match_pattern) DESC
          LIMIT 1
        ) AS price_key
      FROM products p
      WHERE p.active = 1
      ORDER BY p.sort_order, p.brand COLLATE NOCASE, p.name COLLATE NOCASE
    `),
    env.DB.prepare(`
      SELECT v.*,
        retail.price_cents AS retail_price_cents,
        retail.price_kind AS retail_price_kind,
        retail.table_date AS retail_price_table_date,
        retail.source_label AS retail_price_source,
        retail.reference_name AS retail_price_reference,
        COALESCE((SELECT SUM(r.quantity) FROM active_quantity_reservations r WHERE r.variant_id = v.id), 0) AS quantity_reserved,
        COALESCE((
          SELECT COUNT(*)
          FROM chips chip
          JOIN inventory_serials chip_serial ON chip_serial.id = chip.inventory_serial_id
          WHERE chip_serial.variant_id = v.id
            AND chip.active = 1
            AND chip.status = 'available'
        ), 0) AS quantity_chip_allocated,
        COALESCE(incoming.quantity, 0) AS quantity_incoming,
        incoming.deposits_json AS incoming_deposits_json,
        COALESCE((
          SELECT SUM(i.quantity)
          FROM withdrawal_quantity_items i
          JOIN withdrawal_requests r ON r.id = i.request_id AND r.status = 'approved'
          WHERE i.variant_id = v.id
        ), 0) AS quantity_withdrawn
      FROM product_variants v
      LEFT JOIN product_retail_prices retail ON retail.material_code = v.sku COLLATE NOCASE
      LEFT JOIN incoming_inventory incoming ON incoming.variant_id = v.id
      WHERE v.active = 1
      ORDER BY v.product_id, v.option1_value COLLATE NOCASE,
               v.option2_value COLLATE NOCASE, v.option3_value COLLATE NOCASE
    `),
    env.DB.prepare(`
      SELECT profile.price_key, profile.display_name, profile.table_date, profile.source_label,
             value.category, value.price_cents
      FROM device_price_profiles profile
      JOIN device_price_values value ON value.price_key = profile.price_key
      ORDER BY profile.display_name COLLATE NOCASE, value.price_cents DESC
    `),
  ]);
  const pricingByKey = new Map();
  for (const row of pricesResult.results || []) {
    if (!pricingByKey.has(row.price_key)) {
      pricingByKey.set(row.price_key, {
        key: row.price_key,
        model: row.display_name,
        tableDate: row.table_date,
        source: row.source_label,
        prices: {},
      });
    }
    pricingByKey.get(row.price_key).prices[row.category] = Number(row.price_cents);
  }
  const variantsByProduct = new Map();
  for (const row of variantsResult.results || []) {
    const available = Math.max(0, Number(row.quantity_on_hand)
      - Number(row.quantity_reserved)
      - Number(row.quantity_chip_allocated));
    if (user.role === 'seller' && available <= 0) continue;
    const variant = {
      id: row.id,
      productId: row.product_id,
      stockMode: 'quantity',
      sku: row.sku || '',
      materialCode: row.sku || '',
      serialTracked: Boolean(row.serial_tracking),
      option1Value: row.option1_value,
      option2Value: row.option2_value,
      option3Value: row.option3_value,
      available,
      reserved: Number(row.quantity_reserved),
      allocatedToSellers: Number(row.quantity_chip_allocated),
      withdrawn: Number(row.quantity_withdrawn),
      onHand: Number(row.quantity_on_hand),
      incoming: user.role === 'seller' ? 0 : Number(row.quantity_incoming),
      incomingDeposits: user.role === 'seller' ? {} : parseIncomingDeposits(row.incoming_deposits_json),
      retailPrice: row.retail_price_cents == null ? null : {
        priceCents: Number(row.retail_price_cents),
        kind: row.retail_price_kind,
        tableDate: row.retail_price_table_date,
        source: row.retail_price_source,
        referenceName: row.retail_price_reference,
      },
    };
    if (!variantsByProduct.has(row.product_id)) variantsByProduct.set(row.product_id, []);
    variantsByProduct.get(row.product_id).push(variant);
  }
  const products = [];
  for (const row of productsResult.results || []) {
    const variants = variantsByProduct.get(row.id) || [];
    if (user.role === 'seller' && !variants.length) continue;
    const retailPrices = variants.map((variant) => variant.retailPrice).filter(Boolean);
    const uniformRetailPrice = retailPrices.length && retailPrices.every((price) => (
      price.priceCents === retailPrices[0].priceCents && price.kind === retailPrices[0].kind
    )) ? retailPrices[0] : null;
    products.push({
      id: row.id,
      name: row.display_name || row.name,
      imagem_url: typeof row.imagem_url === 'string' && row.imagem_url.trim()
        ? row.imagem_url.trim()
        : null,
      technicalName: row.technical_name || '',
      brand: row.brand,
      category: row.category,
      cluster: row.cluster || 'misc',
      optionLabels: [row.option1_label, row.option2_label, row.option3_label],
      presets: parsePresets(row.presets_json),
      sortOrder: row.sort_order,
      pricing: pricingByKey.get(row.price_key) || null,
      retailPrice: uniformRetailPrice,
      variants,
      available: variants.reduce((sum, variant) => sum + variant.available, 0),
      reserved: variants.reduce((sum, variant) => sum + variant.reserved, 0),
      allocatedToSellers: variants.reduce((sum, variant) => sum + variant.allocatedToSellers, 0),
      withdrawn: variants.reduce((sum, variant) => sum + variant.withdrawn, 0),
      onHand: variants.reduce((sum, variant) => sum + variant.onHand, 0),
      incoming: variants.reduce((sum, variant) => sum + variant.incoming, 0),
      incomingDeposits: variants.reduce((deposits, variant) => {
        for (const [deposit, quantity] of Object.entries(variant.incomingDeposits)) {
          deposits[deposit] = Number(deposits[deposit] || 0) + Number(quantity);
        }
        return deposits;
      }, {}),
    });
  }
  return products;
}

async function listCatalog(env, user) {
  const [products, stateRows, renovaRows, renovaBoostRows] = await Promise.all([
    catalogData(env, user),
    env.DB.prepare(`
      SELECT key, value FROM system_state
      WHERE key IN ('pricing_table_date', 'pricing_table_source', 'retail_pricing_table_date', 'retail_pricing_table_source')
    `).all(),
    env.DB.prepare(`
      SELECT id, device_name, manufacturer, product_type, good_cents, defective_cents, table_date
      FROM renova_trade_in_values
      WHERE active = 1
      ORDER BY manufacturer COLLATE NOCASE, device_name COLLATE NOCASE
    `).all(),
    env.DB.prepare(`
      SELECT id, manufacturer, device_name, match_key, bonus_cents, starts_on, ends_on, source
      FROM renova_manufacturer_boosts
      WHERE active = 1
        AND starts_on <= date('now', '-3 hours')
        AND ends_on >= date('now', '-3 hours')
      ORDER BY LENGTH(match_key) DESC, device_name COLLATE NOCASE
    `).all(),
  ]);
  const pricingState = Object.fromEntries((stateRows.results || []).map((row) => [row.key, row.value]));
  const renovaDevices = (renovaRows.results || []).map((row) => ({
    id: Number(row.id),
    name: row.device_name,
    manufacturer: row.manufacturer,
    productType: row.product_type,
    goodCents: Number(row.good_cents),
    defectiveCents: Number(row.defective_cents),
  }));
  const renovaBoosts = (renovaBoostRows.results || []).map((row) => ({
    id: Number(row.id),
    manufacturer: row.manufacturer,
    name: row.device_name,
    matchKey: row.match_key,
    bonusCents: Number(row.bonus_cents),
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    source: row.source,
  }));
  return json({
    products,
    pricing: {
      categories: PRICE_CATEGORIES,
      tableDate: pricingState.pricing_table_date || '',
      source: pricingState.pricing_table_source || '',
      retailTableDate: pricingState.retail_pricing_table_date || '',
      retailSource: pricingState.retail_pricing_table_source || '',
    },
    renova: {
      tableDate: renovaRows.results?.[0]?.table_date || '',
      devices: renovaDevices,
      boosts: renovaBoosts,
    },
  });
}

function managerInventoryGroups(products) {
  const grouped = new Map(DASHBOARD_CLUSTER_ORDER.map((cluster) => [cluster, []]));
  for (const product of products) {
    const cluster = grouped.has(product.cluster) ? product.cluster : 'misc';
    grouped.get(cluster).push(product);
  }

  return DASHBOARD_CLUSTER_ORDER.map((cluster) => {
    const groupProducts = grouped.get(cluster);
    const totals = groupProducts.reduce((summary, product) => ({
      onHand: summary.onHand + product.onHand,
    available: summary.available + product.available,
    reserved: summary.reserved + product.reserved,
    allocatedToSellers: summary.allocatedToSellers + product.allocatedToSellers,
    incoming: summary.incoming + product.incoming,
    }), { onHand: 0, available: 0, reserved: 0, allocatedToSellers: 0, incoming: 0 });
    const topProducts = [...groupProducts]
      .sort((left, right) => right.available - left.available
        || left.name.localeCompare(right.name, 'pt-BR'))
      .slice(0, 3)
      .map((product) => ({
        id: product.id,
        name: product.name,
        brand: product.brand || '',
        materialCode: product.variants[0]?.materialCode || '',
        onHand: product.onHand,
        available: product.available,
        reserved: product.reserved,
      }));

    return {
      cluster,
      materialCount: groupProducts.length,
      availableMaterials: groupProducts.filter((product) => product.available > 0).length,
      lowStockCount: groupProducts.filter((product) => product.available > 0 && product.available <= 2).length,
      outOfStockCount: groupProducts.filter((product) => product.available === 0 && product.incoming === 0).length,
      incomingMaterialCount: groupProducts.filter((product) => product.incoming > 0).length,
      ...totals,
      topProducts,
    };
  }).filter((group) => group.materialCount > 0);
}

function sellerInventoryGroups(products) {
  const grouped = new Map(DASHBOARD_CLUSTER_ORDER.map((cluster) => [cluster, []]));
  for (const product of products) {
    if (product.available <= 0 && product.incoming <= 0) continue;
    const cluster = grouped.has(product.cluster) ? product.cluster : 'misc';
    grouped.get(cluster).push(product);
  }

  return DASHBOARD_CLUSTER_ORDER.map((cluster) => {
    const groupProducts = grouped.get(cluster);
    return {
      cluster,
      materialCount: groupProducts.filter((product) => product.available > 0).length,
      available: groupProducts.reduce((sum, product) => sum + product.available, 0),
      incomingMaterialCount: groupProducts.filter((product) => product.incoming > 0).length,
      incoming: groupProducts.reduce((sum, product) => sum + product.incoming, 0),
      topProducts: [...groupProducts].filter((product) => product.available > 0)
        .sort((left, right) => right.available - left.available
          || left.name.localeCompare(right.name, 'pt-BR'))
        .slice(0, 3)
        .map((product) => ({
          id: product.id,
          name: product.name,
          brand: product.brand || '',
          materialCode: product.variants[0]?.materialCode || '',
          available: product.available,
        })),
    };
  }).filter((group) => group.materialCount > 0 || group.incomingMaterialCount > 0);
}

function incomingProductSummaries(products) {
  return products
    .filter((product) => product.incoming > 0)
    .sort((left, right) => right.incoming - left.incoming
      || left.name.localeCompare(right.name, 'pt-BR'))
    .map((product) => ({
      id: product.id,
      name: product.name,
      materialCode: product.variants[0]?.materialCode || '',
      cluster: product.cluster,
      incoming: product.incoming,
      incomingDeposits: product.incomingDeposits,
    }));
}

function managerDeviceProducts(products) {
  return products.filter((product) => product.cluster === 'devices').map((product) => ({
    id: product.id,
    name: product.name,
    brand: product.brand || '',
    cluster: product.cluster,
    imagem_url: product.imagem_url || '',
    available: Number(product.available || 0),
    incoming: Number(product.incoming || 0),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      materialCode: variant.materialCode,
      available: Number(variant.available || 0),
      incoming: Number(variant.incoming || 0),
    })),
  }));
}

async function networkInventoryDashboard(env) {
  const [storesResult, itemsResult] = await env.DB.batch([
    env.DB.prepare(`
      SELECT code, name, center, snapshot_date, source_file, total_units, material_count,
             available_units, incoming_units, repair_units, ignored_units
      FROM network_stores
      ORDER BY name COLLATE NOCASE
    `),
    env.DB.prepare(`
      SELECT store_code, material_code, display_name, technical_name, brand, cluster,
             available_quantity, incoming_quantity, repair_quantity, ignored_quantity,
             latest_modified_on
      FROM network_inventory
      ORDER BY cluster, brand COLLATE NOCASE, display_name COLLATE NOCASE, material_code
    `),
  ]);
  return json({
    stores: (storesResult.results || []).map((store) => ({
      code: store.code,
      name: store.name,
      center: store.center,
      snapshotDate: store.snapshot_date,
      sourceFile: store.source_file,
      totalUnits: Number(store.total_units),
      materialCount: Number(store.material_count),
      available: Number(store.available_units),
      incoming: Number(store.incoming_units),
      repair: Number(store.repair_units),
      ignored: Number(store.ignored_units),
    })),
    items: (itemsResult.results || []).map((item) => ({
      storeCode: item.store_code,
      materialCode: item.material_code,
      name: item.display_name,
      technicalName: item.technical_name,
      brand: item.brand,
      cluster: item.cluster,
      available: Number(item.available_quantity),
      incoming: Number(item.incoming_quantity),
      repair: Number(item.repair_quantity),
      ignored: Number(item.ignored_quantity),
      latestModifiedOn: item.latest_modified_on,
    })),
  });
}

async function dashboard(env, user) {
  const products = await catalogData(env, user.role === 'manager' ? user : { ...user, role: 'manager' });
  const stock = products.reduce((totals, product) => ({
    available: totals.available + product.available,
    reserved: totals.reserved + product.reserved,
    allocatedToSellers: totals.allocatedToSellers + product.allocatedToSellers,
    withdrawn: totals.withdrawn + product.withdrawn,
    incoming: totals.incoming + product.incoming,
  }), { available: 0, reserved: 0, allocatedToSellers: 0, withdrawn: 0, incoming: 0 });
  const modelsAvailable = products.filter((product) => product.available > 0).length;

  if (user.role === 'manager') {
    const [orderStatsResult, staffResult, accessesResult, snapshotResult] = await env.DB.batch([
      env.DB.prepare(`
        SELECT status, COUNT(*) AS count
        FROM withdrawal_requests
        GROUP BY status
      `),
      env.DB.prepare(`
        SELECT
          SUM(CASE WHEN role = 'seller' AND access_profile = 'default' THEN 1 ELSE 0 END) AS sellers,
          SUM(CASE WHEN access_profile = 'stocker' THEN 1 ELSE 0 END) AS stockers
        FROM users
        WHERE active = 1 AND deleted_at IS NULL
      `),
      env.DB.prepare(`
        SELECT a.created_at, u.name, u.email,
               CASE WHEN u.access_profile = 'stocker' THEN 'stocker' ELSE u.role END AS effective_role
        FROM audit_logs a
        LEFT JOIN users u ON u.id = a.actor_user_id
        WHERE a.action = 'auth.login'
        ORDER BY a.created_at DESC
        LIMIT 8
      `),
      env.DB.prepare(`
        SELECT key, value
        FROM system_state
        WHERE key IN (
          'inventory_snapshot_date',
          'inventory_snapshot_source',
          'inventory_snapshot_incoming_depots'
        )
      `),
    ]);
    const orderStats = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    for (const row of orderStatsResult.results || []) orderStats[row.status] = Number(row.count);
    const staff = staffResult.results?.[0] || {};
    const snapshot = Object.fromEntries((snapshotResult.results || []).map((row) => [row.key, row.value]));
    const shortageProducts = products
      .filter((product) => product.available === 0 && product.incoming === 0)
      .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
      .slice(0, 12)
      .map((product) => ({
        id: product.id,
        name: product.name,
        materialCode: product.variants[0]?.materialCode || '',
        cluster: product.cluster,
      }));
    const incomingProducts = incomingProductSummaries(products);
    return json({
      role: 'manager', stock, modelsAvailable,
      pendingRequests: orderStats.pending,
      activeSellers: Number(staff.sellers || 0),
      activeStockers: Number(staff.stockers || 0),
      inventoryGroups: managerInventoryGroups(products),
      recentRequests: await listRequests(env, user, '', 8),
      management: {
        orderStats,
        outOfStockMaterials: products.filter((product) => product.available === 0 && product.incoming === 0).length,
        lowStockMaterials: products.filter((product) => product.available > 0 && product.available <= 2).length,
        incomingMaterials: products.filter((product) => product.incoming > 0).length,
        incomingUnits: stock.incoming,
        shortageProducts,
        incomingProducts,
        deviceProducts: managerDeviceProducts(products),
        recentAccesses: (accessesResult.results || []).map((row) => ({
          name: row.name || 'Usuário excluído',
          email: row.email || '',
          role: row.effective_role || '',
          createdAt: row.created_at,
        })),
        snapshot: {
          date: snapshot.inventory_snapshot_date || '',
          source: snapshot.inventory_snapshot_source || '',
          incomingDeposits: snapshot.inventory_snapshot_incoming_depots || 'DEPS,NREM',
        },
      },
    });
  }

  if (user.role === 'stocker') {
    const orderRows = (await env.DB.prepare(`
      SELECT status, COUNT(*) AS count
      FROM withdrawal_requests
      GROUP BY status
    `).all()).results || [];
    const requests = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
    for (const row of orderRows) requests[row.status] = Number(row.count);
    return json({
      role: 'stocker',
      stock,
      modelsAvailable,
      requests,
      readyRequests: requests.approved,
      inventoryGroups: managerInventoryGroups(products),
      incomingProducts: incomingProductSummaries(products),
      recentRequests: await listRequests(env, user, 'approved', 6),
    });
  }

  const ownRows = (await env.DB.prepare(`
    SELECT status, COUNT(*) AS count FROM withdrawal_requests WHERE seller_id = ? GROUP BY status
  `).bind(user.id).all()).results || [];
  const requests = { pending: 0, approved: 0, rejected: 0, cancelled: 0 };
  for (const row of ownRows) requests[row.status] = Number(row.count);
  return json({
    role: 'seller', stock: { available: stock.available }, modelsAvailable, requests,
    inventoryGroups: sellerInventoryGroups(products),
    recentRequests: await listRequests(env, user, '', 5),
  });
}

async function incomingInventoryDetails(env) {
  const rows = (await env.DB.prepare(`
    SELECT incoming.serial_number, incoming.material_code, incoming.technical_name,
           incoming.center, incoming.deposit, incoming.stock_type, incoming.system_status,
           incoming.source_row, incoming.snapshot_date, incoming.source_file, incoming.delivery_started_on,
           COALESCE(product.display_name, product.name, incoming.technical_name) AS display_name,
           COALESCE(product.brand, '') AS brand, COALESCE(product.category, '') AS category,
           COALESCE(product.cluster, 'misc') AS cluster, product.imagem_url
    FROM incoming_inventory_serials incoming
    LEFT JOIN product_variants variant ON variant.sku = incoming.material_code COLLATE NOCASE
    LEFT JOIN products product ON product.id = variant.product_id
    ORDER BY display_name COLLATE NOCASE, incoming.material_code COLLATE NOCASE,
             incoming.serial_number COLLATE NOCASE
  `).all()).results || [];
  const products = new Map();
  for (const row of rows) {
    if (!products.has(row.material_code)) products.set(row.material_code, {
      materialCode: row.material_code,
      name: row.display_name,
      technicalName: row.technical_name,
      brand: row.brand,
      category: row.category,
      cluster: row.cluster,
      imagem_url: row.imagem_url || '',
      quantity: 0,
      statuses: {},
      centers: [],
      firstDeliveryOn: '',
      lastDeliveryOn: '',
      serials: [],
    });
    const product = products.get(row.material_code);
    product.quantity += 1;
    product.statuses[row.system_status] = (product.statuses[row.system_status] || 0) + 1;
    if (!product.centers.includes(row.center)) product.centers.push(row.center);
    if (!product.firstDeliveryOn || row.delivery_started_on < product.firstDeliveryOn) product.firstDeliveryOn = row.delivery_started_on;
    if (!product.lastDeliveryOn || row.delivery_started_on > product.lastDeliveryOn) product.lastDeliveryOn = row.delivery_started_on;
    product.serials.push({
      serialNumber: row.serial_number,
      center: row.center,
      deposit: row.deposit,
      stockType: row.stock_type,
      status: row.system_status,
      deliveryStartedOn: row.delivery_started_on,
      sourceRow: Number(row.source_row),
    });
  }
  return json({
    summary: {
      units: rows.length,
      materials: products.size,
      snapshotDate: rows[0]?.snapshot_date || '',
      source: rows[0]?.source_file || '',
      status: 'DEPS NREM',
    },
    products: [...products.values()],
  });
}

async function replenishmentOverview(env, user, url) {
  const threshold = Math.min(99, Math.max(0, Number.parseInt(url.searchParams.get('threshold') || '2', 10) || 2));
  const [products, savedResult] = await Promise.all([
    catalogData(env, { ...user, role: 'manager' }),
    env.DB.prepare(`
      SELECT variant_id, requested_quantity, note, created_at, updated_at
      FROM replenishment_items
      ORDER BY updated_at DESC
    `).all(),
  ]);
  const saved = new Map((savedResult.results || []).map((item) => [Number(item.variant_id), item]));
  const items = products.flatMap((product) => product.variants.map((variant) => {
    const selected = saved.get(Number(variant.id));
    return {
      variantId: Number(variant.id),
      productId: Number(product.id),
      name: product.name,
      technicalName: product.technicalName,
      brand: product.brand,
      cluster: product.cluster,
      imagePath: product.imagem_url,
      materialCode: variant.materialCode,
      available: Number(variant.available),
      incoming: Number(variant.incoming || 0),
      selected: Boolean(selected),
      requestedQuantity: Number(selected?.requested_quantity || 0),
      note: selected?.note || '',
      updatedAt: selected?.updated_at || '',
    };
  })).filter((item) => item.selected || item.available <= threshold)
    .sort((left, right) => Number(right.selected) - Number(left.selected)
      || left.available - right.available
      || left.name.localeCompare(right.name, 'pt-BR'));
  return json({ threshold, items });
}

function xmlCell(value) {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipWorkbook(files) {
  const encoder = new TextEncoder();
  const chunks = [];
  const directory = [];
  let offset = 0;
  const u16 = (value) => [value & 255, (value >>> 8) & 255];
  const u32 = (value) => [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255];
  for (const [name, content] of Object.entries(files)) {
    const filename = encoder.encode(name);
    const data = encoder.encode(content);
    const checksum = crc32(data);
    const local = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0),
      ...u32(checksum), ...u32(data.length), ...u32(data.length), ...u16(filename.length), ...u16(0), ...filename,
    ]);
    chunks.push(local, data);
    directory.push(new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0),
      ...u32(checksum), ...u32(data.length), ...u32(data.length), ...u16(filename.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...filename,
    ]));
    offset += local.length + data.length;
  }
  const directorySize = directory.reduce((sum, item) => sum + item.length, 0);
  const end = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(directory.length), ...u16(directory.length),
    ...u32(directorySize), ...u32(offset), ...u16(0),
  ]);
  const output = new Uint8Array(offset + directorySize + end.length);
  let position = 0;
  for (const chunk of [...chunks, ...directory, end]) { output.set(chunk, position); position += chunk.length; }
  return output;
}

function replenishmentWorkbook(items, generatedOn) {
  const lastDataRow = Math.max(7, items.length + 7);
  const rows = items.map((item, index) => {
    const row = index + 8;
    const style = index % 2 ? 4 : 3;
    return `<row r="${row}" ht="24"><c r="A${row}" s="${style}" t="inlineStr"><is><t>${xmlCell(item.material_code)}</t></is></c><c r="B${row}" s="${style}" t="inlineStr"><is><t>${xmlCell(item.product_name)}</t></is></c><c r="C${row}" s="${style + 2}" t="n"><v>${Number(item.requested_quantity)}</v></c></row>`;
  }).join('');
  const totalRow = items.length + 9;
  const total = items.reduce((sum, item) => sum + Number(item.requested_quantity), 0);
  const signatureRow = totalRow + 3;
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:C${signatureRow + 1}"/><sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="7" topLeftCell="A8" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols><col min="1" max="1" width="20" customWidth="1"/><col min="2" max="2" width="58" customWidth="1"/><col min="3" max="3" width="18" customWidth="1"/></cols><sheetData><row r="1" ht="42"><c r="A1" s="1" t="inlineStr"><is><t>LISTA DE REPOSIÇÃO</t></is></c><c r="C1" s="11" t="inlineStr"><is><t>✦ vivo</t></is></c></row><row r="2" ht="23"><c r="A2" s="2" t="inlineStr"><is><t>CONTROLE DE ESTOQUE • PEDIDO INTERNO</t></is></c><c r="C2" s="12" t="inlineStr"><is><t>GERÊNCIA</t></is></c></row><row r="4" ht="20"><c r="A4" s="13" t="inlineStr"><is><t>DATA DE GERAÇÃO</t></is></c><c r="B4" s="13" t="inlineStr"><is><t>PRODUTOS NA LISTA</t></is></c><c r="C4" s="13" t="inlineStr"><is><t>TOTAL DE UNIDADES</t></is></c></row><row r="5" ht="31"><c r="A5" s="14" t="inlineStr"><is><t>${xmlCell(generatedOn)}</t></is></c><c r="B5" s="14" t="n"><v>${items.length}</v></c><c r="C5" s="14" t="n"><v>${total}</v></c></row><row r="7" ht="28"><c r="A7" s="7" t="inlineStr"><is><t>MATERIAL</t></is></c><c r="B7" s="7" t="inlineStr"><is><t>NOME DO PRODUTO</t></is></c><c r="C7" s="8" t="inlineStr"><is><t>QUANTIDADE</t></is></c></row>${rows}<row r="${totalRow}" ht="29"><c r="A${totalRow}" s="9"/><c r="B${totalRow}" s="9" t="inlineStr"><is><t>TOTAL DO PEDIDO</t></is></c><c r="C${totalRow}" s="10" t="n"><v>${total}</v></c></row><row r="${signatureRow}" ht="34"><c r="A${signatureRow}" s="15" t="inlineStr"><is><t>RESPONSÁVEL PELO PEDIDO</t></is></c><c r="C${signatureRow}" s="15" t="inlineStr"><is><t>DATA / CONFERÊNCIA</t></is></c></row><row r="${signatureRow + 1}" ht="31"><c r="A${signatureRow + 1}" s="16" t="inlineStr"><is><t>________________________________________</t></is></c><c r="C${signatureRow + 1}" s="16" t="inlineStr"><is><t>____ / ____ / ______</t></is></c></row></sheetData><autoFilter ref="A7:C${lastDataRow}"/><mergeCells count="4"><mergeCell ref="A1:B1"/><mergeCell ref="A2:B2"/><mergeCell ref="A${signatureRow}:B${signatureRow}"/><mergeCell ref="A${signatureRow + 1}:B${signatureRow + 1}"/></mergeCells><pageMargins left="0.25" right="0.25" top="0.35" bottom="0.35" header="0.2" footer="0.2"/><pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/></worksheet>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="7"><font><sz val="11"/><name val="Aptos"/><color rgb="FF25212B"/></font><font><b/><sz val="20"/><name val="Aptos Display"/><color rgb="FFFFFFFF"/></font><font><b/><sz val="9"/><name val="Aptos"/><color rgb="FFEADFF5"/></font><font><b/><sz val="11"/><name val="Aptos"/><color rgb="FFFFFFFF"/></font><font><b/><sz val="17"/><name val="Aptos Display"/><color rgb="FFFFFFFF"/></font><font><b/><sz val="9"/><name val="Aptos"/><color rgb="FF6A3B89"/></font><font><b/><sz val="14"/><name val="Aptos Display"/><color rgb="FF4C216B"/></font></fonts><fills count="8"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF55217A"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF4EDFA"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF8A47BD"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE9D8F5"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF0E5F8"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFDCCCE8"/></left><right style="thin"><color rgb="FFDCCCE8"/></right><top style="thin"><color rgb="FFDCCCE8"/></top><bottom style="thin"><color rgb="FFDCCCE8"/></bottom><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FF8A47BD"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="17"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center" indent="1"/></xf><xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center" indent="2"/></xf><xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf><xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf><xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" indent="1"/></xf><xf numFmtId="0" fontId="3" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="4" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="5" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="6" fillId="7" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="5" fillId="0" borderId="2" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="bottom"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  return zipWorkbook({
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Pedido de reposição" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'xl/worksheets/sheet1.xml': sheet,
    'xl/styles.xml': styles,
  });
}

async function exportReplenishmentSpreadsheet(env) {
  const result = await env.DB.prepare(`
    SELECT v.sku AS material_code,
           COALESCE(p.display_name, p.name) AS product_name,
           r.requested_quantity
    FROM replenishment_items r
    JOIN product_variants v ON v.id = r.variant_id
    JOIN products p ON p.id = v.product_id
    ORDER BY product_name COLLATE NOCASE, material_code COLLATE NOCASE
  `).all();
  const date = new Date().toISOString().slice(0, 10);
  const displayDate = date.split('-').reverse().join('/');
  const workbook = replenishmentWorkbook(result.results || [], displayDate);
  return new Response(workbook, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="lista-reposicao-${date}.xlsx"`,
      'Cache-Control': 'private, no-store',
    },
  });
}

async function saveReplenishmentItem(request, env, user) {
  const data = await readJson(request);
  const variantId = Number(data.variantId);
  const requestedQuantity = Number(data.requestedQuantity);
  const note = String(data.note || '').trim().slice(0, 240);
  if (!Number.isInteger(variantId) || variantId <= 0) throw new HttpError(400, 'Produto inválido.');
  if (!Number.isInteger(requestedQuantity) || requestedQuantity <= 0 || requestedQuantity > 100000) {
    throw new HttpError(400, 'Informe uma quantidade válida para o pedido.');
  }
  const variant = await env.DB.prepare(`
    SELECT v.id, v.sku, COALESCE(p.display_name, p.name) AS product_name
    FROM product_variants v JOIN products p ON p.id = v.product_id
    WHERE v.id = ? AND p.active = 1
  `).bind(variantId).first();
  if (!variant) throw new HttpError(404, 'Produto não encontrado.');
  const timestamp = nowIso();
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO replenishment_items
        (variant_id, requested_quantity, note, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(variant_id) DO UPDATE SET
        requested_quantity = excluded.requested_quantity,
        note = excluded.note,
        updated_at = excluded.updated_at
    `).bind(variantId, requestedQuantity, note, user.id, timestamp, timestamp),
    auditStatement(env, user.id, 'replenishment.saved', 'variant', variantId, {
      materialCode: variant.sku,
      product: variant.product_name,
      requestedQuantity,
    }),
  ]);
  return json({ ok: true }, 201);
}

async function deleteReplenishmentItem(env, user, variantId) {
  const existing = await env.DB.prepare(
    'SELECT variant_id, requested_quantity FROM replenishment_items WHERE variant_id = ?'
  ).bind(variantId).first();
  if (!existing) throw new HttpError(404, 'Item não encontrado na lista de pedido.');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM replenishment_items WHERE variant_id = ?').bind(variantId),
    auditStatement(env, user.id, 'replenishment.removed', 'variant', variantId, {
      requestedQuantity: Number(existing.requested_quantity),
    }),
  ]);
  return noContent();
}

async function stockSummary(env, user) {
  const products = await catalogData(env, user);
  return json({ summary: products.map((product) => ({
    model: product.name,
    materialCode: product.variants[0]?.materialCode || '',
    available: product.available,
    reserved: user.role === 'manager' ? product.reserved : undefined,
    allocatedToSellers: user.role === 'manager' ? product.allocatedToSellers : undefined,
    withdrawn: user.role === 'manager' ? product.withdrawn : undefined,
    incoming: user.role === 'manager' ? product.incoming : undefined,
    total: user.role === 'manager' ? product.onHand : product.available,
  })) });
}

async function adjustQuantityStock(request, env, user) {
  const input = await readJson(request);
  const data = validateFields(input, {
    variantId: positiveIdRule('um produto'),
    quantityDelta: quantityDeltaRule,
  });
  const variant = await env.DB.prepare(`
    SELECT v.*, p.id AS product_id, COALESCE(p.display_name, p.name) AS product_name
    FROM product_variants v
    JOIN products p ON p.id = v.product_id
    WHERE v.id = ? AND v.active = 1 AND p.active = 1 AND v.stock_mode = 'quantity'
  `).bind(data.variantId).first();
  if (!variant) throw new HttpError(404, 'Produto não encontrado no estoque.');
  if (variant.serial_tracking) {
    throw new HttpError(409, 'Este material é controlado por número de série. Atualize-o pela próxima planilha de estoque.');
  }
  try {
    const result = await env.DB.prepare(`
      UPDATE product_variants
      SET quantity_on_hand = quantity_on_hand + ?, updated_at = ?
      WHERE id = ? AND quantity_on_hand + ? >= 0
    `).bind(data.quantityDelta, nowIso(), variant.id, data.quantityDelta).run();
    if (!result.meta.changes) throw new HttpError(409, 'A saída informada é maior que o saldo disponível.');
    await env.DB.batch([auditStatement(env, user.id, 'inventory.quantity_adjusted', 'variant', variant.id, {
      productId: variant.product_id, productName: variant.product_name,
      materialCode: variant.sku || '', quantityDelta: data.quantityDelta,
    })]);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (String(error.message).includes('QUANTITY_BELOW_RESERVED')) {
      throw new HttpError(409, 'Parte desse estoque está reservada em pedidos pendentes.');
    }
    throw error;
  }
  const updated = await env.DB.prepare('SELECT quantity_on_hand FROM product_variants WHERE id = ?').bind(variant.id).first();
  return json({ variantId: variant.id, quantityOnHand: Number(updated.quantity_on_hand) }, 201);
}

async function createWithdrawal(request, env, user) {
  const input = await readJson(request);
  const notesResult = textRule('a observação', { max: 500, optional: true })(input?.notes);
  if (notesResult.error) throw new HttpError(400, 'Verifique os dados informados.', { notes: notesResult.error });
  const linesResult = requestLinesRule(input?.lines);
  if (linesResult.error) throw new HttpError(400, linesResult.error, { lines: linesResult.error });
  const priceCategory = typeof input?.priceCategory === 'string' ? input.priceCategory.trim().toUpperCase() : '';
  if (priceCategory && !PRICE_CATEGORY_SET.has(priceCategory)) {
    throw new HttpError(400, 'Selecione uma categoria de plano válida.', { priceCategory: 'Categoria de plano inválida.' });
  }
  const renovaInput = input?.renova && typeof input.renova === 'object' ? input.renova : null;
  let renova = { enabled: false, usedDevice: '', condition: 'bom', voucherCents: 0, manufacturerBonusCents: 0 };
  if (renovaInput) {
    if (!['bom', 'defeituoso'].includes(renovaInput.condition)) {
      throw new HttpError(400, 'Selecione o estado correto do aparelho usado.');
    }
    const deviceId = Number(renovaInput.deviceId);
    const usedDevice = String(renovaInput.usedDevice || '').trim().slice(0, 120);
    const tradeIn = Number.isInteger(deviceId) && deviceId > 0
      ? await env.DB.prepare(`
          SELECT id, device_name, good_cents, defective_cents
          FROM renova_trade_in_values
          WHERE id = ? AND active = 1
        `).bind(deviceId).first()
      : usedDevice
        ? await env.DB.prepare(`
            SELECT id, device_name, good_cents, defective_cents
            FROM renova_trade_in_values
            WHERE device_name = ? COLLATE NOCASE AND active = 1
          `).bind(usedDevice).first()
        : null;
    if (!tradeIn) {
      throw new HttpError(400, 'Selecione um aparelho usado disponível na tabela ASSURANT.');
    }
    renova = {
      enabled: true,
      usedDevice: tradeIn.device_name,
      condition: renovaInput.condition,
      voucherCents: Number(renovaInput.condition === 'defeituoso' ? tradeIn.defective_cents : tradeIn.good_cents),
      manufacturerBonusCents: 0,
    };
  }

  const resolvedLines = [];
  for (const line of linesResult.value) {
    const variant = await env.DB.prepare(`
      SELECT v.id, v.sku, v.serial_tracking, v.quantity_on_hand,
             COALESCE(p.display_name, p.name) AS product_name,
             COALESCE(p.cluster, 'misc') AS product_cluster,
             COALESCE((
               SELECT SUM(r.quantity)
               FROM active_quantity_reservations r
               WHERE r.variant_id = v.id
             ), 0) AS quantity_reserved,
             COALESCE((
               SELECT COUNT(*)
               FROM chips chip
               JOIN inventory_serials chip_serial ON chip_serial.id = chip.inventory_serial_id
               WHERE chip_serial.variant_id = v.id
                 AND chip.active = 1
                 AND chip.status = 'available'
             ), 0) AS quantity_chip_allocated
      FROM product_variants v
      JOIN products p ON p.id = v.product_id
      WHERE v.id = ? AND v.active = 1 AND p.active = 1 AND v.stock_mode = 'quantity'
    `).bind(line.variantId).first();
    if (!variant) throw new HttpError(404, 'Um dos produtos não foi encontrado. Atualize a loja e tente novamente.');
    const available = Number(variant.quantity_on_hand)
      - Number(variant.quantity_reserved)
      - Number(variant.quantity_chip_allocated);
    if (available < line.quantity) {
      throw new HttpError(409, `${variant.product_name} não possui mais a quantidade solicitada.`);
    }
    let pricing = null;
    if (variant.product_cluster === 'devices') {
      pricing = await env.DB.prepare(`
        SELECT profile.price_key, profile.table_date,
               (
                 SELECT value.price_cents
                 FROM device_price_values value
                 WHERE value.price_key = profile.price_key AND value.category = ?
               ) AS unit_price_cents
        FROM device_price_match_rules rule
        JOIN device_price_profiles profile ON profile.price_key = rule.price_key
        WHERE UPPER(?) LIKE rule.match_pattern COLLATE NOCASE
        ORDER BY rule.priority, length(rule.match_pattern) DESC
        LIMIT 1
      `).bind(priceCategory, variant.product_name).first();
      if (pricing && !priceCategory) {
        throw new HttpError(400, 'Escolha a categoria do plano para calcular o preço do aparelho.', {
          priceCategory: 'Selecione a categoria do plano.',
        });
      }
      if (pricing && pricing.unit_price_cents == null) {
        throw new HttpError(409, `Não há preço disponível para ${variant.product_name} nessa categoria.`);
      }
    }
    const retailPricing = pricing ? null : await env.DB.prepare(`
      SELECT material_code, price_cents AS unit_price_cents, price_kind, table_date
      FROM product_retail_prices
      WHERE material_code = ? COLLATE NOCASE
    `).bind(variant.sku || '').first();
    const appliedPricing = pricing || retailPricing;
    if (!appliedPricing) {
      throw new HttpError(409, `Preço não disponível para ${variant.product_name} na tabela atual.`);
    }
    const priceType = pricing ? 'plan' : (retailPricing?.price_kind || '');
    const serialRows = (await env.DB.prepare(`
      SELECT id, serial_number
      FROM inventory_serials
      WHERE variant_id = ? AND status = 'available'
        AND NOT EXISTS (
          SELECT 1 FROM request_serial_assignments a WHERE a.serial_id = inventory_serials.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM chips chip
          WHERE chip.inventory_serial_id = inventory_serials.id
            AND chip.active = 1
            AND chip.status = 'available'
        )
      ORDER BY serial_number COLLATE NOCASE
      LIMIT ?
    `).bind(line.variantId, line.quantity).all()).results || [];
    if (Boolean(variant.serial_tracking) && serialRows.length !== line.quantity) {
      throw new HttpError(409, `${variant.product_name} não possui números de série suficientes no momento.`);
    }
    resolvedLines.push({
      ...line,
      productName: variant.product_name,
      materialCode: variant.sku || '',
      cluster: variant.product_cluster || 'misc',
      priceKey: pricing?.price_key || '',
      priceType,
      unitPriceCents: appliedPricing?.unit_price_cents == null ? null : Number(appliedPricing.unit_price_cents),
      priceTableDate: appliedPricing?.table_date || '',
      serials: serialRows.map((serial) => ({
        id: Number(serial.id),
        serialNumber: serial.serial_number,
      })),
    });
  }

  const requestId = crypto.randomUUID();
  const timestamp = nowIso();
  const pricedLines = resolvedLines.filter((line) => line.unitPriceCents != null);
  const planPricedLines = pricedLines.filter((line) => line.priceType === 'plan');
  const deviceTotalCents = planPricedLines.length
    ? planPricedLines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
    : null;
  const normalOrderTotalCents = pricedLines.length
    ? pricedLines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0)
    : null;
  const deviceUnits = planPricedLines.reduce((sum, line) => sum + line.quantity, 0);
  if (renova.enabled && deviceUnits !== 1) {
    throw new HttpError(400, 'O Vivo Renova deve ser usado com exatamente um aparelho novo por pedido.');
  }
  const activeBoostRows = renova.enabled
    ? (await env.DB.prepare(`
        SELECT match_key, bonus_cents
        FROM renova_manufacturer_boosts
        WHERE active = 1
          AND starts_on <= date('now', '-3 hours')
          AND ends_on >= date('now', '-3 hours')
      `).all()).results || []
    : [];
  renova.manufacturerBonusCents = renova.enabled
    ? manufacturerRenovaBonusCents(planPricedLines[0]?.productName || '', activeBoostRows)
    : 0;
  const renovaDiscountCents = renova.enabled && deviceTotalCents != null
    ? Math.min(deviceTotalCents, renova.voucherCents + renova.manufacturerBonusCents)
    : 0;
  const orderTotalCents = normalOrderTotalCents == null ? null : Math.max(0, normalOrderTotalCents - renovaDiscountCents);
  const priceTableDate = pricedLines[0]?.priceTableDate || null;
  const statements = [
    env.DB.prepare(`
      INSERT INTO withdrawal_requests
        (id, seller_id, notes, price_category, device_total_cents, order_total_cents, price_table_date,
         renova_enabled, renova_used_device, renova_condition, renova_voucher_cents,
         renova_manufacturer_bonus_cents, renova_discount_cents)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(requestId, user.id, notesResult.value || null, priceCategory || null, deviceTotalCents, orderTotalCents, priceTableDate,
      renova.enabled ? 1 : 0, renova.usedDevice || null, renova.condition,
      renova.voucherCents, renova.manufacturerBonusCents, renovaDiscountCents),
  ];
  for (const line of resolvedLines) {
    statements.push(env.DB.prepare(`
      INSERT INTO active_quantity_reservations (variant_id, request_id, quantity) VALUES (?, ?, ?)
    `).bind(line.variantId, requestId, line.quantity));
  }
  for (const line of pricedLines) {
    statements.push(env.DB.prepare(`
      UPDATE withdrawal_quantity_items
      SET unit_price_cents = ?, price_category_snapshot = ?, price_type_snapshot = ?, price_table_date_snapshot = ?
      WHERE request_id = ? AND variant_id = ?
    `).bind(
      line.unitPriceCents,
      line.priceType === 'plan' ? priceCategory : line.priceType === 'no_charge' ? 'SEM COBRANÇA' : 'PREÇO FIXO',
      line.priceType,
      line.priceTableDate,
      requestId,
      line.variantId,
    ));
  }
  for (const line of resolvedLines) {
    for (const serial of line.serials) {
      statements.push(env.DB.prepare(`
        INSERT INTO request_serial_assignments
          (request_id, variant_id, serial_id, serial_number_snapshot)
        SELECT ?, ?, s.id, s.serial_number
        FROM inventory_serials s
        WHERE s.id = ? AND s.variant_id = ? AND s.status = 'available'
      `).bind(requestId, line.variantId, serial.id, line.variantId));
    }
  }
  statements.push(
    env.DB.prepare(`
      UPDATE withdrawal_requests
      SET status = 'approved',
          decision_note = 'Liberado automaticamente pelo sistema',
          decided_at = ?,
          decided_by = NULL
      WHERE id = ? AND status = 'pending'
    `).bind(timestamp, requestId),
    auditStatement(env, user.id, 'request.created', 'request', requestId, {
      automatic: true,
      products: resolvedLines.map((line) => ({
        variantId: line.variantId,
        productName: line.productName,
        materialCode: line.materialCode,
        cluster: line.cluster,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
      })),
      priceCategory: priceCategory || null,
      deviceTotalCents,
      orderTotalCents,
      priceTableDate,
      renova: renova.enabled ? { ...renova, discountCents: renovaDiscountCents } : null,
    }),
    auditStatement(env, null, 'request.auto_approved', 'request', requestId, {
      automatic: true,
      sellerId: user.id,
      selectedSerialCount: resolvedLines.reduce((sum, line) => sum + line.serials.length, 0),
      serials: resolvedLines.map((line) => ({
        materialCode: line.materialCode,
        serialNumbers: line.serials.map((serial) => serial.serialNumber),
      })),
    }),
  );
  try {
    await env.DB.batch(statements);
  } catch (error) {
    const message = String(error.message);
    if (message.includes('QUANTITY_NOT_AVAILABLE')
        || message.includes('SERIAL_NOT_AVAILABLE')
        || message.includes('SERIAL_ALLOCATED_TO_CHIP')
        || message.includes('SERIAL_SELECTION_MISMATCH')
        || message.includes('request_serial_assignments.serial_id')
        || message.includes('active_quantity_reservations')) {
      throw new HttpError(409, 'Parte do estoque acabou de mudar. Atualize a loja e envie o pedido novamente.');
    }
    if (message.includes('FOREIGN KEY constraint failed')) throw new HttpError(404, 'Um dos itens selecionados não foi encontrado.');
    throw error;
  }
  const created = (await listRequests(env, user, '', 200)).find((item) => item.id === requestId);
  return json({ request: created }, 201);
}

async function cancelWithdrawal(env, user, requestId) {
  const existing = await env.DB.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').bind(requestId).first();
  if (!existing) throw new HttpError(404, 'Pedido não encontrado.');

  const operationalCancellation = ['manager', 'stocker'].includes(user.role);
  if (!operationalCancellation && (user.role !== 'seller' || existing.seller_id !== user.id)) {
    throw new HttpError(403, 'Você não pode cancelar este pedido.');
  }
  if (operationalCancellation) {
    if (!['pending', 'approved'].includes(existing.status)) {
      throw new HttpError(409, 'Este pedido já foi encerrado e não pode mais ser cancelado.');
    }
  } else if (existing.status !== 'pending') {
    throw new HttpError(409, 'Este pedido já foi liberado e somente a equipe de estoque ou a gerência pode cancelá-lo.');
  }

  const [quantityResult, serialResult] = await env.DB.batch([
    env.DB.prepare(`
      SELECT i.variant_id, i.product_name_snapshot, i.material_code_snapshot,
             i.quantity, COALESCE(p.cluster, 'misc') AS product_cluster
      FROM withdrawal_quantity_items i
      LEFT JOIN product_variants v ON v.id = i.variant_id
      LEFT JOIN products p ON p.id = v.product_id
      WHERE i.request_id = ?
      ORDER BY i.product_name_snapshot COLLATE NOCASE
    `).bind(requestId),
    env.DB.prepare(`
      SELECT variant_id, serial_number_snapshot
      FROM request_serial_assignments
      WHERE request_id = ?
      ORDER BY variant_id, serial_number_snapshot COLLATE NOCASE
    `).bind(requestId),
  ]);
  const serialsByVariant = new Map();
  for (const serial of serialResult.results || []) {
    if (!serialsByVariant.has(serial.variant_id)) serialsByVariant.set(serial.variant_id, []);
    serialsByVariant.get(serial.variant_id).push(serial.serial_number_snapshot);
  }
  const products = (quantityResult.results || []).map((item) => ({
    variantId: item.variant_id,
    productName: item.product_name_snapshot,
    materialCode: item.material_code_snapshot || '',
    cluster: item.product_cluster || 'misc',
    quantity: Number(item.quantity),
  }));
  const serials = products
    .map((item) => ({
      materialCode: item.materialCode,
      serialNumbers: serialsByVariant.get(item.variantId) || [],
    }))
    .filter((item) => item.serialNumbers.length);
  const timestamp = nowIso();
  try {
    await env.DB.batch([
      env.DB.prepare(`
        UPDATE withdrawal_requests
        SET status = ?, decision_note = ?, decided_at = ?, decided_by = ?
        WHERE id = ? AND status = ?
      `).bind(
        'cancelled',
        user.role === 'manager'
          ? 'Cancelado pelo gerente; itens devolvidos ao estoque'
          : user.role === 'stocker'
            ? 'Cancelado pelo estoquista; itens devolvidos ao estoque'
            : 'Cancelado pelo vendedor',
        timestamp,
        user.id,
        requestId,
        existing.status,
      ),
      auditStatement(env, user.id, 'request.cancelled', 'request', requestId, {
        sellerId: existing.seller_id,
        cancelledByRole: user.role,
        previousStatus: existing.status,
        restoredStock: existing.status === 'approved',
        restoredUnits: existing.status === 'approved'
          ? products.reduce((sum, item) => sum + item.quantity, 0)
          : 0,
        products,
        serials,
      }),
    ]);
  } catch (error) {
    const message = String(error.message);
    if (message.includes('INVALID_REQUEST_TRANSITION')) {
      throw new HttpError(409, 'Este pedido já foi processado e não pode mais ser cancelado.');
    }
    throw error;
  }
  const updated = (await listRequests(env, user, '', 200)).find((item) => item.id === requestId);
  return json({ request: updated });
}

function publicNewsItem(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    validityLabel: row.validity_label || '',
    imagePath: row.image_path || '',
    imageAlt: row.image_alt || '',
    active: Boolean(row.active),
    authorName: row.author_name || 'Equipe comercial',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function newsItemById(env, id) {
  return env.DB.prepare(`
    SELECT n.*, author.name AS author_name
    FROM news_items n
    LEFT JOIN users author ON author.id = n.created_by
    WHERE n.id = ?
  `).bind(id).first();
}

async function listNews(env, user) {
  const visibility = user.role === 'manager' ? '' : 'WHERE n.active = 1';
  const rows = (await env.DB.prepare(`
    SELECT n.*, author.name AS author_name
    FROM news_items n
    LEFT JOIN users author ON author.id = n.created_by
    ${visibility}
    ORDER BY n.active DESC, n.updated_at DESC, n.id DESC
  `).all()).results || [];
  return json({ news: rows.map(publicNewsItem) });
}

async function createNews(request, env, manager) {
  const data = validateFields(await readJson(request), {
    title: textRule('o título da notícia', { min: 3, max: 120 }),
    body: textRule('o conteúdo da notícia', { min: 3, max: 2500 }),
    category: newsCategoryRule,
    validityLabel: textRule('a vigência', { max: 80, optional: true }),
  });
  const id = crypto.randomUUID();
  const timestamp = nowIso();
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO news_items
        (id, title, body, category, validity_label, active, created_by, updated_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, NULLIF(?, ''), 1, ?, ?, ?, ?)
    `).bind(id, data.title, data.body, data.category, data.validityLabel, manager.id, manager.id, timestamp, timestamp),
    auditStatement(env, manager.id, 'news.created', 'news', id, {
      title: data.title,
      category: data.category,
      validityLabel: data.validityLabel,
    }),
  ]);
  return json({ news: publicNewsItem(await newsItemById(env, id)) }, 201);
}

async function updateNews(request, env, manager, id) {
  const existing = await newsItemById(env, id);
  if (!existing) throw new HttpError(404, 'Notícia não encontrada.');
  const data = validateFields(await readJson(request), {
    title: textRule('o título da notícia', { min: 3, max: 120 }),
    body: textRule('o conteúdo da notícia', { min: 3, max: 2500 }),
    category: newsCategoryRule,
    validityLabel: textRule('a vigência', { max: 80, optional: true }),
  });
  const timestamp = nowIso();
  await env.DB.batch([
    env.DB.prepare(`
      UPDATE news_items
      SET title = ?, body = ?, category = ?, validity_label = NULLIF(?, ''), updated_by = ?, updated_at = ?
      WHERE id = ?
    `).bind(data.title, data.body, data.category, data.validityLabel, manager.id, timestamp, id),
    auditStatement(env, manager.id, 'news.updated', 'news', id, {
      title: data.title,
      category: data.category,
      validityLabel: data.validityLabel,
      active: Boolean(existing.active),
    }),
  ]);
  return json({ news: publicNewsItem(await newsItemById(env, id)) });
}

async function setNewsVisibility(request, env, manager, id) {
  const existing = await newsItemById(env, id);
  if (!existing) throw new HttpError(404, 'Notícia não encontrada.');
  const data = validateFields(await readJson(request), { active: booleanRule });
  if (Boolean(existing.active) === data.active) return json({ news: publicNewsItem(existing) });
  const timestamp = nowIso();
  await env.DB.batch([
    env.DB.prepare(`
      UPDATE news_items
      SET active = ?, updated_by = ?, updated_at = ?
      WHERE id = ?
    `).bind(data.active ? 1 : 0, manager.id, timestamp, id),
    auditStatement(env, manager.id, data.active ? 'news.published' : 'news.hidden', 'news', id, {
      title: existing.title,
      category: existing.category,
    }),
  ]);
  return json({ news: publicNewsItem(await newsItemById(env, id)) });
}

async function renovaIntakeIdByImei(env, imei) {
  if (!imei) return '';
  const row = await env.DB.prepare(`
    SELECT id FROM renova_intake_items WHERE imei = ? LIMIT 1
  `).bind(imei).first();
  return row?.id || '';
}

async function nextRenovaRegistrationCode(env) {
  const counter = await env.DB.prepare(`
    UPDATE renova_registration_counter
    SET last_number = last_number + 1
    WHERE id = 1
    RETURNING last_number
  `).first();
  if (!counter?.last_number) throw new HttpError(500, 'Não foi possível gerar o código de registro.');
  return `#${String(counter.last_number).padStart(3, '0')}`;
}

async function activeRenovaDeviceName(env, model) {
  const device = await env.DB.prepare(`
    SELECT device_name
    FROM renova_trade_in_values
    WHERE active = 1 AND device_name = ? COLLATE NOCASE
    LIMIT 1
  `).bind(model).first();
  return device?.device_name || '';
}

function publicRenovaIntakeItem(row) {
  return {
    id: row.id,
    registrationCode: row.registration_code || '',
    model: row.model,
    imei: row.imei || '',
    receivedOn: row.received_on,
    pickupOn: row.pickup_on || '',
    status: row.pickup_on ? 'picked_up' : 'awaiting_pickup',
    createdByName: row.created_by_name || 'Equipe da loja',
    updatedByName: row.updated_by_name || row.created_by_name || 'Equipe da loja',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function renovaIntakeItemById(env, id) {
  return env.DB.prepare(`
    SELECT item.*, creator.name AS created_by_name, updater.name AS updated_by_name
    FROM renova_intake_items item
    LEFT JOIN users creator ON creator.id = item.created_by
    LEFT JOIN users updater ON updater.id = item.updated_by
    WHERE item.id = ?
  `).bind(id).first();
}

async function listRenovaIntake(env, user) {
  requireRole(user, ['manager', 'stocker']);
  const rows = (await env.DB.prepare(`
    SELECT item.*, creator.name AS created_by_name, updater.name AS updated_by_name
    FROM renova_intake_items item
    LEFT JOIN users creator ON creator.id = item.created_by
    LEFT JOIN users updater ON updater.id = item.updated_by
    ORDER BY CASE WHEN item.pickup_on IS NULL THEN 0 ELSE 1 END,
             item.received_on DESC,
             item.updated_at DESC,
             item.id
  `).all()).results || [];
  const items = rows.map(publicRenovaIntakeItem);
  return json({
    items,
    summary: {
      awaitingPickup: items.filter((item) => item.status === 'awaiting_pickup').length,
      pickedUp: items.filter((item) => item.status === 'picked_up').length,
      total: items.length,
    },
  });
}

async function createRenovaIntake(request, env, user) {
  requireRole(user, ['manager', 'stocker']);
  const data = validateFields(await readJson(request), {
    model: textRule('o modelo do aparelho', { min: 2, max: 120 }),
    imei: imeiRule,
    receivedOn: renovaDateRule('a data de recebimento'),
    pickupOn: renovaDateRule('a data de retirada', { optional: true }),
  });
  if (data.pickupOn && data.pickupOn < data.receivedOn) {
    throw new HttpError(400, 'A retirada não pode ser anterior ao recebimento.', {
      pickupOn: 'Escolha uma data igual ou posterior ao recebimento.',
    });
  }
  const model = await activeRenovaDeviceName(env, data.model);
  if (!model) {
    throw new HttpError(400, 'Selecione um aparelho da lista do Vivo Renova.', {
      model: 'Escolha uma das opções exibidas na busca.',
    });
  }
  if (await renovaIntakeIdByImei(env, data.imei)) {
    throw new HttpError(409, 'Este IMEI já está cadastrado no Renova.', {
      imei: 'Confira o número ou localize o cadastro existente.',
    });
  }
  const registrationCode = await nextRenovaRegistrationCode(env);
  const id = crypto.randomUUID();
  const timestamp = nowIso();
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO renova_intake_items
        (id, registration_code, model, imei, received_on, pickup_on, created_by, updated_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, NULLIF(?, ''), ?, ?, ?, ?)
    `).bind(id, registrationCode, model, data.imei, data.receivedOn, data.pickupOn, user.id, user.id, timestamp, timestamp),
    auditStatement(env, user.id, data.pickupOn ? 'renova.received_and_picked_up' : 'renova.received', 'renova_intake', id, {
      registrationCode,
      model,
      imei: data.imei,
      receivedOn: data.receivedOn,
      pickupOn: data.pickupOn,
    }),
  ]);
  return json({ item: publicRenovaIntakeItem(await renovaIntakeItemById(env, id)) }, 201);
}

async function updateRenovaIntake(request, env, user, id) {
  requireRole(user, ['manager', 'stocker']);
  const existing = await renovaIntakeItemById(env, id);
  if (!existing) throw new HttpError(404, 'Aparelho do Renova não encontrado.');
  const data = validateFields(await readJson(request), {
    model: textRule('o modelo do aparelho', { min: 2, max: 120 }),
    imei: (value) => imeiRule(value, { optional: true }),
    receivedOn: renovaDateRule('a data de recebimento'),
    pickupOn: renovaDateRule('a data de retirada', { optional: true }),
  });
  if (data.pickupOn && data.pickupOn < data.receivedOn) {
    throw new HttpError(400, 'A retirada não pode ser anterior ao recebimento.', {
      pickupOn: 'Escolha uma data igual ou posterior ao recebimento.',
    });
  }
  const catalogModel = await activeRenovaDeviceName(env, data.model);
  const unchangedModel = String(existing.model).toLocaleUpperCase('pt-BR') === data.model.toLocaleUpperCase('pt-BR');
  const model = catalogModel || (unchangedModel ? existing.model : '');
  if (!model) {
    throw new HttpError(400, 'Selecione um aparelho da lista do Vivo Renova.', {
      model: 'Escolha uma das opções exibidas na busca.',
    });
  }
  const imei = data.imei || existing.imei || '';
  const duplicateImeiId = await renovaIntakeIdByImei(env, imei);
  if (duplicateImeiId && duplicateImeiId !== id) {
    throw new HttpError(409, 'Este IMEI já está cadastrado no Renova.', {
      imei: 'Confira o número ou localize o cadastro existente.',
    });
  }
  const previousPickupOn = existing.pickup_on || '';
  const action = !previousPickupOn && data.pickupOn
    ? 'renova.pickup_registered'
    : previousPickupOn && !data.pickupOn
      ? 'renova.pickup_cleared'
      : 'renova.updated';
  const timestamp = nowIso();
  await env.DB.batch([
    env.DB.prepare(`
      UPDATE renova_intake_items
      SET model = ?, imei = NULLIF(?, ''), received_on = ?, pickup_on = NULLIF(?, ''), updated_by = ?, updated_at = ?
      WHERE id = ?
    `).bind(model, imei, data.receivedOn, data.pickupOn, user.id, timestamp, id),
    auditStatement(env, user.id, action, 'renova_intake', id, {
      model,
      imei,
      receivedOn: data.receivedOn,
      previousPickupOn,
      pickupOn: data.pickupOn,
    }),
  ]);
  return json({ item: publicRenovaIntakeItem(await renovaIntakeItemById(env, id)) });
}

async function deleteRenovaIntake(env, user, id) {
  requireRole(user, ['manager', 'stocker']);
  const existing = await renovaIntakeItemById(env, id);
  if (!existing) throw new HttpError(404, 'Aparelho do Renova não encontrado.');
  await env.DB.batch([
    env.DB.prepare('DELETE FROM renova_intake_items WHERE id = ?').bind(id),
    auditStatement(env, user.id, 'renova.deleted', 'renova_intake', id, {
      registrationCode: existing.registration_code || '',
      model: existing.model,
      imei: existing.imei || '',
      receivedOn: existing.received_on,
      pickupOn: existing.pickup_on || '',
    }),
  ]);
  return new Response(null, { status: 204 });
}

function publicChip(row) {
  return {
    id: row.id,
    materialCode: row.material_code,
    iccid: row.iccid,
    sellerId: Number(row.assigned_seller_id),
    sellerName: row.seller_name || '',
    sellerEmail: row.seller_email || '',
    stockLinked: Boolean(row.inventory_serial_id),
    status: row.status,
    soldOn: row.sold_on || '',
    registeredPhone: row.registered_phone || '',
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    removedAt: row.removed_at || '',
  };
}

async function chipById(env, id) {
  return env.DB.prepare(`
    SELECT c.*, seller.name AS seller_name, seller.email AS seller_email,
           inventory.status AS inventory_status,
           inventory.variant_id AS inventory_variant_id
    FROM chips c
    JOIN users seller ON seller.id = c.assigned_seller_id
    LEFT JOIN inventory_serials inventory ON inventory.id = c.inventory_serial_id
    WHERE c.id = ?
  `).bind(id).first();
}

function fullChipIccid(serialNumber = '') {
  const serial = String(serialNumber).trim();
  return serial.length === 18 && !serial.startsWith('89') ? `89${serial}` : serial;
}

function publicChipCandidate(row) {
  const iccid = fullChipIccid(row.serial_number);
  return {
    inventorySerialId: Number(row.id),
    materialCode: row.material_code,
    materialName: row.material_name,
    iccid,
    suffix: iccid.slice(-6),
  };
}

async function chipInventorySerialById(env, inventorySerialId) {
  const row = await env.DB.prepare(`
    SELECT inventory.id, inventory.serial_number, inventory.status, inventory.variant_id,
           variant.sku AS material_code,
           COALESCE(product.display_name, product.name) AS material_name
    FROM inventory_serials inventory
    JOIN product_variants variant ON variant.id = inventory.variant_id
    JOIN products product ON product.id = variant.product_id
    WHERE inventory.id = ?
      AND inventory.status = 'available'
      AND variant.active = 1
      AND product.active = 1
      AND variant.serial_tracking = 1
      AND (
        UPPER(COALESCE(product.display_name, product.name, '')) LIKE '%SIM CARD%'
        OR UPPER(COALESCE(product.technical_name, '')) LIKE '%SIM CARD%'
      )
      AND NOT EXISTS (
        SELECT 1 FROM chips registered
        WHERE registered.inventory_serial_id = inventory.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM request_serial_assignments assignment
        WHERE assignment.serial_id = inventory.id
      )
  `).bind(inventorySerialId).first();
  return row ? { ...row, iccid: fullChipIccid(row.serial_number) } : null;
}

async function chipInventorySerialsByIds(env, inventorySerialIds) {
  const placeholders = inventorySerialIds.map(() => '?').join(', ');
  const rows = (await env.DB.prepare(`
    SELECT inventory.id, inventory.serial_number, inventory.status, inventory.variant_id,
           variant.sku AS material_code,
           COALESCE(product.display_name, product.name) AS material_name
    FROM inventory_serials inventory
    JOIN product_variants variant ON variant.id = inventory.variant_id
    JOIN products product ON product.id = variant.product_id
    WHERE inventory.id IN (${placeholders})
      AND inventory.status = 'available'
      AND variant.active = 1
      AND product.active = 1
      AND variant.serial_tracking = 1
      AND (
        UPPER(COALESCE(product.display_name, product.name, '')) LIKE '%SIM CARD%'
        OR UPPER(COALESCE(product.technical_name, '')) LIKE '%SIM CARD%'
      )
      AND NOT EXISTS (
        SELECT 1 FROM chips registered
        WHERE registered.inventory_serial_id = inventory.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM request_serial_assignments assignment
        WHERE assignment.serial_id = inventory.id
      )
  `).bind(...inventorySerialIds).all()).results || [];
  return rows.map((row) => ({ ...row, iccid: fullChipIccid(row.serial_number) }));
}

function chipInsertStatement(env, { id, sellerId, managerId, timestamp, inventorySerialId }) {
  return env.DB.prepare(`
    WITH requested (chip_id, seller_id, manager_id, created_at, inventory_id) AS (
      VALUES (?, ?, ?, ?, ?)
    ),
    eligible AS (
      SELECT requested.chip_id, requested.seller_id, requested.manager_id,
             requested.created_at, inventory.id AS inventory_id,
             inventory.serial_number, variant.sku AS material_code
      FROM requested
      JOIN inventory_serials inventory ON inventory.id = requested.inventory_id
      JOIN product_variants variant ON variant.id = inventory.variant_id
      JOIN products product ON product.id = variant.product_id
      WHERE inventory.status = 'available'
        AND variant.active = 1
        AND product.active = 1
        AND variant.serial_tracking = 1
        AND (
          UPPER(COALESCE(product.display_name, product.name, '')) LIKE '%SIM CARD%'
          OR UPPER(COALESCE(product.technical_name, '')) LIKE '%SIM CARD%'
        )
        AND NOT EXISTS (
          SELECT 1 FROM chips registered
          WHERE registered.inventory_serial_id = inventory.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM request_serial_assignments assignment
          WHERE assignment.serial_id = inventory.id
        )
    )
    INSERT INTO chips
      (id, material_code, iccid, inventory_serial_id, assigned_seller_id,
       created_by, updated_by, created_at, updated_at)
    SELECT eligible.chip_id, eligible.material_code,
           CASE
             WHEN length(eligible.serial_number) = 18
                  AND substr(eligible.serial_number, 1, 2) <> '89'
               THEN '89' || eligible.serial_number
             ELSE eligible.serial_number
           END,
           eligible.inventory_id, eligible.seller_id, eligible.manager_id,
           eligible.manager_id, eligible.created_at, eligible.created_at
    FROM eligible
    UNION ALL
    SELECT requested.chip_id, 'INVALID', '000000000000000000',
           requested.inventory_id, requested.seller_id, requested.manager_id,
           requested.manager_id, requested.created_at, requested.created_at
    FROM requested
    WHERE NOT EXISTS (SELECT 1 FROM eligible)
  `).bind(id, sellerId, managerId, timestamp, inventorySerialId);
}

async function listChipCandidates(env, user, url) {
  requireRole(user, 'manager');
  const data = validateFields({
    materialCode: url.searchParams.get('materialCode'),
    suffix: url.searchParams.get('suffix'),
  }, {
    materialCode: materialCodeRule,
    suffix: iccidSuffixRule,
  });
  const rows = (await env.DB.prepare(`
    SELECT inventory.id, inventory.serial_number,
           variant.sku AS material_code,
           COALESCE(product.display_name, product.name) AS material_name
    FROM inventory_serials inventory
    JOIN product_variants variant ON variant.id = inventory.variant_id
    JOIN products product ON product.id = variant.product_id
    WHERE variant.sku = ? COLLATE NOCASE
      AND substr(inventory.serial_number, -6) = ?
      AND inventory.status = 'available'
      AND variant.active = 1
      AND product.active = 1
      AND variant.serial_tracking = 1
      AND (
        UPPER(COALESCE(product.display_name, product.name, '')) LIKE '%SIM CARD%'
        OR UPPER(COALESCE(product.technical_name, '')) LIKE '%SIM CARD%'
      )
      AND NOT EXISTS (
        SELECT 1 FROM chips registered
        WHERE registered.inventory_serial_id = inventory.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM request_serial_assignments assignment
        WHERE assignment.serial_id = inventory.id
      )
    ORDER BY inventory.serial_number COLLATE NOCASE
    LIMIT 25
  `).bind(data.materialCode, data.suffix).all()).results || [];
  return json({
    materialCode: data.materialCode,
    suffix: data.suffix,
    candidates: rows.map(publicChipCandidate),
  });
}

function mapChipDatabaseError(error) {
  const message = String(error?.message || error);
  if (message.includes('CHIP_CAPACITY_EXCEEDED')) {
    return new HttpError(409, `Este vendedor já possui ${CHIP_LIMIT_PER_SELLER} chips disponíveis.`);
  }
  if (message.includes('INVALID_CHIP_SELLER')) {
    return new HttpError(400, 'Selecione um vendedor ativo para receber o chip.', {
      sellerId: 'Vendedor inválido ou sem acesso ativo.',
    });
  }
  if (message.includes('CHIP_SERIAL_NOT_AVAILABLE') || message.includes('SERIAL_ALLOCATED_TO_CHIP')) {
    return new HttpError(409, 'Este ICCID não está mais disponível. Faça a busca novamente.', {
      inventorySerialId: 'A unidade foi reservada ou retirada do estoque.',
    });
  }
  if (message.includes('chips.iccid') || message.includes('UNIQUE constraint failed: chips.iccid')) {
    return new HttpError(409, 'Este ICCID já está cadastrado no sistema.', {
      iccid: 'ICCID já cadastrado.',
    });
  }
  if (message.includes('chips.inventory_serial_id') || message.includes('UNIQUE constraint failed: chips.inventory_serial_id')) {
    return new HttpError(409, 'Este chip já está atribuído a uma carteira.', {
      iccid: 'ICCID já atribuído a outro vendedor.',
    });
  }
  return error;
}

async function listChips(env, user) {
  requireRole(user, ['manager', 'seller']);
  const manager = user.role === 'manager';
  let chipsStatement = env.DB.prepare(`
    SELECT c.*, seller.name AS seller_name, seller.email AS seller_email
    FROM chips c
    JOIN users seller ON seller.id = c.assigned_seller_id
    ${manager ? '' : 'WHERE c.assigned_seller_id = ? AND c.active = 1'}
    ORDER BY c.active DESC,
             CASE c.status WHEN 'available' THEN 0 ELSE 1 END,
             seller.name COLLATE NOCASE,
             c.updated_at DESC,
             c.id
  `);
  if (!manager) chipsStatement = chipsStatement.bind(user.id);
  const rows = (await chipsStatement.all()).results || [];
  const chips = rows.map(publicChip);
  let sellers = [];
  let materials = [];
  if (manager) {
    const [sellerResult, materialResult] = await env.DB.batch([
      env.DB.prepare(`
        SELECT u.id, u.name, u.email,
               SUM(CASE WHEN c.active = 1 AND c.status = 'available' THEN 1 ELSE 0 END) AS available_count,
               SUM(CASE WHEN c.active = 1 AND c.status = 'sold' THEN 1 ELSE 0 END) AS sold_count
        FROM users u
        LEFT JOIN chips c ON c.assigned_seller_id = u.id
        WHERE u.role = 'seller'
          AND u.access_profile = 'default'
          AND u.active = 1
          AND u.deleted_at IS NULL
        GROUP BY u.id, u.name, u.email
        ORDER BY u.name COLLATE NOCASE
      `),
      env.DB.prepare(`
        SELECT variant.id AS variant_id,
               variant.sku AS material_code,
               COALESCE(product.display_name, product.name) AS material_name,
               product.brand,
               COUNT(inventory.id) AS available_count
        FROM product_variants variant
        JOIN products product ON product.id = variant.product_id
        JOIN inventory_serials inventory ON inventory.variant_id = variant.id
        WHERE inventory.status = 'available'
          AND variant.active = 1
          AND product.active = 1
          AND variant.serial_tracking = 1
          AND (
            UPPER(COALESCE(product.display_name, product.name, '')) LIKE '%SIM CARD%'
            OR UPPER(COALESCE(product.technical_name, '')) LIKE '%SIM CARD%'
          )
          AND NOT EXISTS (
            SELECT 1 FROM chips registered
            WHERE registered.inventory_serial_id = inventory.id
          )
          AND NOT EXISTS (
            SELECT 1 FROM request_serial_assignments assignment
            WHERE assignment.serial_id = inventory.id
          )
        GROUP BY variant.id, variant.sku, product.display_name, product.name, product.brand
        HAVING COUNT(inventory.id) > 0
        ORDER BY product.display_name COLLATE NOCASE, variant.sku COLLATE NOCASE
      `),
    ]);
    const sellerRows = sellerResult.results || [];
    sellers = sellerRows.map((seller) => ({
      id: Number(seller.id),
      name: seller.name,
      email: seller.email,
      availableCount: Number(seller.available_count || 0),
      soldCount: Number(seller.sold_count || 0),
      limit: CHIP_LIMIT_PER_SELLER,
    }));
    materials = (materialResult.results || []).map((material) => ({
      variantId: Number(material.variant_id),
      materialCode: material.material_code,
      name: material.material_name,
      brand: material.brand || '',
      availableCount: Number(material.available_count || 0),
    }));
  }
  return json({
    chips,
    sellers,
    ...(manager ? { materials } : {}),
    limit: CHIP_LIMIT_PER_SELLER,
    summary: {
      available: chips.filter((chip) => chip.active && chip.status === 'available').length,
      sold: chips.filter((chip) => chip.active && chip.status === 'sold').length,
      removed: chips.filter((chip) => !chip.active).length,
    },
  });
}

async function createChip(request, env, manager) {
  const data = validateFields(await readJson(request), {
    inventorySerialId: positiveIdRule('um ICCID disponível'),
    sellerId: positiveIdRule('um vendedor'),
  });
  const id = crypto.randomUUID();
  const timestamp = nowIso();
  const inventorySerial = await chipInventorySerialById(env, data.inventorySerialId);
  if (!inventorySerial) {
    throw new HttpError(409, 'Este ICCID não está mais disponível. Faça a busca novamente.', {
      inventorySerialId: 'Escolha uma das correspondências disponíveis.',
    });
  }
  try {
    const results = await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO chips
          (id, material_code, iccid, inventory_serial_id, assigned_seller_id,
           created_by, updated_by, created_at, updated_at)
        SELECT ?, variant.sku,
               CASE
                 WHEN length(inventory.serial_number) = 18
                      AND substr(inventory.serial_number, 1, 2) <> '89'
                   THEN '89' || inventory.serial_number
                 ELSE inventory.serial_number
               END,
               inventory.id, ?, ?, ?, ?, ?
        FROM inventory_serials inventory
        JOIN product_variants variant ON variant.id = inventory.variant_id
        JOIN products product ON product.id = variant.product_id
        WHERE inventory.id = ?
          AND inventory.status = 'available'
          AND variant.active = 1
          AND product.active = 1
          AND variant.serial_tracking = 1
          AND (
            UPPER(COALESCE(product.display_name, product.name, '')) LIKE '%SIM CARD%'
            OR UPPER(COALESCE(product.technical_name, '')) LIKE '%SIM CARD%'
          )
          AND NOT EXISTS (
            SELECT 1 FROM chips registered
            WHERE registered.inventory_serial_id = inventory.id
          )
          AND NOT EXISTS (
            SELECT 1 FROM request_serial_assignments assignment
            WHERE assignment.serial_id = inventory.id
          )
      `).bind(id, data.sellerId, manager.id, manager.id, timestamp, timestamp, data.inventorySerialId),
      env.DB.prepare(`
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details_json)
        SELECT ?, 'chip.created', 'chip', ?, ?
        WHERE EXISTS (SELECT 1 FROM chips WHERE id = ?)
      `).bind(manager.id, id, JSON.stringify({
        materialCode: inventorySerial.material_code,
        iccidLast4: inventorySerial.iccid.slice(-4),
        sellerId: data.sellerId,
        stockLinked: true,
      }), id),
    ]);
    if (!results[0].meta.changes) {
      throw new HttpError(409, 'Este ICCID não está mais disponível. Faça a busca novamente.', {
        inventorySerialId: 'A unidade foi reservada ou retirada do estoque.',
      });
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw mapChipDatabaseError(error);
  }
  return json({ chip: publicChip(await chipById(env, id)) }, 201);
}

async function createChipsBulk(request, env, manager) {
  const data = validateFields(await readJson(request), {
    inventorySerialIds: chipInventorySerialIdsRule,
    sellerId: positiveIdRule('um vendedor'),
  });
  const seller = await env.DB.prepare(`
    SELECT u.id, u.name,
           COUNT(c.id) AS available_count
    FROM users u
    LEFT JOIN chips c
      ON c.assigned_seller_id = u.id
     AND c.active = 1
     AND c.status = 'available'
    WHERE u.id = ?
      AND u.role = 'seller'
      AND u.access_profile = 'default'
      AND u.active = 1
      AND u.deleted_at IS NULL
    GROUP BY u.id, u.name
  `).bind(data.sellerId).first();
  if (!seller) {
    throw new HttpError(400, 'Selecione um vendedor ativo para receber os chips.', {
      sellerId: 'Vendedor inválido ou sem acesso ativo.',
    });
  }
  const availableCount = Number(seller.available_count || 0);
  const remainingCapacity = Math.max(0, CHIP_LIMIT_PER_SELLER - availableCount);
  if (data.inventorySerialIds.length > remainingCapacity) {
    throw new HttpError(409, `${seller.name} possui somente ${remainingCapacity} ${remainingCapacity === 1 ? 'vaga disponível' : 'vagas disponíveis'} para chips.`, {
      inventorySerialIds: `Retire ${data.inventorySerialIds.length - remainingCapacity} ${data.inventorySerialIds.length - remainingCapacity === 1 ? 'chip' : 'chips'} do lote.`,
    });
  }

  const inventorySerials = await chipInventorySerialsByIds(env, data.inventorySerialIds);
  if (inventorySerials.length !== data.inventorySerialIds.length) {
    throw new HttpError(409, 'Um ou mais ICCIDs não estão mais disponíveis. Revise o lote.', {
      inventorySerialIds: 'Atualize as correspondências antes de cadastrar novamente.',
    });
  }
  const inventoryById = new Map(inventorySerials.map((serial) => [Number(serial.id), serial]));
  const timestamp = nowIso();
  const entries = data.inventorySerialIds.map((inventorySerialId) => ({
    id: crypto.randomUUID(),
    inventorySerialId,
    inventorySerial: inventoryById.get(inventorySerialId),
  }));
  const statements = entries.flatMap((entry) => [
    chipInsertStatement(env, {
      id: entry.id,
      sellerId: data.sellerId,
      managerId: manager.id,
      timestamp,
      inventorySerialId: entry.inventorySerialId,
    }),
    auditStatement(env, manager.id, 'chip.created', 'chip', entry.id, {
      materialCode: entry.inventorySerial.material_code,
      iccidLast4: entry.inventorySerial.iccid.slice(-4),
      sellerId: data.sellerId,
      inventorySerialId: entry.inventorySerialId,
      stockLinked: true,
      batch: true,
    }),
  ]);
  try {
    await env.DB.batch(statements);
  } catch (error) {
    throw mapChipDatabaseError(error);
  }
  const chips = await Promise.all(entries.map(async (entry) => publicChip(await chipById(env, entry.id))));
  return json({ chips, count: chips.length }, 201);
}

async function updateChip(request, env, manager, id) {
  const existing = await chipById(env, id);
  if (!existing) throw new HttpError(404, 'Chip não encontrado.');
  if (!existing.active) throw new HttpError(409, 'Restaure este chip antes de editá-lo.');
  const data = validateFields(await readJson(request), {
    sellerId: positiveIdRule('um vendedor'),
  });
  if (existing.status === 'sold' && Number(existing.assigned_seller_id) !== data.sellerId) {
    throw new HttpError(409, 'Um chip vendido não pode ser transferido para outro vendedor.');
  }
  const timestamp = nowIso();
  const transferred = Number(existing.assigned_seller_id) !== data.sellerId;
  try {
    await env.DB.batch([
      env.DB.prepare(`
        UPDATE chips
        SET assigned_seller_id = ?, updated_by = ?, updated_at = ?
        WHERE id = ? AND active = 1
      `).bind(data.sellerId, manager.id, timestamp, id),
      auditStatement(env, manager.id, transferred ? 'chip.transferred' : 'chip.updated', 'chip', id, {
        materialCode: existing.material_code,
        iccidLast4: existing.iccid.slice(-4),
        previousSellerId: Number(existing.assigned_seller_id),
        sellerId: data.sellerId,
        stockLinked: Boolean(existing.inventory_serial_id),
      }),
    ]);
  } catch (error) {
    throw mapChipDatabaseError(error);
  }
  return json({ chip: publicChip(await chipById(env, id)) });
}

async function sellChip(request, env, user, id) {
  requireRole(user, ['manager', 'seller']);
  const existing = await chipById(env, id);
  if (!existing) throw new HttpError(404, 'Chip não encontrado.');
  if (user.role === 'seller' && Number(existing.assigned_seller_id) !== user.id) {
    throw new HttpError(403, 'Você só pode registrar a venda dos seus próprios chips.');
  }
  if (!existing.active) throw new HttpError(409, 'Este chip foi retirado da carteira.');
  if (existing.status !== 'available') throw new HttpError(409, 'A venda deste chip já foi registrada.');
  const data = validateFields(await readJson(request), {
    soldOn: saleDateRule,
    registeredPhone: phoneNumberRule,
  });
  if (existing.inventory_serial_id && existing.inventory_status !== 'available') {
    throw new HttpError(409, 'Este chip não está mais disponível no estoque. Atualize a página e procure o gerente.');
  }
  const timestamp = nowIso();
  const statements = [
    env.DB.prepare(`
      UPDATE chips
      SET status = 'sold', sold_on = ?, registered_phone = ?, updated_by = ?, updated_at = ?
      WHERE id = ? AND active = 1 AND status = 'available'
        AND (? IS NULL OR EXISTS (
          SELECT 1 FROM inventory_serials inventory
          WHERE inventory.id = ? AND inventory.status = 'available'
        ))
    `).bind(data.soldOn, data.registeredPhone, user.id, timestamp, id,
      existing.inventory_serial_id || null, existing.inventory_serial_id || null),
  ];
  if (existing.inventory_serial_id) {
    statements.push(
      env.DB.prepare(`
        UPDATE inventory_serials
        SET status = 'withdrawn', updated_at = ?
        WHERE id = ? AND status = 'available'
      `).bind(timestamp, existing.inventory_serial_id),
      env.DB.prepare(`
        UPDATE product_variants
        SET quantity_on_hand = (
              SELECT COUNT(*) FROM inventory_serials inventory
              WHERE inventory.variant_id = product_variants.id AND inventory.status = 'available'
            ),
            updated_at = ?
        WHERE id = ?
      `).bind(timestamp, existing.inventory_variant_id),
    );
  }
  statements.push(
    env.DB.prepare(`
      INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details_json)
      SELECT ?, 'chip.sold', 'chip', ?, ?
      WHERE EXISTS (SELECT 1 FROM chips WHERE id = ? AND status = 'sold' AND updated_at = ?)
    `).bind(user.id, id, JSON.stringify({
      materialCode: existing.material_code,
      iccidLast4: existing.iccid.slice(-4),
      sellerId: Number(existing.assigned_seller_id),
      soldOn: data.soldOn,
      registeredPhone: data.registeredPhone,
      stockLinked: Boolean(existing.inventory_serial_id),
    }), id, timestamp),
  );
  const results = await env.DB.batch(statements);
  if (!results[0].meta.changes) throw new HttpError(409, 'A situação deste chip foi alterada. Atualize a página.');
  return json({ chip: publicChip(await chipById(env, id)) });
}

async function reopenChip(env, manager, id) {
  const existing = await chipById(env, id);
  if (!existing) throw new HttpError(404, 'Chip não encontrado.');
  if (!existing.active) throw new HttpError(409, 'Restaure este chip antes de corrigir a venda.');
  if (existing.status !== 'sold') throw new HttpError(409, 'Este chip já está disponível.');
  if (existing.inventory_serial_id) {
    const assignment = await env.DB.prepare(`
      SELECT 1 AS found FROM request_serial_assignments WHERE serial_id = ? LIMIT 1
    `).bind(existing.inventory_serial_id).first();
    if (assignment) throw new HttpError(409, 'Este ICCID já está vinculado a um pedido e não pode ser reaberto.');
  }
  const timestamp = nowIso();
  try {
    const statements = [];
    if (existing.inventory_serial_id) {
      statements.push(
        env.DB.prepare(`
          UPDATE inventory_serials
          SET status = 'available', updated_at = ?
          WHERE id = ? AND status = 'withdrawn'
        `).bind(timestamp, existing.inventory_serial_id),
        env.DB.prepare(`
          UPDATE product_variants
          SET quantity_on_hand = (
                SELECT COUNT(*) FROM inventory_serials inventory
                WHERE inventory.variant_id = product_variants.id AND inventory.status = 'available'
              ),
              updated_at = ?
          WHERE id = ?
        `).bind(timestamp, existing.inventory_variant_id),
      );
    }
    const chipStatementIndex = statements.length;
    statements.push(
      env.DB.prepare(`
        UPDATE chips
        SET status = 'available', sold_on = NULL, registered_phone = NULL,
            updated_by = ?, updated_at = ?
        WHERE id = ? AND active = 1 AND status = 'sold'
      `).bind(manager.id, timestamp, id),
    );
    statements.push(
      env.DB.prepare(`
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details_json)
        SELECT ?, 'chip.sale_reopened', 'chip', ?, ?
        WHERE EXISTS (SELECT 1 FROM chips WHERE id = ? AND status = 'available' AND updated_at = ?)
      `).bind(manager.id, id, JSON.stringify({
        materialCode: existing.material_code,
        iccidLast4: existing.iccid.slice(-4),
        sellerId: Number(existing.assigned_seller_id),
        stockLinked: Boolean(existing.inventory_serial_id),
      }), id, timestamp),
    );
    const results = await env.DB.batch(statements);
    if (!results[chipStatementIndex].meta.changes) {
      throw new HttpError(409, 'A situação deste chip foi alterada. Atualize a página.');
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw mapChipDatabaseError(error);
  }
  return json({ chip: publicChip(await chipById(env, id)) });
}

async function removeChip(env, manager, id) {
  const existing = await chipById(env, id);
  if (!existing) throw new HttpError(404, 'Chip não encontrado.');
  if (!existing.active) return noContent();
  const timestamp = nowIso();
  const results = await env.DB.batch([
    env.DB.prepare(`
      UPDATE chips
      SET active = 0, removed_at = ?, updated_by = ?, updated_at = ?
      WHERE id = ? AND active = 1
    `).bind(timestamp, manager.id, timestamp, id),
    env.DB.prepare(`
      INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details_json)
      SELECT ?, 'chip.removed', 'chip', ?, ?
      WHERE EXISTS (SELECT 1 FROM chips WHERE id = ? AND active = 0 AND updated_at = ?)
    `).bind(manager.id, id, JSON.stringify({
      materialCode: existing.material_code,
      iccidLast4: existing.iccid.slice(-4),
      sellerId: Number(existing.assigned_seller_id),
      previousStatus: existing.status,
    }), id, timestamp),
  ]);
  if (!results[0].meta.changes) throw new HttpError(409, 'A situação deste chip foi alterada. Atualize a página.');
  return noContent();
}

async function restoreChip(env, manager, id) {
  const existing = await chipById(env, id);
  if (!existing) throw new HttpError(404, 'Chip não encontrado.');
  if (existing.active) return json({ chip: publicChip(existing) });
  if (existing.status === 'available' && existing.inventory_serial_id
      && existing.inventory_status !== 'available') {
    throw new HttpError(409, 'Este ICCID já foi retirado do estoque e não pode ser restaurado.');
  }
  const timestamp = nowIso();
  try {
    const results = await env.DB.batch([
      env.DB.prepare(`
        UPDATE chips
        SET active = 1, removed_at = NULL, updated_by = ?, updated_at = ?
        WHERE id = ? AND active = 0
      `).bind(manager.id, timestamp, id),
      env.DB.prepare(`
        INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details_json)
        SELECT ?, 'chip.restored', 'chip', ?, ?
        WHERE EXISTS (SELECT 1 FROM chips WHERE id = ? AND active = 1 AND updated_at = ?)
      `).bind(manager.id, id, JSON.stringify({
        materialCode: existing.material_code,
        iccidLast4: existing.iccid.slice(-4),
        sellerId: Number(existing.assigned_seller_id),
        status: existing.status,
      }), id, timestamp),
    ]);
    if (!results[0].meta.changes) throw new HttpError(409, 'A situação deste chip foi alterada. Atualize a página.');
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw mapChipDatabaseError(error);
  }
  return json({ chip: publicChip(await chipById(env, id)) });
}

async function listUsers(env) {
  const rows = (await env.DB.prepare(`
    SELECT users.id, users.name, users.email, users.employee_re, users.role, users.access_profile,
           users.active, users.must_change_password, users.created_at,
           EXISTS(SELECT 1 FROM employee_point_qr qr WHERE qr.user_id = users.id) AS has_point_qr
    FROM users
    WHERE deleted_at IS NULL
    ORDER BY active DESC, access_profile, role, name COLLATE NOCASE
  `).all()).results || [];
  return json({ users: rows.map((row) => ({ ...publicUser(row), hasPointQr: Boolean(row.has_point_qr) })) });
}

async function myPoint(env, user) {
  const [qr, punchesResult] = await Promise.all([
    env.DB.prepare(`
      SELECT mime_type, image_base64, updated_at
      FROM employee_point_qr
      WHERE user_id = ?
    `).bind(user.id).first(),
    env.DB.prepare(`
      SELECT id, punched_at
      FROM employee_point_punches
      WHERE user_id = ?
      ORDER BY punched_at DESC, id DESC
      LIMIT 30
    `).bind(user.id).all(),
  ]);
  return json({
    employee: { name: user.name, employeeRe: user.employee_re || '' },
    qrCode: qr ? {
      imageDataUrl: `data:${qr.mime_type};base64,${qr.image_base64}`,
      updatedAt: qr.updated_at,
    } : null,
    punches: (punchesResult.results || []).map((punch) => ({
      id: Number(punch.id),
      punchedAt: punch.punched_at,
    })),
  }, 200, { 'Cache-Control': 'private, no-store, max-age=0' });
}

async function punchMyPoint(env, user) {
  const timestamp = nowIso();
  const previous = await env.DB.prepare(`
    SELECT punched_at
    FROM employee_point_punches
    WHERE user_id = ?
    ORDER BY punched_at DESC, id DESC
    LIMIT 1
  `).bind(user.id).first();
  if (previous && Date.parse(timestamp) - Date.parse(previous.punched_at) < 60000) {
    throw new HttpError(409, 'Seu ponto já foi registrado há menos de um minuto.');
  }
  const results = await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO employee_point_punches (user_id, punched_at)
      VALUES (?, ?)
    `).bind(user.id, timestamp),
    auditStatement(env, user.id, 'point.punched', 'user', user.id, { punchedAt: timestamp }),
  ]);
  return json({
    punch: { id: Number(results[0].meta.last_row_id), punchedAt: timestamp },
    message: 'Ponto registrado com sucesso.',
  }, 201, { 'Cache-Control': 'private, no-store, max-age=0' });
}

async function teamPointOverview(env) {
  const [membersResult, punchesResult] = await Promise.all([
    env.DB.prepare(`
      SELECT id, name, employee_re, role, access_profile
      FROM users
      WHERE active = 1 AND deleted_at IS NULL
        AND NOT (role = 'manager' AND access_profile = 'default')
      ORDER BY name COLLATE NOCASE
    `).all(),
    env.DB.prepare(`
      SELECT p.id, p.user_id, p.punched_at
      FROM employee_point_punches p
      JOIN users u ON u.id = p.user_id
      WHERE u.active = 1 AND u.deleted_at IS NULL
        AND NOT (u.role = 'manager' AND u.access_profile = 'default')
        AND p.punched_at >= datetime('now', '-31 days')
      ORDER BY p.punched_at DESC, p.id DESC
      LIMIT 1000
    `).all(),
  ]);
  const punchesByUser = new Map();
  for (const punch of punchesResult.results || []) {
    const userId = Number(punch.user_id);
    if (!punchesByUser.has(userId)) punchesByUser.set(userId, []);
    punchesByUser.get(userId).push({ id: Number(punch.id), punchedAt: punch.punched_at });
  }
  return json({
    members: (membersResult.results || []).map((member) => ({
      id: Number(member.id),
      name: member.name,
      employeeRe: member.employee_re || '',
      role: effectiveRole(member),
      punches: punchesByUser.get(Number(member.id)) || [],
    })),
    generatedAt: nowIso(),
  }, 200, { 'Cache-Control': 'private, no-store, max-age=0' });
}

async function savePointQr(request, env, manager, userId) {
  const target = await env.DB.prepare(`
    SELECT id, name FROM users WHERE id = ? AND active = 1 AND deleted_at IS NULL
  `).bind(userId).first();
  if (!target) throw new HttpError(404, 'Funcionário não encontrado.');
  const input = await readJson(request);
  const mimeType = String(input.mimeType || '').trim().toLowerCase();
  const imageBase64 = String(input.imageBase64 || '').replace(/\s/g, '');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    throw new HttpError(400, 'Envie o QR Code em JPG, PNG ou WebP.');
  }
  if (!imageBase64 || imageBase64.length > 600000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64)) {
    throw new HttpError(400, 'O arquivo do QR Code é inválido ou muito grande.');
  }
  const timestamp = nowIso();
  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO employee_point_qr (user_id, mime_type, image_base64, updated_by, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        mime_type = excluded.mime_type,
        image_base64 = excluded.image_base64,
        updated_by = excluded.updated_by,
        updated_at = excluded.updated_at
    `).bind(userId, mimeType, imageBase64, manager.id, timestamp),
    auditStatement(env, manager.id, 'user.point_qr_updated', 'user', userId, { employeeName: target.name }),
  ]);
  return json({ message: 'QR Code do ponto salvo com segurança.', hasPointQr: true });
}

async function requireClearedChipWallet(env, user, { active, role }) {
  if (effectiveRole(user) !== 'seller' || (active && role === 'seller')) return;
  const count = Number((await env.DB.prepare(`
    SELECT COUNT(*) AS count
    FROM chips
    WHERE assigned_seller_id = ? AND active = 1 AND status = 'available'
  `).bind(user.id).first()).count || 0);
  if (!count) return;
  throw new HttpError(409,
    `Este vendedor ainda possui ${count} ${count === 1 ? 'chip disponível' : 'chips disponíveis'}. Transfira ou retire os chips antes de alterar o acesso.`);
}

async function createUser(request, env, manager) {
  const data = validateFields(await readJson(request), {
    name: textRule('o nome completo', { min: 2, max: 100 }),
    email: emailRule,
    employeeRe: employeeReRule,
    password: passwordRule,
    role: roleRule,
  });
  const passwordHash = await hashPassword(data.password);
  const storage = storedRole(data.role);
  try {
    const result = await env.DB.prepare(`
      INSERT INTO users
        (name, email, employee_re, password_hash, role, access_profile, must_change_password)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).bind(data.name, data.email, data.employeeRe || null, passwordHash, storage.role, storage.accessProfile).run();
    const id = Number(result.meta.last_row_id);
    await env.DB.batch([auditStatement(env, manager.id, 'user.created', 'user', id, { email: data.email, role: data.role })]);
    return json({ user: publicUser(await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first()) }, 201);
  } catch (error) {
    if (String(error.message).includes('users.email')) throw new HttpError(409, 'Este e-mail já está em uso.');
    if (String(error.message).includes('employee_re')) throw new HttpError(409, 'Este RE já está vinculado a outro usuário.');
    throw error;
  }
}

async function updateUser(request, env, manager, id) {
  const existing = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL').bind(id).first();
  if (!existing) throw new HttpError(404, 'Usuário não encontrado.');
  const data = validateFields(await readJson(request), {
    name: textRule('o nome completo', { min: 2, max: 100 }),
    email: emailRule,
    employeeRe: employeeReRule,
    role: roleRule,
    active: booleanRule,
    password: optionalPasswordRule,
  });
  const existingEffectiveRole = effectiveRole(existing);
  const storage = storedRole(data.role);
  if (id === manager.id && (!data.active || data.role !== 'manager')) throw new HttpError(400, 'Você não pode remover o próprio acesso gerencial.');
  if (existingEffectiveRole === 'manager' && existing.active && (!data.active || data.role !== 'manager')) {
    const count = Number((await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE role = 'manager' AND active = 1 AND deleted_at IS NULL
    `).first()).count);
    if (count <= 1) throw new HttpError(400, 'O sistema precisa manter pelo menos um gerente ativo.');
  }
  await requireClearedChipWallet(env, existing, { active: data.active, role: data.role });
  const passwordHash = data.password ? await hashPassword(data.password) : '';
  const timestamp = nowIso();
  const statements = [
    data.password
      ? env.DB.prepare(`
          UPDATE users
          SET name = ?, email = ?, employee_re = ?, role = ?, access_profile = ?, active = ?, password_hash = ?,
              must_change_password = 0, updated_at = ?
          WHERE id = ? AND deleted_at IS NULL
        `).bind(data.name, data.email, data.employeeRe || null, storage.role, storage.accessProfile, data.active ? 1 : 0, passwordHash, timestamp, id)
      : env.DB.prepare(`
          UPDATE users
          SET name = ?, email = ?, employee_re = ?, role = ?, access_profile = ?, active = ?, updated_at = ?
          WHERE id = ? AND deleted_at IS NULL
        `).bind(data.name, data.email, data.employeeRe || null, storage.role, storage.accessProfile, data.active ? 1 : 0, timestamp, id),
    auditStatement(env, manager.id, 'user.updated', 'user', id, {
      name: data.name,
      email: data.email,
      employeeRe: data.employeeRe,
      role: data.role,
      active: data.active,
      passwordChanged: Boolean(data.password),
    }),
  ];
  if (!data.active || data.password || existingEffectiveRole !== data.role) {
    statements.push(env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id));
  }
  try {
    await env.DB.batch(statements);
  } catch (error) {
    const message = String(error.message);
    if (message.includes('users.email')) throw new HttpError(409, 'Este e-mail já está em uso.');
    if (message.includes('employee_re')) throw new HttpError(409, 'Este RE já está vinculado a outro usuário.');
    if (message.includes('LAST_ACTIVE_MANAGER')) throw new HttpError(400, 'O sistema precisa manter pelo menos um gerente ativo.');
    if (message.includes('CHIP_WALLET_NOT_EMPTY')) {
      throw new HttpError(409, 'Transfira ou retire os chips disponíveis antes de alterar o acesso deste vendedor.');
    }
    throw error;
  }
  return json({ user: publicUser(await env.DB.prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL').bind(id).first()) });
}

async function resetUserPassword(request, env, manager, id) {
  const existing = await env.DB.prepare('SELECT id FROM users WHERE id = ? AND deleted_at IS NULL').bind(id).first();
  if (!existing) throw new HttpError(404, 'Usuário não encontrado.');
  const data = validateFields(await readJson(request), { password: passwordRule });
  const passwordHash = await hashPassword(data.password);
  await env.DB.batch([
    env.DB.prepare(`UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = ? WHERE id = ?`)
      .bind(passwordHash, nowIso(), id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
    auditStatement(env, manager.id, 'user.password_reset', 'user', id, {}),
  ]);
  return json({ message: 'Senha alterada com sucesso.' });
}

async function deleteUser(env, manager, id) {
  const existing = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL').bind(id).first();
  if (!existing) throw new HttpError(404, 'Usuário não encontrado.');
  if (id === manager.id) throw new HttpError(400, 'Você não pode excluir o próprio cadastro.');
  if (existing.role === 'manager' && existing.active) {
    const count = Number((await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE role = 'manager' AND active = 1 AND deleted_at IS NULL
    `).first()).count);
    if (count <= 1) throw new HttpError(400, 'O sistema precisa manter pelo menos um gerente ativo.');
  }
  await requireClearedChipWallet(env, existing, { active: false, role: effectiveRole(existing) });

  const timestamp = nowIso();
  const anonymizedEmail = `excluido+${id}-${Date.now()}@local.invalid`;
  const disabledPasswordHash = await hashPassword(newSessionToken());
  try {
    await env.DB.batch([
      env.DB.prepare(`
        UPDATE users
        SET name = 'Usuário excluído', email = ?, employee_re = NULL, password_hash = ?, active = 0,
            must_change_password = 0, deleted_at = ?, updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `).bind(anonymizedEmail, disabledPasswordHash, timestamp, timestamp, id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
      env.DB.prepare(`
        UPDATE audit_logs
        SET details_json = '{"anonymized":true}'
        WHERE entity_type = 'user' AND entity_id = ?
      `).bind(String(id)),
      auditStatement(env, manager.id, 'user.deleted', 'user', id, {
        role: effectiveRole(existing),
        historicalDataPreserved: true,
      }),
    ]);
  } catch (error) {
    if (String(error.message).includes('LAST_ACTIVE_MANAGER')) {
      throw new HttpError(400, 'O sistema precisa manter pelo menos um gerente ativo.');
    }
    if (String(error.message).includes('CHIP_WALLET_NOT_EMPTY')) {
      throw new HttpError(409, 'Transfira ou retire os chips disponíveis antes de excluir este vendedor.');
    }
    throw error;
  }
  return noContent();
}

async function auditLog(env) {
  const rows = (await env.DB.prepare(`
    SELECT a.*, u.name AS actor_name FROM audit_logs a
    LEFT JOIN users u ON u.id = a.actor_user_id
    ORDER BY a.created_at DESC LIMIT 300
  `).all()).results || [];
  return json({
    logs: rows.map((row) => {
      let details = {};
      try { details = row.details_json ? JSON.parse(row.details_json) : {}; } catch { details = {}; }
      return {
        id: row.id,
        actorName: row.actor_name || 'Sistema',
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        details,
        createdAt: row.created_at,
      };
    }),
  });
}

async function routeApi(request, env) {
  validateRequestSource(request);
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === 'GET' && path === '/api/health') return json({ ok: true, platform: 'cloudflare', time: nowIso() });
  if (method === 'GET' && path === '/api/setup') return setupStatus(env);
  if (method === 'POST' && path === '/api/setup') return initialSetup(request, env);
  if (method === 'POST' && path === '/api/auth/login') return login(request, env);
  if (method === 'POST' && path === '/api/auth/logout') {
    await deleteSession(env, request);
    return noContent({ 'Set-Cookie': clearSessionCookie() });
  }

  const user = await authenticatedUser(env, request);
  if (method === 'GET' && path === '/api/auth/me') return json({ user: publicUser(user) });
  if (method === 'PATCH' && path === '/api/auth/password') return changePassword(request, env, user);
  if (user.must_change_password) throw new HttpError(403, 'Altere a senha provisória para continuar.');
  if (method === 'GET' && path === '/api/dashboard') return dashboard(env, user);
  if (method === 'GET' && path === '/api/network-inventory') {
    requireRole(user, 'manager');
    return networkInventoryDashboard(env);
  }
  if (method === 'GET' && path === '/api/point/me') return myPoint(env, user);
  if (method === 'POST' && path === '/api/point/me/punch') {
    requireRole(user, ['seller', 'stocker']);
    return punchMyPoint(env, user);
  }
  if (method === 'GET' && path === '/api/point/team') {
    requireRole(user, 'manager');
    return teamPointOverview(env);
  }
  if (method === 'GET' && path === '/api/catalog') return listCatalog(env, user);
  if (method === 'GET' && path === '/api/stock/summary') return stockSummary(env, user);
  if (method === 'GET' && path === '/api/incoming') {
    requireRole(user, ['manager', 'stocker']);
    return incomingInventoryDetails(env);
  }
  if (method === 'GET' && path === '/api/replenishment') {
    requireRole(user, ['manager', 'stocker']);
    return replenishmentOverview(env, user, url);
  }
  if (method === 'GET' && path === '/api/replenishment/export') {
    requireRole(user, ['manager', 'stocker']);
    return exportReplenishmentSpreadsheet(env);
  }
  if (method === 'POST' && path === '/api/replenishment') {
    requireRole(user, ['manager', 'stocker']);
    return saveReplenishmentItem(request, env, user);
  }
  const replenishmentMatch = path.match(/^\/api\/replenishment\/(\d+)$/);
  if (method === 'DELETE' && replenishmentMatch) {
    requireRole(user, ['manager', 'stocker']);
    return deleteReplenishmentItem(env, user, Number(replenishmentMatch[1]));
  }
  if (method === 'GET' && path === '/api/repairs') {
    requireRole(user, ['manager', 'stocker']);
    const items = (await env.DB.prepare(`
      SELECT serial_number, material_code, technical_name, center, deposit, snapshot_date
      FROM repair_inventory
      ORDER BY technical_name COLLATE NOCASE, material_code COLLATE NOCASE, serial_number COLLATE NOCASE
    `).all()).results || [];
    const materialCount = Number((await env.DB.prepare(
      'SELECT COUNT(DISTINCT material_code) AS count FROM repair_inventory'
    ).first()).count || 0);
    return json({
      summary: { units: items.length, materials: materialCount, snapshotDate: items[0]?.snapshot_date || '' },
      items: items.map((item) => ({
        serialNumber: item.serial_number,
        materialCode: item.material_code,
        name: item.technical_name,
        center: item.center,
        deposit: item.deposit,
      })),
    });
  }
  if (method === 'GET' && path === '/api/news') return listNews(env, user);
  if (method === 'POST' && path === '/api/news') {
    requireRole(user, 'manager');
    return createNews(request, env, user);
  }
  const newsVisibilityMatch = path.match(/^\/api\/news\/([^/]+)\/visibility$/);
  if (method === 'PATCH' && newsVisibilityMatch) {
    requireRole(user, 'manager');
    return setNewsVisibility(request, env, user, decodeURIComponent(newsVisibilityMatch[1]));
  }
  const newsMatch = path.match(/^\/api\/news\/([^/]+)$/);
  if (method === 'PUT' && newsMatch) {
    requireRole(user, 'manager');
    return updateNews(request, env, user, decodeURIComponent(newsMatch[1]));
  }
  if (method === 'GET' && path === '/api/renova-intake') {
    requireRole(user, ['manager', 'stocker']);
    return listRenovaIntake(env, user);
  }
  if (method === 'POST' && path === '/api/renova-intake') {
    requireRole(user, ['manager', 'stocker']);
    return createRenovaIntake(request, env, user);
  }
  const renovaIntakeMatch = path.match(/^\/api\/renova-intake\/([^/]+)$/);
  if (method === 'PUT' && renovaIntakeMatch) {
    requireRole(user, ['manager', 'stocker']);
    return updateRenovaIntake(request, env, user, decodeURIComponent(renovaIntakeMatch[1]));
  }
  if (method === 'DELETE' && renovaIntakeMatch) {
    requireRole(user, ['manager', 'stocker']);
    return deleteRenovaIntake(env, user, decodeURIComponent(renovaIntakeMatch[1]));
  }
  if (method === 'GET' && path === '/api/chips/candidates') return listChipCandidates(env, user, url);
  if (method === 'GET' && path === '/api/chips') return listChips(env, user);
  if (method === 'POST' && path === '/api/chips/bulk') {
    requireRole(user, 'manager');
    return createChipsBulk(request, env, user);
  }
  if (method === 'POST' && path === '/api/chips') {
    requireRole(user, 'manager');
    return createChip(request, env, user);
  }
  const chipSaleMatch = path.match(/^\/api\/chips\/([^/]+)\/sale$/);
  if (method === 'POST' && chipSaleMatch) {
    return sellChip(request, env, user, decodeURIComponent(chipSaleMatch[1]));
  }
  const chipReopenMatch = path.match(/^\/api\/chips\/([^/]+)\/reopen$/);
  if (method === 'POST' && chipReopenMatch) {
    requireRole(user, 'manager');
    return reopenChip(env, user, decodeURIComponent(chipReopenMatch[1]));
  }
  const chipRestoreMatch = path.match(/^\/api\/chips\/([^/]+)\/restore$/);
  if (method === 'POST' && chipRestoreMatch) {
    requireRole(user, 'manager');
    return restoreChip(env, user, decodeURIComponent(chipRestoreMatch[1]));
  }
  const chipMatch = path.match(/^\/api\/chips\/([^/]+)$/);
  if (method === 'PUT' && chipMatch) {
    requireRole(user, 'manager');
    return updateChip(request, env, user, decodeURIComponent(chipMatch[1]));
  }
  if (method === 'DELETE' && chipMatch) {
    requireRole(user, 'manager');
    return removeChip(env, user, decodeURIComponent(chipMatch[1]));
  }
  if (method === 'POST' && path === '/api/inventory/quantity') {
    requireRole(user, 'manager');
    return adjustQuantityStock(request, env, user);
  }
  if (method === 'GET' && path === '/api/requests') return json({
    requests: await listRequests(env, user, url.searchParams.get('status') || '', url.searchParams.get('limit')),
  });
  if (method === 'POST' && path === '/api/requests') {
    requireRole(user, 'seller');
    return createWithdrawal(request, env, user);
  }
  const requestActionMatch = path.match(/^\/api\/requests\/([^/]+)\/cancel$/);
  if (method === 'POST' && requestActionMatch) {
    return cancelWithdrawal(env, user, decodeURIComponent(requestActionMatch[1]));
  }
  if (method === 'GET' && path === '/api/users') {
    requireRole(user, 'manager');
    return listUsers(env);
  }
  if (method === 'POST' && path === '/api/users') {
    requireRole(user, 'manager');
    return createUser(request, env, user);
  }
  const userMatch = path.match(/^\/api\/users\/(\d+)$/);
  if (method === 'PUT' && userMatch) {
    requireRole(user, 'manager');
    return updateUser(request, env, user, Number(userMatch[1]));
  }
  if (method === 'DELETE' && userMatch) {
    requireRole(user, 'manager');
    return deleteUser(env, user, Number(userMatch[1]));
  }
  const pointQrMatch = path.match(/^\/api\/users\/(\d+)\/point-qr$/);
  if (method === 'PUT' && pointQrMatch) {
    requireRole(user, 'manager');
    return savePointQr(request, env, user, Number(pointQrMatch[1]));
  }
  const resetMatch = path.match(/^\/api\/users\/(\d+)\/reset-password$/);
  if (method === 'POST' && resetMatch) {
    requireRole(user, 'manager');
    return resetUserPassword(request, env, user, Number(resetMatch[1]));
  }
  if (method === 'GET' && path === '/api/audit') {
    requireRole(user, 'manager');
    return auditLog(env);
  }
  throw new HttpError(404, 'Rota não encontrada.');
}

function mapUnexpectedError(error) {
  if (error instanceof HttpError) return json({ error: error.message, ...(error.fields ? { fields: error.fields } : {}) }, error.status);
  console.error(JSON.stringify({
    message: 'Unhandled Worker error',
    error: error instanceof Error ? error.message : String(error),
  }));
  return json({ error: 'Ocorreu um erro inesperado. Tente novamente.' }, 500);
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (!path.startsWith('/api/')) return secureAssetResponse(await env.ASSETS.fetch(request), request);
    try {
      return await routeApi(request, env);
    } catch (error) {
      return mapUnexpectedError(error);
    }
  },
};
