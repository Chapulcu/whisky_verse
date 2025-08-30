-- TEST 3: Add Sample Data
-- Run this to add a few test whiskies

INSERT INTO whiskies (name, type, country, region, alcohol_percentage, color, aroma, taste, finish, description) VALUES 
('Macallan 12', 'Single Malt', 'İskoçya', 'Speyside', 40.0, 'Golden', 'Bal, vanilya, meşe', 'Karamel, vanilya, meşe', 'Orta uzunlukta, tatlı', 'Klasik Speyside single malt viski'),
('Lagavulin 16', 'Single Malt', 'İskoçya', 'Islay', 43.0, 'Dark Amber', 'Turba, is, deniz tuzu', 'Is, turba, baharat', 'Uzun, isli', 'İskoçya''nın en ünlü isli viskilerinden biri'),
('Jameson', 'Blended', 'İrlanda', NULL, 40.0, 'Golden', 'Hafif, meyveli', 'Yumuşak, tatlı', 'Kısa, temiz', 'İrlanda''nın en popüler viskisi'),
('Jack Daniel''s', 'Tennessee Whiskey', 'ABD', 'Tennessee', 40.0, 'Amber', 'Vanilya, karamel', 'Tatlı, yumuşak', 'Orta uzunlukta', 'Klasik Amerika viskisi'),
('Hibiki Harmony', 'Blended', 'Japonya', NULL, 43.0, 'Golden', 'Çiçeksi, meyveli', 'Dengeli, karmaşık', 'Uzun, zarif', 'Japon viski sanatının örneği');

-- Verify insertion
SELECT COUNT(*) as total_whiskies FROM whiskies;
SELECT name, type, country FROM whiskies ORDER BY name;