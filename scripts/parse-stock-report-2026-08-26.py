#!/usr/bin/env python3
import json
import re
import sys
from collections import Counter
from datetime import date, datetime
from pathlib import Path

from openpyxl import load_workbook


if len(sys.argv) != 2:
    raise SystemExit('Uso: python scripts/parse-stock-report-2026-08-26.py caminho/ESTOQUE26.08.xlsx')

source_path = Path(sys.argv[1]).resolve()
workbook = load_workbook(source_path, read_only=True, data_only=True)
sheet = workbook.active
headers = [str(value or '').strip() for value in next(sheet.iter_rows(values_only=True))]
expected_headers = ['Material', 'Denominação', 'Nº de série', 'Centro', 'Depósito', 'Modificado por', 'Modificado em']
if headers != expected_headers:
    raise SystemExit(f'Cabeçalhos inesperados: {headers!r}')

available_rows = []
incoming_rows = []
repair_rows = []
status_summary = Counter()
serials = set()

for source_row, values in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
    material, technical_name, serial_number, center, deposit, modified_by, modified_value = values
    material = str(material or '').strip()
    technical_name = str(technical_name or '').strip()
    serial_number = str(serial_number or '').strip()
    center = str(center or '').strip()
    deposit = str(deposit or '').strip().upper()
    modified_by = str(modified_by or '').strip()
    if isinstance(modified_value, datetime):
        modified_on = modified_value.date().isoformat()
    elif isinstance(modified_value, date):
        modified_on = modified_value.isoformat()
    else:
        modified_on = str(modified_value or '').strip()[:10]
    if not material or not technical_name or not serial_number or not center:
        raise SystemExit(f'Linha {source_row} incompleta.')
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', modified_on):
        raise SystemExit(f'Data inválida na linha {source_row}: {modified_on!r}')
    serial_key = serial_number.casefold()
    if serial_key in serials:
        raise SystemExit(f'Número de série duplicado: {serial_number}')
    serials.add(serial_key)

    if deposit == 'RPAR':
        repair_rows.append({
            'sourceRow': source_row,
            'material': material,
            'technicalName': technical_name,
            'serialNumber': serial_number,
            'center': center,
            'deposit': 'RPAR',
            'modifiedBy': modified_by,
            'modifiedOn': modified_on,
        })
        continue

    system_status = 'DEPS NREM' if not deposit else 'DEPS'
    row = {
        'sourceRow': source_row,
        'material': material,
        'technicalName': technical_name,
        'serialNumber': serial_number,
        'center': center,
        'deposit': deposit or 'NREM',
        'stockType': '01',
        'systemStatus': system_status,
        'modifiedBy': modified_by,
        'modifiedOn': modified_on,
    }
    (incoming_rows if system_status == 'DEPS NREM' else available_rows).append(row)
    status_summary[system_status] += 1

material_count = len({row['material'] for row in available_rows + incoming_rows})
result = {
    'source': source_path.name,
    'importedAt': '2026-08-26',
    'migrationNumber': 50,
    'headers': headers,
    'sourceRowCount': len(serials),
    'availableDeposits': ['EXPO', 'LOJA', 'LVUT'],
    'incomingDeposits': ['DEPS', 'NREM'],
    'excludedDeposits': ['RPAR'],
    'availableStatuses': ['DEPS'],
    'incomingStatuses': ['DEPS NREM'],
    'excludedStatuses': [],
    'normalizedBlankDeposit': 'NREM',
    'normalizedBlankDepositCount': len(incoming_rows),
    'statusSummary': dict(status_summary),
    'excludedRowCount': len(repair_rows),
    'excludedStatusRowCount': 0,
    'expectedExcludedRowCount': len(repair_rows),
    'expectedProductCount': material_count,
    'expectedAvailableQuantity': len(available_rows),
    'incomingRowCount': len(incoming_rows),
    'rows': available_rows,
    'incomingRows': incoming_rows,
    'repairRows': repair_rows,
}

output_path = Path('data/basis-serial-stock-2026-08-26-excluding-rpar-with-incoming.json')
output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({
    'sourceRows': len(serials),
    'materials': material_count,
    'available': len(available_rows),
    'incoming': len(incoming_rows),
    'excludedRpar': len(repair_rows),
}, ensure_ascii=False))
