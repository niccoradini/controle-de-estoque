import argparse
import datetime as dt
import json
import re
import unicodedata
from decimal import Decimal
from pathlib import Path

import openpyxl


BOOST_ROWS = """Apple\tiPhone 14 256GB\t400\t23/06/2026\t10/08/2026
Apple\tiPhone 15 256GB\t500\t23/06/2026\t10/08/2026
Apple\tiPhone 16 128GB\t400\t06/01/2026\t10/08/2026
Apple\tiPhone 16 256GB\t500\t23/06/2026\t10/08/2026
Apple\tiPhone 16 512GB\t400\t26/03/2026\t10/08/2026
Apple\tiPhone 16 Plus 128GB\t700\t02/09/2025\t10/08/2026
Apple\tiPhone 16 Plus 256GB\t700\t02/09/2025\t10/08/2026
Apple\tiPhone 16 Plus 512GB\t700\t26/03/2026\t10/08/2026
Apple\tiPhone 16 Pro 128GB\t700\t19/02/2026\t10/08/2026
Apple\tiPhone 16 Pro 256GB\t700\t19/02/2026\t10/08/2026
Apple\tiPhone 16 Pro 512GB\t700\t19/02/2026\t10/08/2026
Apple\tiPhone 16 Pro 1TB\t700\t26/03/2026\t10/08/2026
Apple\tiPhone 16 Pro Max 256GB\t800\t19/02/2026\t10/08/2026
Apple\tiPhone 16 Pro Max 512GB\t800\t19/02/2026\t10/08/2026
Apple\tiPhone 16 Pro Max 1TB\t800\t19/02/2026\t10/08/2026
Apple\tiPhone 16e 128GB\t500\t02/09/2025\t10/08/2026
Apple\tiPhone 16e 256GB\t500\t26/02/2026\t10/08/2026
Apple\tiPhone 17 256GB\t500\t18/09/2025\t10/08/2026
Apple\tiPhone 17 512GB\t500\t18/09/2025\t10/08/2026
Apple\tiPhone 17 Pro 1TB\t800\t23/06/2026\t10/08/2026
Apple\tiPhone 17 Pro 256GB\t500\t20/01/2026\t10/08/2026
Apple\tiPhone 17 Pro 512GB\t500\t20/01/2026\t10/08/2026
Apple\tiPhone 17 Pro Max 1TB\t800\t23/06/2026\t10/08/2026
Apple\tiPhone 17 Pro Max 256GB\t500\t20/01/2026\t10/08/2026
Apple\tiPhone 17 Pro Max 2TB\t800\t23/06/2026\t10/08/2026
Apple\tiPhone 17 Pro Max 512GB\t500\t20/01/2026\t10/08/2026
Apple\tiPhone 17e 256GB\t300\t13/03/2026\t10/08/2026
Apple\tiPhone 17e 512GB\t300\t13/03/2026\t10/08/2026
Apple\tiPhone Air 1TB\t800\t03/03/2026\t10/08/2026
Apple\tiPhone Air 256GB\t800\t03/03/2026\t10/08/2026
Apple\tiPhone Air 512GB\t800\t06/01/2026\t10/08/2026
Samsung\tSamsung Galaxy S25 256GB\t300\t31/03/2026\t17/08/2026
Samsung\tSamsung Galaxy S25 Edge 512GB\t300\t31/03/2026\t17/08/2026
Samsung\tSamsung Galaxy S25 Ultra 256GB\t300\t31/03/2026\t17/08/2026
Samsung\tSamsung Galaxy S25 Ultra 512GB\t300\t31/03/2026\t17/08/2026
Samsung\tSamsung Galaxy S25+ 256GB\t300\t31/03/2026\t17/08/2026
Samsung\tSamsung Galaxy S25+ 512GB\t300\t31/03/2026\t17/08/2026
Samsung\tSamsung Galaxy S26 Ultra 1TB\t800\t07/07/2026\t17/08/2026
Samsung\tSamsung Galaxy S26 Ultra 256GB\t1200\t07/07/2026\t17/08/2026
Samsung\tSamsung Galaxy S26 Ultra 512GB\t800\t07/07/2026\t17/08/2026
Samsung\tSamsung Galaxy S26 256GB\t400\t07/07/2026\t17/08/2026
Samsung\tSamsung Galaxy S26 512GB\t400\t07/07/2026\t17/08/2026
Samsung\tSamsung Galaxy S26+ 256GB\t700\t07/07/2026\t17/08/2026
Samsung\tSamsung Galaxy S26+ 512GB\t700\t07/07/2026\t17/08/2026
Samsung\tSamsung Galaxy Z Flip 7 256GB\t500\t07/07/2026\t17/08/2026
Samsung\tSamsung Galaxy Z Flip 7 512GB\t500\t07/07/2026\t17/08/2026
Samsung\tSamsung Galaxy Z Flip 7 FE 256GB\t500\t07/07/2026\t17/08/2026
Samsung\tSamsung Galaxy Z Fold 6 512GB\t300\t31/03/2026\t17/08/2026
Samsung\tSamsung Galaxy Z Fold 7 1TB\t500\t07/07/2026\t17/08/2026
Samsung\tSamsung Galaxy Z Fold 7 512GB\t700\t07/07/2026\t17/08/2026
Samsung\tSamsung Galaxy Z Fold 8 Ultra 1TB\t1000\t03/08/2026\t17/08/2026
Samsung\tSamsung Galaxy Z Fold 8 Ultra 512GB\t1000\t03/08/2026\t17/08/2026
Samsung\tSamsung Galaxy Z Fold 8 Ultra 256GB\t1000\t03/08/2026\t17/08/2026
Samsung\tSamsung Galaxy Z Fold 8 512GB\t1000\t03/08/2026\t17/08/2026
Samsung\tSamsung Galaxy Z Fold 8 256GB\t1000\t03/08/2026\t17/08/2026
Samsung\tSamsung Galaxy Z Flip 8 512GB\t1000\t03/08/2026\t17/08/2026
Samsung\tSamsung Galaxy Z Flip 8 256GB\t1000\t03/08/2026\t17/08/2026
Samsung\tSamsung Galaxy Z Flip 6 256GB\t300\t03/08/2026\t17/08/2026
Samsung\tSamsung Galaxy Z Flip 6 512GB\t300\t03/08/2026\t17/08/2026
Samsung\tSamsung Galaxy A37 5G 256GB\t100\t03/08/2026\t17/08/2026
Samsung\tSamsung Galaxy A57 5G 256GB\t200\t03/08/2026\t17/08/2026
Motorola\tMotorola Edge 70 512GB\t700\t02/07/2026\t10/08/2026
Motorola\tMotorola Edge 70 Swarovski 5G 512GB\t700\t02/07/2026\t10/08/2026
Motorola\tMotorola Razr 60 Swarovski 256GB\t500\t02/07/2026\t10/08/2026
Motorola\tMotorola Razr 60 Ultra 1TB\t1000\t03/03/2026\t10/08/2026
Motorola\tMotorola Signature 512GB\t1800\t21/07/2026\t10/08/2026
Motorola\tMotorola Razr Fold Fifa World Cup 26 1TB\t1800\t18/06/2026\t10/08/2026
Motorola\tMotorola Razr Fold 1TB\t2000\t02/07/2026\t10/08/2026
Motorola\tMotorola Razr 70 Ultra 512GB\t1000\t15/05/2026\t10/08/2026
Motorola\tMoto G Max 5G 256GB\t100\t14/07/2026\t10/08/2026
Motorola\tMotorola Moto G67 5G 128GB\t100\t14/07/2026\t10/08/2026
JOVI\tJOVI V70 5G 512GB\t500\t01/06/2026\t10/08/2026"""


def sql_text(value):
    return "'" + str(value).replace("'", "''") + "'"


def iso_date(value):
    if isinstance(value, (dt.date, dt.datetime)):
        return value.date().isoformat() if isinstance(value, dt.datetime) else value.isoformat()
    return dt.datetime.strptime(str(value).strip(), "%d/%m/%Y").date().isoformat()


def cents(value):
    amount = Decimal(str(value)) * 100
    if amount != amount.to_integral_value():
        raise ValueError(f"Valor monetário com fração de centavo: {value}")
    return int(amount)


def model_key(value):
    normalized = unicodedata.normalize("NFKD", str(value)).encode("ascii", "ignore").decode("ascii").upper()
    normalized = re.sub(r"\b5G\b", "", normalized)
    normalized = normalized.replace("+", " PLUS ")
    return re.sub(r"[^A-Z0-9]+", "", normalized)


def read_trade_ins(workbook_path):
    workbook = openpyxl.load_workbook(workbook_path, data_only=True, read_only=True)
    worksheet = workbook["SAP"]
    rows = []
    for row_number, values in enumerate(worksheet.iter_rows(values_only=True), start=1):
        if len(values) < 7:
            continue
        product_type, manufacturer, raw_model, good, defective, table_date = values[1:7]
        if not isinstance(raw_model, str) or not raw_model.strip().upper().startswith("ASSURANT "):
            continue
        source_key = re.sub(r"\s+", " ", raw_model.strip()).upper()
        device_name = source_key.removeprefix("ASSURANT ")
        row = {
            "sourceRow": row_number,
            "sourceKey": source_key,
            "name": device_name,
            "manufacturer": str(manufacturer or "").strip().upper(),
            "productType": str(product_type or "").strip().upper(),
            "goodCents": cents(good),
            "defectiveCents": cents(defective),
            "tableDate": iso_date(table_date),
        }
        if row["goodCents"] < row["defectiveCents"]:
            raise ValueError(f"Bom abaixo de defeituoso na linha {row_number}")
        rows.append(row)
    keys = [row["sourceKey"] for row in rows]
    if len(rows) != 1042 or len(keys) != len(set(keys)):
        raise ValueError(f"Esperados 1042 aparelhos ASSURANT únicos; encontrados {len(rows)} / {len(set(keys))}")
    dates = {row["tableDate"] for row in rows}
    if dates != {"2026-08-04"}:
        raise ValueError(f"Data inesperada na tabela ASSURANT: {sorted(dates)}")
    return rows


def read_boosts():
    rows = []
    for line in BOOST_ROWS.splitlines():
        manufacturer, device_name, amount, starts_on, ends_on = line.split("\t")
        if manufacturer in {"Apple", "Motorola", "JOVI"}:
            ends_on = "31/08/2026"
        if manufacturer == "Samsung":
            ends_on = "08/09/2026"
        if device_name == "Motorola Signature 512GB":
            amount = "1600"
        if device_name == "Samsung Galaxy Z Fold 6 512GB":
            amount = "400"
        rows.append({
            "manufacturer": manufacturer,
            "name": device_name,
            "matchKey": model_key(device_name),
            "bonusCents": cents(amount),
            "startsOn": iso_date(starts_on),
            "endsOn": iso_date(ends_on),
        })
    rows.extend([
        {
            "manufacturer": "JOVI", "name": "JOVI X300 Ultra 512GB",
            "matchKey": model_key("JOVI X300 Ultra 512GB"), "bonusCents": cents("1500"),
            "startsOn": iso_date("13/08/2026"), "endsOn": iso_date("31/08/2026"),
        },
        {
            "manufacturer": "JOVI", "name": "JOVI X300 FE 256GB",
            "matchKey": model_key("JOVI X300 FE 256GB"), "bonusCents": cents("700"),
            "startsOn": iso_date("13/08/2026"), "endsOn": iso_date("31/08/2026"),
        },
    ])
    keys = [row["matchKey"] for row in rows]
    if len(rows) != 74 or len(keys) != len(set(keys)):
        raise ValueError(f"Esperados 74 boosts únicos; encontrados {len(rows)} / {len(set(keys))}")
    return rows


def build_sql(trade_ins, boosts):
    trade_value_rows = [
        "  (" + ", ".join([
            sql_text(row["sourceKey"]), sql_text(row["name"]), sql_text(row["manufacturer"]),
            sql_text(row["productType"]), str(row["goodCents"]), str(row["defectiveCents"]),
            sql_text(row["tableDate"]), "1",
        ]) + ")"
        for row in trade_ins
    ]
    trade_insert_blocks = []
    for start in range(0, len(trade_value_rows), 100):
        values = ",\n".join(trade_value_rows[start:start + 100])
        trade_insert_blocks.append(f"""INSERT INTO renova_trade_in_values_20260804
  (source_key, device_name, manufacturer, product_type, good_cents, defective_cents, table_date, active)
VALUES
{values};""")
    trade_inserts = "\n\n".join(trade_insert_blocks)
    boost_values = ",\n".join(
        "  (" + ", ".join([
            sql_text(row["manufacturer"]), sql_text(row["name"]), sql_text(row["matchKey"]),
            str(row["bonusCents"]), sql_text(row["startsOn"]), sql_text(row["endsOn"]),
            sql_text("Tabela Boost Vivo Renova 05/08/2026"), "1",
        ]) + ")"
        for row in boosts
    )
    return f"""-- Gerado por scripts/build-renova-migration.py.
-- Voucher: aba SAP, parceiro ASSURANT, tabela de 04/08/2026.
-- Boost: imagem Tabela Boost Vivo Renova recebida em 05/08/2026.

CREATE TABLE renova_trade_in_values_20260804 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_key TEXT NOT NULL COLLATE NOCASE UNIQUE,
  device_name TEXT NOT NULL COLLATE NOCASE,
  manufacturer TEXT NOT NULL COLLATE NOCASE,
  product_type TEXT NOT NULL COLLATE NOCASE CHECK (product_type IN ('SMARTPHONE', 'TABLET')),
  good_cents INTEGER NOT NULL CHECK (good_cents >= 0),
  defective_cents INTEGER NOT NULL CHECK (defective_cents >= 0),
  table_date TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

{trade_inserts}

DROP TABLE renova_trade_in_values;
ALTER TABLE renova_trade_in_values_20260804 RENAME TO renova_trade_in_values;
CREATE INDEX idx_renova_trade_in_active_name
  ON renova_trade_in_values(active, manufacturer, device_name COLLATE NOCASE);

CREATE TABLE renova_manufacturer_boosts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manufacturer TEXT NOT NULL COLLATE NOCASE,
  device_name TEXT NOT NULL COLLATE NOCASE,
  match_key TEXT NOT NULL COLLATE NOCASE UNIQUE,
  bonus_cents INTEGER NOT NULL CHECK (bonus_cents >= 0),
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL,
  source TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  CHECK (starts_on <= ends_on)
);

INSERT INTO renova_manufacturer_boosts
  (manufacturer, device_name, match_key, bonus_cents, starts_on, ends_on, source, active)
VALUES
{boost_values};

CREATE INDEX idx_renova_boosts_active_dates
  ON renova_manufacturer_boosts(active, starts_on, ends_on);
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("workbook", type=Path)
    parser.add_argument("--migration", type=Path, required=True)
    parser.add_argument("--audit", type=Path, required=True)
    args = parser.parse_args()

    trade_ins = read_trade_ins(args.workbook)
    boosts = read_boosts()
    args.migration.write_text(build_sql(trade_ins, boosts), encoding="utf-8")
    args.audit.write_text(json.dumps({
        "sourceWorkbook": args.workbook.name,
        "sheet": "SAP",
        "provider": "ASSURANT",
        "tradeInCount": len(trade_ins),
        "tradeInTableDate": "2026-08-04",
        "boostCount": len(boosts),
        "tradeIns": trade_ins,
        "boosts": boosts,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "tradeInCount": len(trade_ins),
        "boostCount": len(boosts),
        "migration": str(args.migration),
        "audit": str(args.audit),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
