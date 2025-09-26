import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import QRCode from 'qrcode'
import QrScanner from 'qr-scanner'

export interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

export function useQRCode() {
  const { t } = useTranslation()
  const [isGenerating, setIsGenerating] = useState(false)
  const [isScanning, setIsScanning] = useState(false)

  // Check camera permissions and availability with enhanced iOS detection
  const checkCameraPermissions = useCallback(async (): Promise<{
    hasCamera: boolean;
    hasPermission: boolean;
    error?: string;
    deviceInfo?: {
      isIOS: boolean;
      isSafari: boolean;
      isSecureContext: boolean;
      hasMediaDevices: boolean;
    };
  }> => {
    const deviceInfo = {
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
      isSecureContext: window.isSecureContext,
      hasMediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    }

    console.log('Camera check - Device info:', deviceInfo)

    try {
      // Enhanced security context check
      if (!deviceInfo.isSecureContext) {
        return {
          hasCamera: false,
          hasPermission: false,
          error: 'HTTPS gerekli - güvenli bağlantı yok',
          deviceInfo
        }
      }

      // MediaDevices API check
      if (!deviceInfo.hasMediaDevices) {
        return {
          hasCamera: false,
          hasPermission: false,
          error: 'Bu tarayıcı kamera erişimini desteklemiyor',
          deviceInfo
        }
      }

      // Check available devices first
      let hasVideoDevice = false
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        hasVideoDevice = devices.some(device => device.kind === 'videoinput')
        console.log('Available devices:', devices.length, 'Video devices:', devices.filter(d => d.kind === 'videoinput').length)
      } catch (enumError) {
        console.warn('Device enumeration failed:', enumError)
        // On iOS Safari, this might fail initially, so we assume camera exists
        hasVideoDevice = true
      }

      if (!hasVideoDevice) {
        return {
          hasCamera: false,
          hasPermission: false,
          error: t('qr.cameraNotFound'),
          deviceInfo
        }
      }

      // QrScanner hasCamera check (secondary verification)
      const qrScannerHasCamera = await QrScanner.hasCamera().catch(() => false)
      console.log('QrScanner hasCamera:', qrScannerHasCamera)

      // Permission test with getUserMedia
      try {
        const constraints = {
          video: deviceInfo.isIOS && deviceInfo.isSafari ? {
            facingMode: 'environment',
            width: { min: 320, ideal: 640, max: 1920 },
            height: { min: 240, ideal: 480, max: 1080 }
          } : true
        }

        console.log('Testing camera permission with constraints:', constraints)
        const stream = await navigator.mediaDevices.getUserMedia(constraints)

        // Check if stream has video tracks
        const videoTracks = stream.getVideoTracks()
        console.log('Video tracks:', videoTracks.length)

        // Stop immediately after check
        stream.getTracks().forEach(track => track.stop())

        return {
          hasCamera: true,
          hasPermission: true,
          deviceInfo
        }
      } catch (permissionError: any) {
        console.error('Camera permission error:', permissionError)

        let errorMessage = t('qr.cameraAccessError')
        if (permissionError.name === 'NotAllowedError') {
          errorMessage = t('qr.cameraPermissionDenied')
        } else if (permissionError.name === 'NotFoundError') {
          errorMessage = t('qr.cameraNotFound')
        } else if (permissionError.name === 'NotSupportedError') {
          errorMessage = 'Bu cihazda kamera desteklenmiyor'
        } else if (permissionError.name === 'SecurityError') {
          errorMessage = 'Güvenlik hatası - HTTPS gerekli'
        }

        return {
          hasCamera: hasVideoDevice,
          hasPermission: false,
          error: errorMessage,
          deviceInfo
        }
      }
    } catch (error: any) {
      console.error('Camera check failed:', error)
      return {
        hasCamera: false,
        hasPermission: false,
        error: t('qr.cameraAccessError') + ': ' + error.message,
        deviceInfo
      }
    }
  }, [t])

  // Generate QR Code as Data URL
  const generateQRCode = useCallback(async (
    text: string,
    options: QRCodeOptions = {}
  ): Promise<string> => {
    setIsGenerating(true)

    try {
      const defaultOptions = {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M' as const,
        ...options
      }

      const qrCodeDataURL = await QRCode.toDataURL(text, defaultOptions)
      return qrCodeDataURL
    } catch (error) {
      console.error('QR Code generation failed:', error)
      throw new Error(t('qr.generationFailed'))
    } finally {
      setIsGenerating(false)
    }
  }, [t])

  // Generate QR Code as SVG string
  const generateQRCodeSVG = useCallback(async (
    text: string,
    options: QRCodeOptions = {}
  ): Promise<string> => {
    setIsGenerating(true)

    try {
      const defaultOptions = {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M' as const,
        ...options
      }

      const qrCodeSVG = await QRCode.toString(text, {
        type: 'svg',
        ...defaultOptions
      })
      return qrCodeSVG
    } catch (error) {
      console.error('QR Code SVG generation failed:', error)
      throw new Error(t('qr.generationFailed'))
    } finally {
      setIsGenerating(false)
    }
  }, [t])

  // Scan QR Code from camera
  const scanQRCode = useCallback(async (
    videoElement: HTMLVideoElement
  ): Promise<string> => {
    // Check camera permissions before scanning
    const cameraStatus = await checkCameraPermissions()
    if (!cameraStatus.hasCamera || !cameraStatus.hasPermission) {
      throw new Error(cameraStatus.error || 'Kamera kullanılamıyor')
    }

    setIsScanning(true)

    try {
      const qrScanner = new QrScanner(
        videoElement,
        (result) => {
          return result.data
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true
        }
      )

      await qrScanner.start()

      return new Promise((resolve, reject) => {
        qrScanner.setInversionMode('both')

        const timeout = setTimeout(() => {
          qrScanner.stop()
          qrScanner.destroy()
          reject(new Error(t('qr.scanTimeoutError')))
        }, 30000) // 30 second timeout

        // Use modern event-based approach instead of deprecated callbacks
        const handleDecodeError = (error: any) => {
          console.warn('QR scan decode error:', error)
        }

        const handleDecodeSuccess = (result: any) => {
          clearTimeout(timeout)
          qrScanner.stop()
          qrScanner.destroy()
          resolve(result.data)
        }

        // Setup event handlers
        qrScanner.addEventListener?.('decode-error', handleDecodeError)
        qrScanner.addEventListener?.('decode-success', handleDecodeSuccess)
      })
    } catch (error) {
      console.error('QR Code scanning failed:', error)
      throw new Error(t('qr.scanningFailed'))
    } finally {
      setIsScanning(false)
    }
  }, [t, checkCameraPermissions])

  // Scan QR Code from image file
  const scanQRCodeFromFile = useCallback(async (file: File): Promise<string> => {
    try {
      const result = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true
      })

      return result.data
    } catch (error) {
      console.error('QR Code scanning from file failed:', error)
      throw new Error(t('qr.scanningFailed'))
    }
  }, [t])

  // Generate profile share QR Code
  const generateProfileQR = useCallback(async (
    userId: string,
    username: string
  ): Promise<string> => {
    const profileUrl = `${window.location.origin}/profile/${userId}`
    const qrData = JSON.stringify({
      type: 'profile',
      userId,
      username,
      url: profileUrl,
      timestamp: Date.now()
    })

    return await generateQRCode(qrData, {
      width: 300,
      margin: 3,
      color: {
        dark: '#1f2937',
        light: '#ffffff'
      }
    })
  }, [generateQRCode])

  // Generate whisky share QR Code
  const generateWhiskyQR = useCallback(async (
    whiskyId: string,
    whiskyName: string
  ): Promise<string> => {
    const whiskyUrl = `${window.location.origin}/whiskies/${whiskyId}`
    const qrData = JSON.stringify({
      type: 'whisky',
      whiskyId,
      whiskyName,
      url: whiskyUrl,
      timestamp: Date.now()
    })

    return await generateQRCode(qrData, {
      width: 300,
      margin: 3,
      color: {
        dark: '#f59e0b',
        light: '#ffffff'
      }
    })
  }, [generateQRCode])

  // Generate collection share QR Code
  const generateCollectionQR = useCallback(async (
    userId: string,
    collectionName: string
  ): Promise<string> => {
    const collectionUrl = `${window.location.origin}/collection/${userId}`
    const qrData = JSON.stringify({
      type: 'collection',
      userId,
      collectionName,
      url: collectionUrl,
      timestamp: Date.now()
    })

    return await generateQRCode(qrData, {
      width: 300,
      margin: 3,
      color: {
        dark: '#8b5cf6',
        light: '#ffffff'
      }
    })
  }, [generateQRCode])

  // Parse scanned QR data
  const parseQRData = useCallback((qrText: string) => {
    try {
      // Try to parse as JSON first (our custom format)
      const data = JSON.parse(qrText)

      if (data.type && data.url) {
        return {
          isWhiskyVerse: true,
          type: data.type,
          data: data
        }
      }
    } catch {
      // Not JSON, treat as regular URL or text
    }

    // Check if it's a URL
    try {
      const url = new URL(qrText)
      return {
        isWhiskyVerse: url.hostname === window.location.hostname,
        type: 'url',
        data: { url: qrText }
      }
    } catch {
      // Not a URL, treat as plain text
      return {
        isWhiskyVerse: false,
        type: 'text',
        data: { text: qrText }
      }
    }
  }, [t])

  // Download QR Code as image
  const downloadQRCode = useCallback(async (
    qrCodeDataURL: string,
    filename: string = 'qr-code.png'
  ) => {
    try {
      const link = document.createElement('a')
      link.download = filename
      link.href = qrCodeDataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('QR Code download failed:', error)
      throw new Error(t('qr.scanningFailed'))
    }
  }, [t])

  return {
    // State
    isGenerating,
    isScanning,

    // Core functions
    generateQRCode,
    generateQRCodeSVG,
    scanQRCode,
    scanQRCodeFromFile,

    // Specialized generators
    generateProfileQR,
    generateWhiskyQR,
    generateCollectionQR,

    // Utilities
    parseQRData,
    downloadQRCode,
    checkCameraPermissions,

    // Camera support check
    hasCamera: QrScanner.hasCamera(),
    listCameras: QrScanner.listCameras
  }
}