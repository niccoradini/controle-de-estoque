PRAGMA foreign_keys = ON;

-- Retira chips e películas da contagem aberta de 24/09, inclusive valores já contados.
-- O catálogo, o estoque e o histórico de outras contagens permanecem inalterados.
CREATE TABLE _migration_0104_excluded_items (
  variant_id INTEGER PRIMARY KEY,
  material_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  counted_quantity INTEGER
);

INSERT INTO _migration_0104_excluded_items
  (variant_id, material_code, product_name, counted_quantity)
SELECT variant_id, material_code, product_name, counted_quantity
FROM stock_count_items
WHERE count_id = 'c47b79b7-ace3-42be-810f-ff8306b461e2'
  AND EXISTS (
    SELECT 1
    FROM stock_counts count
    WHERE count.id = stock_count_items.count_id
      AND count.status IN ('draft', 'completed')
  )
  AND (
    category = 'screen_protectors'
    OR UPPER(product_name) LIKE '%PELÍCULA%'
    OR UPPER(product_name) LIKE '%PELICULA%'
    OR UPPER(product_name) LIKE '%FILME%'
    OR UPPER(product_name) LIKE '%SIM CARD%'
  );

INSERT INTO audit_logs
  (actor_user_id, action, entity_type, entity_id, details_json)
SELECT count.created_by,
       'stock_count.excluded_items_removed',
       'stock_count',
       count.id,
       json_object(
         'source', 'requested-exclusion-2026-09-24',
         'removedItems', (SELECT COUNT(*) FROM _migration_0104_excluded_items),
         'removedCountedItems', (SELECT COUNT(*) FROM _migration_0104_excluded_items WHERE counted_quantity IS NOT NULL),
         'removedCountedUnits', (SELECT COALESCE(SUM(counted_quantity), 0) FROM _migration_0104_excluded_items)
       )
FROM stock_counts count
WHERE count.id = 'c47b79b7-ace3-42be-810f-ff8306b461e2'
  AND count.status IN ('draft', 'completed')
  AND EXISTS (SELECT 1 FROM _migration_0104_excluded_items);

DELETE FROM stock_count_serials
WHERE count_id = 'c47b79b7-ace3-42be-810f-ff8306b461e2'
  AND variant_id IN (SELECT variant_id FROM _migration_0104_excluded_items);

DELETE FROM stock_count_items
WHERE count_id = 'c47b79b7-ace3-42be-810f-ff8306b461e2'
  AND variant_id IN (SELECT variant_id FROM _migration_0104_excluded_items)
  AND EXISTS (
    SELECT 1
    FROM stock_counts count
    WHERE count.id = stock_count_items.count_id
      AND count.status IN ('draft', 'completed')
  );

UPDATE stock_counts
SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'c47b79b7-ace3-42be-810f-ff8306b461e2'
  AND status IN ('draft', 'completed')
  AND EXISTS (SELECT 1 FROM _migration_0104_excluded_items);

CREATE TABLE _migration_0104_guard (valid INTEGER NOT NULL CHECK (valid = 1));
INSERT INTO _migration_0104_guard (valid)
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM stock_count_items
  WHERE count_id = 'c47b79b7-ace3-42be-810f-ff8306b461e2'
    AND (
      category = 'screen_protectors'
      OR UPPER(product_name) LIKE '%PELÍCULA%'
      OR UPPER(product_name) LIKE '%PELICULA%'
      OR UPPER(product_name) LIKE '%FILME%'
      OR UPPER(product_name) LIKE '%SIM CARD%'
    )
) THEN 1 ELSE 0 END;
DROP TABLE _migration_0104_guard;
DROP TABLE _migration_0104_excluded_items;
