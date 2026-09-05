PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS outlet_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  center_code TEXT NOT NULL,
  store_name TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('devices', 'wearables', 'chargers', 'cases', 'screen_protectors', 'misc')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  discount INTEGER NOT NULL CHECK (discount IN (30, 40)),
  imported_on TEXT NOT NULL,
  source_name TEXT NOT NULL,
  UNIQUE (center_code, product_id)
);

CREATE INDEX IF NOT EXISTS idx_outlet_stock_product ON outlet_stock (product_id, store_name);
CREATE INDEX IF NOT EXISTS idx_outlet_stock_store ON outlet_stock (center_code, product_name);

DELETE FROM outlet_stock;

INSERT INTO outlet_stock
  (center_code, store_name, product_id, product_name, category, quantity, discount, imported_on, source_name)
VALUES
  ('117H', 'EA GRAMCELL DIVINO MG', 'edge-60-fusion-256', 'Motorola Edge 60 Fusion 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('117H', 'EA GRAMCELL DIVINO MG', 'edge-60-pro-512', 'Motorola Edge 60 Pro 512GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('117H', 'EA GRAMCELL DIVINO MG', 'moto-g56-256', 'Moto G56 5G 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('117H', 'EA GRAMCELL DIVINO MG', 'edge-60-pro-256', 'Motorola Edge 60 Pro 256GB', 'devices', 2, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('117H', 'EA GRAMCELL DIVINO MG', 's25-ultra-256', 'Samsung Galaxy S25 Ultra 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('117H', 'EA GRAMCELL DIVINO MG', 's25-edge-512', 'Samsung Galaxy S25 Edge 512GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),

  ('119H', 'EA GRAMCELL BARROSO MG', 'edge-60-fusion-256', 'Motorola Edge 60 Fusion 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('119H', 'EA GRAMCELL BARROSO MG', 'edge-60-pro-256', 'Motorola Edge 60 Pro 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('119H', 'EA GRAMCELL BARROSO MG', 's25-ultra-256', 'Samsung Galaxy S25 Ultra 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),

  ('120H', 'EA GRAMCELL BARBACENA III MG', 'edge-60-fusion-256', 'Motorola Edge 60 Fusion 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('120H', 'EA GRAMCELL BARBACENA III MG', 'edge-60-pro-512', 'Motorola Edge 60 Pro 512GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('120H', 'EA GRAMCELL BARBACENA III MG', 'edge-60-pro-256', 'Motorola Edge 60 Pro 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('120H', 'EA GRAMCELL BARBACENA III MG', 'a16-5g-128', 'Samsung Galaxy A16 5G 128GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('120H', 'EA GRAMCELL BARBACENA III MG', 's25-plus-256', 'Samsung Galaxy S25+ 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('120H', 'EA GRAMCELL BARBACENA III MG', 's25-ultra-256', 'Samsung Galaxy S25 Ultra 256GB', 'devices', 2, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('120H', 'EA GRAMCELL BARBACENA III MG', 'a06-5g-128', 'Samsung Galaxy A06 5G 128GB', 'devices', 3, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('120H', 'EA GRAMCELL BARBACENA III MG', 's25-edge-512', 'Samsung Galaxy S25 Edge 512GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),

  ('209H', 'EA GRAMCELL S J DEL REI I MG', 'charger-duo-65w', 'Carregador Parede Duo USB-A USB-C 65W', 'chargers', 1, 40, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('209H', 'EA GRAMCELL S J DEL REI I MG', 'edge-60-pro-256', 'Motorola Edge 60 Pro 256GB', 'devices', 4, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('209H', 'EA GRAMCELL S J DEL REI I MG', 's25-ultra-256', 'Samsung Galaxy S25 Ultra 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('209H', 'EA GRAMCELL S J DEL REI I MG', 'a06-5g-128', 'Samsung Galaxy A06 5G 128GB', 'devices', 2, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),

  ('210H', 'EA GRAMCELL S J DEL REI II MG', 'edge-60-pro-512', 'Motorola Edge 60 Pro 512GB', 'devices', 3, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('210H', 'EA GRAMCELL S J DEL REI II MG', 'moto-g56-256', 'Moto G56 5G 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('210H', 'EA GRAMCELL S J DEL REI II MG', 'edge-60-pro-256', 'Motorola Edge 60 Pro 256GB', 'devices', 2, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('210H', 'EA GRAMCELL S J DEL REI II MG', 'a16-5g-128', 'Samsung Galaxy A16 5G 128GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('210H', 'EA GRAMCELL S J DEL REI II MG', 's25-ultra-256', 'Samsung Galaxy S25 Ultra 256GB', 'devices', 2, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),

  ('211H', 'EA GRAMCELL CARANDAI MG', 'watch7-bt-40', 'Galaxy Watch7 BT 40mm', 'wearables', 1, 40, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('211H', 'EA GRAMCELL CARANDAI MG', 'edge-60-fusion-256', 'Motorola Edge 60 Fusion 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('211H', 'EA GRAMCELL CARANDAI MG', 'edge-60-pro-256', 'Motorola Edge 60 Pro 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),

  ('218H', 'EA GRAMCELL PIRAUBA MG', 'edge-60-fusion-256', 'Motorola Edge 60 Fusion 256GB', 'devices', 3, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('218H', 'EA GRAMCELL PIRAUBA MG', 'edge-60-pro-256', 'Motorola Edge 60 Pro 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),

  ('224H', 'EA GRAMCELL TOCANTINS MG', 'edge-60-fusion-256', 'Motorola Edge 60 Fusion 256GB', 'devices', 2, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('224H', 'EA GRAMCELL TOCANTINS MG', 'moto-g56-256', 'Moto G56 5G 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('224H', 'EA GRAMCELL TOCANTINS MG', 'edge-60-pro-256', 'Motorola Edge 60 Pro 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('224H', 'EA GRAMCELL TOCANTINS MG', 's25-ultra-256', 'Samsung Galaxy S25 Ultra 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('224H', 'EA GRAMCELL TOCANTINS MG', 's25-edge-512', 'Samsung Galaxy S25 Edge 512GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),

  ('259H', 'EA GRAMCELL RESENDE COSTA MG', 'edge-60-pro-512', 'Motorola Edge 60 Pro 512GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('259H', 'EA GRAMCELL RESENDE COSTA MG', 'moto-g56-256', 'Moto G56 5G 256GB', 'devices', 3, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('259H', 'EA GRAMCELL RESENDE COSTA MG', 'edge-60-pro-256', 'Motorola Edge 60 Pro 256GB', 'devices', 2, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('259H', 'EA GRAMCELL RESENDE COSTA MG', 's25-ultra-256', 'Samsung Galaxy S25 Ultra 256GB', 'devices', 3, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),

  ('292H', 'EA GRAMCELL V DO RIO BRANCO MG', 'edge-60-pro-256', 'Motorola Edge 60 Pro 256GB', 'devices', 2, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('292H', 'EA GRAMCELL V DO RIO BRANCO MG', 'a06-5g-128', 'Samsung Galaxy A06 5G 128GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),

  ('83MN', 'EA GRAMCELL S TIAGO MG', 's25-ultra-256', 'Samsung Galaxy S25 Ultra 256GB', 'devices', 3, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('88MN', 'EA GRAMCELL MURIAE I MG', 'moto-g56-256', 'Moto G56 5G 256GB', 'devices', 2, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),

  ('89MN', 'EA GRAMCELL BARBACENA II MG', 'iphone-air-1tb', 'iPhone Air 1TB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('89MN', 'EA GRAMCELL BARBACENA II MG', 'edge-60-fusion-256', 'Motorola Edge 60 Fusion 256GB', 'devices', 3, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('89MN', 'EA GRAMCELL BARBACENA II MG', 'edge-60-pro-512', 'Motorola Edge 60 Pro 512GB', 'devices', 6, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('89MN', 'EA GRAMCELL BARBACENA II MG', 'moto-g56-256', 'Moto G56 5G 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('89MN', 'EA GRAMCELL BARBACENA II MG', 's25-ultra-256', 'Samsung Galaxy S25 Ultra 256GB', 'devices', 8, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('89MN', 'EA GRAMCELL BARBACENA II MG', 'z-flip7-512', 'Samsung Galaxy Z Flip7 512GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),

  ('96MN', 'EA GRAMCELL MURIAE II MG', 'edge-60-fusion-256', 'Motorola Edge 60 Fusion 256GB', 'devices', 5, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('96MN', 'EA GRAMCELL MURIAE II MG', 'moto-g56-256', 'Moto G56 5G 256GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('96MN', 'EA GRAMCELL MURIAE II MG', 'edge-60-pro-256', 'Motorola Edge 60 Pro 256GB', 'devices', 3, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('96MN', 'EA GRAMCELL MURIAE II MG', 's25-ultra-256', 'Samsung Galaxy S25 Ultra 256GB', 'devices', 3, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('96MN', 'EA GRAMCELL MURIAE II MG', 'a06-5g-128', 'Samsung Galaxy A06 5G 128GB', 'devices', 1, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('96MN', 'EA GRAMCELL MURIAE II MG', 's25-edge-512', 'Samsung Galaxy S25 Edge 512GB', 'devices', 2, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),

  ('98MN', 'EA GRAMCELL ESPERA FELIZ MG', 'edge-60-fusion-256', 'Motorola Edge 60 Fusion 256GB', 'devices', 6, 30, '2026-09-05', 'Planilha Outlet 05-09-2026'),
  ('98MN', 'EA GRAMCELL ESPERA FELIZ MG', 'a06-5g-128', 'Samsung Galaxy A06 5G 128GB', 'devices', 5, 30, '2026-09-05', 'Planilha Outlet 05-09-2026');
