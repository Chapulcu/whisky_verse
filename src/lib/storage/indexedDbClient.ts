import { openDB, type IDBPDatabase } from 'idb'

type StoreName = 'whiskies' | 'collections' | 'translations'

export interface BaseCacheRecord<T> {
  cacheKey: string
  data: T
  cachedAt: number
  expiresAt: number
}

const DB_NAME = 'whiskyverse-db'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

async function getDatabase(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('whiskies')) {
          const store = db.createObjectStore('whiskies', { keyPath: 'cacheKey' })
          store.createIndex('expiresAt', 'expiresAt')
        }
        if (!db.objectStoreNames.contains('collections')) {
          const store = db.createObjectStore('collections', { keyPath: 'cacheKey' })
          store.createIndex('expiresAt', 'expiresAt')
        }
        if (!db.objectStoreNames.contains('translations')) {
          const store = db.createObjectStore('translations', { keyPath: 'cacheKey' })
          store.createIndex('expiresAt', 'expiresAt')
        }
      }
    })
  }

  return dbPromise
}

export async function readCacheRecord<T>(storeName: StoreName, cacheKey: string): Promise<BaseCacheRecord<T> | undefined> {
  const db = await getDatabase()
  return db.get(storeName, cacheKey)
}

export async function writeCacheRecord<T>(storeName: StoreName, record: BaseCacheRecord<T>): Promise<void> {
  const db = await getDatabase()
  await db.put(storeName, record)
}

export async function deleteCacheRecord(storeName: StoreName, cacheKey: string): Promise<void> {
  const db = await getDatabase()
  await db.delete(storeName, cacheKey)
}

export async function clearExpiredRecords(storeName: StoreName, now: number = Date.now()): Promise<void> {
  const db = await getDatabase()
  const tx = db.transaction(storeName, 'readwrite')
  const index = tx.store.index('expiresAt')

  let cursor = await index.openCursor()
  while (cursor) {
    if ((cursor.value as BaseCacheRecord<unknown>).expiresAt <= now) {
      await cursor.delete()
    }
    cursor = await cursor.continue()
  }

  await tx.done
}
