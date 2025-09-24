/**
 * Enhanced Error Handling Utilities
 * Provides consistent error handling across the application
 */

import { handleApiError, isApiError } from '@/types/api'
import toast from 'react-hot-toast'

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error categories
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  UNKNOWN = 'unknown'
}

// Enhanced error interface
export interface AppError {
  message: string
  code?: string
  category: ErrorCategory
  severity: ErrorSeverity
  context?: string
  originalError?: any
  userMessage?: string
  retryable?: boolean
}

// Error creation helpers
export function createAppError(
  message: string,
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  severity: ErrorSeverity = ErrorSeverity.MEDIUM,
  options: Partial<AppError> = {}
): AppError {
  return {
    message,
    category,
    severity,
    userMessage: message,
    retryable: false,
    ...options
  }
}

// Network error detection
export function isNetworkError(error: any): boolean {
  if (!error) return false

  const message = String(error.message || error).toLowerCase()
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    error.code === 'NETWORK_ERROR' ||
    error.name === 'NetworkError'
  )
}

// Database error detection
export function isDatabaseError(error: any): boolean {
  if (!error) return false

  const code = error.code || ''
  return (
    code.startsWith('PGRST') ||
    code.startsWith('23') || // PostgreSQL constraint violations
    code.startsWith('42') || // PostgreSQL syntax errors
    error.message?.includes('database')
  )
}

// Authentication error detection
export function isAuthError(error: any): boolean {
  if (!error) return false

  const code = error.code || ''
  const message = String(error.message || '').toLowerCase()

  return (
    code === 'invalid_credentials' ||
    code === 'email_not_confirmed' ||
    code === 'invalid_grant' ||
    message.includes('invalid login credentials') ||
    message.includes('not authenticated') ||
    message.includes('session expired')
  )
}

// Categorize errors automatically
export function categorizeError(error: any): ErrorCategory {
  if (isNetworkError(error)) return ErrorCategory.NETWORK
  if (isAuthError(error)) return ErrorCategory.AUTHENTICATION
  if (isDatabaseError(error)) return ErrorCategory.DATABASE

  const code = error.code || ''
  const message = String(error.message || '').toLowerCase()

  if (code === '403' || message.includes('forbidden') || message.includes('unauthorized')) {
    return ErrorCategory.AUTHORIZATION
  }

  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorCategory.VALIDATION
  }

  return ErrorCategory.UNKNOWN
}

// Determine error severity
export function determineErrorSeverity(error: any, category: ErrorCategory): ErrorSeverity {
  // Network errors are usually retryable and medium severity
  if (category === ErrorCategory.NETWORK) {
    return ErrorSeverity.MEDIUM
  }

  // Auth errors are high severity
  if (category === ErrorCategory.AUTHENTICATION) {
    return ErrorSeverity.HIGH
  }

  // Authorization errors are high severity
  if (category === ErrorCategory.AUTHORIZATION) {
    return ErrorSeverity.HIGH
  }

  // Database constraint violations are medium to high
  if (category === ErrorCategory.DATABASE) {
    const code = error.code || ''
    if (code.startsWith('23')) return ErrorSeverity.HIGH // Constraint violations
    return ErrorSeverity.MEDIUM
  }

  return ErrorSeverity.MEDIUM
}

// Check if error is retryable
export function isRetryableError(error: any, category: ErrorCategory): boolean {
  // Network errors are generally retryable
  if (category === ErrorCategory.NETWORK) return true

  // Temporary database issues might be retryable
  if (category === ErrorCategory.DATABASE) {
    const code = error.code || ''
    return code === 'PGRST301' || code === 'PGRST302' // Connection issues
  }

  // Most other errors are not retryable
  return false
}

// Convert any error to AppError
export function normalizeError(error: any, context?: string): AppError {
  if (!error) {
    return createAppError('Unknown error occurred', ErrorCategory.UNKNOWN, ErrorSeverity.LOW, { context })
  }

  const category = categorizeError(error)
  const severity = determineErrorSeverity(error, category)
  const retryable = isRetryableError(error, category)

  const message = handleApiError(error, context)
  let userMessage = message

  // Provide user-friendly messages for common errors
  switch (category) {
    case ErrorCategory.NETWORK:
      userMessage = 'Bağlantı sorunu. Lütfen internet bağlantınızı kontrol edin.'
      break
    case ErrorCategory.AUTHENTICATION:
      userMessage = 'Oturum açma sorunu. Lütfen tekrar giriş yapın.'
      break
    case ErrorCategory.AUTHORIZATION:
      userMessage = 'Bu işlem için yetkiniz bulunmuyor.'
      break
    case ErrorCategory.DATABASE:
      userMessage = 'Veritabanı hatası. Lütfen daha sonra tekrar deneyin.'
      break
    case ErrorCategory.VALIDATION:
      userMessage = 'Girilen bilgiler geçersiz. Lütfen kontrol edin.'
      break
    default:
      userMessage = 'Beklenmeyen bir hata oluştu.'
  }

  return createAppError(message, category, severity, {
    context,
    originalError: error,
    userMessage,
    retryable,
    code: error.code || error.status
  })
}

// Error logging function
export function logError(error: AppError): void {
  const logLevel = {
    [ErrorSeverity.LOW]: 'log',
    [ErrorSeverity.MEDIUM]: 'warn',
    [ErrorSeverity.HIGH]: 'error',
    [ErrorSeverity.CRITICAL]: 'error'
  }[error.severity] as keyof Console

  const logMethod = console[logLevel] as (...args: any[]) => void
  logMethod(`[${error.category.toUpperCase()}] ${error.message}`, {
    severity: error.severity,
    context: error.context,
    code: error.code,
    retryable: error.retryable,
    originalError: error.originalError
  })

  // In production, you might want to send errors to a logging service
  if (error.severity === ErrorSeverity.CRITICAL) {
    // sendToLoggingService(error)
  }
}

// Show error to user with appropriate UI
export function showErrorToUser(error: AppError): void {
  const message = error.userMessage || error.message

  switch (error.severity) {
    case ErrorSeverity.LOW:
      // Don't show low severity errors to users
      break
    case ErrorSeverity.MEDIUM:
      toast.error(message, { duration: 4000 })
      break
    case ErrorSeverity.HIGH:
      toast.error(message, { duration: 6000 })
      break
    case ErrorSeverity.CRITICAL:
      toast.error(message, {
        duration: 8000,
        style: {
          background: '#DC2626',
          color: 'white',
        }
      })
      break
  }
}

// Main error handler function
export function handleError(
  error: any,
  context?: string,
  options: {
    showToUser?: boolean
    logError?: boolean
    throwError?: boolean
  } = {}
): AppError {
  const { showToUser = true, logError: shouldLog = true, throwError = false } = options

  const appError = normalizeError(error, context)

  if (shouldLog) {
    logError(appError)
  }

  if (showToUser) {
    showErrorToUser(appError)
  }

  if (throwError) {
    throw appError
  }

  return appError
}

// Async error handler wrapper
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string,
  options?: { showToUser?: boolean; logError?: boolean }
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args)
    } catch (error) {
      handleError(error, context, options)
      return null
    }
  }
}

// React hook for error handling
export function useErrorHandler() {
  return {
    handleError: (error: any, context?: string) => handleError(error, context),
    normalizeError: (error: any, context?: string) => normalizeError(error, context),
    withErrorHandling: <T extends any[], R>(
      fn: (...args: T) => Promise<R>,
      context?: string
    ) => withErrorHandling(fn, context)
  }
}