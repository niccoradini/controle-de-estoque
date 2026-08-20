Warning: truncated output (original token count: 54816)
Total output lines: 2826

import {
  compatibleCaseChoices,
  groupAccessoryChoices,
  groupDeviceProducts,
} from './catalog-groups.js';

const root = document.querySelector('#root');
const modalRoot = document.querySelector('#modal-root');
const toastRoot = document.querySelector('#toast-root');
let chipCandidateRequest = 0;
let chipCandidateTimer = 0;
let chipBatchItems = [];

const state = {
  user: null,
  view: 'dashboard',
  requests: [],
  users: [],
  logs: [],
  news: [],
  chips: [],
  renovaItems: [],
  renovaSearch: '',
  renovaStatus: 'awaiting_pickup',
  chipSellers: [],
  chipMaterials: [],
  chipLimit: 10,
  chipSearch: '',
  chipStatus: 'available',
  chipSellerId: 0,
  catalog: [],
  pricing: { categories: [], tableDate: '', source: '' },
  renovaCatalog: { tableDate: '', devices: [], boosts: [] },
  priceCategory: '',
  cart: new Map(),
  cartDrawerOpen: false,
  renova: { enabled: false, deviceId: 0, condition: 'bom' },
  deviceSelections: new Map(),
  expandedDeviceFamily: '',
  catalogSearch: '',
  catalogCategory: '',
  stockSearch: '',
  stockCluster: '',
  requestFilter: '',
  alignmentTopic: '',
  pendingCount: 0,
};

const RENOVA_INTAKE_ROLES = new Set(['manager', 'stocker']);

function canAccessRenovaIntake() {
  return RENOVA_INTAKE_ROLES.has(state.user?.role);
}

const viewTitles = {
  dashboard: 'Visão geral',
  news: 'Notícias',
  chips: 'Chips',
  'renova-intake': 'Renova',
  stock: 'Loja e estoque',
  'new-request': 'Novo pedido',
  requests: 'Pedidos de retirada',
  alignment: 'Central de Alinhamento',
  users: 'Usuários',
  audit: 'Histórico',
};

const statusInfo = {
  pending: ['Pendente', 'pending'],
  approved: ['Liberado', 'approved'],
  rejected: ['Recusado', 'rejected'],
  cancelled: ['Cancelado', 'cancelled'],
};

const newsCategoryInfo = {
  promotion: { label: 'Promoção', icon: 'sparkles' },
  notice: { label: 'Comunicado', icon: 'news' },
  update: { label: 'Novidade', icon: 'briefing' },
};

const newsCardArtwork = Object.freeze({
  '/news/semana-gamer-2026-08.jpeg': '/news/semana-gamer-2026-08-card.jpg',
  '/news/campanhas-acessorios-2026-08.jpeg': '/news/campanhas-acessorios-2026-08-card.jpg',
  '/news/bundle-samsung-2026-08.jpeg': '/news/bundle-samsung-2026-08-card.jpg',
  '/news/bundle-motorola-2026-08.jpeg': '/news/bundle-motorola-2026-08-card.jpg',
  '/news/bundle-apple-2026-08.jpeg': '/news/bundle-apple-2026-08-card.jpg',
  '/news/tv-samsung-vivo-total-32-43-50-2026-08.jpg': '/news/tv-samsung-vivo-total-32-43-50-2026-08-card.jpg',
  '/news/tv-samsung-vivo-total-55-98-2026-08.jpg': '/news/tv-samsung-vivo-total-55-98-2026-08-card.jpg',
  '/news/semana-gamer-controle-2026-08.webp': '/news/semana-gamer-controle-2026-08-card.jpg',
  '/news/waaw-caixas-30-segundo-2026-08.jpeg': '/news/waaw-caixas-30-segundo-2026-08-card.jpg',
  '/news/waaw-fones-30-segundo-2026-08.jpeg': '/news/waaw-fones-30-segundo-2026-08-card.jpg',
});

const clusterLabels = {
  devices: 'Aparelhos',
  cases: 'Capas',
  screen_protectors: 'Películas',
  speakers: 'Caixas de som',
  notebooks: 'Notebooks',
  tvs: 'TVs',
  chargers: 'Carregadores',
  cables: 'Cabos',
  misc: 'Acessórios diversos',
};

const clusterOrder = ['devices', 'cases', 'screen_protectors', 'speakers', 'notebooks', 'tvs', 'chargers', 'cables', 'misc'];

const alignmentTopics = [
  {
    id: 'customer-care',
    number: '01',
    icon: 'service',
    eyebrow: 'Prioridade absoluta',
    title: 'Resolver faz parte do atendimento',
    summary: 'O cliente precisa ser acolhido, orientado e acompanhado até uma solução clara.',
    minutes: 6,
    wide: true,
  },
  {
    id: 'responsibilities',
    number: '02',
    icon: 'tasks',
    eyebrow: 'Função completa',
    title: 'Responsabilidades do consultor',
    summary: 'Vendas, serviços, suporte e compromisso com a operação fazem parte do mesmo cargo.',
    minutes: 6,
  },
  {
    id: 'conduct',
    number: '03',
    icon: 'conduct',
    eyebrow: 'Postura profissional',
    title: 'Comportamento em loja',
    summary: 'Presença, respeito, comunicação adequada e clareza sobre a estrutura da equipe.',
    minutes: 4,
  },
  {
    id: 'organization',
    number: '04',
    icon: 'clean',
    eyebrow: 'Responsabilidade coletiva',
    title: 'A loja é de todos',
    summary: 'Cozinha e estoque devem permanecer limpos, seguros e prontos para a rotina.',
    minutes: 4,
    wide: true,
  },
];

class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'U';
}

function formatDate(value, withTime = true) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' }).format(date).replace('.', '');
}

function formatMoney(cents) {
  if (cents === null || cents === undefined || !Number.isFinite(Number(cents))) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(cents) / 100);
}

function formatDateOnly(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '—';
}

function localDateValue() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatPhoneNumber(value) {
  const digits = String(value || '').replace(/\D/g, '');
  const local = digits.startsWith('55') && digits.length === 13 ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return digits || '—';
}

function installmentCount(totalCents) {
  const total = Number(totalCents || 0);
  if (total >= 499900) return 21;
  if (total >= 299900) return 15;
  if (total >= 99900) return 12;
  if (total >= 49900) return 6;
  if (total >= 9900) return 3;
  return 1;
}

function selectedProductPrice(product, variant = null) {
  if (product?.pricing) {
    if (!state.priceCategory) return null;
    const price = product.pricing.prices?.[state.priceCategory];
    return price === undefined || price === null ? null : Number(price);
  }
  const retailPrice = variant?.retailPrice || product?.retailPrice;
  return retailPrice?.priceCents == null ? null : Number(retailPrice.priceCents);
}

function productPriceKind(product, variant = null) {
  if (product?.pricing) return 'plan';
  return (variant?.retailPrice || product?.retailPrice)?.kind || '';
}

function priceText(product, variant = null) {
  const price = selectedProductPrice(product, variant);
  if (price == null) return 'Preço não disponível';
  return productPriceKind(product, variant) === 'no_charge' ? 'Sem cobrança' : formatMoney(price);
}

function normalizeRenovaModelKey(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\b5G\b/g, '')
    .replaceAll('+', ' PLUS ')
    .replace(/[^A-Z0-9]+/g, '');
}

function manufacturerRenovaBonus(productName = '') {
  const productKey = normalizeRenovaModelKey(productName);
  const matchingBoost = [...(state.renovaCatalog.boosts || [])]
    .filter((boost) => productKey.includes(String(boost.matchKey || '')))
    .sort((left, right) => String(right.matchKey || '').length - String(left.matchKey || '').length)[0];
  return matchingBoost ? Number(matchingBoost.bonusCents || 0) : 0;
}

function selectedRenovaTradeIn() {
  const deviceId = Number(state.renova.deviceId || 0);
  return (state.renovaCatalog.devices || []).find((device) => Number(device.id) === deviceId) || null;
}

function renovaTradeInByName(value = '') {
  const name = String(value).trim().toLocaleUpperCase('pt-BR');
  return (state.renovaCatalog.devices || []).find((device) => device.name.toLocaleUpperCase('pt-BR') === name) || null;
}

function renovaTableDateLabel(value = '') {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function renovaDiscountFor(selected) {
  if (!state.renova.enabled) return { deviceSubtotalCents: 0, bonusCents: 0, voucherCents: 0, discountCents: 0 };
  const devices = selected.filter((item) => item.product.cluster === 'devices' && item.unitPriceCents != null);
  const deviceSubtotalCents = devices.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const automaticBonus = devices.length ? manufacturerRenovaBonus(devices[0].product.name) : 0;
  const tradeIn = selectedRenovaTradeIn();
  const bonusCents = Math.max(0, Number(automaticBonus));
  const voucherCents = Math.max(0, Number(state.renova.condition === 'defeituoso' ? tradeIn?.defectiveCents : tradeIn?.goodCents) || 0);
  return { deviceSubtotalCents, bonusCents, voucherCents, discountCents: Math.min(deviceSubtotalCents, bonusCents + voucherCents) };
}

function statusBadge(status) {
  const [label, className] = statusInfo[status] || [status, 'cancelled'];
  return `<span class="status status--${className}">${escapeHtml(label)}</span>`;
}

function roleLabel(role) {
  if (role === 'manager') return 'Gerente';
  if (role === 'stocker') return 'Estoquista';
  return 'Vendedor';
}

function requestCode(id) {
  const value = String(id);
  return /^\d+$/.test(value) ? value.padStart(4, '0') : value.replaceAll('-', '').slice(0, 8).toUpperCase();
}

function uiIcon(name, className = '') {
  const icons = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/>',
    stock: '<rect x="3" y="5" width="18" height="15" rx="2.5"/><path d="M3 10h18M8 5v5M16 5v5M8 14h3M8 17h6"/>',
    orders: '<path d="M8 4h8M9 3h6v3H9z"/><rect x="5" y="5" width="14" height="16" rx="2.5"/><path d="m9 12 2 2 4-4M9 18h6"/>',
    users: '<path d="M16 20v-1.6a4.4 4.4 0 0 0-4.4-4.4H6.4A4.4 4.4 0 0 0 2 18.4V20"/><circle cx="9" cy="7" r="4"/><path d="M17 11a3.5 3.5 0 0 1 0-7M22 20v-1.5a4 4 0 0 0-3-3.8"/>',
    history: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2M4.7 5.8 2.8 4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    logout: '<path d="M10 4H5.5A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20H10M14 8l4 4-4 4M18 12H8"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    box: '<path d="m4 8 8-4 8 4-8 4-8-4Z"/><path d="m4 8 8 4 8-4v8l-8 4-8-4V8ZM12 12v8"/>',
    copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    warning: '<path d="M12 8v5M12 17h.01"/><path d="M10.3 4.2 2.7 18a2 2 0 0 0 1.8 3h15a2 2 0 0 0 1.8-3L13.7 4.2a2 2 0 0 0-3.4 0Z"/>',
    briefing: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h10M7 13h6M7 17h4"/>',
    news: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5A2.5 2.5 0 0 1 17.5 21h-11A2.5 2.5 0 0 1 4 18.5v-13Z"/><path d="M4 7H2v11.5A2.5 2.5 0 0 0 4.5 21M8 8h8M8 12h8M8 16h5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
    sparkles: '<path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3ZM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14ZM19 13l.7 2.3L22 16l-2.3.7L19 19l-.7-2.3L16 16l2.3-.7L19 13Z"/>',
    service: '<path d="M4 13v-2a8 8 0 0 1 16 0v2"/><path d="M4 13h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 13h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2ZM17 19c-1 2-3 2-5 2"/>',
    tasks: '<path d="M9 5h6M10 3h4a2 2 0 0 1 2 2v1H8V5a2 2 0 0 1 2-2Z"/><rect x="5" y="5" width="14" height="16" rx="2.5"/><path d="m8.5 11 1.5 1.5 2.5-3M8.5 17h7"/>',
    conduct: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20v-1.5A4.5 4.5 0 0 1 7.5 14h3A4.5 4.5 0 0 1 15 18.5V20M16 5.5a3.5 3.5 0 0 1 0 6.5M18 14a4.5 4.5 0 0 1 3 4.2V20"/>',
    clean: '<path d="m12 3 1.1 3.2L16 8l-2.9 1.8L12 13l-1.1-3.2L8 8l2.9-1.8L12 3ZM5.5 13l.8 2.2 2.2.8-2.2.8L5.5 19l-.8-2.2-2.2-.8 2.2-.8.8-2.2ZM18.5 13l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    sim: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 3v5h6V3M9 13h6M9 17h2M15 17h.01"/>',
    renova: '<rect x="7" y="3" width="10" height="15" rx="2.5"/><path d="M10 6h4M10 15h4M4 9l-2 2 2 2M2 11h5M20 15l2-2-2-2M22 13h-5"/>',
  };
  return `<svg class="ui-icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[name] || icons.box}</svg>`;
}

function clusterGraphic(cluster) {
  const drawings = {
    devices: `
      <rect class="graphic-soft" x="44" y="11" width="70" height="98" rx="15"/>
      <rect class="graphic-surface" x="51" y="18" width="56" height="78" rx="9"/>
      <path d="M75 103h8"/>
      <rect class="graphic-back" x="105" y="31" width="42" height="72" rx="10" transform="rotate(7 105 31)"/>
      <circle cx="119" cy="45" r="5"/><circle cx="132" cy="47" r="5"/>`,
    cases: `
      <rect class="graphic-soft" x="52" y="10" width="76" height="100" rx="18" transform="rotate(-5 52 10)"/>
      <rect class="graphic-surface" x="60" y="18" width="60" height="84" rx="12" transform="rotate(-5 60 18)"/>
      <rect x="65" y="23" width="27" height="30" rx="8" transform="rotate(-5 65 23)"/>
      <circle cx="73" cy="33" r="4"/><circle cx="84" cy="32" r="4"/><circle cx="74" cy="44" r="4"/>
      <path d="M82 94h13"/>`,
    screen_protectors: `
      <rect class="graphic-back" x="42" y="18" width="67" height="91" rx="14" transform="rotate(-8 42 18)"/>
      <rect class="graphic-soft" x="69" y="11" width="67" height="91" rx="14" transform="rotate(8 69 11)"/>
      <rect class="graphic-surface" x="56" y="14" width="68" height="94" rx="14"/>
      <path d="M80 23h20M68 88l36-55"/>`,
    speakers: `
      <rect class="graphic-soft" x="57" y="10" width="66" height="100" rx="16"/>
      <circle class="graphic-surface" cx="90" cy="76" r="23"/><circle cx="90" cy="76" r="10"/>
      <circle class="graphic-surface" cx="90" cy="34" r="10"/><path d="M132 48c8 6 8 18 0 24M142 40c14 12 14 28 0 40"/>`,
    notebooks: `
      <rect class="graphic-soft" x="35" y="18" width="110" height="69" rx="8"/>
      <rect class="graphic-surface" x="44" y="27" width="92" height="51" rx="3"/>
      <path class="graphic-surface" d="M27 94h126l-9 13H36L27 94Z"/><path d="M77 99h26"/>`,
    tvs: `
      <rect class="graphic-soft" x="25" y="17" width="130" height="78" rx="9"/>
      <rect class="graphic-surface" x="34" y="26" width="112" height="60" rx="4"/>
      <path d="M70 108h40M80 95l-5 13M100 95l5 13"/>`,
    chargers: `
      <rect class="graphic-soft" x="57" y="28" width="66" height="75" rx="15"/>
      <path class="graphic-surface" d="M69 28V14M85 28V14"/>
      <path d="m96 47-15 23h13l-9 19 21-27H93l3-15Z"/>
      <path d="M90 103v8"/>`,
    cables: `
      <path class="graphic-cable" d="M47 28c-20 14-17 48 6 56 25 9 31-22 55-14 13 4 18 17 13 31"/>
      <rect class="graphic-surface" x="34" y="15" width="25" height="19" rx="5" transform="rotate(-24 34 15)"/>
      <path d="m36 17-5-10M45 13 40 3"/>
      <rect class="graphic-surface" x="111" y="96" width="27" height="17" rx="5" transform="rotate(13 111 96)"/><path d="m137 104 12 3"/>`,
    misc: `
      <path class="graphic-soft" d="m90 14 53 26-53 27-53-27 53-26Z"/>
      <path class="graphic-surface" d="m37 40 53 27 53-27v48l-53 26-53-26V40Z"/>
      <path d="M90 67v47M62 27l54 27M117 27 63 54"/>`,
  };
  return `<svg class="cluster-graphic" viewBox="0 0 180 120" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${drawings[cluster] || drawings.misc}</svg>`;
}

async function api(url, options = {}) {
  const method = options.method || 'GET';
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  if (!['GET', 'HEAD'].includes(method)) headers['X-Requested-With'] = 'estoque-web';
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(url, {
    method,
    headers,
    credentials: 'same-origin',
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && state.user && !options.keepSession) {
      state.user = null;
      renderLogin('Sua sessão expirou. Entre novamente.');
    }
    throw new ApiError(payload.error || 'Não foi possível concluir a ação.', response.status, payload.fields);
  }
  return payload;
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'toast--error' : ''}`;
  toast.innerHTML = `<span class="toast__icon">${uiIcon(type === 'error' ? 'warning' : 'check')}</span><p>${escapeHtml(message)}</p>`;
  toastRoot.append(toast);
  window.setTimeout(() => toast.remove(), 3800);
}

function setFormError(form, message = '') {
  const area = form.querySelector('[data-form-error]');
  if (!area) return;
  area.textContent = message;
  area.hidden = !message;
}

async function withBusy(button, task) {
  if (!button || button.disabled) return;
  const original = button.innerHTML;
  button.disabled = true;
  button.innerHTML = '<span class="loading-inline">Aguarde</span>';
  try {
    return await task();
  } finally {
    if (button.isConnected) {
      button.disabled = false;
      button.innerHTML = original;
    }
  }
}

async function copyText(value) {
  const text = String(value || '');
  if (!text) return;
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.append(field);
  field.select();
  const copied = document.execCommand('copy');
  field.remove();
  if (!copied) throw new Error('Não foi possível copiar o código.');
}

function authVisual() {
  return `
    <section class="auth-visual">
      <div class="auth-brand"><div class="brand-mark" aria-hidden="true"><img src="/estoque-symbol.svg" alt=""></div>Estoque</div>
      <div class="auth-copy">
        <h1>Estoque,<br>com clareza.</h1>
        <p>Produtos, pedidos e disponibilidade em uma experiência simples.</p>
        <div class="auth-feature-list" aria-label="Recursos do sistema">
          <span class="auth-feature">Estoque por material</span>
          <span class="auth-feature">Liberação automática</span>
          <span class="auth-feature">Histórico completo</span>
        </div>
      </div>
      <div class="auth-footer">Acesso seguro para gerente, vendedores e estoquistas</div>
    </section>`;
}

function renderSetup() {
  root.innerHTML = `
    <main class="auth-page">${authVisual()}
      <section class="auth-panel"><div class="auth-card">
        <p class="auth-card__eyebrow">Primeiro acesso</p><h2>Cadastre o gerente</h2>
        <p class="auth-card__intro">Esta conta terá acesso completo ao estoque, aos pedidos e aos usuários.</p>
        <form data-form="setup" novalidate>
          <div class="form-error" data-form-error hidden></div>
          <div class="form-grid form-grid--single">
            <div class="field"><label for="setup-name">Nome completo</label><input class="input" id="setup-name" name="name" autocomplete="name" maxlength="100" required placeholder="Ex.: Maria Oliveira"></div>
            <div class="field"><label for="setup-email">E-mail</label><input class="input" id="setup-email" name="email" type="email" autocomplete="email" maxlength="160" required placeholder="seuemail@empresa.com"></div>
            <div class="field"><label for="setup-password">Crie uma senha</label><input class="input" id="setup-password" name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required placeholder="No mínimo 8 caracteres"></div>
            <div class="field"><label for="setup-confirm">Confirme a senha</label><input class="input" id="setup-confirm" name="confirmPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></div>
          </div>
          <button class="btn" type="submit">Criar acesso gerencial</button>
        </form>
        <p class="auth-help">Os vendedores serão cadastrados depois, dentro do sistema.</p>
      </div></section>
    </main>`;
}

function renderLogin(message = '') {
  root.innerHTML = `
    <main class="auth-page">${authVisual()}
      <section class="auth-panel"><div class="auth-card">
        <p class="auth-card__eyebrow">Bem-vindo</p><h2>Entre na sua conta</h2>
        <p class="auth-card__intro">Use o acesso fornecido pelo gerente.</p>
        <form data-form="login" novalidate>
          <div class="form-error" data-form-error ${message ? '' : 'hidden'}>${escapeHtml(message)}</div>
          <div class="form-grid form-grid--single">
            <div class="field"><label for="login-email">E-mail</label><input class="input" id="login-email" name="email" type="email" autocomplete="email" maxlength="160" required></div>
            <div class="field"><label for="login-password">Senha</label><input class="input" id="login-password" name="password" type="password" autocomplete="current-password" maxlength="128" required></div>
          </div>
          <button class="btn" type="submit">Entrar no sistema</button>
        </form>
        <p class="auth-help">Problemas com o acesso? Solicite uma nova senha ao gerente.</p>
      </div></section>
    </main>`;
}

function navItems() {
  if (state.user.role === 'manager') {
    return [
      ['dashboard', 'home', 'Visão geral'], ['news', 'news', 'Notícias'], ['stock', 'stock', 'Estoque'], ['renova-intake', 'renova', 'Renova'], ['chips', 'sim', 'Chips'], ['requests', 'orders', 'Pedidos'],
      ['alignment', 'briefing', 'Alinhamento'], ['users', 'users', 'Usuários'], ['audit', 'history', 'Histórico'],
    ];
  }
  if (state.user.role === 'stocker') {
    return [
      ['dashboard', 'home', 'Visão do estoque'], ['news', 'news', 'Notícias'], ['stock', 'stock', 'Conferir estoque'], ['renova-intake', 'renova', 'Renova'],
      ['requests', 'orders', 'Pedidos para separar'], ['alignment', 'briefing', 'Alinhamento rápido'],
    ];
  }
  return [
    ['dashboard', 'home', 'Visão geral'], ['news', 'news', 'Notícias'], ['stock', 'stock', 'Loja / estoque'],
    ['new-request', 'plus', 'Novo pedido'], ['chips', 'sim', 'Meus chips'], ['requests', 'orders', 'Meus pedidos'],
    ['alignment', 'briefing', 'Alinhamento rápido'],
  ];
}

function renderShell() {
  const links = navItems().map(([view, icon, label]) => `
    <button class="nav-link ${state.view === view ? 'is-active' : ''}" data-action="navigate" data-view="${view}">
      <span class="nav-icon">${uiIcon(icon)}</span><span>${escapeHtml(label)}</span>
      ${view === 'requests' && state.pendingCount ? `<span class="nav-badge">${state.pendingCount}</span>` : ''}
    </button>`).join('');
  root.innerHTML = `
    <div class="app-shell">
      <button class="sidebar-overlay" data-action="close-menu" aria-label="Fechar menu"></button>
      <aside class="sidebar">
        <div class="sidebar__brand"><div class="brand-mark" aria-hidden="true"><img src="/estoque-symbol.svg" alt=""></div><div><strong>Estoque</strong><small>Loja interna</small></div></div>
        <div class="nav-label">Menu principal</div><nav class="nav-list" aria-label="Menu principal">${links}</nav>
        <div class="sidebar__spacer"></div>
        <div class="sidebar-user"><div class="avatar">${escapeHtml(initials(state.user.name))}</div><div class="sidebar-user__text"><strong>${escapeHtml(state.user.name)}</strong><span>${escapeHtml(roleLabel(state.user.role))}</span></div><button class="btn btn--ghost btn--icon btn--small" data-action="logout" title="Sair" aria-label="Sair">${uiIcon('logout')}</button></div>
      </aside>
      <main class="main">
        <header class="topbar"><div class="topbar__left"><button class="btn btn--secondary btn--icon mobile-menu" data-action="open-menu" aria-label="Abrir menu">${uiIcon('menu')}</button><h1 data-page-title>${escapeHtml(viewTitles[state.view])}</h1></div><div class="topbar__right"><span class="role-pill">${escapeHtml(roleLabel(state.user.role))}</span><button class="btn btn--secondary btn--small" data-action="password" title="Alterar senha">Senha</button></div></header>
        <section class="content" id="view-content"><div class="loading-block"><span class="loading-inline">Carregando</span></div></section>
      </main>
    </div>`;
}

function updateShellNavigation() {
  document.querySelectorAll('.nav-link').forEach((link) => link.classList.toggle('is-active', link.dataset.view === state.view));
  const title = document.querySelector('[data-page-title]');
  if (title) title.textContent = viewTitles[state.view] || 'Controle de Estoque';
  document.body.classList.remove('menu-open');
}

function emptyState(title, text, action = '') {
  return `<div class="empty-state"><div class="empty-icon">${uiIcon('box')}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p>${action}</div>`;
}

function metric(label, value, hint, style = '') {
  return `<article class="metric-card ${style}"><div class="metric-card__label"><span class="metric-dot"></span>${escapeHtml(label)}</div><strong class="metric-card__value">${escapeHtml(value)}</strong><span class="metric-card__hint">${escapeHtml(hint)}</span></article>`;
}

const teamBreakScheduleEntries = [
  { name: 'Ana', start: '11:00', end: '12:36', offset: 0, duration: 96, color: '#a983ea', colorEnd: '#ceb9ff' },
  { name: 'Thalia', start: '11:30', end: '13:06', offset: 30, duration: 96, color: '#d7931d', colorEnd: '#f2c04f' },
  { name: 'Luiz', start: '12:36', end: '14:12', offset: 96, duration: 96, color: '#218f84', colorEnd: '#55b7aa' },
  { name: 'Joice', start: '13:06', end: '14:42', offset: 126, duration: 96, color: '#9c4c9a', colorEnd: '#cc78bd' },
  { name: 'Pedro', start: '14:12', end: '15:48', offset: 192, duration: 96, color: '#4068bf', colorEnd: '#7897e2' },
];

function teamBreakSchedule(variant = 'dashboard') {
  const safeVariant = variant === 'alignment' ? 'alignment' : 'dashboard';
  const timelineMinutes = 300;
  const timeLabels = ['11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
  const rows = teamBreakScheduleEntries.map((entry) => {
    const left = ((entry.offset / timelineMinutes) * 100).toFixed(2);
    const width = ((entry.duration / timelineMinutes) * 100).toFixed(2);
    return `<div class="team-schedule__row">
      <div class="team-schedule__person"><i style="--schedule-color:${entry.color}" aria-hidden="true"></i><div><strong>${escapeHtml(entry.name)}</strong><span>1h36 fora</span></div></div>
      <div class="team-schedule__track" aria-label="${escapeHtml(entry.name)} ficará fora da loja das ${entry.start} às ${entry.end}"><span class="team-schedule__bar" style="--schedule-left:${left}%;--schedule-width:${width}%;--schedule-color:${entry.color};--schedule-color-end:${entry.colorEnd}">${escapeHtml(entry.start)} — ${escapeHtml(entry.end)}</span></div>
    </div>`;
  }).join('');
  return `<section class="team-schedule team-schedule--${safeVariant}" aria-labelledby="team-schedule-title-${safeVariant}">
    <header class="team-schedule__head">
      <div class="team-schedule__title"><span class="team-schedule__clock">${uiIcon('history')}</span><div><span>Organização da equipe</span><h3 id="team-schedule-title-${safeVariant}">Relógio de saídas</h3><p>Horários em que cada funcionário ficará fora da loja.</p></div></div>
      <div class="team-schedule__range"><span>Janela da escala</span><strong>11:00 — 15:48</strong></div>
    </header>
    <div class="team-schedule__scroll" role="region" aria-label="Linha do tempo da escala de saídas" tabindex="0">
      <div class="team-schedule__table">
        <div class="team-schedule__axis"><strong>Funcionário</strong><div>${timeLabels.map((time) => `<span>${time}</span>`).join('')}</div></div>
        ${rows}
      </div>
    </div>
    <footer class="team-schedule__coverage">
      <div class="team-schedule__safe"><span>Cobertura da loja</span><strong>Máximo de 2 pessoas fora</strong><div><b>${uiIcon('check')} Escala segura</b><small>Máx. 2 fora</small></div></div>
      <div class="team-schedule__remaining"><strong>3</strong><div><span>funcionários permanecem na loja</span><small>durante toda a escala</small></div></div>
      <p>${uiIcon('check')}<strong>Próxima saída somente após o retorno confirmado do funcionário anterior.</strong></p>
    </footer>
  </section>`;
}

function managerInventoryGroupCard(group, totalAvailable) {
  const cluster = clusterLabels[group.cluster] ? group.cluster : 'misc';
  const share = totalAvailable > 0 && group.available > 0
    ? Math.max(2, Math.round((group.available / totalAvailable) * 100))
    : 0;
  const topProducts = group.topProducts?.length
    ? `<div class="inventory-preview"><span class="inventory-preview__title">Maiores saldos</span><ul>${group.topProducts.map((product) => `<li><div><strong title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</strong><code class="mono">${escapeHtml(product.materialCode || '—')}</code></div><span>${Number(product.available)} un.</span></li>`).join('')}</ul></div>`
    : '<div class="inventory-preview inventory-preview--empty">Nenhum produto disponível neste grupo.</div>';
  const alerts = [
    group.lowStockCount > 0 ? `<span class="inventory-alert inventory-alert--warning">${Number(group.lowStockCount)} com saldo baixo</span>` : '',
    group.outOfStockCount > 0 ? `<span class="inventory-alert inventory-alert--empty">${Number(group.outOfStockCount)} sem saldo</span>` : '',
    group.incoming > 0 ? `<span class="inventory-alert inventory-alert--incoming">${Number(group.incoming)} em entrega</span>` : '',
  ].filter(Boolean).join('');

  return `<article class="inventory-group-card">
    <div class="inventory-group-card__head">
      <div class="inventory-group-icon product-visual--${cluster}">${clusterGraphic(cluster)}</div>
      <div><span>Grupo de produtos</span><h4>${escapeHtml(clusterLabels[cluster])}</h4><small>${Number(group.availableMaterials)} de ${Number(group.materialCount)} materiais com saldo</small></div>
    </div>
    <div class="inventory-group-card__numbers">
      <div class="inventory-group-card__available"><strong>${Number(group.available)}</strong><span>unidades disponíveis</span></div>
      <dl><div><dt>Materiais</dt><dd>${Number(group.materialCount)}</dd></div><div><dt>Reservadas</dt><dd>${Number(group.reserved)}</dd></div><div><dt>Em entrega</dt><dd>${Number(group.incoming || 0)}</dd></div></dl>
    </div>
    <div class="inventory-share" title="${Number(group.available)} de ${Number(totalAvailable)} unidades disponíveis"><span style="width:${share}%"></span></div>
    ${alerts ? `<div class="inventory-alerts">${alerts}</div>` : ''}
    ${topProducts}
    <button class="inventory-group-card__action" data-action="open-stock-group" data-cluster="${cluster}"><span>Ver todos os produtos</span>${uiIcon('stock')}</button>
  </article>`;
}

function managerInventoryOverview(groups = [], totalAvailable = 0) {
  const groupsByCluster = new Map(groups.map((group) => [group.cluster, group]));
  const orderedGroups = clusterOrder.map((cluster) => groupsByCluster.get(cluster)).filter(Boolean);
  if (!orderedGroups.length) return '';
  return `<section class="manager-inventory">
    <div class="manager-inventory__head">
      <div><p class="page-eyebrow">Estoque organizado</p><h3>Produtos por grupo</h3><p>Veja os saldos principais e abra somente a categoria que deseja consultar.</p></div>
      <button class="btn btn--secondary" data-action="navigate" data-view="stock">Ver estoque completo</button>
    </div>
    <div class="inventory-group-grid">${orderedGroups.map((group) => managerInventoryGroupCard(group, totalAvailable)).join('')}</div>
  </section>`;
}

function sellerInventoryGroupCard(group, totalAvailable) {
  const cluster = clusterLabels[group.cluster] ? group.cluster : 'misc';
  const share = totalAvailable > 0 && group.available > 0
    ? Math.max(2, Math.round((group.available / totalAvailable) * 100))
    : 0;
  const topProducts = group.topProducts?.length
    ? `<div class="inventory-preview"><span class="inventory-preview__title">Mais disponíveis</span><ul>${group.topProducts.map((product) => `<li><div><strong title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</strong><code class="mono">${escapeHtml(product.materialCode || '—')}</code></div><span>${Number(product.available)} un.</span></li>`).join('')}</ul></div>`
    : '<div class="inventory-preview inventory-preview--empty">Nenhum produto disponível neste grupo.</div>';
  const incomingAlert = Number(group.incoming || 0) > 0
    ? `<div class="inventory-alerts"><span class="inventory-alert inventory-alert--incoming">${Number(group.incoming)} em chegada · ${Number(group.incomingMaterialCount || 0)} material(is)</span></div>`
    : '';

  return `<article class="inventory-group-card inventory-group-card--seller">
    <div class="inventory-group-card__head">
      <div class="inventory-group-icon product-visual--${cluster}">${clusterGraphic(cluster)}</div>
      <div><span>Produtos para pedido</span><h4>${escapeHtml(clusterLabels[cluster])}</h4><small>${Number(group.materialCount)} ${Number(group.materialCount) === 1 ? 'material disponível' : 'materiais disponíveis'}</small></div>
    </div>
    <div class="inventory-group-card__numbers inventory-group-card__numbers--seller">
      <div class="inventory-group-card__available"><strong>${Number(group.available)}</strong><span>unidades disponíveis</span></div>
      <div class="inventory-group-card__materials"><strong>${Number(group.materialCount)}</strong><span>códigos materiais com saldo</span></div>
    </div>
    <div class="inventory-share" title="${Number(group.available)} de ${Number(totalAvailable)} unidades disponíveis"><span style="width:${share}%"></span></div>
    ${incomingAlert}
    ${topProducts}
    <button class="inventory-group-card__action" data-action="open-store-group" data-cluster="${cluster}"><span>Ver disponíveis e a caminho</span>${uiIcon('plus')}</button>
  </article>`;
}

function sellerInventoryOverview(groups = [], totalAvailable = 0) {
  const groupsByCluster = new Map(groups.map((group) => [group.cluster, group]));
  const orderedGroups = clusterOrder.map((cluster) => groupsByCluster.get(cluster)).filter(Boolean);
  if (!orderedGroups.length) return '';
  return `<section class="manager-inventory seller-inventory">
    <div class="manager-inventory__head">
      <div><p class="page-eyebrow">Loja organizada</p><h3>Escolha por grupo</h3><p>Consulte os saldos e abra diretamente os produtos que deseja adicionar ao pedido.</p></div>
      <button class="btn btn--secondary" data-action="navigate" data-view="new-request">Ver todos os produtos</button>
    </div>
    <div class="inventory-group-grid">${orderedGroups.map((group) => sellerInventoryGroupCard(group, totalAvailable)).join('')}</div>
  </section>`;
}

function stockerInventoryOverview(groups = [], totalAvailable = 0) {
  const groupsByCluster = new Map(groups.map((group) => [group.cluster, group]));
  const orderedGroups = clusterOrder.map((cluster) => groupsByCluster.get(cluster)).filter(Boolean);
  if (!orderedGroups.length) return '';
  return `<section class="manager-inventory stocker-inventory">
    <div class="manager-inventory__head">
      <div><p class="page-eyebrow">Mapa operacional</p><h3>Disponibilidade por grupo</h3><p>Confira saldos, reservas e materiais críticos antes de separar qualquer pedido.</p></div>
      <button class="btn btn--secondary" data-action="navigate" data-view="stock">Abrir conferência completa</button>
    </div>
    <div class="inventory-group-grid">${orderedGroups.map((group) => managerInventoryGroupCard(group, totalAvailable)).join('')}</div>
  </section>`;
}

function serialRelease(serialNumbers = [], requestStatus = '') {
  if (!serialNumbers.length) return '';
  const label = requestStatus === 'cancelled' ? 'Números de série preservados no histórico' : 'Números de série liberados';
  return `<div class="serial-release"><span>${label}</span><div class="serial-release__list">${serialNumbers.map((serialNumber) => `<code class="serial-chip mono">${escapeHtml(serialNumber)}</code>`).join('')}</div></div>`;
}

function automaticSerialRelease(item, requestStatus = '') {
  if (!item.automaticSerial) return '';
  const label = requestStatus === 'cancelled'
    ? 'Unidade devolvida automaticamente ao estoque'
    : 'Unidade baixada automaticamente pelo sistema';
  return `<div class="automatic-release">${uiIcon('check')}<span>${label}</span></div>`;
}

function requestCard(request, compact = false) {
  const totalUnits = request.items.reduce((sum, item) => sum + Number(item.quantity), 0);
  const showPrices = true;
  const items = request.items.map((item) => {
    const price = showPrices && item.unitPriceCents != null
      ? item.priceType === 'no_charge'
        ? '<div class="request-item-price"><span>Sem cobrança</span><strong>R$ 0,00</strong></div>'
        : `<div class="request-item-price"><span>${formatMoney(item.unitPriceCents)} por unidade</span><strong>${formatMoney(item.lineTotalCents)}</strong></div>`
      : '';
    return `<li><div><strong>${escapeHtml(item.productName)}</strong>${materialInline(item.materialCode)}${price}${automaticSerialRelease(item, request.status)}${serialRelease(item.serialNumbers, request.status)}</div><span class="item-quantity">${Number(item.quantity)} un.</span></li>`;
  }).join('');
  const pricing = showPrices && request.pricing
    ? `<div class="request-pricing-summary">${request.pricing.category ? `<div><span>Categoria do plano</span><strong>${escapeHtml(request.pricing.category)}</strong></div>` : ''}${request.pricing.renova ? `<div class="request-renova"><span>Vivo Renova · ${escapeHtml(request.pricing.renova.usedDevice || 'aparelho usado')} · ${request.pricing.renova.condition === 'defeituoso' ? 'Defeituoso' : 'Bom'}</span><strong>− ${formatMoney(request.pricing.renova.discountCents)}</strong><small>Bônus ${formatMoney(request.pricing.renova.manufacturerBonusCents)} + voucher ASSURANT ${formatMoney(request.pricing.renova.voucherCents)}</small></div>` : ''}<div><span>Total do pedido</span><strong>${formatMoney(request.pricing.orderTotalCents)}</strong></div><small>Preços registrados no pedido · tabela de ${escapeHtml(request.pricing.tableDate || 'data preservada')}</small></div>`
    : '';
  const sellerAction = state.user.role === 'seller' && request.status === 'pending' ? `<div class="request-card__actions"><button class="btn btn--danger btn--small" data-action="cancel-request" data-id="${escapeHtml(request.id)}">Cancelar pedido</button></div>` : '';
  const managerAction = state.user.role === 'manager' && ['pending', 'approved'].includes(request.status) && !compact
    ? `<div class="request-card__actions"><button class="btn btn--danger btn--small" data-action="cancel-request" data-id="${escapeHtml(request.id)}">Cancelar e devolver ao estoque</button></div>`
    : '';
  const stockerAction = state.user.role === 'stocker' && ['pending', 'approved'].includes(request.status) && !compact
    ? `<div class="request-card__actions"><button class="btn btn--danger btn--small" data-action="cancel-request" data-id="${escapeHtml(request.id)}">Cancelar e devolver ao estoque</button></div>`
    : '';
  return `<article class="request-card ${compact ? 'request-card--compact' : ''} ${state.user.role === 'stocker' ? 'request-card--stocker' : ''}"><div class="request-card__head"><div><span class="request-code">Pedido #${escapeHtml(requestCode(request.id))}</span><strong>${escapeHtml(request.seller.name)}</strong><span class="request-meta">${formatDate(request.createdAt)} · ${totalUnits} ${totalUnits === 1 ? 'unidade' : 'unidades'}</span></div>${statusBadge(request.status)}</div><ul class="request-items">${items}</ul>${pricing}${request.notes ? `<p class="request-note"><strong>Observação:</strong> ${escapeHtml(request.notes)}</p>` : ''}${request.decisionNote ? `<p class="request-note"><strong>Processamento:</strong> ${escapeHtml(request.decisionNote)}</p>` : ''}${sellerAction}${managerAction}${stockerAction}</article>`;
}

function managementClusterChart(groups = []) {
  const maxUnits = Math.max(1, ...groups.map((group) => Number(group.available) + Number(group.incoming || 0)));
  return `<div class="stock-chart">${groups.map((group) => {
    const availableWidth = Math.round((Number(group.available) / maxUnits) * 100);
    const incomingWidth = Math.round((Number(group.incoming || 0) / maxUnits) * 100);
    return `<div class="stock-chart__row"><div class="stock-chart__label"><span>${escapeHtml(clusterLabels[group.cluster] || clusterLabels.misc)}</span><small>${Number(group.available)} disponíveis${Number(group.incoming || 0) ? ` · ${Number(group.incoming)} em entrega` : ''}</small></div><div class="stock-chart__track"><span class="stock-chart__available" style="width:${availableWidth}%"></span><span class="stock-chart__incoming" style="width:${incomingWidth}%"></span></div></div>`;
  }).join('')}</div>`;
}

function orderDonut(stats = {}) {
  const approved = Number(stats.approved || 0);
  const rejected = Number(stats.rejected || 0);
  const cancelled = Number(stats.cancelled || 0);
  const pending = Number(stats.pending || 0);
  const total = approved + rejected + cancelled + pending;
  const approvedEnd = total ? (approved / total) * 100 : 0;
  const rejectedEnd = total ? approvedEnd + (rejected / total) * 100 : 0;
  const cancelledEnd = total ? rejectedEnd + (cancelled / total) * 100 : 0;
  const style = total
    ? `background:conic-gradient(#48d89b 0 ${approvedEnd}%,#ff6075 ${approvedEnd}% ${rejectedEnd}%,#74747f ${rejectedEnd}% ${cancelledEnd}%,#ffb75c ${cancelledEnd}% 100%)`
    : 'background:#29292e';
  return `<div class="order-chart"><div class="order-donut" style="${style}"><div><strong>${total}</strong><span>pedidos</span></div></div><div class="order-legend"><span class="is-approved"><b>${approved}</b> liberados</span><span class="is-rejected"><b>${rejected}</b> recusados</span><span class="is-cancelled"><b>${cancelled}</b> cancelados</span><span class="is-pending"><b>${pending}</b> pendentes</span></div></div>`;
}

function managementProductList(products = [], emptyTitle, emptyText, valueKey = '') {
  if (!products.length) return emptyState(emptyTitle, emptyText);
  return `<ul class="management-product-list">${products.map((product) => `<li><div><strong>${escapeHtml(product.name)}</strong><code class="mono">${escapeHtml(product.materialCode || '—')}</code>${valueKey === 'incoming' ? `<small>${escapeHtml(incomingDepositsText(product.incomingDeposits))}</small>` : ''}</div>${valueKey ? `<span>${Number(product[valueKey] || 0)} un.</span>` : `<span>${escapeHtml(clusterLabels[product.cluster] || clusterLabels.misc)}</span>`}</li>`).join('')}</ul>`;
}

function recentAccessList(accesses = []) {
  if (!accesses.length) return emptyState('Nenhum acesso recente', 'Os próximos logins aparecerão aqui.');
  return `<ul class="access-list">${accesses.map((access) => `<li><div class="avatar avatar--small">${escapeHtml(initials(access.name))}</div><div><strong>${escapeHtml(access.name)}</strong><span>${escapeHtml(roleLabel(access.role))}${access.email ? ` · ${escapeHtml(access.email)}` : ''}</span></div><time>${formatDate(access.createdAt)}</time></li>`).join('')}</ul>`;
}

async function renderDashboard() {
  const content = document.querySelector('#view-content');
  const data = await api('/api/dashboard');
  state.pendingCount = state.user.role === 'manager'
    ? data.pendingRequests
    : state.user.role === 'stocker'
      ? data.readyRequests
      : data.requests.pending;
  renderShellBadge();
  if (state.user.role === 'manager') {
    const management = data.management || {};
    const snapshotText = management.snapshot?.date
      ? `Atualizado em ${formatDate(`${management.snapshot.date}T12:00:00.000Z`, false)} · ${management.snapshot.source || 'planilha de estoque'}`
      : 'Atualizado pela planilha de estoque';
    content.innerHTML = `
      <div class="page-heading"><div><p class="page-eyebrow">Central administrativa</p><h2>Olá, ${escapeHtml(state.user.name.split(' ')[0])}</h2><p>${escapeHtml(snapshotText)}. Pedidos e IMEIs são liberados automaticamente.</p></div><div class="page-actions"><button class="btn" data-action="navigate" data-view="stock">Consultar estoque</button></div></div>
      ${teamBreakSchedule('dashboard')}
      <div class="metrics-grid">${metric('Itens disponíveis', data.stock.available, `${data.modelsAvailable} materiais com saldo`, 'metric-card--success')}${metric('Materiais em falta', management.outOfStockMaterials || 0, 'Sem saldo e sem chegada prevista', 'metric-card--warning')}${metric('Saldo baixo', management.lowStockMaterials || 0, 'Materiais com até 2 unidades', 'metric-card--info')}${metric('Em chegada', management.incomingUnits || 0, `Depósitos ${management.snapshot?.incomingDeposits || 'DEPS e NREM'}`)}</div>
      <div class="admin-strip"><span><b>${Number(data.activeSellers || 0)}</b> vendedores ativos</span><span><b>${Number(data.activeStockers || 0)}</b> estoquistas ativos</span><span><b>${Number(management.orderStats?.approved || 0)}</b> pedidos liberados</span><span><b>${Number(data.stock.reserved || 0)}</b> unidades reservadas</span></div>
      <div class="management-dashboard-grid">
        <section class="card management-chart-card"><div class="card__head"><div><h3>Disponibilidade por grupo</h3><span>Comparação do saldo pronto e em entrega</span></div></div><div class="card__body">${managementClusterChart(data.inventoryGroups)}</div></section>
        <section class="card management-chart-card"><div class="card__head"><div><h3>Fluxo de pedidos</h3><span>Distribuição de todo o histórico</span></div></div><div class="card__body">${orderDonut(management.orderStats)}</div></section>
        <section class="card management-list-card"><div class="card__head"><div><h3>Produtos em falta</h3><span>${Number(management.outOfStockMaterials || 0)} materiais sem saldo</span></div><button class="btn btn--ghost btn--small" data-action="navigate" data-view="stock">Ver estoque</button></div><div class="card__body">${managementProductList(management.shortageProducts, 'Nenhum produto em falta', 'Todos os produtos monitorados possuem saldo ou entrega prevista.')}</div></section>
        <section class="card management-list-card"><div class="card__head"><div><h3>Produtos a caminho</h3><span>Itens dos depósitos DEPS e NREM — ainda fora do saldo vendável</span></div></div><div class="card__body">${managementProductList(management.incomingProducts, 'Nenhum item a caminho', 'A planilha atual não possui unidades em DEPS ou NREM.', 'incoming')}</div></section>
      </div>
      ${managerInventoryOverview(data.inventoryGroups, data.stock.available)}
      <div class="dashboard-grid"><section class="card"><div class="card__head"><div><h3>Acessos recentes</h3><span>Login da equipe</span></div><button class="btn btn--ghost btn--small" data-action="navigate" data-view="audit">Histórico completo</button></div><div class="card__body">${recentAccessList(management.recentAccesses)}</div></section><section class="card"><div class="card__head"><h3>Pedidos recentes</h3><button class="btn btn--ghost btn--small" data-action="navigate" data-view="requests">Ver todos</button></div><div class="card-list">${data.recentRequests.length ? data.recentRequests.map((item) => requestCard(item, true)).join('') : emptyState('Nenhum pedido', 'As solicitações aparecerão aqui.')}</div></section></div>`;
  } else if (state.user.role === 'stocker') {
    const outOfStock = (data.inventoryGroups || []).reduce((sum, group) => sum + Number(group.outOfStockCount || 0), 0);
    content.innerHTML = `
      <div class="page-heading"><div><p class="page-eyebrow">Central operacional</p><h2>Olá, ${escapeHtml(state.user.name.split(' ')[0])}</h2><p>Confira disponibilidade, preços e pedidos antes de movimentar qualquer item.</p></div><div class="page-actions"><button class="btn" data-action="navigate" data-view="stock">Conferir estoque</button><button class="btn btn--secondary" data-action="navigate" data-view="requests">Ver pedidos</button></div></div>
      ${teamBreakSchedule('dashboard')}
      <div class="metrics-grid">${metric('Disponíveis agora', data.stock.available, `${data.modelsAvailable} materiais com saldo`, 'metric-card--success')}${metric('Pedidos para separar', data.readyRequests || 0, 'Podem ser cancelados com devolução automática', 'metric-card--info')}${metric('Unidades reservadas', data.stock.reserved || 0, 'Saldo comprometido em pedidos')}${metric('Em chegada', data.stock.incoming || 0, `${outOfStock} materiais sem saldo · DEPS/NREM`, 'metric-card--warning')}</div>
      ${stockerInventoryOverview(data.inventoryGroups, data.stock.available)}
      <section class="card management-list-card"><div class="card__head"><div><h3>Produtos a caminho</h3><span>Consulta de DEPS e NREM — ainda fora do saldo vendável</span></div><button class="btn btn--ghost btn--small" data-action="navigate" data-view="stock">Ver estoque</button></div><div class="card__body">${managementProductList(data.incomingProducts, 'Nenhum item a caminho', 'A planilha atual não possui unidades em DEPS ou NREM.', 'incoming')}</div></section>
      <section class="card"><div class="card__head"><div><h3>Próximos pedidos para separar</h3><span>IMEIs, códigos materiais e valores registrados</span></div><button class="btn btn--ghost btn--small" data-action="navigate" data-view="requests">Ver todos</button></div><div class="card-list">${data.recentRequests.length ? data.recentRequests.map((item) => requestCard(item, true)).join('') : emptyState('Nenhum pedido para separar', 'Os próximos pedidos liberados aparecerão aqui.')}</div></section>`;
  } else {
    content.innerHTML = `
      <div class="page-heading"><div><p class="page-eyebrow">Sua área</p><h2>Olá, ${escapeHtml(state.user.name.split(' ')[0])}</h2><p>Escolha os produtos disponíveis e envie seu pedido.</p></div><button class="btn" data-action="navigate" data-view="new-request">+ Novo pedido</button></div>
      ${teamBreakSchedule('dashboard')}
      <div class="metrics-grid">${metric('Itens disponíveis', data.stock.available, `${data.modelsAvailable} materiais disponíveis`, 'metric-card--success')}${metric('Pedidos liberados', data.requests.approved, 'Com IMEI definido automaticamente', 'metric-card--info')}${metric('Pedidos recusados', data.requests.rejected, 'Somente quando não há estoque', 'metric-card--warning')}${metric('Em chegada', data.stock.incoming || 0, 'Produtos em DEPS e NREM')}</div>
      ${sellerInventoryOverview(data.inventoryGroups, data.stock.available)}
      <section class="card management-list-card"><div class="card__head"><div><h3>Produtos a caminho</h3><span>Consulte o que está previsto para chegar à loja</span></div><button class="btn btn--ghost btn--small" data-action="navigate" data-view="new-request">Abrir loja</button></div><div class="card__body">${managementProductList(data.incomingProducts, 'Nenhum item a caminho', 'A planilha atual não possui unidades em DEPS ou NREM.', 'incoming')}</div></section>
      <section class="card"><div class="card__head"><h3>Meus pedidos recentes</h3><button class="btn btn--ghost btn--small" data-action="navigate" data-view="requests">Ver todos</button></div><div class="card-list">${data.recentRequests.length ? data.recentRequests.map((item) => requestCard(item, true)).join('') : emptyState('Nenhum pedido', 'Crie seu primeiro pedido para começar.')}</div></section>`;
  }
}

function renderShellBadge() {
  const link = document.querySelector('.nav-link[data-view="requests"]');
  if (!link) return;
  let badge = link.querySelector('.nav-badge');
  if (!state.pendingCount) {
    badge?.remove();
    return;
  }
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'nav-badge';
    link.append(badge);
  }
  badge.textContent = state.pendingCount;
}

function productVisual(product) {
  const cluster = clusterLabels[product.cluster] ? product.cluster : 'misc';
  return `<div class="product-visual product-visual--${cluster}">${clusterGraphic(cluster)}<span class="product-visual__label">${escapeHtml(clusterLabels[cluster])}</span></div>`;
}

const PRODUCT_IMAGE_FALLBACK = '/estoque-symbol.svg';

const PRODUCT_PHOTO_FALLBACKS = Object.freeze({
  devicesApple: 'https://d1j48ryyrcdvj8.cloudfront.net/Custom/Content/Products/10/78/107879_iphone-17-apple-256gb-tela-6-3-camera-fusion-ultra-angular-de-48mp-e-selfie-18mp-preto_m1_639050158873811743.webp',
  devicesSamsung: 'https://d1j48ryyrcdvj8.cloudfront.net/Custom/Content/Products/10/95/109582_smartphone-samsung-galaxy-s26-sm-s947b-512gb-12gb-tela-6-7_m9_639113298997883199.webp',
  devicesMotorola: 'https://d1j48ryyrcdvj8.cloudfront.net/Custom/Content/Products/11/11/111174_celular-motorola-g47-256gb-pbcg0012br-grafite_m7_639174546855700550.webp',
  cases: 'https://cdn.awsli.com.br/2500x2500/2739/2739882/produto/398933652/d8e6dbeb3bddf31c7cade05e8ef29b19-yj5uwg8ie8.jpg',
  screen_protectors: 'https://images.tcdn.com.br/img/img_prod/1249456/pelicula_tpu_transparente_para_celular_relogio_gshield_1733_1_5537a50aa656a57252475fe30c5b3352.jpg',
  speakers: 'https://d3alv7ekdacjys.cloudfront.net/Custom/Content/Products/11/94/1194150_caixa-de-som-waaw-us-200sb-duo-a-prova-dagua-20w-rms-preto-bivolt-ms_z2_638106832605974375.jpg',
  chargers: 'https://img.kalunga.com.br/fotosdeprodutos/745447z.jpg',
  cables: 'https://dor03phawg286.cloudfront.net/Custom/Content/Products/10/42/1042441_cabo-usb-c-i2go-1-2m-2-4a-pvc-flexivel-flat-preto_m5_638187203343731598.jpg',
  misc: 'https://images2.kabum.com.br/produtos/fotos/385192/console-nintendo-switch-oled-com-joy-con-branco-hbgskaaa2_1663593563_gg.jpg',
});

function productImageUrl(produto) {
  const imageUrl = typeof produto?.imagem_url === 'string' ? produto.imagem_url.trim() : '';
  return imageUrl || PRODUCT_IMAGE_FALLBACK;
}

function productPhotoFallbackUrl(produto) {
  const cluster = clusterLabels[produto?.cluster] ? produto.cluster : 'misc';
  if (cluster !== 'devices') return PRODUCT_PHOTO_FALLBACKS[cluster] || PRODUCT_PHOTO_FALLBACKS.misc;
  const brand = String(produto?.brand || produto?.marca || '').toLowerCase();
  if (brand.includes('apple')) return PRODUCT_PHOTO_FALLBACKS.devicesApple;
  if (brand.includes('motorola')) return PRODUCT_PHOTO_FALLBACKS.devicesMotorola;
  return PRODUCT_PHOTO_FALLBACKS.devicesSamsung;
}

function productImageMarkup(produto, className, width, height) {
  return `<img src="${escapeHtml(productImageUrl(produto))}" alt="${escapeHtml(produto.nome || produto.name || 'Produto')}" class="${escapeHtml(className)}" width="${width}" height="${height}" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-product-image="true" data-photo-fallback="${escapeHtml(productPhotoFallbackUrl(produto))}">`;
}

function handleProductImageError(event) {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || image.dataset.productImage !== 'true') return;
  if (image.dataset.fallbackApplied === 'photo') {
    image.dataset.fallbackApplied = 'symbol';
    image.classList.add('is-fallback');
    image.alt = '';
    image.src = PRODUCT_IMAGE_FALLBACK;
    return;
  }
  if (image.dataset.fallbackApplied === 'symbol') {
    image.hidden = true;
    return;
  }
  image.dataset.fallbackApplied = 'photo';
  image.src = image.dataset.photoFallback || PRODUCT_IMAGE_FALLBACK;
}

function productImageMedia(produto) {
  const cluster = clusterLabels[produto.cluster] ? produto.cluster : 'misc';
  const imagem = productImageMarkup(produto, 'product-image-media__image', 480, 316);
  return `<div class="product-image-media product-image-media--${cluster}">${imagem}<span class="product-image-media__label">${escapeHtml(clusterLabels[cluster])}</span></div>`;
}

function materialCode(product) {
  return product.variants[0]?.materialCode || product.variants[0]?.sku || '';
}

function materialInline(code) {
  return `<span class="material-inline"><small>Código material</small><code class="mono">${escapeHtml(code || '—')}</code></span>`;
}

function materialCodeBox(code, copyable = false) {
  const safeCode = escapeHtml(code || '—');
  const copyButton = copyable && code ? `<button type="button" class="material-copy" data-action="copy-material" data-code="${safeCode}" aria-label="Copiar código material ${safeCode}" title="Copiar código">${uiIcon('copy')}</button>` : '';
  return `<div class="material-code-box"><span class="material-code-box__label">Código material</span><div class="material-code-box__value"><code class="mono">${safeCode}</code>${copyButton}</div></div>`;
}

function incomingDepositsText(deposits = {}) {
  const entries = Object.entries(deposits || {})
    .map(([deposit, quantity]) => [String(deposit).trim().toUpperCase(), Number(quantity)])
    .filter(([deposit, quantity]) => deposit && Number.isInteger(quantity) && quantity > 0)
    .sort(([left], [right]) => left.localeCompare(right, 'pt-BR'));
  return entries.length
    ? entries.map(([deposit, quantity]) => `${deposit}: ${quantity} un.`).join(' · ')
    : 'DEPS/NREM';
}

function incomingCatalogSection() {
  const products = filteredCatalog()
    .filter((product) => Number(product.incoming || 0) > 0)
    .sort((left, right) => Number(right.incoming) - Number(left.incoming)
      || left.name.localeCompare(right.name, 'pt-BR'));
  if (!products.length) return '';
  return `<section class="incoming-showcase" aria-labelledby="incoming-showcase-title">
    <div class="incoming-showcase__head"><div><span>Próximas entradas</span><h3 id="incoming-showcase-title">Produtos a caminho</h3><p>Itens identificados em DEPS ou NREM. Eles aparecem para consulta, mas só poderão ser vendidos após entrarem no saldo disponível.</p></div><strong>${products.reduce((sum, product) => sum + Number(product.incoming || 0), 0)} un.</strong></div>
    <div class="incoming-showcase__grid">${products.map((product) => `<article class="incoming-product-card">${productImageMarkup(product, 'incoming-product-card__image', 72, 72)}<div><span>${escapeHtml(clusterLabels[product.cluster] || clusterLabels.misc)}</span><h4>${escapeHtml(product.name)}</h4><code class="mono">${escapeHtml(materialCode(product) || '—')}</code><small>${escapeHtml(incomingDepositsText(product.incomingDeposits))}</small></div><div class="incoming-product-card__quantity"><strong>${Number(product.incoming || 0)}</strong><span>em chegada</span></div></article>`).join('')}</div>
  </section>`;
}

function renderIncomingCa…24816 tokens truncated…ield--full"><label for="news-title">Título</label><input class="input" id="news-title" name="title" maxlength="120" minlength="3" required value="${escapeHtml(item?.title || '')}" placeholder="Ex.: Oferta especial deste fim de semana"></div>
      <div class="field field--full"><label for="news-category">Tipo</label><select class="select" id="news-category" name="category" required><option value="promotion" ${item?.category === 'promotion' ? 'selected' : ''}>Promoção</option><option value="notice" ${!item || item.category === 'notice' ? 'selected' : ''}>Comunicado</option><option value="update" ${item?.category === 'update' ? 'selected' : ''}>Novidade</option></select></div>
      <div class="field field--full"><label for="news-validity">Vigência <span class="request-meta">(opcional)</span></label><input class="input" id="news-validity" name="validityLabel" maxlength="80" value="${escapeHtml(item?.validityLabel || '')}" placeholder="Ex.: Até 10/08/2026"></div>
      <div class="field field--full"><label for="news-body">Conteúdo</label><textarea class="textarea news-editor" id="news-body" name="body" maxlength="2500" minlength="3" required placeholder="Escreva as condições, datas ou orientações importantes...">${escapeHtml(item?.body || '')}</textarea><p class="field-hint">Até 2.500 caracteres. Você pode separar o texto em parágrafos.</p></div>
      <div class="news-format-help field--full"><strong>Formatação rápida</strong><span><code>## Título da seção</code> cria uma seção</span><span><code>• Produto — R$ 99</code> cria uma linha com preço</span><span><code>! Observação</code> cria um aviso</span></div>
    </div></div>
    <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn">${item ? 'Salvar alterações' : 'Publicar agora'}</button></div>
  </form>`, { wide: true });
}


function renovaIntakeModal(item = null) {
  const today = localDateValue();
  const devices = state.renovaCatalog.devices || [];
  const deviceOptions = devices.map((device) => `<option value="${escapeHtml(device.name)}" label="${escapeHtml([device.manufacturer, device.productType].filter(Boolean).join(' · '))}"></option>`).join('');
  showModal(`<form data-form="${item ? 'edit-renova-intake' : 'create-renova-intake'}" data-id="${escapeHtml(item?.id || '')}" novalidate>
    <div class="modal__head"><div><h2>${item ? 'Editar aparelho do Renova' : 'Cadastrar aparelho recebido'}</h2><p>Busque e selecione o aparelho na mesma lista usada pelo Vivo Renova.</p></div>${modalCloseButton()}</div>
    <div class="modal__body"><div class="form-error" data-form-error hidden></div><div class="form-grid">
      <div class="field field--full"><label for="renova-intake-model">Buscar aparelho</label><input class="input" id="renova-intake-model" name="model" type="search" list="renova-intake-device-options" autocomplete="off" minlength="2" maxlength="120" required value="${escapeHtml(item?.model || '')}" placeholder="Digite parte da marca ou do modelo"><datalist id="renova-intake-device-options">${deviceOptions}</datalist><small class="field-hint">Digite algumas letras e escolha uma das ${devices.length} opções do Vivo Renova.</small></div>
      <div class="field field--full"><label for="renova-intake-imei">IMEI do aparelho</label><input class="input mono" id="renova-intake-imei" name="imei" inputmode="numeric" pattern="[0-9]{15}" minlength="15" maxlength="15" required value="${escapeHtml(item?.imei || '')}" placeholder="Digite os 15 números do IMEI"><small class="field-hint">O IMEI deve ter exatamente 15 dígitos e não pode estar em outro cadastro.</small></div>
      <div class="field"><label for="renova-intake-received-on">Data de recebimento</label><input class="input" id="renova-intake-received-on" name="receivedOn" type="date" max="${today}" required value="${escapeHtml(item?.receivedOn || today)}"></div>
      <div class="field"><label for="renova-intake-pickup-on">Data de retirada <span class="request-meta">(opcional)</span></label><input class="input" id="renova-intake-pickup-on" name="pickupOn" type="date" max="${today}" value="${escapeHtml(item?.pickupOn || '')}"><small class="field-hint">Deixe em branco enquanto o aparelho estiver na loja.</small></div>
    </div></div>
    <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn">${item ? 'Salvar alterações' : 'Cadastrar aparelho'}</button></div>
  </form>`);
}

function renovaIntakePickupModal(item) {
  if (!item) return;
  const today = localDateValue();
  showModal(`<form data-form="pickup-renova-intake" data-id="${escapeHtml(item.id)}" novalidate>
    <div class="modal__head"><div><h2>Registrar retirada</h2><p>${escapeHtml(item.registrationCode || '#---')} · ${escapeHtml(item.model)}</p></div>${modalCloseButton()}</div>
    <div class="modal__body"><div class="form-error" data-form-error hidden></div><div class="renova-intake-pickup-summary">${uiIcon('renova')}<div><span>Recebido em ${escapeHtml(formatDateOnly(item.receivedOn))}</span><strong>Aparelho aguardando coleta</strong></div></div><div class="field"><label for="renova-pickup-date">Data da retirada pela empresa</label><input class="input" id="renova-pickup-date" name="pickupOn" type="date" min="${escapeHtml(item.receivedOn)}" max="${today}" value="${today}" required></div></div>
    <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn">Confirmar retirada</button></div>
  </form>`, { small: true });
}

function renovaIntakeDeleteModal(item) {
  if (!item) return;
  showModal(`<form data-form="delete-renova-intake" data-id="${escapeHtml(item.id)}">
    <div class="modal__head"><div><h2>Excluir aparelho?</h2><p>Esta ação remove o cadastro da lista do Renova.</p></div>${modalCloseButton()}</div>
    <div class="modal__body"><div class="form-error" data-form-error hidden></div><div class="chip-confirmation"><span>Aparelho ${escapeHtml(item.registrationCode || '#---')}</span><strong>${escapeHtml(item.model)}</strong><code class="mono">IMEI: ${escapeHtml(item.imei || 'não informado')}</code></div><p>O registro deixará de aparecer no acompanhamento. A exclusão continuará registrada no histórico de auditoria.</p></div>
    <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn btn--danger">Excluir definitivamente</button></div>
  </form>`, { small: true });
}

function cancelChipCandidateLookup() {
  chipCandidateRequest += 1;
  window.clearTimeout(chipCandidateTimer);
  chipCandidateTimer = 0;
}

function renderChipMaterialOptions() {
  const form = modalRoot.querySelector('form[data-form="create-chip"]');
  const target = form?.querySelector('[data-chip-materials]');
  if (!form || !target) return;
  const selectedCode = String(form.elements.materialCode?.value || '');
  const search = String(form.querySelector('[data-action="chip-material-search"]')?.value || '')
    .trim().toLocaleUpperCase('pt-BR');
  const materials = state.chipMaterials.filter((material) => !search || [material.name, material.materialCode, material.brand]
    .some((value) => String(value || '').toLocaleUpperCase('pt-BR').includes(search)));
  target.innerHTML = materials.length ? materials.map((material) => `
    <button type="button" class="chip-material-option ${selectedCode === material.materialCode ? 'is-selected' : ''}" data-action="select-chip-material" data-material-code="${escapeHtml(material.materialCode)}" aria-pressed="${selectedCode === material.materialCode}">
      <span><strong>${escapeHtml(material.name)}</strong><code class="mono">${escapeHtml(material.materialCode)}</code></span>
      <b>${Number(material.availableCount)}<small>livres</small></b>
    </button>`).join('') : '<div class="chip-picker-empty"><strong>Nenhum material encontrado</strong><span>Limpe a busca ou atualize o estoque.</span></div>';
}

function resetChipCandidateResults(message = 'Escolha o material e informe os 6 últimos dígitos.') {
  chipCandidateRequest += 1;
  const form = modalRoot.querySelector('form[data-form="create-chip"]');
  if (!form) return;
  form.elements.inventorySerialId.value = '';
  const addButton = form.querySelector('[data-action="add-chip-to-batch"]');
  if (addButton) addButton.disabled = true;
  const target = form.querySelector('[data-chip-candidates]');
  if (target) target.innerHTML = `<div class="chip-candidate-message">${uiIcon('sim')}<span>${escapeHtml(message)}</span></div>`;
}

function selectChipMaterial(materialCode) {
  const form = modalRoot.querySelector('form[data-form="create-chip"]');
  const material = state.chipMaterials.find((item) => item.materialCode === materialCode);
  if (!form || !material) return;
  form.elements.materialCode.value = material.materialCode;
  renderChipMaterialOptions();
  resetChipCandidateResults(`${material.name} selecionado. Agora informe o final do ICCID.`);
  form.elements.iccidSuffix.focus();
}

function selectChipCandidate(inventorySerialId) {
  const form = modalRoot.querySelector('form[data-form="create-chip"]');
  if (!form) return;
  const selected = form.querySelector(`[data-chip-candidate-id="${CSS.escape(String(inventorySerialId))}"]`);
  if (!selected) return;
  form.elements.inventorySerialId.value = String(inventorySerialId);
  form.querySelectorAll('[data-chip-candidate-id]').forEach((option) => {
    const active = option === selected;
    option.classList.toggle('is-selected', active);
    option.setAttribute('aria-pressed', String(active));
  });
  const addButton = form.querySelector('[data-action="add-chip-to-batch"]');
  if (addButton) addButton.disabled = false;
  const summary = form.querySelector('[data-chip-candidate-summary]');
  if (summary) summary.textContent = `ICCID final ${selected.dataset.iccidSuffix} selecionado. Adicione-o à fila.`;
}

async function searchChipCandidates() {
  const form = modalRoot.querySelector('form[data-form="create-chip"]');
  if (!form) return;
  const materialCode = String(form.elements.materialCode.value || '');
  const suffix = String(form.elements.iccidSuffix.value || '').replace(/\D/g, '').slice(0, 6);
  form.elements.iccidSuffix.value = suffix;
  if (!materialCode) return resetChipCandidateResults('Selecione primeiro um dos materiais disponíveis.');
  if (suffix.length !== 6) return resetChipCandidateResults('Digite exatamente os 6 últimos números do ICCID.');
  const target = form.querySelector('[data-chip-candidates]');
  form.elements.inventorySerialId.value = '';
  const addButton = form.querySelector('[data-action="add-chip-to-batch"]');
  if (addButton) addButton.disabled = true;
  const requestId = ++chipCandidateRequest;
  target.innerHTML = '<div class="chip-candidate-message"><span class="loading-inline">Buscando no estoque</span></div>';
  try {
    const data = await api(`/api/chips/candidates?materialCode=${encodeURIComponent(materialCode)}&suffix=${encodeURIComponent(suffix)}`);
    if (requestId !== chipCandidateRequest || !modalRoot.contains(form)) return;
    const candidates = (data.candidates || []).filter((candidate) => !chipBatchItems
      .some((item) => item.inventorySerialId === Number(candidate.inventorySerialId)));
    if (!candidates.length) {
      target.innerHTML = `<div class="chip-candidate-message chip-candidate-message--empty">${uiIcon('warning')}<span><strong>Nenhuma correspondência livre</strong>Não há ICCID deste material terminando em ${escapeHtml(suffix)}. Confira os números ou escolha outro material.</span></div>`;
      return;
    }
    const heading = candidates.length === 1
      ? 'Correspondência identificada automaticamente'
      : `${candidates.length} correspondências encontradas · selecione a correta`;
    target.innerHTML = `<div class="chip-candidate-heading"><strong>${escapeHtml(heading)}</strong><span data-chip-candidate-summary>${candidates.length === 1 ? 'Confira o ICCID completo antes de cadastrar.' : 'Compare o código do chip com as opções abaixo.'}</span></div><div class="chip-candidate-list">${candidates.map((candidate) => {
      const prefix = candidate.iccid.slice(0, -6);
      return `<button type="button" class="chip-candidate-option" data-action="select-chip-candidate" data-chip-candidate-id="${candidate.inventorySerialId}" data-iccid-suffix="${escapeHtml(candidate.suffix)}" data-chip-iccid="${escapeHtml(candidate.iccid)}" data-material-code="${escapeHtml(candidate.materialCode)}" data-material-name="${escapeHtml(candidate.materialName)}" aria-pressed="false"><span><small>ICCID disponível</small><code class="mono">${escapeHtml(prefix)}<mark>${escapeHtml(candidate.suffix)}</mark></code></span><b>Selecionar</b></button>`;
    }).join('')}</div>`;
    if (candidates.length === 1) selectChipCandidate(candidates[0].inventorySerialId);
  } catch (error) {
    if (requestId !== chipCandidateRequest || !modalRoot.contains(form)) return;
    target.innerHTML = `<div class="chip-candidate-message chip-candidate-message--empty">${uiIcon('warning')}<span><strong>Não foi possível buscar</strong>${escapeHtml(error.message || 'Tente novamente.')}</span></div>`;
  }
}

function queueChipCandidateSearch() {
  window.clearTimeout(chipCandidateTimer);
  const form = modalRoot.querySelector('form[data-form="create-chip"]');
  if (!form) return;
  const suffix = String(form.elements.iccidSuffix.value || '').replace(/\D/g, '').slice(0, 6);
  form.elements.iccidSuffix.value = suffix;
  resetChipCandidateResults(suffix.length
    ? `Continue digitando: ${suffix.length} de 6 números informados.`
    : 'Informe os 6 últimos números impressos no chip.');
  if (suffix.length === 6 && form.elements.materialCode.value) {
    chipCandidateTimer = window.setTimeout(searchChipCandidates, 280);
  }
}

function renderChipBatchQueue() {
  const form = modalRoot.querySelector('form[data-form="create-chip"]');
  const target = form?.querySelector('[data-chip-batch]');
  if (!form || !target) return;
  const sellerSelect = form.elements.sellerId;
  const batchSellerId = Number(form.dataset.batchSellerId || sellerSelect.value || 0);
  const seller = state.chipSellers.find((item) => item.id === batchSellerId);
  sellerSelect.disabled = chipBatchItems.length > 0;
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = !chipBatchItems.length;
  submit.textContent = chipBatchItems.length
    ? `Cadastrar ${chipBatchItems.length} ${chipBatchItems.length === 1 ? 'chip' : 'chips'}`
    : 'Cadastre chips na fila';
  if (!chipBatchItems.length) {
    delete form.dataset.batchSellerId;
    target.innerHTML = `<div class="chip-batch-empty">${uiIcon('sim')}<span><strong>A fila está vazia</strong>Identifique um ICCID e use “Adicionar à fila”.</span></div>`;
    return;
  }
  const remaining = Math.max(0, state.chipLimit - Number(seller?.availableCount || 0) - chipBatchItems.length);
  target.innerHTML = `<div class="chip-batch-head"><div><span>Fila para ${escapeHtml(seller?.name || 'vendedor selecionado')}</span><strong>${chipBatchItems.length} de ${Math.max(0, state.chipLimit - Number(seller?.availableCount || 0))} vagas sendo usadas</strong></div><div><b>${remaining}</b><small>${remaining === 1 ? 'vaga restante' : 'vagas restantes'}</small><button type="button" data-action="clear-chip-batch">Limpar fila</button></div></div><div class="chip-batch-list">${chipBatchItems.map((item, index) => `
    <article class="chip-batch-item">
      <span>${index + 1}</span>
      <div><strong>${escapeHtml(item.materialName)}</strong><code class="mono">${escapeHtml(item.materialCode)}</code></div>
      <code class="mono">${escapeHtml(item.iccid.slice(0, -6))}<mark>${escapeHtml(item.suffix)}</mark></code>
      <button type="button" class="btn btn--ghost" data-action="remove-chip-batch-item" data-chip-candidate-id="${item.inventorySerialId}">Remover</button>
    </article>`).join('')}</div>`;
}

function addSelectedChipToBatch() {
  const form = modalRoot.querySelector('form[data-form="create-chip"]');
  if (!form) return;
  const inventorySerialId = Number(form.elements.inventorySerialId.value || 0);
  const selected = form.querySelector(`[data-chip-candidate-id="${CSS.escape(String(inventorySerialId))}"]`);
  if (!selected || !inventorySerialId) return showToast('Selecione uma correspondência antes de adicionar.', 'error');
  if (chipBatchItems.some((item) => item.inventorySerialId === inventorySerialId)) {
    return showToast('Este ICCID já está na fila.', 'error');
  }
  const sellerId = Number(form.dataset.batchSellerId || form.elements.sellerId.value || 0);
  const seller = state.chipSellers.find((item) => item.id === sellerId);
  const capacity = Math.max(0, state.chipLimit - Number(seller?.availableCount || 0));
  if (!seller || chipBatchItems.length >= capacity) {
    return showToast('A carteira deste vendedor não possui mais vagas para este lote.', 'error');
  }
  form.dataset.batchSellerId = String(sellerId);
  chipBatchItems.push({
    inventorySerialId,
    materialCode: selected.dataset.materialCode,
    materialName: selected.dataset.materialName,
    iccid: selected.dataset.chipIccid,
    suffix: selected.dataset.iccidSuffix,
  });
  renderChipBatchQueue();
  form.elements.iccidSuffix.value = '';
  resetChipCandidateResults('Chip adicionado. Informe o próximo final de ICCID ou conclua o lote.');
  form.elements.iccidSuffix.focus();
}

function removeChipFromBatch(inventorySerialId) {
  chipBatchItems = chipBatchItems.filter((item) => item.inventorySerialId !== Number(inventorySerialId));
  renderChipBatchQueue();
}

function clearChipBatch() {
  chipBatchItems = [];
  renderChipBatchQueue();
  resetChipCandidateResults('Fila limpa. Escolha o material e informe o próximo ICCID.');
}

function chipModal(chip = null) {
  if (state.user.role !== 'manager' || !state.chipSellers.length) return;
  const selectedSellerId = chip?.sellerId || state.chipSellerId || state.chipSellers[0].id;
  const selectedSeller = state.chipSellers.find((seller) => seller.id === selectedSellerId);
  if (chip) {
    showModal(`<form data-form="edit-chip" data-id="${escapeHtml(chip.id)}" novalidate>
      <div class="modal__head"><div><span class="modal-eyebrow">Carteira de chips</span><h2>Transferir chip</h2><p>O material e o ICCID identificados no estoque permanecem protegidos.</p></div>${modalCloseButton()}</div>
      <div class="modal__body"><div class="form-error" data-form-error hidden></div><div class="chip-transfer-summary"><span>Chip selecionado</span><strong>${escapeHtml(chip.materialCode)}</strong><code class="mono">${escapeHtml(chip.iccid)}</code></div><div class="field"><label for="chip-seller">Novo vendedor responsável</label><select class="select" id="chip-seller" name="sellerId" required>${state.chipSellers.map((seller) => `<option value="${seller.id}" ${seller.id === selectedSellerId ? 'selected' : ''}>${escapeHtml(seller.name)} · ${seller.availableCount}/${state.chipLimit} disponíveis</option>`).join('')}</select><p class="field-hint">Cada vendedor pode manter até ${state.chipLimit} chips disponíveis.</p></div></div>
      <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn">Confirmar transferência</button></div>
    </form>`, { small: true });
    return;
  }
  if (!state.chipMaterials.length) return showToast('Não há materiais de chip livres no estoque atual.', 'error');
  chipBatchItems = [];
  showModal(`<form data-form="create-chip" novalidate>
    <div class="modal__head"><div><span class="modal-eyebrow">Cadastro em lote</span><h2>Identificar e distribuir chips</h2><p>Adicione vários ICCIDs à fila e confirme todos de uma vez.</p></div>${modalCloseButton()}</div>
    <div class="modal__body"><div class="form-error" data-form-error hidden></div><div class="form-grid chip-registration-grid">
      <div class="field field--full"><label for="chip-seller">Vendedor responsável pelo lote</label><select class="select" id="chip-seller" name="sellerId" required>${state.chipSellers.map((seller) => `<option value="${seller.id}" ${seller.id === selectedSellerId ? 'selected' : ''}>${escapeHtml(seller.name)} · ${seller.availableCount}/${state.chipLimit} disponíveis</option>`).join('')}</select><p class="field-hint">O vendedor fica fixo depois que o primeiro chip entra na fila. ${selectedSeller ? `${escapeHtml(selectedSeller.name)} está com ${selectedSeller.availableCount}.` : ''}</p></div>
      <section class="chip-registration-step field--full"><header><span>1</span><div><strong>Escolha o material disponível</strong><small>A lista mostra somente SIM cards livres no estoque.</small></div></header><div class="chip-material-search"><input class="input" type="search" data-action="chip-material-search" placeholder="Buscar nome ou código material" autocomplete="off"></div><input type="hidden" name="materialCode"><div class="chip-material-options" data-chip-materials></div></section>
      <section class="chip-registration-step field--full"><header><span>2</span><div><strong>Identifique e adicione cada ICCID</strong><small>Use os 6 últimos números do código grande impresso no chip.</small></div></header><div class="chip-suffix-search"><div class="field"><label for="chip-iccid-suffix">Últimos 6 dígitos</label><input class="input mono" id="chip-iccid-suffix" name="iccidSuffix" inputmode="numeric" autocomplete="off" maxlength="6" pattern="[0-9]{6}" placeholder="000000" data-action="chip-iccid-suffix"></div><button type="button" class="btn btn--secondary" data-action="search-chip-candidates">Buscar ICCID</button></div><input type="hidden" name="inventorySerialId"><div class="chip-candidate-results" data-chip-candidates aria-live="polite"><div class="chip-candidate-message">${uiIcon('sim')}<span>Escolha o material e informe os 6 últimos dígitos.</span></div></div><div class="chip-candidate-actions"><span>Confira o ICCID completo antes de colocá-lo no lote.</span><button type="button" class="btn" data-action="add-chip-to-batch" disabled>Adicionar à fila</button></div></section>
      <section class="chip-registration-step chip-batch-panel field--full"><header><span>3</span><div><strong>Revise a fila de cadastro</strong><small>Você pode misturar materiais e remover itens antes de confirmar.</small></div></header><div class="chip-batch" data-chip-batch></div></section>
    </div></div>
    <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn" disabled>Cadastre chips na fila</button></div>
  </form>`, { wide: true });
  renderChipMaterialOptions();
  renderChipBatchQueue();
}

function chipSaleModal(chip) {
  if (!chip) return;
  showModal(`<form data-form="sell-chip" data-id="${escapeHtml(chip.id)}" novalidate>
    <div class="modal__head"><div><span class="modal-eyebrow">Baixa de chip</span><h2>Registrar venda</h2><p>Informe a data e a linha que recebeu este ICCID.</p></div>${modalCloseButton()}</div>
    <div class="modal__body"><div class="form-error" data-form-error hidden></div><div class="chip-sale-summary"><code class="mono">${escapeHtml(chip.materialCode)}</code><strong class="mono">${escapeHtml(chip.iccid)}</strong>${state.user.role === 'manager' ? `<span>Responsável: ${escapeHtml(chip.sellerName)}</span>` : ''}</div><div class="form-grid">
      <div class="field"><label for="chip-sold-on">Data da venda</label><input class="input" id="chip-sold-on" name="soldOn" type="date" max="${localDateValue()}" value="${localDateValue()}" required></div>
      <div class="field"><label for="chip-phone">Número cadastrado</label><input class="input" id="chip-phone" name="registeredPhone" type="tel" inputmode="tel" autocomplete="off" maxlength="20" required placeholder="(00) 00000-0000"></div>
    </div><p class="chip-sale-warning">Confirme o número antes de salvar. O gerente poderá corrigir a venda se necessário.</p></div>
    <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn">Confirmar venda</button></div>
  </form>`, { small: true });
}

function chipConfirmationModal(chip, action) {
  if (!chip) return;
  const options = {
    remove: ['Retirar chip da carteira?', 'O registro e o histórico de venda serão preservados. O vendedor deixará de ver este chip.', 'Retirar chip', 'btn btn--danger'],
    reopen: ['Corrigir esta venda?', 'A data e o número cadastrado serão apagados, e o chip voltará a ocupar uma vaga disponível.', 'Voltar para disponível', 'btn'],
    restore: ['Restaurar este chip?', 'O chip voltará para a carteira do vendedor com a situação anterior.', 'Restaurar chip', 'btn'],
  };
  const [title, description, submitLabel, buttonClass] = options[action];
  showModal(`<form data-form="${action}-chip" data-id="${escapeHtml(chip.id)}"><div class="modal__head"><div><h2>${title}</h2><p>${description}</p></div>${modalCloseButton()}</div><div class="modal__body"><div class="form-error" data-form-error hidden></div><div class="chip-confirmation"><span>${escapeHtml(chip.sellerName)}</span><code class="mono">${escapeHtml(chip.materialCode)}</code><strong class="mono">${escapeHtml(chip.iccid)}</strong></div></div><div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="${buttonClass}">${submitLabel}</button></div></form>`, { small: true });
}

function userModal(user = null) {
  showModal(`<form data-form="${user ? 'edit-user' : 'create-user'}" data-id="${user?.id || ''}" novalidate>
    <div class="modal__head"><div><h2>${user ? 'Editar usuário' : 'Novo usuário'}</h2><p>${user ? 'Altere nome, e-mail, perfil, acesso ou senha.' : 'Crie um login individual.'}</p></div>${modalCloseButton()}</div>
    <div class="modal__body"><div class="form-error" data-form-error hidden></div><div class="form-grid">
      <div class="field"><label for="user-name">Nome completo</label><input class="input" id="user-name" name="name" maxlength="100" required value="${escapeHtml(user?.name || '')}"></div>
      <div class="field"><label for="user-email">E-mail</label><input class="input" id="user-email" name="email" type="email" autocomplete="email" maxlength="160" required value="${escapeHtml(user?.email || '')}"></div>
      <div class="field"><label for="user-role">Perfil</label><select class="select" id="user-role" name="role"><option value="seller" ${!user || user.role === 'seller' ? 'selected' : ''}>Vendedor</option><option value="stocker" ${user?.role === 'stocker' ? 'selected' : ''}>Estoquista</option><option value="manager" ${user?.role === 'manager' ? 'selected' : ''}>Gerente</option></select><p class="field-hint">O estoquista vê somente os pedidos liberados.</p></div>
      ${user ? `<div class="field"><label for="user-active">Acesso</label><select class="select" id="user-active" name="active"><option value="true" ${user.active ? 'selected' : ''}>Ativo</option><option value="false" ${!user.active ? 'selected' : ''}>Inativo</option></select></div>` : '<div class="field"><label for="user-password">Senha provisória</label><input class="input" id="user-password" name="password" type="password" minlength="8" maxlength="128" required></div>'}
      ${user ? '<div class="field"><label for="user-password">Nova senha <span class="request-meta">(opcional)</span></label><input class="input" id="user-password" name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128"><p class="field-hint">Deixe em branco para manter a senha atual.</p></div><div class="field"><label for="user-confirm-password">Confirmar nova senha</label><input class="input" id="user-confirm-password" name="confirmUserPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128"><p class="field-hint">Não é necessário informar a senha antiga.</p></div>' : ''}
    </div></div>
    <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn">${user ? 'Salvar alterações' : 'Criar usuário'}</button></div>
  </form>`);
}

function passwordModal(required = false) {
  const needsCurrentPassword = state.user?.role !== 'manager';
  const description = required
    ? (needsCurrentPassword ? 'Por segurança, substitua a senha provisória.' : 'Defina sua nova senha para continuar.')
    : (needsCurrentPassword ? 'Confirme sua senha atual antes de alterá-la.' : 'A senha atual não será solicitada.');
  showModal(`<form data-form="password" novalidate>
    <div class="modal__head"><div><h2>${required ? 'Crie uma nova senha' : 'Alterar senha'}</h2><p>${description}</p></div>${required ? '' : modalCloseButton()}</div>
    <div class="modal__body"><div class="form-error" data-form-error hidden></div><div class="form-grid form-grid--single">${needsCurrentPassword ? '<div class="field"><label for="current-password">Senha atual</label><input class="input" id="current-password" name="currentPassword" type="password" autocomplete="current-password" required></div>' : ''}<div class="field"><label for="new-password">Nova senha</label><input class="input" id="new-password" name="newPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></div><div class="field"><label for="confirm-new-password">Confirme a nova senha</label><input class="input" id="confirm-new-password" name="confirmPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></div></div></div>
    <div class="modal__footer">${required ? '' : '<button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button>'}<button type="submit" class="btn">Salvar nova senha</button></div>
  </form>`, { required, small: true });
}

function deleteUserModal(user) {
  if (!user) return;
  showModal(`<form data-form="delete-user" data-id="${user.id}">
    <div class="modal__head"><div><h2>Excluir usuário?</h2><p>O acesso será removido imediatamente.</p></div>${modalCloseButton()}</div>
    <div class="modal__body"><div class="form-error" data-form-error hidden></div>
      <div class="delete-user-summary"><strong>${escapeHtml(user.name)}</strong><span>${escapeHtml(user.email)} · ${escapeHtml(roleLabel(user.role))}</span></div>
      <p class="delete-user-warning">As sessões serão encerradas e o cadastro não aparecerá mais na lista. Pedidos e histórico antigos serão preservados com os dados pessoais anonimizados.</p>
    </div>
    <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn btn--danger">Excluir definitivamente</button></div>
  </form>`, { small: true });
}

function requestReviewModal() {
  const selected = [...state.cart].map(([variantId, quantity]) => {
    const found = findCatalogVariant(variantId);
    return found ? { ...found, quantity, unitPriceCents: selectedProductPrice(found.product, found.variant) } : null;
  }).filter(Boolean);
  if (!selected.length) return;
  const units = selected.reduce((sum, item) => sum + item.quantity, 0);
  const pricedItems = selected.filter((item) => item.unitPriceCents != null);
  if (selected.some((item) => item.product.pricing) && !state.priceCategory) {
    throw new ApiError('Escolha a categoria do plano antes de revisar o pedido.', 400);
  }
  const subtotalCents = pricedItems.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const deviceUnits = selected.filter((item) => item.product.cluster === 'devices').reduce((sum, item) => sum + item.quantity, 0);
  if (state.renova.enabled && deviceUnits !== 1) {
    throw new ApiError('O Vivo Renova deve ser usado com exatamente um aparelho novo por pedido.', 400);
  }
  if (state.renova.enabled && !selectedRenovaTradeIn()) {
    throw new ApiError('Selecione o aparelho usado na tabela ASSURANT.', 400);
  }
  const renova = renovaDiscountFor(selected);
  const orderTotalCents = Math.max(0, subtotalCents - renova.discountCents);
  const installments = installmentCount(orderTotalCents);
  const priceSummary = pricedItems.length
    ? `<div class="cart-pricing-summary">${state.priceCategory ? `<div><span>Categoria do plano</span><strong>${escapeHtml(state.priceCategory)}</strong></div>` : ''}${state.renova.enabled ? `<div><span>Preço normal dos produtos</span><strong>${formatMoney(subtotalCents)}</strong></div><div class="renova-summary-line"><span>Bônus do fabricante</span><strong>− ${formatMoney(renova.bonusCents)}</strong></div><div class="renova-summary-line"><span>Voucher ASSURANT</span><strong>− ${formatMoney(renova.voucherCents)}</strong></div><p>Renova: ${escapeHtml(selectedRenovaTradeIn()?.name || 'aparelho usado não informado')} · ${state.renova.condition === 'defeituoso' ? 'Defeituoso' : 'Bom'}. Os abatimentos foram limitados ao valor dos aparelhos.</p>` : ''}<div><span>Total do pedido</span><strong>${formatMoney(orderTotalCents)}</strong></div><p>${orderTotalCents > 0 && installments > 1 ? `${installments}x de ${formatMoney(Math.round(orderTotalCents / installments))} sem juros` : orderTotalCents > 0 ? 'Pagamento à vista' : 'Sem cobrança para os itens selecionados'} · todos os produtos estão incluídos; capa e película permanecem no valor normal.</p></div>`
    : '';
  showModal(`<form class="request-review-form" data-form="create-request" novalidate>
    <div class="modal__head"><div><h2>Revisar pedido</h2><p>${units} ${units === 1 ? 'item selecionado' : 'itens selecionados'} · o IMEI será definido automaticamente</p></div>${modalCloseButton()}</div>
    <div class="modal__body"><div class="form-error" data-form-error hidden></div><ul class="request-items cart-review">${selected.map(({ product, variant, quantity, unitPriceCents }) => `<li>${productImageMarkup(product, 'cart-review__image', 52, 52)}<div><strong>${escapeHtml(product.name)}</strong>${materialInline(variant.materialCode)}${unitPriceCents == null ? '' : productPriceKind(product, variant) === 'no_charge' ? '<div class="cart-line-price"><span>Sem cobrança</span><strong>R$ 0,00</strong></div>' : `<div class="cart-line-price"><span>${formatMoney(unitPriceCents)} por unidade</span><strong>${formatMoney(unitPriceCents * quantity)}</strong></div>`}</div><span class="item-quantity">${quantity} un.</span><button type="button" class="btn btn--ghost btn--small" data-action="remove-cart-item" data-variant-id="${variant.id}">Remover</button></li>`).join('')}</ul>${priceSummary}<div class="field"><label for="request-notes">Observação <span class="request-meta">(opcional)</span></label><textarea class="textarea" id="request-notes" name="notes" maxlength="500"></textarea></div></div>
    <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Voltar</button><button type="submit" class="btn">Confirmar e liberar pedido</button></div>
  </form>`);
}

function cancelModal(requestId) {
  const restoresStock = ['manager', 'stocker'].includes(state.user.role);
  const description = restoresStock
    ? 'As quantidades e os IMEIs deste pedido voltarão automaticamente ao estoque.'
    : 'Os itens voltarão a ficar disponíveis.';
  showModal(`<form data-form="cancel-request" data-id="${escapeHtml(requestId)}"><div class="modal__head"><div><h2>Cancelar pedido?</h2><p>${description}</p></div>${modalCloseButton()}</div><div class="modal__body"><div class="form-error" data-form-error hidden></div><p>O cancelamento ficará registrado no histórico e não poderá ser desfeito.</p></div><div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Voltar</button><button type="submit" class="btn btn--danger">${restoresStock ? 'Cancelar e devolver itens' : 'Cancelar pedido'}</button></div></form>`, { small: true });
}

async function enterApp(user) {
  state.user = user;
  state.view = 'dashboard';
  state.catalog = [];
  state.news = [];
  state.chips = [];
  state.renovaItems = [];
  state.renovaSearch = '';
  state.renovaStatus = 'awaiting_pickup';
  state.chipSellers = [];
  state.chipLimit = 10;
  state.chipSearch = '';
  state.chipStatus = user.role === 'manager' ? 'all' : 'available';
  state.chipSellerId = 0;
  state.pricing = { categories: [], tableDate: '', source: '' };
  state.renovaCatalog = { tableDate: '', devices: [], boosts: [] };
  state.priceCategory = '';
  state.renova = { enabled: false, deviceId: 0, condition: 'bom' };
  state.cart.clear();
  state.deviceSelections.clear();
  state.expandedDeviceFamily = '';
  state.catalogSearch = '';
  state.catalogCategory = '';
  state.stockSearch = '';
  state.stockCluster = '';
  state.requestFilter = user.role === 'stocker' ? 'approved' : '';
  state.alignmentTopic = '';
  state.pendingCount = 0;
  renderShell();
  if (user.mustChangePassword) return passwordModal(true);
  await navigate('dashboard');
}

root.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  try {
    if (action === 'navigate') {
      if (['manager', 'stocker'].includes(state.user.role) && button.dataset.view === 'stock') {
        state.stockSearch = '';
        state.stockCluster = '';
      }
      if (state.user.role === 'seller' && ['stock', 'new-request'].includes(button.dataset.view)) {
        state.catalogSearch = '';
        state.catalogCategory = '';
      }
      await navigate(button.dataset.view);
    }
    if (action === 'reload-view') await navigate(state.view);
    if (action === 'open-menu') document.body.classList.add('menu-open');
    if (action === 'close-menu') document.body.classList.remove('menu-open');
    if (action === 'logout') await withBusy(button, async () => { await api('/api/auth/logout', { method: 'POST' }); state.user = null; closeModal(true); renderLogin(); });
    if (action === 'password') passwordModal(false);
    if (action === 'open-quantity') { if (!state.catalog.length) await loadCatalog(); quantityModal(); }
    if (action === 'adjust-quantity') quantityModal(Number(button.dataset.variantId));
    if (action === 'choose-product') pickerModal(Number(button.dataset.productId));
    if (action === 'toggle-device-family') {
      state.expandedDeviceFamily = state.expandedDeviceFamily === button.dataset.familyKey ? '' : button.dataset.familyKey;
      renderCatalogGrid();
      if (state.expandedDeviceFamily) {
        window.requestAnimationFrame(() => document.querySelector(`.device-family-card[data-family-key="${CSS.escape(state.expandedDeviceFamily)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
      }
    }
    if (action === 'add-device-bundle') addDeviceBundle(button.dataset.familyKey);
    if (action === 'copy-material') { await copyText(button.dataset.code); showToast('Código material copiado.'); }
    if (action === 'filter-category') { state.catalogCategory = button.dataset.category; renderCatalogGrid(); }
    if (action === 'filter-stock-category') { state.stockCluster = button.dataset.category; renderStockTable(); }
    if (action === 'open-stock-group') {
      state.stockSearch = '';
      state.stockCluster = button.dataset.cluster;
      await navigate('stock');
    }
    if (action === 'open-store-group') {
      state.catalogSearch = '';
      state.catalogCategory = button.dataset.cluster;
      await navigate('new-request');
    }
    if (action === 'open-alignment') {
      if (!alignmentTopics.some((topic) => topic.id === button.dataset.topic)) return;
      state.alignmentTopic = button.dataset.topic;
      renderAlignment();
      window.requestAnimationFrame(() => {
        document.querySelector('.alignment-nav__item.is-selected')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        const detail = document.querySelector('#alignment-detail');
        detail?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        detail?.focus({ preventScroll: true });
      });
    }
    if (action === 'view-news-art') newsArtModal(state.news.find((item) => item.id === button.dataset.id));
    if (action === 'open-news') newsModal();
    if (action === 'edit-news') newsModal(state.news.find((item) => item.id === button.dataset.id));
    if (action === 'toggle-news') {
      await withBusy(button, async () => {
        const active = button.dataset.active === 'true';
        await api(`/api/news/${encodeURIComponent(button.dataset.id)}/visibility`, { method: 'PATCH', body: { active } });
        showToast(active ? 'Notícia publicada novamente.' : 'Notícia ocultada da aba da equipe.');
        await renderNews();
      });
    }
    if (action === 'open-renova-intake' && canAccessRenovaIntake()) {
      if (!state.renovaCatalog.devices?.length) await loadCatalog();
      renovaIntakeModal();
    }
    if (action === 'edit-renova-intake' && canAccessRenovaIntake()) {
      if (!state.renovaCatalog.devices?.length) await loadCatalog();
      renovaIntakeModal(state.renovaItems.find((item) => item.id === button.dataset.id));
    }
    if (action === 'pickup-renova-intake' && canAccessRenovaIntake()) renovaIntakePickupModal(state.renovaItems.find((item) => item.id === button.dataset.id));
    if (action === 'delete-renova-intake' && canAccessRenovaIntake()) renovaIntakeDeleteModal(state.renovaItems.find((item) => item.id === button.dataset.id));
    if (action === 'filter-renova-intake') { state.renovaStatus = button.dataset.status; renderRenovaIntakeResults(); }
    if (action === 'open-chip') chipModal();
    if (action === 'edit-chip') chipModal(state.chips.find((chip) => chip.id === button.dataset.id));
    if (action === 'sell-chip') chipSaleModal(state.chips.find((chip) => chip.id === button.dataset.id));
    if (action === 'remove-chip') chipConfirmationModal(state.chips.find((chip) => chip.id === button.dataset.id), 'remove');
    if (action === 'reopen-chip') chipConfirmationModal(state.chips.find((chip) => chip.id === button.dataset.id), 'reopen');
    if (action === 'restore-chip') chipConfirmationModal(state.chips.find((chip) => chip.id === button.dataset.id), 'restore');
    if (action === 'copy-chip-iccid') {
      const chip = state.chips.find((item) => item.id === button.dataset.id);
      if (chip) { await copyText(chip.iccid); showToast('ICCID copiado.'); }
    }
    if (action === 'filter-chips') { state.chipStatus = button.dataset.status; renderChipResults(); }
    if (action === 'select-chip-seller') { state.chipSellerId = Number(button.dataset.sellerId); renderChips(); }
    if (action === 'clear-chip-seller') { state.chipSellerId = 0; renderChips(); }
    if (action === 'open-user') userModal();
    if (action === 'edit-user') userModal(state.users.find((user) => user.id === Number(button.dataset.id)));
    if (action === 'delete-user') deleteUserModal(state.users.find((user) => user.id === Number(button.dataset.id)));
    if (action === 'filter-requests') { state.requestFilter = button.dataset.status; await renderRequests(); }
    if (action === 'cancel-request') cancelModal(button.dataset.id);
  } catch (error) {
    if (error.status !== 401) showToast(error.message, 'error');
  }
});

modalRoot.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  if (target.dataset.action === 'close-modal') closeModal();
  if (target.dataset.action === 'backdrop-close' && event.target === target) closeModal();
  if (target.dataset.action === 'select-chip-material') {
    selectChipMaterial(target.dataset.materialCode);
    const form = target.closest('form');
    if (String(form?.elements.iccidSuffix?.value || '').length === 6) await searchChipCandidates();
  }
  if (target.dataset.action === 'select-chip-candidate') selectChipCandidate(target.dataset.chipCandidateId);
  if (target.dataset.action === 'search-chip-candidates') await searchChipCandidates();
  if (target.dataset.action === 'add-chip-to-batch') addSelectedChipToBatch();
  if (target.dataset.action === 'remove-chip-batch-item') removeChipFromBatch(target.dataset.chipCandidateId);
  if (target.dataset.action === 'clear-chip-batch') clearChipBatch();
  if (target.dataset.action === 'remove-cart-item') {
    state.cart.delete(Number(target.dataset.variantId));
    if (state.cart.size) requestReviewModal();
    else closeModal(true);
    renderCartBar();
  }
});

modalRoot.addEventListener('input', (event) => {
  if (event.target.dataset.action === 'chip-material-search') renderChipMaterialOptions();
  if (event.target.dataset.action === 'chip-iccid-suffix') queueChipCandidateSearch();
});

root.addEventListener('change', (event) => {
  const action = event.target.dataset.action;
  if (action === 'filter-chip-seller') { state.chipSellerId = Number(event.target.value || 0); renderChipResults(); return; }
  if (action === 'renova-enabled') {
    state.renova.enabled = event.target.checked;
    if (!state.renova.enabled) state.renova = { enabled: false, deviceId: 0, condition: 'bom' };
    renderCatalogGrid(); renderCartBar(); return;
  }
  if (action === 'renova-used-device-search') { state.renova.deviceId = Number(renovaTradeInByName(event.target.value)?.id || 0); renderCatalogGrid(); renderCartBar(); return; }
  if (action === 'renova-condition') { state.renova.condition = event.target.value; renderCatalogGrid(); renderCartBar(); return; }
  if (action === 'pricing-category') {
    state.priceCategory = event.target.value;
    renderCatalogGrid();
    renderStockTable();
    renderCartBar();
    return;
  }
  if (!['device-memory', 'device-color', 'device-case', 'device-film'].includes(action)) return;
  const group = deviceGroupByKey(event.target.dataset.familyKey);
  if (!group) return;
  const { selection, option } = selectionForDeviceGroup(group);
  if (action === 'device-memory') {
    const selectedOption = group.options.find((item) => item.memory === event.target.value && variantRemaining(item.variant) > 0)
      || group.options.find((item) => item.memory === event.target.value);
    if (selectedOption) selection.variantId = selectedOption.variant.id;
  }
  if (action === 'device-color') {
    const selectedOption = group.options.find((item) => item.memory === option?.memory && item.color === event.target.value);
    if (selectedOption) selection.variantId = selectedOption.variant.id;
  }
  if (action === 'device-case') selection.caseKey = event.target.value;
  if (action === 'device-film') selection.filmKey = event.target.value;
  state.deviceSelections.set(group.key, selection);
  renderCatalogGrid();
});

root.addEventListener('input', (event) => {
  if (event.target.dataset.action === 'search-renova-intake') { state.renovaSearch = event.target.value; renderRenovaIntakeResults(); }
  if (event.target.dataset.action === 'chip-search') { state.chipSearch = event.target.value; renderChipResults(); }
  if (event.target.dataset.action === 'stock-search') { state.stockSearch = event.target.value; renderStockTable(); }
  if (event.target.dataset.action === 'catalog-search') { state.catalogSearch = event.target.value; renderCatalogGrid(); }
  if (event.target.dataset.action === 'renova-used-device-search') {
    state.renova.deviceId = Number(renovaTradeInByName(event.target.value)?.id || 0);
    renderCartBar();
  }
  if (event.target.dataset.action === 'device-quantity') {
    const group = deviceGroupByKey(event.target.dataset.familyKey);
    if (!group) return;
    const { selection } = selectionForDeviceGroup(group);
    selection.quantity = Math.max(1, Number(event.target.value) || 1);
    state.deviceSelections.set(group.key, selection);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (state.cartDrawerOpen) setCartDrawer(false);
  else closeModal();
});

document.addEventListener('submit', async (event) => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  setFormError(form);
  const submit = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form));
  await withBusy(submit, async () => {
    try {
      if (form.dataset.form === 'setup') {
        if (data.password !== data.confirmPassword) throw new ApiError('As senhas não coincidem.', 400);
        const result = await api('/api/setup', { method: 'POST', body: { name: data.name, email: data.email, password: data.password } });
        showToast('Acesso gerencial criado com sucesso.');
        await enterApp(result.user);
      }
      if (form.dataset.form === 'login') {
        const result = await api('/api/auth/login', { method: 'POST', body: { email: data.email, password: data.password }, keepSession: true });
        await enterApp(result.user);
      }
      if (form.dataset.form === 'quantity-stock') {
        const quantity = Number(data.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) throw new ApiError('Informe uma quantidade válida.', 400);
        await api('/api/inventory/quantity', { method: 'POST', body: { variantId: Number(data.variantId), quantityDelta: data.operation === 'exit' ? -quantity : quantity } });
        closeModal(true);
        showToast(data.operation === 'exit' ? 'Saída registrada no estoque.' : 'Entrada adicionada ao estoque.');
        await navigate('stock');
      }
      if (form.dataset.form === 'pick-product') {
        const variantId = Number(form.dataset.variantId);
        const quantity = Number(data.quantity);
        const found = findCatalogVariant(variantId);
        if (!found) throw new ApiError('Este produto não está mais disponível.', 404);
        if (!Number.isInteger(quantity) || quantity <= 0) throw new ApiError('Informe uma quantidade válida.', 400);
        const newQuantity = (state.cart.get(variantId) || 0) + quantity;
        if (newQuantity > found.variant.available) throw new ApiError(`Há somente ${found.variant.available} unidades disponíveis.`, 409);
        state.cart.set(variantId, newQuantity);
        closeModal(true);
        showToast(`${found.product.name} adicionado ao pedido.`);
        renderCartBar();
      }
      if (form.dataset.form === 'create-request') {
        const lines = [...state.cart].map(([variantId, quantity]) => ({ variantId, quantity }));
        const tradeIn = selectedRenovaTradeIn();
        await api('/api/requests', { method: 'POST', body: { lines, notes: data.notes, priceCategory: state.priceCategory, renova: state.renova.enabled ? { deviceId: tradeIn?.id, usedDevice: tradeIn?.name, condition: state.renova.condition } : null } });
        state.cart.clear();
        state.cartDrawerOpen = false;
        state.priceCategory = '';
        state.renova = { enabled: false, deviceId: 0, condition: 'bom' };
        closeModal(true);
        showToast('Pedido liberado com o preço registrado. O IMEI já está disponível.');
        state.requestFilter = '';
        await navigate('requests');
      }
      if (form.dataset.form === 'cancel-request') {
        await api(`/api/requests/${encodeURIComponent(form.dataset.id)}/cancel`, { method: 'POST', body: {} });
        closeModal(true);
        showToast(['manager', 'stocker'].includes(state.user.role)
          ? 'Pedido cancelado. Quantidades e IMEIs devolvidos ao estoque.'
          : 'Pedido cancelado.');
        await renderRequests();
      }
      if (form.dataset.form === 'create-news') {
        await api('/api/news', { method: 'POST', body: { title: data.title, body: data.body, category: data.category, validityLabel: data.validityLabel } });
        closeModal(true);
        showToast('Notícia publicada para toda a equipe.');
        await renderNews();
      }
      if (form.dataset.form === 'edit-news') {
        await api(`/api/news/${encodeURIComponent(form.dataset.id)}`, { method: 'PUT', body: { title: data.title, body: data.body, category: data.category, validityLabel: data.validityLabel } });
        closeModal(true);
        showToast('Notícia atualizada.');
        await renderNews();
      }
      if (form.dataset.form === 'create-renova-intake') {
        const selectedDevice = renovaTradeInByName(data.model);
        if (!selectedDevice) throw new ApiError('Selecione um aparelho da lista do Vivo Renova.', 400, { model: 'Escolha uma das opções exibidas na busca.' });
        const result = await api('/api/renova-intake', { method: 'POST', body: { model: selectedDevice.name, imei: data.imei, receivedOn: data.receivedOn, pickupOn: data.pickupOn } });
        closeModal(true);
        showToast(`Aparelho ${result.item.registrationCode} cadastrado no Renova.`);
        await renderRenovaIntake();
      }
      if (form.dataset.form === 'edit-renova-intake') {
        const selectedDevice = renovaTradeInByName(data.model);
        const currentItem = state.renovaItems.find((item) => item.id === form.dataset.id);
        const unchangedLegacyModel = currentItem && currentItem.model.toLocaleUpperCase('pt-BR') === String(data.model).trim().toLocaleUpperCase('pt-BR');
        if (!selectedDevice && !unchangedLegacyModel) throw new ApiError('Selecione um aparelho da lista do Vivo Renova.', 400, { model: 'Escolha uma das opções exibidas na busca.' });
        await api(`/api/renova-intake/${encodeURIComponent(form.dataset.id)}`, { method: 'PUT', body: { model: selectedDevice?.name || currentItem.model, imei: data.imei, receivedOn: data.receivedOn, pickupOn: data.pickupOn } });
        closeModal(true);
        showToast(data.pickupOn ? 'Aparelho e retirada atualizados.' : 'Dados do aparelho atualizados.');
        await renderRenovaIntake();
      }
      if (form.dataset.form === 'pickup-renova-intake') {
        const item = state.renovaItems.find((entry) => entry.id === form.dataset.id);
        if (!item) throw new ApiError('Este aparelho não está mais disponível.', 404);
        await api(`/api/renova-intake/${encodeURIComponent(item.id)}`, { method: 'PUT', body: { model: item.model, imei: item.imei, receivedOn: item.receivedOn, pickupOn: data.pickupOn } });
        closeModal(true);
        showToast('Retirada pela empresa registrada.');
        await renderRenovaIntake();
      }
      if (form.dataset.form === 'delete-renova-intake') {
        await api(`/api/renova-intake/${encodeURIComponent(form.dataset.id)}`, { method: 'DELETE' });
        closeModal(true);
        showToast('Aparelho excluído do Renova.');
        await renderRenovaIntake();
      }
      if (form.dataset.form === 'create-chip') {
        if (!chipBatchItems.length) throw new ApiError('Adicione pelo menos um chip à fila.', 400);
        const sellerId = Number(form.dataset.batchSellerId || data.sellerId || 0);
        const inventorySerialIds = chipBatchItems.map((item) => item.inventorySerialId);
        const result = await api('/api/chips/bulk', { method: 'POST', body: { sellerId, inventorySerialIds } });
        closeModal(true);
        showToast(`${result.count} ${result.count === 1 ? 'chip cadastrado' : 'chips cadastrados'} para o vendedor.`);
        await renderChips();
      }
      if (form.dataset.form === 'edit-chip') {
        await api(`/api/chips/${encodeURIComponent(form.dataset.id)}`, { method: 'PUT', body: { sellerId: Number(data.sellerId) } });
        closeModal(true);
        showToast('Chip transferido para a carteira selecionada.');
        await renderChips();
      }
      if (form.dataset.form === 'sell-chip') {
        await api(`/api/chips/${encodeURIComponent(form.dataset.id)}/sale`, { method: 'POST', body: { soldOn: data.soldOn, registeredPhone: data.registeredPhone } });
        closeModal(true);
        showToast('Venda registrada com data e número da linha.');
        await renderChips();
      }
      if (form.dataset.form === 'remove-chip') {
        await api(`/api/chips/${encodeURIComponent(form.dataset.id)}`, { method: 'DELETE' });
        closeModal(true);
        showToast('Chip retirado da carteira e preservado no histórico.');
        await renderChips();
      }
      if (form.dataset.form === 'reopen-chip') {
        await api(`/api/chips/${encodeURIComponent(form.dataset.id)}/reopen`, { method: 'POST', body: {} });
        closeModal(true);
        showToast('Venda corrigida. O chip voltou a ficar disponível.');
        await renderChips();
      }
      if (form.dataset.form === 'restore-chip') {
        await api(`/api/chips/${encodeURIComponent(form.dataset.id)}/restore`, { method: 'POST', body: {} });
        closeModal(true);
        showToast('Chip restaurado para a carteira do vendedor.');
        await renderChips();
      }
      if (form.dataset.form === 'create-user') {
        await api('/api/users', { method: 'POST', body: { name: data.name, email: data.email, password: data.password, role: data.role } });
        closeModal(true);
        showToast('Usuário criado. Envie a senha provisória para a pessoa.');
        if (state.view === 'users') await renderUsers(); else await navigate('users');
      }
      if (form.dataset.form === 'edit-user') {
        if (data.password !== data.confirmUserPassword) throw new ApiError('As novas senhas não coincidem.', 400);
        const userId = Number(form.dataset.id);
        const result = await api(`/api/users/${userId}`, {
          method: 'PUT',
          body: { name: data.name, email: data.email, role: data.role, active: data.active === 'true', password: data.password },
        });
        closeModal(true);
        showToast('Usuário atualizado.');
        if (userId === state.user.id) {
          if (data.password) {
            state.user = null;
            renderLogin('Sua senha foi alterada. Entre novamente com a nova senha.');
            return;
          }
          state.user = result.user;
          renderShell();
          await navigate('users');
        } else {
          await renderUsers();
        }
      }
      if (form.dataset.form === 'delete-user') {
        await api(`/api/users/${Number(form.dataset.id)}`, { method: 'DELETE' });
        closeModal(true);
        showToast('Usuário excluído e acesso encerrado.');
        await renderUsers();
      }
      if (form.dataset.form === 'password') {
        if (data.newPassword !== data.confirmPassword) throw new ApiError('As novas senhas não coincidem.', 400);
        await api('/api/auth/password', { method: 'PATCH', body: { currentPassword: data.currentPassword, newPassword: data.newPassword } });
        state.user.mustChangePassword = false;
        closeModal(true);
        showToast('Senha alterada com sucesso.');
        await navigate('dashboard');
      }
    } catch (error) {
      setFormError(form, error.message || 'Não foi possível concluir a ação.');
      const firstField = error.fields && Object.keys(error.fields)[0];
      if (firstField) form.elements[firstField]?.focus();
    }
  });
});

async function boot() {
  try {
    const setup = await api('/api/setup');
    if (setup.needsSetup) return renderSetup();
    try {
      const result = await api('/api/auth/me', { keepSession: true });
      await enterApp(result.user);
    } catch {
      renderLogin();
    }
  } catch {
    root.innerHTML = `<div class="boot-screen">${emptyState('Não foi possível iniciar o sistema', 'Verifique a conexão e tente novamente.', '<button class="btn" data-action="boot-retry">Tentar novamente</button>')}</div>`;
  }
}

root.addEventListener('click', (event) => { if (event.target.closest('[data-action="boot-retry"]')) boot(); });

boot();
