# Auth Debug Rehberi

## 1. Giriş Sorunu Teşhis

Uygulamaya http://localhost:5173 adresinden girmeyi deneyin.

## 2. Browser Console Kontrol

F12'ye basın, Console sekmesine gidin ve hataları kontrol edin.

## 3. Test Kullanıcısı Oluşturma

Giriş sayfasında "Kayıt Ol" seçeneğini kullanarak yeni bir hesap oluşturun:

- Email: test@example.com
- Şifre: 123456
- Ad Soyad: Test Kullanıcı

## 4. Admin Kullanıcısı Oluşturma

Eğer normal kullanıcı oluşturuluyorsa, database'de manual olarak rol değiştirebilirsiniz:

1. Supabase Dashboard > Table Editor > profiles
2. Oluşturulan kullanıcıyı bulun
3. "role" alanını "admin" olarak değiştirin

## 5. Yaygın Sorunlar ve Çözümler

### Email Doğrulama
- Supabase email doğrulama aktifse, email'inizi kontrol edin
- Dashboard > Authentication > Settings > Email templates

### Network Sorunu
- Supabase URL'si çalışıyor mu: https://pznuleevpgklxuuojcpy.supabase.co
- API key doğru mu

### Database Sorunu
- profiles tablosu var mı
- RLS (Row Level Security) ayarları

## 6. Hızlı Test

Browser console'da şu kodu çalıştırın:

```javascript
// Supabase bağlantı testi
fetch('https://pznuleevpgklxuuojcpy.supabase.co/rest/v1/', {
  headers: {
    'apikey': '**REDACTED_TOKEN**
  }
}).then(r => r.json()).then(console.log)
```

## 7. Supabase Dashboard Kontrol

1. https://supabase.com/dashboard
2. Projenizi açın 
3. Authentication > Users - kullanıcılar görünüyor mu?
4. Table Editor > profiles - profiller var mı?

Hangi adımda sorun yaşıyorsunuz, bana bildirin.