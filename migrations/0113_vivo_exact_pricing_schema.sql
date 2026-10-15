-- Condições identificadas no portal Vivo, vinculadas ao código do material.
CREATE TABLE vivo_material_price_profiles (
  material_code TEXT PRIMARY KEY COLLATE NOCASE,
  price_key TEXT NOT NULL REFERENCES device_price_profiles(price_key)
);
CREATE INDEX idx_vivo_material_profile ON vivo_material_price_profiles(price_key);
CREATE TABLE vivo_plan_prices (
  price_key TEXT NOT NULL REFERENCES device_price_profiles(price_key),
  category TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK(price_cents > 0),
  renova_cents INTEGER NOT NULL DEFAULT 0 CHECK(renova_cents >= 0),
  PRIMARY KEY(price_key, category)
);
CREATE INDEX idx_vivo_plan_category ON vivo_plan_prices(category);
CREATE TABLE vivo_payment_totals (
  base_cents INTEGER PRIMARY KEY CHECK(base_cents > 0),
  totals_json TEXT NOT NULL CHECK(json_valid(totals_json))
);
CREATE TABLE vivo_retail_materials (
  material_code TEXT PRIMARY KEY COLLATE NOCASE REFERENCES product_retail_prices(material_code)
);
