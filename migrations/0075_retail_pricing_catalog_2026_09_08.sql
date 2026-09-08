-- Eletrônicos disponíveis na loja conferidos individualmente no
-- Gramcell · Catálogo e Etiquetas em 08/09/2026.
-- Capas, películas, cabos e carregadores não aparecem nesse catálogo
-- os preços já cadastrados desses grupos foram preservados

UPDATE product_retail_prices
SET price_cents = CASE material_code
      WHEN '22024435' THEN 24900   -- Moto Buds Bass
      WHEN '22024486' THEN 199900  -- Nintendo Switch OLED + Mario Bros Wonder
      WHEN '22020879' THEN 59900   -- Aspirador Robô Smart Positivo
      WHEN '22023324' THEN 16900   -- Balança Go Balance
      WHEN '22023321' THEN 28900   -- Mini Deep Therapy azul
      WHEN '22023569' THEN 28900   -- Mini Deep Therapy cinza
      WHEN '22022496' THEN 249900  -- Samsung The Freestyle 2ª Geração
      WHEN '22023416' THEN 39900   -- Repetidor Vivo Wi-Fi 6 branco
      WHEN '22023005' THEN 18900   -- WAAW Sense 210
      WHEN '22021805' THEN 64900   -- Amazon Echo Dot 5ª Geração
      WHEN '22023745' THEN 129900  -- Samsung TV H5000F 32"
      WHEN '22023746' THEN 259900  -- Samsung TV U8600F 43"
      ELSE price_cents
    END,
    table_date = '2026-09-08',
    source_label = 'Gramcell · Catálogo e Etiquetas'
WHERE material_code IN (
  '22024435', '22024486', '22020879', '22023324', '22023321', '22023569',
  '22022496', '22023416', '22023005', '22021805', '22023745', '22023746'
);

INSERT OR REPLACE INTO system_state (key, value) VALUES
  ('retail_pricing_last_catalog_verification_date', '2026-09-08'),
  ('retail_pricing_last_catalog_verification_source', 'Gramcell · Catálogo e Etiquetas'),
  ('retail_pricing_last_catalog_verified_materials', '12'),
  ('retail_pricing_catalog_missing_materials', '10'),
  ('retail_pricing_catalog_note', 'Eletrônicos encontrados foram atualizados. Dez itens novos e os grupos de capas, películas, cabos e carregadores não constavam no catálogo oficial consultado; nenhum preço foi estimado.');
