import { useCallback } from 'react'

export interface ShareData {
  title: string
  text?: string
  url?: string
  files?: File[]
}

interface ShareResult {
  success: boolean
  error?: string
}

export function useWebShare() {
  const isSupported = typeof navigator !== 'undefined' && 'share' in navigator
  const canShareFiles = typeof navigator !== 'undefined' && 'canShare' in navigator

  const share = useCallback(async (data: ShareData): Promise<ShareResult> => {
    if (!isSupported) {
      return {
        success: false,
        error: 'Web Share API is not supported on this browser'
      }
    }

    // Validate required data
    if (!data.title) {
      return {
        success: false,
        error: 'Title is required for sharing'
      }
    }

    // Check if files can be shared (if files are provided)
    if (data.files && data.files.length > 0) {
      if (!canShareFiles) {
        return {
          success: false,
          error: 'File sharing is not supported on this browser'
        }
      }

      // Check if the specific files can be shared
      if (!navigator.canShare({ files: data.files })) {
        return {
          success: false,
          error: 'The selected files cannot be shared'
        }
      }
    }

    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
        files: data.files
      })

      return { success: true }
    } catch (error) {
      // User cancelled the share dialog
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Share cancelled by user'
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Share failed'
      }
    }
  }, [isSupported, canShareFiles])

  const shareWhisky = useCallback(async (whisky: {
    name: string
    description?: string
    image_url?: string
  }): Promise<ShareResult> => {
    const shareData: ShareData = {
      title: `${whisky.name} - WhiskyVerse`,
      text: whisky.description
        ? `${whisky.description}\n\nWhiskyVerse'te keşfedin!`
        : `Bu harika viski'yi WhiskyVerse'te keşfedin! ${whisky.name}`,
      url: window.location.href
    }

    return await share(shareData)
  }, [share])

  const shareCollection = useCallback(async (collection: {
    name: string
    count: number
  }): Promise<ShareResult> => {
    const shareData: ShareData = {
      title: `Viski Koleksiyonum - WhiskyVerse`,
      text: `${collection.count} viski içeren "${collection.name}" koleksiyonumu WhiskyVerse'te görün!`,
      url: window.location.href
    }

    return await share(shareData)
  }, [share])

  const shareLocation = useCallback(async (location: {
    name: string
    address: string
    type: string
  }): Promise<ShareResult> => {
    const shareData: ShareData = {
      title: `${location.name} - WhiskyVerse`,
      text: `${location.address} adresinde harika bir ${location.type}! WhiskyVerse'te keşfedin.`,
      url: window.location.href
    }

    return await share(shareData)
  }, [share])

  const shareWithPhoto = useCallback(async (data: {
    title: string
    text?: string
    photo: File
  }): Promise<ShareResult> => {
    if (!canShareFiles) {
      // Fallback: share text without file
      return await share({
        title: data.title,
        text: data.text,
        url: window.location.href
      })
    }

    return await share({
      title: data.title,
      text: data.text,
      files: [data.photo]
    })
  }, [share, canShareFiles])

  // Fallback sharing methods for unsupported browsers
  const fallbackShare = useCallback((data: ShareData) => {
    const shareText = `${data.title}\n${data.text || ''}\n${data.url || ''}`

    // Try to copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText)
        .then(() => {
          // Could show a toast notification here
          console.log('Share content copied to clipboard')
        })
        .catch(() => {
          // Fallback to opening in new window
          const encodedText = encodeURIComponent(shareText)
          window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank')
        })
    } else {
      // Very basic fallback
      const encodedText = encodeURIComponent(shareText)
      window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank')
    }

    return { success: true }
  }, [])

  return {
    isSupported,
    canShareFiles,
    share,
    shareWhisky,
    shareCollection,
    shareLocation,
    shareWithPhoto,
    fallbackShare
  }
}