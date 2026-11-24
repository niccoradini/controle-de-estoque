"""Extract only phones from the five SAP workbooks into a regional D1 migration.

Usage: python scripts/import-regional-xlsx.py INPUT_DIRECTORY OUTPUT_SQL
Uses the Python standard library. Preserves original product codes and IMEIs.
"""
import collections
import datetime
import hashlib
import json
import pathlib
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
STORES = {'210H': '210h', '209H': '209h', '120H': '120h', '89MN': '89MN', '283H': '283h'}
PHONE = re.compile(r'^(APPLE IPHONE |MOTOROLA XT\S+ SMARTPHONE |OPPO SMART(?:PHONE)? |SSG GALAXY [ASF]\d)')
EXCLUDED = re.compile(r'CAPA|\bCP\b|CHIP|SIM CARD|CARREG|CABO|WATCH|\bTAB\b|IPAD|SMARTTAG|FONE')


def read_rows(path):
    with zipfile.ZipFile(path) as archive:
        shared = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            shared = [''.join(node.itertext()) for node in ET.fromstring(archive.read('xl/sharedStrings.xml')).findall('m:si', NS)]
        sheet_names = [name for name in archive.namelist() if re.fullmatch(r'xl/worksheets/sheet\d+\.xml', name)]
        if sheet_names != ['xl/worksheets/sheet1.xml']:
            raise ValueError(f'Unexpected sheets in {path.name}: {sheet_names}')
        rows = ET.fromstring(archive.read(sheet_names[0])).findall('.//m:sheetData/m:row', NS)
        for row in rows:
            result = {}
            for cell in row.findall('m:c', NS):
                value = cell.find('m:v', NS)
                inline = cell.find('m:is', NS)
                value = value.text if value is not None else ''.join(inline.itertext()) if inline is not None else ''
                result[re.sub(r'\d', '', cell.attrib['r'])] = (shared[int(value)] if cell.attrib.get('t') == 's' and value else value or '').strip()
            yield int(row.attrib['r']), result


def quote(value):
    return "'" + str(value).replace("'", "''") + "'"


def main():
    folder, output = map(pathlib.Path, sys.argv[1:])
    statements = ['-- Regional phones only. Source workbooks uploaded 2026-11-24.',
                  '-- Incoming (NREM) and repair (RPAR) units are not available stock.']
    seen = set()
    summary = collections.defaultdict(collections.Counter)
    for store, canonical in STORES.items():
        path = folder / f'{store}.xlsx'
        statements.append(f'-- {path.name} SHA256 {hashlib.sha256(path.read_bytes()).hexdigest()}')
        rows = list(read_rows(path))
        expected = {'A': 'Material', 'B': 'Denominação', 'C': 'Nº de série', 'D': 'Centro', 'E': 'Depósito', 'G': 'Status sistema'}
        if any(rows[0][1].get(key) != value for key, value in expected.items()):
            raise ValueError(f'Unexpected headers: {path.name}')
        for number, row in rows[1:]:
            model = row.get('B', '')
            if not PHONE.match(model):
                summary[store]['excluded'] += 1
                continue
            if EXCLUDED.search(model):
                raise ValueError(f'Non-phone passed inclusion filter: {model}')
            imei, code, deposit, system = (row.get(key, '') for key in ['C', 'A', 'E', 'G'])
            if row.get('D') != store or not re.fullmatch(r'\d{15}', imei) or not code or imei in seen:
                raise ValueError(f'Invalid or duplicate phone: {path.name}:{number}')
            if deposit not in ('', 'LVUT', 'LOJA', 'EXPO', 'RPAR') or not set(system.split()) <= {'DEPS', 'NREM'}:
                raise ValueError(f'Unknown stock state: {path.name}:{number}')
            if not deposit and 'NREM' not in system.split():
                raise ValueError(f'Missing deposit without incoming marker: {path.name}:{number}')
            seen.add(imei)
            state = 'repair' if deposit == 'RPAR' else 'incoming' if 'NREM' in system.split() else 'available'
            condition = 'Vitrine' if deposit == 'EXPO' or 'DEMO' in model.split() else 'Novo'
            notes = f'Importado de {path.name}, linha {number}. Depósito SAP: {deposit or "não informado"}. Status SAP: {system}. Tipo de estoque: {row.get("F", "")}. Status usuário: {row.get("K") or "não informado"}.'
            if row.get('H'):
                source_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=int(row['H']))
                notes += f' Modificado na origem em {source_date.isoformat()}.'
            fields = [canonical, model, code, imei, condition, 'Importação das planilhas 24/11/2026', notes, state]
            statements.append('INSERT INTO regional_devices(store,model,material_code,imei,condition,actor,notes,stock_state) VALUES(' + ','.join(map(quote, fields)) + ") ON CONFLICT(imei) DO UPDATE SET store=excluded.store,model=excluded.model,material_code=excluded.material_code,condition=excluded.condition,actor=excluded.actor,notes=excluded.notes,stock_state=excluded.stock_state,status='available',version=regional_devices.version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now');")
            summary[store][state] += 1
    if len(seen) != 705:
        raise ValueError(f'Unexpected source total: {len(seen)}')
    output.write_text('\n'.join(statements) + '\n')
    print(json.dumps({'total': len(seen), 'stores': dict(summary)}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
