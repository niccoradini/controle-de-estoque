-- Notícias, promoções e comunicados internos.
-- A retirada da aba é reversível: o gerente oculta ou republica cada item.

CREATE TABLE news_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 3 AND 120),
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 3 AND 2500),
  category TEXT NOT NULL DEFAULT 'notice',
  validity_label TEXT,
  image_path TEXT,
  image_alt TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_news_items_visibility
ON news_items (active DESC, updated_at DESC, id DESC);

-- Campanhas recebidas em 06/08/2026. O texto estruturado mantém preços e
-- elegibilidade legíveis no celular; a arte original fica disponível para
-- conferência. Todas podem ser ocultadas ou republicadas pelo gerente.
INSERT INTO news_items
  (id, title, body, category, validity_label, image_path, image_alt, active, created_at, updated_at)
VALUES
  (
    'campaign-gamer-week-2026-08',
    'Semana Gamer: Switch e PS5 com Vivo Total',
    '## Nintendo
• Nintendo Switch OLED — de R$ 2.499 por R$ 1.999
• Nintendo Switch 2 — de R$ 4.499 por R$ 3.999

## PS5 com Vivo Total
• PRO (R$ 200 OFF) — PS5 Digital R$ 3.899 | PS5 Disk R$ 4.399
• ULTRA, FAM 2 e FAM 3 (R$ 400 OFF) — PS5 Digital R$ 3.699 | PS5 Disk R$ 4.199
• FAM 4, FAM 5 e Segmento V (R$ 800 OFF) — PS5 Digital R$ 3.299 | PS5 Disk R$ 3.799

! Valores-base exibidos na campanha: PS5 Digital R$ 4.099 e PS5 Disk R$ 4.599.',
    'promotion',
    '11 a 31/08/2026',
    '/news/semana-gamer-2026-08.jpeg',
    'Campanha Semana Gamer com ofertas de Nintendo Switch e PlayStation 5 no Vivo Total.',
    1,
    '2026-08-06T17:50:00.000Z',
    '2026-08-06T17:50:00.000Z'
  ),
  (
    'campaign-accessories-2026-08',
    'Campanhas de agosto: alças e capas',
    '## Alça i2GO
• Cordão para smartphone — de R$ 69 por R$ 65,55
• Benefícios — mãos livres, ajuste de 0,80 m a 1,60 m e compatibilidade universal
• Cores — preto com branco, dourado e preto com cinza

## Capas avulsas
• iPhone 16 Plus, 16 Pro, 16 Pro Max, 16e; Galaxy S25+, S25 Ultra; modelos anteriores ao iPhone 15 e Galaxy S23 — R$ 49
• iPhone 16 e Galaxy S25 — R$ 99
• iPhone 17 Pro e 17 Pro Max — R$ 129

## Smartphone + capa na Compra Combinada
• Capas para iPhone 16 ou Galaxy S25 — de R$ 99 por R$ 49
• Capas para iPhone 17 Pro — de R$ 129 por R$ 99

! Na compra combinada, adicione o smartphone e a capa ao carrinho no Vivo+; o desconto é aplicado automaticamente. O desconto não é válido para vendas com Vivo Renova realizadas via SAP. Confira os SKUs no Portal Vivo Ligado. Ofertas sujeitas à disponibilidade de estoque.',
    'promotion',
    'Campanha de agosto',
    '/news/campanhas-acessorios-2026-08.jpeg',
    'Campanhas de agosto com cordão i2GO e ofertas de capas avulsas ou combinadas com smartphones.',
    1,
    '2026-08-06T17:49:00.000Z',
    '2026-08-06T17:49:00.000Z'
  ),
  (
    'campaign-samsung-bundle-2026-08',
    'Bundle Samsung: wearables e Galaxy Buds',
    '## Galaxy S26 Ultra, Galaxy S25 Ultra e Galaxy Z Fold7
• Galaxy Ring — R$ 699
• Galaxy Watch8 BT 40 mm/44 mm — R$ 599
• Galaxy Watch8 LTE 40 mm/44 mm — R$ 799
• Galaxy Watch Ultra LTE 47 mm — R$ 1.499
• Galaxy Watch Ultra 2025 LTE 47 mm — R$ 1.499
• Galaxy Watch8 Classic LTE 46 mm — R$ 1.499
• Galaxy Buds4 — R$ 599
• Galaxy Buds4 Pro — R$ 799

## Galaxy S26+, Galaxy S26, Galaxy S25+, Galaxy S25 e Galaxy Z Flip7
• Galaxy Watch8 BT 40 mm/44 mm — R$ 599
• Galaxy Watch8 LTE 40 mm/44 mm — R$ 799
• Galaxy Buds4 — R$ 599
• Galaxy Buds4 Pro — R$ 799',
    'promotion',
    'Até 10/08/2026',
    '/news/bundle-samsung-2026-08.jpeg',
    'Bundle Samsung com celulares elegíveis e preços de relógios, Galaxy Ring e Galaxy Buds.',
    1,
    '2026-08-06T17:48:00.000Z',
    '2026-08-06T17:48:00.000Z'
  ),
  (
    'campaign-motorola-bundle-2026-08',
    'Bundle Motorola: acessórios com 15% OFF',
    '## moto g, edge 40, edge 50, edge 60 e edge 70 fusion
• moto buds — R$ 99
• moto buds bass — R$ 99
• moto buds+ sound by Bose — R$ 299
• moto watch fit — R$ 399
• moto buds loop sound by Bose — R$ 499

## edge 70, edge 70 swarovski, signature, razr e razr fold
• moto buds loop sound by Bose — R$ 299
• moto watch — R$ 499
• moto buds loop swarovski sound by Bose — R$ 499
• moto sound flow by Bose — R$ 999

! A segunda seleção também contempla o motorola razr fold – FIFA World Cup 26™ Collection. A arte identifica 15% de desconto nos acessórios participantes.',
    'promotion',
    'Até 10/08/2026',
    '/news/bundle-motorola-2026-08.jpeg',
    'Bundle Motorola com celulares elegíveis e acessórios selecionados com 15% de desconto.',
    1,
    '2026-08-06T17:47:00.000Z',
    '2026-08-06T17:47:00.000Z'
  ),
  (
    'campaign-apple-bundle-2026-08',
    'Bundle Apple: acessórios com preço especial',
    '## Elegibilidade
iPhones das famílias 14, 15, 16, 16e, 17, 17e e Air.

## Acessórios participantes
• AirPods 4 — R$ 799
• AirPods 4 com Cancelamento Ativo de Ruído — R$ 1.199
• AirPods Pro 3 — R$ 1.699
• Apple Watch SE 3 GPS 40 mm — R$ 1.699
• Apple Watch SE 3 GPS 44 mm — R$ 1.899',
    'promotion',
    'Bundle vigente',
    '/news/bundle-apple-2026-08.jpeg',
    'Bundle Apple com iPhones elegíveis e preços de AirPods e Apple Watch.',
    1,
    '2026-08-06T17:46:00.000Z',
    '2026-08-06T17:46:00.000Z'
  );
