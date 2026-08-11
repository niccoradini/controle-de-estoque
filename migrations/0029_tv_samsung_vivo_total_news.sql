-- Campanha TV Samsung + Vivo Total recebida em 11/08/2026.
-- Cada arte vira uma publicação independente para manter a leitura confortável
-- no celular e permitir que o gerente oculte ou republique cada faixa de TVs.

INSERT INTO news_items
  (id, title, body, category, validity_label, image_path, image_alt, active, created_at, updated_at)
VALUES
  (
    'campaign-tv-samsung-vivo-total-32-50-2026-08',
    'TV Samsung + Vivo Total: modelos de 32”, 43” e 50”',
    '## Ofertas
• Samsung Smart TV 32” HD H5000F — de R$ 1.199 por R$ 999 (R$ 200 OFF)
• Samsung Smart TV 43” Crystal UHD 4K U8600F — de R$ 2.199 por R$ 1.699 (R$ 500 OFF)
• Samsung Smart TV 50” Vision AI QLED 4K QEF1 ou Q7F — de R$ 2.799 por R$ 2.299 (R$ 500 OFF)

## Procedimento para venda
• Com estoque na loja — seguir com a venda via Vivo+
• Sem estoque na loja — seguir com a venda via Prateleira Infinita

! Oferta válida para Vivo Família Especial, Vivo Total e Segmento V. Sujeita à disponibilidade e a alterações sem aviso prévio. Consulte o Portal Conteúdos Vivo para mais informações.',
    'promotion',
    '11 a 17/08/2026',
    '/news/tv-samsung-vivo-total-32-43-50-2026-08.jpg',
    'Campanha TV Samsung mais Vivo Total com ofertas das Smart TVs Samsung de 32, 43 e 50 polegadas.',
    1,
    '2026-08-11T14:59:00.000Z',
    '2026-08-11T14:59:00.000Z'
  ),
  (
    'campaign-tv-samsung-vivo-total-55-98-2026-08',
    'TV Samsung + Vivo Total: The Frame 55” e Super Big 98”',
    '## Ofertas
• Samsung Smart TV 55” Vision AI The Frame 4K LS03F — de R$ 4.199 por R$ 3.399 (R$ 800 OFF)
• Samsung Smart TV 98” Super Big Crystal 4K 98DU900 2024 — de R$ 15.999 por R$ 14.599 (R$ 1.400 OFF)

## Procedimento para venda
• Com estoque na loja — seguir com a venda via Vivo+
• Sem estoque na loja — seguir com a venda via Prateleira Infinita

! Oferta válida para Vivo Família Especial, Vivo Total e Segmento V. Sujeita à disponibilidade e a alterações sem aviso prévio. Consulte o Portal Conteúdos Vivo para mais informações.',
    'promotion',
    '11 a 17/08/2026',
    '/news/tv-samsung-vivo-total-55-98-2026-08.jpg',
    'Campanha TV Samsung mais Vivo Total com ofertas da The Frame de 55 polegadas e Super Big Crystal de 98 polegadas.',
    1,
    '2026-08-11T15:00:00.000Z',
    '2026-08-11T15:00:00.000Z'
  );

CREATE TABLE _migration_0029_news_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);

INSERT INTO _migration_0029_news_guard (valid)
SELECT CASE
  WHEN COUNT(*) = 2
   AND SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) = 2
  THEN 1 ELSE 0
END
FROM news_items
WHERE id IN (
  'campaign-tv-samsung-vivo-total-32-50-2026-08',
  'campaign-tv-samsung-vivo-total-55-98-2026-08'
);

DROP TABLE _migration_0029_news_guard;
