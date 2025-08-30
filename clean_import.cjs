// Clean CSV Whisky Import Script - Import only once
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = 'https://pznuleevpgklxuuojcpy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bnVsZWV2cGdrbHh1dW9qY3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODAzNDEsImV4cCI6MjA3MTE1NjM0MX0.YU6bUsKYOrMlmlRtb-Wafr6em9DEaEY9tZEyyApXNUM'

const supabase = createClient(supabaseUrl, supabaseKey)

// Simple CSV parser
function parseCSV(csvText) {
  const lines = csvText.split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = []
      let currentValue = ''
      let inQuotes = false
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim())
          currentValue = ''
        } else {
          currentValue += char
        }
      }
      values.push(currentValue.trim())
      
      const row = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || null
      })
      data.push(row)
    }
  }
  
  return data
}

function cleanAlcoholPercentage(value) {
  if (!value || value === 'alcohol_percentage' || value === '') {
    return 40.0
  }
  const parsed = parseFloat(value)
  return isNaN(parsed) ? 40.0 : parsed
}

function cleanCountry(country) {
  if (!country || country === '') return 'İskoçya'
  
  const countryMap = {
    'Scotland': 'İskoçya',
    'USA': 'ABD', 
    'Ireland': 'İrlanda',
    'Sweden': 'İsveç',
    'Wales': 'Galler',
    'Japan': 'Japonya',
    'Taiwan': 'Tayvan',
    'Canada': 'Kanada',
    'Various': 'Çeşitli'
  }
  
  return countryMap[country] || country
}

async function cleanImport() {
  try {
    console.log('=== CLEAN WHISKY IMPORT ===')
    
    // First check if table is already clean
    const { count, error: countError } = await supabase
      .from('whiskies')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.log('Error checking count:', countError)
      return
    }
    
    console.log('Current records in database:', count)
    
    if (count > 0) {
      console.log('⚠️  Table is not empty!')
      console.log('Please run this in Supabase Dashboard first:')
      console.log('DELETE FROM whiskies;')
      console.log('SELECT setval(\'whiskies_id_seq\', 1, false);')
      return
    }
    
    console.log('✅ Table is clean, proceeding with import...')
    console.log('Reading CSV file...')
    
    const csvContent = fs.readFileSync('../viski_import_template.csv', 'utf8')
    const csvData = parseCSV(csvContent)
    
    console.log(`Found ${csvData.length} whiskies in CSV`)
    
    // Remove duplicates by name (keep first occurrence)
    const uniqueWhiskies = []
    const seenNames = new Set()
    
    csvData.forEach(row => {
      if (row.name && !seenNames.has(row.name)) {
        seenNames.add(row.name)
        uniqueWhiskies.push(row)
      }
    })
    
    console.log(`After deduplication: ${uniqueWhiskies.length} unique whiskies`)
    
    const processedWhiskies = uniqueWhiskies.map(row => ({
      name: (row.name || 'Unknown').substring(0, 255),
      type: (row.type || 'Single Malt').substring(0, 100),
      country: cleanCountry(row.country).substring(0, 100),
      region: row.region === 'null' || !row.region ? null : row.region.substring(0, 100),
      alcohol_percentage: cleanAlcoholPercentage(row.alcohol_percentage),
      color: row.color ? row.color.substring(0, 100) : null,
      aroma: row.aroma || null,
      taste: row.taste || null,
      finish: row.finish || null,
      description: row.description || null,
      image_url: row.image_url && row.image_url !== 'https://example.com/image.jpg' ? 
                 `https://storage.supabase.co/v1/object/public/whisky-images/${row.image_url}` : null
    }))
    
    console.log('Sample processed whisky:', processedWhiskies[0])
    
    // Insert in chunks
    const chunkSize = 50
    let totalInserted = 0
    
    for (let i = 0; i < processedWhiskies.length; i += chunkSize) {
      const chunk = processedWhiskies.slice(i, i + chunkSize)
      console.log(`Inserting chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(processedWhiskies.length/chunkSize)} (${chunk.length} records)`)
      
      const { data, error } = await supabase
        .from('whiskies')
        .insert(chunk)
        .select('id, name')
      
      if (error) {
        console.log(`❌ Insert failed for chunk ${Math.floor(i/chunkSize) + 1}:`, error)
        break
      } else {
        totalInserted += data.length
        console.log(`✅ Chunk ${Math.floor(i/chunkSize) + 1}: ${data.length} whiskies`)
      }
    }
    
    console.log(`\n🎉 IMPORT COMPLETE!`)
    console.log(`Total inserted: ${totalInserted} whiskies`)
    
    // Verify final count
    const { count: finalCount } = await supabase
      .from('whiskies')
      .select('*', { count: 'exact', head: true })
    
    console.log(`Final database count: ${finalCount}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

cleanImport()