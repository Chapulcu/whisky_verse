# 🖼️ Arka Plan Yönetimi Kurulum Rehberi

## 📋 Gerekli Veritabanı Kurulumu

### 1. `site_background_settings` Tablosu

Supabase SQL editöründe aşağıdaki kodu çalıştırın:

```sql
-- Create site_background_settings table
CREATE TABLE IF NOT EXISTS public.site_background_settings (
    id BIGSERIAL PRIMARY KEY,
    light_background_url TEXT,
    dark_background_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.site_background_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage backgrounds
CREATE POLICY "Admins can manage background settings" ON public.site_background_settings
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create policy for everyone to read background settings
CREATE POLICY "Everyone can read background settings" ON public.site_background_settings
    FOR SELECT USING (is_active = true);

-- Create function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_site_background_settings_updated_at
    BEFORE UPDATE ON public.site_background_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Storage Bucket Kurulumu

Supabase Storage bölümünde:

1. **Yeni bucket oluşturun:**
   - Bucket adı: `site-assets`
   - Public bucket: ✅ Aktif
   - File size limit: 50MB
   - Allowed MIME types: `image/*`

2. **Bucket politikalarını ayarlayın:**

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload site assets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'site-assets' AND
        auth.role() = 'authenticated'
    );

-- Allow everyone to view files
CREATE POLICY "Anyone can view site assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'site-assets');

-- Allow admins to delete files
CREATE POLICY "Admins can delete site assets" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'site-assets' AND
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );
```

## ✨ Özellikler

### 🎨 Admin Panel Özellikleri
- **Tema Bazlı Yükleme**: Açık ve koyu tema için ayrı arka planlar
- **Dosya Validasyonu**: Maksimum 5MB, sadece resim dosyaları
- **Önizleme**: Yükleme öncesi canlı önizleme
- **Kolay Silme**: Tek tık ile arka plan kaldırma

### 🖥️ Görüntüleme Sistemi
- **Otomatik Tema Algılama**: Sistem temasına göre dinamik arka plan
- **Responsive Tasarım**: Mobil ve masaüstü uyumlu
- **Performans Optimizasyonu**: Lazy loading ve cache sistemi
- **Varsayılan Fallback**: Resim yoksa grid arka plan

### 📱 Responsive Özellikler
- **Mobil Optimizasyon**: `background-attachment: scroll` mobilde
- **Tablet Uyumlu**: Orta ekranlar için optimizasyon
- **Retina Desteği**: Yüksek çözünürlük ekranlar
- **Touch Friendly**: Dokunmatik cihazlar için optimize

## 🚀 Kullanım

1. **Admin Paneline Giriş**: `/admin` -> "Arka Plan" sekmesi
2. **Resim Yükleme**: "Yükle" butonuna tıklayıp resim seçin
3. **Önizleme**: Yükleme öncesi canlı önizleme görebilirsiniz
4. **Silme**: "Kaldır" butonuyla arka planı silebilirsiniz
5. **Tema Değişimi**: Site otomatik olarak tema değişimlerini algılar

## 🔧 Teknik Detaylar

### Dosya Sistemi
```
/site-assets/backgrounds/
├── light-background-{timestamp}.{ext}
└── dark-background-{timestamp}.{ext}
```

### CSS Sınıfları
- `.cyber-bg`: Temel grid arka plan
- `.cyber-bg[style*="background-image"]`: Özel arka plan stilleri
- `.backdrop-blur-overlay`: Okunabilirlik overlay'i

### Hook Kullanımı
```typescript
const { 
  getCurrentBackgroundUrl,
  uploadBackgroundImage,
  removeBackgroundImage 
} = useBackgroundManagement()
```

## 🛡️ Güvenlik

- ✅ RLS (Row Level Security) aktif
- ✅ Sadece adminler arka plan yönetebilir
- ✅ Dosya tipi ve boyut validasyonu
- ✅ Secure URL'ler (CDN üzerinden)
- ✅ Otomatik dosya temizleme

## 📊 Performans

- **Image Optimization**: WebP desteği
- **CDN Delivery**: Supabase CDN üzerinden
- **Cache Control**: 1 saat cache süresi
- **Mobile Optimized**: Mobilde scroll attach