PRAGMA foreign_keys = ON;

-- Remove somente o rascunho identificado e confirmado antes da publicação.
-- Contagens finalizadas e qualquer outro rascunho permanecem preservados.
INSERT INTO audit_logs
  (actor_user_id, action, entity_type, entity_id, details_json)
SELECT NULL,
       'stock_count.draft_removed',
       'stock_count',
       id,
       '{"source":"requested-inventory-refresh-2026-09-24","name":"Contagem semanal – 23/09/2026","responsible":"Nicolas Coradini"}'
FROM stock_counts
WHERE id = '8d349f6a-e62e-48af-9fa6-c8a794ce7f56'
  AND status = 'draft';

DELETE FROM stock_counts
WHERE id = '8d349f6a-e62e-48af-9fa6-c8a794ce7f56'
  AND status = 'draft';

CREATE TABLE _migration_0103_guard (valid INTEGER NOT NULL CHECK (valid = 1));
INSERT INTO _migration_0103_guard (valid)
SELECT CASE WHEN NOT EXISTS (
  SELECT 1
  FROM stock_counts
  WHERE id = '8d349f6a-e62e-48af-9fa6-c8a794ce7f56'
    AND status = 'draft'
) THEN 1 ELSE 0 END;
DROP TABLE _migration_0103_guard;
