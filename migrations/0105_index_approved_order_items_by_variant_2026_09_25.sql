-- O catálogo consulta o total vendido para cada produto. A chave existente
-- (request_id, variant_id) não serve para localizar os itens por variant_id.
CREATE INDEX IF NOT EXISTS idx_withdrawal_quantity_variant_request
ON withdrawal_quantity_items (variant_id, request_id);
