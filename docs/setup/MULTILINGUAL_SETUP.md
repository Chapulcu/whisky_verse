# 🌐 Çoklu Dil + N8N Otomasyonu Kurulum Rehberi

## 📋 Genel Bakış

Bu sistem, viski bilgilerini otomatik olarak İngilizce ve Rusça'ya çeviren N8N tabanlı bir otomasyon sistemidir.

### 🎯 Özellikler
- ✅ Otomatik çeviri (Türkçe → İngilizce, Rusça)
- ✅ OpenAI GPT-4 + Google Translate yedekleme
- ✅ Kalite kontrolü ve puanlama
- ✅ Real-time durum takibi
- ✅ Başarısız çevirileri yeniden deneme
- ✅ Webhook tabanlı bildirimler

---

## 1️⃣ Database Setup (Supabase)

### Adım 1: SQL Schema'yı Çalıştır
```bash
# Database schema dosyasını Supabase SQL Editor'de çalıştır
cat database/multilingual-schema.sql
```

### Adım 2: RLS Policies Ekle
```sql
-- whisky_translations için RLS
ALTER TABLE whisky_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Çevirileri herkes görüntüleyebilir" ON whisky_translations
    FOR SELECT USING (true);

CREATE POLICY "Kimlik doğrulamalı kullanıcılar çeviri ekleyebilir" ON whisky_translations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Kimlik doğrulamalı kullanıcılar çeviri güncelleyebilir" ON whisky_translations
    FOR UPDATE USING (auth.role() = 'authenticated');

-- translation_jobs için RLS
ALTER TABLE translation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Çeviri işlerini herkes görüntüleyebilir" ON translation_jobs
    FOR SELECT USING (true);

CREATE POLICY "Kimlik doğrulamalı kullanıcılar iş oluşturabilir" ON translation_jobs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### Adım 3: Edge Functions Deploy Et
```bash
# Supabase CLI ile Edge Functions deploy et
supabase functions deploy trigger-translation
supabase functions deploy translation-callback

# Environment variables set et
supabase secrets set N8N_WEBHOOK_URL="https://your-n8n-instance.com/webhook/whisky-translation"
supabase secrets set OPENAI_API_KEY="your-openai-api-key"
```

---

## 2️⃣ N8N Workflow Setup

### Adım 1: N8N Instance Kur
```bash
# Docker ile N8N çalıştır
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=your-secure-password \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

### Adım 2: Workflow Import Et
1. N8N arayüzüne gir (`http://localhost:5678`)
2. **Import** → **From File** → `n8n/translation-workflow.json`
3. Workflow'u aktive et

### Adım 3: Credentials Konfigüre Et
```json
{
  "openai_api_key": "your-openai-api-key",
  "google_translate_key": "your-google-translate-key",
  "supabase_url": "https://your-project.supabase.co",
  "supabase_service_key": "your-service-role-key"
}
```

### Adım 4: Webhook URL'ini Al
- Workflow'daki **Webhook** node'una tıkla
- **Webhook URL**'ini kopyala
- Supabase secrets'e ekle

---

## 3️⃣ Frontend Integration

### Adım 1: Çeviri Hook'unu Kullan
```typescript
import { useAutoTranslation } from '@/hooks/useAutoTranslation'

function WhiskyEditForm({ whiskyId }: { whiskyId: number }) {
  const { triggerTranslation, loading } = useAutoTranslation()
  
  const handleAutoTranslate = async () => {
    try {
      await triggerTranslation(whiskyId, ['en', 'ru'])
    } catch (error) {
      console.error('Translation failed:', error)
    }
  }
  
  return (
    <button 
      onClick={handleAutoTranslate}
      disabled={loading}
      className="btn-primary"
    >
      {loading ? 'Çevriliyor...' : 'Otomatik Çeviri'}
    </button>
  )
}
```

### Adım 2: Çeviri Durumu Takip Et
```typescript
const { checkTranslationStatus, translationStatus } = useAutoTranslation()

useEffect(() => {
  const interval = setInterval(() => {
    checkTranslationStatus(whiskyId)
  }, 5000) // Her 5 saniyede kontrol et
  
  return () => clearInterval(interval)
}, [whiskyId])
```

---

## 4️⃣ Kullanım Senaryoları

### 🔄 Otomatik Çeviri
```typescript
// Yeni viski eklendiğinde otomatik çeviri tetikle
const { data: newWhisky } = await supabase
  .from('whiskies')
  .insert({
    name: 'Yeni Viski',
    description: 'Açıklama...',
    // ... diğer alanlar
  })
  .select()
  .single()

// Çeviri tetikle
await triggerTranslation(newWhisky.id)
```

### 🔍 Çeviri Kalitesi Kontrol
```typescript
const { evaluateTranslationQuality } = useAutoTranslation()

const translations = await getTranslations(whiskyId, 'en')
const quality = evaluateTranslationQuality(translations[0])

console.log(`Kalite Puanı: ${quality.score}`)
console.log(`Sorunlar: ${quality.issues.join(', ')}`)
console.log(`Öneriler: ${quality.recommendations.join(', ')}`)
```

### 🔄 Başarısız Çevirileri Yeniden Dene
```typescript
await retryFailedTranslations(whiskyId)
```

---

## 5️⃣ Monitoring & Debugging

### Log Takibi
```sql
-- Çeviri işlerinin durumunu kontrol et
SELECT 
  wt.whisky_id,
  w.name,
  wt.target_language,
  wt.status,
  wt.translation_quality,
  wt.error_message,
  wt.created_at,
  wt.updated_at
FROM translation_jobs wt
JOIN whiskies w ON w.id = wt.whisky_id
ORDER BY wt.created_at DESC
LIMIT 50;

-- Çeviri kalitesi istatistikleri
SELECT 
  language_code,
  COUNT(*) as total_translations,
  AVG(translation_quality) as avg_quality,
  COUNT(CASE WHEN is_complete THEN 1 END) as complete_translations
FROM whisky_translations
GROUP BY language_code;
```

### N8N Logs
- N8N arayüzünde **Executions** sekmesinden workflow çalıştırmalarını kontrol et
- Hata durumlarında **Error Details** bölümünü incele

### Supabase Logs
```bash
supabase functions logs trigger-translation
supabase functions logs translation-callback
```

---

## 6️⃣ Troubleshooting

### ❌ "Çoklu dil yapısı henüz kurulmamış" Hatası
**Çözüm:** Database schema'yı çalıştırdığından emin ol:
```bash
psql -h db.your-project.supabase.co -U postgres -d postgres -f database/multilingual-schema.sql
```

### ❌ N8N Webhook Çalışmıyor
**Kontrol Et:**
1. N8N instance çalışıyor mu?
2. Webhook URL doğru mu?
3. CORS ayarları doğru mu?

### ❌ Çeviri Kalitesi Düşük
**Çözümler:**
1. OpenAI model'ini güncellenmiş versiyona çevir
2. Prompt'u optimize et
3. Google Translate yedekleme sistemini aktive et

---

## 7️⃣ Güvenlik Notları

### API Key Güvenliği
- API key'leri environment variable olarak sakla
- Production'da Supabase Vault kullan
- Key rotation planı yap

### Rate Limiting
- OpenAI API limitlerine dikkat et
- N8N workflow'larında retry logic ekle
- Çeviri sayısını monitör et

---

## 8️⃣ Performance Optimizasyon

### Batch Processing
```typescript
// Birden fazla viskiyi aynı anda çevir
const whiskyIds = [1, 2, 3, 4, 5]
await Promise.all(
  whiskyIds.map(id => triggerTranslation(id, ['en', 'ru'], 3))
)
```

### Cache Strategy
- Redis cache ekle
- CDN ile static content cache et
- Database query optimization

---

## 📞 Destek

Sorun yaşadığınızda:
1. Logs'ları kontrol edin
2. Database bağlantısını test edin
3. N8N workflow status'unu kontrol edin
4. GitHub issues açın

**📚 Daha fazla bilgi için:**
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [N8N Automation Docs](https://docs.n8n.io/)
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)