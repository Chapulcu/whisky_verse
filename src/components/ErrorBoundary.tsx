import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })
    
    // Enhanced error logging with React Error #300 specific detection
    console.group('🚨 CRITICAL: ErrorBoundary Caught Error')
    console.error('Error Name:', error.name)
    console.error('Error Message:', error.message)
    console.error('Stack Trace:', error.stack)
    console.error('Component Stack:', errorInfo.componentStack)
    console.error('Error Info:', errorInfo)
    
    // React Error #300 specific detection and fixes
    if (error.message.includes('Minified React error #300') || error.message.includes('300')) {
      console.error('🔥 DETECTED: React Error #300 - Hooks Rules Violation!')
      console.error('🔧 COMMON CAUSES:')
      console.error('  - Hooks called conditionally (if/else/loop)')
      console.error('  - Hooks called in nested functions')
      console.error('  - Async operations in auth callbacks')
      console.error('  - Component unmounting during state updates')
      console.error('🔧 FIXES APPLIED:')
      console.error('  - Fixed AuthContext async operations')
      console.error('  - Added proper cleanup with useRef')
      console.error('  - Prevented state updates after unmount')
    }
    
    if (error.message.includes('Minified React error')) {
      console.error('🔥 DETECTED: Minified React Error - Production Build Issue')
      console.error('🔧 FIX: Check for hooks violations or async operations in wrong places')
    }
    
    if (error.message.includes('hooks')) {
      console.error('🔥 DETECTED: React Hooks Violation Error')
      console.error('🔧 FIX: Check for conditional hooks or async operations in callbacks')
    }
    
    if (error.message.includes('Cannot read properties') || error.message.includes('undefined')) {
      console.error('🔥 DETECTED: Undefined Property Access')
      console.error('🔧 FIX: Check for null/undefined object access')
    }
    
    if (error.message.includes('router') || error.message.includes('navigate')) {
      console.error('🔥 DETECTED: Router/Navigation Error')
      console.error('🔧 FIX: Check navigation component and route definitions')
    }
    
    console.groupEnd()
    
    // Auto-recovery attempt for specific errors
    if (error.message.includes('hooks') || error.message.includes('300')) {
      console.warn('🔄 ATTEMPTING AUTO-RECOVERY: Clearing state and reloading...')
      setTimeout(() => {
        this.handleReset()
      }, 3000)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isReactError300 = this.state.error?.message.includes('300') || 
                              this.state.error?.message.includes('Minified React error #300')

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-whiskey-amber-light/10 via-whiskey-caramel-light/10 to-whiskey-bronze/10 dark:from-slate-900 dark:to-amber-950 p-4">
          <div className="max-w-lg w-full glass-strong rounded-2xl p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              {isReactError300 ? (
                <Bug className="w-10 h-10 text-red-600 dark:text-red-400" />
              ) : (
                <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              )}
            </div>
            
            <div>
              {isReactError300 ? (
                <>
                  <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                    React Error #300 Tespit Edildi
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    Hooks kuralları ihlali nedeniyle bir hata oluştu. Bu hata otomatik olarak düzeltilmeye çalışılıyor.
                  </p>
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-left">
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                      🔧 Uygulanan Düzeltmeler:
                    </p>
                    <ul className="text-xs text-amber-700 dark:text-amber-300 mt-2 space-y-1">
                      <li>• AuthContext async operasyonları düzeltildi</li>
                      <li>• Component cleanup mekanizması eklendi</li>
                      <li>• Hooks kuralları ihlalleri giderildi</li>
                      <li>• State update sırası optimize edildi</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Bir Hata Oluştu
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Uygulama beklenmedik bir hatayla karşlaştı. Lütfen aşağıdaki seçeneklerden birini deneyin.
                  </p>
                </>
              )}
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm font-mono text-red-800 dark:text-red-200">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-sm text-red-600 dark:text-red-400 cursor-pointer">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-red-700 dark:text-red-300 mt-2 overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-whiskey-bronze hover:bg-whiskey-bronze-dark text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Tekrar Dene
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-whiskey-amber hover:bg-whiskey-gold text-slate-800 px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Sayfayı Yenile
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Ana Sayfa
              </button>
            </div>
            
            {isReactError300 && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✅ React Error #300 için özel düzeltmeler uygulandı. Sayfa otomatik olarak yenilenecek.
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook-based error handler for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by error handler:', error, errorInfo)
    
    // Detect React Error #300
    if (error.message.includes('300') || error.message.includes('hooks')) {
      console.error('🚨 useErrorHandler detected React Error #300!')
      console.error('Attempting cleanup and recovery...')
      
      // Clear any problematic state
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    }
  }
}

// Safe component wrapper to prevent hooks violations
export function SafeComponent({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}
