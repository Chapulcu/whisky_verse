import { useEffect, useRef, useState } from 'react'

interface NetworkStatus {
  isOnline: boolean
  lastChange: number
}

export function useNetworkStatus(): NetworkStatus {
  const getInitialStatus = () => {
    if (typeof navigator === 'undefined') return true
    return navigator.onLine
  }

  const [isOnline, setIsOnline] = useState<boolean>(getInitialStatus)
  const lastChangeRef = useRef<number>(Date.now())

  useEffect(() => {
    const handleStatusChange = () => {
      lastChangeRef.current = Date.now()
      setIsOnline(getInitialStatus())
    }

    window.addEventListener('online', handleStatusChange)
    window.addEventListener('offline', handleStatusChange)

    return () => {
      window.removeEventListener('online', handleStatusChange)
      window.removeEventListener('offline', handleStatusChange)
    }
  }, [])

  return {
    isOnline,
    lastChange: lastChangeRef.current,
  }
}
