PRAGMA foreign_keys = ON;

-- A partir da versão 6.6.1, todo novo chip é escolhido a partir de uma série
-- disponível da planilha. Registros manuais antigos continuam preservados.
CREATE TRIGGER chips_require_inventory_match_insert
BEFORE INSERT ON chips
FOR EACH ROW
WHEN NEW.inventory_serial_id IS NULL
  OR NOT EXISTS (
    SELECT 1
    FROM inventory_serials inventory
    JOIN product_variants variant ON variant.id = inventory.variant_id
    JOIN products product ON product.id = variant.product_id
    WHERE inventory.id = NEW.inventory_serial_id
      AND inventory.status = 'available'
      AND variant.active = 1
      AND product.active = 1
      AND variant.serial_tracking = 1
      AND variant.sku = NEW.material_code COLLATE NOCASE
      AND NEW.iccid = CASE
        WHEN length(inventory.serial_number) = 18
             AND substr(inventory.serial_number, 1, 2) <> '89'
          THEN '89' || inventory.serial_number
        ELSE inventory.serial_number
      END COLLATE NOCASE
      AND (
        UPPER(COALESCE(product.display_name, product.name, '')) LIKE '%SIM CARD%'
        OR UPPER(COALESCE(product.technical_name, '')) LIKE '%SIM CARD%'
      )
      AND NOT EXISTS (
        SELECT 1 FROM request_serial_assignments assignment
        WHERE assignment.serial_id = inventory.id
      )
  )
BEGIN
  SELECT RAISE(ABORT, 'CHIP_SERIAL_NOT_AVAILABLE');
END;

-- Valida reaberturas e restaurações de chips conciliados sem bloquear
-- registros históricos que tenham sido criados manualmente na versão anterior.
CREATE TRIGGER chips_require_inventory_match_update
BEFORE UPDATE OF material_code, iccid, inventory_serial_id, status, active ON chips
FOR EACH ROW
WHEN NEW.inventory_serial_id IS NOT NULL
  AND NEW.active = 1
  AND NEW.status = 'available'
  AND NOT EXISTS (
    SELECT 1
    FROM inventory_serials inventory
    JOIN product_variants variant ON variant.id = inventory.variant_id
    JOIN products product ON product.id = variant.product_id
    WHERE inventory.id = NEW.inventory_serial_id
      AND inventory.status = 'available'
      AND variant.sku = NEW.material_code COLLATE NOCASE
      AND NEW.iccid = CASE
        WHEN length(inventory.serial_number) = 18
             AND substr(inventory.serial_number, 1, 2) <> '89'
          THEN '89' || inventory.serial_number
        ELSE inventory.serial_number
      END COLLATE NOCASE
      AND NOT EXISTS (
        SELECT 1 FROM request_serial_assignments assignment
        WHERE assignment.serial_id = inventory.id
      )
  )
BEGIN
  SELECT RAISE(ABORT, 'CHIP_SERIAL_NOT_AVAILABLE');
END;

-- Fecha a janela de concorrência entre a distribuição do chip e um pedido
-- comum que tente reservar a mesma série no mesmo instante.
CREATE TRIGGER serial_assignment_rejects_allocated_chip
BEFORE INSERT ON request_serial_assignments
FOR EACH ROW
WHEN EXISTS (
  SELECT 1
  FROM chips chip
  WHERE chip.inventory_serial_id = NEW.serial_id
    AND chip.active = 1
    AND chip.status = 'available'
)
BEGIN
  SELECT RAISE(ABORT, 'SERIAL_ALLOCATED_TO_CHIP');
END;
