-- TEST 4: Add Extended Data
-- Run this after Step 3 succeeds

INSERT INTO whiskies (name, type, country, region, alcohol_percentage, age_years, color, aroma, taste, finish, description) VALUES 
('Glenfiddich 12', 'Single Malt', 'İskoçya', 'Speyside', 40.0, 12, 'Golden', 'Armut, elma, bal', 'Tatlı, meyveli, yumuşak', 'Orta uzunlukta', 'Dünya''da en çok satan single malt viski'),
('Ardbeg 10', 'Single Malt', 'İskoçya', 'Islay', 46.0, 10, 'Pale Gold', 'Yoğun turba, is, limon', 'Güçlü turba, baharat, deniz', 'Çok uzun, isli', 'Islay''ın en karakteristik turbalı viskisi'),
('Maker''s Mark', 'Bourbon', 'ABD', 'Kentucky', 45.0, NULL, 'Amber', 'Karamel, vanilya, meşe', 'Pürüzsüz, tatlı, baharatlı', 'Kısa, sıcak', 'Kırmızı mum damlası ile ünlü bourbon'),
('Redbreast 12', 'Single Pot Still', 'İrlanda', NULL, 40.0, 12, 'Golden', 'Kuru meyve, baharat, meşe', 'Zengin, karamel, vanilya', 'Uzun, tatlı', 'İrlanda''nın prestijli single pot still viskisi'),
('Yamazaki 12', 'Single Malt', 'Japonya', NULL, 43.0, 12, 'Golden', 'Meyveli, çiçeksi, vanilya', 'Yumuşak, dengeli, karmaşık', 'Uzun, zarif', 'Japonya''nın ilk single malt viskisi'),
('Crown Royal', 'Canadian Whisky', 'Kanada', NULL, 40.0, NULL, 'Golden', 'Bal, vanilya, tahıl', 'Yumuşak, tatlı, dengeli', 'Orta uzunlukta', 'Kanada''nın en ünlü viski markası'),
('Laphroaig 10', 'Single Malt', 'İskoçya', 'Islay', 40.0, 10, 'Golden', 'Yoğun turba, is, deniz', 'Güçlü turba, tıbbi', 'Uzun, isli', 'Islay''ın en tıbbi karakterli viskisi'),
('Buffalo Trace', 'Bourbon', 'ABD', 'Kentucky', 40.0, NULL, 'Amber', 'Vanilya, karamel, meşe', 'Dengeli, tatlı, baharatlı', 'Orta uzunlukta', 'Kentucky''nin klasik bourbon''u'),
('Highland Park 12', 'Single Malt', 'İskoçya', 'Highlands', 40.0, 12, 'Amber', 'Kuru meyve, bal, hafif is', 'Dengeli, meyveli, baharatlı', 'Orta uzunlukta', 'Orkney adalarından eşsiz karakter'),
('Johnnie Walker Black Label', 'Blended', 'İskoçya', 'Various', 40.0, 12, 'Deep Gold', 'Is, meyve, vanilya', 'Dengeli, karmaşık, isli', 'Orta uzunlukta', 'Dünyanın en popüler premium harmanı'),
('Bushmills 10', 'Single Malt', 'İrlanda', 'Antrim', 40.0, 10, 'Golden', 'Bal, vanilya, meşe', 'Karamel, vanilya, meşe', 'Kısa, tatlı', 'İrlanda''nın en eski lisanslı damıtımevi'),
('Wild Turkey 101', 'Bourbon', 'ABD', 'Kentucky', 50.5, NULL, 'Amber', 'Karamel, vanilya, meşe', 'Güçlü, baharatlı, meşe', 'Uzun, sıcak', 'Yüksek alkol dereceli klasik bourbon'),
('Glenlivet 12', 'Single Malt', 'İskoçya', 'Speyside', 40.0, 12, 'Golden', 'Çiçeksi, meyveli, bal', 'Yumuşak, tatlı, vanilya', 'Temiz, orta uzunlukta', 'Speyside''ın klasik temsilcisi'),
('Hakushu 12', 'Single Malt', 'Japonya', NULL, 43.0, 12, 'Pale Green', 'Çimensi, taze, meyveli', 'Temiz, ferahlatıcı, dengeli', 'Taze, orta uzunlukta', 'Japon Alplerinin temiz havasını yansıtan viski'),
('Famous Grouse', 'Blended', 'İskoçya', 'Various', 40.0, NULL, 'Golden', 'Hafif, meyveli, bal', 'Yumuşak, dengeli, içimlik', 'Kısa, temiz', 'İskoçya''nın en çok satan harman viskisi');

-- Verify extended data
SELECT COUNT(*) as total_whiskies FROM whiskies;
SELECT DISTINCT type as whisky_types FROM whiskies ORDER BY type;
SELECT DISTINCT country as countries FROM whiskies ORDER BY country;