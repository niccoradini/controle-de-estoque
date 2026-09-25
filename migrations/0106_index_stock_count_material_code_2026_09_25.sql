-- A leitura rápida identifica o produto pelo código dentro da contagem.
-- A ordem do índice anterior (count_id, category, material_code) não atende
-- à procura por material sem filtro de categoria.
CREATE INDEX IF NOT EXISTS idx_stock_count_items_material_lookup
ON stock_count_items (count_id, material_code COLLATE NOCASE);
