PRAGMA foreign_keys = ON;

-- Completa as fotos dos materiais ativos que entraram após o catálogo visual de 18/08.
CREATE TABLE _migration_0042_product_images (
  material_code TEXT PRIMARY KEY COLLATE NOCASE,
  imagem_url TEXT NOT NULL CHECK (trim(imagem_url) <> '')
);

INSERT INTO _migration_0042_product_images (material_code, imagem_url)
VALUES
  ('DGAP14862000', 'https://io.convertiez.com.br/m/lojasedmil/shop/products/images/1793/medium/apple-iphone-13-256gb-tela-61-e-camera-traseira-12mp-preto_14822.jpg'),
  ('DGAP17622000', 'https://www.resetdigitale.it/129181-thickbox_default/smartphone-apple-iphone-14-256gb-bianco.jpg'),
  ('DGAP277B3000', 'https://ecommerce30032022.blob.core.windows.net/e-commerce/produtos/2026/02/54229000401jpg-092602510916-Suft.jpg'),
  ('DGAP277U3000', 'https://cdn.awsli.com.br/2500x2500/2122/2122929/produto/372554894/f8aafd5f-8a55-478f-8a6b-1e73b6371908-xr26ds5bi0.webp'),
  ('DGAP27743000', 'https://horizonplay.fbitsstatic.net/img/p/apple-iphone-17-pro-max-512gb-12ram-tela-super-retina-xdr-oled-6-9-prateado-193480/380179-1.jpg?h=670&v=202511152232&w=670'),
  ('DGAP278U3000', 'https://cdn.awsli.com.br/2500x2500/2122/2122929/produto/372554894/f8aafd5f-8a55-478f-8a6b-1e73b6371908-xr26ds5bi0.webp'),
  ('22024194', 'https://images6.kabum.com.br/produtos/fotos/sync_mirakl/1033166/xlarge/Capa-Capinha-Case-Silicone-Aveludada-Para-Samsung-Galaxy-A56-5g-Preto_1777395819.jpg'),
  ('22024238', 'https://pegdobrasil.cdn.magazord.com.br/img/2025/07/produto/150678/d8afd9c110de09075066149746573d27.JPG?ims=fit-in%2F600x600%2Ffilters%3Afill%28fff%29'),
  ('22024925', 'https://planoscelular.claro.com.br/medias/515Wx515H-productMain-62933-zero.png?context=bWFzdGVyfGltYWdlc3wxNDM4MTB8aW1hZ2UvcG5nfGFHTTJMMmc1TXk4eE1EWTNNRFUwTkRjME9EVTNOQzgxTVRWWGVEVXhOVWhmY0hKdlpIVmpkRTFoYVc1Zk5qSTVNek5mZW1WeWJ5NXdibWN8OTY3NTgyZmZkYTdlMDQzNzFmN2E2ZWEwMGNiODZjZjJiYzJjMjA4MjQxMGI0YTI2NTM4NTM1ZTcxN2NmYTk0Yg'),
  ('22023613', 'https://images.tcdn.com.br/img/img_prod/1249456/pelicula_tpu_transparente_para_celular_relogio_gshield_1733_1_5537a50aa656a57252475fe30c5b3352.jpg'),
  ('22023818', 'https://i2go.fbitsstatic.net/img/p/estojo-anti-choque-para-acessorios-i2go-oficial-cbf-90660/277150-1.jpg?h=600&v=no-change&w=600'),
  ('22022725', 'https://carrefourbr.vtexassets.com/arquivos/ids/161045851-1280-auto?aspect=true&height=auto&v=638543271661470000&width=1280'),
  ('TGMO59312000', 'https://elektra.vtexassets.com/arquivos/ids/28797695/31063562.jpg?v=639149148017170000'),
  ('22024486', 'https://images2.kabum.com.br/produtos/fotos/385192/console-nintendo-switch-oled-com-joy-con-branco-hbgskaaa2_1663593563_gg.jpg'),
  ('22024560', 'https://technolove.ru/upload/iblock/395/9cy2bab160tv9lz7xhcl0vfvgqtnv1jr.jpg'),
  ('22024573', 'https://thumb.pccomponentes.com/w-530-530/articles/1103/11031086/3491-funda-para-movil-dbramante1928-greenland-cover-case-plastico-negro-reciclado-para-samsung-galaxy-s26-7a3c6c43-143b-4b18-8817-5451a382bce8.jpg'),
  ('22024633', 'https://technolove.ru/upload/iblock/395/9cy2bab160tv9lz7xhcl0vfvgqtnv1jr.jpg'),
  ('22022747', 'https://api.store.vivo.com.br/medias/515Wx515H-22023556-1-.png?context=bWFzdGVyfHByb2R1Y3RpbWFnZXN8NjEwNjZ8aW1hZ2UvcG5nfGFHRmxMMmhsWWk4NU5ERTNPREF6TkRrM05UQXlMelV4TlZkNE5URTFTRjh5TWpBeU16VTFObDhnS0RFcExuQnVad3wwMGY0YzIwZjA3YmJlNzkwMWVjMzE1MWVjNWI5MDhkZGFhMTg3M2IxYTEwYjY4NzhlNzUzYmVkYzQzMGQ1YzQ2'),
  ('22022748', 'https://api.store.vivo.com.br/medias/515Wx515H-22023556-1-.png?context=bWFzdGVyfHByb2R1Y3RpbWFnZXN8NjEwNjZ8aW1hZ2UvcG5nfGFHRmxMMmhsWWk4NU5ERTNPREF6TkRrM05UQXlMelV4TlZkNE5URTFTRjh5TWpBeU16VTFObDhnS0RFcExuQnVad3wwMGY0YzIwZjA3YmJlNzkwMWVjMzE1MWVjNWI5MDhkZGFhMTg3M2IxYTEwYjY4NzhlNzUzYmVkYzQzMGQ1YzQ2'),
  ('22023826', 'https://api.store.vivo.com.br/medias/515Wx515H-22023650-1-.jpg?context=bWFzdGVyfHByb2R1Y3RpbWFnZXN8MjE3Nzl8aW1hZ2UvanBlZ3xhRGMwTDJoallTODVOVEl3TnpNd01qRXdNek0wTHpVeE5WZDROVEUxU0Y4eU1qQXlNelkxTUY4Z0tERXBMbXB3Wnd8MDYzMGJkMGYxMzUzZmU4MDE0OWE1NzlmNzY4NDE0ZWJmNzBkZWJiM2ViOTQ1M2VhOGU3OWQyOTRiMmYyMmU1YQ'),
  ('22023653', 'https://api.store.vivo.com.br/medias/515Wx515H-22023650-1-.jpg?context=bWFzdGVyfHByb2R1Y3RpbWFnZXN8MjE3Nzl8aW1hZ2UvanBlZ3xhRGMwTDJoallTODVOVEl3TnpNd01qRXdNek0wTHpVeE5WZDROVEUxU0Y4eU1qQXlNelkxTUY4Z0tERXBMbXB3Wnd8MDYzMGJkMGYxMzUzZmU4MDE0OWE1NzlmNzY4NDE0ZWJmNzBkZWJiM2ViOTQ1M2VhOGU3OWQyOTRiMmYyMmU1YQ'),
  ('22023810', 'https://api.store.vivo.com.br/medias/515Wx515H-22023650-1-.jpg?context=bWFzdGVyfHByb2R1Y3RpbWFnZXN8MjE3Nzl8aW1hZ2UvanBlZ3xhRGMwTDJoallTODVOVEl3TnpNd01qRXdNek0wTHpVeE5WZDROVEUxU0Y4eU1qQXlNelkxTUY4Z0tERXBMbXB3Wnd8MDYzMGJkMGYxMzUzZmU4MDE0OWE1NzlmNzY4NDE0ZWJmNzBkZWJiM2ViOTQ1M2VhOGU3OWQyOTRiMmYyMmU1YQ'),
  ('22023741', 'https://api.store.vivo.com.br/medias/515Wx515H-22023647-1-.jpg?context=bWFzdGVyfHByb2R1Y3RpbWFnZXN8MjM5MjZ8aW1hZ2UvanBlZ3xhRFV3TDJnd1pTODVOVEl3TnpVME1UWXpOelF5THpVeE5WZDROVEUxU0Y4eU1qQXlNelkwTjE4Z0tERXBMbXB3Wnd8MGYzZjQxMWRkZGVhZWE3MDkyZjMyYjAzNTZhZDlmNmRkNjg4ZmJkMmFjNzAyN2VmOGRjZGJhZmQ2MDhhZmQxNg'),
  ('22021482', 'https://api-equipamentos.vivo.com.br/medias/22021726-1200-1.png?context=bWFzdGVyfGltYWdlc3wzODcxOTJ8aW1hZ2UvcG5nfGFEZGhMMmd3TXk4NU5UQTBNalF5TnpZeE56VTRMekl5TURJeE56STJJREV5TURCZk1TNXdibWN8NTBkMmNmM2U5M2UyNzNhMzdmMzdiYjk5NDdmY2IyNjk1NTZiNjhkYjFlMWQ1ZWNkNjZjY2E0MWQ3YjJmM2ZkNA'),
  ('22024818', 'https://images3.kabum.com.br/produtos/fotos/sync_mirakl/1031133/xlarge/Capa-Galaxy-S26-Ultra-Prote-o-C-mera-Magnetica-Clear-Trans_1780411736.jpg'),
  ('TGSA56224000', 'https://a-static.mlcdn.com.br/800x800/smartphone-samsung-galaxy-a36-5g-256gb-branco-8gb-ram-67-cam-tripla-selfie-12mp/magazineluiza/238691800/85b16e7b698bc6ca935c2eb44fd2c82f.jpg'),
  ('TGSA60724000', 'https://overseaselectronics.com/images/stories/virtuemart/product/SamsungGalaxyA37White17.jpg'),
  ('TGSA60764000', 'https://tvlar.vtexassets.com/arquivos/ids/19939558/Slide1.png?v=639119532216030000'),
  ('TGSA60364000', 'https://bfasset.costco-static.com/U447IH35/as/v3sss3239g7bw4wv7zvt5r5h/4000443573-894_black_1?auto=webp&canvas=727%2C727&fit=bounds&format=jpg&height=727&width=727'),
  ('TGSA603R4000', 'https://samsungbrshop.vtexassets.com/arquivos/ids/278510/02M2VIOLETA1.jpg?v=639076206924200000'),
  ('TGSA59664000', 'https://i.simpalsmedia.com/marketplace/products/original/9729fbfdd0e78379fda50bc12e2c09ad.jpg'),
  ('TGSA57622000', 'https://ak-asset.jarir.com/akeneo-prod/asset/c/8/4/e/c84e86fd08ef30b84f5ee7e480247624989ebbcb_661912.jpg'),
  ('YBSC001A1000', 'https://down-br.img.susercontent.com/file/sg-11134201-7rdwc-mcxqwtsbod7q85');

CREATE TABLE _migration_0042_guard (
  valid INTEGER NOT NULL CHECK (valid = 1)
);

INSERT INTO _migration_0042_guard (valid)
SELECT CASE
  WHEN (SELECT COUNT(*) FROM _migration_0042_product_images) = 33
   AND (SELECT COUNT(*) FROM _migration_0042_product_images WHERE imagem_url LIKE 'https://%') = 33
  THEN 1 ELSE 0 END;

UPDATE products
SET imagem_url = (
      SELECT source.imagem_url
      FROM product_variants variant
      JOIN _migration_0042_product_images source
        ON source.material_code = variant.sku COLLATE NOCASE
      WHERE variant.product_id = products.id
      LIMIT 1
    ),
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE EXISTS (
  SELECT 1
  FROM product_variants variant
  JOIN _migration_0042_product_images source
    ON source.material_code = variant.sku COLLATE NOCASE
  WHERE variant.product_id = products.id
);

INSERT INTO _migration_0042_guard (valid)
SELECT CASE WHEN COUNT(*) = 33 THEN 1 ELSE 0 END
FROM product_variants variants
JOIN products ON products.id = variants.product_id
JOIN _migration_0042_product_images source
  ON source.material_code = variants.sku COLLATE NOCASE
 AND source.imagem_url = products.imagem_url;

DROP TABLE _migration_0042_guard;
DROP TABLE _migration_0042_product_images;
