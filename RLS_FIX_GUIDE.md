# 🔒 RLS Politikaları Düzeltme Rehberi

## 🚨 Mevcut Durum
WhiskyVerse uygulamasında RLS (Row Level Security) politikalarında **infinite recursion** hatası bulunmaktadır. Bu hata, veritabanı sorgularının çalışmamasına neden olmaktadır.

## 🔍 Problem
```
ERROR: infinite recursion detected in policy for relation "profiles"
```

Bu hata, `is_admin()` fonksiyonu ile profiles tablosu arasında circular dependency olduğunu gösterir.

## ✅ Çözüm

### 1. Supabase Dashboard'a Git
- [Supabase Dashboard](https://supabase.com/dashboard)
- Proje seç → SQL Editor

### 2. RLS Politikalarını Uygula

**Dosya:** `sql-scripts/safe_rls_policies_final.sql` ⭐ **GÜNCEL**

Bu dosyayı kopyala ve Supabase SQL Editor'de çalıştır.

#### Dosyanın İçeriği:
- ✅ Tüm eski policy'leri temizler
- ✅ Basit ve güvenli policy'ler ekler
- ✅ Admin override (admin@whiskyverse.com, akhantalip@gmail.com)
- ✅ Circular dependency sorunu yok
- ✅ OLD keyword hatası yok
- ✅ is_active sütun hatası düzeltildi
- ✅ Mevcut tablo yapısına uygun

### 3. Test Et

```bash
# RLS durumunu test et
node tests/apply_simple_rls.cjs

# Kapsamlı RLS testi
node tests/test_new_rls_policies.cjs
```

## 📋 Yeni RLS Politikaları

### Profiles Tablosu
- Kullanıcılar sadece kendi profillerini görebilir/düzenleyebilir
- Admin'ler tüm profillere erişebilir

### Whiskies Tablosu
- Herkes viski listesini görebilir
- Authenticated kullanıcılar viski ekleyebilir
- Kullanıcılar kendi ekledikleri viskiyi düzenleyebilir
- Admin'ler tüm viskileri düzenleyebilir

### User Collections (user_whiskies)
- Kullanıcılar sadece kendi koleksiyonlarını yönetebilir
- Admin'ler tüm koleksiyonları görebilir

### Groups & Events
- Aktif gruplar/etkinlikler herkese açık
- Kullanıcılar kendi oluşturdukları grup/etkinlikleri yönetebilir
- Admin'ler tüm grup/etkinlikleri yönetebilir

## 🛡️ Güvenlik Özellikleri

### Admin Kontrolü
```sql
CREATE OR REPLACE FUNCTION is_admin_email()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT auth.jwt() ->> 'email' IN (
        'admin@whiskyverse.com',
        'akhantalip@gmail.com'
    );
$$;
```

### User Isolation
- Her kullanıcı sadece kendi verilerine erişebilir
- Public veriler (whiskies, groups, events) herkese açık
- Private veriler (profiles, collections) korunmalı

## 🧪 Test Senaryoları

### Anonymous Kullanıcı
- ✅ Viski listesini görebilir
- ❌ Profilleri göremez
- ❌ Koleksiyonları göremez

### Regular Kullanıcı
- ✅ Kendi profilini yönetebilir
- ✅ Viski ekleyebilir/düzenleyebilir (kendi eklediği)
- ✅ Kendi koleksiyonunu yönetebilir
- ✅ Grup/etkinlik oluşturabilir
- ❌ Başkasının profiline erişemez

### Admin Kullanıcı
- ✅ Tüm profilleri yönetebilir
- ✅ Tüm viskileri yönetebilir
- ✅ Tüm koleksiyonları görebilir
- ✅ Tüm grup/etkinlikleri yönetebilir

## 🚀 Uygulama Sonrası

### 1. Uygulama Testleri
```bash
# Development server'ı başlat
npm run dev

# Tarayıcıda test et:
# - Giriş/çıkış
# - Viski listesi
# - Admin panel
# - Profil düzenleme
```

### 2. Fonksiyon Testleri
- Login/Logout
- Viski ekleme/düzenleme
- Profil güncelleme
- Admin operasyonları

### 3. Güvenlik Testleri
- Anonymous erişim sınırları
- User data isolation
- Admin privilege escalation

## 📝 Notlar

### Backup
RLS politikaları uygulanmadan önce mevcut state backup alınmıştır.

### Rollback
Eğer sorun yaşarsanız:
```sql
-- Tüm RLS policy'lerini devre dışı bırak
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE whiskies DISABLE ROW LEVEL SECURITY;
-- ... diğer tablolar
```

### Monitoring
- RLS policy performansını izleyin
- Slow query log'larını kontrol edin
- User feedback'i toplayın

## ⚠️ Önemli Uyarılar

1. **Production'da test edin** - RLS değişiklikleri kritik
2. **Backup alın** - Geri dönüş planınız olsun
3. **Kademeli uygulayın** - Önce test ortamında
4. **Monitor edin** - Performance impact'ini takip edin

## 🎯 Sonuç

Bu düzeltme sonrası:
- ✅ Infinite recursion hatası çözülecek
- ✅ Güvenlik artacak
- ✅ Performance iyileşecek
- ✅ Admin fonksiyonları düzgün çalışacak
- ✅ User data korunacak

---

**Hazırlayan:** Claude AI Assistant
**Tarih:** 2025-01-24
**Proje:** WhiskyVerse Community Platform