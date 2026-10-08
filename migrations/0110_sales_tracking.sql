CREATE TABLE IF NOT EXISTS sales_tracking (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 customer_name TEXT NOT NULL, cpf TEXT NOT NULL, phone TEXT NOT NULL DEFAULT '',
 sale_date TEXT NOT NULL, amount_cents INTEGER NOT NULL CHECK(amount_cents >= 0),
 installation_date TEXT NOT NULL DEFAULT '', seller_id INTEGER NOT NULL REFERENCES users(id),
 product TEXT NOT NULL DEFAULT '', order_number TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL CHECK(status IN ('pending','scheduled','installed','cancelled')),
 notes TEXT NOT NULL DEFAULT '', created_by INTEGER NOT NULL REFERENCES users(id),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sales_seller_date ON sales_tracking(seller_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales_tracking(sale_date);
