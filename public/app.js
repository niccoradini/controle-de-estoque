Warning: truncated output (original token count: 87452)
Total output lines: 4080

import {
  compatibleCaseChoices,
  groupAccessoryChoices,
  groupDeviceProducts,
  normalizeCatalogName,
  parseDeviceName,
} from './catalog-groups.js';

const root = document.querySelector('#root');
const modalRoot = document.querySelector('#modal-root');
const toastRoot = document.querySelector('#toast-root');
let chipCandidateRequest = 0;
let chipCandidateTimer = 0;
let chipBatchItems = [];

const DEFAULT_PAYMENT_POLICY = Object.freeze({
  effectiveDate: '2026-09-08',
  maxInstallments: 21,
  minimumInstallmentCents: 0,
  pixDiscountBasisPoints: 1000,
  installmentSurchargePartsPerMillion: Object.freeze({
    13: 77440, 14: 83130, 15: 88820, 16: 94540, 17: 100280,
    18: 106020, 19: 111810, 20: 117610, 21: 123416,
  }),
});

const state = {
  user: null,
  view: 'dashboard',
  requests: [],
  users: [],
  logs: [],
  news: [],
  chips: [],
  renovaItems: [],
  repairItems: [],
  incomingItems: [],
  replenishmentItems: [],
  replenishmentSearch: '',
  replenishmentFilter: 'all',
  replenishmentThreshold: 2,
  networkStores: [],
  networkItems: [],
  networkSerials: [],
  networkStore: '',
  networkSearch: '',
  networkBrand: 'all',
  networkCategory: 'all',
  outletProducts: [],
  outletStores: [],
  outletSearch: '',
  outletDiscount: 'all',
  outletStore: 'all',
  outletCategory: 'all',
  outletImportedOn: '',
  showcases: { canEdit: false, summary: {}, fixtures: [], products: [], serials: [] },
  labelSelection: new Map(),
  labelSearch: '',
  labelMode: 'cases',
  renovaSearch: '',
  renovaStatus: 'awaiting_pickup',
  chipSellers: [],
  chipMaterials: [],
  chipLimit: 10,
  chipSearch: '',
  chipStatus: 'available',
  chipSellerId: 0,
  catalog: [],
  pricing: { categories: [], tableDate: '', source: '', paymentPolicy: DEFAULT_PAYMENT_POLICY },
  renovaCatalog: { tableDate: '', devices: [], boosts: [] },
  priceCategory: '',
  offerInstallments: 21,
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
  alignmentExpanded: false,
  pendingCount: 0,
  plannerDate: localDateValue(),
  plannerDay: { mainFocus: '', intention: '', notes: '', energy: 3 },
  plannerItems: [],
  feedback: [],
  feedbackFilter: 'all',
};

const RENOVA_INTAKE_ROLES = new Set(['manager', 'stocker']);

function canAccessRenovaIntake() {
  return RENOVA_INTAKE_ROLES.has(state.user?.role);
}

const viewTitles = {
  point: 'Meu ponto',
  dashboard: 'Visão geral',
  'my-day': 'Planner',
  news: 'Notícias',
  chips: 'Chips',
  'renova-intake': 'Renova',
  repairs: 'Produtos em reparo',
  incoming: 'Produtos a caminho',
  replenishment: 'Reposição de estoque',
  labels: 'Etiquetas do estoque',
  stock: 'Loja e estoque',
  'network-stock': 'Estoque da rede',
  outlet: 'Outlet',
  showcases: 'Vitrines',
  'new-request': 'Novo pedido',
  requests: 'Pedidos de retirada',
  alignment: 'Central de Alinhamento',
  feedback: 'Sugestões e reclamações',
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
    id: 'payment-options',
    number: '01',
    icon: 'sim',
    eyebrow: 'Matinal comercial',
    title: 'Três caminhos para fechar melhor',
    summary: 'Compare PIX, 12x e até 21x para adaptar a proposta à prioridade de cada cliente.',
    minutes: 12,
    wide: true,
  },
  {
    id: 'customer-care',
    number: '02',
    icon: 'service',
    eyebrow: 'Prioridade absoluta',
    title: 'Resolver faz parte do atendimento',
    summary: 'O cliente precisa ser acolhido, orientado e acompanhado até uma solução clara.',
    minutes: 6,
    wide: true,
  },
  {
    id: 'responsibilities',
    number: '03',
    icon: 'tasks',
    eyebrow: 'Função completa',
    title: 'Responsabilidades do consultor',
    summary: 'Vendas, serviços, suporte e compromisso com a operação fazem parte do mesmo cargo.',
    minutes: 6,
  },
  {
    id: 'conduct',
    number: '04',
    icon: 'conduct',
    eyebrow: 'Postura profissional',
    title: 'Comportamento em loja',
    summary: 'Presença, respeito, comunicação adequada e clareza sobre a estrutura da equipe.',
    minutes: 4,
  },
  {
    id: 'organization',
    number: '05',
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

function paymentPolicy() {
  const remote = state.pricing?.paymentPolicy || {};
  return {
    ...DEFAULT_PAYMENT_POLICY,
    ...remote,
    installmentSurchargePartsPerMillion: {
      ...DEFAULT_PAYMENT_POLICY.installmentSurchargePartsPerMillion,
      ...(remote.installmentSurchargePartsPerMillion || {}),
    },
  };
}

function installmentCount(totalCents) {
  return Number(totalCents || 0) > 0 ? Math.max(1, Number(paymentPolicy().maxInstallments || 21)) : 1;
}

function pixPriceCents(totalCents) {
  const total = Math.max(0, Number(totalCents || 0));
  const discount = Number(paymentPolicy().pixDiscountBasisPoints || 0);
  return Math.round(total * (10000 - discount) / 10000);
}

function installmentTotalCents(totalCents, installments) {
  const total = Math.max(0, Number(totalCents || 0));
  const count = Math.max(1, Number(installments || 1));
  if (count <= 12) return total;
  const surcharge = Number(paymentPolicy().installmentSurchargePartsPerMillion?.[count] || 0);
  return Math.round(total * (1000000 + surcharge) / 1000000);
}

function installmentPriceCents(totalCents, installments) {
  const count = Math.max(1, Number(installments || 1));
  return Math.round(installmentTotalCents(totalCents, count) / count);
}

function paymentPriceLines(totalCents) {
  const total = Math.max(0, Number(totalCents || 0));
  const longCount = installmentCount(total);
  return {
    pix: pixPriceCents(total),
    twelve: installmentPriceCents(total, 12),
    longCount,
    longInstallment: installmentPriceCents(total, longCount),
    longTotal: installmentTotalCents(total, longCount),
  };
}

function installmentOptions(totalCents, selectedInstallments = state.offerInstallments) {
  const maximum = installmentCount(totalCents);
  const selected = Math.min(maximum, Math.max(1, Number(selectedInstallments || maximum)));
  return Array.from({ length: maximum }, (_, index) => index + 1).map((count) => {
    const installment = installmentPriceCents(totalCents, count);
    const total = installmentTotalCents(totalCents, count);
    const suffix = count > 12 ? ` · total ${formatMoney(total)}` : ' · sem juros';
    return `<option value="${count}" ${count === selected ? 'selected' : ''}>${count}x de ${formatMoney(installment)}${suffix}</option>`;
  }).join('');
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

function normalizeSearch(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim();
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
            <div class="field"><label for="login-identifier">E-mail ou RE</label><input class="input" id="login-identifier" name="identifier" type="text" autocomplete="username" maxlength="160" required placeholder="seuemail@empresa.com ou 81000000"><p class="field-hint">Funcionários podem usar o código RE fornecido pela gerência.</p></div>
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
      ['dashboard', 'home', 'Visão geral'], ['network-stock', 'stock', 'Estoque da rede'], ['stock', 'stock', 'Estoque da loja'], ['my-day', 'tasks', 'Planner'], ['point', 'history', 'Meu ponto'], ['news', 'news', 'Notícias'], ['showcases', 'stock', 'Vitrines'], ['outlet', 'sparkles', 'Outlet'], ['replenishment', 'orders', 'Reposição'], ['labels', 'copy', 'Etiquetas do estoque'], ['incoming', 'orders', 'Produtos a caminho'], ['repairs', 'stock', 'Produtos em reparo'], ['renova-intake', 'renova', 'Renova'], ['chips', 'sim', 'Chips'], ['requests', 'orders', 'Pedidos'],
      ['feedback', 'briefing', 'Sugestões recebidas'], ['alignment', 'briefing', 'Alinhamento'], ['users', 'users', 'Usuários'], ['audit', 'history', 'Histórico'],
    ];
  }
  if (state.user.role === 'stocker') {
    return [
      ['dashboard', 'home', 'Visão do estoque'], ['my-day', 'tasks', 'Planner'], ['point', 'history', 'Meu ponto'], ['news', 'news', 'Notícias'], ['showcases', 'stock', 'Vitrines'], ['outlet', 'sparkles', 'Outlet'], ['stock', 'stock', 'Conferir estoque'], ['replenishment', 'orders', 'Reposição'], ['labels', 'copy', 'Etiquetas do estoque'], ['incoming', 'orders', 'Produtos a caminho'], ['repairs', 'stock', 'Produtos em reparo'], ['renova-intake', 'renova', 'Renova'],
      ['requests', 'orders', 'Pedidos para separar'], ['feedback', 'briefing', 'Sugestões'], ['alignment', 'briefing', 'Alinhamento rápido'],
    ];
  }
  return [
    ['point', 'history', 'Meu ponto'], ['dashboard', 'home', 'Visão geral'], ['my-day', 'tasks', 'Planner'], ['news', 'news', 'Notícias'], ['showcases', 'stock', 'Vitrines'], ['outlet', 'sparkles', 'Outlet'], ['stock', 'stock', 'Loja / estoque'],
    ['new-request', 'plus', 'Novo pedido'], ['chips', 'sim', 'Meus chips'], ['requests', 'orders', 'Meus pedidos'],
    ['feedback', 'briefing', 'Sugestões'], ['alignment', 'briefing', 'Alinhamento rápido'],
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
        <button class="sidebar-theme" data-action="toggle-theme" aria-label="Mudar para tema ${state.user.theme === 'light' ? 'escuro' : 'claro'}"><span>${state.user.theme === 'light' ? '☀' : '☾'}</span><div><small>Aparência</small><strong>Tema ${state.user.theme === 'light' ? 'claro' : 'escuro'}</strong></div><b>Alterar</b></button>
        <div class="sidebar__spacer"></div>
        <div class="sidebar-user"><div class="avatar">${escapeHtml(initials(state.user.name))}</div><div class="sidebar-user__text"><strong>${escapeHtml(state.user.name)}</strong><span>${escapeHtml(roleLabel(state.user.role))}</span></div><button class="btn btn--ghost btn--icon btn--small" data-action="logout" title="Sair" aria-label="Sair">${uiIcon('logout')}</button></div>
      </aside>
      <main class="main">
        <header class="topbar"><div class="topbar__left"><button class="btn btn--secondary btn--icon mobile-menu" data-action="open-menu" aria-label="Abrir menu">${uiIcon('menu')}</button><h1 data-page-title>${escapeHtml(viewTitles[state.view])}</h1></div><div class="topbar__right"><button class="theme-toggle" data-action="toggle-theme" title="Alternar entre tema claro e escuro" aria-label="Alternar tema"><span class="theme-toggle__icon">${state.user.theme === 'light' ? '☀' : '☾'}</span><span>${state.user.theme === 'light' ? 'Claro' : 'Escuro'}</span></button><span class="role-pill">${escapeHtml(roleLabel(state.user.role))}</span><button class="btn btn--secondary btn--small" data-action="password" title="Alterar senha">Senha</button></div></header>
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
  const safeVariant = ['alignment', 'point'].includes(variant) ? variant : 'dashboard';
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

async function renderPoint() {
  if (state.user.role === 'manager') return renderTeamPoint();
  const content = document.querySelector('#view-content');
  const data = await api('/api/point/me');
  const firstName = String(data.employee?.name || state.user.name).split(' ')[0];
  const qrContent = data.qrCode
    ? `<div class="point-qr__frame"><img src="${escapeHtml(data.qrCode.imageDataUrl)}" alt="Seu QR Code individual para registro de ponto" width="640" height="640"></div><div class="point-qr__status">${uiIcon('check')}<span><strong>QR Code individual</strong><small>Vinculado somente ao seu acesso</small></span></div>`
    : `<div class="point-qr__empty">${uiIcon('history')}<strong>QR Code aguardando cadastro</strong><span>A gerência ainda não vinculou seu código de ponto.</span></div>`;
  const punches = Array.isArray(data.punches) ? data.punches : [];
  const punchHistory = punches.length
    ? `<ol class="point-history__list">${punches.map((punch, index) => `<li><span>${uiIcon('check')}</span><div><strong>${index === 0 ? 'Último registro' : 'Ponto registrado'}</strong><time datetime="${escapeHtml(punch.punchedAt)}">${escapeHtml(formatDate(punch.punchedAt))}</time></div></li>`).join('')}</ol>`
    : `<div class="point-history__empty">${uiIcon('history')}<div><strong>Nenhum ponto registrado</strong><span>Seus horários aparecerão aqui depois do primeiro registro.</span></div></div>`;
  content.innerHTML = `<section class="point-hero"><div><p class="page-eyebrow">Área individual · acesso protegido</p><h2>Olá, ${escapeHtml(firstName)}</h2><p>Seu QR Code, seus registros e os horários da equipe ficam reunidos aqui para facilitar o dia.</p><div class="point-identity"><span>Funcionário</span><strong>${escapeHtml(data.employee?.name || state.user.name)}</strong>${data.employee?.employeeRe ? `<code class="mono">RE ${escapeHtml(data.employee.employeeRe)}</code>` : ''}</div></div><div class="point-hero__lock">${uiIcon('check')}<span><strong>Somente você</strong><small>Seu QR e seu histórico não aparecem para outros funcionários.</small></span></div></section><div class="point-layout"><div class="point-personal"><section class="point-qr-card"><header><div><p class="page-eyebrow">Registro de ponto</p><h3>Meu QR Code</h3><span>Apresente este código no leitor para registrar seu ponto.</span></div></header>${qrContent}<button class="point-punch-button" data-action="punch-point">${uiIcon('check')}<span>BATI MEU PONTO</span></button><p class="point-punch-help">Ao tocar, o horário atual do servidor será salvo no seu histórico.</p><p class="point-qr__notice">Não compartilhe este código. Ele está associado ao seu cadastro pessoal.</p></section><section class="point-history"><header><div><p class="page-eyebrow">Histórico individual</p><h3>Meus registros</h3></div><span>${punches.length} ${punches.length === 1 ? 'registro' : 'registros'}</span></header>${punchHistory}</section></div><div class="point-schedule">${teamBreakSchedule('point')}</div></div>`;
}

function pointDayKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function pointTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit',
  }).format(date);
}

function teamPointCard(member, todayKey) {
  const todayPunches = member.punches.filter((punch) => pointDayKey(punch.punchedAt) === todayKey);
  const latest = member.punches[0];
  const statusClass = todayPunches.length ? 'is-recorded' : 'is-pending';
  const history = member.punches.slice(0, 12);
  return `<article class="team-point-card ${statusClass}">
    <header><div class="team-point-card__avatar">${escapeHtml(initials(member.name))}</div><div><span>${escapeHtml(roleLabel(member.role))}</span><h3>${escapeHtml(member.name)}</h3>${member.employeeRe ? `<code>RE ${escapeHtml(member.employeeRe)}</code>` : ''}</div><b>${todayPunches.length ? `${todayPunches.length} ${todayPunches.length === 1 ? 'registro hoje' : 'registros hoje'}` : 'Pendente hoje'}</b></header>
    <div class="team-point-card__today"><span>Horários de hoje</span><div>${todayPunches.length ? todayPunches.slice().reverse().map((punch) => `<time datetime="${escapeHtml(punch.punchedAt)}">${escapeHtml(pointTime(punch.punchedAt))}</time>`).join('') : '<em>Nenhum ponto registrado</em>'}</div></div>
    <details class="team-point-card__history"><summary><span>Histórico recente</span><small>${latest ? `Último: ${escapeHtml(formatDate(latest.punchedAt))}` : 'Sem registros'}</small></summary>${history.length ? `<ol>${history.map((punch) => `<li><span>${escapeHtml(pointDayKey(punch.punchedAt).split('-').reverse().join('/'))}</span><strong>${escapeHtml(pointTime(punch.punchedAt))}</strong></li>`).join('')}</ol>` : '<p>Este funcionário ainda não registrou nenhum ponto.</p>'}</details>
  </article>`;
}

async function renderTeamPoint() {
  const content = document.querySelector('#view-content');
  const data = await api('/api/point/team');
  const todayKey = pointDayKey(data.generatedAt || new Date().toISOString());
  const members = Array.isArray(data.members) ? data.members : [];
  const recorded = members.filter((member) => member.punches.some((punch) => pointDayKey(punch.punchedAt) === todayKey)).length;
  const totalPunches = members.reduce((sum, member) => sum + member.punches.filter((punch) => pointDayKey(punch.punchedAt) === todayKey).length, 0);
  content.innerHTML = `<section class="team-point-hero"><div><p class="page-eyebrow">Acompanhamento gerencial</p><h2>Ponto da equipe</h2><p>Acompanhe quem já registrou o ponto hoje e consulte o histórico individual de vendedores e estoquistas.</p></div><div class="team-point-hero__date"><span>Atualizado agora</span><strong>${escapeHtml(formatDate(data.generatedAt, false))}</strong></div></section>
    <div class="team-point-metrics"><article><span>Equipe ativa</span><strong>${members.length}</strong><small>vendedores e estoquistas</small></article><article class="is-success"><span>Registraram hoje</span><strong>${recorded}</strong><small>${members.length ? Math.round((recorded / members.length) * 100) : 0}% da equipe</small></article><article class="is-warning"><span>Pendentes hoje</span><strong>${Math.max(0, members.length - recorded)}</strong><small>ainda sem registro</small></article><article><span>Batidas hoje</span><strong>${totalPunches}</strong><small>horários registrados</small></article></div>
    <section class="team-point-board"><header><div><p class="page-eyebrow">Situação de hoje</p><h3>Funcionários</h3></div><span>${recorded} de ${members.length} com registro</span></header><div class="team-point-grid">${members.length ? members.map((member) => teamPointCard(member, todayKey)).join('') : emptyState('Nenhum funcionário ativo', 'Crie ou ative vendedores e estoquistas para acompanhar os pontos.')}</div></section>`;
}

async function punchPoint(button) {
  await withBusy(button, async () => {
    const result = await api('/api/point/me/punch', { method: 'POST' });
    showToast(result.message || 'Ponto registrado com sucesso.');
    await renderPoint();
  });
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

function friendlyBrand(value = '') {
  const brand = normalizeCatalogName(value);
  if (brand.includes('APPLE')) return 'Apple';
  if (brand.includes('SAMSUNG') || brand === 'SSG') return 'Samsung';
  if (brand.includes('MOTOROLA') || brand === 'MOTO') return 'Motorola';
  if (brand.includes('XIAOMI')) return 'Xiaomi';
  return String(value || 'Outros').trim();
}

function managerDeviceOverview(products = []) {
  const families = groupDeviceProducts(products);
  if (!families.length) return '';
  const brands = new Map();
  for (const family of families) {
    const brand = friendlyBrand(family.brand);
    if (!brands.has(brand)) brands.set(brand, []);
    brands.get(brand).push(family);
  }
  return `<section class="manager-devices">
    <div class="manager-inventory__head"><div><p class="page-eyebrow">Aparelhos da loja</p><h3>Telefones agrupados por modelo</h3><p>Memórias e cores do mesmo aparelho aparecem juntas para facilitar a conferência.</p></div><button class="btn btn--secondary" data-action="navigate" data-view="network-stock">Comparar outras lojas</button></div>
    ${[...brands.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR')).map(([brand, items]) => `<div class="manager-device-brand"><header><h4>${escapeHtml(brand)}</h4><span>${items.reduce((sum, item) => sum + item.available, 0)} unidades · ${items.length} modelos</span></header><div class="manager-device-grid">${items.map((family) => {
      const representative = family.products[0];
      const colors = new Set(family.options.map((option) => option.color)).size;
      return `<button class="manager-device-card" data-action="open-device-family" data-family="${escapeHtml(family.familyName)}"><span class="manager-device-card__image">${productImageMarkup(representative, 'manager-device-card__photo', 120, 120)}</span><span class="manager-device-card__body"><small>${escapeHtml(brand)}</small><strong>${escapeHtml(family.familyName)}</strong><span>${escapeHtml(family.memories.join(' · '))}</span><em>${colors} ${colors === 1 ? 'cor' : 'cores'}</em></span><b>${family.available}<small> un.</small></b></button>`;
    }).join('')}</div></div>`).join('')}
  </section>`;
}

function networkVisibleItems(includeCategory = true) {
  const query = normalizeCatalogName(state.networkSearch);
  return state.networkItems.filter((item) => {
    if (item.storeCode !== state.networkStore) return false;
    if (state.networkBrand !== 'all' && friendlyBrand(item.brand) !== state.networkBrand) return false;
    if (includeCategory && state.networkCategory !== 'all' && item.cluster !== state.networkCategory) return false;
    return !query || normalizeCatalogName(`${item.name} ${item.technicalName} ${item.materialCode}`).includes(query);
  });
}

function networkProductGroups(items) {
  const groups = new Map();
  for (const item of items) {
    const cluster = clusterLabels[item.cluster] ? item.cluster : 'misc';
    const key = `${cluster}|${item.materialCode}`;
    if (!groups.has(key)) groups.set(key, {
      cluster,
      materialCode: item.materialCode,
      name: item.name,
      technicalName: item.technicalName,
      brand: friendlyBrand(item.brand),
      available: 0,
      incoming: 0,
      repair: 0,
      latestModifiedOn: item.latestModifiedOn,
      stores: new Map(),
    });
    const group = groups.get(key);
    group.available += item.available;
    group.incoming += item.incoming;
    group.repair += item.repair;
    if (String(item.latestModifiedOn || '') > String(group.latestModifiedOn || '')) group.latestModifiedOn = item.latestModifiedOn;
    group.stores.set(item.storeCode, { available: item.available, incoming: item.incoming, repair: item.repair });
  }
  return [...groups.values()].sort((left, right) => clusterOrder.indexOf(left.cluster) - clusterOrder.indexOf(right.cluster) || left.name.localeCompare(right.name, 'pt-BR') || left.materialCode.localeCompare(right.materialCode, 'pt-BR'));
}

function renderNetworkStockWorkspace() {
  const target = document.querySelector('[data-network-results]');
  if (!target) return;
  const categoryItems = networkVisibleItems(false);
  const items = networkVisibleItems();
  const store = state.networkStores.find((entry) => entry.code === state.networkStore);
  const products = networkProductGroups(items);
  const categoryGroups = new Map();
  for (const item of categoryItems) {
    const cluster = clusterLabels[item.cluster] ? item.cluster : 'misc';
    if (!categoryGroups.has(cluster)) categoryGroups.set(cluster, []);
    categoryGroups.get(cluster).push(item);
  }
  const orderedCategories = clusterOrder.filter((cluster) => categoryGroups.has(cluster));
  const filteredTotals = items.reduce((sum, item) => ({ available: sum.available + item.available, incoming: sum.incoming + item.incoming, repair: sum.repair + item.repair }), { available: 0, incoming: 0, repair: 0 });
  const categorySummary = orderedCategories.map((cluster) => {
    const entries = categoryGroups.get(cluster);
    const totals = entries.reduce((sum, item) => ({ available: sum.available + item.available, incoming: sum.incoming + item.incoming, repair: sum.repair + item.repair }), { available: 0, incoming: 0, repair: 0 });
    const productCount = networkProductGroups(entries).length;
    return `<button class="network-category-pill ${state.networkCategory === cluster ? 'is-active' : ''}" data-action="network-category" data-category="${cluster}"><span class="product-visual--${cluster}">${clusterGraphic(cluster)}</span><strong>${escapeHtml(clusterLabels[cluster])}</strong><small>${productCount}</small></button>`;
  }).join('');
  const productSections = clusterOrder.filter((cluster) => products.some((product) => product.cluster === cluster)).map((cluster) => {
    const clusterProducts = products.filter((product) => product.cluster === cluster);
    const totalAvailable = clusterProducts.reduce((sum, product) => sum + product.available, 0);
    return `<section class="network-store-section"><header><div><span class="network-store-section__icon product-visual--${cluster}">${clusterGraphic(cluster)}</span><div><h3>${escapeHtml(clusterLabels[cluster])}</h3><p>${clusterProducts.length} ${clusterProducts.length === 1 ? 'item' : 'itens'} · ${totalAvailable} disponíveis</p></div></div></header><div class="network-stock-table"><div class="network-stock-row network-stock-row--head"><span>Produto e código</span><span>Disponível</span><span>A caminho</span><span>Reparo</span><span>IMEIs / seriais</span><span>Atualização</span></div>${clusterProducts.map((product) => {
      const materialKey = String(product.materialCode || '').trim().toUpperCase();
      const serials = state.networkSerials.filter((serial) => serial.storeCode === state.networkStore && String(serial.materialCode || '').trim().toUpperCase() === materialKey);
      const statusLabels = { available: 'Disponível', incoming: 'A caminho', repair: 'Reparo', ignored: 'Fora do saldo' };
      return `<article class="network-stock-item"><div class="network-stock-row"><div class="network-product-identity"><strong>${escapeHtml(product.name)}</strong><code class="mono">${escapeHtml(product.materialCode || 'Sem código')}</code><small>${escapeHtml(product.brand || clusterLabels[cluster])}${product.technicalName && product.technicalName !== product.name ? ` · ${escapeHtml(product.technicalName)}` : ''}</small></div><b class="network-stock-quantity is-available">${product.available}</b><b class="network-stock-quantity is-incoming">${product.incoming}</b><b class="network-stock-quantity is-repair">${product.repair}</b><span class="network-serial-count ${serials.length ? 'has-serials' : ''}">${serials.length ? `<strong>${serials.length}</strong><small>${serials.length === 1 ? 'código' : 'códigos'}</small>` : '<small>Não informado</small>'}</span><time>${escapeHtml(formatDateOnly(product.latestModifiedOn))}</time></div>${serials.length ? `<details class="network-imei-panel"><summary><span>${uiIcon('sim')}<strong>Ver ${serials.length} ${serials.length === 1 ? 'IMEI / serial' : 'IMEIs / seriais'}</strong><small>Códigos desta unidade na planilha</small></span>${uiIcon('chevron')}</summary><div class="network-imei-grid">${serials.map((serial, index) => `<div class="network-imei-card"><span>${String(index + 1).padStart(2, '0')}</span><div><small>IMEI / SERIAL</small><button type="button" class="mono" data-action="copy-text" data-copy="${escapeHtml(serial.serialNumber)}" title="Copiar código">${escapeHtml(serial.serialNumber)}</button></div><em class="is-${escapeHtml(serial.status)}">${escapeHtml(statusLabels[serial.status] || serial.status)}</em></div>`).join('')}</div></details>` : ''}</article>`;
    }).join('')}</div></section>`;
  }).join('');
  target.innerHTML = `<section class="network-selected-store"><div class="network-selected-store__title"><p class="page-eyebrow">Estoque individual</p><h2>${escapeHtml(store?.name || 'Loja')}</h2><span>Centro ${escapeHtml(store?.center || '')} · base ${escapeHtml(formatDate(`${store?.snapshotDate || ''}T12:00:00.000Z`, false))}</span></div><div class="network-selected-store__metrics"><span><strong>${filteredTotals.available}</strong> disponíveis</span><span><strong>${filteredTotals.incoming}</strong> a caminho</span><span><strong>${filteredTotals.repair}</strong> em reparo</span><span><strong>${products.length}</strong> materiais</span></div></section><nav class="network-category-strip" aria-label="Categorias do estoque"><button class="network-category-pill ${state.networkCategory === 'all' ? 'is-active' : ''}" data-action="network-category" data-category="all"><strong>Todos</strong><small>${networkProductGroups(categoryItems).length}</small></button>${categorySummary}</nav><div class="network-store-results"><div class="network-store-results__head"><div><h3>${state.networkCategory === 'all' ? 'Estoque completo da loja' : clusterLabels[state.networkCategory]}</h3><p>Os saldos abaixo pertencem somente à ${escapeHtml(store?.name || 'loja selecionada')}.</p></div></div>${productSections || emptyState('Nenhum produto encontrado', 'Altere a busca ou escolha outra categoria.')}</div>`;
}

async function renderNetworkStock() {
  if (state.user.role !== 'manager') return navigate('dashboard');
  const data = await api('/api/network-inventory');
  state.networkStores = data.stores || [];
  state.networkItems = data.items || [];
  state.networkSerials = data.serials || [];
  if (!state.networkStores.some((store) => store.code === state.networkStore)) state.networkStore = state.networkStores[0]?.code || '';
  const content = document.querySelector('#view-content');
  const brands = [...new Set(state.networkItems.filter((item) => item.cluster === 'devices').map((item) => friendlyBrand(item.brand)))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  content.innerHTML = `<section class="network-page-intro"><div><p class="page-eyebrow">Consulta gerencial</p><h2>Estoque da rede</h2><p>Cada loja aparece separadamente. Selecione uma unidade para consultar o estoque completo dela.</p></div><button class="btn btn--secondary" data-action="refresh-network-stock">Atualizar dados</button></section><div class="network-store-switcher" role="tablist" aria-label="Escolha uma loja">${state.networkStores.map((store) => `<button role="tab" aria-selected="${state.networkStore === store.code}" class="network-store-tab ${state.networkStore === store.code ? 'is-active' : ''}" data-action="network-store" data-store="${escapeHtml(store.code)}"><span><small>Centro ${escapeHtml(store.center)}</small><strong>${escapeHtml(store.name)}</strong></span><b>${store.available}<small> disponíveis</small></b><em>${store.materialCount} materiais</em></button>`).join('')}</div><section class="network-toolbar network-toolbar--clean"><label>${uiIcon('search')}<input type="search" data-action="network-search" value="${escapeHtml(state.networkSearch)}" placeholder="Buscar produto ou código nesta loja"></label><div class="filter-tabs"><button class="chip ${state.networkBrand === 'all' ? 'is-active' : ''}" data-action="network-brand" data-brand="all">Todas as marcas</button>${brands.map((brand) => `<button class="chip ${state.networkBrand === brand ? 'is-active' : ''}" data-action="network-brand" data-brand="${escapeHtml(brand)}">${escapeHtml(brand)}</button>`).join('')}</div></section><div data-network-results></div>`;
  renderNetworkStockWorkspace();
}

function renderOutletProducts() {
  const target = document.querySelector('[data-outlet-results]');
  if (!target) return;
  const query = normalizeCatalogName(state.outletSearch);
  const storeNames = new Map(state.outletStores.map((store) => [store.code, store.name]));
  const products = state.outletProducts.filter((product) => (
    (state.outletDiscount === 'all' || Number(product.discount) === Number(state.outletDiscount))
    && (state.outletCategory === 'all' || product.category === state.outletCategory || (state.outletCategory === 'accessories' && product.category !== 'devices'))
    && (state.outletStore === 'all' || Number(product.stores?.[state.outletStore] || 0) > 0)
    && (!query || normalizeCatalogName(`${product.name} ${Object.keys(product.stores || {}).map((code) => `${code} ${storeNames.get(code) || ''}`).join(' ')}`).includes(query))
  ));
  const available = products.reduce((sum, product) => sum + (state.outletStore === 'all' ? product.available : Number(product.stores?.[state.outletStore] || 0)), 0);
  const categoryLabels = { devices: 'Celular', wearables: 'Relógio', chargers: 'Carregador', cases: 'Capa', screen_protectors: 'Película', misc: 'Acessório' };
  target.innerHTML = `<div class="outlet-results__head"><div><p class="page-eyebrow">Disponibilidade da campanha</p><h3>${products.length} ${products.length === 1 ? 'produto encontrado' : 'produtos encontrados'}</h3><p>${available} ${available === 1 ? 'unidade disponível' : 'unidades disponíveis'}${state.outletStore === 'all' ? ' nas lojas da rede' : ` na ${escapeHtml(storeNames.get(state.outletStore) || state.outletStore)}`}</p></div></div>${products.length ? `<div class="outlet-grid">${products.map((product) => {
    const relevantStores = state.outletStores.filter((store) => Number(product.stores?.[store.code] || 0) > 0 && (state.outletStore === 'all' || state.outletStore === store.code));
    const visibleAvailable = state.outletStore === 'all' ? product.available : Number(product.stores?.[state.outletStore] || 0);
    const graphicCategory = product.category === 'wearables' ? 'devices' : product.category;
    return `<article class="outlet-card outlet-card--${product.discount}"><div class="outlet-card__top"><span class="outlet-card__discount"><b>${product.discount}%</b> de desconto</span><span class="outlet-card__visual product-visual--${escapeHtml(graphicCategory)}">${clusterGraphic(graphicCategory)}</span></div><div class="outlet-card__body"><p>${escapeHtml(categoryLabels[product.category] || 'Produto')}</p><h3>${escapeHtml(product.name)}</h3><span class="outlet-card__campaign">Oferta disponível em ${relevantStores.length} ${relevantStores.length === 1 ? 'loja' : 'lojas'}</span></div><div class="outlet-card__availability"><strong><b>${visibleAvailable}</b> ${visibleAvailable === 1 ? 'unidade disponível' : 'unidades disponíveis'}</strong><div class="outlet-store-list">${relevantStores.map((store) => `<div class="outlet-store-row"><span><strong>${escapeHtml(store.name)}</strong><small>Centro ${escapeHtml(store.center || store.code)}</small></span><b>${Number(product.stores[store.code])}<small> un.</small></b></div>`).join('')}</div></div><footer>Lista promocional importada em ${escapeHtml(formatDateOnly(state.outletImportedOn))}</footer></article>`;
  }).join('')}</div>` : emptyState('Nenhuma oferta encontrada', 'Altere a busca ou os filtros para visualizar os itens da promoção.')}`;
}

async function renderOutlet() {
  const data = await api('/api/outlet');
  state.outletProducts = data.products || [];
  state.outletStores = data.stores || [];
  state.outletImportedOn = data.importedOn || '';
  const content = document.querySelector('#view-content');
  const totalAvailable = state.outletProducts.reduce((sum, product) => sum + product.available, 0);
  const bestDiscount = Math.max(0, ...state.outletProducts.map((product) => product.discount));
  const accessoryCount = state.outletProducts.filter((product) => product.category !== 'devices').length;
  content.innerHTML = `<section class="outlet-hero"><div><p class="page-eyebrow">Campanha Vivo Outlet</p><h2>Ofertas de todas as lojas em um só lugar</h2><p>Consulte o produto, o desconto, a loja, o centro e a quantidade disponível antes de oferecer ao cliente.</p><div class="outlet-hero__metrics"><span><b>${state.outletProducts.length}</b> modelos em promoção</span><span><b>${totalAvailable}</b> unidades disponíveis</span><span><b>${state.outletStores.length}</b> lojas participantes</span><span><b>${accessoryCount}</b> acessórios e wearables</span></div></div><div class="outlet-hero__seal"><small>desconto de até</small><strong>${bestDiscount}%</strong><span>OUTLET</span></div></section><section class="outlet-toolbar outlet-toolbar--detailed"><label class="outlet-search">${uiIcon('search')}<input type="search" data-action="outlet-search" value="${escapeHtml(state.outletSearch)}" placeholder="Buscar aparelho, acessório, loja ou centro"></label><label class="outlet-select"><span>Loja</span><select class="select" data-action="outlet-store"><option value="all">Todas as lojas (${totalAvailable} un.)</option>${state.outletStores.map((store) => `<option value="${escapeHtml(store.code)}" ${state.outletStore === store.code ? 'selected' : ''}>${escapeHtml(store.name)} · ${store.center} (${store.available})</option>`).join('')}</select></label><div class="outlet-filter-groups"><div class="filter-tabs"><button class="chip ${state.outletCategory === 'all' ? 'is-active' : ''}" data-action="outlet-category" data-category="all">Tudo</button><button class="chip ${state.outletCategory === 'devices' ? 'is-active' : ''}" data-action="outlet-category" data-category="devices">Celulares</button><button class="chip ${state.outletCategory === 'accessories' ? 'is-active' : ''}" data-action="outlet-category" data-category="accessories">Acessórios</button></div><div class="filter-tabs"><button class="chip ${state.outletDiscount === 'all' ? 'is-active' : ''}" data-action="outlet-discount" data-discount="all">Todos</button><button class="chip ${state.outletDiscount === '30' ? 'is-active' : ''}" data-action="outlet-discount" data-discount="30">30% OFF</button><button class="chip ${state.outletDiscount === '40' ? 'is-active' : ''}" data-action="outlet-discount" data-discount="40">40% OFF</button></div></div></section><section class="outlet-results" data-outlet-results></section>`;
  renderOutletProducts();
}

function showcaseProductChoice(product) {
  return `${product.name} · ${product.materialCode || 'sem material'}`;
}

function showcaseProductByCode(value) {
  const code = String(value || '').trim().toUpperCase();
  if (!code) return null;
  return state.showcases.products.find((item) => String(item.materialCode || '').trim().toUpperCase() === code) || null;
}

function showcaseFixtureById(fixtureId) {
  return state.showcases.fixtures.find((fixture) => fixture.id === fixtureId) || null;
}

function showcaseSlotById(fixtureId, slotNumber) {
  return showcaseFixtureById(fixtureId)?.slots.find((slot) => slot.slotNumber === Number(slotNumber)) || null;
}

function showcaseSlotMarkup(fixture, slot) {
  const assignment = slot.assignment;
  const editable = state.showcases.canEdit;
  const shelfLabel = fixture.type === 'demo_table'
    ? `Posição ${slot.positionNumber}`
    : `Prateleira ${slot.shelfNumber}, posição ${slot.positionNumber}`;
  if (!assignment) {
    return `<button class="showcase-slot is-empty" ${editable ? `data-action="open-showcase-slot" data-fixture-id="${escapeHtml(fixture.id)}" data-slot-number="${slot.slotNumber}"` : 'disabled'} aria-label="${escapeHtml(`${shelfLabel}: posição vazia`)}"><span>${editable ? uiIcon('plus') : uiIcon('box')}</span><strong>Posição livre</strong><small>${editable ? 'Cadastrar produto' : shelfLabel}</small></button>`;
  }
  const imageProduct = { ...assignment, name: assignment.productName };
  const health = assignment.health === 'attention' ? 'is-attention' : 'is-occupied';
  return `<button class="showcase-slot ${health}" data-action="open-showcase-slot" data-fixture-id="${escapeHtml(fixture.id)}" data-slot-number="${slot.slotNumber}" aria-label="${escapeHtml(`${shelfLabel}: ${assignment.productName}`)}">
    <span class="showcase-slot__image">${productImageMarkup(imageProduct, 'showcase-product-image', 72, 72)}</span>
    <span class="showcase-slot__copy"><small>${escapeHtml(shelfLabel)}</small><strong>${escapeHtml(assignment.productName)}</strong><code>${escapeHtml(assignment.materialCode || 'Sem código')}</code>${assignment.serialNumber ? `<em>Serial / IMEI ${escapeHtml(assignment.serialNumber)}</em>` : '<em>Sem controle serial</em>'}</span>
    <span class="showcase-slot__status">${assignment.health === 'attention' ? `${uiIcon('warning')} Conferir` : `${uiIcon('check')} Ocupada`}</span>
  </button>`;
}

function showcaseCabinetMarkup(fixture) {
  const shelves = Array.from({ length: fixture.shelfCount }, (_, index) => {
    const shelfNumber = index + 1;
    const slots = fixture.slots.filter((slot) => slot.shelfNumber === shelfNumber);
    return `<div class="showcase-shelf"><div class="showcase-shelf__label"><span>Prateleira</span><strong>${shelfNumber}</strong></div><div class="showcase-shelf__slots">${slots.map((slot) => showcaseSlotMarkup(fixture, slot)).join('')}</div></div>`;
  }).join('');
  return `<article class="showcase-cabinet ${fixture.type === 'device_showcase' ? 'is-device' : 'is-accessory'}"><header><div><span>${fixture.type === 'device_showcase' ? 'Aparelhos' : 'Acessórios'}</span><h3>${escapeHtml(fixture.name)}</h3></div><strong>${fixture.occupied}<small>/${fixture.capacity}</small></strong></header><div class="showcase-cabinet__glass">${shelves}</div><footer><span>${fixture.capacity - fixture.occupied} posições livres</span>${fixture.attention ? `<b>${uiIcon('warning')} ${fixture.attention} para conferir</b>` : `<b>${uiIcon('check')} Tudo certo</b>`}</footer></article>`;
}

function showcaseDemoTableMarkup(fixture) {
  return `<article class="showcase-demo-table ${fixture.id === 'demo-main' ? 'is-main' : 'is-side'}"><header><div><span>Degustação</span><h3>${escapeHtml(fixture.name)}</h3></div><strong>${fixture.occupied}/${fixture.capacity}</strong></header><div class="showcase-demo-table__surface">${fixture.slots.map((slot) => showcaseSlotMarkup(fixture, slot)).join('')}<span class="showcase-demo-table__channel" aria-hidden="true"></span></div><footer>${fixture.capacity - fixture.occupied} ${fixture.capacity - fixture.occupied === 1 ? 'posição livre' : 'posições livres'}</footer></article>`;
}

async function renderShowcases() {
  const data = await api('/api/showcases');
  state.showcases = data;
  const cabinets = data.fixtures.filter((fixture) => fixture.type !== 'demo_table');
  const demoTables = data.fixtures.filter((fixture) => fixture.type === 'demo_table');
  const content = document.querySelector('#view-content');
  content.innerHTML = `<section class="showcase-hero"><div><p class="page-eyebrow">Mapa vivo da exposição</p><h2>Vitrines da loja</h2><p>Veja exatamente onde cada produto está exposto. ${data.canEdit ? 'Clique em uma posição para cadastrar, trocar ou retirar um item.' : 'Gerentes e estoquistas mantêm este mapa atualizado.'}</p></div><div class="showcase-hero__visual" aria-hidden="true"><span></span><span></span><span></span><span></span></div></section>
    <section class="showcase-summary"><article><span>Posições</span><strong>${data.summary.capacity}</strong><small>em toda a loja</small></article><article><span>Ocupadas</span><strong>${data.summary.occupied}</strong><small>produtos expostos</small></article><article><span>Livres</span><strong>${data.summary.capacity - data.summary.occupied}</strong><small>disponíveis para uso</small></article><article class="${data.summary.attention ? 'has-attention' : ''}"><span>Conferência</span><strong>${data.summary.attention}</strong><small>${data.summary.attention ? 'itens pedindo atenção' : 'nenhuma divergência'}</small></article></section>
    <section class="showcase-section"><header><div><p class="page-eyebrow">Exposição vertical</p><h2>Vitrines e prateleiras</h2><p>Até quatro produtos em cada prateleira.</p></div><div class="showcase-legend"><span><i class="is-occupied"></i>Ocupada</span><span><i class="is-empty"></i>Livre</span><span><i class="is-attention"></i>Conferir</span></div></header><div class="showcase-cabinet-grid">${cabinets.map(showcaseCabinetMarkup).join('')}</div></section>
    <section class="showcase-section showcase-demo-section"><header><div><p class="page-eyebrow">Experimentação</p><h2>Mesas de degustação</h2><p>Mapa das posições de aparelhos disponíveis para demonstração.</p></div></header><div class="showcase-demo-floor">${demoTables.map(showcaseDemoTableMarkup).join('')}</div></section>`;
}

function showcaseSerialOptions(fixture, slot, variantId) {
  const serials = state.showcases.serials.filter((serial) => Number(serial.variantId) === Number(variantId));
  const selectedId = Number(slot.assignment?.serialId || 0);
  return `<option value="">Selecione o serial ou IMEI</option>${serials.map((serial) => {
    const assignedElsewhere = serial.fixtureId && !(serial.fixtureId === fixture.id && serial.slotNumber === slot.slotNumber);
    const assignedFixture = assignedElsewhere ? showcaseFixtureById(serial.fixtureId) : null;
    const assignedSlot = assignedElsewhere ? showcaseSlotById(serial.fixtureId, serial.slotNumber) : null;
    const location = assignedElsewhere
      ? ` · já está em ${assignedFixture?.name || 'outra vitrine'}${assignedSlot ? `, posição ${assignedSlot.positionNumber}` : ''} · selecione para mover`
      : serial.status !== 'available' ? ' · conferir estoque' : '';
    return `<option value="${serial.id}" ${serial.id === selectedId ? 'selected' : ''}>${escapeHtml(serial.serialNumber)}${escapeHtml(location)}</option>`;
  }).join('')}`;
}

function refreshShowcaseSerialPicker(form) {
  const fixture = showcaseFixtureById(form.dataset.fixtureId);
  const slot = showcaseSlotById(form.dataset.fixtureId, form.dataset.slotNumber);
  const product = showcaseProductByCode(form.elements.itemCode?.value);
  const wrapper = form.querySelector('[data-showcase-serial-field]');
  const result = form.querySelector('[data-showcase-product-result]');
  if (!wrapper || !fixture || !slot) return;
  if (result) {
    result.hidden = !product;
    result.innerHTML = product ? `<span class="product-visual--${escapeHtml(product.cluster || 'misc')}">${clusterGraphic(product.cluster || 'misc')}</span><div><small>Produto encontrado</small><strong>${escapeHtml(product.name)}</strong><code>${escapeHtml(product.materialCode)}</code><p>${Number(product.quantity)} ${Number(product.quantity) === 1 ? 'unidade disponível' : 'unidades disponíveis'} · ${escapeHtml(clusterLabels[product.cluster] || 'Produto')}</p></div>${uiIcon('check')}` : '';
  }
  if (!product?.serialTracked) {
    wrapper.hidden = true;
    const select = wrapper.querySelector('select');
    select.required = false;
    select.value = '';
    return;
  }
  wrapper.hidden = false;
  const select = wrapper.querySelector('select');
  select.innerHTML = product ? showcaseSerialOptions(fixture, slot, product.variantId) : '<option value="">Escolha primeiro o produto</option>';
  select.required = true;
}

function showcaseSlotModal(fixtureId, slotNumber) {
  const fixture = showcaseFixtureById(fixtureId);
  const slot = showcaseSlotById(fixtureId, slotNumber);
  if (!fixture || !slot) return;
  const assignment = slot.assignment;
  if (!state.showcases.canEdit) {
    if (!assignment) return;
    showModal(`<div class="modal__head"><div><h2>${escapeHtml(assignment.productName)}</h2><p>${escapeHtml(fixture.name)} · posição ${slot.positionNumber}</p></div>${modalCloseButton()}</div><div class="modal__body"><div class="showcase-detail">${productImageMarkup({ ...assignment, name: assignment.productName }, 'showcase-detail__image', 112, 112)}<div><span>Código material</span><strong>${escapeHtml(assignment.materialCode || 'Não informado')}</strong>${assignment.serialNumber ? `<span>IMEI cadastrado</span><code>${escapeHtml(assignment.serialNumber)}</code>` : '<span>Produto sem controle por IMEI</span>'}</div></div></div><div class="modal__footer"><button class="btn" data-action="close-modal">Fechar</button></div>`, { small: true });
    return;
  }
  const products = state.showcases.products;
  const currentProduct = products.find((product) => product.variantId === assignment?.variantId);
  const wantsSerial = Boolean(currentProduct?.serialTracked);
  const currentCode = currentProduct?.materialCode || '';
  showModal(`<form data-form="showcase-slot" data-fixture-id="${escapeHtml(fixture.id)}" data-slot-number="${slot.slotNumber}" novalidate><div class="modal__head"><div><h2>${assignment ? 'Editar posição' : 'Cadastrar produto'}</h2><p>${escapeHtml(fixture.name)} · ${fixture.type === 'demo_table' ? `posição ${slot.positionNumber}` : `prateleira ${slot.shelfNumber}, posição ${slot.positionNumber}`}</p></div>${modalCloseButton()}</div><div class="modal__body"><div class="form-error" data-form-error hidden></div><div class="showcase-form-intro"><span>${clusterGraphic(currentProduct?.cluster || 'devices')}</span><div><strong>Pesquise pelo código do item</strong><p>Use o código comercial ou material. Celulares, tablets, relógios e acessórios podem ocupar esta posição.</p></div></div><div class="field"><label for="showcase-item-code">Código do item</label><input class="input showcase-code-search" id="showcase-item-code" name="itemCode" data-action="showcase-product-code" list="showcase-code-options" value="${escapeHtml(currentCode)}" placeholder="Ex.: TGSA590B4000 ou 22024249" autocomplete="off" autocapitalize="characters" spellcheck="false" required autofocus><datalist id="showcase-code-options">${products.map((product) => `<option value="${escapeHtml(product.materialCode)}">${escapeHtml(product.name)} · ${product.quantity} un.</option>`).join('')}</datalist><p class="field-hint">Digite o código completo para localizar exatamente o produto.</p></div><div class="showcase-product-result" data-showcase-product-result ${currentProduct ? '' : 'hidden'}>${currentProduct ? `<span class="product-visual--${escapeHtml(currentProduct.cluster || 'misc')}">${clusterGraphic(currentProduct.cluster || 'misc')}</span><div><small>Produto encontrado</small><strong>${escapeHtml(currentProduct.name)}</strong><code>${escapeHtml(currentProduct.materialCode)}</code><p>${Number(currentProduct.quantity)} ${Number(currentProduct.quantity) === 1 ? 'unidade disponível' : 'unidades disponíveis'} · ${escapeHtml(clusterLabels[currentProduct.cluster] || 'Produto')}</p></div>${uiIcon('check')}` : ''}</div><div class="field" data-showcase-serial-field ${wantsSerial ? '' : 'hidden'}><label for="showcase-serial">Serial / IMEI</label><select class="select" id="showcase-serial" name="serialId" ${wantsSerial ? 'required' : ''}>${showcaseSerialOptions(fixture, slot, currentProduct?.variantId || 0)}</select><p class="field-hint">Todos os IMEIs aparecem aqui. Se um deles já estiver exposto, a localização será indicada e você poderá movê-lo.</p></div></div><div class="modal__footer">${assignment ? '<button type="button" class="btn btn--danger" data-action="clear-showcase-slot">Esvaziar posição</button>' : ''}<button type="button" class="btn btn--secondary" data-action="close-modal">Cancelar</button><button type="submit" class="btn">Salvar posição</button></div></form>`, { wide: true });
}

function sellerInventoryGroupCard(group, totalAvailable) {
  const cluster = clusterLabels[group.cluster] ? group.cluster : 'misc';
  const share = totalAvailable > 0 && group.available > 0
    ? Math.max(2, Math.round((group.available / totalAvailable) * 100))
    : 0;
  const topProducts = group.topProducts?.length
    ? `<div class="inventory-preview"><span class="inventory-preview__title">Mais disponíveis</span><ul>${group.topProducts.map((product) => `<li><div><strong title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</strong><code class="mono">${escapeHtml(product.materialCode || '—')}</code></div><span>${Number(product.available)} un.</span></li>`).join('')}</ul></div>`
    : '<div class="inventory-preview inventory-preview--empty">Nenhum produto disponível neste grupo.</div>';
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
    ${topProducts}
    <button class="inventory-group-card__action" data-action="open-store-group" data-cluster="${cluster}"><span>Ver produtos disponíveis</span>${uiIcon('plus')}</button>
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
      <div class="metrics-grid">${metric('Itens disponíveis', data.stock.available, `${data.modelsAvailable} materiais com saldo`, 'metric-card--success')}${metric('Materiais em falta', management.outOfStockMaterials || 0, 'Sem saldo e sem chegada prevista', 'metric-card--warning')}${metric('Saldo baixo', management.lowStockMaterials || 0, 'Materiais com até 2 unidades', 'metric-card--info')}${metric('Em chegada', management.incomingUnits || 0, `Depósitos ${management.snapshot?.incomingDeposits || 'DEPS e NREM'}`)}</div>
      <div class="admin-strip"><span><b>${Number(data.activeSellers || 0)}</b> vendedores ativos</span><span><b>${Number(data.activeStockers || 0)}</b> estoquistas ativos</span><span><b>${Number(management.orderStats?.approved || 0)}</b> pedidos liberados</span><span><b>${Number(data.stock.reserved || 0)}</b> unidades reservadas</span></div>
      ${managerDeviceOverview(management.deviceProducts)}
      <div class="management-dashboard-grid">
        <section class="card management-chart-card"><div class="card__head"><div><h3>Disponibilidade por grupo</h3><span>Comparação do saldo pronto e em entrega</span></div></div><div class="card__body">${managementClusterChart(data.inventoryGroups)}</div></section>
        <section class="card management-chart-card"><div class="card__head"><div><h3>Fluxo de pedidos</h3><span>Distribuição de todo o histórico</span></div></div><div class="card__body">${orderDonut(management.orderStats)}</div></section>
        <section class="card management-list-card"><div class="card__head"><div><h3>Produtos em falta</h3><span>${Number(management.outOfStockMaterials || 0)} materiais sem saldo</span></div><button class="btn btn--ghost btn--small" data-action="navigate" data-view="stock">Ver estoque</button></div><div class="card__body">${managementProductList(management.shortageProducts, 'Nenhum produto em falta', 'Todos os produtos monitorados possuem saldo ou entrega prevista.')}</div></section>
        <section class="card management-list-card"><div class="card__head"><div><h3>Produtos a caminho</h3><span>Consulta detalhada exclusiva para gerência e estoque</span></div><button class="btn btn--ghost btn--small" data-action="navigate" data-view="incoming">Abrir aba</button></div><div class="card__body">${managementProductList(management.incomingProducts, 'Nenhum item a caminho', 'A planilha atual não possui unidades em entrega.', 'incoming')}</div></section>
      </div>
      ${managerInventoryOverview(data.inventoryGroups, data.stock.available)}
      <div class="dashboard-grid"><section class="card"><div class="card__head"><div><h3>Acessos recentes</h3><span>Login da equipe</span></div><button class="btn btn--ghost btn--small" data-action="navigate" data-view="audit">Histórico completo</button></div><div class="card__body">${recentAccessList(management.recentAccesses)}</div></section><section class="card"><div class="card__head"><h3>Pedidos recentes</h3><button class="btn btn--ghost btn--small" data-action="navigate" data-view="requests">Ver todos</button></div><div class="card-list">${data.recentRequests.length ? data.recentRequests.map((item) => requestCard(item, true)).join('') : emptyState('Nenhum pedido', 'As solicitações aparecerão aqui.')}</div></section></div>`;
  } else if (state.user.role === 'stocker') {
    const outOfStock = (data.inventoryGroups || []).reduce((sum, group) => sum + Number(group.outOfStockCount || 0), 0);
    content.innerHTML = `
      <div class="page-heading"><div><p class="page-eyebrow">Central operacional</p><h2>Olá, ${escapeHtml(state.user.name.split(' ')[0])}</h2><p>Confira disponibilidade, preços e pedidos antes de movimentar qualquer item.</p></div><div class="page-actions"><button class="btn" data-action="navigate" data-view="stock">Conferir estoque</button><button class="btn btn--secondary" data-action="navigate" data-view="requests">Ver pedidos</button></div></div>
      <div class="metrics-grid">${metric('Disponíveis agora', data.stock.available, `${data.modelsAvailable} materiais com saldo`, 'metric-card--success')}${metric('Pedidos para separar', data.readyRequests || 0, 'Podem ser cancelados com devolução automática', 'metric-card--info')}${metric('Unidades reservadas', data.stock.reserved || 0, 'Saldo comprometido em pedidos')}${metric('Em chegada', data.stock.incoming || 0, `${outOfStock} materiais sem saldo · DEPS/NREM`, 'metric-card--warning')}</div>
      ${stockerInventoryOverview(data.inventoryGroups, data.stock.available)}
      <section class="card management-list-card"><div class="card__head"><div><h3>Produtos a caminho</h3><span>Consulta detalhada exclusiva para gerência e estoque</span></div><button class="btn btn--ghost btn--small" data-action="navigate" data-view="incoming">Abrir aba</button></div><div class="card__body">${managementProductList(data.incomingProducts, 'Nenhum item a caminho', 'A planilha atual não possui unidades em entrega.', 'incoming')}</div></section>
      <section class="card"><div class="card__head"><div><h3>Próximos pedidos para separar</h3><span>IMEIs, códigos materiais e valores registrados</span></div><button class="btn btn--ghost btn--small" data-action="navigate" data-view="requests">Ver todos</button></div><div class="card-list">${data.recentRequests.length ? data.recentRequests.map((item) => requestCard(item, true)).join('') : emptyState('Nenhum pedido para separar', 'Os próximos pedidos liberados aparecerão aqui.')}</div></section>`;
  } else {
    content.innerHTML = `
      <div class="page-heading"><div><p class="page-eyebrow">Sua área</p><h2>Olá, ${escapeHtml(state.user.name.split(' ')[0])}</h2><p>Escolha os produtos disponíveis e envie seu pedido.</p></div><button class="btn" data-action="navigate" data-view="new-request">+ Novo pedido</button></div>
      <div class="metrics-grid">${metric('Itens disponíveis', data.stock.available, `${data.modelsAvailable} materiais disponíveis`, 'metric-card--success')}${metric('Pedidos liberados', data.requests.approved, 'Com IMEI definido automaticamente', 'metric-card--info')}${metric('Pedidos recusados', data.requests.rejected, 'Somente quando não há estoque', 'metric-card--warning')}${metric('Meus pedidos', Object.values(data.requests).reduce((sum, value) => sum + Number(value || 0), 0), 'Histórico completo')}</div>
      ${sellerInventoryOverview(data.inventoryGroups, data.stock.available)}
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
  const imageUrl = typeof produto?.imagem_url === 'string' ? pro…37452 tokens truncated… sincero para alguém.',
  'Pause por 5 minutos, respire profundamente e desacelere.',
  'Experimente algo diferente da sua rotina.',
  'Desafie-se a passar o dia sem reclamar de pequenas coisas.',
  'Assista, leia ou converse sobre algo que faça você rir.',
  'Faça uma caminhada prestando atenção ao ambiente ao seu redor.',
  'Faça uma gentileza inesperada em troca.',
  'Recuse algo que você não quer ou não consegue fazer, sem se sentir culpado.',
  'Reserve 15 minutos para aprender algo novo.',
  'Pergunte a alguém: “Como você está, de verdade?” e escute a resposta.',
  'Conclua hoje uma tarefa que está sendo adiada há algum tempo.',
  'Faça pelo menos uma refeição sem celular.',
  'Escreva três coisas boas que aconteceram no seu dia.',
  'Tente dormir um pouco mais cedo hoje.',
  'Compartilhe uma mensagem, vídeo ou conteúdo positivo com alguém.',
  'Entre em contato com alguém com quem você não conversa há algum tempo.',
  'Se perceber que está se comparando, pare e pense em uma qualidade sua.',
  'Compre, faça ou permita-se alguma coisa simples que você estava com vontade.',
  'Deixe seu espaço de trabalho ou sua casa mais agradável.',
  'Ofereça ajuda a alguém antes mesmo que a pessoa precise pedir.',
  'Tire uma foto de algo simples que fez seu dia melhor.',
  'Conte para alguém uma coisa boa que você viveu ou aprendeu durante este mês.',
];

function septemberCareNote(date) {
  const value = new Date(`${date}T12:00:00`);
  return value.getMonth() === 8 ? septemberCareNotes[value.getDate() - 1] || '' : '';
}

function plannerItemsFor(date) {
  return state.plannerItems.filter((item) => item.date === date);
}

function plannerMonthCalendar() {
  const selected = new Date(`${state.plannerDate}T12:00:00`);
  const year = selected.getFullYear();
  const month = selected.getMonth();
  const first = new Date(year, month, 1, 12);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  const today = localDateValue();
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(first);
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start); day.setDate(start.getDate() + index);
    const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const items = plannerItemsFor(date);
    const careNote = septemberCareNote(date);
    return `<button class="planner-calendar__day ${careNote ? 'has-care-note' : ''} ${day.getMonth() === month ? '' : 'is-outside'} ${date === state.plannerDate ? 'is-selected' : ''} ${date === today ? 'is-today' : ''}" data-action="planner-calendar-day" data-date="${date}" aria-label="${day.toLocaleDateString('pt-BR')}, ${careNote || `${items.length} itens`}" title="${escapeHtml(careNote)}"><span>${day.getDate()}</span>${careNote ? `<small class="planner-calendar__note">${escapeHtml(careNote)}</small>` : ''}${items.length ? `<b>${items.length}</b><i>${items.slice(0,3).map((item) => `<em class="is-${item.type}"></em>`).join('')}</i>` : ''}</button>`;
  }).join('');
  return `<section class="planner-calendar"><header><button data-action="planner-month" data-offset="-1" aria-label="Mês anterior">‹</button><div><p class="page-eyebrow">Calendário</p><h3>${escapeHtml(monthLabel)}</h3></div><button data-action="planner-month" data-offset="1" aria-label="Próximo mês">›</button></header><div class="planner-calendar__week"><span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span></div><div class="planner-calendar__grid">${cells}</div><footer><span><i class="is-appointment"></i> Compromisso</span><span><i class="is-task"></i> Tarefa</span><span><i class="is-reminder"></i> Lembrete</span></footer></section>`;
}

function plannerItemCard(item) {
  const labels = { task: 'Tarefa', appointment: 'Compromisso', reminder: 'Lembrete' };
  const priorities = { high: 'Alta', medium: 'Média', low: 'Baixa' };
  return `<article class="planner-item ${item.completed ? 'is-complete' : ''} planner-item--${escapeHtml(item.priority)}">
    <button class="planner-check" data-action="toggle-planner-item" data-id="${item.id}" aria-label="${item.completed ? 'Reabrir' : 'Concluir'} ${escapeHtml(item.title)}">${item.completed ? uiIcon('check') : ''}</button>
    <div class="planner-item__main"><div class="planner-item__meta"><span>${escapeHtml(labels[item.type] || 'Tarefa')}</span><span>${escapeHtml(priorities[item.priority] || 'Média')}</span>${item.time ? `<time>${escapeHtml(item.time)}</time>` : ''}</div><strong>${escapeHtml(item.title)}</strong>${item.details ? `<p>${escapeHtml(item.details)}</p>` : ''}</div>
    <button class="planner-delete" data-action="delete-planner-item" data-id="${item.id}" aria-label="Excluir ${escapeHtml(item.title)}">&times;</button>
  </article>`;
}

function plannerItemModal() {
  showModal(`<div class="modal__head"><div><p class="page-eyebrow">Novo registro</p><h2>Adicionar ao meu dia</h2></div><button class="btn btn--ghost btn--icon" data-action="close-modal" aria-label="Fechar">${uiIcon('close')}</button></div>
    <form data-form="planner-item" novalidate><div class="modal__body"><div class="form-error" data-form-error hidden></div><div class="form-grid">
      <div class="field field--full"><label for="planner-title">O que você precisa lembrar?</label><input class="input" id="planner-title" name="title" maxlength="180" required autofocus placeholder="Ex.: Retornar para o cliente"></div>
      <div class="field"><label for="planner-type">Tipo</label><select class="select" id="planner-type" name="type"><option value="task">Tarefa</option><option value="appointment">Compromisso</option><option value="reminder">Lembrete</option></select></div>
      <div class="field"><label for="planner-priority">Prioridade</label><select class="select" id="planner-priority" name="priority"><option value="high">Alta</option><option value="medium" selected>Média</option><option value="low">Baixa</option></select></div>
      <div class="field"><label for="planner-date">Data</label><input class="input" id="planner-date" name="date" type="date" value="${escapeHtml(state.plannerDate)}" required></div>
      <div class="field"><label for="planner-time">Horário (opcional)</label><input class="input" id="planner-time" name="time" type="time"></div>
      <div class="field field--full"><label for="planner-details">Detalhes</label><textarea class="textarea" id="planner-details" name="details" maxlength="1000" rows="3" placeholder="Informações, telefone, assunto ou próximos passos"></textarea></div>
    </div></div><div class="modal__footer"><button class="btn btn--secondary" type="button" data-action="close-modal">Cancelar</button><button class="btn" type="submit">Adicionar</button></div></form>`);
}

async function renderMyDay() {
  const data = await api(`/api/personal-planner?date=${encodeURIComponent(state.plannerDate)}`);
  state.plannerDay = data.day;
  state.plannerItems = data.items || [];
  const todayItems = plannerItemsFor(state.plannerDate);
  const pending = todayItems.filter((item) => !item.completed);
  const completed = todayItems.filter((item) => item.completed);
  const timed = pending.filter((item) => item.time).sort((a, b) => a.time.localeCompare(b.time));
  const upcoming = state.plannerItems.filter((item) => item.date > state.plannerDate && !item.completed).slice(0, 6);
  const careNote = septemberCareNote(state.plannerDate);
  const content = document.querySelector('#view-content');
  content.innerHTML = `<section class="planner-hero"><div><p class="page-eyebrow">Área pessoal e privada</p><h2>Planner</h2><p>${escapeHtml(plannerDateLabel(state.plannerDate))}</p></div><div class="planner-date-actions"><input class="input" type="date" data-action="planner-date" value="${escapeHtml(state.plannerDate)}"><button class="btn" data-action="open-planner-item">${uiIcon('plus')} Adicionar</button></div></section>
    ${careNote ? `<section class="planner-care-note"><span class="planner-care-note__ribbon" aria-hidden="true"></span><div><p class="page-eyebrow">Setembro Amarelo · 30 dias cuidando de você</p><h3>Nota do dia ${new Date(`${state.plannerDate}T12:00:00`).getDate()}</h3><p>${escapeHtml(careNote)}</p></div></section>` : ''}
    <section class="planner-metrics"><article><span>Pendentes</span><strong>${pending.length}</strong><small>para este dia</small></article><article><span>Concluídas</span><strong>${completed.length}</strong><small>progresso de ${todayItems.length ? Math.round((completed.length / todayItems.length) * 100) : 0}%</small></article><article><span>Com horário</span><strong>${timed.length}</strong><small>na agenda de hoje</small></article><article><span>Próximos dias</span><strong>${upcoming.length}</strong><small>itens já planejados</small></article></section>
    ${plannerMonthCalendar()}<div class="planner-layout"><main class="planner-main">
      <form class="planner-focus" data-form="planner-day"><input type="hidden" name="date" value="${escapeHtml(state.plannerDate)}"><div class="planner-section-head"><div><p class="page-eyebrow">Direção do dia</p><h3>Prioridades e intenção</h3></div><button class="btn btn--secondary btn--small" type="submit">Salvar planejamento</button></div><div class="form-error" data-form-error hidden></div><div class="planner-focus__grid">
        <div class="field"><label for="main-focus">Foco principal</label><input class="input" id="main-focus" name="mainFocus" maxlength="180" value="${escapeHtml(state.plannerDay.mainFocus)}" placeholder="A coisa mais importante de hoje"></div>
        <div class="field"><label for="energy">Como está sua energia?</label><select class="select" id="energy" name="energy">${[[1,'Muito baixa'],[2,'Baixa'],[3,'Normal'],[4,'Boa'],[5,'Excelente']].map(([value,label]) => `<option value="${value}" ${Number(state.plannerDay.energy) === value ? 'selected' : ''}>${value} · ${label}</option>`).join('')}</select></div>
        <div class="field field--full"><label for="intention">Intenção do dia</label><input class="input" id="intention" name="intention" maxlength="240" value="${escapeHtml(state.plannerDay.intention)}" placeholder="Ex.: Resolver o urgente sem perder o foco"></div>
        <div class="field field--full"><label for="planner-notes">Bloco de notas</label><textarea class="textarea" id="planner-notes" name="notes" maxlength="4000" rows="5" placeholder="Ideias, recados, pessoas para procurar e informações soltas">${escapeHtml(state.plannerDay.notes)}</textarea></div>
      </div></form>
      <section class="planner-list-card"><div class="planner-section-head"><div><p class="page-eyebrow">Plano de ação</p><h3>Tarefas, compromissos e lembretes</h3></div><button class="btn btn--ghost btn--small" data-action="open-planner-item">+ Novo item</button></div><div class="planner-items">${pending.length ? pending.map(plannerItemCard).join('') : emptyState('Dia livre por enquanto', 'Adicione o que precisa fazer, lembrar ou acompanhar.')}</div>${completed.length ? `<details class="planner-completed"><summary>${completed.length} concluída(s)</summary><div class="planner-items">${completed.map(plannerItemCard).join('')}</div></details>` : ''}</section>
    </main><aside class="planner-side"><section><p class="page-eyebrow">Agenda</p><h3>Horários do dia</h3><div class="planner-timeline">${timed.length ? timed.map((item) => `<article><time>${escapeHtml(item.time)}</time><div><strong>${escapeHtml(item.title)}</strong><span>${item.type === 'appointment' ? 'Compromisso' : item.type === 'reminder' ? 'Lembrete' : 'Tarefa'}</span></div></article>`).join('') : '<p class="planner-muted">Nenhum horário definido.</p>'}</div></section><section><p class="page-eyebrow">Visão adiante</p><h3>Próximos itens</h3><div class="planner-upcoming">${upcoming.length ? upcoming.map((item) => `<article><time>${formatDateOnly(item.date)}</time><strong>${escapeHtml(item.title)}</strong>${item.time ? `<span>${escapeHtml(item.time)}</span>` : ''}</article>`).join('') : '<p class="planner-muted">Nada agendado nos próximos dias.</p>'}</div></section></aside></div>`;
}

function replenishmentText() {
  const selected = state.replenishmentItems.filter((item) => item.selected);
  return ['LISTA DE REPOSIÇÃO', `Gerada em ${new Date().toLocaleString('pt-BR')}`, '', ...selected.map((item) => `${item.requestedQuantity}x · ${item.name} · ${item.materialCode}`)].join('\n');
}

const feedbackTypeInfo = {
  suggestion: { label: 'Sugestão', className: 'suggestion' },
  complaint: { label: 'Reclamação', className: 'complaint' },
};

const feedbackStatusInfo = {
  new: { label: 'Nova', className: 'new' },
  in_review: { label: 'Em análise', className: 'review' },
  resolved: { label: 'Resolvida', className: 'resolved' },
};

function feedbackCard(item) {
  const type = feedbackTypeInfo[item.type] || feedbackTypeInfo.suggestion;
  const status = feedbackStatusInfo[item.status] || feedbackStatusInfo.new;
  const managerActions = state.user.role === 'manager' ? `<button class="btn btn--secondary btn--small" data-action="review-feedback" data-id="${item.id}">Analisar</button>` : '';
  return `<article class="feedback-card">
    <header class="feedback-card__head"><div class="feedback-card__badges"><span class="feedback-type is-${type.className}">${type.label}</span><span class="feedback-status is-${status.className}">${status.label}</span></div>${managerActions}</header>
    <div class="feedback-card__title"><div><h3>${escapeHtml(item.title)}</h3><p>${state.user.role === 'manager' ? `${escapeHtml(item.authorName)} · ${escapeHtml(roleLabel(item.authorRole))}` : 'Sua mensagem'}${item.pageName ? ` · ${escapeHtml(item.pageName)}` : ''}</p></div><time>${escapeHtml(formatDate(item.createdAt))}</time></div>
    <p class="feedback-card__details">${escapeHtml(item.details)}</p>
    ${item.managerNote ? `<aside class="feedback-card__note"><strong>Retorno da gerência</strong><p>${escapeHtml(item.managerNote)}</p></aside>` : ''}
  </article>`;
}

function feedbackReviewModal(item) {
  if (!item || state.user.role !== 'manager') return;
  showModal(`<div class="modal__head"><div><p class="page-eyebrow">Acompanhamento</p><h2>Analisar mensagem</h2></div>${modalCloseButton()}</div>
    <form data-form="review-feedback" data-id="${item.id}" novalidate><div class="modal__body"><div class="form-error" data-form-error hidden></div><div class="feedback-review-summary"><span>${escapeHtml(feedbackTypeInfo[item.type]?.label || 'Mensagem')} de ${escapeHtml(item.authorName)}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.details)}</p></div><div class="form-grid">
      <div class="field"><label for="feedback-review-status">Status</label><select class="select" id="feedback-review-status" name="status"><option value="new" ${item.status === 'new' ? 'selected' : ''}>Nova</option><option value="in_review" ${item.status === 'in_review' ? 'selected' : ''}>Em análise</option><option value="resolved" ${item.status === 'resolved' ? 'selected' : ''}>Resolvida</option></select></div>
      <div class="field field--full"><label for="feedback-manager-note">Retorno para o funcionário</label><textarea class="textarea" id="feedback-manager-note" name="managerNote" maxlength="1000" rows="4" placeholder="Informe o que foi analisado ou qual providência será tomada">${escapeHtml(item.managerNote || '')}</textarea></div>
    </div></div><div class="modal__footer"><button class="btn btn--secondary" type="button" data-action="close-modal">Cancelar</button><button class="btn" type="submit">Salvar acompanhamento</button></div></form>`);
}

async function renderFeedback() {
  const query = state.feedbackFilter === 'all' ? '' : `?status=${encodeURIComponent(state.feedbackFilter)}`;
  const data = await api(`/api/site-feedback${query}`);
  state.feedback = data.feedback || [];
  const summary = data.summary || { total: 0, new: 0, inReview: 0, resolved: 0 };
  const manager = state.user.role === 'manager';
  const filters = [['all', 'Todas'], ['new', 'Novas'], ['in_review', 'Em análise'], ['resolved', 'Resolvidas']].map(([value, label]) => `<button class="chip ${state.feedbackFilter === value ? 'is-active' : ''}" data-action="filter-feedback" data-status="${value}">${label}</button>`).join('');
  const feed = state.feedback.length ? state.feedback.map(feedbackCard).join('') : emptyState(manager ? 'Nenhuma mensagem nesta etapa' : 'Você ainda não enviou mensagens', manager ? 'Altere o filtro ou aguarde uma nova contribuição da equipe.' : 'Use o formulário para compartilhar uma sugestão ou reclamação.');
  const content = document.querySelector('#view-content');
  content.innerHTML = `<section class="feedback-hero"><div><p class="page-eyebrow">${manager ? 'Voz da equipe' : 'Sua opinião melhora o trabalho'}</p><h2>${manager ? 'Sugestões e reclamações recebidas' : 'Ajude a melhorar o sistema'}</h2><p>${manager ? 'Acompanhe as mensagens enviadas por vendedores e estoquistas e registre o retorno da gerência.' : 'Conte o que incomodou, o que pode ser simplificado ou uma ideia que deixaria o site melhor.'}</p></div><div class="feedback-hero__symbol">${uiIcon('briefing')}</div></section>
    ${manager ? `<section class="feedback-metrics"><article><span>Total recebido</span><strong>${summary.total}</strong></article><article><span>Novas</span><strong>${summary.new}</strong></article><article><span>Em análise</span><strong>${summary.inReview}</strong></article><article><span>Resolvidas</span><strong>${summary.resolved}</strong></article></section>` : ''}
    <section class="feedback-layout ${manager ? 'is-manager' : ''}">
      ${manager ? '' : `<form class="feedback-form" data-form="site-feedback" novalidate><div><p class="page-eyebrow">Nova mensagem</p><h3>O que você gostaria de compartilhar?</h3><p>Seu nome e perfil acompanham a mensagem para facilitar o retorno.</p></div><div class="form-error" data-form-error hidden></div><div class="form-grid">
        <div class="field"><label for="feedback-type">Tipo</label><select class="select" id="feedback-type" name="feedbackType"><option value="suggestion">Sugestão de melhoria</option><option value="complaint">Reclamação</option></select></div>
        <div class="field"><label for="feedback-page">Página ou área (opcional)</label><input class="input" id="feedback-page" name="pageName" maxlength="100" placeholder="Ex.: Estoque da loja"></div>
        <div class="field field--full"><label for="feedback-title">Resumo</label><input class="input" id="feedback-title" name="title" minlength="4" maxlength="140" required placeholder="Resuma o ponto principal"></div>
        <div class="field field--full"><label for="feedback-details">Explique com detalhes</label><textarea class="textarea" id="feedback-details" name="details" minlength="10" maxlength="3000" rows="7" required placeholder="Diga o que aconteceu, como isso afeta seu trabalho e, se tiver, sua ideia de solução"></textarea></div>
      </div><button class="btn" type="submit">Enviar para a gerência</button></form>`}
      <div class="feedback-feed"><header><div><p class="page-eyebrow">${manager ? 'Caixa de entrada' : 'Minhas mensagens'}</p><h3>${manager ? 'Acompanhamento' : 'Histórico e retornos'}</h3></div><div class="filter-tabs">${filters}</div></header><div class="feedback-list">${feed}</div></div>
    </section>`;
}

async function navigate(view) {
  if (!viewTitles[view]) return;
  if (state.user.role !== 'manager' && ['users', 'audit'].includes(view)) return;
  if (view === 'network-stock' && state.user.role !== 'manager') return;
  if (state.user.role === 'stocker' && ['new-request', 'chips'].includes(view)) return;
  if (view === 'renova-intake' && !canAccessRenovaIntake()) return;
  if (view === 'repairs' && !canAccessRenovaIntake()) return;
  if (view === 'incoming' && !canAccessRenovaIntake()) return;
  if (view === 'labels' && !canAccessRenovaIntake()) return;
  if (view === 'replenishment' && !canAccessRenovaIntake()) return;
  state.cartDrawerOpen = false;
  document.body.classList.remove('cart-drawer-open');
  state.view = view;
  renderCartBar();
  updateShellNavigation();
  const content = document.querySelector('#view-content');
  content.innerHTML = '<div class="loading-block"><span class="loading-inline">Carregando</span></div>';
  try {
    if (view === 'point') await renderPoint();
    if (view === 'dashboard') await renderDashboard();
    if (view === 'my-day') await renderMyDay();
    if (view === 'feedback') await renderFeedback();
    if (view === 'news') await renderNews();
    if (view === 'showcases') await renderShowcases();
    if (view === 'outlet') await renderOutlet();
    if (view === 'chips') await renderChips();
    if (view === 'renova-intake') await renderRenovaIntake();
    if (view === 'repairs') await renderRepairs();
    if (view === 'incoming') await renderIncoming();
    if (view === 'labels') await renderLabels();
    if (view === 'replenishment') await renderReplenishment();
    if (view === 'network-stock') {
      state.networkCategory = 'all';
      await renderNetworkStock();
    }
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
      <span><strong>${escapeHtml(material.name)}</strong><code class="mono">${escapeHtml(material.materialCode)}</code>${material.latestArrivalCount ? `<small class="chip-material-option__arrival">Novo lote: ${Number(material.latestArrivalCount)} chips adicionados em ${escapeHtml(formatDateOnly(material.latestArrivalDate))}</small>` : ''}</span>
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
      <section class="chip-registration-step field--full"><header><span>1</span><div><strong>Escolha o material disponível</strong><small>Os chips recebidos ontem aparecem primeiro e identificados como novo lote.</small></div></header><div class="chip-material-search"><input class="input" type="search" data-action="chip-material-search" placeholder="Buscar nome ou código material" autocomplete="off"></div><input type="hidden" name="materialCode"><div class="chip-material-options" data-chip-materials></div></section>
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
      <div class="field"><label for="user-re">RE <span class="request-meta">(opcional)</span></label><input class="input mono" id="user-re" name="employeeRe" inputmode="numeric" pattern="[0-9]{8}" minlength="8" maxlength="8" value="${escapeHtml(user?.employeeRe || '')}" placeholder="81000000"><p class="field-hint">Código de 8 números usado como alternativa ao e-mail.</p></div>
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
  const payment = orderTotalCents > 0 ? paymentPriceLines(orderTotalCents) : null;
  const priceSummary = pricedItems.length
    ? `<div class="cart-pricing-summary">${state.priceCategory ? `<div><span>Categoria do plano</span><strong>${escapeHtml(state.priceCategory)}</strong></div>` : ''}${state.renova.enabled ? `<div><span>Preço normal dos produtos</span><strong>${formatMoney(subtotalCents)}</strong></div><div class="renova-summary-line"><span>Bônus do fabricante</span><strong>− ${formatMoney(renova.bonusCents)}</strong></div><div class="renova-summary-line"><span>Voucher ASSURANT</span><strong>− ${formatMoney(renova.voucherCents)}</strong></div><p>Renova: ${escapeHtml(selectedRenovaTradeIn()?.name || 'aparelho usado não informado')} · ${state.renova.condition === 'defeituoso' ? 'Defeituoso' : 'Bom'}. Os abatimentos foram limitados ao valor dos aparelhos.</p>` : ''}<div><span>Total do pedido</span><strong>${formatMoney(orderTotalCents)}</strong></div>${payment ? `<div class="cart-payment-options"><span><b>PIX / Vivo Pay</b>${formatMoney(payment.pix)}</span><span><b>12x sem juros</b>${formatMoney(payment.twelve)}</span><span><b>${payment.longCount}x</b>${formatMoney(payment.longInstallment)} <small>total ${formatMoney(payment.longTotal)}</small></span></div><p>Todos os produtos estão incluídos. De 13x a 21x há acréscimo progressivo; confirme a elegibilidade antes de concluir.</p>` : '<p>Sem cobrança para os itens selecionados.</p>'}</div>`
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
  document.documentElement.dataset.theme = user.theme === 'light' ? 'light' : 'dark';
  state.view = user.role === 'seller' ? 'point' : 'dashboard';
  state.catalog = [];
  state.labelSelection.clear();
  state.labelSearch = '';
  state.news = [];
  state.chips = [];
  state.renovaItems = [];
  state.replenishmentItems = [];
  state.replenishmentSearch = '';
  state.replenishmentFilter = 'all';
  state.replenishmentThreshold = 2;
  state.networkStores = [];
  state.networkItems = [];
  state.networkSerials = [];
  state.networkStore = '';
  state.networkSearch = '';
  state.networkBrand = 'all';
  state.showcases = { canEdit: false, summary: {}, fixtures: [], products: [], serials: [] };
  state.renovaSearch = '';
  state.renovaStatus = 'awaiting_pickup';
  state.chipSellers = [];
  state.chipLimit = 10;
  state.chipSearch = '';
  state.chipStatus = user.role === 'manager' ? 'all' : 'available';
  state.chipSellerId = 0;
  state.pricing = { categories: [], tableDate: '', source: '', paymentPolicy: DEFAULT_PAYMENT_POLICY };
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
  state.alignmentExpanded = false;
  state.pendingCount = 0;
  state.feedback = [];
  state.feedbackFilter = 'all';
  renderShell();
  if (user.mustChangePassword) return passwordModal(true);
  await navigate(user.role === 'seller' ? 'point' : 'dashboard');
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
    if (action === 'open-showcase-slot') showcaseSlotModal(button.dataset.fixtureId, Number(button.dataset.slotNumber));
    if (action === 'open-menu') document.body.classList.add('menu-open');
    if (action === 'close-menu') document.body.classList.remove('menu-open');
    if (action === 'logout') await withBusy(button, async () => { await api('/api/auth/logout', { method: 'POST' }); state.user = null; closeModal(true); renderLogin(); });
    if (action === 'password') passwordModal(false);
    if (action === 'toggle-theme') {
      const theme = state.user.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme; state.user.theme = theme; renderShell();
      await api('/api/preferences/theme', { method: 'PATCH', body: { theme } }); await navigate(state.view);
    }
    if (action === 'planner-calendar-day') { state.plannerDate = button.dataset.date; await renderMyDay(); }
    if (action === 'planner-month') {
      const date = new Date(`${state.plannerDate}T12:00:00`); date.setMonth(date.getMonth() + Number(button.dataset.offset), 1);
      state.plannerDate = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-01`; await renderMyDay();
    }
    if (action === 'open-planner-item') plannerItemModal();
    if (action === 'toggle-planner-item') {
      const item = state.plannerItems.find((entry) => entry.id === Number(button.dataset.id));
      if (item) { await api(`/api/personal-planner/items/${item.id}`, { method: 'PATCH', body: { completed: !item.completed } }); await renderMyDay(); }
    }
    if (action === 'delete-planner-item') {
      await api(`/api/personal-planner/items/${Number(button.dataset.id)}`, { method: 'DELETE' });
      showToast('Item removido do seu planejamento.'); await renderMyDay();
    }
    if (action === 'filter-feedback') { state.feedbackFilter = button.dataset.status || 'all'; await renderFeedback(); }
    if (action === 'review-feedback' && state.user.role === 'manager') feedbackReviewModal(state.feedback.find((item) => item.id === Number(button.dataset.id)));
    if (action === 'view-serialized-stock' && ['manager', 'stocker'].includes(state.user.role)) await serializedStockModal();
    if (action === 'open-quantity') { if (!state.catalog.length) await loadCatalog(); quantityModal(); }
    if (action === 'adjust-quantity') quantityModal(Number(button.dataset.variantId));
    if (action === 'choose-product') pickerModal(Number(button.dataset.productId));
    if (action === 'open-cart-summary') setCartDrawer(true);
    if (action === 'review-request' && state.user.role === 'seller' && state.cart.size) requestReviewModal();
    if (action === 'clear-store-simulation' && state.user.role === 'seller') {
      state.cart.clear();
      state.priceCategory = '';
      state.catalogSearch = '';
      state.catalogCategory = '';
      state.renova = { enabled: false, deviceId: 0, condition: 'bom' };
      state.deviceSelections.clear();
      state.expandedDeviceFamily = '';
      await renderSellerStore();
      showToast('Nova simulação iniciada.');
    }
    if (action === 'toggle-device-family') {
      state.expandedDeviceFamily = state.expandedDeviceFamily === button.dataset.familyKey ? '' : button.dataset.familyKey;
      renderCatalogGrid();
      if (state.expandedDeviceFamily) {
        window.requestAnimationFrame(() => document.querySelector(`.device-family-card[data-family-key="${CSS.escape(state.expandedDeviceFamily)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
      }
    }
    if (action === 'add-device-bundle') addDeviceBundle(button.dataset.familyKey);
    if (action === 'copy-material') { await copyText(button.dataset.code); showToast('Código material copiado.'); }
    if (action === 'toggle-label-product' && canAccessRenovaIntake()) {
      const key = button.dataset.key;
      if (state.labelSelection.has(key)) state.labelSelection.delete(key);
      else {
        const item = visibleLabelRows().find((row) => row.key === key);
        if (item) state.labelSelection.set(key, item);
      }
      renderLabelWorkspace();
    }
    if (action === 'label-mode' && canAccessRenovaIntake()) {
      state.labelMode = button.dataset.mode === 'store' ? 'store' : 'cases';
      state.labelSelection.clear();
      state.labelSearch = '';
      await renderLabels();
    }
    if (action === 'clear-labels' && canAccessRenovaIntake()) { state.labelSelection.clear(); renderLabelWorkspace(); }
    if (action === 'select-visible-labels' && canAccessRenovaIntake()) {
      visibleLabelRows().forEach((item) => state.labelSelection.set(item.key, item));
      renderLabelWorkspace();
    }
    if (action === 'print-labels' && canAccessRenovaIntake()) printSelectedLabels();
    if (action === 'filter-replenishment' && canAccessRenovaIntake()) { state.replenishmentFilter = button.dataset.filter; renderReplenishmentWorkspace(); }
    if (action === 'save-replenishment' && canAccessRenovaIntake()) {
      const variantId = Number(button.dataset.variantId);
      const input = document.querySelector(`[data-action="replenishment-quantity"][data-variant-id="${variantId}"]`);
      const requestedQuantity = Number(input?.value);
      await withBusy(button, async () => {
        await api('/api/replenishment', { method: 'POST', body: { variantId, requestedQuantity } });
        showToast('Produto salvo na lista de reposição.');
        await renderReplenishment();
      });
    }
    if (action === 'remove-replenishment' && canAccessRenovaIntake()) {
      await api(`/api/replenishment/${Number(button.dataset.variantId)}`, { method: 'DELETE' });
      showToast('Produto removido da lista.');
      await renderReplenishment();
    }
    if (action === 'copy-replenishment' && canAccessRenovaIntake()) { await copyText(replenishmentText()); showToast('Lista de reposição copiada.'); }
    if (action === 'filter-category') { state.catalogCategory = button.dataset.category; renderCatalogGrid(); }
    if (action === 'filter-stock-category') { state.stockCluster = button.dataset.category; renderStockTable(); }
    if (action === 'open-stock-group') {
      state.stockSearch = '';
      state.stockCluster = button.dataset.cluster;
      await navigate('stock');
    }
    if (action === 'open-device-family') {
      state.stockSearch = button.dataset.family || '';
      state.stockCluster = 'devices';
      await navigate('stock');
    }
    if (action === 'network-store' && state.user.role === 'manager') {
      state.networkStore = button.dataset.store;
      state.networkCategory = 'all';
      await renderNetworkStock();
    }
    if (action === 'refresh-network-stock' && state.user.role === 'manager') {
      await renderNetworkStock();
      showToast('Estoque das quatro lojas atualizado.');
    }
    if (action === 'copy-text' && state.user.role === 'manager') {
      await copyText(button.dataset.copy || '');
      showToast('IMEI copiado.');
    }
    if (action === 'network-brand' && state.user.role === 'manager') {
      state.networkBrand = button.dataset.brand;
      state.networkCategory = 'all';
      await renderNetworkStock();
    }
    if (action === 'network-category' && state.user.role === 'manager') {
      state.networkCategory = button.dataset.category;
      renderNetworkStockWorkspace();
    }
    if (action === 'outlet-discount') {
      state.outletDiscount = button.dataset.discount;
      document.querySelectorAll('[data-action="outlet-discount"]').forEach((filter) => filter.classList.toggle('is-active', filter.dataset.discount === state.outletDiscount));
      renderOutletProducts();
    }
    if (action === 'outlet-category') {
      state.outletCategory = button.dataset.category;
      document.querySelectorAll('[data-action="outlet-category"]').forEach((filter) => filter.classList.toggle('is-active', filter.dataset.category === state.outletCategory));
      renderOutletProducts();
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
    if (action === 'expand-alignment') {
      state.alignmentExpanded = true;
      state.alignmentTopic = 'payment-options';
      renderAlignment();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (action === 'collapse-alignment') {
      state.alignmentExpanded = false;
      renderAlignment();
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (action === 'upload-point-qr') uploadPointQr(state.users.find((user) => user.id === Number(button.dataset.id)));
    if (action === 'punch-point') await punchPoint(button);
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
  if (target.dataset.action === 'clear-showcase-slot') {
    const form = target.closest('form[data-form="showcase-slot"]');
    if (!form) return;
    await withBusy(target, async () => {
      await api(`/api/showcases/${encodeURIComponent(form.dataset.fixtureId)}/slots/${Number(form.dataset.slotNumber)}`, { method: 'DELETE' });
      closeModal(true);
      showToast('Posição esvaziada.');
      await renderShowcases();
    });
  }
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
  if (event.target.dataset.action === 'showcase-product-code') refreshShowcaseSerialPicker(event.target.closest('form'));
});

modalRoot.addEventListener('change', (event) => {
  if (event.target.dataset.action === 'showcase-product-code') refreshShowcaseSerialPicker(event.target.closest('form'));
});

root.addEventListener('change', (event) => {
  const action = event.target.dataset.action;
  if (action === 'outlet-store') { state.outletStore = event.target.value || 'all'; renderOutletProducts(); return; }
  if (action === 'replenishment-threshold') { state.replenishmentThreshold = Number(event.target.value || 2); renderReplenishment(); return; }
  if (action === 'planner-date') { state.plannerDate = event.target.value || localDateValue(); renderMyDay(); return; }
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
  if (action === 'offer-installments') {
    state.offerInstallments = Math.max(1, Math.min(21, Number(event.target.value || 21)));
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
  if (event.target.dataset.action === 'replenishment-search') { state.replenishmentSearch = event.target.value; renderReplenishmentWorkspace(); }
  if (event.target.dataset.action === 'label-search') { state.labelSearch = event.target.value; renderLabelWorkspace(); }
  if (event.target.dataset.action === 'search-renova-intake') { state.renovaSearch = event.target.value; renderRenovaIntakeResults(); }
  if (event.target.dataset.action === 'chip-search') { state.chipSearch = event.target.value; renderChipResults(); }
  if (event.target.dataset.action === 'stock-search') { state.stockSearch = event.target.value; renderStockTable(); }
  if (event.target.dataset.action === 'network-search') { state.networkSearch = event.target.value; renderNetworkStockWorkspace(); }
  if (event.target.dataset.action === 'outlet-search') { state.outletSearch = event.target.value; renderOutletProducts(); }
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
      if (form.dataset.form === 'planner-day') {
        await api('/api/personal-planner/day', { method: 'PUT', body: { date: data.date, mainFocus: data.mainFocus, intention: data.intention, notes: data.notes, energy: Number(data.energy) } });
        showToast('Planejamento do dia salvo.'); await renderMyDay();
      }
      if (form.dataset.form === 'planner-item') {
        await api('/api/personal-planner/items', { method: 'POST', body: { title: data.title, details: data.details, type: data.type, priority: data.priority, date: data.date, time: data.time } });
        closeModal(true); showToast('Item adicionado ao seu dia.'); state.plannerDate = data.date; await renderMyDay();
      }
      if (form.dataset.form === 'site-feedback') {
        await api('/api/site-feedback', { method: 'POST', body: { type: data.feedbackType, pageName: data.pageName, title: data.title, details: data.details } });
        form.reset(); state.feedbackFilter = 'all'; showToast('Mensagem enviada para a gerência.'); await renderFeedback();
      }
      if (form.dataset.form === 'showcase-slot') {
        const product = showcaseProductByCode(data.itemCode);
        if (!product) throw new ApiError('Código não encontrado no estoque disponível.', 400, { itemCode: 'Confira o código completo e tente novamente.' });
        const serialId = product.serialTracked ? Number(data.serialId || 0) : null;
        if (product.serialTracked && !serialId) throw new ApiError('Selecione o serial ou IMEI do produto.', 400, { serialId: 'Escolha um código disponível.' });
        await api(`/api/showcases/${encodeURIComponent(form.dataset.fixtureId)}/slots/${Number(form.dataset.slotNumber)}`, { method: 'PUT', body: { variantId: product.variantId, serialId } });
        closeModal(true);
        showToast('Produto cadastrado na vitrine.');
        await renderShowcases();
      }
      if (form.dataset.form === 'review-feedback') {
        await api(`/api/site-feedback/${encodeURIComponent(form.dataset.id)}`, { method: 'PATCH', body: { status: data.status, managerNote: data.managerNote } });
        closeModal(true); showToast('Acompanhamento atualizado.'); await renderFeedback();
      }
      if (form.dataset.form === 'login') {
        const result = await api('/api/auth/login', { method: 'POST', body: { identifier: data.identifier, password: data.password }, keepSession: true });
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
        await api('/api/users', { method: 'POST', body: { name: data.name, email: data.email, employeeRe: data.employeeRe, password: data.password, role: data.role } });
        closeModal(true);
        showToast('Usuário criado. Envie a senha provisória para a pessoa.');
        if (state.view === 'users') await renderUsers(); else await navigate('users');
      }
      if (form.dataset.form === 'edit-user') {
        if (data.password !== data.confirmUserPassword) throw new ApiError('As novas senhas não coincidem.', 400);
        const userId = Number(form.dataset.id);
        const result = await api(`/api/users/${userId}`, {
          method: 'PUT',
          body: { name: data.name, email: data.email, employeeRe: data.employeeRe, role: data.role, active: data.active === 'true', password: data.password },
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
