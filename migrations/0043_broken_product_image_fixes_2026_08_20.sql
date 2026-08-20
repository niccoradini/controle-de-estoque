PRAGMA foreign_keys = ON;

CREATE TABLE _migration_0043_product_images (
  material_code TEXT PRIMARY KEY COLLATE NOCASE,
  imagem_url TEXT NOT NULL CHECK (trim(imagem_url) <> '')
);

INSERT INTO _migration_0043_product_images (material_code, imagem_url)
VALUES
  ('22024234', 'https://cdn11.bigcommerce.com/s-5uiyhy/images/stencil/1280x1280/products/142810/819629/QBCLASS-Plus25-Whit__54634.1736568076.jpg?c=2'),
  ('22023772', 'https://cdn.awsli.com.br/2500x2500/2739/2739882/produto/398933652/d8e6dbeb3bddf31c7cade05e8ef29b19-yj5uwg8ie8.jpg'),
  ('22024572', 'https://cdn.awsli.com.br/2500x2500/2739/2739882/produto/398933652/d8e6dbeb3bddf31c7cade05e8ef29b19-yj5uwg8ie8.jpg'),
  ('22024631', 'https://cdn11.bigcommerce.com/s-5uiyhy/images/stencil/1280x1280/products/148972/884637/SAMS25PLUSCBMG05__40533__92995.1780032191.jpg?c=2'),
  ('22024573', 'https://pancernik.eu/userdata/public/gfx/861073/ringke-fusion-magnetic-magsafe-galaxy-s26-ultra-clear-08.jpg');

UPDATE products
SET imagem_url = (
      SELECT fixes.imagem_url
      FROM product_variants variants
      JOIN _migration_0043_product_images fixes
        ON fixes.material_code = variants.sku COLLATE NOCASE
      WHERE variants.product_id = products.id
      LIMIT 1
    ),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE EXISTS (
  SELECT 1
  FROM product_variants variants
  JOIN _migration_0043_product_images fixes
    ON fixes.material_code = variants.sku COLLATE NOCASE
  WHERE variants.product_id = products.id
);

CREATE TABLE _migration_0043_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);

INSERT INTO _migration_0043_guard (valid)
SELECT CASE WHEN COUNT(*) = 5 THEN 1 ELSE 0 END
FROM product_variants variants
JOIN products ON products.id = variants.product_id
JOIN _migration_0043_product_images fixes
  ON fixes.material_code = variants.sku COLLATE NOCASE
 AND fixes.imagem_url = products.imagem_url;

DROP TABLE _migration_0043_guard;
DROP TABLE _migration_0043_product_images;
