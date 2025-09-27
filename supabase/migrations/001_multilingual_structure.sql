-- Multilingual Database Structure Migration
-- This migration creates the necessary tables for supporting multiple languages

-- Languages table to manage supported languages
CREATE TABLE IF NOT EXISTS languages (
  code VARCHAR(2) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  native_name VARCHAR(50) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert supported languages
INSERT INTO languages (code, name, native_name, is_default, is_active) VALUES
('tr', 'Turkish', 'Türkçe', TRUE, TRUE),
('en', 'English', 'English', FALSE, TRUE),
('ru', 'Russian', 'Русский', FALSE, TRUE),
('bg', 'Bulgarian', 'Български', FALSE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Backup existing whiskies table
CREATE TABLE IF NOT EXISTS whiskies_backup AS 
SELECT * FROM whiskies;

-- Create new whiskies table structure (non-translatable data only)
CREATE TABLE IF NOT EXISTS whiskies_new (
  id BIGSERIAL PRIMARY KEY,
  alcohol_percentage DECIMAL(4,2) NOT NULL,
  image_url TEXT,
  country VARCHAR(100), -- We'll migrate this to country_code later
  region VARCHAR(100),   -- We'll migrate this to region_id later
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Whisky translations table (translatable content)
CREATE TABLE IF NOT EXISTS whisky_translations (
  id BIGSERIAL PRIMARY KEY,
  whisky_id BIGINT NOT NULL,
  language_code VARCHAR(2) NOT NULL REFERENCES languages(code),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  description TEXT,
  aroma TEXT,
  taste TEXT,
  finish TEXT,
  color VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique translation per whisky per language
  UNIQUE(whisky_id, language_code)
);

-- Add foreign key constraint after we migrate data
-- ALTER TABLE whisky_translations ADD CONSTRAINT fk_whisky_translations_whisky_id 
-- FOREIGN KEY (whisky_id) REFERENCES whiskies_new(id) ON DELETE CASCADE;

-- Countries table for multilingual country names
CREATE TABLE IF NOT EXISTS countries (
  code VARCHAR(2) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS country_translations (
  id BIGSERIAL PRIMARY KEY,
  country_code VARCHAR(2) NOT NULL REFERENCES countries(code),
  language_code VARCHAR(2) NOT NULL REFERENCES languages(code),
  name VARCHAR(100) NOT NULL,
  UNIQUE(country_code, language_code)
);

-- Regions table for multilingual region names
CREATE TABLE IF NOT EXISTS regions (
  id BIGSERIAL PRIMARY KEY,
  country_code VARCHAR(2) REFERENCES countries(code),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS region_translations (
  id BIGSERIAL PRIMARY KEY,
  region_id BIGINT NOT NULL REFERENCES regions(id),
  language_code VARCHAR(2) NOT NULL REFERENCES languages(code),
  name VARCHAR(100) NOT NULL,
  UNIQUE(region_id, language_code)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whisky_translations_whisky_id ON whisky_translations(whisky_id);
CREATE INDEX IF NOT EXISTS idx_whisky_translations_language ON whisky_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_whisky_translations_name ON whisky_translations(name);
CREATE INDEX IF NOT EXISTS idx_country_translations_country ON country_translations(country_code);
CREATE INDEX IF NOT EXISTS idx_region_translations_region ON region_translations(region_id);
CREATE INDEX IF NOT EXISTS idx_whiskies_created_at ON whiskies_new(created_at);

-- Insert some common countries
INSERT INTO countries (code) VALUES 
('TR'), ('US'), ('GB'), ('IE'), ('CA'), ('JP'), ('IN'), ('TW'), ('FR'), ('DE')
ON CONFLICT (code) DO NOTHING;

-- Insert country translations
INSERT INTO country_translations (country_code, language_code, name) VALUES
-- Turkey
('TR', 'tr', 'Türkiye'),
('TR', 'en', 'Turkey'),
('TR', 'ru', 'Турция'),
('TR', 'bg', 'Турция'),
-- USA
('US', 'tr', 'Amerika Birleşik Devletleri'),
('US', 'en', 'United States'),
('US', 'ru', 'Соединённые Штаты'),
('US', 'bg', 'Съединени щати'),
-- UK
('GB', 'tr', 'Birleşik Krallık'),
('GB', 'en', 'United Kingdom'),
('GB', 'ru', 'Великобритания'),
('GB', 'bg', 'Обединеното кралство'),
-- Ireland
('IE', 'tr', 'İrlanda'),
('IE', 'en', 'Ireland'),
('IE', 'ru', 'Ирландия'),
('IE', 'bg', 'Ирландия'),
-- Canada
('CA', 'tr', 'Kanada'),
('CA', 'en', 'Canada'),
('CA', 'ru', 'Канада'),
('CA', 'bg', 'Канада'),
-- Japan
('JP', 'tr', 'Japonya'),
('JP', 'en', 'Japan'),
('JP', 'ru', 'Япония'),
('JP', 'bg', 'Япония'),
-- India
('IN', 'tr', 'Hindistan'),
('IN', 'en', 'India'),
('IN', 'ru', 'Индия'),
('IN', 'bg', 'Индия'),
-- Taiwan
('TW', 'tr', 'Tayvan'),
('TW', 'en', 'Taiwan'),
('TW', 'ru', 'Тайвань'),
('TW', 'bg', 'Тайван'),
-- France
('FR', 'tr', 'Fransa'),
('FR', 'en', 'France'),
('FR', 'ru', 'Франция'),
('FR', 'bg', 'Франция'),
-- Germany
('DE', 'tr', 'Almanya'),
('DE', 'en', 'Germany'),
('DE', 'ru', 'Германия'),
('DE', 'bg', 'Германия')
ON CONFLICT (country_code, language_code) DO NOTHING;
