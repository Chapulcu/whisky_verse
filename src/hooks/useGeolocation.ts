import { useState, useEffect, useCallback } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
  permissionState: 'unknown' | 'granted' | 'denied' | 'prompt'
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
    loading: false,
    permissionState: 'unknown'
  })

  const defaultOptions: PositionOptions = {
    enableHighAccuracy: false, // Start with low accuracy for better compatibility
    timeout: 15000, // Increase timeout for mobile devices
    maximumAge: 600000, // 10 minutes cache for better UX
    ...options
  }

  // Check permission status
  const checkPermissionStatus = useCallback(async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        setState(prev => ({ ...prev, permissionState: permission.state }))

        permission.addEventListener('change', () => {
          setState(prev => ({ ...prev, permissionState: permission.state }))
        })
      } catch (error) {
        // Permission API not supported, continue with standard geolocation
        console.log('Permission API not supported')
      }
    }
  }, [])

  useEffect(() => {
    checkPermissionStatus()
  }, [])

  const getCurrentPosition = useCallback(async (tryHighAccuracy = false) => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Bu tarayıcıda konum servisi desteklenmiyor',
        loading: false,
        permissionState: 'denied'
      }))
      return
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }))

    const options = {
      ...defaultOptions,
      enableHighAccuracy: tryHighAccuracy
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options)
      })

      setState(prev => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        loading: false,
        permissionState: 'granted'
      }))
    } catch (error: any) {
      let errorMessage = 'Konum alınamadı'
      let permissionState: 'denied' | 'unknown' = 'unknown'

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Konum izni reddedildi. Lütfen tarayıcı ayarlarından konum iznini aktifleştirin.'
          permissionState = 'denied'
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Konum bilgisi mevcut değil. GPS\'iniz açık olduğundan emin olun.'
          break
        case error.TIMEOUT:
          errorMessage = 'Konum isteği zaman aşımına uğradı. Tekrar deneyin.'
          // Try with low accuracy if high accuracy timed out
          if (tryHighAccuracy) {
            setTimeout(() => getCurrentPosition(false), 1000)
            return
          }
          break
        default:
          errorMessage = 'Bilinmeyen bir hata oluştu. Tekrar deneyin.'
          break
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        permissionState
      }))
    }
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

  // Request permission with user guidance
  const requestPermission = useCallback(async () => {
    // First try to get current position which will trigger permission prompt
    await getCurrentPosition(false)
  }, [getCurrentPosition])

  return {
    ...state,
    getCurrentPosition,
    requestPermission,
    watchPosition,
    calculateDistance,
    isSupported: 'geolocation' in navigator,
    canRetry: state.permissionState !== 'denied'
  }
}