import { useCallback, useEffect, useRef, RefObject } from 'react'
import { useHapticFeedback } from './useHapticFeedback'

export interface SwipeGestureOptions {
  threshold?: number
  timeout?: number
  velocity?: number
  restrain?: number
  allowedTime?: number
  enableHaptic?: boolean
}

export interface SwipeGestureHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onSwipeStart?: (startX: number, startY: number) => void
  onSwipeEnd?: (endX: number, endY: number, direction: SwipeDirection | null) => void
}

export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export function useSwipeGestures(
  elementRef: RefObject<HTMLElement>,
  handlers: SwipeGestureHandlers,
  options: SwipeGestureOptions = {}
) {
  const { hapticSwipe } = useHapticFeedback()

  const {
    threshold = 50,
    timeout = 300,
    velocity = 0.3,
    restrain = 100,
    allowedTime = 1000,
    enableHaptic = true
  } = options

  const startX = useRef(0)
  const startY = useRef(0)
  const startTime = useRef(0)
  const isTracking = useRef(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    startX.current = touch.clientX
    startY.current = touch.clientY
    startTime.current = new Date().getTime()
    isTracking.current = true

    handlers.onSwipeStart?.(startX.current, startY.current)
  }, [handlers])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isTracking.current) return

    const touch = e.changedTouches[0]
    const endX = touch.clientX
    const endY = touch.clientY
    const endTime = new Date().getTime()

    const distanceX = endX - startX.current
    const distanceY = endY - startY.current
    const elapsedTime = endTime - startTime.current

    isTracking.current = false

    // Check if swipe was fast enough
    if (elapsedTime > allowedTime) {
      handlers.onSwipeEnd?.(endX, endY, null)
      return
    }

    const velocityX = Math.abs(distanceX) / elapsedTime
    const velocityY = Math.abs(distanceY) / elapsedTime

    // Check if swipe was fast and long enough
    if (velocityX < velocity && velocityY < velocity) {
      handlers.onSwipeEnd?.(endX, endY, null)
      return
    }

    let direction: SwipeDirection | null = null

    // Determine primary direction
    if (Math.abs(distanceX) >= Math.abs(distanceY)) {
      // Horizontal swipe
      if (Math.abs(distanceX) >= threshold && Math.abs(distanceY) <= restrain) {
        if (distanceX > 0) {
          direction = 'right'
          handlers.onSwipeRight?.()
        } else {
          direction = 'left'
          handlers.onSwipeLeft?.()
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(distanceY) >= threshold && Math.abs(distanceX) <= restrain) {
        if (distanceY > 0) {
          direction = 'down'
          handlers.onSwipeDown?.()
        } else {
          direction = 'up'
          handlers.onSwipeUp?.()
        }
      }
    }

    if (direction && enableHaptic) {
      hapticSwipe()
    }

    handlers.onSwipeEnd?.(endX, endY, direction)
  }, [handlers, threshold, restrain, velocity, allowedTime, enableHaptic, hapticSwipe])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Prevent default scrolling behavior during swipe
    if (isTracking.current) {
      e.preventDefault()
    }
  }, [])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Add touch event listeners with passive: false to allow preventDefault
    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchmove', handleTouchMove)
    }
  }, [elementRef, handleTouchStart, handleTouchEnd, handleTouchMove])

  return {
    isTracking: isTracking.current
  }
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(
  elementRef: RefObject<HTMLElement>,
  onRefresh: () => Promise<void> | void,
  options: {
    threshold?: number
    maxPullDistance?: number
    enableHaptic?: boolean
    disabled?: boolean
  } = {}
) {
  const { hapticSuccess, hapticNotification } = useHapticFeedback()

  const {
    threshold = 60,
    maxPullDistance = 120,
    enableHaptic = true,
    disabled = false
  } = options

  const startY = useRef(0)
  const currentY = useRef(0)
  const pullDistance = useRef(0)
  const isRefreshing = useRef(false)
  const isPulling = useRef(false)
  const canPull = useRef(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing.current) return

    const element = elementRef.current
    if (!element) return

    // Only allow pull-to-refresh when scrolled to top
    canPull.current = element.scrollTop === 0

    if (canPull.current) {
      startY.current = e.touches[0].clientY
      isPulling.current = false
    }
  }, [disabled, elementRef])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing.current || !canPull.current) return

    currentY.current = e.touches[0].clientY
    pullDistance.current = currentY.current - startY.current

    if (pullDistance.current > 0) {
      isPulling.current = true
      e.preventDefault()

      // Limit pull distance
      pullDistance.current = Math.min(pullDistance.current, maxPullDistance)

      // Visual feedback based on pull distance
      const element = elementRef.current
      if (element) {
        const progress = Math.min(pullDistance.current / threshold, 1)
        element.style.transform = `translateY(${pullDistance.current * 0.5}px)`
        element.style.opacity = (1 - progress * 0.1).toString()
      }

      // Haptic feedback when threshold reached
      if (enableHaptic && pullDistance.current >= threshold && !isRefreshing.current) {
        hapticNotification()
      }
    }
  }, [disabled, threshold, maxPullDistance, enableHaptic, hapticNotification, elementRef])

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing.current || !isPulling.current) return

    const element = elementRef.current
    if (!element) return

    isPulling.current = false
    canPull.current = false

    // Reset transform and opacity
    element.style.transform = ''
    element.style.opacity = ''

    if (pullDistance.current >= threshold) {
      isRefreshing.current = true

      if (enableHaptic) {
        hapticSuccess()
      }

      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        isRefreshing.current = false
        pullDistance.current = 0
      }
    }

    pullDistance.current = 0
  }, [disabled, threshold, enableHaptic, hapticSuccess, onRefresh, elementRef])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, { passive: false })
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    element.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchmove', handleTouchMove)
      element.removeEventListener('touchend', handleTouchEnd)
    }
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    isRefreshing: isRefreshing.current,
    isPulling: isPulling.current,
    pullDistance: pullDistance.current,
    progress: Math.min(pullDistance.current / threshold, 1)
  }
}