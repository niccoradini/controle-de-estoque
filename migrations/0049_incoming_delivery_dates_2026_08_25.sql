PRAGMA foreign_keys = ON;

-- A data "Modificado em" representa quando cada unidade foi colocada em entrega.
ALTER TABLE incoming_inventory_serials ADD COLUMN delivery_started_on TEXT NOT NULL DEFAULT '';

UPDATE incoming_inventory_serials
SET delivery_started_on = '2025-12-16'
WHERE serial_number = '220181370044450';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-24'
WHERE serial_number = '220213080040157';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-25'
WHERE serial_number = '220218380006668';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-25'
WHERE serial_number = '220218380006511';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-25'
WHERE serial_number = '220218380006539';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-25'
WHERE serial_number = '220218380007619';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-25'
WHERE serial_number = '220218050052076';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2025-11-05'
WHERE serial_number = '220228451003586';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-05-31'
WHERE serial_number = '220231691007770';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-04'
WHERE serial_number = '220232791017212';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-05-14'
WHERE serial_number = '220233171026001';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2025-10-31'
WHERE serial_number = '220233171018963';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2025-11-15'
WHERE serial_number = '220233181003475';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-03-14'
WHERE serial_number = '220233191065773';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-10'
WHERE serial_number = '220233860261174';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2025-11-11'
WHERE serial_number = '220233870003442';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-24'
WHERE serial_number = '220233880142072';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-24'
WHERE serial_number = '220233880142070';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-24'
WHERE serial_number = '220233880142071';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-10'
WHERE serial_number = '220233880142074';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070266';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070271';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070263';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070264';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070265';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070251';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070252';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070253';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070254';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070255';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070256';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070257';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070258';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070259';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070260';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070261';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070262';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070267';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070268';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070269';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070270';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070272';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070273';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070274';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220233880070275';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-12'
WHERE serial_number = '220234260005681';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2025-10-29'
WHERE serial_number = '220234350002403';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2025-10-31'
WHERE serial_number = '220235600000892';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2025-11-13'
WHERE serial_number = '220235620000418';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-24'
WHERE serial_number = '220236471006847';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-04-09'
WHERE serial_number = '220236541001663';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-10'
WHERE serial_number = '220236551001353';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-24'
WHERE serial_number = '220236561000666';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-24'
WHERE serial_number = '220237360000204';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-01-07'
WHERE serial_number = '220237390000526';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-14'
WHERE serial_number = '22023745103119';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-25'
WHERE serial_number = '22023746100877';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-25'
WHERE serial_number = '22023746100900';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-24'
WHERE serial_number = '220237681000897';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-06-29'
WHERE serial_number = '220238250002281';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-07'
WHERE serial_number = '220238810010537';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-06-25'
WHERE serial_number = '22023921103592';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-22'
WHERE serial_number = '220241790002844';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '220245731003057';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-10'
WHERE serial_number = '220246341001586';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-03-06'
WHERE serial_number = '220246361001265';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-07'
WHERE serial_number = '220248041005868';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-06-18'
WHERE serial_number = '220250140002755';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-19'
WHERE serial_number = '359867884955724';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-09'
WHERE serial_number = '357205926196035';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '358122183834696';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '358840225960274';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-24'
WHERE serial_number = '358840224840675';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-05-19'
WHERE serial_number = '351008263818229';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-06-15'
WHERE serial_number = '354687610563278';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '357746906401648';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '350629706490630';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-07'
WHERE serial_number = '352923950727393';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-06-25'
WHERE serial_number = '354640971069591';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-14'
WHERE serial_number = '357884917917193';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-06-25'
WHERE serial_number = '358680815360489';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-19'
WHERE serial_number = '353313820597748';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-19'
WHERE serial_number = '353855580003168';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-20'
WHERE serial_number = '552355269009381613';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-04'
WHERE serial_number = '552355269008950350';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-07-04'
WHERE serial_number = '552355269008645117';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-18'
WHERE serial_number = '552355469004340966';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-21'
WHERE serial_number = '552355469004340602';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-25'
WHERE serial_number = '551097471086733428';
UPDATE incoming_inventory_serials
SET delivery_started_on = '2026-08-06'
WHERE serial_number = '551097471075248420';

CREATE TABLE _migration_0049_guard (valid INTEGER NOT NULL CHECK (valid = 1));
INSERT INTO _migration_0049_guard (valid)
SELECT CASE WHEN (SELECT COUNT(*) FROM incoming_inventory_serials) = 90
  AND (SELECT COUNT(*) FROM incoming_inventory_serials WHERE delivery_started_on GLOB '????-??-??') = 90
  THEN 1 ELSE 0 END;
DROP TABLE _migration_0049_guard;
