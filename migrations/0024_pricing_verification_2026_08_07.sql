PRAGMA foreign_keys = ON;

-- Conferência feita no Simulador Produtos em 07/08/2026.
-- A página informou "Tabela de produtos: 06/08/2026".
-- Os três acessórios novos do estoque não aparecem no simulador, que nesta
-- tela pesquisa apenas smartphones, e por isso continuam sem preço liberado.

INSERT INTO device_price_profiles
  (price_key, display_name, brand, listed_from_cents, table_date, source_label)
VALUES
  ('motorola moto g67 5g 128gb', 'Motorola Moto G67 5G 128GB', 'Motorola', 108900,
   '2026-08-06', 'Gramcell · Simulador Produtos · conferido em 07/08/2026')
ON CONFLICT(price_key) DO UPDATE SET
  display_name = excluded.display_name,
  brand = excluded.brand,
  listed_from_cents = excluded.listed_from_cents,
  table_date = excluded.table_date,
  source_label = excluded.source_label;

INSERT INTO device_price_values (price_key, category, price_cents)
VALUES
  ('motorola moto g67 5g 128gb', 'PRÉ', 129900),
  ('motorola moto g67 5g 128gb', 'CONTROLE BTL', 129900),
  ('motorola moto g67 5g 128gb', 'CONTROLE ENTRADA', 126900),
  ('motorola moto g67 5g 128gb', 'CONTROLE ALTO VALOR', 123900),
  ('motorola moto g67 5g 128gb', 'PÓS INDIVIDUAL', 120900),
  ('motorola moto g67 5g 128gb', 'FAMILIA 2', 117900),
  ('motorola moto g67 5g 128gb', 'FAMILIA 3', 114900),
  ('motorola moto g67 5g 128gb', 'FAMILIA 4/5', 111900),
  ('motorola moto g67 5g 128gb', 'VIVO V', 108900)
ON CONFLICT(price_key, category) DO UPDATE SET
  price_cents = excluded.price_cents;

INSERT OR IGNORE INTO device_price_match_rules (price_key, match_pattern, priority)
VALUES ('motorola moto g67 5g 128gb', '%MOTO G67 128GB%', 100);

INSERT INTO system_state (key, value)
VALUES
  ('pricing_last_verification_date', '2026-08-07'),
  ('pricing_last_verification_scope', 'Motorola Moto G67 5G 128GB'),
  ('pricing_last_verification_source_table_date', '2026-08-06')
ON CONFLICT(key) DO UPDATE SET value = excluded.value;
