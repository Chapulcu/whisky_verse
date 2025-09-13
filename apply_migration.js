import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pznuleevpgklxuuojcpy.supabase.co'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY // This would need to be set

if (!supabaseServiceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required for migrations')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  try {
    const migrationSQL = readFileSync('supabase/migrations/007_add_events_price_currency_columns.sql', 'utf8')
    
    // Remove the DO blocks and just run the ALTER statements directly
    const statements = [
      "ALTER TABLE events ADD COLUMN IF NOT EXISTS currency varchar(10) DEFAULT 'TRY';",
      "ALTER TABLE events ADD COLUMN IF NOT EXISTS price decimal(10,2) DEFAULT 0;",
      "UPDATE events SET currency = COALESCE(currency, 'TRY') WHERE currency IS NULL;",
      "UPDATE events SET price = COALESCE(price, 0) WHERE price IS NULL;"
    ]
    
    for (const statement of statements) {
      console.log('Executing:', statement)
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        console.error('Migration error:', error)
        break
      } else {
        console.log('Statement executed successfully')
      }
    }
    
    console.log('Migration completed!')
  } catch (error) {
    console.error('Error applying migration:', error)
  }
}

applyMigration()