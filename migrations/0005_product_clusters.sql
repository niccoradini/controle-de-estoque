PRAGMA foreign_keys = ON;

-- Separa os materiais em grupos comerciais sem alterar saldos, pedidos ou usuários.
ALTER TABLE products ADD COLUMN cluster TEXT NOT NULL DEFAULT 'misc'
  CHECK (cluster IN (
    'devices', 'cases', 'screen_protectors', 'speakers', 'notebooks',
    'tvs', 'chargers', 'cables', 'misc'
  ));

UPDATE products
SET cluster = CASE
  WHEN category = 'case' THEN 'cases'
  WHEN category = 'screen_protector' THEN 'screen_protectors'
  WHEN UPPER(COALESCE(display_name, name)) LIKE '%NOTEBOOK%' THEN 'notebooks'
  WHEN UPPER(COALESCE(display_name, name)) LIKE 'SAMSUNG SMART TV %' THEN 'tvs'
  WHEN UPPER(COALESCE(display_name, name)) LIKE '%CAIXA SOM%'
    OR UPPER(COALESCE(display_name, name)) LIKE '%CAIXA AMPLIF%'
    OR UPPER(COALESCE(display_name, name)) LIKE '%SPEAKER%' THEN 'speakers'
  WHEN UPPER(COALESCE(display_name, name)) LIKE '%CARREGADOR%'
    OR UPPER(COALESCE(display_name, name)) LIKE '%POWERBANK%'
    OR UPPER(COALESCE(display_name, name)) LIKE '%POWER BANK%' THEN 'chargers'
  WHEN UPPER(COALESCE(display_name, name)) LIKE '%CABO%' THEN 'cables'
  WHEN category = 'phone'
    OR UPPER(COALESCE(display_name, name)) LIKE '%SMARTWATCH%' THEN 'devices'
  ELSE 'misc'
END;

CREATE INDEX idx_products_cluster ON products(cluster, active, sort_order);
