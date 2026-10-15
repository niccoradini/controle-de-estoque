"""Normaliza observações da interface Vivo e gera uma migração reproduzível.

Para importar uma coleta: --normalize ARQUIVO --queue FILA.
Sem argumentos, recompila a migração a partir da fonte normalizada versionada.
"""
import argparse
import json
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'scripts/vivo-pricing-source-2026-10-15.json'
DATE = '2026-10-15'
LABEL = 'Conteúdos Vivo · Revenda EA · MG'


def cents(value):
    text = str(value).replace('R$', '').replace('\xa0', '').strip()
    if not text:
        return None
    return int(Decimal(text.replace('.', '').replace(',', '.')) * 100)


def sql(value):
    if isinstance(value, int):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def insert(table, columns, rows, suffix=''):
    result = []
    for start in range(0, len(rows), 150):
        values = ',\n'.join('(' + ','.join(map(sql, row)) + ')' for row in rows[start:start + 150])
        result.append(f'INSERT INTO {table} ({columns}) VALUES\n{values}\n{suffix};')
    return result


def normalize(raw_path, queue_path):
    raw = json.loads(Path(raw_path).read_text())['collected']
    queue = json.loads(Path(queue_path).read_text())['products']
    prior = json.loads((ROOT / 'scripts/vivo-pricing-2026-10-15-work-in-progress.json').read_text())
    source = {'date': DATE, 'region': 'MG', 'source': LABEL,
              'inventorySource': {'name': '209H.15.10(1).xlsx', 'libraryId': 'libfile_6290c819ffc081918332a785ad5aca42', 'sha256': 'e2b49415a514531f188dd3da6cd14301f0a20b64bed88525a9ce9232d0910118'},
              'targetCodes': [p['code'] for p in queue],
              'models': [], 'accessories': [], 'exactTotals': {}}

    def add_totals(values):
        assert len(values) == 22 and all(isinstance(v, int) and v > 0 for v in values), values
        base = str(values[1])
        assert base not in source['exactTotals'] or source['exactTotals'][base] == values, ('Totais conflitantes', base)
        source['exactTotals'][base] = values
        return values[1]

    for accessory in prior['accessories']:
        base = add_totals(accessory['totalsCents'])
        source['accessories'].append({'code': accessory['sku'], 'name': accessory['name'],
                                      'baseCents': base, 'url': accessory['url']})
    for model in raw:
        if model.get('retail'):
            base = add_totals([cents(v) for v in model['totals']])
            for code in model['codes']:
                source['accessories'].append({'code': code, 'name': model['name'],
                                              'baseCents': base, 'url': model['url']})
            continue
        assert model.get('vitrine') == 'Indisponível para Revenda EA; tabela apenas Lojas Próprias' or all(
            not row.get('price') or row['price'].replace('R$', '').strip() == '' for row in model.get('vitrine', [])), 'Preço Vitrine precisa ser importado'
        normalized = {'key': 'vivo-' + model['url'].rsplit('/', 1)[1], 'name': model['name'],
                      'codes': model['codes'], 'url': model['url'], 'prices': []}
        if model.get('equivalentUrls'):
            normalized['equivalentUrls'] = model['equivalentUrls']
        assert {g['label'] for g in model['groups']} == {
            'PRÉ PAGO', 'CONTROLE · Com SVAs', 'CONTROLE · Sem SVAs',
            'PÓS / VIVO TOTAL · Com SVAs', 'PÓS / VIVO TOTAL · Sem SVAs'}
        for group in model['groups']:
            conditions = group['conditions']
            assert len(conditions) == 22
            reference = [(r['name'], r.get('period')) for r in conditions[1]]
            for rows in conditions:
                assert [(r['name'], r.get('period')) for r in rows] == reference, model['name']
            for index, row in enumerate(conditions[1]):
                assert len({r[index].get('renova') for r in conditions}) == 1, 'Bônus varia por pagamento'
                totals = [cents(rows[index]['price']) for rows in conditions]
                # Ausência no portal nunca é convertida em preço zero.
                if all(v is None for v in totals):
                    continue
                base = add_totals(totals)
                category = 'PRÉ' if group['label'] == 'PRÉ PAGO' else ' · '.join(
                    filter(None, [group['label'], row.get('period'), row['name']])).upper()
                normalized['prices'].append({'category': category, 'baseCents': base,
                                               'renovaCents': cents(row.get('renova') or '0,00')})
        assert normalized['prices'], model['name']
        assert len({r['category'] for r in normalized['prices']}) == len(normalized['prices'])
        source['models'].append(normalized)
    covered = [a['code'] for a in source['accessories']] + [c for m in source['models'] for c in m['codes']]
    assert len(covered) == len(set(covered)) == len(source['targetCodes']) == 320
    assert set(covered) == set(source['targetCodes']), set(source['targetCodes']) - set(covered)
    assert len({m['key'] for m in source['models']}) == len(source['models'])
    SOURCE.write_text(json.dumps(source, ensure_ascii=False, separators=(',', ':')) + '\n')
    return source


def build(source):
    statements = ['PRAGMA foreign_keys = ON;', '-- Preços consultados na interface Vivo em 15/10/2026. Chips excluídos.']
    # Fotografias de preços anteriores; os pedidos e estoques não são modificados.
    for table in ['device_price_profiles', 'device_price_values', 'device_price_match_rules', 'product_retail_prices', 'system_state']:
        statements.append(f'CREATE TABLE pricing_backup_20261015_{table} AS SELECT * FROM {table};')
    profiles, prices, mappings = [], [], []
    for m in source['models']:
        profiles.append([m['key'], m['name'], m['name'].split()[0], min(r['baseCents'] for r in m['prices']), DATE, LABEL])
        prices.extend([m['key'], r['category'], r['baseCents'], r['renovaCents']] for r in m['prices'])
        mappings.extend([code, m['key']] for code in m['codes'])
    statements += insert('device_price_profiles', 'price_key,display_name,brand,listed_from_cents,table_date,source_label', profiles,
                         'ON CONFLICT(price_key) DO UPDATE SET display_name=excluded.display_name,brand=excluded.brand,listed_from_cents=excluded.listed_from_cents,table_date=excluded.table_date,source_label=excluded.source_label')
    statements += insert('vivo_plan_prices', 'price_key,category,price_cents,renova_cents', prices)
    statements += insert('vivo_material_price_profiles', 'material_code,price_key', mappings)
    retail = [[a['code'], a['name'], 'misc', a['baseCents'], 'fixed', DATE, LABEL, a['name']] for a in source['accessories']]
    statements += insert('product_retail_prices', 'material_code,display_name,cluster,price_cents,price_kind,table_date,source_label,reference_name', retail,
                         'ON CONFLICT(material_code) DO UPDATE SET price_cents=excluded.price_cents,price_kind=excluded.price_kind,table_date=excluded.table_date,source_label=excluded.source_label,reference_name=excluded.reference_name')
    # Um relógio com preço de acessório não deve herdar uma tabela antiga por nome.
    statements += insert('vivo_retail_materials', 'material_code', [[a['code']] for a in source['accessories']])
    statements += insert('vivo_payment_totals', 'base_cents,totals_json', [[int(k), json.dumps(v, separators=(',', ':'))] for k, v in source['exactTotals'].items()])
    state = [['pricing_table_date', DATE], ['pricing_table_source', LABEL], ['retail_pricing_table_date', DATE],
             ['retail_pricing_table_source', LABEL], ['pricing_last_verification_date', DATE],
             ['pricing_audit_value_count', str(len(prices))], ['pricing_verified_material_count', '320']]
    statements += insert('system_state', 'key,value', state, 'ON CONFLICT(key) DO UPDATE SET value=excluded.value')
    migration = '\n\n'.join(statements) + '\n'
    assert all(len(s.encode()) < 100000 for s in statements), 'Instrução ultrapassa limite D1'
    (ROOT / 'migrations/0114_vivo_pricing_refresh_2026_10_15.sql').write_text(migration)
    print(json.dumps({'models': len(profiles), 'planCodes': len(mappings), 'retailCodes': len(retail),
                      'planConditions': len(prices), 'uniquePaymentTotals': len(source['exactTotals'])}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--normalize')
    parser.add_argument('--queue', default=str(ROOT.parent / 'price-update-queue.json'))
    args = parser.parse_args()
    source = normalize(args.normalize, args.queue) if args.normalize else json.loads(SOURCE.read_text())
    build(source)
