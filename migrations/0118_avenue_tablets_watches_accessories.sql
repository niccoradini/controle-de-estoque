-- Tablets e relógios pertencem a Demais acessórios na contagem da Avenida.
UPDATE avenue_count_source SET category='accessories'
WHERE UPPER(product_name) LIKE '%WATCH%' OR UPPER(product_name) LIKE '%RELOGIO%'
   OR UPPER(product_name) LIKE '%RELÓGIO%' OR UPPER(product_name) LIKE '%TABLET%'
   OR UPPER(product_name) LIKE '% TAB %';
UPDATE avenue_stock_count_items SET category='accessories'
WHERE UPPER(product_name) LIKE '%WATCH%' OR UPPER(product_name) LIKE '%RELOGIO%'
   OR UPPER(product_name) LIKE '%RELÓGIO%' OR UPPER(product_name) LIKE '%TABLET%'
   OR UPPER(product_name) LIKE '% TAB %';
-- Completa contagens de acessórios em andamento sem substituir valores já contados.
INSERT OR IGNORE INTO avenue_stock_count_items
(count_id,material_code,product_name,category,stock_mode,expected_quantity)
SELECT c.id,s.material_code,s.product_name,s.category,'serialized',s.expected_quantity
FROM avenue_stock_counts c CROSS JOIN avenue_count_source s
WHERE c.status='draft' AND c.category='accessories'
AND (UPPER(s.product_name) LIKE '%WATCH%' OR UPPER(s.product_name) LIKE '%RELOGIO%'
 OR UPPER(s.product_name) LIKE '%RELÓGIO%' OR UPPER(s.product_name) LIKE '%TABLET%' OR UPPER(s.product_name) LIKE '% TAB %');
INSERT OR IGNORE INTO avenue_stock_count_serials (count_id,item_id,serial_number,expected)
SELECT i.count_id,i.id,s.serial_number,s.expected FROM avenue_stock_count_items i
JOIN avenue_stock_counts c ON c.id=i.count_id
JOIN avenue_count_source_serials s ON s.material_code=i.material_code COLLATE NOCASE
WHERE c.status='draft' AND c.category='accessories';
