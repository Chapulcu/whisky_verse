import { clearExpiredRecords, deleteCacheRecord, readCacheRecord, writeCacheRecord, type BaseCacheRecord } from '@/lib/storage/indexedDbClient'
import type { MultilingualWhisky } from '@/hooks/useWhiskiesMultilingual'

interface WhiskiesCachePayload {
  whiskies: MultilingualWhisky[]
  totalCount: number
}

const STORE_NAME = 'whiskies' as const
const DEFAULT_TTL = 10 * 60 * 1000 // 10 minutes

export function createWhiskyCacheKey(params: {
  lang: string
  limit?: number
  offset?: number
  searchTerm?: string
  countryFilter?: string
  typeFilter?: string
}): string {
  const { lang, limit = 0, offset = 0, searchTerm = '', countryFilter = '', typeFilter = '' } = params
  return [lang, limit, offset, searchTerm.trim().toLowerCase(), countryFilter, typeFilter].join('|')
}

export async function getWhiskiesFromCache(cacheKey: string, now: number = Date.now()): Promise<WhiskiesCachePayload | null> {
  const record = await readCacheRecord<WhiskiesCachePayload>(STORE_NAME, cacheKey)
  if (!record) return null

  if (record.expiresAt <= now) {
    await deleteCacheRecord(STORE_NAME, cacheKey)
    return null
  }

  return record.data
}

export async function setWhiskiesCache(cacheKey: string, payload: WhiskiesCachePayload, ttl: number = DEFAULT_TTL): Promise<void> {
  const now = Date.now()
  const record: BaseCacheRecord<WhiskiesCachePayload> = {
    cacheKey,
    data: payload,
    cachedAt: now,
    expiresAt: now + ttl
  }

  await writeCacheRecord(STORE_NAME, record)
}

export async function cleanupWhiskiesCache(now: number = Date.now()): Promise<void> {
  await clearExpiredRecords(STORE_NAME, now)
}
