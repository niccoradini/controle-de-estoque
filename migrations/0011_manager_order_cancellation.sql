PRAGMA foreign_keys = ON;

-- Permite ao gerente cancelar um pedido já liberado sem perder a
-- rastreabilidade dos números de série que haviam sido escolhidos.
CREATE TABLE cancelled_request_serials (
  request_id TEXT NOT NULL REFERENCES withdrawal_requests(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL REFERENCES product_variants(id),
  serial_id INTEGER NOT NULL REFERENCES inventory_serials(id),
  serial_number_snapshot TEXT NOT NULL,
  cancelled_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (request_id, serial_id)
);

CREATE INDEX idx_cancelled_request_serials_request
ON cancelled_request_serials (request_id, variant_id);

-- Libera possíveis seleções antigas de pedidos que já haviam sido cancelados
-- enquanto ainda estavam pendentes.
INSERT OR IGNORE INTO cancelled_request_serials
  (request_id, variant_id, serial_id, serial_number_snapshot)
SELECT a.request_id, a.variant_id, a.serial_id, a.serial_number_snapshot
FROM request_serial_assignments a
JOIN withdrawal_requests r ON r.id = a.request_id
WHERE r.status = 'cancelled';

DELETE FROM request_serial_assignments
WHERE request_id IN (
  SELECT id
  FROM withdrawal_requests
  WHERE status = 'cancelled'
);

DROP TRIGGER request_transition_only_from_pending;

CREATE TRIGGER request_transition_only_from_pending
BEFORE UPDATE OF status ON withdrawal_requests
FOR EACH ROW
WHEN NOT (
  (OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected', 'cancelled'))
  OR
  (OLD.status = 'approved' AND NEW.status = 'cancelled')
)
BEGIN
  SELECT RAISE(ABORT, 'INVALID_REQUEST_TRANSITION');
END;

CREATE TRIGGER approved_request_cancellation_restores_inventory
AFTER UPDATE OF status ON withdrawal_requests
FOR EACH ROW
WHEN OLD.status = 'approved' AND NEW.status = 'cancelled'
BEGIN
  INSERT OR IGNORE INTO cancelled_request_serials
    (request_id, variant_id, serial_id, serial_number_snapshot)
  SELECT request_id, variant_id, serial_id, serial_number_snapshot
  FROM request_serial_assignments
  WHERE request_id = NEW.id;

  UPDATE inventory_serials
  SET status = 'available',
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id IN (
    SELECT serial_id
    FROM request_serial_assignments
    WHERE request_id = NEW.id
  );

  UPDATE product_variants
  SET quantity_on_hand = quantity_on_hand + COALESCE((
        SELECT quantity
        FROM withdrawal_quantity_items i
        WHERE i.request_id = NEW.id
          AND i.variant_id = product_variants.id
      ), 0),
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  WHERE id IN (
    SELECT variant_id
    FROM withdrawal_quantity_items
    WHERE request_id = NEW.id
  );

  DELETE FROM request_serial_assignments
  WHERE request_id = NEW.id;
END;

CREATE TRIGGER pending_request_cancellation_releases_serials
AFTER UPDATE OF status ON withdrawal_requests
FOR EACH ROW
WHEN OLD.status = 'pending' AND NEW.status = 'cancelled'
BEGIN
  DELETE FROM request_serial_assignments
  WHERE request_id = NEW.id;
END;
