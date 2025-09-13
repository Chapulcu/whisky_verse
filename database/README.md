# Database Setup for Groups and Events

## New Features Added

Admin sayfasına Grup ve Etkinlik yönetimi eklendi. Bu özellikler şunları içerir:

### Grup Yönetimi
- Grup oluşturma, düzenleme ve silme
- Gizlilik seviyeleri (Herkese Açık, Özel, Sadece Üyeler)
- Kategori sistemi
- Üye sayısı takibi
- Maksimum üye limiti

### Etkinlik Yönetimi
- Etkinlik oluşturma, düzenleme ve silme
- Tarih ve saat yönetimi
- Konum ve online link desteği
- Fiyat ve para birimi ayarları
- Gruplara bağlı etkinlikler
- Katılımcı sayısı takibi

## Database Changes

Yeni tablolar eklendi:
- `groups` - Grup bilgileri
- `group_members` - Grup üyelikleri
- `events` - Etkinlik bilgileri
- `event_participants` - Etkinlik katılımcıları

## Kurulum

### 1. Supabase'de SQL Çalıştırma

Supabase dashboard'una gidip SQL Editor'da aşağıdaki dosyayı çalıştırın:

```sql
-- groups-events-tables.sql dosyasının içeriğini buraya kopyalayın
```

### 2. Alternatif: CLI ile Kurulum

Eğer Supabase CLI kullanıyorsanız:

```bash
# Supabase'e bağlanın
supabase login

# Migration olarak uygulayın
supabase db push --db-url "your-database-url"
```

### 3. Doğrulama

Kurulumun başarılı olup olmadığını kontrol etmek için:

```sql
-- Tablolar oluşturulmuş mu kontrol et
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('groups', 'group_members', 'events', 'event_participants');

-- Test verilerinin yüklendiğini kontrol et
SELECT COUNT(*) FROM groups;
SELECT COUNT(*) FROM events;
```

## Test Verisi

Kurulum sırasında otomatik olarak test verisi eklenir:
- 3 örnek grup
- 3 örnek etkinlik

## Kullanım

1. Admin paneline girin (`/admin`)
2. "Grup Yönetimi" ve "Etkinlik Yönetimi" sekmelerini görün
3. Yeni grup veya etkinlik oluşturun
4. Mevcut grupları ve etkinlikleri düzenleyin/silin

## Güvenlik

- Row Level Security (RLS) politikaları aktif
- Admin yetkili kullanıcılar tüm CRUD işlemlerini yapabilir
- Normal kullanıcılar sadece okuma yetkisine sahip
- Kullanıcılar kendi üyeliklerini yönetebilir

## Sorun Giderme

### Hata: "relation does not exist"
- Database migration'ının doğru çalıştırıldığından emin olun
- Supabase project'inizde doğru veritabanına bağlandığınızdan emin olun

### Hata: "permission denied"
- RLS politikalarının doğru kurulduğundan emin olun
- Admin kullanıcısı ile giriş yapın

### Test Verisi Görünmüyor
- Admin kullanıcısı (`admin@whiskyverse.com`) ile giriş yapın
- Veritabanında admin kullanıcısının mevcut olduğundan emin olun