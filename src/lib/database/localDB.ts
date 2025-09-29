import initSqlJs, { Database } from 'sql.js'
import localforage from 'localforage'

export interface LocalWhisky {
  id: number
  name: string
  description?: string
  country: string
  region?: string
  type: string
  alcohol_percentage?: number
  rating?: number
  age_years?: number
  aroma?: string
  taste?: string
  finish?: string
  color?: string
  image_url?: string
  image_blob?: string // Base64 encoded local image
  last_updated: number
  sync_status: 'synced' | 'pending' | 'conflict'
}

export interface LocalPhoto {
  id: string
  whisky_id: number
  url: string
  blob_data: string // Base64 encoded
  size: number
  created_at: number
}

class LocalDatabase {
  private db: Database | null = null
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Initialize SQL.js
      const SQL = await initSqlJs({
        locateFile: (file) => {
          const baseUrl = (import.meta.env?.BASE_URL ?? '/').replace(/\/*$/, '/')
          return `${baseUrl}${file}`
        }
      })

      // Try to load existing database
      const savedDB = await localforage.getItem<Uint8Array>('whiskyverse-local-db')

      if (savedDB) {
        this.db = new SQL.Database(savedDB)
        console.log('📄 Loaded existing local database')
      } else {
        // Create new database
        this.db = new SQL.Database()
        await this.createTables()
        console.log('🆕 Created new local database')
      }

      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize local database:', error)
      throw error
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    // Whiskies table
    this.db.exec(`
      CREATE TABLE whiskies (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        country TEXT NOT NULL,
        region TEXT,
        type TEXT NOT NULL,
        alcohol_percentage REAL,
        rating INTEGER,
        age_years INTEGER,
        aroma TEXT,
        taste TEXT,
        finish TEXT,
        color TEXT,
        image_url TEXT,
        image_blob TEXT,
        last_updated INTEGER NOT NULL,
        sync_status TEXT DEFAULT 'synced'
      )
    `)

    // Photos table
    this.db.exec(`
      CREATE TABLE photos (
        id TEXT PRIMARY KEY,
        whisky_id INTEGER NOT NULL,
        url TEXT NOT NULL,
        blob_data TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (whisky_id) REFERENCES whiskies (id)
      )
    `)

    // Sync metadata table
    this.db.exec(`
      CREATE TABLE sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

    await this.saveDatabase()
  }

  private async saveDatabase(): Promise<void> {
    if (!this.db) return

    const data = this.db.export()
    await localforage.setItem('whiskyverse-local-db', data)
  }

  // Whisky operations
  async insertWhisky(whisky: Omit<LocalWhisky, 'last_updated' | 'sync_status'>): Promise<void> {
    if (!this.db) await this.initialize()

    console.log(`💾 LocalDB: Inserting whisky ${whisky.name} (ID: ${whisky.id})`)

    const stmt = this.db!.prepare(`
      INSERT OR REPLACE INTO whiskies
      (id, name, description, country, region, type, alcohol_percentage, rating, age_years,
       aroma, taste, finish, color, image_url, image_blob, last_updated, sync_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const values = [
      whisky.id,
      whisky.name,
      whisky.description || null,
      whisky.country,
      whisky.region || null,
      whisky.type,
      whisky.alcohol_percentage || null,
      whisky.rating || null,
      whisky.age_years || null,
      whisky.aroma || null,
      whisky.taste || null,
      whisky.finish || null,
      whisky.color || null,
      whisky.image_url || null,
      whisky.image_blob || null,
      Date.now(),
      'synced'
    ]

    console.log(`🔍 LocalDB: Insert values for ${whisky.name}:`, values)

    try {
      const result = stmt.run(values)
      console.log(`🔍 LocalDB: Insert result for ${whisky.name}:`, result)
    } catch (error) {
      console.error(`❌ LocalDB: Insert error for ${whisky.name}:`, error)
      throw error
    }

    stmt.free()

    // Verify the insert worked by immediately checking
    console.log(`🔍 LocalDB: Verifying insert for ${whisky.name}...`)
    try {
      const verifyStmt = this.db!.prepare('SELECT COUNT(*) as count FROM whiskies WHERE id = ?')
      const verifyResult = verifyStmt.get([whisky.id])
      verifyStmt.free()
      console.log(`🔍 LocalDB: Verify count for ID ${whisky.id}:`, verifyResult)
    } catch (error) {
      console.error(`❌ LocalDB: Verify error for ${whisky.name}:`, error)
    }

    await this.saveDatabase()
    console.log(`✅ LocalDB: Successfully inserted and saved ${whisky.name}`)

    // Double check after save
    console.log(`🔍 LocalDB: Post-save verification for ${whisky.name}...`)
    try {
      const postSaveStmt = this.db!.prepare('SELECT COUNT(*) as count FROM whiskies')
      const postSaveResult = postSaveStmt.get([])
      postSaveStmt.free()
      console.log(`🔍 LocalDB: Total whiskies after save:`, postSaveResult)
    } catch (error) {
      console.error(`❌ LocalDB: Post-save verify error:`, error)
    }
  }

  async getWhiskies(limit?: number, offset?: number): Promise<LocalWhisky[]> {
    if (!this.db) await this.initialize()

    let query = 'SELECT * FROM whiskies ORDER BY last_updated DESC'
    if (limit) {
      query += ` LIMIT ${limit}`
      if (offset) {
        query += ` OFFSET ${offset}`
      }
    }

    console.log('🔍 getWhiskies query:', query)

    const result = this.db!.exec(query)
    console.log('🔍 getWhiskies result length:', result.length)
    console.log('🔍 getWhiskies first result:', result[0])
    if (result.length === 0) {
      console.log('❌ getWhiskies: No results from query')
      return []
    }

    const rows = result[0]
    console.log('🔍 getWhiskies rows:', rows.values?.length, 'rows found')
    return rows.values.map(row => ({
      id: row[0] as number,
      name: row[1] as string,
      description: row[2] as string || undefined,
      country: row[3] as string,
      region: row[4] as string || undefined,
      type: row[5] as string,
      alcohol_percentage: row[6] as number || undefined,
      rating: row[7] as number || undefined,
      age_years: row[8] as number || undefined,
      aroma: row[9] as string || undefined,
      taste: row[10] as string || undefined,
      finish: row[11] as string || undefined,
      color: row[12] as string || undefined,
      image_url: row[13] as string || undefined,
      image_blob: row[14] as string || undefined,
      last_updated: row[15] as number,
      sync_status: row[16] as LocalWhisky['sync_status']
    }))
  }

  async getWhiskyById(id: number): Promise<LocalWhisky | null> {
    if (!this.db) await this.initialize()

    const stmt = this.db!.prepare('SELECT * FROM whiskies WHERE id = ?')
    const result = stmt.getAsObject([id])
    stmt.free()

    if (!result || Object.keys(result).length === 0) return null

    return result as LocalWhisky
  }

  async searchWhiskies(searchTerm: string): Promise<LocalWhisky[]> {
    if (!this.db) await this.initialize()

    const stmt = this.db!.prepare(`
      SELECT * FROM whiskies
      WHERE name LIKE ? OR description LIKE ? OR country LIKE ?
      ORDER BY last_updated DESC
    `)

    const term = `%${searchTerm}%`
    const result = stmt.all([term, term, term])
    stmt.free()

    return result.map(row => row as LocalWhisky)
  }

  // Photo operations
  async insertPhoto(photo: LocalPhoto): Promise<void> {
    if (!this.db) await this.initialize()

    const stmt = this.db!.prepare(`
      INSERT OR REPLACE INTO photos (id, whisky_id, url, blob_data, size, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    stmt.run([
      photo.id,
      photo.whisky_id,
      photo.url,
      photo.blob_data,
      photo.size,
      photo.created_at
    ])

    stmt.free()
    await this.saveDatabase()
  }

  async getPhotosForWhisky(whiskyId: number): Promise<LocalPhoto[]> {
    if (!this.db) await this.initialize()

    const stmt = this.db!.prepare('SELECT * FROM photos WHERE whisky_id = ?')
    const result = stmt.all([whiskyId])
    stmt.free()

    return result.map(row => row as LocalPhoto)
  }

  async hasPhoto(url: string): Promise<boolean> {
    if (!this.db) await this.initialize()

    const stmt = this.db!.prepare('SELECT COUNT(*) as count FROM photos WHERE url = ?')
    const result = stmt.get([url]) as { count: number }
    stmt.free()

    return result.count > 0
  }

  // Sync operations
  async markAsUpdated(whiskyId: number): Promise<void> {
    if (!this.db) await this.initialize()

    const stmt = this.db!.prepare(`
      UPDATE whiskies
      SET last_updated = ?, sync_status = 'pending'
      WHERE id = ?
    `)

    stmt.run([Date.now(), whiskyId])
    stmt.free()
    await this.saveDatabase()
  }

  async getPendingSync(): Promise<LocalWhisky[]> {
    if (!this.db) await this.initialize()

    const result = this.db!.exec("SELECT * FROM whiskies WHERE sync_status = 'pending'")
    if (result.length === 0) return []

    const rows = result[0]
    return rows.values.map(row => ({
      id: row[0] as number,
      name: row[1] as string,
      description: row[2] as string || undefined,
      country: row[3] as string,
      region: row[4] as string || undefined,
      type: row[5] as string,
      alcohol_percentage: row[6] as number || undefined,
      rating: row[7] as number || undefined,
      age_years: row[8] as number || undefined,
      aroma: row[9] as string || undefined,
      taste: row[10] as string || undefined,
      finish: row[11] as string || undefined,
      color: row[12] as string || undefined,
      image_url: row[13] as string || undefined,
      image_blob: row[14] as string || undefined,
      last_updated: row[15] as number,
      sync_status: row[16] as LocalWhisky['sync_status']
    }))
  }

  async markAsSynced(whiskyId: number): Promise<void> {
    if (!this.db) await this.initialize()

    const stmt = this.db!.prepare(`
      UPDATE whiskies
      SET sync_status = 'synced'
      WHERE id = ?
    `)

    stmt.run([whiskyId])
    stmt.free()
    await this.saveDatabase()
  }

  // Metadata operations
  async setLastSyncTime(timestamp: number): Promise<void> {
    if (!this.db) await this.initialize()

    const stmt = this.db!.prepare(`
      INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
      VALUES ('last_sync', ?, ?)
    `)

    stmt.run([timestamp.toString(), Date.now()])
    stmt.free()
    await this.saveDatabase()
  }

  async getLastSyncTime(): Promise<number | null> {
    if (!this.db) await this.initialize()

    const stmt = this.db!.prepare('SELECT value FROM sync_metadata WHERE key = ?')
    const result = stmt.getAsObject(['last_sync'])
    stmt.free()

    return result.value ? parseInt(result.value as string) : null
  }

  // Database maintenance
  async clearDatabase(): Promise<void> {
    if (!this.db) await this.initialize()

    this.db!.exec('DELETE FROM photos')
    this.db!.exec('DELETE FROM whiskies')
    this.db!.exec('DELETE FROM sync_metadata')

    await this.saveDatabase()
  }

  async getStats(): Promise<{ whiskies: number; photos: number; pendingSync: number }> {
    if (!this.db) await this.initialize()

    // Check if tables exist
    console.log('🔍 getStats: Checking if tables exist...')
    const tablesResult = this.db!.exec("SELECT name FROM sqlite_master WHERE type='table'")
    console.log('🔍 getStats: Tables found:', tablesResult[0]?.values || [])

    // Check whiskies table structure
    console.log('🔍 getStats: Checking whiskies table structure...')
    try {
      const schemaResult = this.db!.exec("PRAGMA table_info(whiskies)")
      console.log('🔍 getStats: Whiskies table schema:', schemaResult[0]?.values || [])
    } catch (error) {
      console.error('❌ getStats: Error checking whiskies table schema:', error)
    }

    // Try a simple SELECT to see what's actually in the table
    console.log('🔍 getStats: Trying SELECT * FROM whiskies LIMIT 3...')
    try {
      const sampleResult = this.db!.exec('SELECT * FROM whiskies LIMIT 3')
      console.log('🔍 getStats: Sample whiskies result:', sampleResult[0]?.values || [])
    } catch (error) {
      console.error('❌ getStats: Error in sample SELECT:', error)
    }

    console.log('📊 getStats: Counting whiskies...')
    const whiskiesCountResult = this.db!.exec('SELECT COUNT(*) as count FROM whiskies')
    console.log('📊 getStats: COUNT query result structure:', whiskiesCountResult)
    const whiskiesCount = whiskiesCountResult[0]?.values[0][0] as number || 0
    console.log('📊 getStats: whiskies count =', whiskiesCount)

    console.log('📊 getStats: Counting photos...')
    const photosCount = this.db!.exec('SELECT COUNT(*) as count FROM photos')[0]?.values[0][0] as number || 0
    console.log('📊 getStats: photos count =', photosCount)

    console.log('📊 getStats: Counting pending sync...')
    const pendingCount = this.db!.exec("SELECT COUNT(*) as count FROM whiskies WHERE sync_status = 'pending'")[0]?.values[0][0] as number || 0
    console.log('📊 getStats: pending count =', pendingCount)

    return {
      whiskies: whiskiesCount,
      photos: photosCount,
      pendingSync: pendingCount
    }
  }
}

// Singleton instance
export const localDB = new LocalDatabase()
