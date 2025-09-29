interface PlacePhoto {
  photo_reference: string
  height: number
  width: number
}

interface PlaceOpeningHours {
  open_now: boolean
  periods?: Array<{
    open: { day: number; time: string }
    close?: { day: number; time: string }
  }>
  weekday_text?: string[]
}

interface PlaceGeometry {
  location: {
    lat: number
    lng: number
  }
}

export interface GooglePlace {
  place_id: string
  name: string
  vicinity?: string
  formatted_address?: string
  rating?: number
  user_ratings_total?: number
  price_level?: number
  photos?: PlacePhoto[]
  opening_hours?: PlaceOpeningHours
  geometry: PlaceGeometry
  types: string[]
  business_status?: string
  permanently_closed?: boolean
}

interface NearbySearchResponse {
  results: GooglePlace[]
  status: string
  next_page_token?: string
  error_message?: string
}

interface PlaceDetailsResponse {
  result: GooglePlace
  status: string
  error_message?: string
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const PLACES_PROXY_URL = `${SUPABASE_URL}/functions/v1/google-places`

// Nearby Search for whisky venues
export const searchNearbyWhiskyVenues = async (
  location: { lat: number; lng: number },
  radius: number = 5000,
  type: 'bar' | 'liquor_store' | 'restaurant' = 'bar'
): Promise<GooglePlace[]> => {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL not found')
  }

  try {
    const params = new URLSearchParams({
      endpoint: 'nearby',
      lat: location.lat.toString(),
      lng: location.lng.toString(),
      radius: radius.toString(),
      type: type
    })

    const url = `${PLACES_PROXY_URL}?${params}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: NearbySearchResponse = await response.json()

    if (data.error) {
      throw new Error(`Places API error: ${data.error}`)
    }

    if (data.status !== 'OK') {
      throw new Error(`Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`)
    }

    return data.results
  } catch (error) {
    console.error('Error fetching nearby whisky venues:', error)
    throw error
  }
}

// Text Search for whisky venues
export const searchWhiskyVenues = async (
  query: string,
  location?: { lat: number; lng: number },
  radius: number = 10000
): Promise<GooglePlace[]> => {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL not found')
  }

  try {
    const params = new URLSearchParams({
      endpoint: 'textsearch',
      query: query
    })

    if (location) {
      params.append('lat', location.lat.toString())
      params.append('lng', location.lng.toString())
      params.append('radius', radius.toString())
    }

    const url = `${PLACES_PROXY_URL}?${params}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: NearbySearchResponse = await response.json()

    if (data.error) {
      throw new Error(`Places API error: ${data.error}`)
    }

    if (data.status !== 'OK') {
      throw new Error(`Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`)
    }

    return data.results
  } catch (error) {
    console.error('Error searching whisky venues:', error)
    throw error
  }
}

// Get Place Details
export const getPlaceDetails = async (placeId: string): Promise<GooglePlace> => {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL not found')
  }

  try {
    const params = new URLSearchParams({
      endpoint: 'details',
      place_id: placeId
    })

    const url = `${PLACES_PROXY_URL}?${params}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: PlaceDetailsResponse = await response.json()

    if (data.error) {
      throw new Error(`Places API error: ${data.error}`)
    }

    if (data.status !== 'OK') {
      throw new Error(`Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`)
    }

    return data.result
  } catch (error) {
    console.error('Error fetching place details:', error)
    throw error
  }
}

// Get Photo URL
export const getPhotoUrl = (
  photoReference: string,
  maxWidth: number = 400,
  maxHeight?: number
): string => {
  if (!SUPABASE_URL) {
    return ''
  }

  const params = new URLSearchParams({
    endpoint: 'photo',
    photo_reference: photoReference,
    maxwidth: maxWidth.toString()
  })

  if (maxHeight) {
    params.append('maxheight', maxHeight.toString())
  }

  return `${PLACES_PROXY_URL}?${params}`
}

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Filter venues by whisky relevance
export const filterWhiskyRelevantVenues = (venues: GooglePlace[]): GooglePlace[] => {
  const whiskyKeywords = [
    'whisky', 'whiskey', 'bourbon', 'scotch', 'rye', 'malt',
    'distillery', 'spirits', 'liquor', 'bar', 'pub', 'tavern'
  ]

  return venues.filter(venue => {
    const nameAndTypes = `${venue.name} ${venue.types.join(' ')}`.toLowerCase()
    return whiskyKeywords.some(keyword => nameAndTypes.includes(keyword))
  })
}

// Convert Google Place to our venue format
export const convertToVenue = (
  place: GooglePlace,
  userLocation?: { lat: number; lng: number }
) => {
  const distance = userLocation
    ? calculateDistance(
        userLocation.lat,
        userLocation.lng,
        place.geometry.location.lat,
        place.geometry.location.lng
      )
    : null

  return {
    id: place.place_id,
    name: place.name,
    type: place.types.includes('liquor_store') ? 'store' : 'bar',
    rating: place.rating || 0,
    distance: distance ? `${distance.toFixed(1)} km` : 'Unknown',
    actualDistance: distance,
    isOpen: place.opening_hours?.open_now ?? null,
    address: place.vicinity || place.formatted_address,
    photo: place.photos?.[0] ? getPhotoUrl(place.photos[0].photo_reference, 300) : null,
    priceLevel: place.price_level,
    userRatingsTotal: place.user_ratings_total
  }
}