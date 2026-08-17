-- Armazena o IMEI dos aparelhos recebidos pelo Renova.
-- Registros anteriores permanecem válidos sem IMEI; novos cadastros exigem 15 dígitos na aplicação.

ALTER TABLE renova_intake_items
ADD COLUMN imei TEXT
CHECK (
  imei IS NULL
  OR (
    LENGTH(imei) = 15
    AND imei NOT GLOB '*[^0-9]*'
  )
);

CREATE UNIQUE INDEX idx_renova_intake_imei
ON renova_intake_items (imei)
WHERE imei IS NOT NULL;
