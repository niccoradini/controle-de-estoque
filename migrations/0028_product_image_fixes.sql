PRAGMA foreign_keys = ON;

CREATE TABLE _migration_0028_product_image_fixes (
  material_code TEXT PRIMARY KEY,
  imagem_url TEXT NOT NULL CHECK (trim(imagem_url) <> '')
);

INSERT INTO _migration_0028_product_image_fixes (material_code, imagem_url)
VALUES
  ('DGAP277U6000', 'https://cdn.awsli.com.br/2500x2500/2122/2122929/produto/372554894/f8aafd5f-8a55-478f-8a6b-1e73b6371908-xr26ds5bi0.webp'),
  ('DGAP278B3000', 'https://media.falabella.com/falabellaCO/73417536_1/w%3D1500%2Ch%3D1500%2Cfit%3Dcover'),
  ('DGAP27843000', 'https://horizonplay.fbitsstatic.net/img/p/apple-iphone-17-pro-max-512gb-12ram-tela-super-retina-xdr-oled-6-9-prateado-193480/380179-1.jpg?h=670&v=202511152232&w=670'),
  ('DGAP27943000', 'https://horizonplay.fbitsstatic.net/img/p/apple-iphone-17-pro-max-512gb-12ram-tela-super-retina-xdr-oled-6-9-prateado-193480/380179-1.jpg?h=670&v=202511152232&w=670');

UPDATE products
SET imagem_url = (
  SELECT fixes.imagem_url
  FROM product_variants variants
  JOIN _migration_0028_product_image_fixes fixes
    ON fixes.material_code = variants.sku
  WHERE variants.product_id = products.id
  LIMIT 1
)
WHERE id IN (
  SELECT variants.product_id
  FROM product_variants variants
  JOIN _migration_0028_product_image_fixes fixes
    ON fixes.material_code = variants.sku
);

CREATE TABLE _migration_0028_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);

INSERT INTO _migration_0028_guard (valid)
SELECT CASE WHEN COUNT(*) = 4 THEN 1 ELSE 0 END
FROM product_variants variants
JOIN products ON products.id = variants.product_id
JOIN _migration_0028_product_image_fixes fixes
  ON fixes.material_code = variants.sku
 AND fixes.imagem_url = products.imagem_url;

DROP TABLE _migration_0028_guard;
DROP TABLE _migration_0028_product_image_fixes;
