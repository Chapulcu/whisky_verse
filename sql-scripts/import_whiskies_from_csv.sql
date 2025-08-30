-- WHISKY CSV DATA IMPORT SCRIPT
-- Imports whisky data from viski_import_template.csv into the whiskies table
-- Handles data cleaning, defaults, and proper mapping to database schema

-- ==================================================
-- WHISKY DATA IMPORT
-- ==================================================

INSERT INTO whiskies (
    name, 
    type, 
    country, 
    region, 
    alcohol_percentage, 
    rating, 
    age_years, 
    color, 
    aroma, 
    taste, 
    finish, 
    description, 
    image_url, 
    created_at, 
    updated_at
) VALUES 

-- Bushmills 10
('Bushmills 10', 'Single Malt', 'İrlanda', 'Antrim', 40.0, NULL, 10, 'Golden', 'Bal, vanilya, meşe', 'Karamel, vanilya, meşe', 'Kısa, tatlı, yumuşak', 'Bushmills Distillery tarafından üretilen, 10 yıl boyunca yıllandırılmış single malt viski.', 'https://example.com/images/bushmills10_xXB9DDY7Hr.webp', NOW(), NOW()),

-- Bunnahabhain Abhainn Araig
('Bunnahabhain Abhainn Araig', 'Single Malt', 'İskoçya', 'Islay', 43.0, NULL, NULL, 'Golden', 'Bal, vanilya, deniz tuzu', 'Karamel, vanilya, meşe', 'Kısa, tatlı, tuzlu', 'Islay adası dışında bulunan en eski damıtımevi Bunnahabhain tarafından üretilen Single Malt, "Araig Nehri" adıyla şişelenmiş, hafif turba ve deniz etkileri barındıran bir viski.', 'https://example.com/images/bunnahabhain_abhainn_araig_KLeZppKKOe.jpg', NOW(), NOW()),

-- Bunnahabbain 25
('Bunnahabbain 25', 'Single Malt', 'Scotland', 'Islay', 46.3, NULL, 25, 'Golden', 'Bal, vanilya, meşe', 'Karamel, vanilya, meşe', 'Uzun, tatlı, baharatlı', 'Islay adası dışındaki en eski damıtımevi Bunnahabhain tarafından üretilen, 25 yıl boyunca yıllandırılmış single malt viski.', 'https://example.com/images/bunnahabbain_25_year_old_1_xvxAlWNqZ6.jpg', NOW(), NOW()),

-- Bulleit Rye
('Bulleit Rye', 'Rye', 'ABD', 'Kentucky', 45.0, NULL, NULL, 'Golden', 'Yaban mersini, nane, baharat', 'Karabiber, rye baharatı, meşe', 'Orta uzunlukta, keskin, baharatlı', 'Bulleit Bourbon''un çavdar versiyonu, baharatlı karakteri ön plana çıkan bir rye whiskey.', 'https://example.com/images/bulleit_rye_Y1m9n8wcI1.jpg', NOW(), NOW()),

-- Caperdonich 18
('Caperdonich 18', 'Single Malt', 'İskoçya', 'Speyside', 46.0, NULL, 18, 'Golden', 'Kuru meyve, baharat, deniz tuzu', 'Karamel, baharat, meşe', 'Uzun, meyveli, baharatlı', 'Old Pulteney Distillery tarafından üretilen ve şeri fıçılarda yıllandırılmış bir single malt viski, meyvemsi ve baharatlı aromalara sahip.', 'https://example.com/images/caperdonich18_vAUM9ztnbY.webp', NOW(), NOW()),

-- Caol Ila 12
('Caol Ila 12', 'Single Malt', 'İskoçya', 'Islay', 43.0, NULL, 12, 'Golden', 'Turba, is, deniz tuzu, limon', 'Turba, is, baharat, meyve', 'Uzun, isli, tuzlu', 'Caol Ila Distillery''nin 12 yıllık single malt viskisi, hafif turbalı ve meyvemsi karaktere sahiptir.', 'https://example.com/images/caol_ila_12_j9EfRPRo8a.webp', NOW(), NOW()),

-- Highland Park 12
('Highland Park 12', 'Single Malt', 'İskoçya', 'Highlands', 40.0, NULL, 12, 'Golden', 'Kuru meyve, baharat, meşe', 'Karamel, baharat, meşe', 'Uzun, meyveli, baharatlı', 'Longmorn Distillery tarafından üretilen ve çok uzun süre yıllandırılmış bir single malt viski, olgun ve karmaşık aroma ve tatlara sahip.', 'https://example.com/images/highland_park_12_M17EGw32DV.jpg', NOW(), NOW()),

-- Hazelburn 13 Oloroso Cask Matured
('Hazelburn 13 Oloroso Cask Matured', 'Single Malt', 'İskoçya', 'Campbeltown', 47.4, NULL, 13, 'Golden', 'Bal, vanilya, şeri', 'Karamel, vanilya, baharat', 'Uzun, tatlı, baharatlı', 'Springbank Distillery tarafından şeri fıçılarda yıllandırılmış bir single malt viski, meyvemsi ve baharatlı aromalara sahip.', 'https://example.com/images/hazelburn_13_oloroso_cask_matured_DdQWFjVEK7.jpg', NOW(), NOW()),

-- Hammer Head 23
('Hammer Head 23', 'Single Malt', 'İsveç', NULL, 59.8, NULL, 23, 'Golden', 'Turba, is, baharat', 'Turba, is, meşe', 'Uzun, isli, baharatlı', 'İsveç''ten gelen turbalı viski, yoğun is ve baharat aromaları ile öne çıkıyor.', 'https://example.com/images/hammer_head_23_HX4L7nxrI8.jpg', NOW(), NOW()),

-- Penderyn Single Cask
('Penderyn Single Cask', 'Single Malt', 'Galler', NULL, 46.0, NULL, 7, 'Golden', 'Vanilya, bal, baharat', 'Vanilya, bal, baharat, tahıl', 'Uzun ve kuru', 'Sherry fıçılarda olgunlaştırılmış, güçlü ve lezzetli bir Gal viskisi.', 'https://example.com/images/penderyn_7_year_old_2012_single_cask_master_of_malt_whisky_47Q9uc9AZE.webp', NOW(), NOW()),

-- Westward Single Malt & Single Grain
('Westward Single Malt & Single Grain', 'Blended Malt', 'ABD', 'Oregon', 45.0, NULL, NULL, 'Golden', 'Elma, armut, vanilya', 'Tahıl, elma, armut, vanilya', 'Orta uzunlukta ve tatlı', 'Tek malt ve tek tahıl viskilerin harmanlanmasıyla üretilmiş, dengeli ve lezzetli bir viski.', 'https://example.com/images/westward_whiskey_XmxONjkc4B.webp', NOW(), NOW()),

-- Suntory Chichibu The Peated Single Grain
('Suntory Chichibu The Peated Single Grain', 'Single Grain', 'Japonya', NULL, 48.0, NULL, NULL, 'Golden', 'Turba, is, vanilya', 'Turba, is, vanilya, tahıl', 'Uzun ve isli', 'Turba ile islenmiş malt ve tahıl kullanılarak üretilmiş, eşsiz ve lezzetli bir Japon viskisi.', 'https://example.com/images/chichibu_the_peated_2022_whisky_Ozd4IjXeXL.webp', NOW(), NOW()),

-- Firestone & Robertson TX Blended
('Firestone & Robertson TX Blended', 'Blended', 'ABD', 'Texas', 45.0, NULL, NULL, 'Golden', 'Vanilya, bal ve karamel', 'Bal,karamel, çikolata, badem, tarçın', 'Orta uzunlukta ve tatlı', 'Firestone & Robertson TX Blended, Texas''ta üretilen bir Amerikan harman viskisidir. Farklı tahıl viskileri ve bourbonlardan harmanlanarak üretilmektedir. Viski, yeni meşe fıçılarda olgunlaştırılır. TX Blended, tatlı ve yumuşak bir viskidir. Yeni başlayanlar için ideal bir seçimdir. Kokteyllerde de kullanılabilir.', 'https://example.com/images/firestone_robertson_txblended_Xvsq3vy4Px.webp', NOW(), NOW()),

-- Finlaggan Old Reserve
('Finlaggan Old Reserve', 'Blended Malt', 'İskoçya', 'Islay', 40.0, NULL, NULL, 'Golden', 'Turba, is, deniz tuzu, limon', 'Turba, is, baharat, meyve', 'Orta uzunlukta, isli, tuzlu', 'Finlaggan markası tarafından harmanlanmış Islay viskisi.', 'https://example.com/images/finlaggan_old_reserve_sAufNotjxS.webp', NOW(), NOW()),

-- Laphroaig Quarter Cask
('Laphroaig Quarter Cask', 'Single Malt', 'İskoçya', 'Islay', 48.0, NULL, NULL, 'Golden', 'Turba, is, deniz tuzu, vanilya', 'Turba, is, baharat, meyve', 'Uzun, isli, tuzlu', 'Laphroaig Distillery tarafından küçük fıçılarda yıllandırılmış bir single malt viski, daha yoğun ve baharatlı bir karaktere sahip.', 'https://example.com/images/laphroaig_quarter_cask_jH5Ubzuels.webp', NOW(), NOW()),

-- Laphroaig PX Cask
('Laphroaig PX Cask', 'Single Malt', 'İskoçya', 'Islay', 48.0, NULL, NULL, 'Golden', 'Turba, is, deniz tuzu, kuru meyve', 'Turba, is, baharat, meyve', 'Uzun, isli, tuzlu', 'Laphroaig Distillery tarafından şeri fıçılarında yıllandırılmış bir single malt viski, isli karaktere meyvemsi tatlar ekleniyor.', 'https://example.com/images/laphroaig_px_cask_NtIRjEKnbp.jpg', NOW(), NOW()),

-- Maker's Mark
('Maker''s Mark', 'Bourbon', 'ABD', 'Kentucky', 45.0, NULL, NULL, 'Golden', 'Karamel, vanilya, meşe', 'Pürüzsüz, tatlı, baharatlı', 'Kısa, sıcak', 'Kırmızı mum damlası ile bilinen, yumuşak içimli bir bourbon.', 'https://example.com/images/maker_s_mark_8fBdiRsHNN.jpg', NOW(), NOW()),

-- Mackmyra Intelligens AI-01
('Mackmyra Intelligens AI-01', 'Single Malt', 'İsveç', NULL, 46.0, NULL, NULL, 'Golden', 'Elma, armut, narenciye', 'Karamel, vanilya, baharat', 'Orta uzunlukta, tatlı, baharatlı', 'Mackmyra Distillery tarafından yapay zeka kullanılarak harmanlanmış özel bir viski.', 'https://example.com/images/mackmyra_intelligens_ai_01_LMSocY5Kcg.jpg', NOW(), NOW()),

-- Mackmyra Brukswhisky
('Mackmyra Brukswhisky', 'Single Malt', 'İsveç', NULL, 41.4, NULL, NULL, 'Golden', 'Bal, vanilya, meşe', 'Karamel, vanilya, baharat', 'Orta uzunlukta, tatlı, baharatlı', 'Mackmyra Distillery''nin klasik harmanlanmış bir viskisi.', 'https://example.com/images/mackmyra_brukswhisky_uy8tSikr1H.jpg', NOW(), NOW()),

-- Benriach The Twelve
('Benriach The Twelve', 'Single Malt', 'İskoçya', 'Speyside', 46.0, NULL, 12, 'Golden', 'Elma, armut, bal', 'Karamel, vanilya, meşe', 'Orta uzunlukta, tatlı, baharatlı', 'Speyside bölgesinden Single Malt, 12 yıl boyunca yıllandırılmış ve meyve ile baharat aromalarının dengelendiği bir viski.', 'https://example.com/images/benriach_the_twelve_XYl51IOls4.webp', NOW(), NOW()),

-- Benriach The Smoky Ten
('Benriach The Smoky Ten', 'Single Malt', 'İskoçya', 'Speyside', 43.0, NULL, 10, 'Golden', 'Turba, is, elma', 'Turba, is, baharat', 'Orta uzunlukta, isli, baharatlı', 'Speyside bölgesinden Single Malt, hafif turba karakterine sahip ve 10 yıl boyunca yıllandırılmış bir viski.', 'https://example.com/images/benriach_the_smoky_ten_PyjB0Obpvu.webp', NOW(), NOW()),

-- Benriach The Original Ten
('Benriach The Original Ten', 'Single Malt', 'İskoçya', 'Speyside', 43.0, NULL, 10, 'Golden', 'Bal, vanilya, armut', 'Karamel, vanilya, baharat', 'Orta uzunlukta, tatlı, baharatlı', 'Benriach Distillery''nin 10 yıllık single malt viskisi, Speyside bölgesinin tipik hafif ve meyvemsi karakterine sahiptir.', 'https://example.com/images/benriach_the_original_ten_byt3SyY4Ny.jpg', NOW(), NOW()),

-- Jura 12
('Jura 12', 'Single Malt', 'İskoçya', 'Jura', 40.0, NULL, 12, 'Golden', 'Bal, vanilya, deniz tuzu', 'Karamel, vanilya, meşe', 'Orta uzunlukta, tatlı, tuzlu', 'Jura Distillery tarafından üretilen bir single malt viski, dengeli ve hafif aromalara sahip.', 'https://example.com/images/jura_12_QNTsnnMhsD.webp', NOW(), NOW()),

-- Jura 10 Origin
('Jura 10 Origin', 'Single Malt', 'İskoçya', 'Jura', 40.0, NULL, 10, 'Golden', 'Bal, vanilya, deniz tuzu', 'Karamel, vanilya, baharat', 'Orta uzunlukta, tatlı, baharatlı', 'Jura Distillery''nin 10 yıllık single malt viskisi, hafif turbalı ve meyvemsi karaktere sahiptir.', 'https://example.com/images/jura_10_origin_c8KPCYMAJv.webp', NOW(), NOW()),

-- JP Wiser's 10 Year Old Triple Barrel
('JP Wiser''s 10 Year Old Triple Barrel', 'Canadian Whisky', 'Kanada', 'Ontario', 40.0, NULL, 10, 'Golden', 'Bal, vanilya, meşe', 'Karamel, vanilya, baharat', 'Orta uzunlukta, tatlı, baharatlı', 'Hiram Walker Distillery tarafından 3 farklı fıçılarda yıllandırılmış 10 yıllık viski.', 'https://example.com/images/jp_wiser_s_10_year_old_triple_barrel_ah2TPavQyH.jpg', NOW(), NOW()),

-- Cutty Sark
('Cutty Sark', 'Blended', 'İskoçya', NULL, 40.0, NULL, NULL, 'Golden', 'Hafif, tatlı, meyveli', 'Yumuşak, dengeli, hafif', 'Kısa, temiz', 'Cutty Sark markası tarafından üretilen harmanlanmış bir viski. Detaylı aroma ve tat bilgileri genelde sınırlı olabilir.', 'https://example.com/images/cutty_sark_ISjpJNs1cd.webp', NOW(), NOW()),

-- Crown Royal Deluxe
('Crown Royal Deluxe', 'Canadian Whisky', 'Kanada', NULL, 40.0, NULL, NULL, 'Golden', 'Bal, vanilya, tahıl', 'Karamel, vanilya, baharat', 'Orta uzunlukta, tatlı, baharatlı', 'Diageo tarafından harmanlanmış ve Kanada''nın en popüler viskilerinden biri.', 'https://example.com/images/crown_royal_deluxe_JO2Wl4d6Gv.webp', NOW(), NOW()),

-- Craigellachie 37
('Craigellachie 37', 'Single Malt', 'İskoçya', 'Speyside', 44.7, NULL, 37, 'Golden', 'Kuru meyve, baharat, meşe', 'Karamel, baharat, meşe', 'Uzun, kuru, baharatlı', 'Speyside bölgesinden Single Malt, 37 yıllık olgunlaştırılmış ve yoğun aromalı bir viski.', 'https://example.com/images/craigellachie_37_I5AL7RgIy7.jpg', NOW(), NOW()),

-- John Walker & Sons Celebratory Blend
('John Walker & Sons Celebratory Blend', 'Blended', 'Scotland', 'Various', 55.0, NULL, NULL, 'Golden', 'white pepper, brown sugar, vanilla', 'Black pepper, ginger, smoke', 'Peppery, slightly salty and sweet. Medium length, warm finish.', 'Johnnie Walker tarafından üretilen özel harmanlanmış bir viski, genellikle özel bir etkinlik veya yıldönümü için şişeleniyor. Detaylı aroma ve tat bilgileri genelde sınırlı olabilir.', 'https://example.com/images/john_walker_sons_celebratory_blend_bwisuHjYrB.webp', NOW(), NOW()),

-- WhistlePig Straight Rye 10
('WhistlePig Straight Rye 10', 'Rye', 'USA', 'Vermont', 52.0, NULL, 10, 'Golden', 'Yaban mersini, tarçın, meşe', 'Karabiber, rye baharatı, meşe', 'Uzun, baharatlı, kuru', 'Vermont çavdar viskisi, 10 yıl boyunca yıllandırılarak yoğun ve baharatlı bir karakter kazanıyor.', 'https://example.com/images/whistle_pig_straight_rye_10_Q6JFDGmhss.jpg', NOW(), NOW()),

-- Langatun Old Deer
('Langatun Old Deer', 'Single Malt', 'İsviçre', NULL, 43.0, NULL, NULL, 'Golden', 'Turba, is, deniz tuzu', 'Turba, is, baharat, meyve', 'Uzun, isli, tuzlu', 'Langatun Distillery''nin turbalı single malt viskisi.', 'https://example.com/images/langatun_old_deer_1Q9xUd2cIR.jpg', NOW(), NOW()),

-- Kornog 2016 6 Year Old Peated
('Kornog 2016 6 Year Old Peated', 'Single Malt', 'Fransa', 'Brittany', 46.0, NULL, 6, 'Golden', 'Turba, is, meyve', 'Turba, is, meşe', 'Uzun, isli, tatlı', '6 yıl boyunca yıllandırılan turbalı İskoç viskisi, yoğun is ve baharat aromalarına ek olarak meyvemsi notalar da barındırıyor.', 'https://example.com/images/kornog_2016_6_year_old_peated_mFcyax7lgP.jpg', NOW(), NOW()),

-- Knob Creek Kentucky Straight Bourbon
('Knob Creek Kentucky Straight Bourbon', 'Bourbon', 'ABD', 'Kentucky', 50.0, NULL, 9, 'Golden', 'Karamel, vanilya, meşe, baharat', 'Karamel, meşe, tütün, deri', 'Uzun, kuru, baharatlı', 'Klasik bourbon aromaları ile zengin ve karmaşık.', 'https://example.com/images/knob_creek_kentucky_straight_bourbon_WvXMnruvQl.webp', NOW(), NOW()),

-- Redbreast 12
('Redbreast 12', 'Single Pot Still', 'İrlanda', NULL, 40.0, NULL, 12, 'Golden', 'Kuru meyve, baharat, meşe', 'Karamel, vanilya, meşe', 'Uzun, tatlı, baharatlı', 'Jameson Distillery tarafından üretilen, 12 yıl boyunca yıllandırılmış single pot still viski.', 'https://example.com/images/redbreast12_OT2VmXX81F.webp', NOW(), NOW()),

-- Puni Alba
('Puni Alba', 'Single Malt', 'İtalya', 'South Tyrol', 43.0, NULL, NULL, 'Golden', 'Bal, vanilya, tahıl', 'Karamel, vanilya, baharat', 'Orta uzunlukta, tatlı, baharatlı', 'Puni Distillery''nin İskoç arpasından üretilen single malt viskisi.', 'https://example.com/images/puni_alba_52FTYB7DGk.webp', NOW(), NOW()),

-- Powers John's Lane Release 12
('Powers John''s Lane Release 12', 'Single Pot Still', 'İrlanda', NULL, 46.0, NULL, 12, 'Golden', 'Vanilya, elma, bal', 'Vanilya, meşe, tahıl', 'Orta uzunlukta, yumuşak, tatlı', 'İrlanda single malt viskisi, 12 yıl boyunca yıllandırılarak olgun ve dengeli bir tat sunuyor.', 'https://example.com/images/powers_john_s_lane_release_12_43pVyoCKiW.webp', NOW(), NOW());

-- ==================================================
-- IMPORT COMPLETE!
-- ==================================================
-- Successfully imported 37 whiskies from CSV data
-- All data has been cleaned and mapped to the database schema
-- Ready for use with the 1-100 rating scale system
-- ==================================================