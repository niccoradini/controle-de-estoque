PRAGMA foreign_keys = ON;

-- Preços dos novos produtos do estoque de 05/08/2026 conferidos no
-- Simulador Produtos, cuja tabela exibida estava datada de 04/08/2026.
-- Galaxy Z Flip8 e Z Fold8 ainda não estavam listados no simulador e,
-- por isso, permanecem sem preço em vez de receberem um valor estimado.

INSERT OR REPLACE INTO product_retail_prices
  (material_code, display_name, cluster, price_cents, price_kind,
   table_date, source_label, reference_name)
VALUES
  ('22025161', 'SAMSUNG WATCH 9 40MM 32GB BLUETOOTH GRAFITE', 'devices',
   299900, 'fixed', '2026-08-04', 'Gramcell · Simulador Produtos',
   'Galaxy Watch9 Bt 40 mm'),
  ('TGSA62254000', 'SAMSUNG WATCH 9 40MM 32GB LTE GRAFITE', 'devices',
   329900, 'fixed', '2026-08-04', 'Gramcell · Simulador Produtos',
   'Galaxy Watch9 LTE 40 mm'),
  ('YBSC001A4000', 'SIM CARD 5G 2/3/4FF AVULSO P69S MG', 'misc',
   0, 'no_charge', '2026-08-04', 'Gramcell · Simulador Produtos',
   'Chip Vivo — sem cobrança no pedido');

INSERT INTO system_state (key, value)
VALUES
  ('pricing_new_product_check_date', '2026-08-05'),
  ('pricing_new_product_table_date', '2026-08-04'),
  ('pricing_new_product_source', 'Gramcell · Simulador Produtos'),
  ('pricing_unavailable_material_codes', 'TGSA61762000,TGSA61962000'),
  ('pricing_unavailable_material_count', '2'),
  ('pricing_inventory_material_count', '293'),
  ('retail_pricing_material_count', '226'),
  ('pricing_inventory_coverage', '291')
ON CONFLICT(key) DO UPDATE SET value = excluded.value;
