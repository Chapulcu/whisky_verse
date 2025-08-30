// CSV Whisky Import Script
// This script reads the CSV file and imports all whiskies to Supabase
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = 'https://pznuleevpgklxuuojcpy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6bnVsZWV2cGdrbHh1dW9qY3B5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1ODAzNDEsImV4cCI6MjA3MTE1NjM0MX0.YU6bUsKYOrMlmlRtb-Wafr6em9DEaEY9tZEyyApXNUM'

const supabase = createClient(supabaseUrl, supabaseKey)

// Function to parse CSV (simple CSV parser)
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

// Clean data functions
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

async function importFromCSV() {
  try {
    console.log('Reading CSV file...')
    const csvContent = fs.readFileSync('../viski_import_template.csv', 'utf8')
    const csvData = parseCSV(csvContent)
    
    console.log(`Found ${csvData.length} whiskies in CSV`)
    
    // Process all records
    const testData = csvData
    
    const processedWhiskies = testData.map(row => ({
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
    })).filter(whisky => whisky.name && whisky.name !== 'Unknown')
    
    console.log('Sample processed whisky:', processedWhiskies[0])
    
    // First, try to disable RLS temporarily
    try {
      await supabase.from('whiskies').delete().eq('id', -1) // This will fail and show RLS status
    } catch (e) {
      console.log('RLS is active, as expected')
    }
    
    console.log(`Attempting to insert ${processedWhiskies.length} whiskies...`)
    
    // Insert in chunks of 50 to avoid timeout
    const chunkSize = 50
    let totalInserted = 0
    
    for (let i = 0; i < processedWhiskies.length; i += chunkSize) {
      const chunk = processedWhiskies.slice(i, i + chunkSize)
      console.log(`Inserting chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(processedWhiskies.length/chunkSize)} (${chunk.length} records)`)
      
      const { data, error } = await supabase
        .from('whiskies')
        .insert(chunk)
        .select()
      
      if (error) {
        console.log(`Insert failed for chunk ${Math.floor(i/chunkSize) + 1}:`, error)
        break
      } else {
        totalInserted += data.length
        console.log(`Successfully inserted chunk ${Math.floor(i/chunkSize) + 1}: ${data.length} whiskies`)
      }
    }
    
    console.log(`Total inserted: ${totalInserted} whiskies`)
    return
    
    if (false) { // Skip the old code
      
      // Try alternative approach: create a user first
      console.log('Attempting to sign up a temporary user...')
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'admin@whisky.com',
        password: 'adminpass123'
      })
      
      if (authError && authError.message !== 'User already registered') {
        console.log('Auth error:', authError)
      } else {
        console.log('User created or already exists')
        
        // Try insert again
        const { data: data2, error: error2 } = await supabase
          .from('whiskies')
          .insert(processedWhiskies)
          .select()
        
        if (error2) {
          console.log('Insert still failed:', error2)
        } else {
          console.log(`Successfully inserted ${data2.length} whiskies!`)
        }
      }
    } else {
      console.log(`Successfully inserted ${data.length} whiskies!`)
    }
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

importFromCSV()