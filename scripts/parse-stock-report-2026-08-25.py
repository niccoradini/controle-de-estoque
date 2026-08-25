#!/usr/bin/env python3
import json
import sys
from collections import Counter
from pathlib import Path

from openpyxl import load_workbook


if len(sys.argv) != 2:
    raise SystemExit('Uso: python scripts/parse-stock-report-2026-08-25.py caminho/ESTOQUE25.08.xlsx')

source_path = Path(sys.argv[1]).resolve()
workbook = load_workbook(source_path, read_only=True, data_only=True)
sheet = workbook.active
headers = [str(value or '').strip() for value in next(sheet.iter_rows(values_only=True))]
expected_headers = ['Material', 'Denominação', 'Nº de série', 'Centro', 'Depósito']
if headers != expected_headers:
    raise SystemExit(f'Cabeçalhos inesperados: {headers!r}')

available_rows = []
incoming_rows = []
excluded_rpar = 0
repair_rows = []
status_summary = Counter()
serials = set()

for source_row, values in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
    material, technical_name, serial_number, center, deposit = [str(value or '').strip() for value in values]
    if not material or not technical_name or not serial_number or not center:
        raise SystemExit(f'Linha {source_row} incompleta.')
    serial_key = serial_number.casefold()
    if serial_key in serials:
        raise SystemExit(f'Número de série duplicado: {serial_number}')
    serials.add(serial_key)

    deposit = deposit.upper()
    if deposit == 'RPAR':
        excluded_rpar += 1
        repair_rows.append({
            'sourceRow': source_row,
            'material': material,
            'technicalName': technical_name,
            'serialNumber': serial_number,
            'center': center,
            'deposit': 'RPAR',
        })
        continue

    # Neste relatório, itens ainda não recebidos vêm sem depósito. Os itens já
    # recebidos aparecem em LVUT, LOJA ou EXPO.
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
    }
    (incoming_rows if system_status == 'DEPS NREM' else available_rows).append(row)
    status_summary[system_status] += 1

material_count = len({row['material'] for row in available_rows + incoming_rows})
result = {
    'source': source_path.name,
    'importedAt': '2026-08-25',
    'migrationNumber': 46,
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
    'excludedRowCount': excluded_rpar,
    'excludedStatusRowCount': 0,
    'expectedExcludedRowCount': excluded_rpar,
    'expectedProductCount': material_count,
    'expectedAvailableQuantity': len(available_rows),
    'incomingRowCount': len(incoming_rows),
    'rows': available_rows,
    'incomingRows': incoming_rows,
    'repairRows': repair_rows,
}

output_path = Path('data/basis-serial-stock-2026-08-25-excluding-rpar-with-incoming.json')
output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({
    'sourceRows': len(serials),
    'materials': material_count,
    'available': len(available_rows),
    'incoming': len(incoming_rows),
    'excludedRpar': excluded_rpar,
}, ensure_ascii=False))
