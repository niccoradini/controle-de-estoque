import argparse
import importlib.util
import json
from pathlib import Path

source_path = Path(__file__).with_name("build-renova-migration.py")
spec = importlib.util.spec_from_file_location("build_renova_migration", source_path)
source = importlib.util.module_from_spec(spec)
spec.loader.exec_module(source)
read_boosts = source.read_boosts
sql_text = source.sql_text


def build_sql(rows):
    values = ",\n".join(
        "  (" + ", ".join([
            sql_text(row["manufacturer"]), sql_text(row["name"]), sql_text(row["matchKey"]),
            str(row["bonusCents"]), sql_text(row["startsOn"]), sql_text(row["endsOn"]),
            sql_text("Tabela Vivo Renova 17/08/2026"), "1",
        ]) + ")"
        for row in rows
    )
    return f"""-- Bônus de fabricante conferidos na Tabela Vivo Renova de 17/08/2026.
-- Os 1.042 vouchers ASSURANT da tabela de 04/08/2026 permanecem inalterados.

DROP TABLE renova_manufacturer_boosts;

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
{values};

CREATE INDEX idx_renova_boosts_active_dates
  ON renova_manufacturer_boosts(active, starts_on, ends_on);
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--migration", type=Path, required=True)
    parser.add_argument("--audit", type=Path, required=True)
    args = parser.parse_args()
    rows = read_boosts()
    args.migration.write_text(build_sql(rows), encoding="utf-8")
    args.audit.write_text(json.dumps({
        "sourceImage": "new_9187_tabela-vivo-renova-17-08-2026-v01-tabelapng-1786995913.png",
        "tableDate": "2026-08-17",
        "tradeInSourceDate": "2026-08-04",
        "tradeInCount": 1042,
        "boostCount": len(rows),
        "boosts": rows,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
