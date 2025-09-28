import { clearExpiredRecords, readCacheRecord, writeCacheRecord, deleteCacheRecord, type BaseCacheRecord } from '@/lib/storage/indexedDbClient'

interface TranslationCachePayload {
  data: Record<string, unknown>
}

const STORE_NAME = 'translations' as const
const DEFAULT_TTL = 24 * 60 * 60 * 1000 // 24 hours

export function createTranslationCacheKey(lang: string, namespace: string): string {
  return `${lang}:${namespace}`
}

export async function getTranslationFromCache(lang: string, namespace: string, now: number = Date.now()): Promise<Record<string, unknown> | null> {
  const cacheKey = createTranslationCacheKey(lang, namespace)
  const record = await readCacheRecord<TranslationCachePayload>(STORE_NAME, cacheKey)
  if (!record) return null

  if (record.expiresAt <= now) {
    await deleteCacheRecord(STORE_NAME, cacheKey)
    return null
  }

  return record.data.data
}

export async function setTranslationCache(lang: string, namespace: string, data: Record<string, unknown>, ttl: number = DEFAULT_TTL): Promise<void> {
  const cacheKey = createTranslationCacheKey(lang, namespace)
  const now = Date.now()
  const record: BaseCacheRecord<TranslationCachePayload> = {
    cacheKey,
    data: { data },
    cachedAt: now,
    expiresAt: now + ttl
  }

  await writeCacheRecord(STORE_NAME, record)
}

export async function cleanupTranslationCache(now: number = Date.now()): Promise<void> {
  await clearExpiredRecords(STORE_NAME, now)
}
