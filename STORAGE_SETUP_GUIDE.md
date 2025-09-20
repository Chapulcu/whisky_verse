# 🪣 Storage Bucket Setup Rehberi

## 🚨 Mevcut Durum
`whisky_images` bucket'ı mevcut ama RLS policy hatası veriyor:
```
"new row violates row-level security policy"
```

## ✅ Çözüm Adımları

### 1. Supabase Dashboard'a Git
- [Supabase Dashboard](https://supabase.com/dashboard)
- Proje seç → **Storage**

### 2. Bucket Ayarları Kontrol Et
- `whisky_images` bucket'ının **PUBLIC** olarak ayarlandığından emin ol
- Bucket settings → Public bucket: **Enable**

### 3. Storage RLS Policies Uygula

**Dosya:** `sql-scripts/simple_storage_rls.sql`

Bu dosyayı Supabase Dashboard → SQL Editor'de çalıştır.

#### Script İçeriği:
- ✅ Authenticated users upload edebilir
- ✅ Herkes public dosyaları okuyabilir
- ✅ Users kendi dosyalarını yönetebilir
- ✅ Basit ve çalışır yaklaşım

### 4. Test Et

```bash
# Storage bucket test
node tests/test_storage_buckets.cjs
```

Beklenen sonuç:
```
✅ Upload successful to whisky_images
🔗 Public URL: https://...
✅ File is publicly accessible
```

## 📋 Bucket Yapısı

```
whisky_images/
├── whiskies/
│   ├── whisky_image_123.jpg
│   ├── whisky_image_456.png
│   └── ...
└── test/
    └── upload_test_*.png
```

## 🔧 Admin Panel Entegrasyonu

Storage setup tamamlandıktan sonra:

1. **Image Upload:** Admin panel'de resim seçimi çalışacak
2. **Whisky Creation:** Resimli viski oluşturma aktif olacak
3. **Image Management:** Resim güncelleme ve silme çalışacak

## 🧪 Test Senaryoları

### Manuel Test (Tarayıcıda):
1. Admin panel'e git: http://localhost:5173/
2. Admin login: admin@whiskyverse.com / Admin123!
3. "Add Whisky" butonuna tıkla
4. Resim seç ve viski bilgilerini doldur
5. Submit et

### Konsol Logları:
```
📤 Starting direct storage upload... image.jpg
🪣 Trying bucket: whisky_images
✅ Upload successful to whisky_images
🔗 Public URL: https://...
🥃 Creating whisky with data: {...}
✅ Whisky created successfully
```

## ⚠️ Troubleshooting

### Problem: "Bucket not found"
**Çözüm:** Bucket oluştur ve PUBLIC yap

### Problem: "RLS policy violation"
**Çözüm:** `simple_storage_rls.sql` çalıştır

### Problem: "Permission denied"
**Çözüm:** Admin olarak login ol

### Problem: "Upload hangs"
**Çözüm:** Network/CORS ayarları kontrol et

## 🎯 Sonuç

Storage setup tamamlandığında:
- ✅ Image upload: WORKING
- ✅ Whisky creation with images: WORKING
- ✅ Admin panel fully functional: WORKING

---

**Not:** Storage bucket setup bir kerelik işlemdir. Kurulum tamamlandığında tüm image upload özellikleri çalışır hale gelecek.