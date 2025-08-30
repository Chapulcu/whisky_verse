# 🔧 pgAdmin Kurulum Rehberi

## 🌐 Erişim

- **pgAdmin Web**: http://localhost:8080
- **Giriş Email**: admin@example.com
- **Giriş Şifre**: admin123

## ⚙️ PostgreSQL Server Ekleme

### 1. pgAdmin'e Giriş Yap
1. http://localhost:8080 adresine git
2. Email: `admin@example.com`
3. Şifre: `admin123`

### 2. Server Ekle
1. Sol panelde "Servers" üzerine sağ tıkla
2. "Register" → "Server" seçeneğini tıkla

### 3. Server Ayarları

**General Tab:**
- Name: `Local Supabase`
- Server Group: `Servers` (varsayılan)

**Connection Tab:**
- Host: `postgres`
- Port: `5432`
- Maintenance database: `postgres`
- Username: `postgres`
- Password: `whisky-super-secret-password-2025`

### 4. Kaydet
"Save" butonuna tıklayarak bağlantıyı kaydet.

## 📊 Kullanım

### Verileri Görüntüleme
1. Sol panelde: `Local Supabase` → `Databases` → `postgres` → `Schemas` → `public` → `Tables`
2. `profiles` tablosuna sağ tıkla
3. "View/Edit Data" → "All Rows"

### SQL Sorguları Çalıştırma
1. Sol panelde `Local Supabase` üzerinde sağ tıkla
2. "Query Tool" seçeneğini tıkla
3. SQL sorgularını yazıp çalıştır

## 🎯 Örnek Sorgular

```sql
-- Tüm kullanıcıları görüntüle
SELECT * FROM profiles;

-- Sadece admin kullanıcıları
SELECT * FROM profiles WHERE role = 'admin';

-- Yeni kullanıcı ekle
INSERT INTO profiles (email, full_name, role, language) 
VALUES ('test@example.com', 'Test User', 'user', 'tr');
```

## 🔄 Diğer Erişim Yöntemleri

- **Web App**: http://localhost:5175
- **REST API**: http://localhost:3002/profiles
- **Direct PostgreSQL**: localhost:5433