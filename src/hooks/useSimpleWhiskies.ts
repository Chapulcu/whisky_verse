import { useState, useEffect } from 'react'

// Simple mock data for when RLS is causing issues
const mockWhiskies = [
  {
    id: 1,
    name: 'Macallan 18',
    type: 'Single Malt',
    country: 'Scotland',
    region: 'Speyside',
    alcohol_percentage: 43,
    rating: 4.8,
    age_years: 18,
    color: 'Deep amber',
    aroma: 'Rich fruit, vanilla, oak',
    taste: 'Complex, honey, dried fruit',
    finish: 'Long, warming',
    description: 'Premium single malt whisky',
    image_url: null,
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Jameson',
    type: 'Irish Whiskey',
    country: 'Ireland',
    region: null,
    alcohol_percentage: 40,
    rating: 4.0,
    age_years: null,
    color: 'Golden',
    aroma: 'Light, fresh, fruity',
    taste: 'Smooth, balanced',
    finish: 'Medium',
    description: 'Classic Irish whiskey',
    image_url: null,
    created_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 3,
    name: 'Jack Daniels',
    type: 'Tennessee Whiskey',
    country: 'USA',
    region: 'Tennessee',
    alcohol_percentage: 40,
    rating: 3.8,
    age_years: null,
    color: 'Amber',
    aroma: 'Sweet, vanilla, charcoal',
    taste: 'Smooth, caramel, oak',
    finish: 'Clean',
    description: 'American Tennessee whiskey',
    image_url: null,
    created_at: '2024-01-03T00:00:00Z'
  }
]

export interface SimpleWhisky {
  id: number
  name: string
  type: string
  country: string
  region: string | null
  alcohol_percentage: number
  rating: number | null
  age_years: number | null
  color: string | null
  aroma: string | null
  taste: string | null
  finish: string | null
  description: string | null
  image_url: string | null
  created_at: string
}

export function useSimpleWhiskies() {
  const [whiskies, setWhiskies] = useState<SimpleWhisky[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setWhiskies(mockWhiskies)
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return { whiskies, loading }
}