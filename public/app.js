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

function productImageUrl(produto) {
  const imageUrl = typeof produto?.imagem_url === 'string' ? produto.imagem_url.trim() : '';
  return imageUrl || PRODUCT_IMAGE_FALLBACK;
}

function productImageMarkup(produto, className, width, height) {
  return `<img src="${escapeHtml(productImageUrl(produto))}" alt="${escapeHtml(produto.nome || produto.name || 'Produto')}" class="${escapeHtml(className)}" width="${width}" height="${height}" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-product-image="true">`;
}

function handleProductImageError(event) {
  const image = event.target;
  if (!(image instanceof HTMLImageElement) || image.dataset.productImage !== 'true') return;
  if (image.dataset.fallbackApplied === 'true') {
    image.hidden = true;
    return;
  }
  image.dataset.fallbackApplied = 'true';
  image.classList.add('is-fallback');
  image.alt = '';
  image.src = PRODUCT_IMAGE_FALLBACK;
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

function renderIncomingCatalog() {
  const target = document.querySelector('[data-incoming-catalog]');
  if (target) target.innerHTML = incomingCatalogSection();
}

function productCard(product) {
  const unavailable = product.available <= 0;
  const variant = product.variants[0];
  const price = selectedProductPrice(product, variant);
  const installments = price == null || price <= 0 ? 1 : installmentCount(price);
  const priceDetail = price == null
    ? '<span>Não cadastrado</span>'
    : productPriceKind(product, variant) === 'no_charge'
      ? '<strong>Sem cobrança</strong><span>ativação do chip</span>'
      : `<strong>${formatMoney(price)}</strong><span>${installments > 1 ? `${installments}x de ${formatMoney(Math.round(price / installments))} sem juros` : 'pagamento à vista'}</span>`;
  return `<article class="store-card ${unavailable ? 'store-card--empty' : ''}">${productImageMedia(product)}<div class="store-card__body"><div class="store-card__meta"><span>${escapeHtml(clusterLabels[product.cluster] || clusterLabels.misc)}</span><span>${escapeHtml(product.brand || 'Sem marca')}</span></div><h3>${escapeHtml(product.name)}</h3>${materialCodeBox(materialCode(product), true)}<div class="store-card__price">${priceDetail}</div><div class="store-card__stock"><strong>${product.available}</strong><span>${product.available === 1 ? 'unidade disponível' : 'unidades disponíveis'}</span></div><button class="btn store-card__button" data-action="choose-product" data-product-id="${product.id}" ${unavailable ? 'disabled' : ''}>${unavailable ? 'Sem estoque' : 'Adicionar ao pedido'}</button></div></article>`;
}

function variantRemaining(variant) {
  return Math.max(0, Number(variant?.available || 0) - Number(state.cart.get(Number(variant?.id)) || 0));
}

function choiceRemaining(choice) {
  return choice.products.reduce((total, product) => total
    + product.variants.reduce((sum, variant) => sum + variantRemaining(variant), 0), 0);
}

function selectionForDeviceGroup(group) {
  const previous = state.deviceSelections.get(group.key) || {};
  const availableOptions = group.options.filter((option) => variantRemaining(option.variant) > 0);
  const option = availableOptions.find((item) => item.variant.id === Number(previous.variantId))
    || availableOptions[0]
    || group.options[0];
  const selection = {
    variantId: option?.variant.id || 0,
    caseKey: previous.caseKey || '',
    filmKey: previous.filmKey || '',
    quantity: Math.max(1, Number(previous.quantity) || 1),
  };
  state.deviceSelections.set(group.key, selection);
  return { selection, option };
}

function selectOptions(items, selectedValue, label) {
  return items.map(({ value, text, disabled = false }) => `<option value="${escapeHtml(value)}" ${String(value) === String(selectedValue) ? 'selected' : ''} ${disabled ? 'disabled' : ''}>${escapeHtml(text)}</option>`).join('') || `<option value="">${escapeHtml(label)}</option>`;
}

function accessorySelect({ action, familyKey, label, emptyLabel, choices, selectedKey }) {
  const options = [
    { value: '', text: emptyLabel },
    ...choices.map((choice) => ({
      value: choice.key,
      text: `${choice.name} · ${priceText(choice.products[0], choice.products[0]?.variants?.[0])} · ${choiceRemaining(choice)} un.`,
    })),
  ];
  return `<div class="device-accessory-field"><div class="device-accessory-field__label"><span>${escapeHtml(label)}</span><small>opcional</small></div><select class="select" data-action="${action}" data-family-key="${escapeHtml(familyKey)}">${selectOptions(options, selectedKey, emptyLabel)}</select><p>A baixa da unidade será feita automaticamente pelo sistema.</p></div>`;
}

function deviceGroupPrice(group) {
  const hasPlanPrices = group.products.some((product) => product.pricing);
  if (hasPlanPrices && !state.priceCategory) return `<div class="device-price-hint"><span>Preço oficial</span><strong>Escolha a categoria do plano</strong></div>`;
  const prices = group.options.map((option) => selectedProductPrice(option.product, option.variant)).filter((price) => price != null);
  if (!prices.length) return `<div class="device-price-hint device-price-hint--muted">Preço não disponível na tabela atual</div>`;
  const minimum = Math.min(...prices);
  const label = hasPlanPrices ? `A partir de · ${escapeHtml(state.priceCategory)}` : 'Preço a partir de';
  return `<div class="device-price-hint"><span>${label}</span><strong>${formatMoney(minimum)}</strong></div>`;
}

function selectedDevicePrice(product, variant = null) {
  if (!product?.pricing) {
    const retailPrice = selectedProductPrice(product, variant);
    if (retailPrice == null) return `<div class="device-selected-price device-selected-price--muted"><span>Preço do aparelho</span><strong>Não disponível no simulador</strong></div>`;
    const installments = installmentCount(retailPrice);
    const installmentText = installments > 1 ? `${installments}x de ${formatMoney(Math.round(retailPrice / installments))}` : 'à vista';
    return `<div class="device-selected-price"><span>Preço do produto</span><strong>${formatMoney(retailPrice)}</strong><small>${installmentText} sem juros</small></div>`;
  }
  if (!state.priceCategory) {
    return `<div class="device-selected-price"><span>Preço do aparelho</span><strong>Escolha a categoria do plano acima</strong></div>`;
  }
  const price = selectedProductPrice(product, variant);
  if (price == null) {
    return `<div class="device-selected-price device-selected-price--muted"><span>Preço do aparelho</span><strong>Indisponível para ${escapeHtml(state.priceCategory)}</strong></div>`;
  }
  const installments = installmentCount(price);
  const installmentText = installments > 1 ? `${installments}x de ${formatMoney(Math.round(price / installments))}` : 'à vista';
  return `<div class="device-selected-price"><span>${escapeHtml(state.priceCategory)}</span><strong>${formatMoney(price)}</strong><small>${installmentText} sem juros</small></div>`;
}

function renovaConfigurator(product) {
  const bonusCents = manufacturerRenovaBonus(product?.name || '');
  const tradeIn = selectedRenovaTradeIn();
  const voucherCents = state.renova.condition === 'defeituoso' ? tradeIn?.defectiveCents : tradeIn?.goodCents;
  const tableDate = renovaTableDateLabel(state.renovaCatalog.tableDate) || 'vigência cadastrada';
  const deviceOptions = (state.renovaCatalog.devices || []).map((device) => `<option value="${escapeHtml(device.name)}">${escapeHtml(device.productType === 'TABLET' ? 'Tablet' : 'Smartphone')} · ${escapeHtml(device.manufacturer)}</option>`).join('');
  return `<section class="renova-box ${state.renova.enabled ? 'is-active' : ''}">
    <div class="renova-box__head"><div><span>Vivo Renova</span><strong>Cliente entregará um aparelho usado?</strong></div><label class="renova-switch"><input type="checkbox" data-action="renova-enabled" ${state.renova.enabled ? 'checked' : ''}><span>${state.renova.enabled ? 'Sim' : 'Não'}</span></label></div>
    ${state.renova.enabled ? `<div class="renova-box__body">
      ${bonusCents ? `<div class="renova-bonus"><span>Bônus do fabricante</span><strong>− ${formatMoney(bonusCents)}</strong><small>Aplicado automaticamente ao aparelho novo.</small></div>` : '<div class="renova-bonus renova-bonus--muted"><span>Bônus do fabricante</span><strong>Sem bônus cadastrado</strong><small>O voucher ASSURANT continua sendo calculado automaticamente.</small></div>'}
      <div class="renova-fields"><div class="field"><label for="renova-used-device">Aparelho usado do cliente</label><input class="input" type="search" id="renova-used-device" data-action="renova-used-device-search" list="renova-used-device-options" value="${escapeHtml(tradeIn?.name || '')}" placeholder="Digite marca, modelo ou memória…" autocomplete="off"><datalist id="renova-used-device-options">${deviceOptions}</datalist><small class="renova-search-help">Busque entre ${Number(state.renovaCatalog.devices?.length || 0).toLocaleString('pt-BR')} aparelhos aceitos pela ASSURANT.</small></div><div class="field"><label for="renova-condition">Estado</label><select class="select" id="renova-condition" data-action="renova-condition"><option value="bom" ${state.renova.condition === 'bom' ? 'selected' : ''}>Bom</option><option value="defeituoso" ${state.renova.condition === 'defeituoso' ? 'selected' : ''}>Defeituoso</option></select></div></div>
      <div class="renova-bonus ${tradeIn ? '' : 'renova-bonus--muted'}" aria-live="polite"><span>Voucher ASSURANT</span><strong>${tradeIn ? `− ${formatMoney(voucherCents)}` : 'Selecione o aparelho usado'}</strong><small>Valor automático e não editável · tabela ${escapeHtml(tableDate)}.</small></div>
      <p class="renova-note">Bônus e voucher são conferidos novamente pelo servidor e incidem somente sobre o aparelho, antes de capa e película.</p>
    </div>` : ''}
  </section>`;
}

function pricingSelector() {
  const categories = state.pricing.categories || [];
  if (!categories.length) return '';
  const tableDate = state.pricing.tableDate
    ? formatDate(`${state.pricing.tableDate}T12:00:00.000Z`, false)
    : 'data não informada';
  return `<section class="pricing-selector"><div><span class="pricing-selector__eyebrow">Tabela de preços</span><h3>Categoria do plano</h3><p>Selecione para ver o valor exato dos aparelhos.</p></div><div class="pricing-selector__control"><label for="pricing-category">Categoria</label><select class="select" id="pricing-category" data-action="pricing-category"><option value="">Selecione o plano…</option>${categories.map((category) => `<option value="${escapeHtml(category)}" ${state.priceCategory === category ? 'selected' : ''}>${escapeHtml(category)}</option>`).join('')}</select><small>${escapeHtml(state.pricing.source || 'Tabela de preços')} · ${escapeHtml(tableDate)}</small></div></section>`;
}

function deviceFamilyCard(group) {
  const expanded = state.expandedDeviceFamily === group.key;
  const { selection, option } = selectionForDeviceGroup(group);
  const memories = group.memories.map((memory) => ({
    value: memory,
    text: memory,
    disabled: !group.options.some((item) => item.memory === memory && variantRemaining(item.variant) > 0),
  }));
  const selectedMemory = option?.memory || memories[0]?.value || '';
  const colorOptions = group.options
    .filter((item) => item.memory === selectedMemory)
    .map((item) => ({
      value: item.color,
      text: `${item.color} · ${variantRemaining(item.variant)} un.`,
      disabled: variantRemaining(item.variant) <= 0,
    }));
  const caseChoices = compatibleCaseChoices(
    state.catalog.filter((product) => product.cluster === 'cases'),
    group.familyName,
  ).filter((choice) => choiceRemaining(choice) > 0);
  const filmChoices = groupAccessoryChoices(
    state.catalog.filter((product) => product.cluster === 'screen_protectors'),
  ).filter((choice) => choiceRemaining(choice) > 0);
  if (!caseChoices.some((choice) => choice.key === selection.caseKey)) selection.caseKey = '';
  if (!filmChoices.some((choice) => choice.key === selection.filmKey)) selection.filmKey = '';

  const selectedCase = caseChoices.find((choice) => choice.key === selection.caseKey);
  const selectedFilm = filmChoices.find((choice) => choice.key === selection.filmKey);
  const maxBundle = Math.min(
    variantRemaining(option?.variant),
    selectedCase ? choiceRemaining(selectedCase) : Number.MAX_SAFE_INTEGER,
    selectedFilm ? choiceRemaining(selectedFilm) : Number.MAX_SAFE_INTEGER,
  );
  selection.quantity = Math.min(selection.quantity, Math.max(1, maxBundle));
  state.deviceSelections.set(group.key, selection);
  const selectedPriceAvailable = selectedProductPrice(option?.product, option?.variant) != null;

  const representativeProduct = option?.product || group.products[0];
  const representative = {
    ...representativeProduct,
    name: group.familyName,
    nome: group.familyName,
    cluster: 'devices',
  };
  const summary = `<div class="device-family-summary"><span>${group.memories.join(' · ')}</span><span>${group.options.map((item) => item.color).filter((color, index, colors) => colors.indexOf(color) === index).join(' · ')}</span></div>`;
  const configurator = expanded ? `
    <div class="device-configurator">
      <div class="device-configurator__heading"><div><span>Monte o conjunto</span><strong>Escolha aparelho, capa e película</strong></div><small>Somente opções com estoque aparecem abaixo.</small></div>
      <div class="device-option-grid">
        <div class="field"><label>Memória</label><select class="select" data-action="device-memory" data-family-key="${escapeHtml(group.key)}">${selectOptions(memories, selectedMemory, 'Sem memória disponível')}</select></div>
        <div class="field"><label>Cor</label><select class="select" data-action="device-color" data-family-key="${escapeHtml(group.key)}">${selectOptions(colorOptions, option?.color || '', 'Sem cor disponível')}</select></div>
      </div>
      <div class="device-selected-material"><div><span>Aparelho selecionado</span><strong>${escapeHtml(option?.product.name || group.familyName)}</strong></div>${materialCodeBox(option?.variant.materialCode || '', true)}</div>
      ${selectedDevicePrice(option?.product, option?.variant)}
      ${renovaConfigurator(option?.product)}
      <div class="device-accessory-grid">
        ${accessorySelect({ action: 'device-case', familyKey: group.key, label: 'Capa compatível', emptyLabel: caseChoices.length ? 'Sem capa' : 'Nenhuma capa compatível em estoque', choices: caseChoices, selectedKey: selection.caseKey })}
        ${accessorySelect({ action: 'device-film', familyKey: group.key, label: 'Película', emptyLabel: filmChoices.length ? 'Sem película' : 'Nenhuma película em estoque', choices: filmChoices, selectedKey: selection.filmKey })}
      </div>
      <div class="device-configurator__footer">
        <div class="field device-quantity"><label>Quantidade do conjunto</label><input class="input" type="number" min="1" max="${Math.max(1, maxBundle)}" value="${selection.quantity}" data-action="device-quantity" data-family-key="${escapeHtml(group.key)}"></div>
        <div class="device-configurator__action"><span>${selectedPriceAvailable ? (selection.caseKey || selection.filmKey ? 'Os acessórios serão adicionados na mesma quantidade do aparelho.' : 'Você pode adicionar somente o aparelho ou incluir os acessórios.') : (option?.product.pricing ? 'Escolha a categoria do plano para liberar este aparelho.' : 'Aguardando a inclusão deste aparelho no simulador de preços.')}</span><button class="btn" data-action="add-device-bundle" data-family-key="${escapeHtml(group.key)}" ${maxBundle <= 0 || !selectedPriceAvailable ? 'disabled' : ''}>${selectedPriceAvailable ? 'Adicionar ao pedido' : 'Aguardando preço'}</button></div>
      </div>
    </div>` : '';

  return `<article class="store-card device-family-card ${expanded ? 'is-expanded' : ''}" data-family-key="${escapeHtml(group.key)}">
    <div class="device-family-card__visual">${productImageMedia(representative)}<span class="device-family-card__variants">${group.options.length} ${group.options.length === 1 ? 'variação' : 'variações'}</span></div>
    <div class="store-card__body"><div class="store-card__meta"><span>Modelo de aparelho</span><span>${escapeHtml(group.brand || 'Sem marca')}</span></div><h3>${escapeHtml(group.familyName)}</h3>${summary}${deviceGroupPrice(group)}<div class="store-card__stock"><strong>${group.available}</strong><span>${group.available === 1 ? 'unidade disponível' : 'unidades disponíveis'}</span></div><button class="btn ${expanded ? 'btn--secondary' : ''} store-card__button" data-action="toggle-device-family" data-family-key="${escapeHtml(group.key)}">${expanded ? 'Fechar opções' : 'Escolher memória, cor e acessórios'}</button>${configurator}</div>
  </article>`;
}

function deviceGroupByKey(familyKey) {
  return groupDeviceProducts(filteredCatalog()).find((group) => group.key === familyKey);
}

function accessoryChoiceByKey(cluster, group, key) {
  if (!key) return null;
  const products = state.catalog.filter((product) => product.cluster === cluster);
  const choices = cluster === 'cases'
    ? compatibleCaseChoices(products, group.familyName)
    : groupAccessoryChoices(products);
  return choices.find((choice) => choice.key === key) || null;
}

function stageVariant(staged, variant, quantity, productName) {
  const nextQuantity = Number(staged.get(Number(variant.id)) || 0) + quantity;
  if (nextQuantity > Number(variant.available)) {
    throw new ApiError(`Não há ${quantity} unidades disponíveis de ${productName}. Atualize a escolha.`, 409);
  }
  staged.set(Number(variant.id), nextQuantity);
}

function stageAccessory(staged, choice, quantity) {
  let remaining = quantity;
  for (const product of choice.products) {
    for (const variant of product.variants) {
      const free = Math.max(0, Number(variant.available) - Number(staged.get(Number(variant.id)) || 0));
      const allocated = Math.min(free, remaining);
      if (allocated > 0) stageVariant(staged, variant, allocated, choice.name);
      remaining -= allocated;
      if (!remaining) return;
    }
  }
  throw new ApiError(`Não há ${quantity} unidades disponíveis de ${choice.name}. Atualize a escolha.`, 409);
}

function addDeviceBundle(familyKey) {
  const group = deviceGroupByKey(familyKey);
  if (!group) throw new ApiError('Este modelo não está mais disponível. Atualize a loja.', 409);
  const { selection, option } = selectionForDeviceGroup(group);
  const quantity = Number(selection.quantity);
  if (!option || !Number.isInteger(quantity) || quantity <= 0) throw new ApiError('Escolha uma variação e uma quantidade válida.', 400);
  if (option.product.pricing && !state.priceCategory) {
    throw new ApiError('Escolha a categoria do plano antes de adicionar este aparelho.', 400);
  }
  if (option.product.pricing && selectedProductPrice(option.product) == null) {
    throw new ApiError(`Este aparelho não possui preço para ${state.priceCategory}.`, 409);
  }
  if (selectedProductPrice(option.product, option.variant) == null) {
    throw new ApiError('Este aparelho ainda não possui preço verificado no simulador.', 409);
  }

  const staged = new Map(state.cart);
  stageVariant(staged, option.variant, quantity, option.product.name);
  const selectedCase = accessoryChoiceByKey('cases', group, selection.caseKey);
  const selectedFilm = accessoryChoiceByKey('screen_protectors', group, selection.filmKey);
  if (selection.caseKey && !selectedCase) throw new ApiError('A capa escolhida não está mais disponível.', 409);
  if (selection.filmKey && !selectedFilm) throw new ApiError('A película escolhida não está mais disponível.', 409);
  if (selectedCase) stageAccessory(staged, selectedCase, quantity);
  if (selectedFilm) stageAccessory(staged, selectedFilm, quantity);

  state.cart.clear();
  for (const [variantId, itemQuantity] of staged) state.cart.set(variantId, itemQuantity);
  state.expandedDeviceFamily = '';
  state.deviceSelections.set(group.key, { ...selection, quantity: 1 });
  const accessoryCount = Number(Boolean(selectedCase)) + Number(Boolean(selectedFilm));
  showToast(accessoryCount ? `Aparelho e ${accessoryCount === 2 ? 'dois acessórios' : 'acessório'} adicionados ao pedido.` : 'Aparelho adicionado ao pedido.');
  renderCatalogGrid();
  renderCartBar();
}

function filteredCatalog() {
  const search = state.catalogSearch.trim().toLocaleLowerCase('pt-BR');
  return state.catalog.filter((product) => {
    if (state.catalogCategory && product.cluster !== state.catalogCategory) return false;
    if (!search) return true;
    return [product.name, product.technicalName, product.brand, materialCode(product)].some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(search));
  });
}

function catalogToolbar() {
  const clusters = [['', 'Todos'], ...clusterOrder.map((value) => [value, clusterLabels[value]])];
  return `<div class="catalog-toolbar"><div class="search-box"><input class="input" data-action="catalog-search" value="${escapeHtml(state.catalogSearch)}" placeholder="Buscar nome ou código material..."></div><div class="category-chips">${clusters.map(([value, label]) => `<button class="chip ${state.catalogCategory === value ? 'is-active' : ''}" data-action="filter-category" data-category="${value}">${label}</button>`).join('')}</div></div>`;
}

function renderCatalogGrid() {
  document.querySelectorAll('[data-action="filter-category"]').forEach((button) => button.classList.toggle('is-active', button.dataset.category === state.catalogCategory));
  const target = document.querySelector('[data-catalog-grid]');
  if (!target) return;
  renderIncomingCatalog();
  const products = filteredCatalog().filter((product) => Number(product.available || 0) > 0);
  const groups = clusterOrder.map((cluster) => ({ cluster, products: products.filter((product) => product.cluster === cluster) })).filter((group) => group.products.length);
  target.innerHTML = groups.length ? groups.map((group) => {
    if (group.cluster !== 'devices') {
      return `<section class="catalog-cluster"><div class="catalog-cluster__head"><h3>${escapeHtml(clusterLabels[group.cluster])}</h3><span>${group.products.length} ${group.products.length === 1 ? 'material' : 'materiais'}</span></div><div class="store-grid">${group.products.map(productCard).join('')}</div></section>`;
    }
    const deviceGroups = groupDeviceProducts(group.products);
    return `<section class="catalog-cluster catalog-cluster--devices"><div class="catalog-cluster__head"><div><h3>Aparelhos por modelo</h3><small>Abra um modelo para escolher memória, cor, capa e película.</small></div><span>${deviceGroups.length} ${deviceGroups.length === 1 ? 'modelo' : 'modelos'} · ${group.products.length} materiais</span></div><div class="store-grid device-family-grid">${deviceGroups.map(deviceFamilyCard).join('')}</div></section>`;
  }).join('') : emptyState('Nenhum produto encontrado', 'Altere a busca ou escolha outro grupo.');
}

async function loadCatalog() {
  const data = await api('/api/catalog');
  state.catalog = (data.products || []).map((product) => ({
    ...product,
    nome: product.name,
    imagem_url: typeof product.imagem_url === 'string' ? product.imagem_url.trim() : '',
  }));
  state.pricing = data.pricing || { categories: [], tableDate: '', source: '' };
  state.renovaCatalog = data.renova || { tableDate: '', devices: [], boosts: [] };
  if (state.priceCategory && !state.pricing.categories.includes(state.priceCategory)) state.priceCategory = '';
  if (state.renova.deviceId && !selectedRenovaTradeIn()) state.renova.deviceId = 0;
  for (const [variantId, quantity] of [...state.cart]) {
    const found = findCatalogVariant(variantId);
    if (!found || found.variant.available <= 0) state.cart.delete(variantId);
    else if (quantity > found.variant.available) state.cart.set(variantId, found.variant.available);
  }
  return state.catalog;
}

function findCatalogVariant(variantId) {
  for (const product of state.catalog) {
    const variant = product.variants.find((item) => item.id === Number(variantId));
    if (variant) return { product, variant };
  }
  return null;
}

function filteredStockRows() {
  const search = state.stockSearch.trim().toLocaleLowerCase('pt-BR');
  return state.catalog.flatMap((product) => product.variants.map((variant) => ({ product, variant }))).filter(({ product, variant }) => {
    if (state.stockCluster && product.cluster !== state.stockCluster) return false;
    return !search || [product.name, product.technicalName, product.brand, variant.materialCode].some((value) => String(value || '').toLocaleLowerCase('pt-BR').includes(search));
  });
}

function renderStockTable() {
  document.querySelectorAll('[data-action="filter-stock-category"]').forEach((button) => button.classList.toggle('is-active', button.dataset.category === state.stockCluster));
  const target = document.querySelector('[data-stock-table]');
  if (!target) return;
  const rows = filteredStockRows();
  if (!rows.length) {
    target.innerHTML = emptyState('Nenhum material encontrado', 'Altere a busca para consultar outro produto.');
    return;
  }
  const groups = clusterOrder.map((cluster) => ({ cluster, rows: rows.filter(({ product }) => product.cluster === cluster) })).filter((group) => group.rows.length);
  const body = groups.map((group) => {
    const groupHeader = `<tr class="stock-cluster-row"><td colspan="10"><div><strong>${escapeHtml(clusterLabels[group.cluster])}</strong><span>${group.rows.length} ${group.rows.length === 1 ? 'material' : 'materiais'}</span></div></td></tr>`;
    const groupRows = group.rows.map(({ product, variant }) => {
      const planPrices = product.pricing ? Object.values(product.pricing.prices || {}).map(Number) : [];
      const minimumPlanPrice = planPrices.length ? Math.min(...planPrices) : null;
      const exactPlanPrice = product.pricing && state.priceCategory ? selectedProductPrice(product, variant) : null;
      const retailPrice = product.pricing ? null : selectedProductPrice(product, variant);
      const shownPrice = exactPlanPrice ?? minimumPlanPrice ?? retailPrice;
      const priceCaption = exactPlanPrice != null
        ? state.priceCategory
        : minimumPlanPrice != null
          ? 'a partir de · escolha o plano acima'
          : productPriceKind(product, variant) === 'no_charge'
            ? 'sem cobrança'
            : 'preço fixo';
      const stockControl = variant.serialTracked
        ? `<span class="serial-tracked-badge">${uiIcon('check')} Serializado</span>`
        : state.user.role === 'manager'
          ? `<button class="btn btn--secondary btn--small" data-action="adjust-quantity" data-variant-id="${variant.id}">Ajustar</button>`
          : `<span class="balance-tracked-badge">${uiIcon('box')} Controle por saldo</span>`;
      const incomingDetail = Number(variant.incoming || 0) > 0
        ? `<div class="stock-incoming"><strong class="incoming-value">${Number(variant.incoming)}</strong><span>${escapeHtml(incomingDepositsText(variant.incomingDeposits))}</span></div>`
        : '<span class="unavailable-value">—</span>';
      return `<tr><td data-label="Produto"><div class="stock-product-cell">${productImageMarkup(product, 'stock-product-cell__image', 48, 48)}<div><div class="cell-main">${escapeHtml(product.name)}</div><div class="cell-sub">${escapeHtml(product.brand || 'Sem marca')}</div></div></div></td><td data-label="Código material"><code class="material-pill mono">${escapeHtml(variant.materialCode)}</code></td><td data-label="Grupo">${escapeHtml(clusterLabels[product.cluster] || clusterLabels.misc)}</td><td data-label="Preço">${shownPrice == null ? '<span class="price-unavailable">—</span>' : `<div class="stock-price"><strong>${productPriceKind(product, variant) === 'no_charge' ? 'Sem cobrança' : formatMoney(shownPrice)}</strong><span>${escapeHtml(priceCaption)}</span></div>`}</td><td data-label="Saldo físico"><strong>${variant.onHand}</strong></td><td data-label="Reservado">${variant.reserved}</td><td data-label="Com vendedores">${Number(variant.allocatedToSellers || 0)}</td><td data-label="Disponível"><strong class="${Number(variant.available) > 0 ? 'available-value' : 'unavailable-value'}">${variant.available}</strong></td><td data-label="Em chegada">${incomingDetail}</td><td data-label="Controle">${stockControl}</td></tr>`;
    }).join('');
    return groupHeader + groupRows;
  }).join('');
  target.innerHTML = `<div class="table-scroll"><table class="table responsive-table"><thead><tr><th>Produto</th><th>Código material</th><th>Grupo</th><th>Preço</th><th>Saldo físico</th><th>Reservado</th><th>Com vendedores</th><th>Disponível</th><th>Em chegada</th><th></th></tr></thead><tbody>${body}</tbody></table></div>`;
}

async function renderStock() {
  const content = document.querySelector('#view-content');
  if (state.user.role === 'seller') return renderSellerStore('Produtos disponíveis', 'Consulte o saldo e adicione itens ao seu próximo pedido.');
  await loadCatalog();
  const totals = state.catalog.reduce((summary, product) => ({
    onHand: summary.onHand + Number(product.onHand || 0),
    reserved: summary.reserved + Number(product.reserved || 0),
    allocated: summary.allocated + Number(product.allocatedToSellers || 0),
    available: summary.available + Number(product.available || 0),
    incoming: summary.incoming + Number(product.incoming || 0),
  }), { onHand: 0, reserved: 0, allocated: 0, available: 0, incoming: 0 });
  const unavailableMaterials = state.catalog.filter((product) => Number(product.available || 0) === 0).length;
  const hasQuantityOnly = state.catalog.some((product) => product.variants.some((variant) => !variant.serialTracked));
  const movementButton = state.user.role === 'manager' && hasQuantityOnly ? '<button class="btn" data-action="open-quantity">+ Nova movimentação</button>' : '';
  const clusters = [['', 'Todos'], ...clusterOrder.map((value) => [value, clusterLabels[value]])];
  const heading = state.user.role === 'stocker'
    ? ['Conferência operacional', 'Estoque completo', 'Consulte preços, códigos materiais e disponibilidade antes de separar os pedidos.']
    : ['Inventário serializado', 'Estoque por código material', `${state.catalog.length} materiais cadastrados e rastreados pelo sistema.`];
  content.innerHTML = `<div class="page-heading"><div><p class="page-eyebrow">${heading[0]}</p><h2>${heading[1]}</h2><p>${heading[2]}</p></div>${movementButton}</div>
    <div class="metrics-grid stock-metrics">${metric('Saldo físico', totals.onHand, `${state.catalog.length} materiais cadastrados`, 'metric-card--info')}${metric('Disponível', totals.available, 'Pronto para pedidos', 'metric-card--success')}${metric('Reservado', totals.reserved, `${totals.allocated} chip(s) com vendedores`)}${metric('Em chegada', totals.incoming, `${unavailableMaterials} materiais sem saldo · DEPS/NREM`, 'metric-card--warning')}</div>
    ${pricingSelector()}
    <section class="card stock-section"><div class="card__head"><div><h3>Produtos</h3><span>Preço, saldo físico, reservado, disponível e itens a caminho por depósito</span></div></div><div class="stock-toolbar"><div class="search-box"><input class="input" data-action="stock-search" value="${escapeHtml(state.stockSearch)}" placeholder="Buscar nome ou código material..."></div><div class="category-chips">${clusters.map(([value, label]) => `<button class="chip ${state.stockCluster === value ? 'is-active' : ''}" data-action="filter-stock-category" data-category="${value}">${label}</button>`).join('')}</div></div><div class="card__body--flush" data-stock-table></div></section>`;
  renderStockTable();
}

function renderCartBar() {
  const target = document.querySelector('[data-cart-bar]');
  if (!target) return;
  const cartAvailable = state.user?.role === 'seller' && ['new-request', 'stock'].includes(state.view);
  if (!cartAvailable) {
    target.replaceChildren();
    document.body.classList.remove('cart-drawer-open');
    return;
  }
  const units = [...state.cart.values()].reduce((sum, quantity) => sum + quantity, 0);
  const pricedSelection = [...state.cart].map(([variantId, quantity]) => {
    const found = findCatalogVariant(variantId);
    return found ? { ...found, quantity, unitPriceCents: selectedProductPrice(found.product, found.variant) } : null;
  }).filter(Boolean);
  const subtotal = pricedSelection.reduce((sum, item) => sum + (item.unitPriceCents == null ? 0 : item.unitPriceCents * item.quantity), 0);
  const renova = renovaDiscountFor(pricedSelection);
  const orderTotal = Math.max(0, subtotal - renova.discountCents);
  const hasUnpricedItem = pricedSelection.some((item) => item.unitPriceCents == null);
  const subtotalLabel = hasUnpricedItem ? 'Subtotal dos itens com preço' : 'Subtotal ao vivo';
  const renovaSummary = renova.discountCents > 0
    ? `<div class="cart-drawer__renova"><span>Desconto Renova</span><strong>− ${formatMoney(renova.discountCents)}</strong></div><div class="cart-drawer__total"><span>Total após Renova</span><strong>${formatMoney(orderTotal)}</strong></div>`
    : '';
  const cartItems = pricedSelection.map(({ product: produto, variant, quantity, unitPriceCents }) => {
    const lineTotal = unitPriceCents == null ? null : unitPriceCents * quantity;
    const price = unitPriceCents == null
      ? 'Preço pendente'
      : productPriceKind(produto, variant) === 'no_charge'
        ? 'Sem cobrança'
        : `${formatMoney(unitPriceCents)} por unidade`;
    return `<article class="cart-drawer-item">
      <div class="cart-drawer-item__thumb">${productImageMarkup(produto, 'cart-drawer-item__image', 64, 64)}</div>
      <div class="cart-drawer-item__content"><strong>${escapeHtml(produto.name)}</strong><span class="mono">${escapeHtml(variant.materialCode)}</span><small>${price}</small></div>
      <div class="cart-drawer-item__line-total">${lineTotal == null ? '—' : formatMoney(lineTotal)}</div>
      <div class="cart-drawer-item__quantity" aria-label="Quantidade de ${escapeHtml(produto.name)}">
        <button type="button" data-action="decrease-cart-item" data-variant-id="${variant.id}" aria-label="Diminuir quantidade">−</button>
        <strong>${quantity}</strong>
        <button type="button" data-action="increase-cart-item" data-variant-id="${variant.id}" aria-label="Aumentar quantidade">+</button>
      </div>
      <button type="button" class="cart-drawer-item__remove" data-action="remove-cart-drawer-item" data-variant-id="${variant.id}" aria-label="Remover ${escapeHtml(produto.name)} do pedido">${uiIcon('close')}</button>
    </article>`;
  }).join('');
  const drawerClass = state.cartDrawerOpen ? ' is-open' : '';
  const drawerHidden = state.cartDrawerOpen ? 'false' : 'true';
  target.innerHTML = `<button id="cart-fab" class="cart-fab${units ? ' has-items' : ''}" type="button" aria-controls="cart-drawer" aria-expanded="${state.cartDrawerOpen ? 'true' : 'false'}" aria-label="Abrir carrinho com ${units} ${units === 1 ? 'item' : 'itens'}">
      ${uiIcon('orders')}<span class="cart-fab__label">${units ? 'Seu pedido' : 'Carrinho'}</span><strong class="cart-fab__total">${formatMoney(orderTotal)}</strong><span class="cart-fab__count">${units}</span>
    </button>
    <button class="cart-drawer-overlay${drawerClass}" type="button" data-action="close-cart-drawer" aria-label="Fechar carrinho" tabindex="-1"></button>
    <aside id="cart-drawer" class="cart-drawer${drawerClass}" aria-hidden="${drawerHidden}" aria-labelledby="cart-drawer-title">
      <header class="cart-drawer__header"><div><span>Resumo do pedido</span><h2 id="cart-drawer-title">Seu carrinho</h2><p>${units} ${units === 1 ? 'item selecionado' : 'itens selecionados'} · ${state.cart.size} ${state.cart.size === 1 ? 'material' : 'materiais'}</p></div><button type="button" class="cart-drawer__close" data-action="close-cart-drawer" aria-label="Fechar carrinho">${uiIcon('close')}</button></header>
      <div class="cart-drawer__items">${cartItems || `<div class="cart-drawer__empty">${uiIcon('orders')}<strong>Seu carrinho está vazio</strong><span>Adicione produtos para montar um pedido.</span></div>`}</div>
      <footer class="cart-drawer__footer">
        <div class="cart-drawer__subtotal" aria-live="polite"><span>${subtotalLabel}</span><strong>${formatMoney(subtotal)}</strong></div>${renovaSummary}
        <button type="button" class="btn cart-drawer__finish" data-action="review-request" ${units ? '' : 'disabled'}>${uiIcon('check')}<span>Revisar e finalizar pedido</span></button>
      </footer>
    </aside>`;
  document.body.classList.toggle('cart-drawer-open', state.cartDrawerOpen);
}

function setCartDrawer(open, restoreFocus = true) {
  state.cartDrawerOpen = Boolean(open);
  const drawer = document.querySelector('.cart-drawer');
  const overlay = document.querySelector('.cart-drawer-overlay');
  const fab = document.querySelector('.cart-fab');
  drawer?.classList.toggle('is-open', state.cartDrawerOpen);
  overlay?.classList.toggle('is-open', state.cartDrawerOpen);
  drawer?.setAttribute('aria-hidden', state.cartDrawerOpen ? 'false' : 'true');
  fab?.setAttribute('aria-expanded', state.cartDrawerOpen ? 'true' : 'false');
  document.body.classList.toggle('cart-drawer-open', state.cartDrawerOpen);
  if (state.cartDrawerOpen) window.setTimeout(() => drawer?.querySelector('[data-action="close-cart-drawer"]')?.focus(), 0);
  else if (restoreFocus) fab?.focus();
}

async function handleCartRootClick(event) {
  const button = event.target.closest('button');
  if (!button || !event.currentTarget.contains(button)) return;
  try {
    if (button.id === 'cart-fab') {
      setCartDrawer(true);
      return;
    }
    const action = button.dataset.action;
    if (action === 'close-cart-drawer') setCartDrawer(false);
    if (action === 'remove-cart-drawer-item') {
      state.cart.delete(Number(button.dataset.variantId));
      renderCatalogGrid();
      renderCartBar();
    }
    if (action === 'decrease-cart-item') {
      const variantId = Number(button.dataset.variantId);
      const nextQuantity = Number(state.cart.get(variantId) || 0) - 1;
      if (nextQuantity > 0) state.cart.set(variantId, nextQuantity);
      else state.cart.delete(variantId);
      renderCatalogGrid();
      renderCartBar();
    }
    if (action === 'increase-cart-item') {
      const variantId = Number(button.dataset.variantId);
      const found = findCatalogVariant(variantId);
      const nextQuantity = Number(state.cart.get(variantId) || 0) + 1;
      if (!found || nextQuantity > Number(found.variant.available)) throw new ApiError('Não há mais unidades disponíveis deste produto.', 409);
      state.cart.set(variantId, nextQuantity);
      renderCatalogGrid();
      renderCartBar();
    }
    if (action === 'review-request') {
      setCartDrawer(false, false);
      requestReviewModal();
    }
  } catch (error) {
    if (error.status !== 401) showToast(error.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('cart-root')?.addEventListener('click', handleCartRootClick);
  document.addEventListener('error', handleProductImageError, true);
});

async function renderSellerStore(title = 'Monte seu pedido', description = 'Escolha os produtos e informe as quantidades.') {
  const content = document.querySelector('#view-content');
  await loadCatalog();
  content.innerHTML = `<div class="page-heading"><div><p class="page-eyebrow">Loja interna</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)} Produtos em DEPS e NREM aparecem como “a caminho” e ainda não entram no pedido.</p></div></div>${pricingSelector()}${catalogToolbar()}<div data-incoming-catalog></div><div data-catalog-grid></div>`;
  renderCatalogGrid();
  renderCartBar();
}

async function renderNewRequest() {
  return renderSellerStore('Monte seu pedido', 'Busque pelo nome ou código material e escolha a quantidade.');
}

async function renderRequests() {
  const content = document.querySelector('#view-content');
  const query = state.requestFilter ? `?status=${encodeURIComponent(state.requestFilter)}` : '';
  const data = await api(`/api/requests${query}`);
  state.requests = data.requests;
  const filters = state.user.role === 'stocker'
    ? [['approved', 'Prontos para separar'], ['', 'Todos'], ['cancelled', 'Cancelados']]
    : [['', 'Todos'], ['approved', 'Liberados'], ['rejected', 'Recusados'], ['cancelled', 'Cancelados']];
  const heading = state.user.role === 'manager'
    ? ['Monitoramento', 'Pedidos de retirada', 'Acompanhe produtos, vendedor, horário e números de série liberados automaticamente.']
    : state.user.role === 'stocker'
      ? ['Separação e conferência', 'Pedidos para separar', 'Confira códigos, IMEIs e valores. Se houver divergência, cancele e devolva os itens ao estoque.']
      : ['Seus pedidos', 'Meus pedidos', 'Os pedidos são liberados automaticamente e o IMEI aparece logo após o envio.'];
  const stockerSchedule = state.user.role === 'stocker' ? teamBreakSchedule('dashboard') : '';
  content.innerHTML = `<div class="page-heading"><div><p class="page-eyebrow">${heading[0]}</p><h2>${heading[1]}</h2><p>${heading[2]}</p></div>${state.user.role === 'seller' ? '<button class="btn" data-action="navigate" data-view="new-request">+ Novo pedido</button>' : ''}</div>${stockerSchedule}<div class="filter-tabs">${filters.map(([value, label]) => `<button class="chip ${state.requestFilter === value ? 'is-active' : ''}" data-action="filter-requests" data-status="${value}">${label}</button>`).join('')}</div><div class="requests-list ${state.user.role === 'stocker' ? 'requests-list--stocker' : ''}">${state.requests.length ? state.requests.map((item) => requestCard(item)).join('') : emptyState('Nenhum pedido encontrado', 'Não há solicitações com este status.')}</div>`;
}

function chipStatusBadge(chip) {
  if (!chip.active) return '<span class="chip-state chip-state--removed">Retirado</span>';
  if (chip.status === 'sold') return '<span class="chip-state chip-state--sold">Vendido</span>';
  return '<span class="chip-state chip-state--available">Disponível</span>';
}

function filteredChips() {
  const query = state.chipSearch.trim().toLocaleUpperCase('pt-BR');
  return state.chips.filter((chip) => {
    const statusMatches = state.chipStatus === 'all'
      || (state.chipStatus === 'removed' ? !chip.active : chip.active && chip.status === state.chipStatus);
    const sellerMatches = !state.chipSellerId || chip.sellerId === state.chipSellerId;
    const haystack = [chip.materialCode, chip.iccid, chip.sellerName, chip.sellerEmail, chip.registeredPhone]
      .join(' ').toLocaleUpperCase('pt-BR');
    return statusMatches && sellerMatches && (!query || haystack.includes(query));
  });
}

function chipActionButtons(chip) {
  const copy = `<button class="btn btn--ghost btn--small" data-action="copy-chip-iccid" data-id="${escapeHtml(chip.id)}">${uiIcon('copy')} Copiar ICCID</button>`;
  if (state.user.role === 'seller') {
    return chip.active && chip.status === 'available'
      ? `${copy}<button class="btn btn--small" data-action="sell-chip" data-id="${escapeHtml(chip.id)}">Registrar venda</button>`
      : copy;
  }
  if (!chip.active) {
    return `${copy}<button class="btn btn--secondary btn--small" data-action="restore-chip" data-id="${escapeHtml(chip.id)}">Restaurar</button>`;
  }
  if (chip.status === 'sold') {
    return `${copy}<button class="btn btn--secondary btn--small" data-action="reopen-chip" data-id="${escapeHtml(chip.id)}">Corrigir venda</button><button class="btn btn--danger btn--small" data-action="remove-chip" data-id="${escapeHtml(chip.id)}">Retirar</button>`;
  }
  return `${copy}<button class="btn btn--secondary btn--small" data-action="edit-chip" data-id="${escapeHtml(chip.id)}">Transferir</button><button class="btn btn--small" data-action="sell-chip" data-id="${escapeHtml(chip.id)}">Registrar venda</button><button class="btn btn--danger btn--small" data-action="remove-chip" data-id="${escapeHtml(chip.id)}">Retirar</button>`;
}

function chipRow(chip) {
  const sale = chip.status === 'sold'
    ? `<div class="chip-sale"><strong>${escapeHtml(formatPhoneNumber(chip.registeredPhone))}</strong><span>Venda em ${escapeHtml(formatDateOnly(chip.soldOn))}</span></div>`
    : '<span class="chip-table__muted">Aguardando venda</span>';
  return `<tr class="${chip.active ? '' : 'is-removed'}">
    ${state.user.role === 'manager' ? `<td><div class="chip-seller-cell"><span>${escapeHtml(initials(chip.sellerName))}</span><div><strong>${escapeHtml(chip.sellerName)}</strong><small>${escapeHtml(chip.sellerEmail)}</small></div></div></td>` : ''}
    <td><code class="chip-material mono">${escapeHtml(chip.materialCode)}</code></td>
    <td><div class="chip-iccid"><code class="mono">${escapeHtml(chip.iccid)}</code><small>${chip.iccid.length} dígitos · ${chip.stockLinked ? 'identificado no estoque' : 'cadastro histórico'}</small></div></td>
    <td>${chipStatusBadge(chip)}</td>
    <td>${sale}</td>
    <td><div class="chip-actions">${chipActionButtons(chip)}</div></td>
  </tr>`;
}

function renderChipResults() {
  document.querySelectorAll('[data-action="filter-chips"]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.status === state.chipStatus);
  });
  const sellerSelect = document.querySelector('[data-action="filter-chip-seller"]');
  if (sellerSelect) sellerSelect.value = String(state.chipSellerId || '');
  const target = document.querySelector('[data-chip-results]');
  if (!target) return;
  const chips = filteredChips();
  const columns = state.user.role === 'manager' ? 6 : 5;
  target.innerHTML = `<div class="chip-table-scroll"><table class="chip-table"><thead><tr>${state.user.role === 'manager' ? '<th>Vendedor</th>' : ''}<th>Material</th><th>ICCID</th><th>Situação</th><th>Cadastro da linha</th><th>Ações</th></tr></thead><tbody>${chips.length ? chips.map(chipRow).join('') : `<tr><td colspan="${columns}">${emptyState('Nenhum chip encontrado', 'Ajuste os filtros ou cadastre um novo chip.')}</td></tr>`}</tbody></table></div><p class="chip-result-count">${chips.length} ${chips.length === 1 ? 'chip encontrado' : 'chips encontrados'}</p>`;
}

function chipSellerRoster() {
  if (state.user.role !== 'manager') return '';
  if (!state.chipSellers.length) return `<section class="chip-roster chip-roster--empty"><div><p class="page-eyebrow">Distribuição</p><h3>Nenhum vendedor ativo</h3><p>Crie um usuário vendedor antes de distribuir chips.</p></div><button class="btn btn--secondary" data-action="navigate" data-view="users">Abrir usuários</button></section>`;
  return `<section class="chip-roster"><div class="chip-roster__head"><div><p class="page-eyebrow">Carteiras da equipe</p><h3>Até ${Number(state.chipLimit)} chips disponíveis por vendedor</h3><p>Chips vendidos permanecem no histórico e liberam espaço para reposição.</p></div><button class="btn btn--secondary" data-action="clear-chip-seller">Ver todos</button></div><div class="chip-roster__grid">${state.chipSellers.map((seller) => {
    const percentage = Math.min(100, Math.round((seller.availableCount / state.chipLimit) * 100));
    return `<button class="chip-owner-card ${state.chipSellerId === seller.id ? 'is-selected' : ''}" data-action="select-chip-seller" data-seller-id="${seller.id}"><span class="chip-owner-card__avatar">${escapeHtml(initials(seller.name))}</span><div><strong>${escapeHtml(seller.name)}</strong><small>${seller.availableCount} disponíveis · ${seller.soldCount} vendidos</small><span class="chip-owner-card__bar"><i style="width:${percentage}%"></i></span></div><b>${seller.availableCount}/${state.chipLimit}</b></button>`;
  }).join('')}</div></section>`;
}

async function renderChips() {
  const content = document.querySelector('#view-content');
  const data = await api('/api/chips');
  state.chips = data.chips || [];
  state.chipSellers = data.sellers || [];
  state.chipMaterials = data.materials || [];
  state.chipLimit = Number(data.limit || 10);
  const available = Number(data.summary?.available || 0);
  const sold = Number(data.summary?.sold || 0);
  const removed = Number(data.summary?.removed || 0);
  const sellerFree = Math.max(0, state.chipLimit - available);
  const manager = state.user.role === 'manager';
  const intro = manager
    ? ['Gestão de SIM cards', 'Controle todos os chips da equipe.', 'Escolha um material disponível, informe os 6 últimos dígitos do ICCID e distribua a unidade identificada.']
    : ['Sua carteira', 'Seus chips em um só lugar.', 'Confira material e ICCID. Quando vender, registre a data e o número ativado.'];
  const addButton = manager && state.chipSellers.length
    ? `<button class="btn" data-action="open-chip">${uiIcon('sim')} Cadastrar chip</button>`
    : '';
  const thirdMetric = manager
    ? `<article><span>Retirados</span><strong>${removed}</strong><small>preservados no histórico</small></article>`
    : `<article><span>Vagas livres</span><strong>${sellerFree}</strong><small>limite de ${state.chipLimit}</small></article>`;
  const sellerOptions = manager
    ? `<div class="field chip-filter-owner"><label for="chip-seller-filter">Vendedor</label><select class="select" id="chip-seller-filter" data-action="filter-chip-seller"><option value="">Todos os vendedores</option>${state.chipSellers.map((seller) => `<option value="${seller.id}" ${state.chipSellerId === seller.id ? 'selected' : ''}>${escapeHtml(seller.name)} · ${seller.availableCount}/${state.chipLimit}</option>`).join('')}</select></div>`
    : '';
  const filters = manager
    ? [['all', 'Todos'], ['available', 'Disponíveis'], ['sold', 'Vendidos'], ['removed', 'Retirados']]
    : [['available', 'Disponíveis'], ['sold', 'Vendidos'], ['all', 'Todos']];
  content.innerHTML = `<section class="chips-hero"><div><p class="page-eyebrow">${intro[0]}</p><h2>${intro[1]}</h2><p>${intro[2]}</p></div>${addButton}</section>
    <section class="chip-metrics"><article><span>Disponíveis</span><strong>${available}</strong><small>${manager ? 'nas carteiras ativas' : `de ${state.chipLimit} sob sua responsabilidade`}</small></article><article><span>Vendidos</span><strong>${sold}</strong><small>com data e linha registradas</small></article>${thirdMetric}</section>
    ${chipSellerRoster()}
    <section class="chip-control"><div class="chip-control__head"><div><p class="page-eyebrow">Conferência</p><h3>${manager ? 'Todos os chips' : 'Material, ICCID e vendas'}</h3></div><div class="chip-control__scan-note">${uiIcon('sim')}<span><strong>Busca inteligente</strong>Identificação pelos 6 últimos dígitos.</span></div></div>
      <div class="chip-toolbar"><div class="field chip-search"><label for="chip-search">Buscar chip</label><input class="input" id="chip-search" data-action="chip-search" value="${escapeHtml(state.chipSearch)}" placeholder="Material, ICCID, vendedor ou linha"></div>${sellerOptions}<div class="chip-filter-tabs" aria-label="Filtrar situação">${filters.map(([value, label]) => `<button class="chip ${state.chipStatus === value ? 'is-active' : ''}" data-action="filter-chips" data-status="${value}">${label}</button>`).join('')}</div></div>
      <div data-chip-results></div>
    </section>`;
  renderChipResults();
}

function newsCategory(item) {
  return newsCategoryInfo[item?.category] || newsCategoryInfo.notice;
}

function safeNewsImagePath(value = '') {
  const path = String(value || '');
  return /^\/news\/[a-z0-9][a-z0-9._-]*\.(?:jpe?g|png|webp)$/i.test(path) ? path : '';
}

function newsBody(value = '') {
  const lines = String(value || '').replace(/\r/g, '').split('\n');
  let html = '';
  let listOpen = false;
  const closeList = () => {
    if (!listOpen) return;
    html += '</ul>';
    listOpen = false;
  };
  for (const sourceLine of lines) {
    const line = sourceLine.trim();
    if (!line) {
      closeList();
      continue;
    }
    if (line.startsWith('## ')) {
      closeList();
      html += `<h4>${escapeHtml(line.slice(3))}</h4>`;
      continue;
    }
    if (line.startsWith('• ')) {
      if (!listOpen) {
        html += '<ul>';
        listOpen = true;
      }
      const parts = line.slice(2).split(' — ');
      const label = parts.shift() || '';
      const detail = parts.join(' — ');
      html += `<li><span>${escapeHtml(label)}</span>${detail ? `<strong>${escapeHtml(detail)}</strong>` : ''}</li>`;
      continue;
    }
    if (line.startsWith('! ')) {
      closeList();
      html += `<aside>${escapeHtml(line.slice(2))}</aside>`;
      continue;
    }
    closeList();
    html += `<p>${escapeHtml(line)}</p>`;
  }
  closeList();
  return html;
}

function newsCard(item) {
  const category = newsCategory(item);
  const imagePath = safeNewsImagePath(item.imagePath);
  const cardImagePath = safeNewsImagePath(newsCardArtwork[imagePath] || imagePath);
  const hasCuratedArtwork = cardImagePath !== imagePath;
  const managerControls = state.user.role === 'manager'
    ? `<div class="news-card__actions"><button class="btn btn--secondary btn--small" data-action="edit-news" data-id="${escapeHtml(item.id)}">Editar</button><button class="btn ${item.active ? 'btn--danger' : ''} btn--small" data-action="toggle-news" data-id="${escapeHtml(item.id)}" data-active="${item.active ? 'false' : 'true'}">${item.active ? 'Ocultar da aba' : 'Publicar novamente'}</button></div>`
    : '';
  return `<article class="news-card news-card--${escapeHtml(item.category)} ${imagePath ? 'news-card--media' : ''} ${item.active ? '' : 'is-hidden'}">
    <div class="news-card__accent"><span>${uiIcon(category.icon)}</span><small>${escapeHtml(category.label)}</small></div>
    ${imagePath ? `<button type="button" class="news-card__media ${hasCuratedArtwork ? 'news-card__media--curated' : ''}" data-action="view-news-art" data-id="${escapeHtml(item.id)}" aria-label="Ampliar arte: ${escapeHtml(item.title)}"><img src="${escapeHtml(cardImagePath)}" alt="${escapeHtml(item.imageAlt || item.title)}" loading="lazy" decoding="async"><span>${uiIcon('search')} Ver arte completa</span></button>` : ''}
    <div class="news-card__content">
      <div class="news-card__heading"><div><span class="news-category news-category--${escapeHtml(item.category)}">${escapeHtml(category.label)}</span>${item.validityLabel ? `<span class="news-validity">${escapeHtml(item.validityLabel)}</span>` : ''}${item.active ? '' : '<span class="news-hidden-label">Oculta</span>'}</div><time>${formatDate(item.updatedAt)}</time></div>
      <h3>${escapeHtml(item.title)}</h3>
      <div class="news-card__body">${newsBody(item.body)}</div>
      <div class="news-card__meta"><span>Publicado por ${escapeHtml(item.authorName)}</span>${item.updatedAt !== item.createdAt ? '<span>Conteúdo atualizado</span>' : ''}</div>
      ${managerControls}
    </div>
  </article>`;
}

async function renderNews() {
  const content = document.querySelector('#view-content');
  const data = await api('/api/news');
  state.news = data.news || [];
  const visibleCount = state.news.filter((item) => item.active).length;
  const hiddenCount = state.news.length - visibleCount;
  const managerSummary = state.user.role === 'manager'
    ? `<div class="news-manager-summary"><span><strong>${visibleCount}</strong> publicadas</span><span><strong>${hiddenCount}</strong> ocultas</span><p>Itens ocultos continuam disponíveis somente aqui para edição ou republicação.</p></div>`
    : '';
  const emptyAction = state.user.role === 'manager'
    ? '<button class="btn" data-action="open-news">Publicar a primeira notícia</button>'
    : '';
  content.innerHTML = `<section class="news-hero">
      <div><span>Informações da loja</span><h2>Notícias, promoções e comunicados.</h2><p>Acompanhe aqui o que está acontecendo e as orientações que precisam chegar a toda a equipe.</p></div>
      ${state.user.role === 'manager' ? '<button class="btn" data-action="open-news">+ Publicar notícia</button>' : `<div class="news-hero__mark">${uiIcon('news')}<span>${visibleCount} ${visibleCount === 1 ? 'publicação' : 'publicações'}</span></div>`}
    </section>
    ${managerSummary}
    <section class="news-feed" aria-label="Publicações da loja">${state.news.length ? state.news.map(newsCard).join('') : emptyState('Nenhuma notícia publicada', state.user.role === 'manager' ? 'Crie uma promoção, comunicado ou novidade para a equipe.' : 'As próximas promoções e informações da loja aparecerão aqui.', emptyAction)}</section>`;
}


function renovaIntakeStatus(item) {
  return item.pickupOn
    ? '<span class="renova-intake-status renova-intake-status--picked">Retirado</span>'
    : '<span class="renova-intake-status renova-intake-status--waiting">Aguardando retirada</span>';
}

function filteredRenovaIntakeItems() {
  const query = state.renovaSearch.trim().toLocaleUpperCase('pt-BR');
  return state.renovaItems.filter((item) => {
    const statusMatches = state.renovaStatus === 'all'
      || (state.renovaStatus === 'picked_up' ? Boolean(item.pickupOn) : !item.pickupOn);
    return statusMatches && (!query || item.model.toLocaleUpperCase('pt-BR').includes(query));
  });
}

function renderRenovaIntakeResults() {
  document.querySelectorAll('[data-action="filter-renova-intake"]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.status === state.renovaStatus);
  });
  const target = document.querySelector('[data-renova-intake-results]');
  if (!target) return;
  const items = filteredRenovaIntakeItems();
  target.innerHTML = items.length
    ? `<div class="renova-intake-grid">${items.map((item) => `<article class="renova-intake-card ${item.pickupOn ? 'is-picked' : ''}">
        <div class="renova-intake-card__icon">${uiIcon('renova')}</div>
        <div class="renova-intake-card__main"><div class="renova-intake-card__heading">${renovaIntakeStatus(item)}<small>Atualizado por ${escapeHtml(item.updatedByName)}</small></div><h3>${escapeHtml(item.model)}</h3><div class="renova-intake-dates"><div><span>Recebido em</span><strong>${escapeHtml(formatDateOnly(item.receivedOn))}</strong></div><div><span>Retirado em</span><strong>${item.pickupOn ? escapeHtml(formatDateOnly(item.pickupOn)) : 'Ainda não retirado'}</strong></div></div></div>
        <div class="renova-intake-card__actions">${item.pickupOn ? `<button class="btn btn--secondary btn--small" data-action="edit-renova-intake" data-id="${escapeHtml(item.id)}">Corrigir dados</button>` : `<button class="btn btn--small" data-action="pickup-renova-intake" data-id="${escapeHtml(item.id)}">Registrar retirada</button><button class="btn btn--secondary btn--small" data-action="edit-renova-intake" data-id="${escapeHtml(item.id)}">Editar</button>`}</div>
      </article>`).join('')}</div><p class="renova-intake-result-count">${items.length} ${items.length === 1 ? 'aparelho encontrado' : 'aparelhos encontrados'}</p>`
    : emptyState('Nenhum aparelho encontrado', state.renovaStatus === 'awaiting_pickup' ? 'Não há aparelhos aguardando retirada.' : 'Ajuste a busca ou cadastre um novo aparelho.');
}

async function renderRenovaIntake() {
  const content = document.querySelector('#view-content');
  const data = await api('/api/renova-intake');
  state.renovaItems = data.items || [];
  const awaiting = Number(data.summary?.awaitingPickup || 0);
  const pickedUp = Number(data.summary?.pickedUp || 0);
  const total = Number(data.summary?.total || 0);
  content.innerHTML = `<section class="renova-intake-hero"><div><p class="page-eyebrow">Controle de aparelhos recebidos</p><h2>Renova</h2><p>Registre os aparelhos deixados na loja e acompanhe o que ainda aguarda retirada pela empresa.</p></div><button class="btn" data-action="open-renova-intake">${uiIcon('plus')} Cadastrar aparelho</button></section>
    <section class="renova-intake-metrics"><article><span>Aguardando retirada</span><strong>${awaiting}</strong><small>aparelhos na loja</small></article><article><span>Já retirados</span><strong>${pickedUp}</strong><small>com data registrada</small></article><article><span>Total recebido</span><strong>${total}</strong><small>histórico completo</small></article></section>
    <section class="renova-intake-control"><div class="renova-intake-control__head"><div><p class="page-eyebrow">Acompanhamento</p><h3>Recebimentos e retiradas</h3></div><div class="renova-intake-filter-tabs" aria-label="Filtrar aparelhos"><button class="chip ${state.renovaStatus === 'awaiting_pickup' ? 'is-active' : ''}" data-action="filter-renova-intake" data-status="awaiting_pickup">Aguardando</button><button class="chip ${state.renovaStatus === 'picked_up' ? 'is-active' : ''}" data-action="filter-renova-intake" data-status="picked_up">Retirados</button><button class="chip ${state.renovaStatus === 'all' ? 'is-active' : ''}" data-action="filter-renova-intake" data-status="all">Todos</button></div></div><div class="renova-intake-toolbar"><div class="field"><label for="renova-intake-search">Buscar modelo</label><input class="input" id="renova-intake-search" data-action="search-renova-intake" value="${escapeHtml(state.renovaSearch)}" placeholder="Ex.: iPhone 15, Galaxy S24..."></div></div><div data-renova-intake-results></div></section>`;
  renderRenovaIntakeResults();
}

async function renderUsers() {
  const content = document.querySelector('#view-content');
  const data = await api('/api/users');
  state.users = data.users;
  content.innerHTML = `<div class="page-heading"><div><p class="page-eyebrow">Acessos</p><h2>Usuários</h2><p>Edite todos os dados ou exclua acessos que não são mais utilizados.</p></div><button class="btn" data-action="open-user">+ Novo usuário</button></div><section class="card"><div class="card__body--flush"><div class="table-scroll"><table class="table responsive-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Criado em</th><th></th></tr></thead><tbody>${state.users.map((user) => `<tr><td data-label="Nome"><div class="cell-main">${escapeHtml(user.name)}</div></td><td data-label="E-mail">${escapeHtml(user.email)}</td><td data-label="Perfil">${escapeHtml(roleLabel(user.role))}</td><td data-label="Status"><span class="status status--${user.active ? 'available' : 'cancelled'}">${user.active ? 'Ativo' : 'Inativo'}</span></td><td data-label="Criado em">${formatDate(user.createdAt, false)}</td><td data-label="Ações"><div class="table-actions"><button class="btn btn--secondary btn--small" data-action="edit-user" data-id="${user.id}">Editar</button>${user.id === state.user.id ? '' : `<button class="btn btn--danger btn--small" data-action="delete-user" data-id="${user.id}">Excluir</button>`}</div></td></tr>`).join('')}</tbody></table></div></div></section>`;
}

function alignmentNavigationItem(topic) {
  const selected = state.alignmentTopic === topic.id;
  return `<button type="button" id="alignment-tab-${escapeHtml(topic.id)}" class="alignment-nav__item ${selected ? 'is-selected' : ''}" data-action="open-alignment" data-topic="${escapeHtml(topic.id)}" role="tab" aria-selected="${selected}" aria-controls="alignment-detail" tabindex="${selected ? '0' : '-1'}">
    <span class="alignment-nav__number">${escapeHtml(topic.number)}</span>
    <span class="alignment-nav__icon">${uiIcon(topic.icon)}</span>
    <span class="alignment-nav__copy"><small>${escapeHtml(topic.eyebrow)} · ${Number(topic.minutes)} min</small><strong>${escapeHtml(topic.title)}</strong></span>
    <span class="alignment-nav__arrow">${uiIcon('chevron')}</span>
  </button>`;
}

function alignmentServiceTiles() {
  const services = [
    ['Atendimento e tratamento', 'Não limitar a atuação à venda: acolher com linguagem acessível, identificar a demanda, usar os recursos da loja e acompanhar o encaminhamento.'],
    ['Troca de chip', 'Receber a solicitação, conferir os dados e executar ou encaminhar pelo procedimento correto.'],
    ['Faturas', 'Consultar valores e serviços ativos, explicar a cobrança e registrar ou orientar corretamente uma contestação.'],
    ['Recargas', 'Explicar as opções e concluir a solicitação com segurança.'],
    ['Ativação de Pré', 'Cadastrar e ativar o plano conforme o procedimento vigente.'],
    ['Portabilidade', 'Orientar requisitos, registrar corretamente e explicar os próximos passos.'],
    ['Informação correta', 'Explicar preço, fidelidade, multa, serviços adicionais, primeira fatura e demais condições antes da confirmação.'],
    ['Conferência da operação', 'Confirmar titularidade, linhas, plano final, dependentes e encerramento de ofertas antigas antes de concluir.'],
    ['Documentos e protocolo', 'Entregar ou viabilizar contrato, comprovantes, Etiqueta Padrão e identificação para acompanhar a demanda.'],
    ['Dados e consentimento', 'Usar somente os dados necessários, proteger credenciais e nunca incluir produto ou serviço sem autorização.'],
  ];
  return services.map(([title, text], index) => `<article class="alignment-service"><span>${String(index + 1).padStart(2, '0')}</span><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></div></article>`).join('');
}

function alignmentLeadershipMessages() {
  const renatoMessage = [
    'Bom dia, um ótimo mês a todos.',
    'Ponto de atenção.',
    'Ainda temos CN/ lojas enviando ou pedindo para clientes ligarem na central para resolver seus problemas com operadora!! Isso é uma prática INACEITÁVEL e PROIBIDA dentro da nossa REDE. Se não souberem o procedimentos a empresa está a disposição para ajudar, inclusive se o caso podem me acionar que a solução vem.',
    'Os clientes que buscam nossos canais de atendimento precisam ser resolvido em loja, hoje as lojas tem mesma autonomia que a central 10315 ou 1058 e não vejo motivo para esse direcionamento.',
    'Ótimo mês a todos e boas vendas',
  ];
  const mariaMessage = [
    'É isto, Renato! Desde que nos propusemos a ser parceiros da Vivo, nossa principal preocupação é “sempre” atender e resolver todos os problemas em loja! Como bem disse o Renato, é INACEITÁVEL e INADMISSÍVEL encaminhar o cliente para o 10315! Chegamos onde estamos porque essa sempre foi nossa prioridade maior: cliente tem que sair da loja com seu problema resolvido! Se acaso for absolutamente necessário entrar em contato com a Central, fazê-lo para o cliente e colocá-lo para falar dentro da loja, dando todo o suporte necessário! Cliente tem que sair de loja completamente satisfeito e feliz com o nosso atendimento! É assim que fizemos a Gramcell crescer e é assim que queremos ser a PRIMEIRA em atendimento para o nosso cliente! Vcs são a GRAMCELL e eu me orgulho muito disso! Obrigada e um ótimo mês para todos!',
  ];
  const messageParagraphs = (paragraphs) => paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('');
  return `<section class="alignment-conversation" aria-label="Mensagens da liderança sobre atendimento ao cliente">
    <header class="alignment-conversation__head">
      <div><span class="alignment-panel__label">Orientações que deram origem a este alinhamento</span><h4>Direcionamento direto da liderança.</h4><p>Mensagens reproduzidas integralmente para preservar o contexto e a importância do comunicado.</p></div>
      <span class="alignment-conversation__status"><i aria-hidden="true"></i>Comunicado interno</span>
    </header>
    <div class="alignment-conversation__thread">
      <article class="alignment-message alignment-message--supervisor">
        <header class="alignment-message__head"><span class="alignment-message__avatar" aria-hidden="true">RD</span><div class="alignment-message__sender"><strong>Renato Dal Negro</strong><span>Supervisor Comercial</span></div><time datetime="2026-08-01T07:37:00-03:00">01 de agosto · 7:37</time></header>
        <div class="alignment-message__bubble">${messageParagraphs(renatoMessage)}</div>
        <footer class="alignment-message__meta"><span aria-label="24 reações positivas">${uiIcon('check')}<strong>24</strong></span><small>Mensagem da liderança comercial</small></footer>
      </article>
      <article class="alignment-message alignment-message--owner">
        <header class="alignment-message__head"><span class="alignment-message__avatar" aria-hidden="true">MC</span><div class="alignment-message__sender"><strong>Maria Caldas</strong><span>Dona da empresa</span></div><time datetime="2026-08-01T09:59:00-03:00">01 de agosto · 9:59</time></header>
        <div class="alignment-message__reply"><span>Em resposta a</span><strong>Renato Dal Negro</strong><p>Bom dia, um ótimo mês a todos.<br>Ponto de atenção.</p></div>
        <div class="alignment-message__bubble">${messageParagraphs(mariaMessage)}</div>
        <footer class="alignment-message__meta"><span aria-label="17 reações positivas">${uiIcon('check')}<strong>17</strong></span><small>Confirmação da direção da empresa</small></footer>
      </article>
    </div>
  </section>`;
}

function customerCareAlignment() {
  const steps = [
    ['Acolher', 'Receba a demanda sem interromper ou transferir a responsabilidade.'],
    ['Entender', 'Faça as perguntas necessárias e confirme qual é o problema real.'],
    ['Resolver', 'Use os procedimentos e recursos disponíveis na loja.'],
    ['Confirmar', 'Explique o resultado e certifique-se de que o cliente entendeu o próximo passo.'],
  ];
  return `<div class="alignment-detail__body">
    <div class="alignment-principle alignment-principle--priority"><span>Diretriz central</span><strong>Resolver o problema do cliente não é um favor: é parte essencial do atendimento.</strong><p>O atendimento não termina com “ligue para a central”. A equipe acolhe, orienta e acompanha a solução.</p></div>
    <div class="alignment-detail-grid">
      <section class="alignment-panel"><span class="alignment-panel__label">Fluxo esperado</span><div class="alignment-process">${steps.map(([title, text], index) => `<article><span>${index + 1}</span><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></div></article>`).join('')}</div></section>
      <aside class="alignment-panel alignment-panel--contrast"><span class="alignment-panel__label">Quando precisar de apoio</span><h4>O cliente continua acompanhado pela loja.</h4><ul class="alignment-checklist"><li>Acione o gerente quando faltar procedimento, permissão ou segurança para concluir.</li><li>Se uma central for indispensável, faça o contato com o cliente na loja e ofereça o suporte necessário.</li><li>Não prometa o que não pode cumprir; informe prazo, responsável e próximo passo com clareza.</li><li>Antes de encerrar, confirme que a demanda foi resolvida ou corretamente encaminhada.</li></ul></aside>
    </div>
    ${alignmentLeadershipMessages()}
  </div>`;
}

function responsibilitiesAlignment() {
  return `<div class="alignment-detail__body">
    <div class="alignment-principle"><span>O cargo por inteiro</span><strong>A função do consultor vai além de vender.</strong><p>A remuneração corresponde ao conjunto completo do cargo: atendimento, serviços, informação correta, conferência, pós-venda, proteção de dados, organização e compromisso com a operação.</p></div>
    <section class="alignment-panel"><div class="alignment-panel__heading"><div><span class="alignment-panel__label">Serviços e deveres da rotina</span><h4>Responsabilidades que precisam ser atendidas com o mesmo cuidado.</h4></div><span class="alignment-count">10 frentes</span></div><div class="alignment-services">${alignmentServiceTiles()}</div></section>
    <section class="alignment-legal"><div class="alignment-legal__heading"><div><span class="alignment-panel__label">Base legal e regulatória</span><h4>O essencial para aplicar na rotina.</h4></div><span>Resumo guiado · 2 min</span></div>
      <div class="alignment-legal__distinction"><span>${uiIcon('warning')}</span><div><strong>A obrigação legal é principalmente da Vivo ou da empresa responsável pela loja.</strong><p>O consultor não precisa resolver tudo sozinho: deve receber, orientar, registrar, encaminhar e acompanhar dentro de seus acessos.</p></div></div>
      <div class="alignment-law-grid">
        <article class="alignment-law alignment-law--featured"><div class="alignment-law__tag"><span>Anatel</span><strong>Art. 20</strong></div><h5>Atendimento qualificado</h5><p>A loja exclusiva Vivo deve atender presencialmente e tratar demandas de todos os serviços do grupo.</p><a href="https://informacoes.anatel.gov.br/legislacao/resolucoes/2023/1900-resolucao-765" target="_blank" rel="noopener noreferrer">Resolução Anatel nº 765/2023 · art. 20 ${uiIcon('chevron')}</a></article>
        <article class="alignment-law"><div class="alignment-law__tag"><span>Anatel</span><strong>Arts. 9º, 10 e 60–65</strong></div><h5>Protocolo e faturas</h5><p>Atendimentos geram protocolo; solicitações e contestações devem ser registradas e acompanhadas nos prazos aplicáveis.</p><a href="https://informacoes.anatel.gov.br/legislacao/resolucoes/2023/1900-resolucao-765" target="_blank" rel="noopener noreferrer">Consultar o RGC da Anatel ${uiIcon('chevron')}</a></article>
        <article class="alignment-law"><div class="alignment-law__tag"><span>Anatel + CDC</span><strong>Anatel 21, 36 e 40–42 · CDC 30, 31 e 37</strong></div><h5>Oferta clara</h5><p>Preço, fidelidade, multa e serviços devem ser explicados com clareza e corresponder ao contrato.</p><div class="alignment-law__links"><a href="https://informacoes.anatel.gov.br/legislacao/resolucoes/2023/1900-resolucao-765" target="_blank" rel="noopener noreferrer">Anatel ${uiIcon('chevron')}</a><a href="https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" target="_blank" rel="noopener noreferrer">CDC ${uiIcon('chevron')}</a></div></article>
        <article class="alignment-law"><div class="alignment-law__tag"><span>CDC</span><strong>Arts. 34 e 39</strong></div><h5>Sem venda forçada</h5><p>A empresa responde pelo atendimento. Soluções não dependem de nova compra e nada pode ser incluído sem solicitação.</p><a href="https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" target="_blank" rel="noopener noreferrer">Código de Defesa do Consumidor ${uiIcon('chevron')}</a></article>
        <article class="alignment-law"><div class="alignment-law__tag"><span>LGPD</span><strong>Arts. 6º, 39, 46 e 47</strong></div><h5>Proteção de dados</h5><p>Acesse somente os dados necessários, com login próprio, sigilo e segurança.</p><a href="https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm" target="_blank" rel="noopener noreferrer">Lei Geral de Proteção de Dados ${uiIcon('chevron')}</a></article>
      </div>
      <div class="alignment-employment-limit"><div><span class="alignment-panel__label">Responsabilidade pessoal</span><h5>Erro, fraude e dolo são situações diferentes.</h5></div><p>Desconto salarial por dano exige as condições do art. 462 da CLT e análise do caso concreto.</p><a href="https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452compilado.htm" target="_blank" rel="noopener noreferrer">CLT · art. 462 ${uiIcon('chevron')}</a></div>
    </section>
    <div class="alignment-commitment-grid"><section><span class="alignment-panel__label">Compromisso com horários</span><h4>Pontualidade protege a operação.</h4><ul class="alignment-checklist"><li>Esteja pronto para iniciar o trabalho no horário combinado.</li><li>Cumpra corretamente os horários de intervalo e retorno.</li><li>Avise com antecedência sempre que houver atraso, ausência ou imprevisto.</li><li>Não deixe a equipe descobrir o problema apenas no início do turno.</li></ul></section><section><span class="alignment-panel__label">Quando houver dúvida</span><h4>Pedir apoio faz parte. Abandonar a demanda, não.</h4><p>Consulte o procedimento, envolva o gerente e continue acompanhando o caso. O cliente deve saber quem está cuidando da solicitação e qual será o próximo passo.</p><div class="alignment-note">Sinal de profissionalismo: reconhecer o limite, buscar ajuda e permanecer responsável pelo acompanhamento.</div></section></div>
    ${teamBreakSchedule('alignment')}
  </div>`;
}

function conductAlignment() {
  return `<div class="alignment-detail__body">
    <div class="alignment-principle"><span>Postura profissional</span><strong>A forma como a equipe se apresenta também comunica a qualidade da loja.</strong><p>Presença, educação e respeito são visíveis antes mesmo de qualquer venda.</p></div>
    <section class="alignment-hierarchy" aria-label="Hierarquia da loja"><span class="alignment-panel__label">Estrutura de orientação e decisão</span><div><strong>Gerente geral</strong><span>${uiIcon('chevron')}</span><strong>Gerente de operações</strong><span>${uiIcon('chevron')}</span><strong>Consultores</strong></div><p>A hierarquia organiza responsabilidades e decisões. Ela deve ser respeitada sem retirar o dever de respeito entre todas as pessoas.</p></section>
    <div class="alignment-conduct-grid">
      <article><span class="alignment-conduct-icon">${uiIcon('conduct')}</span><h4>Postura na cadeira</h4><p>Mantenha-se disponível e atento. Evite permanecer reclinado, deitado na cadeira ou demonstrar desinteresse enquanto houver clientes ou tarefas.</p></article>
      <article><span class="alignment-conduct-icon">${uiIcon('service')}</span><h4>Atendimento ao cliente</h4><p>Cumprimente, escute sem interromper, fale com clareza, mantenha atenção visual e termine explicando a solução ou o próximo passo.</p></article>
      <article><span class="alignment-conduct-icon">${uiIcon('users')}</span><h4>Conversa entre colegas</h4><p>Sem gritos, ironias, exposição ou correções públicas. Divergências são tratadas com respeito, em particular e no canal correto.</p></article>
      <article><span class="alignment-conduct-icon">${uiIcon('tasks')}</span><h4>Orientações da liderança</h4><p>Demandas operacionais seguem a estrutura da loja. Dúvidas podem ser apresentadas; decisões devem ser cumpridas e desacordos tratados profissionalmente.</p></article>
    </div>
    <section class="alignment-attitudes"><figure><img src="/alignment/atitudes-profissionais.webp" alt="Quadro com atitudes profissionais como pontualidade, ética, educação e cumprimento de compromissos" loading="lazy"><figcaption>Imagem utilizada no material-base da reunião.</figcaption></figure><div><span class="alignment-panel__label">Atitudes que sustentam o padrão</span><h4>Profissionalismo aparece nas pequenas escolhas.</h4><ul class="alignment-checklist"><li>Ser pontual e avisar com antecedência.</li><li>Cumprir o que foi combinado.</li><li>Responder com educação e falar a verdade.</li><li>Agir com ética, agradecer e reconhecer o esforço dos colegas.</li><li>Usar o celular pessoal somente nos momentos permitidos ou em necessidade comunicada à liderança.</li></ul></div></section>
  </div>`;
}

function organizationAlignment() {
  return `<div class="alignment-detail__body">
    <div class="alignment-principle"><span>Responsabilidade compartilhada</span><strong>Quem usa, organiza. Quem identifica, corrige ou comunica.</strong><p>Cozinha e sala de estoque não pertencem a uma única pessoa: são ambientes de trabalho e responsabilidade de toda a equipe.</p></div>
    <div class="alignment-photo-grid"><figure><img src="/alignment/organizacao-pia.webp" alt="Pia da cozinha com utensílios deixados após o uso" loading="lazy"><figcaption>Pia: utensílios não devem permanecer acumulados.</figcaption></figure><figure><img src="/alignment/organizacao-mesa.webp" alt="Mesa da cozinha com embalagens e objetos espalhados" loading="lazy"><figcaption>Mesa: cada pessoa deve liberar e limpar o espaço após usar.</figcaption></figure><figure><img src="/alignment/organizacao-lixeira.webp" alt="Lixeira da cozinha cheia além da capacidade" loading="lazy"><figcaption>Lixeira: não espere transbordar para tomar providência.</figcaption></figure></div>
    <p class="alignment-photo-note">Registros do material-base usados como exemplos objetivos de situações que precisam ser corrigidas — o foco é o padrão do ambiente, não a exposição de pessoas.</p>
    <div class="alignment-commitment-grid"><section><span class="alignment-panel__label">Cozinha</span><h4>Deixe pronta para a próxima pessoa.</h4><ul class="alignment-checklist"><li>Lave, seque e guarde os utensílios usados.</li><li>Limpe pia, bancada e mesa depois da refeição.</li><li>Descarte embalagens e restos no local correto.</li><li>Ao perceber a lixeira cheia, feche o saco e providencie a troca.</li></ul></section><section><span class="alignment-panel__label">Sala de estoque</span><h4>Organização também protege o inventário.</h4><ul class="alignment-checklist"><li>Devolva cada item ao espaço identificado.</li><li>Mantenha corredores, mesas e acessos livres.</li><li>Não deixe caixas, embalagens ou produtos soltos.</li><li>Comunique imediatamente divergências, danos ou itens fora do lugar.</li></ul></section></div>
  </div>`;
}

function alignmentDetail() {
  const topic = alignmentTopics.find((item) => item.id === state.alignmentTopic);
  if (!topic) return '';
  const topicIndex = alignmentTopics.findIndex((item) => item.id === topic.id);
  const previousTopic = alignmentTopics[topicIndex - 1] || null;
  const nextTopic = alignmentTopics[topicIndex + 1] || null;
  const bodies = {
    'customer-care': customerCareAlignment,
    responsibilities: responsibilitiesAlignment,
    conduct: conductAlignment,
    organization: organizationAlignment,
  };
  const stepButton = (target, direction, compact = false) => `<button type="button" class="alignment-step alignment-step--${direction} ${compact ? 'alignment-step--compact' : ''}" ${target ? `data-action="open-alignment" data-topic="${escapeHtml(target.id)}"` : 'disabled'} aria-label="${target ? `${direction === 'previous' ? 'Tema anterior' : 'Próximo tema'}: ${escapeHtml(target.title)}` : direction === 'previous' ? 'Este é o primeiro tema' : 'Este é o último tema'}">
    ${direction === 'previous' ? uiIcon('chevron', 'alignment-icon--back') : ''}<span>${direction === 'previous' ? 'Anterior' : 'Próximo'}</span>${direction === 'next' ? uiIcon('chevron') : ''}
  </button>`;
  return `<section class="alignment-detail" id="alignment-detail" role="tabpanel" tabindex="-1" aria-labelledby="alignment-tab-${escapeHtml(topic.id)}" aria-live="polite">
    <header class="alignment-detail__head">
      <div class="alignment-detail__identity"><span>${escapeHtml(topic.number)} · ${escapeHtml(topic.eyebrow)}</span><h3>${escapeHtml(topic.title)}</h3></div>
      <div class="alignment-detail__tools"><span class="alignment-detail__progress">Tema ${topicIndex + 1} de ${alignmentTopics.length} · ${Number(topic.minutes)} min</span><div class="alignment-detail__stepper">${stepButton(previousTopic, 'previous', true)}${stepButton(nextTopic, 'next', true)}</div></div>
    </header>
    ${bodies[topic.id]()}
    <footer class="alignment-detail__pager">
      <div><span>${nextTopic ? 'Continue o alinhamento' : 'Edição concluída'}</span><strong>${nextTopic ? escapeHtml(nextTopic.title) : 'Todos os temas foram apresentados.'}</strong></div>
      <div>${stepButton(previousTopic, 'previous')}${stepButton(nextTopic, 'next')}</div>
    </footer>
  </section>`;
}

function renderAlignment() {
  const content = document.querySelector('#view-content');
  if (state.user.role !== 'manager') {
    renderSimpleAlignment();
    return;
  }
  if (!alignmentTopics.some((topic) => topic.id === state.alignmentTopic)) state.alignmentTopic = alignmentTopics[0].id;
  content.innerHTML = `<section class="alignment-hero"><div class="alignment-hero__content"><div class="alignment-hero__meta"><div class="alignment-edition">${uiIcon('briefing')}<span>Edição 01 · Agosto 2026</span></div><div class="alignment-duration">${uiIcon('history')}<span>Roteiro · até 20 min</span></div></div><p class="alignment-hero__eyebrow">Central de Alinhamento · SJDR Centro</p><h2>O padrão da loja começa nas pequenas atitudes.</h2><p>Um espaço para transformar orientações em atitudes claras, consistentes e observáveis no dia a dia.</p><div class="alignment-values"><span>Resolver</span><span>Respeitar</span><span>Organizar</span></div></div><div class="alignment-hero__mark" aria-hidden="true"><span>01</span><small>matinal</small></div></section>
    <div class="alignment-section-heading"><div><span>Navegação da edição</span><h3>Todos os temas ficam ao alcance durante a apresentação</h3></div><p>Troque de assunto sem fechar o conteúdo ou retornar ao início.</p></div>
    <div class="alignment-workspace">
      <aside class="alignment-navigator" aria-label="Temas desta edição">
        <div class="alignment-navigator__head"><div><span>Índice</span><strong>Escolha um assunto</strong></div><small>${alignmentTopics.length} temas</small></div>
        <nav class="alignment-nav__list" role="tablist" aria-label="Conteúdos do alinhamento">${alignmentTopics.map(alignmentNavigationItem).join('')}</nav>
        <p class="alignment-navigator__hint">O assunto selecionado aparece ao lado. Use também os botões Anterior e Próximo para conduzir a reunião em sequência.</p>
      </aside>
      ${alignmentDetail()}
    </div>
    <section class="alignment-footer"><span>${uiIcon('check')}</span><div><strong>O combinado precisa aparecer na rotina.</strong><p>Use o índice como guia da conversa e transforme cada orientação em um padrão acompanhado pela gestão.</p></div></section>`;
}

function renderSimpleAlignment() {
  const content = document.querySelector('#view-content');
  const roleGuidance = state.user.role === 'stocker'
    ? '<strong>Estoquista:</strong> confira produto, código, IMEI, preço e quantidade. Se houver divergência, cancele pelo sistema para devolver tudo ao estoque.'
    : '<strong>Vendedor:</strong> confirme preço, plano e disponibilidade no sistema antes de concluir o pedido com o cliente.';
  const topics = [
    ['service', 'Cliente acompanhado', 'Acolha a solicitação, explique o próximo passo e continue responsável até resolver ou encaminhar corretamente.'],
    ['orders', 'Pedido conferido', 'Valide modelo, código material, quantidade, preço e status. Não retire nem entregue item fora do pedido registrado.'],
    ['stock', 'Estoque organizado', 'Devolva cada produto ao local identificado e comunique imediatamente qualquer falta, dano ou divergência.'],
    ['users', 'Equipe alinhada', 'Respeite horários, intervalos e colegas. Dúvidas operacionais devem ser levadas ao gerente com clareza.'],
  ];
  content.innerHTML = `<section class="simple-alignment-hero">
      <div><span>Alinhamento rápido · Agosto 2026</span><h2>Quatro combinados para o dia funcionar bem.</h2><p>Uma leitura direta, feita em cerca de 5 minutos, para vendedores e estoquistas.</p></div>
      <div class="simple-alignment-hero__time">${uiIcon('history')}<strong>5 min</strong><span>leitura rápida</span></div>
    </section>
    <section class="simple-alignment-role">${uiIcon('check')}<p>${roleGuidance}</p></section>
    <div class="simple-alignment-grid">${topics.map(([icon, title, text], index) => `<article class="simple-alignment-card"><div><span>${String(index + 1).padStart(2, '0')}</span>${uiIcon(icon)}</div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join('')}</div>
    <section class="simple-alignment-check"><div><span>Antes de encerrar o turno</span><h3>Checklist de 30 segundos</h3></div><ul><li>Pedidos e cancelamentos estão registrados no sistema.</li><li>Produtos e espaços de trabalho ficaram organizados.</li><li>Divergências foram comunicadas ao gerente.</li><li>O próximo responsável recebeu as informações importantes.</li></ul></section>
    <section class="alignment-footer"><span>${uiIcon('check')}</span><div><strong>Simples, conferido e registrado.</strong><p>Esse é o padrão comum para vendedores e estoquistas.</p></div></section>`;
}

const actionLabels = {
  'manager.initial_created': 'criou o primeiro acesso gerencial', 'auth.login': 'entrou no sistema',
  'user.created': 'criou um usuário', 'user.updated': 'atualizou um usuário', 'user.deleted': 'excluiu um usuário',
  'user.password_reset': 'redefiniu uma senha', 'user.password_changed': 'alterou a própria senha',
  'inventory.quantity_adjusted': 'movimentou o estoque', 'request.created': 'criou um pedido',
  'request.auto_approved': 'liberou automaticamente um pedido',
  'request.auto_rejected': 'recusou automaticamente um pedido sem estoque',
  'request.approved': 'aprovou um pedido', 'request.rejected': 'recusou um pedido',
  'request.cancelled': 'cancelou um pedido',
  'news.created': 'publicou uma notícia', 'news.updated': 'editou uma notícia',
  'news.hidden': 'ocultou uma notícia', 'news.published': 'publicou novamente uma notícia',
  'chip.created': 'cadastrou um chip', 'chip.updated': 'editou um chip',
  'chip.transferred': 'transferiu um chip', 'chip.sold': 'registrou a venda de um chip',
  'chip.sale_reopened': 'corrigiu a venda de um chip', 'chip.removed': 'retirou um chip da carteira',
  'chip.restored': 'restaurou um chip',
};

function auditDetails(log) {
  const details = log.details || {};
  const parts = [];
  if (Array.isArray(details.products) && details.products.length) {
    parts.push(`<div class="audit-detail-block"><span>Produtos escolhidos</span><ul>${details.products.map((product) => `<li><strong>${escapeHtml(product.productName || 'Produto')}</strong><code class="mono">${escapeHtml(product.materialCode || '—')}</code><b>${Number(product.quantity || 0)} un.</b></li>`).join('')}</ul></div>`);
  }
  if (Array.isArray(details.serials) && details.serials.length) {
    parts.push(`<div class="audit-detail-block"><span>Números de série definidos</span><ul>${details.serials.map((item) => `<li><code class="mono">${escapeHtml(item.materialCode || '—')}</code><div class="audit-serials">${(item.serialNumbers || []).map((serial) => `<code class="mono">${escapeHtml(serial)}</code>`).join('')}</div></li>`).join('')}</ul></div>`);
  }
  if (details.email) parts.push(`<span class="audit-detail-inline">E-mail: ${escapeHtml(details.email)}</span>`);
  if (details.role) parts.push(`<span class="audit-detail-inline">Perfil: ${escapeHtml(roleLabel(details.role))}</span>`);
  if (details.selectedSerialCount !== undefined) parts.push(`<span class="audit-detail-inline">${Number(details.selectedSerialCount)} número(s) de série definido(s)</span>`);
  if (details.materialCode) parts.push(`<span class="audit-detail-inline">Material: ${escapeHtml(details.materialCode)}</span>`);
  if (details.iccidLast4) parts.push(`<span class="audit-detail-inline">ICCID final: ${escapeHtml(details.iccidLast4)}</span>`);
  if (details.registeredPhone) parts.push(`<span class="audit-detail-inline">Linha: ${escapeHtml(formatPhoneNumber(details.registeredPhone))}</span>`);
  if (details.soldOn) parts.push(`<span class="audit-detail-inline">Venda: ${escapeHtml(formatDateOnly(details.soldOn))}</span>`);
  if (details.title) parts.push(`<span class="audit-detail-inline">Notícia: ${escapeHtml(details.title)}</span>`);
  if (details.category) parts.push(`<span class="audit-detail-inline">Tipo: ${escapeHtml(newsCategoryInfo[details.category]?.label || details.category)}</span>`);
  return parts.length ? `<div class="audit-details">${parts.join('')}</div>` : '';
}

async function renderAudit() {
  const content = document.querySelector('#view-content');
  const data = await api('/api/audit');
  state.logs = data.logs;
  content.innerHTML = `<div class="page-heading"><div><p class="page-eyebrow">Rastreabilidade</p><h2>Histórico detalhado</h2><p>Acessos, produtos escolhidos, pedidos automáticos e alterações administrativas.</p></div></div><section class="card"><div class="timeline">${state.logs.length ? state.logs.map((log) => `<article class="timeline-item"><div class="timeline-dot"></div><div><strong>${escapeHtml(log.actorName)} ${escapeHtml(actionLabels[log.action] || log.action)}</strong><span>${formatDate(log.createdAt)}${log.entityType === 'request' && log.entityId ? ` · Pedido #${escapeHtml(requestCode(log.entityId))}` : ''}</span>${auditDetails(log)}</div></article>`).join('') : emptyState('Histórico vazio', 'As novas ações realizadas no sistema aparecerão aqui.')}</div></section>`;
}

async function navigate(view) {
  if (!viewTitles[view]) return;
  if (state.user.role !== 'manager' && ['users', 'audit'].includes(view)) return;
  if (state.user.role === 'stocker' && ['new-request', 'chips'].includes(view)) return;
  if (state.user.role === 'seller' && view === 'renova-intake') return;
  state.cartDrawerOpen = false;
  document.body.classList.remove('cart-drawer-open');
  state.view = view;
  renderCartBar();
  updateShellNavigation();
  const content = document.querySelector('#view-content');
  content.innerHTML = '<div class="loading-block"><span class="loading-inline">Carregando</span></div>';
  try {
    if (view === 'dashboard') await renderDashboard();
    if (view === 'news') await renderNews();
    if (view === 'chips') await renderChips();
    if (view === 'renova-intake') await renderRenovaIntake();
    if (view === 'stock') await renderStock();
    if (view === 'new-request') await renderNewRequest();
    if (view === 'requests') await renderRequests();
    if (view === 'alignment') renderAlignment();
    if (view === 'users') await renderUsers();
    if (view === 'audit') await renderAudit();
  } catch (error) {
    if (error.status !== 401) content.innerHTML = emptyState('Não foi possível carregar', error.message, '<button class="btn" data-action="reload-view">Tentar novamente</button>');
  }
}

function showModal(content, { required = false, small = false, wide = false } = {}) {
  cancelChipCandidateLookup();
  modalRoot.innerHTML = `<div class="modal-backdrop" data-action="${required ? '' : 'backdrop-close'}"><section class="modal ${small ? 'modal--small' : ''} ${wide ? 'modal--wide' : ''}" role="dialog" aria-modal="true">${content}</section></div>`;
  modalRoot.dataset.required = required ? 'true' : 'false';
  document.body.classList.add('modal-open');
  window.setTimeout(() => modalRoot.querySelector('input, select, textarea, button')?.focus(), 0);
}

function closeModal(force = false) {
  if (modalRoot.dataset.required === 'true' && !force) return;
  cancelChipCandidateLookup();
  modalRoot.innerHTML = '';
  modalRoot.dataset.required = '';
  document.body.classList.remove('modal-open');
}

function modalCloseButton() {
  return `<button type="button" class="close-modal" data-action="close-modal" aria-label="Fechar">${uiIcon('close')}</button>`;
}

function quantityModal(preferredVariantId = null) {
  const rows = state.catalog.flatMap((product) => product.variants.map((variant) => ({ product, variant }))).filter(({ variant }) => !variant.serialTracked);
  if (!rows.length) return showToast('O estoque atual é controlado por número de série e deve ser atualizado pela planilha.', 'error');
  const selected = Number(preferredVariantId || rows[0].variant.id);
  showModal(`<form data-form="quantity-stock" novalidate>
    <div class="modal__head"><div><h2>Movimentar estoque</h2><p>Escolha o código material e registre a quantidade.</p></div>${modalCloseButton()}</div>
    <div class="modal__body"><div class="form-error" data-form-error hidden></div><div class="form-grid">
      <div class="field field--full"><label for="quantity-variant">Produto e código material</label><select class="select" id="quantity-variant" name="variantId" required>${rows.map(({ product, variant }) => `<option value="${variant.id}" ${variant.id === selected ? 'selected' : ''}>${escapeHtml(product.name)} · ${escapeHtml(variant.materialCode)}</option>`).join('')}</select></div>
      <div class="field"><label for="quantity-operation">Movimentação</label><select class="select" id="quantity-operation" name="operation"><option value="entry">Entrada no estoque</option><option value="exit">Correção / saída manual</option></select></div>
      <div class="field"><label for="quantity-value">Quantidade</label><input class="input" id="quantity-value" name="quantity" type="number" min="1" max="100000" step="1" value="1" required></div>
    </div></div>
    <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn">Salvar movimentação</button></div>
  </form>`);
}

function pickerModal(productId) {
  const product = state.catalog.find((item) => item.id === productId);
  const variant = product?.variants[0];
  if (!product || !variant) return showToast('Este produto não está mais disponível.', 'error');
  const unitPrice = selectedProductPrice(product, variant);
  const priceSummary = unitPrice == null
    ? '<div class="picker-price picker-price--muted"><span>Preço</span><strong>Não disponível</strong></div>'
    : `<div class="picker-price"><span>Preço por unidade</span><strong>${productPriceKind(product, variant) === 'no_charge' ? 'Sem cobrança' : formatMoney(unitPrice)}</strong></div>`;
  showModal(`<form data-form="pick-product" data-variant-id="${variant.id}" novalidate>
    <div class="modal__head"><div><h2>${escapeHtml(product.name)}</h2>${materialCodeBox(variant.materialCode)}</div>${modalCloseButton()}</div>
    <div class="modal__body"><div class="form-error" data-form-error hidden></div><div class="picker-product">${productImageMarkup(product, 'picker-product__image', 72, 72)}<div><strong>${escapeHtml(product.name)}</strong><span>${escapeHtml(product.brand || 'Sem marca')}</span></div></div>${priceSummary}<p><strong>${variant.available}</strong> unidades disponíveis.</p><div class="field"><label for="picker-quantity">Quantidade</label><input class="input" id="picker-quantity" name="quantity" type="number" value="1" min="1" max="${variant.available}" step="1" required></div></div>
    <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn">Adicionar ao pedido</button></div>
  </form>`, { small: true });
}

function newsArtModal(item) {
  const imagePath = safeNewsImagePath(item?.imagePath);
  if (!item || !imagePath) return;
  showModal(`<section class="news-art-modal" aria-label="Arte completa da campanha">
    <div class="modal__head"><div><span class="modal-eyebrow">Arte original</span><h2>${escapeHtml(item.title)}</h2>${item.validityLabel ? `<p>${escapeHtml(item.validityLabel)}</p>` : ''}</div>${modalCloseButton()}</div>
    <div class="news-art-modal__image"><img src="${escapeHtml(imagePath)}" alt="${escapeHtml(item.imageAlt || item.title)}"></div>
    <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Fechar</button></div>
  </section>`, { wide: true });
}

function newsModal(item = null) {
  showModal(`<form data-form="${item ? 'edit-news' : 'create-news'}" data-id="${escapeHtml(item?.id || '')}" novalidate>
    <div class="modal__head"><div><h2>${item ? 'Editar notícia' : 'Publicar notícia'}</h2><p>${item ? 'As alterações aparecem imediatamente para a equipe se a notícia estiver publicada.' : 'Crie uma informação visível para vendedores e estoquistas.'}</p></div>${modalCloseButton()}</div>
    <div class="modal__body"><div class="form-error" data-form-error hidden></div><div class="form-grid">
      <div class="field field--full"><label for="news-title">Título</label><input class="input" id="news-title" name="title" maxlength="120" minlength="3" required value="${escapeHtml(item?.title || '')}" placeholder="Ex.: Oferta especial deste fim de semana"></div>
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
    <div class="modal__head"><div><h2>Registrar retirada</h2><p>${escapeHtml(item.model)}</p></div>${modalCloseButton()}</div>
    <div class="modal__body"><div class="form-error" data-form-error hidden></div><div class="renova-intake-pickup-summary">${uiIcon('renova')}<div><span>Recebido em ${escapeHtml(formatDateOnly(item.receivedOn))}</span><strong>Aparelho aguardando coleta</strong></div></div><div class="field"><label for="renova-pickup-date">Data da retirada pela empresa</label><input class="input" id="renova-pickup-date" name="pickupOn" type="date" min="${escapeHtml(item.receivedOn)}" max="${today}" value="${today}" required></div></div>
    <div class="modal__footer"><button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn">Confirmar retirada</button></div>
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
    if (action === 'open-renova-intake') {
      if (!state.renovaCatalog.devices?.length) await loadCatalog();
      renovaIntakeModal();
    }
    if (action === 'edit-renova-intake') {
      if (!state.renovaCatalog.devices?.length) await loadCatalog();
      renovaIntakeModal(state.renovaItems.find((item) => item.id === button.dataset.id));
    }
    if (action === 'pickup-renova-intake') renovaIntakePickupModal(state.renovaItems.find((item) => item.id === button.dataset.id));
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
        await api('/api/renova-intake', { method: 'POST', body: { model: selectedDevice.name, receivedOn: data.receivedOn, pickupOn: data.pickupOn } });
        closeModal(true);
        showToast('Aparelho cadastrado no Renova.');
        await renderRenovaIntake();
      }
      if (form.dataset.form === 'edit-renova-intake') {
        const selectedDevice = renovaTradeInByName(data.model);
        const currentItem = state.renovaItems.find((item) => item.id === form.dataset.id);
        const unchangedLegacyModel = currentItem && currentItem.model.toLocaleUpperCase('pt-BR') === String(data.model).trim().toLocaleUpperCase('pt-BR');
        if (!selectedDevice && !unchangedLegacyModel) throw new ApiError('Selecione um aparelho da lista do Vivo Renova.', 400, { model: 'Escolha uma das opções exibidas na busca.' });
        await api(`/api/renova-intake/${encodeURIComponent(form.dataset.id)}`, { method: 'PUT', body: { model: selectedDevice?.name || currentItem.model, receivedOn: data.receivedOn, pickupOn: data.pickupOn } });
        closeModal(true);
        showToast(data.pickupOn ? 'Aparelho e retirada atualizados.' : 'Dados do aparelho atualizados.');
        await renderRenovaIntake();
      }
      if (form.dataset.form === 'pickup-renova-intake') {
        const item = state.renovaItems.find((entry) => entry.id === form.dataset.id);
        if (!item) throw new ApiError('Este aparelho não está mais disponível.', 404);
        await api(`/api/renova-intake/${encodeURIComponent(item.id)}`, { method: 'PUT', body: { model: item.model, receivedOn: item.receivedOn, pickupOn: data.pickupOn } });
        closeModal(true);
        showToast('Retirada pela empresa registrada.');
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
