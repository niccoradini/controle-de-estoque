PRAGMA foreign_keys = ON;

ALTER TABLE promotion_rules ADD COLUMN image_url TEXT;

-- Fotos individuais verificadas por produto. O catálogo local continua tendo prioridade.
UPDATE promotion_rules
SET image_url = CASE material_code
  WHEN '22023045' THEN 'https://www.apple.com/v/airpods/ag/images/overview/hero_endframe__calpooy4ucr6_large.jpg'
  WHEN '22024320' THEN 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/airpods-pro-compare-202509?.v=ZnlNck16RHdFMkxPbVgyckcxQ295SWM5dW4ramo4RThZRWNFZVlDZWt2eWVJSDByU2tYV1Z4NFlUcXB5aTNyak1ySFlEMWZsaHZ3bk91K3Q3TFkySTQ2WjliOWFwaXZhT05WYkFaRnhkbFE&fmt=png-alpha&hei=500&wid=420'
  WHEN '22024878' THEN 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-disc-edition-box-image-block-01-en-02apr25?$100px--t$='
  WHEN '22024185' THEN 'https://samsungbrshop.vtexassets.com/arquivos/ids/265097-800-auto?v=638920736355530000'
  ELSE image_url
END
WHERE material_code IN ('22023045', '22024320', '22024878', '22024185');
