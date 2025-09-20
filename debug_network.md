# 🔧 Network Troubleshooting Guide

## 🎯 Problem
Browser'dan Supabase update operations timeout oluyor ama backend scripts çalışıyor.

## 🔍 Step 1: Browser Network Analysis

1. **F12** → **Network tab** aç
2. **Clear** tuşuna bas (network history temizle)
3. Admin panel'de **edit operation** yap
4. Network tab'da hangi request'in **pending/failed** olduğunu gör

### Beklenen sonuçlar:
- ✅ **Success (200)**: Request çalışıyor, başka bir sorun var
- ❌ **Timeout/Failed**: Network bloklama var
- ⏳ **Pending forever**: Connection sorunu

## 🔍 Step 2: Direct Supabase Test

Browser console'da çalıştır:

```javascript
// Test 1: Basic connectivity
fetch('https://pznuleevpgklxuuojcpy.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bnVsZWV2cGdrbHh1dW9qY3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwNDYwNzEsImV4cCI6MjA0NzYyMjA3MX0.1vdstOnFxFJCJLHJnm5vHOFhNcNVu9R4k2QN8k_GDQI'
  }
}).then(r => r.json()).then(console.log).catch(console.error)
```

## 🔍 Step 3: Environment Check

Terminal'de çalıştır:
```bash
# DNS check
nslookup pznuleevpgklxuuojcpy.supabase.co

# Ping test
ping pznuleevpgklxuuojcpy.supabase.co

# HTTP test
curl -I https://pznuleevpgklxuuojcpy.supabase.co/rest/v1/
```

## 🔧 Possible Fixes

### Fix 1: Browser Cache/Storage
```bash
# Clear browser data
# Chrome: Settings → Privacy → Clear browsing data
# All time → Cached images and files, Cookies and site data
```

### Fix 2: Disable Browser Extensions
- Adblockers, security extensions disable et
- Incognito mode'da test et

### Fix 3: Network Configuration
```bash
# DNS flush
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Check /etc/hosts
cat /etc/hosts | grep supabase
```

### Fix 4: Alternative Connection Method
- Different browser (Safari, Firefox)
- Mobile hotspot ile test
- VPN ile test

### Fix 5: Proxy/Firewall Check
```bash
# Check proxy settings
echo $http_proxy
echo $https_proxy

# Check if corporate firewall blocking
curl -v https://pznuleevpgklxuuojcpy.supabase.co/rest/v1/
```

## 🛠️ Code Fixes

### Fix A: Connection Pool Reset
```javascript
// Supabase client reset
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  }
)
```

### Fix B: Request Interceptor
```javascript
// Add request timeout handling
const updateWithRetry = async (data) => {
  const maxRetries = 3
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const result = await supabase
        .from('whiskies')
        .update(data)
        .eq('id', id)
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)
      return result
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

## 📊 Results Analysis

| Test | Expected | Result | Action |
|------|----------|--------|---------|
| Network tab | 200 OK | ? | ? |
| Direct fetch | JSON response | ? | ? |
| DNS lookup | IP address | ? | ? |
| Ping | Response time | ? | ? |
| Curl | Headers | ? | ? |

## 🎯 Next Steps Based on Results

1. **All tests pass**: Code-level timeout issue
2. **Fetch fails**: Browser-specific blocking
3. **DNS fails**: Network/ISP issue
4. **Ping fails**: Connection blocked
5. **Curl fails**: System-level blocking