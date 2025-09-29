import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const searchParams = url.searchParams

    const endpoint = searchParams.get('endpoint')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius') || '5000'
    const type = searchParams.get('type') || 'bar'
    const query = searchParams.get('query')
    const placeId = searchParams.get('place_id')

    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')

    if (!GOOGLE_API_KEY) {
      throw new Error('Google Places API key not configured')
    }

    let apiUrl = ''

    switch (endpoint) {
      case 'nearby':
        if (!lat || !lng) {
          throw new Error('Latitude and longitude are required for nearby search')
        }
        const nearbyParams = new URLSearchParams({
          location: `${lat},${lng}`,
          radius,
          type,
          keyword: 'whisky OR whiskey OR spirits OR bar',
          key: GOOGLE_API_KEY
        })
        apiUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${nearbyParams}`
        break

      case 'textsearch':
        if (!query) {
          throw new Error('Query is required for text search')
        }
        const textParams = new URLSearchParams({
          query: `${query} whisky bar OR liquor store`,
          key: GOOGLE_API_KEY
        })
        if (lat && lng) {
          textParams.append('location', `${lat},${lng}`)
          textParams.append('radius', radius)
        }
        apiUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?${textParams}`
        break

      case 'details':
        if (!placeId) {
          throw new Error('Place ID is required for place details')
        }
        const detailsParams = new URLSearchParams({
          place_id: placeId,
          fields: 'place_id,name,formatted_address,rating,user_ratings_total,photos,opening_hours,geometry,types,business_status,price_level,website,formatted_phone_number',
          key: GOOGLE_API_KEY
        })
        apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?${detailsParams}`
        break

      case 'photo':
        const photoReference = searchParams.get('photo_reference')
        const maxwidth = searchParams.get('maxwidth') || '400'
        const maxheight = searchParams.get('maxheight')

        if (!photoReference) {
          throw new Error('Photo reference is required for photo endpoint')
        }

        const photoParams = new URLSearchParams({
          photo_reference: photoReference,
          maxwidth,
          key: GOOGLE_API_KEY
        })

        if (maxheight) {
          photoParams.append('maxheight', maxheight)
        }

        apiUrl = `https://maps.googleapis.com/maps/api/place/photo?${photoParams}`

        // For photos, we need to return the actual image, not JSON
        const photoResponse = await fetch(apiUrl)
        const photoBlob = await photoResponse.blob()

        return new Response(photoBlob, {
          headers: {
            ...corsHeaders,
            'Content-Type': photoResponse.headers.get('content-type') || 'image/jpeg',
          },
        })

      default:
        throw new Error('Invalid endpoint. Use: nearby, textsearch, details, or photo')
    }

    const response = await fetch(apiUrl)
    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})