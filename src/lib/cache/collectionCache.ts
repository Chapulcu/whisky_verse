import { clearExpiredRecords, deleteCacheRecord, readCacheRecord, writeCacheRecord, type BaseCacheRecord } from '@/lib/storage/indexedDbClient'
import type { UserWhiskyDB } from '@/hooks/useUserCollection'

interface CollectionCachePayload {
  items: UserWhiskyDB[]
}

const STORE_NAME = 'collections' as const
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

function createCacheKey(userId: string): string {
  return userId
}

export async function getCollectionFromCache(userId: string, now: number = Date.now()): Promise<UserWhiskyDB[] | null> {
  const cacheKey = createCacheKey(userId)
  const record = await readCacheRecord<CollectionCachePayload>(STORE_NAME, cacheKey)
  if (!record) return null

  if (record.expiresAt <= now) {
    await deleteCacheRecord(STORE_NAME, cacheKey)
    return null
  }

  return record.data.items
}

export async function setCollectionCache(userId: string, items: UserWhiskyDB[], ttl: number = DEFAULT_TTL): Promise<void> {
  const cacheKey = createCacheKey(userId)
  const now = Date.now()
  const record: BaseCacheRecord<CollectionCachePayload> = {
    cacheKey,
    data: { items },
    cachedAt: now,
    expiresAt: now + ttl
  }

  await writeCacheRecord(STORE_NAME, record)
}

export async function invalidateCollectionCache(userId: string): Promise<void> {
  const cacheKey = createCacheKey(userId)
  await deleteCacheRecord(STORE_NAME, cacheKey)
}

export async function cleanupCollectionCache(now: number = Date.now()): Promise<void> {
  await clearExpiredRecords(STORE_NAME, now)
}
