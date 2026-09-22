PRAGMA foreign_keys = ON;

UPDATE promotion_rules
SET image_url = CASE material_code
  WHEN '22024878' THEN 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-disc-edition-box-image-block-01-en-02apr25'
  WHEN '22024765' THEN 'https://images.samsung.com/is/image/samsung/p6pim/br/sm-x230nzaazto/gallery/br-galaxy-tab-a11-plus-sm-x230-sm-x230nzaazto-550174370?$1164_776_PNG$'
  ELSE image_url
END
WHERE material_code IN ('22024878', '22024765');
