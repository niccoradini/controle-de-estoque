ALTER TABLE sales_tracking ADD COLUMN revenue_line TEXT NOT NULL DEFAULT '' CHECK (revenue_line IN ('','CONTROLE','POS','SVA','FIXA','UPGRADE','SEGURO','B2B'));
