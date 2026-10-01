"""Generate the one-time D1 migration from the supplied 209H workbook.

Run locally with: python scripts/build_inventory_2026_09_30.py /path/to/209h.30.09.xlsx
The workbook is intentionally not committed to the repository.
"""

from collections import Counter
from pathlib import Path
import sys

import openpyxl


SOURCE_NAME = "209h.30.09.xlsx"
SNAPSHOT_DATE = "2026-09-30"
OUTPUT = Path(__file__).resolve().parents[1] / "migrations/0108_inventory_refresh_2026_09_30.sql"


def sql(value):
    return "'" + str(value).replace("'", "''") + "'"


def main(path):
    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    sheet = workbook.active
    headings = next(sheet.values)
    assert headings[:8] == (
        "Material", "Denominação", "Nº de série", "Centro", "Depósito",
        "Tipo de estoque", "Status sistema", "Modificado em",
    )
    rows = []
    for source_row, values in enumerate(sheet.values, start=1):
        if source_row == 1 or not values[0]:
            continue
        material, name, serial, center, deposit, stock_type, status, modified = values[:8]
        assert all(isinstance(value, str) and value.strip() for value in (material, name, serial, center, stock_type, status))
        assert center == "209H"
        assert deposit in (None, "", "LVUT", "EXPO", "LOJA", "RPAR")
        assert status in ("DEPS", "DEPS NREM", "LIDI", "LIDI NREM")
        rows.append((material.strip(), name.strip(), serial.strip(), center, deposit or "", stock_type, status, source_row,
                     modified.strftime("%Y-%m-%d") if modified else ""))
    assert len(rows) == 1356
    assert len({row[2].upper() for row in rows}) == len(rows)
    available = [row for row in rows if row[6] == "DEPS" and row[4] in ("LVUT", "EXPO", "LOJA")]
    incoming = [row for row in rows if row[6] == "DEPS NREM" and row[4] != "RPAR"]
    repair = [row for row in rows if row[4] == "RPAR"]
    assert (len(available), len(incoming), len(repair), len({row[0] for row in available + incoming})) == (1152, 86, 111, 317)
    assert Counter(row[6] for row in rows) == {"DEPS": 1261, "DEPS NREM": 88, "LIDI": 3, "LIDI NREM": 4}

    parts = [f"""PRAGMA foreign_keys = ON;

-- Fonte: {SOURCE_NAME}, loja 209H, snapshot {SNAPSHOT_DATE}.
-- Faz backup antes de atualizar o estoque. Preserva o histórico das contagens.
-- Não altera pedidos, usuários, chips vendidos ou ajustes já registrados.
CREATE TABLE _migration_0108_source (
  material_code TEXT NOT NULL, technical_name TEXT NOT NULL,
  serial_number TEXT PRIMARY KEY COLLATE NOCASE, center TEXT NOT NULL,
  deposit TEXT NOT NULL, stock_type TEXT NOT NULL, system_status TEXT NOT NULL,
  source_row INTEGER NOT NULL, modified_on TEXT NOT NULL
);
"""]
    for start in range(0, len(rows), 150):
        batch = rows[start:start + 150]
        parts.append("INSERT INTO _migration_0108_source VALUES\n  " + ",\n  ".join(
            "(" + ", ".join(sql(value) if index != 7 else str(value) for index, value in enumerate(row)) + ")"
            for row in batch
        ) + ";\n")

    parts.append(f"""
CREATE TABLE _migration_0108_guard (valid INTEGER NOT NULL CHECK (valid = 1));
INSERT INTO _migration_0108_guard VALUES (
  CASE WHEN (SELECT COUNT(*) FROM _migration_0108_source) = 1356
    AND (SELECT COUNT(*) FROM _migration_0108_source
         WHERE system_status='DEPS' AND deposit IN ('LVUT','EXPO','LOJA')) = 1152
    AND (SELECT COUNT(*) FROM _migration_0108_source
         WHERE system_status='DEPS NREM' AND deposit<>'RPAR') = 86
    AND (SELECT COUNT(*) FROM _migration_0108_source WHERE deposit='RPAR') = 111
    AND (SELECT COUNT(*) FROM active_quantity_reservations) = 0
  THEN 1 ELSE 0 END
);
DROP TABLE _migration_0108_guard;

-- As cópias não aparecem na aplicação e permitem a reversão manual exata.
CREATE TABLE inventory_backup_20260930_variants AS SELECT * FROM product_variants;
CREATE TABLE inventory_backup_20260930_products AS SELECT * FROM products;
CREATE TABLE inventory_backup_20260930_serials AS SELECT * FROM inventory_serials;
CREATE TABLE inventory_backup_20260930_incoming AS SELECT * FROM incoming_inventory;
CREATE TABLE inventory_backup_20260930_incoming_serials AS SELECT * FROM incoming_inventory_serials;
CREATE TABLE inventory_backup_20260930_repairs AS SELECT * FROM repair_inventory;
CREATE TABLE _migration_0108_products AS
SELECT material_code, MAX(technical_name) AS technical_name,
       SUM(CASE WHEN system_status='DEPS' AND deposit IN ('LVUT','EXPO','LOJA') THEN 1 ELSE 0 END) AS available_quantity,
       SUM(CASE WHEN system_status='DEPS NREM' AND deposit<>'RPAR' THEN 1 ELSE 0 END) AS incoming_quantity,
       MIN(source_row) AS source_order
FROM _migration_0108_source
WHERE (system_status='DEPS' AND deposit IN ('LVUT','EXPO','LOJA'))
   OR (system_status='DEPS NREM' AND deposit<>'RPAR')
GROUP BY material_code;

-- Materiais ainda não cadastrados recebem metadados novos.
-- Os nomes exibidos vêm literalmente da coluna Denominação da planilha.
INSERT INTO products
  (name,display_name,technical_name,brand,category,cluster,
   option1_label,option2_label,option3_label,presets_json,active,sort_order)
SELECT p.technical_name || ' · ' || p.material_code,
       p.technical_name, p.technical_name,
       CASE WHEN p.technical_name LIKE 'SSG %' OR p.material_code LIKE 'TGSA%' THEN 'Samsung'
            WHEN p.technical_name LIKE 'OVVI %' THEN 'Ovvi' ELSE 'Outros' END,
       CASE WHEN p.material_code GLOB 'TG*' OR p.material_code GLOB 'DG*' OR p.material_code GLOB 'BG*'
            THEN 'phone' ELSE 'accessory' END,
       CASE WHEN p.material_code GLOB 'TG*' OR p.material_code GLOB 'DG*' OR p.material_code GLOB 'BG*' THEN 'devices'
            WHEN p.technical_name LIKE '% CP %' OR p.technical_name LIKE '%CAPA%' THEN 'cases'
            ELSE 'misc' END,
       '', '', '', '{{}}', 1,
       (SELECT COALESCE(MAX(sort_order),0) FROM products) + ROW_NUMBER() OVER (ORDER BY p.source_order)
FROM _migration_0108_products p
WHERE NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku=p.material_code COLLATE NOCASE);

INSERT INTO product_variants
  (product_id,option1_value,option2_value,option3_value,sku,stock_mode,
   quantity_on_hand,active,serial_tracking)
SELECT product.id, '', '', '', p.material_code, 'quantity', 0, 1, 1
FROM _migration_0108_products p
JOIN products product ON product.name=p.technical_name || ' · ' || p.material_code COLLATE NOCASE
WHERE NOT EXISTS (SELECT 1 FROM product_variants v WHERE v.sku=p.material_code COLLATE NOCASE);

UPDATE product_variants
SET active=1, serial_tracking=1, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE EXISTS (SELECT 1 FROM _migration_0108_products p WHERE p.material_code=product_variants.sku COLLATE NOCASE);
UPDATE products SET active=1, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE EXISTS (SELECT 1 FROM product_variants v JOIN _migration_0108_products p
              ON p.material_code=v.sku COLLATE NOCASE WHERE v.product_id=products.id);

-- Movimentos posteriores à planilha permanecem protegidos pelas associações
-- de pedido e chip e pelo gatilho que impede saldo abaixo de reservas.
UPDATE inventory_serials
SET status='withdrawn', updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE status='available'
  AND NOT EXISTS (SELECT 1 FROM _migration_0108_source s
                  WHERE s.serial_number=inventory_serials.serial_number COLLATE NOCASE
                    AND s.system_status='DEPS' AND s.deposit IN ('LVUT','EXPO','LOJA'))
  AND NOT EXISTS (SELECT 1 FROM chips chip WHERE chip.inventory_serial_id=inventory_serials.id
                  AND chip.active=1 AND chip.status='available');

UPDATE inventory_serials
SET variant_id=(SELECT v.id FROM _migration_0108_source s JOIN product_variants v
                ON v.sku=s.material_code COLLATE NOCASE
                WHERE s.serial_number=inventory_serials.serial_number COLLATE NOCASE),
    status='available', updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE EXISTS (SELECT 1 FROM _migration_0108_source s
              WHERE s.serial_number=inventory_serials.serial_number COLLATE NOCASE
                AND s.system_status='DEPS' AND s.deposit IN ('LVUT','EXPO','LOJA'))
  AND NOT EXISTS (SELECT 1 FROM request_serial_assignments a WHERE a.serial_id=inventory_serials.id)
  AND NOT EXISTS (SELECT 1 FROM chips chip WHERE chip.inventory_serial_id=inventory_serials.id AND chip.status='sold');

INSERT INTO inventory_serials (variant_id,serial_number,status)
SELECT v.id,s.serial_number,'available'
FROM _migration_0108_source s JOIN product_variants v ON v.sku=s.material_code COLLATE NOCASE
WHERE s.system_status='DEPS' AND s.deposit IN ('LVUT','EXPO','LOJA')
  AND NOT EXISTS (SELECT 1 FROM inventory_serials i WHERE i.serial_number=s.serial_number COLLATE NOCASE);

UPDATE product_variants
SET quantity_on_hand=(SELECT COUNT(*) FROM inventory_serials i
                      WHERE i.variant_id=product_variants.id AND i.status='available'),
    updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE serial_tracking=1;

DELETE FROM incoming_inventory;
CREATE TABLE _migration_0108_incoming_totals AS
SELECT material_code, CASE WHEN deposit='' THEN '9' ELSE deposit END AS deposit, COUNT(*) AS quantity
FROM _migration_0108_source WHERE system_status='DEPS NREM' AND deposit<>'RPAR'
GROUP BY material_code, CASE WHEN deposit='' THEN '9' ELSE deposit END;
INSERT INTO incoming_inventory (variant_id,quantity,deposits_json)
SELECT v.id, SUM(t.quantity), json_group_object(t.deposit,t.quantity)
FROM _migration_0108_incoming_totals t JOIN product_variants v ON v.sku=t.material_code COLLATE NOCASE
GROUP BY v.id;

DELETE FROM incoming_inventory_serials;
INSERT INTO incoming_inventory_serials
  (serial_number,material_code,technical_name,center,deposit,stock_type,
   system_status,source_row,snapshot_date,source_file,delivery_started_on)
SELECT serial_number,material_code,technical_name,center,
       CASE WHEN deposit='' THEN '9' ELSE deposit END,
       stock_type,system_status,source_row,{sql(SNAPSHOT_DATE)},{sql(SOURCE_NAME)},modified_on
FROM _migration_0108_source WHERE system_status='DEPS NREM' AND deposit<>'RPAR';

DELETE FROM repair_inventory;
INSERT INTO repair_inventory
  (serial_number,material_code,technical_name,center,deposit,snapshot_date)
SELECT serial_number,material_code,technical_name,center,deposit,{sql(SNAPSHOT_DATE)}
FROM _migration_0108_source WHERE deposit='RPAR';

INSERT INTO system_state (key,value) VALUES
  ('inventory_snapshot_date',{sql(SNAPSHOT_DATE)}),
  ('inventory_snapshot_source',{sql(SOURCE_NAME)}),
  ('inventory_snapshot_excluded_depots','RPAR'),
  ('inventory_snapshot_incoming_depots','9,LVUT'),
  ('inventory_snapshot_incoming_units','86'),
  ('inventory_snapshot_available_depots','EXPO,LOJA,LVUT')
ON CONFLICT(key) DO UPDATE SET value=excluded.value;

INSERT INTO audit_logs (actor_user_id,action,entity_type,entity_id,details_json)
VALUES (NULL,'inventory.snapshot_imported','inventory_snapshot',{sql(SNAPSHOT_DATE)},
        '{{"source":"{SOURCE_NAME}","availableRows":1152,"incomingRows":86,"repairRows":111}}');

CREATE TABLE _migration_0108_final_guard (valid INTEGER NOT NULL CHECK (valid=1));
INSERT INTO _migration_0108_final_guard VALUES (
  CASE WHEN (SELECT COUNT(*) FROM _migration_0108_products)=317
    AND (SELECT COUNT(*) FROM incoming_inventory_serials)=86
    AND (SELECT COUNT(*) FROM repair_inventory)=111
  THEN 1 ELSE 0 END
);
DROP TABLE _migration_0108_final_guard;
DROP TABLE _migration_0108_incoming_totals;
DROP TABLE _migration_0108_products;
DROP TABLE _migration_0108_source;
""")
    OUTPUT.write_text("\n".join(parts), encoding="utf-8")
    print(OUTPUT, OUTPUT.stat().st_size, "bytes", "available", len(available), "incoming", len(incoming), "repair", len(repair))


if __name__ == "__main__":
    main(sys.argv[1])
