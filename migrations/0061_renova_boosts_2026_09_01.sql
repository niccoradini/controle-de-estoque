-- Tabela Boost Vivo Renova conferida em 01/09/2026.
-- A planilha ASSURANT permanece com 1.042 aparelhos e valores idênticos à tabela de 04/08/2026.

UPDATE renova_manufacturer_boosts
SET ends_on = '2026-09-14',
    source = 'Tabela Boost Vivo Renova 01/09/2026'
WHERE manufacturer = 'Apple';

UPDATE renova_manufacturer_boosts
SET ends_on = '2026-09-08',
    source = 'Tabela Boost Vivo Renova 01/09/2026'
WHERE manufacturer = 'Samsung';

UPDATE renova_manufacturer_boosts
SET ends_on = '2026-09-14',
    source = 'Tabela Boost Vivo Renova 01/09/2026'
WHERE manufacturer = 'Motorola';

UPDATE renova_manufacturer_boosts
SET ends_on = CASE
      WHEN match_key = 'JOVIV70512GB' THEN '2026-09-14'
      ELSE '2026-09-30'
    END,
    source = 'Tabela Boost Vivo Renova 01/09/2026'
WHERE manufacturer = 'JOVI';

INSERT OR REPLACE INTO system_state (key, value) VALUES
  ('renova_voucher_table_date', '2026-08-04'),
  ('renova_voucher_source', 'Planilha ASSURANT conferida em 01/09/2026'),
  ('renova_boost_table_date', '2026-09-01'),
  ('renova_boost_source', 'Tabela Boost Vivo Renova 01/09/2026');

CREATE TABLE _migration_0061_guard (valid INTEGER NOT NULL CHECK (valid = 1));
INSERT INTO _migration_0061_guard (valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM renova_trade_in_values WHERE active = 1) = 1042
  AND (SELECT COUNT(*) FROM renova_manufacturer_boosts WHERE active = 1) = 74
  AND (SELECT COUNT(*) FROM renova_manufacturer_boosts WHERE manufacturer = 'Apple' AND ends_on = '2026-09-14') = 31
  AND (SELECT COUNT(*) FROM renova_manufacturer_boosts WHERE manufacturer = 'Samsung' AND ends_on = '2026-09-08') = 30
  AND (SELECT COUNT(*) FROM renova_manufacturer_boosts WHERE manufacturer = 'Motorola' AND ends_on = '2026-09-14') = 10
  AND (SELECT COUNT(*) FROM renova_manufacturer_boosts WHERE manufacturer = 'JOVI' AND ends_on IN ('2026-09-14', '2026-09-30')) = 3
  THEN 1 ELSE 0 END;
DROP TABLE _migration_0061_guard;
