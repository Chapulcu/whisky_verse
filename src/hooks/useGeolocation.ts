import { useState, useEffect, useCallback } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false
  })

  const defaultOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000, // 5 minutes
    ...options
  }

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser',
        loading: false
      }))
      return
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }))

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false
        })
      },
      (error) => {
        let errorMessage = 'Location access denied'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            break
          default:
            errorMessage = 'An unknown error occurred'
            break
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false
        }))
      },
      defaultOptions
    )
  }, [defaultOptions])

  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser'
      }))
      return null
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false
        })
      },
      (error) => {
        setState(prev => ({
          ...prev,
          error: error.message,
          loading: false
        }))
      },
      defaultOptions
    )

    return watchId
  }, [defaultOptions])

  const calculateDistance = useCallback(
    (lat2: number, lon2: number): number | null => {
      if (!state.latitude || !state.longitude) return null

      const R = 6371 // Earth's radius in kilometers
      const dLat = ((lat2 - state.latitude) * Math.PI) / 180
      const dLon = ((lon2 - state.longitude) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((state.latitude * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    },
    [state.latitude, state.longitude]
  )

  return {
    ...state,
    getCurrentPosition,
    watchPosition,
    calculateDistance,
    isSupported: 'geolocation' in navigator
  }
}