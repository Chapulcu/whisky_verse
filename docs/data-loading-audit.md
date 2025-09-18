# Veri Yükleme Mantığı İncelemesi ve İyileştirme Önerileri

## Özet
- **Sorun belirtileri**
  - Bazen veriler gelmiyor; sayfa yeniden yüklendiğinde düzeliyor.
- **Muhtemel kök nedenler**
  - Asenkron yarış durumları (race conditions)
  - Yetki (auth) başlangıcı ile veri yüklemenin çakışması
  - İptal edilmeyen ardışık istekler ve yanıt sırası problemi
  - Yeniden deneme (retry/backoff) ve odak/online geri getirme politikalarının olmaması
- **Öneri seti**
  - Veri yükleme hook’larında istek kimliği koruması (requestId guard)
  - Retry/backoff, odak ve online olaylarında otomatik yenileme
  - Birleştirilmiş yükleme durumları
  - Orta vadede React Query/SWR’e geçiş

## İncelenen Dosyalar
- `src/pages/WhiskiesPage.tsx`
- `src/hooks/useSimpleWhiskiesDB.ts`
- `src/hooks/useMultilingualWhiskies.ts`
- `src/hooks/useHomeStats.ts`
- `src/hooks/useUserCollection.ts`
- `src/contexts/AuthContext.tsx`
- `src/lib/supabase.ts`

## Ana Bulgular

### `src/pages/WhiskiesPage.tsx`
- **Yükleme durumu yönetimi eksik**
  - Sayfa `loading` state’i yalnızca `useSimpleWhiskiesDB()` içindeki `whiskyLoading` değerine bağlı: `setLoading(whiskyLoading)`.
  - Kullanıcı koleksiyonu `loadUserCollection()` asenkron olduğundan, sayfa `loading=false` iken koleksiyon verisi henüz gelmemiş olabilir. Bu “boş veri” hissi yaratıp reload sonrası görünmesine neden olabilir.
- **Arama debouncing ve yarış riski**
  - `debouncedSearchTerm` değiştiğinde `loadWhiskies(undefined, 0, debouncedSearchTerm)` çağrısı yapılıyor.
  - İstek iptali/yarış koruması yok; hızlı yazımda eski yanıtın yeni state’i ezmesi (out-of-order) mümkün.
- **Filtre parametrelerinin backend’e iletilmemesi**
  - `selectedCountry`, `selectedType` client-side filtreleniyor; `useSimpleWhiskiesDB.loadWhiskies()` bu parametreleri destekliyor ama çağrılırken iletilmiyor.

### `src/hooks/useSimpleWhiskiesDB.ts`
- **İstek yarış koruması yok**
  - Ardışık çağrılarda geç gelen eski yanıt yeni sonucu ezebilir.
- **Retry/backoff eksik**
  - Anlık ağ/Supabase hatalarında otomatik toparlanma yok.
- **Refetch stratejisi sınırlı**
  - Sadece mount’ta yükleme var; pencere odak/online dönüşlerinde otomatik refetch yok.

### `src/hooks/useMultilingualWhiskies.ts`
- **Limitsiz çağrıda büyük veri/uzun süren istek**
  - Limit verilmediğinde tüm veriyi 1000’lik parçalarda yüklüyor. Gecikmede UI “boş” sanılabilir.
- **Arama ve yarış riski**
  - `.or(name/type/country ilike)` düzgün, ancak request iptali/guard yok.
- **Refetch olayları**
  - Dil değişiminde refetch var; odak/online yok.

### `src/hooks/useHomeStats.ts`
- **İyi uygulama**
  - `Promise.race` ile global timeout mevcut.
- **Eksikler**
  - Odak/online refetch ve retry yok.

### `src/hooks/useUserCollection.ts`
- **Doğru kullanıcı kontrolleri**
  - Kullanıcı yoksa güvenli boş dizi.
- **Refetch kapsamı**
  - `useEffect([user?.id])` ile login değişince çekiyor, ancak odak/online refetch yok.
- **Yarış/iptal eksikliği**
  - requestId guard/retry yok.

### `src/contexts/AuthContext.tsx`
- **Oturum toparlama**
  - HMR/oturum geri kazanımı var. İlk render’da kullanıcı geç hazır olabilir; kullanıcıya bağlı veri çeken sayfalar ilk çekimde boş kalıp sonradan dolabilir.
  - Sayfada birleşik loading olmaması “veri yok” izlenimi yaratabilir.

### `src/lib/supabase.ts`
- **İstemci yapılandırması**
  - `autoRefreshToken:true`, `persistSession:true` uygun. Global retry yok; bu SDK’nın normal davranışı.

## Muhtemel Kök Nedenler
- **Yarış durumu**: Debounce/ardışık isteklerin iptal edilmemesi, eski yanıtların yeni state’i ezmesi.
- **Parçalı loading yönetimi**: Sayfa loading’i yalnızca tek kaynağa bağlı.
- **Refetch eksikliği**: Odak/online dönüşlerinde toparlanma yok.
- **Retry/backoff yok**: Kısa süreli 5xx/429 veya ağ kesintilerinde isteğin düşmesi.
- **Büyük veri gecikmesi**: Tüm veriyi çekme uzun sürüyor, kullanıcı “boş” sanıyor.

## Önceliklendirilmiş İyileştirmeler

### Yüksek öncelik
- **İstek yarış koruması (requestId guard)**
  - `useSimpleWhiskiesDB.loadWhiskies`, `useMultilingualWhiskies.loadWhiskies`, `useUserCollection.loadCollection` için `requestIdRef` ile “son istek kazanır” mantığı ekleyin.
- **Odak/online refetch**
  - Hook’larda `window.addEventListener('focus', ...)` ve `window.addEventListener('online', ...)` ile `refetch()` çağırın; `cleanup` ile kaldırın.
- **Birleşik loading state**
  - `WhiskiesPage` içinde `pageLoading = whiskyLoading || userCollectionLoading` gibi birleştirip render’ı ona bağlayın.
- **Retry/backoff**
  - Özellikle liste ve koleksiyon yüklemesinde 2-3 denemeli exponential backoff (örn. 300ms, 800ms, 1500ms).

### Orta öncelik
- **Arama isteklerinde deduplikasyon/iptal**
  - Debounce edilen aramalarda önceki isteğin sonucunu yok sayın (guard).
- **Görünürlük bazlı refetch**
  - `document.visibilitychange` ile görünür olduğunda `refetch`.
- **Hata telemetrisi**
  - Toast + merkezi logger (örn. Sentry) ekleyin.

### Düşük/stratejik öncelik
- **React Query/SWR’e geçiş**
  - Caching, request deduping, window focus refetch, retry/backoff gibi ihtiyaçlar için standart çözüm.
- **`useMultilingualWhiskies` chunk stratejisi**
  - Varsayılanı limitli/pagineli hale getirip UI yüke paralel ilerlesin. `keepPreviousData` benzeri stratejiyle flicker azaltılabilir.

## Somut Dosya Bazlı Öneriler
- **`src/hooks/useSimpleWhiskiesDB.ts`**
  - `requestId guard`, retry/backoff ve focus/online refetch ekleyin.
- **`src/pages/WhiskiesPage.tsx`**
  - `pageLoading = whiskyLoading || userCollectionLoading` kullanın.
  - `loadWhiskies` çağrısına `selectedCountry` ve `selectedType` parametrelerini de iletin.
- **`src/hooks/useUserCollection.ts`**
  - Aynı guard/retry/refetch eklemeleri.
- **`src/hooks/useMultilingualWhiskies.ts`**
  - Guard + `isRefetching` benzeri ikinci yükleme bayrağı ile UI flicker’ını azaltın.
- **`src/hooks/useHomeStats.ts`**
  - focus/online refetch ve basit retry.

## Hızlı Kazançlar (Quick Wins)
- **Birleşik loading**: `WhiskiesPage` içinde koleksiyon ve listelerin yüklemesini birlikte bekletin.
- **Guard ekleme**: `useSimpleWhiskiesDB` ve `useUserCollection`’a “son istek kazanır” koruması eklemek boş/eksik veri sorunlarını hızla azaltır.
- **Odak/online refetch**: Ağ dalgalanmalarında reload ihtiyacını ortadan kaldırır.

## Orta Vadeli Plan: React Query/SWR
- **React Query**
  - `useQuery(['whiskies', params], fetcher, { retry: 2, refetchOnWindowFocus: true, keepPreviousData: true })`.
- **SWR**
  - `useSWR(key, fetcher, { revalidateOnFocus: true, errorRetryCount: 2 })`.

## Uygulama Sırası (Önerilen)
1. `useSimpleWhiskiesDB` ve `useUserCollection` için requestId guard + retry/backoff + focus/online refetch.
2. `WhiskiesPage`’te birleşik loading ve filtre parametrelerini `loadWhiskies`’e aktarma.
3. `useMultilingualWhiskies` için guard ve `isRefetching` yaklaşımı.
4. Orta vadede React Query/SWR geçişi.
