# 📊 Veritabanı Yönetim Komutları

## PostgreSQL Komutları

### Veritabanına Bağlan
```bash
docker compose exec postgres psql -U postgres -d postgres
```

### Tabloları Listele
```sql
\dt
```

### Profil Verilerini Gör
```sql
SELECT * FROM profiles;
```

### Yeni Kullanıcı Ekle
```sql
INSERT INTO profiles (email, full_name, role, language) 
VALUES ('yeni@email.com', 'Yeni Kullanıcı', 'user', 'tr');
```

### Kullanıcı Güncelle
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'yeni@email.com';
```

## REST API Komutları

### Tüm Profilleri Getir
```bash
curl http://localhost:3002/profiles
```

### Belirli Alanları Getir
```bash
curl "http://localhost:3002/profiles?select=email,full_name,role"
```

### Admin Kullanıcıları Getir
```bash
curl "http://localhost:3002/profiles?role=eq.admin"
```

## Docker Komutları

### Servisleri Başlat
```bash
docker compose up -d
```

### Servisleri Durdur
```bash
docker compose down
```

### Logları Görüntüle
```bash
docker compose logs -f postgres
```

### Veritabanı Yedekle
```bash
docker compose exec postgres pg_dump -U postgres postgres > backup.sql
```

## Uygulama Erişimi

- **Web Uygulaması**: http://localhost:5175
- **API Endpoint**: http://localhost:3002
- **PostgreSQL**: localhost:5433