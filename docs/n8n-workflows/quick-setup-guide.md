# 🚀 n8n Viski Çeviri - Hızlı Kurulum Rehberi

## ⚡ 5 Dakikada Kurulum

### 1. n8n Kurulumu (2 dakika)
```bash
# Docker ile n8n başlat
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n

# Browser'da aç: http://localhost:5678
```

### 2. Workflow Import (1 dakika)
1. n8n'de **"Import from File"** seç
2. `docs/n8n-workflows/whisky-translation-workflow.json` dosyasını yükle
3. **"Save"** butonuna tıkla

### 3. Credentials Ayarı (2 dakika)

#### Supabase
```
Name: Supabase WhiskyVerse
Host: your_supabase_url
Database: postgres
User: postgres
Password: your_supabase_password
Service Role Key: your_service_role_key
```

#### OpenAI
```
Name: OpenAI Translator
API Key: your_openai_api_key
Organization: your_org_id (opsiyonel)
```

### 4. Test Çalışması (30 saniye)
1. **"Execute Workflow"** butonuna tıkla
2. **"Get Untranslated Whiskies"** node'unu kontrol et
3. Sonuç gelirse ✅, hata varsa 🔧 ayarları kontrol et

## 🔧 Hızlı Sorun Çözme

**Supabase Bağlantı Hatası:**
```sql
-- Service role key kontrolü
SELECT auth.uid() as user_id;
-- NULL dönerse, Service Role Key yanlış
```

**OpenAI API Hatası:**
```bash
# API key test
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.openai.com/v1/models
```

**Workflow Çalışmıyor:**
- Schedule'ı Manual trigger'a değiştir
- Her node'u tek tek test et
- Error logs'ları kontrol et

## 🎯 İlk Çalıştırma

1. **Manual Test:** Workflow'u manuel çalıştır
2. **Single Whisky:** Limit 1 ile test et
3. **Check Database:** whisky_translations tablosunu kontrol et
4. **Schedule Enable:** Günlük schedule'ı aktifleştir

## 📊 Hızlı Monitoring

```sql
-- Çeviri progress kontrolü
SELECT
  language_code,
  COUNT(*) as translated_count,
  translation_status
FROM whisky_translations
GROUP BY language_code, translation_status;

-- Son çeviriler
SELECT * FROM whisky_translations
ORDER BY updated_at DESC
LIMIT 10;
```

## 🚀 Production'a Geçiş

1. **Batch Size:** 50'ye çıkar
2. **Schedule:** Günlük 02:00'da ayarla
3. **Monitoring:** Webhook logging ekle
4. **Error Alerts:** Discord/Slack entegrasyonu

---

**Toplam Kurulum Süresi:** ~5 dakika
**İlk Çeviri Süresi:** ~2-3 dakika per viski
**Günlük Kapasite:** 1000+ viski çevirisi