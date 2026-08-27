-- Preços-base conferidos no Simulador Produtos em 27/08/2026.
-- Os 47 perfis e 423 valores permanecem iguais à tabela de 25/08/2026.
UPDATE device_price_profiles
SET table_date = '2026-08-27',
    source_label = 'Gramcell · Simulador Produtos';

INSERT OR REPLACE INTO system_state (key, value) VALUES
  ('pricing_table_date', '2026-08-27'),
  ('pricing_table_source', 'Gramcell · Simulador Produtos'),
  ('pricing_profile_count', '47'),
  ('pricing_audit_value_count', '423'),
  ('pricing_last_verification_date', '2026-08-27'),
  ('pricing_last_verification_source_table_date', '2026-08-27');

-- Alterações da Tabela Boost Renova Agosto/2026, versão 25/08/2026.
UPDATE renova_manufacturer_boosts
SET bonus_cents = 120000,
    starts_on = '2026-08-25',
    ends_on = '2026-09-30',
    source = 'Tabela Boost Vivo Renova 25/08/2026'
WHERE match_key = 'JOVIX300ULTRA512GB';

UPDATE renova_manufacturer_boosts
SET device_name = 'JOVI X300 FE 256GB',
    bonus_cents = 60000,
    starts_on = '2026-08-25',
    ends_on = '2026-09-30',
    source = 'Tabela Boost Vivo Renova 25/08/2026'
WHERE match_key = 'JOVIX300FE256GB';
