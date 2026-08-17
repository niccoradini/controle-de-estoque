-- Cria um código físico sequencial para cada aparelho recebido no Renova.
-- Registros existentes recebem #001, #002... pela ordem original de cadastro.

ALTER TABLE renova_intake_items
ADD COLUMN registration_code TEXT;

WITH ordered_items AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at, id) AS registration_number
  FROM renova_intake_items
)
UPDATE renova_intake_items
SET registration_code = (
  SELECT printf('#%03d', registration_number)
  FROM ordered_items
  WHERE ordered_items.id = renova_intake_items.id
);

CREATE UNIQUE INDEX idx_renova_intake_registration_code
ON renova_intake_items (registration_code)
WHERE registration_code IS NOT NULL;

CREATE TABLE renova_registration_counter (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_number INTEGER NOT NULL DEFAULT 0 CHECK (last_number >= 0)
);

INSERT INTO renova_registration_counter (id, last_number)
VALUES (
  1,
  COALESCE((
    SELECT MAX(CAST(SUBSTR(registration_code, 2) AS INTEGER))
    FROM renova_intake_items
  ), 0)
);
