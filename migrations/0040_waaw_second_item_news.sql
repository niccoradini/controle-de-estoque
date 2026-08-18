-- Ofertas WAAW de agosto de 2026: 30% de desconto no segundo item elegível.

INSERT INTO news_items
  (id, title, body, category, validity_label, image_path, image_alt, active, created_at, updated_at)
VALUES
  (
    'campaign-waaw-caixas-segundo-item-2026-08',
    'WAAW: 30% OFF na segunda caixa de som',
    '## Benefício
• Na compra de uma caixa de som WAAW, o cliente recebe 30% de desconto na compra da segunda caixa elegível.

## Caixas de som elegíveis
• WAAW ME 100SB
• WAAW US 200SB DUO
• WAAW BOOM 200
• WAAW ME 110

! Oferta válida de 04 a 31/08/2026, sujeita à disponibilidade e a alterações sem aviso prévio. Desconto aplicado na compra do segundo produto elegível.',
    'promotion',
    '04 a 31/08/2026',
    '/news/waaw-caixas-30-segundo-2026-08.jpeg',
    'Oferta WAAW com 30% de desconto na compra da segunda caixa de som elegível.',
    1,
    '2026-08-18T12:00:00.000Z',
    '2026-08-18T12:00:00.000Z'
  ),
  (
    'campaign-waaw-fones-segundo-item-2026-08',
    'WAAW: 30% OFF no segundo fone',
    '## Benefício
• Na compra de um fone de ouvido WAAW, o cliente recebe 30% de desconto na compra do segundo fone elegível.

## Fones elegíveis
• WAAW Mob 100EB
• WAAW Mob 500 ANC
• WAAW Sense 210

! Oferta válida de 04 a 31/08/2026, sujeita à disponibilidade e a alterações sem aviso prévio. Desconto aplicado na compra do segundo produto elegível.',
    'promotion',
    '04 a 31/08/2026',
    '/news/waaw-fones-30-segundo-2026-08.jpeg',
    'Oferta WAAW com 30% de desconto na compra do segundo fone de ouvido elegível.',
    1,
    '2026-08-18T12:01:00.000Z',
    '2026-08-18T12:01:00.000Z'
  );

CREATE TABLE _migration_0040_news_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);

INSERT INTO _migration_0040_news_guard (valid)
SELECT CASE
  WHEN COUNT(*) = 2
   AND SUM(active) = 2
   AND MIN(validity_label) = '04 a 31/08/2026'
   AND MAX(validity_label) = '04 a 31/08/2026'
  THEN 1 ELSE 0
END
FROM news_items
WHERE id IN (
  'campaign-waaw-caixas-segundo-item-2026-08',
  'campaign-waaw-fones-segundo-item-2026-08'
);

DROP TABLE _migration_0040_news_guard;
