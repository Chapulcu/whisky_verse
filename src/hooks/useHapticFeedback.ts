import { useCallback } from 'react'

export type HapticPattern = number | number[]

export interface HapticFeedbackOptions {
  pattern?: HapticPattern
  enabled?: boolean
}

export function useHapticFeedback() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator

  const vibrate = useCallback((pattern: HapticPattern = 100): boolean => {
    if (!isSupported) {
      return false
    }

    try {
      const vibratePattern = typeof pattern === 'number' ? [pattern] : pattern
      return navigator.vibrate(vibratePattern)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Vibration failed:', error)
      }
      return false
    }
  }, [isSupported])

  const stopVibration = useCallback((): boolean => {
    if (!isSupported) {
      return false
    }

    try {
      navigator.vibrate(0)
      return true
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Stop vibration failed:', error)
      }
      return false
    }
  }, [isSupported])

  // Predefined haptic patterns for different interactions
  const patterns = {
    // Basic interactions
    tap: [50],
    doubleTap: [50, 50, 50],
    longPress: [100],

    // UI feedback
    buttonPress: [30],
    success: [100, 50, 100],
    error: [200, 100, 200, 100, 200],
    warning: [150, 100, 150],

    // Navigation
    swipe: [25],
    pageChange: [50, 25, 50],

    // Notifications
    notification: [200, 100, 200],
    message: [100, 50, 100, 50, 100],

    // Camera actions
    photoCapture: [75],
    focusConfirm: [25, 25, 25],

    // Special effects
    heartbeat: [100, 100, 100, 100, 300, 300],
    drumroll: [50, 50, 50, 50, 50, 50, 200],
    celebration: [100, 50, 100, 50, 100, 50, 300]
  }

  // Convenience methods for common patterns
  const hapticTap = useCallback(() => vibrate(patterns.tap), [vibrate])
  const hapticDoubleTap = useCallback(() => vibrate(patterns.doubleTap), [vibrate])
  const hapticLongPress = useCallback(() => vibrate(patterns.longPress), [vibrate])
  const hapticButton = useCallback(() => vibrate(patterns.buttonPress), [vibrate])
  const hapticSuccess = useCallback(() => vibrate(patterns.success), [vibrate])
  const hapticError = useCallback(() => vibrate(patterns.error), [vibrate])
  const hapticWarning = useCallback(() => vibrate(patterns.warning), [vibrate])
  const hapticSwipe = useCallback(() => vibrate(patterns.swipe), [vibrate])
  const hapticPageChange = useCallback(() => vibrate(patterns.pageChange), [vibrate])
  const hapticNotification = useCallback(() => vibrate(patterns.notification), [vibrate])
  const hapticMessage = useCallback(() => vibrate(patterns.message), [vibrate])
  const hapticPhotoCapture = useCallback(() => vibrate(patterns.photoCapture), [vibrate])
  const hapticFocusConfirm = useCallback(() => vibrate(patterns.focusConfirm), [vibrate])
  const hapticHeartbeat = useCallback(() => vibrate(patterns.heartbeat), [vibrate])
  const hapticCelebration = useCallback(() => vibrate(patterns.celebration), [vibrate])

  // Configurable vibration with user preferences
  const hapticWithPreference = useCallback((
    pattern: HapticPattern,
    options: HapticFeedbackOptions = {}
  ): boolean => {
    const { enabled = true } = options

    // Check user preference for haptic feedback
    const userPreference = localStorage.getItem('haptic-feedback-enabled')
    const hapticEnabled = userPreference ? JSON.parse(userPreference) : true

    if (!enabled || !hapticEnabled) {
      return false
    }

    return vibrate(pattern)
  }, [vibrate])

  // Method to toggle user preference
  const toggleHapticPreference = useCallback((): boolean => {
    const current = localStorage.getItem('haptic-feedback-enabled')
    const currentValue = current ? JSON.parse(current) : true
    const newValue = !currentValue

    localStorage.setItem('haptic-feedback-enabled', JSON.stringify(newValue))
    return newValue
  }, [])

  // Method to get current preference
  const getHapticPreference = useCallback((): boolean => {
    const preference = localStorage.getItem('haptic-feedback-enabled')
    return preference ? JSON.parse(preference) : true
  }, [])

  return {
    // Core functionality
    isSupported,
    vibrate,
    stopVibration,

    // Patterns
    patterns,

    // Convenience methods
    hapticTap,
    hapticDoubleTap,
    hapticLongPress,
    hapticButton,
    hapticSuccess,
    hapticError,
    hapticWarning,
    hapticSwipe,
    hapticPageChange,
    hapticNotification,
    hapticMessage,
    hapticPhotoCapture,
    hapticFocusConfirm,
    hapticHeartbeat,
    hapticCelebration,

    // Configuration
    hapticWithPreference,
    toggleHapticPreference,
    getHapticPreference
  }
}
