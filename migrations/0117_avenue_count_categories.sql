ALTER TABLE avenue_stock_counts ADD COLUMN category TEXT NOT NULL DEFAULT 'all' CHECK(category IN ('all','devices','cases','screen_protectors','chargers','accessories'));
