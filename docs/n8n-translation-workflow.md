# 🤖 n8n AI Agent Viski Çeviri Workflow Dokümantasyonu

## 📋 Genel Bakış

Bu workflow, Supabase'deki viski verilerini AI Agent kullanarak otomatik olarak Türkçe'den İngilizce ve Rusça'ya çevirir. Her viski teker teker işlenir ve çeviriler `whisky_translations` tablosuna kaydedilir.

## 🎯 Workflow Amacı

- Supabase `whiskies` tablosundaki Türkçe viskiler
- AI Agent ile EN + RU çevirisi
- `whisky_translations` tablosuna otomatik kayıt
- Hata yönetimi ve logging

## 🔧 Workflow Yapısı

### Node Dizilimi
```
1. Schedule Trigger (Günlük/Haftalık)
2. Supabase Query (Çevrilmemiş viskiler)
3. Split in Batches (Her viski ayrı işlem)
4. AI Agent (ChatGPT/Claude çeviri)
5. JSON Parse (Çeviri sonucu ayrıştır)
6. Loop - Language Processing
7. Supabase Insert (Translation kaydet)
8. Error Handler
9. Completion Log
```

## 📊 Detaylı Node Konfigürasyonları

### 1. Schedule Trigger Node
```json
{
  "type": "Schedule Trigger",
  "name": "Daily Translation Job",
  "settings": {
    "rule": {
      "interval": [
        {
          "field": "cronExpression",
          "value": "0 2 * * *"
        }
      ]
    }
  }
}
```

### 2. Supabase Query Node
```json
{
  "type": "Supabase",
  "name": "Get Untranslated Whiskies",
  "settings": {
    "operation": "Custom Query",
    "query": "SELECT id, name, description, aroma, taste, finish, color, region, type FROM whiskies WHERE id NOT IN (SELECT DISTINCT whisky_id FROM whisky_translations WHERE language_code IN ('en', 'ru')) ORDER BY id LIMIT 50"
  }
}
```

### 3. Split in Batches Node
```json
{
  "type": "Split in Batches",
  "name": "Process Each Whisky",
  "settings": {
    "batchSize": 1,
    "options": {
      "reset": false
    }
  }
}
```

### 4. AI Agent Node (OpenAI/Claude)
```json
{
  "type": "OpenAI",
  "name": "AI Translator",
  "settings": {
    "model": "gpt-4o-mini",
    "temperature": 0.1,
    "maxTokens": 2000,
    "prompt": "Sen uzman bir viski çevirmensin. Aşağıdaki viski bilgilerini profesyonel şekilde İngilizce ve Rusça'ya çevir. Viski terminolojisini koru ve tutarlı ol.\n\nViski Bilgileri:\n- İsim: {{$json.name}}\n- Açıklama: {{$json.description}}\n- Aroma: {{$json.aroma}}\n- Tat: {{$json.taste}}\n- Final: {{$json.finish}}\n- Renk: {{$json.color}}\n- Bölge: {{$json.region}}\n- Tip: {{$json.type}}\n\nSadece aşağıdaki JSON formatında cevap ver:\n{\n  \"en\": {\n    \"name\": \"...\",\n    \"description\": \"...\",\n    \"aroma\": \"...\",\n    \"taste\": \"...\",\n    \"finish\": \"...\",\n    \"color\": \"...\",\n    \"region\": \"...\",\n    \"type\": \"...\"\n  },\n  \"ru\": {\n    \"name\": \"...\",\n    \"description\": \"...\",\n    \"aroma\": \"...\",\n    \"taste\": \"...\",\n    \"finish\": \"...\",\n    \"color\": \"...\",\n    \"region\": \"...\",\n    \"type\": \"...\"\n  }\n}"
  }
}
```

### 5. JSON Parse Node
```json
{
  "type": "Code",
  "name": "Parse AI Response",
  "settings": {
    "mode": "runOnceForAllItems",
    "jsCode": "const aiResponse = items[0].json.response;\nconst whiskyId = items[0].json.id;\n\ntry {\n  const translations = JSON.parse(aiResponse);\n  \n  const results = [];\n  \n  // English translation\n  if (translations.en) {\n    results.push({\n      whisky_id: whiskyId,\n      language_code: 'en',\n      source_language_code: 'tr',\n      name: translations.en.name || '',\n      description: translations.en.description || null,\n      aroma: translations.en.aroma || null,\n      taste: translations.en.taste || null,\n      finish: translations.en.finish || null,\n      color: translations.en.color || null,\n      region: translations.en.region || null,\n      type: translations.en.type || null,\n      translation_status: 'machine',\n      quality_score: 0.8\n    });\n  }\n  \n  // Russian translation\n  if (translations.ru) {\n    results.push({\n      whisky_id: whiskyId,\n      language_code: 'ru',\n      source_language_code: 'tr',\n      name: translations.ru.name || '',\n      description: translations.ru.description || null,\n      aroma: translations.ru.aroma || null,\n      taste: translations.ru.taste || null,\n      finish: translations.ru.finish || null,\n      color: translations.ru.color || null,\n      region: translations.ru.region || null,\n      type: translations.ru.type || null,\n      translation_status: 'machine',\n      quality_score: 0.8\n    });\n  }\n  \n  return results;\n} catch (error) {\n  console.error('JSON Parse Error:', error);\n  return [{\n    error: true,\n    whisky_id: whiskyId,\n    message: 'AI response could not be parsed'\n  }];\n}"
  }
}
```

### 6. Split Translations Node
```json
{
  "type": "Split in Batches",
  "name": "Split Languages",
  "settings": {
    "batchSize": 1,
    "options": {
      "reset": false
    }
  }
}
```

### 7. Supabase Insert Node
```json
{
  "type": "Supabase",
  "name": "Insert Translation",
  "settings": {
    "operation": "Insert",
    "table": "whisky_translations",
    "columns": {
      "whisky_id": "={{$json.whisky_id}}",
      "language_code": "={{$json.language_code}}",
      "source_language_code": "={{$json.source_language_code}}",
      "name": "={{$json.name}}",
      "description": "={{$json.description}}",
      "aroma": "={{$json.aroma}}",
      "taste": "={{$json.taste}}",
      "finish": "={{$json.finish}}",
      "color": "={{$json.color}}",
      "region": "={{$json.region}}",
      "type": "={{$json.type}}",
      "translation_status": "={{$json.translation_status}}",
      "quality_score": "={{$json.quality_score}}"
    }
  }
}
```

### 8. Error Handler Node
```json
{
  "type": "If",
  "name": "Check for Errors",
  "settings": {
    "conditions": {
      "boolean": [
        {
          "value1": "={{$json.error}}",
          "operation": "equal",
          "value2": true
        }
      ]
    }
  }
}
```

### 9. Logging Node
```json
{
  "type": "HTTP Request",
  "name": "Log to Webhook",
  "settings": {
    "method": "POST",
    "url": "YOUR_LOGGING_WEBHOOK_URL",
    "sendBody": true,
    "bodyParameters": {
      "timestamp": "={{new Date().toISOString()}}",
      "whisky_id": "={{$json.whisky_id}}",
      "status": "success",
      "languages_translated": ["en", "ru"]
    }
  }
}
```

## 🚀 Kurulum Adımları

### 1. n8n Kurulumu
```bash
# Docker ile n8n kurulumu
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

### 2. Credential Ayarları

#### Supabase Credentials
```json
{
  "name": "Supabase WhiskyVerse",
  "type": "Supabase",
  "data": {
    "host": "YOUR_SUPABASE_URL",
    "serviceRole": "YOUR_SUPABASE_SERVICE_ROLE_KEY"
  }
}
```

#### OpenAI Credentials
```json
{
  "name": "OpenAI Translator",
  "type": "OpenAI",
  "data": {
    "apiKey": "YOUR_OPENAI_API_KEY",
    "organization": "YOUR_ORG_ID"
  }
}
```

### 3. Database Hazırlığı
```sql
-- whisky_translations tablosunun varlığını kontrol et
SELECT * FROM information_schema.tables
WHERE table_name = 'whisky_translations';

-- Gerekirse tabloyu oluştur
-- (docs/upgplans/sql/001_whisky_translations.sql dosyasını çalıştır)
```

## 📊 Monitoring ve Logging

### Workflow Metrics
- **İşlenen viski sayısı:** `{{$totalItems}}`
- **Başarılı çeviri:** Success counter
- **Hatalı işlem:** Error counter
- **Ortalama işlem süresi:** Per whisky timing

### Log Formatı
```json
{
  "timestamp": "2024-01-20T10:30:00Z",
  "workflow_id": "whisky_translation_job",
  "whisky_id": 123,
  "status": "success|error",
  "languages": ["en", "ru"],
  "processing_time_ms": 2500,
  "error_message": null
}
```

## 🛡️ Hata Yönetimi

### Retry Stratejisi
```json
{
  "maxRetries": 3,
  "retryInterval": 5000,
  "conditions": [
    "API_RATE_LIMIT",
    "NETWORK_ERROR",
    "JSON_PARSE_ERROR"
  ]
}
```

### Error Types
1. **AI API Hatası:** Retry with exponential backoff
2. **Supabase Bağlantı Hatası:** 3 kez deneme
3. **JSON Parse Hatası:** Manuel inceleme için log
4. **Rate Limit:** 60 saniye bekleme

## 📈 Performance Optimizasyonu

### Batch Processing
- **Önerilen batch size:** 10-20 viski
- **API rate limit:** 500 RPM (OpenAI)
- **Delay between requests:** 1-2 saniye
- **Memory usage:** ~50MB per batch

### Cost Optimization
```javascript
// GPT-4o-mini kullanımı (ekonomik)
Model: "gpt-4o-mini"
Temperature: 0.1
Max Tokens: 2000

// Tahmini maliyet
// 1000 viski × 2 dil × ~800 token = $0.50
```

## 🔄 Maintenance

### Günlük Kontroller
1. Workflow execution logs
2. Error rate monitoring
3. Translation quality spot checks
4. API quota kullanımı

### Haftalık Görevler
1. Başarısız çevirileri tekrar çalıştır
2. Quality score analizi
3. Yeni viski sayısı kontrolü
4. Performance metrics review

## 🚀 Production Deployment

### Environment Variables
```bash
N8N_SUPABASE_URL=your_supabase_url
N8N_SUPABASE_KEY=your_service_role_key
N8N_OPENAI_API_KEY=your_openai_key
N8N_WEBHOOK_LOG_URL=your_logging_endpoint
```

### Deployment Checklist
- [ ] Credentials konfigüre edildi
- [ ] Database tabloları hazır
- [ ] Workflow test edildi (5-10 viski)
- [ ] Error handling test edildi
- [ ] Monitoring ayarlandı
- [ ] Production schedule ayarlandı

## 📞 Troubleshooting

### Sık Karşılaşılan Sorunlar

**Q:** AI çeviri JSON formatında gelmiyor
**A:** Prompt'u daha spesifik hale getir, temperature'ı düşür

**Q:** Supabase bağlantı hatası
**A:** Service role key ve RLS politikalarını kontrol et

**Q:** Rate limit hatası
**A:** Batch size'ı küçült, delay ekle

**Q:** Duplicate key hatası
**A:** Upsert kullan veya mevcut kayıt kontrolü ekle

## 📚 Ek Kaynaklar

- [n8n Documentation](https://docs.n8n.io/)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Supabase Database API](https://supabase.com/docs/reference/javascript)
- [Whisky Translation Best Practices](./whisky-translation-guidelines.md)

---

**Son Güncelleme:** 2024-01-20
**Versiyon:** 1.0
**Hazırlayan:** Claude AI Assistant