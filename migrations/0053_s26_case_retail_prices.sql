PRAGMA foreign_keys = ON;

-- Completa os preços da família S26 que entrou no inventário após a última
-- carga de preços. Os valores seguem as referências Ovvi já validadas no
-- catálogo de varejo do sistema.
INSERT INTO product_retail_prices
  (material_code, display_name, cluster, price_cents, price_kind, table_date, source_label, reference_name)
SELECT
  variant.sku,
  product.name,
  'cases',
  CASE
    WHEN product.name LIKE '%FLEX ECO%' THEN 12900
    WHEN product.name LIKE '%HOLO%' THEN 21900
    WHEN product.name LIKE '%TEXTURIZADA%' THEN 23900
    WHEN product.name LIKE '%TECIDO%' THEN 23900
    WHEN product.name LIKE '%SILICONE%' THEN 19900
    WHEN product.name LIKE '%TRANSPARENTE%' THEN 19900
  END,
  'reference',
  '2026-08-26',
  'Gramcell · referência equivalente do Simulador Produtos',
  product.name
FROM product_variants variant
JOIN products product ON product.id = variant.product_id
WHERE product.cluster = 'cases'
  AND product.name LIKE '%S26%'
  AND variant.sku IS NOT NULL
  AND (
    product.name LIKE '%FLEX ECO%'
    OR product.name LIKE '%HOLO%'
    OR product.name LIKE '%TEXTURIZADA%'
    OR product.name LIKE '%TECIDO%'
    OR product.name LIKE '%SILICONE%'
    OR product.name LIKE '%TRANSPARENTE%'
  )
ON CONFLICT(material_code) DO UPDATE SET
  display_name = excluded.display_name,
  cluster = excluded.cluster,
  price_cents = excluded.price_cents,
  price_kind = excluded.price_kind,
  table_date = excluded.table_date,
  source_label = excluded.source_label,
  reference_name = excluded.reference_name;

