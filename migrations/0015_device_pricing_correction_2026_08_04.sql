PRAGMA foreign_keys = ON;

-- Correção após conferência integral de 42 aparelhos em todos os planos
-- exibidos pelo Simulador Produtos em 04/08/2026.
-- Foram validados 378 preços (42 modelos x 9 categorias com valor).

INSERT OR REPLACE INTO device_price_values (price_key, category, price_cents)
VALUES
  ('iphone 13 256gb', 'PRÉ', 359900),
  ('iphone 13 256gb', 'CONTROLE BTL', 359900),
  ('iphone 15 256gb', 'PRÉ', 479900),
  ('iphone 15 256gb', 'CONTROLE BTL', 479900);

INSERT OR REPLACE INTO system_state (key, value) VALUES
  ('pricing_audit_date', '2026-08-04'),
  ('pricing_audit_model_count', '42'),
  ('pricing_audit_value_count', '378'),
  ('pricing_correction_version', '5.5.0');
