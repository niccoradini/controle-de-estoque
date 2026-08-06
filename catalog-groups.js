const COLOR_SUFFIXES = [
  'TITÂNIO PRETO',
  'AZUL-MARINHO',
  'LARANJA DEMO',
  'TRANSPARENTE',
  'VERMELHO',
  'GRAFITE',
  'VIOLETA',
  'LARANJA',
  'MARROM',
  'BRANCO',
  'CINZA',
  'PRATA',
  'PRETO',
  'VERDE',
  'ROXO',
  'ROSA',
  'AZUL',
];

export function normalizeCatalogName(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function capacityValue(memory = '') {
  const match = normalizeCatalogName(memory).match(/^(\d+(?:[.,]\d+)?)\s*(TB|GB)$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const amount = Number(match[1].replace(',', '.'));
  return match[2] === 'TB' ? amount * 1024 : amount;
}

function optionSort(left, right) {
  return capacityValue(left.memory) - capacityValue(right.memory)
    || left.color.localeCompare(right.color, 'pt-BR')
    || left.product.name.localeCompare(right.product.name, 'pt-BR');
}

export function parseDeviceName(value = '') {
  const name = String(value).replace(/\s+/g, ' ').trim();
  const memoryMatch = name.match(/\b(\d+(?:[.,]\d+)?\s*(?:TB|GB))\b/i);
  if (memoryMatch) {
    const start = memoryMatch.index;
    const end = start + memoryMatch[0].length;
    return {
      familyName: name.slice(0, start).trim(),
      memory: memoryMatch[1].toUpperCase().replace(/\s+/g, '').replace(',', '.'),
      color: name.slice(end).trim() || 'PADRÃO',
    };
  }

  const normalized = normalizeCatalogName(name);
  const color = COLOR_SUFFIXES.find((candidate) => normalized.endsWith(` ${normalizeCatalogName(candidate)}`));
  if (!color) return { familyName: name, memory: 'ÚNICA', color: 'PADRÃO' };
  return {
    familyName: name.slice(0, name.length - color.length).trim(),
    memory: 'ÚNICA',
    color,
  };
}

export function groupDeviceProducts(products = []) {
  const groups = new Map();
  for (const product of products) {
    if (product.cluster !== 'devices' || Number(product.available) <= 0) continue;
    const parsed = parseDeviceName(product.name);
    const key = normalizeCatalogName(parsed.familyName);
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        familyName: parsed.familyName,
        brand: product.brand || '',
        products: [],
        options: [],
        available: 0,
      });
    }
    const group = groups.get(key);
    group.products.push(product);
    group.available += Number(product.available);
    for (const variant of product.variants || []) {
      if (Number(variant.available) <= 0) continue;
      group.options.push({
        product,
        variant,
        memory: parsed.memory,
        color: parsed.color,
      });
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      memories: [...new Set(group.options.map((option) => option.memory))]
        .sort((left, right) => capacityValue(left) - capacityValue(right) || left.localeCompare(right, 'pt-BR')),
      options: group.options.sort(optionSort),
    }))
    .sort((left, right) => left.familyName.localeCompare(right.familyName, 'pt-BR'));
}

function compatibilityKeys(value = '') {
  const text = normalizeCatalogName(value)
    .replace(/\bGLX\b/g, 'GALAXY')
    .replace(/\bMOTOROLA\b/g, 'MOTO');
  const keys = new Set();

  const iphone = text.match(/\bIPHONE\s+(AIR|\d+E?)(?:\s+(PRO MAX|PRO))?\b/);
  if (iphone) keys.add(`IPHONE ${iphone[1]}${iphone[2] ? ` ${iphone[2]}` : ''}`);

  const galaxyFlipFold = text.match(/\bGALAXY(?:\s+Z)?\s+(FLIP|FOLD)\s*(\d+)(?:\s+(FE))?\b/);
  if (galaxyFlipFold) {
    keys.add(`GALAXY Z ${galaxyFlipFold[1]}${galaxyFlipFold[2]}${galaxyFlipFold[3] ? ` ${galaxyFlipFold[3]}` : ''}`);
  }

  const galaxy = text.match(/\bGALAXY\s+([AS]\d{2}\+?)(?:\s+(ULTRA|FE|EDGE))?(?:\s+5G)?(?=\s|$)/);
  if (galaxy) keys.add(`GALAXY ${galaxy[1]}${galaxy[2] ? ` ${galaxy[2]}` : ''}`);

  const motoPair = text.match(/\bMOTO\s+G(\d+)\s*\/\s*G?(\d+)\b/);
  if (motoPair) {
    keys.add(`MOTO G${motoPair[1]}`);
    keys.add(`MOTO G${motoPair[2]}`);
  }
  const motoG = text.match(/\bMOTO\s+G(\d+)\b/);
  if (motoG) keys.add(`MOTO G${motoG[1]}`);

  const motoEdge = text.match(/\b(?:MOTO\s+)?EDGE\s+(\d+)(?:\s+(FUSION|PRO))?\b/);
  if (motoEdge) keys.add(`MOTO EDGE ${motoEdge[1]}${motoEdge[2] ? ` ${motoEdge[2]}` : ''}`);
  if (/\b(?:MOTO\s+)?SIGNATURE\b/.test(text)) keys.add('MOTO SIGNATURE');

  return keys;
}

export function groupAccessoryChoices(products = []) {
  const groups = new Map();
  for (const product of products) {
    if (Number(product.available) <= 0) continue;
    const key = normalizeCatalogName(product.name);
    if (!groups.has(key)) groups.set(key, { key, name: product.name, products: [], available: 0 });
    const group = groups.get(key);
    group.products.push(product);
    group.available += Number(product.available);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      products: [...group.products].sort((left, right) => Number(right.available) - Number(left.available)),
    }))
    .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
}

export function compatibleCaseChoices(caseProducts = [], familyName = '') {
  const deviceKeys = compatibilityKeys(familyName);
  if (!deviceKeys.size) return [];
  return groupAccessoryChoices(caseProducts.filter((product) => {
    const caseKeys = compatibilityKeys(product.name);
    return [...deviceKeys].some((key) => caseKeys.has(key));
  }));
}
