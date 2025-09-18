import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class WhiskyErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WhiskyErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // TODO: Send error to monitoring service (Sentry, etc.)
    // Example: sendErrorReport(error, errorInfo)
  }

  private handleRefresh = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="card text-center max-w-lg w-full">
            <div className="flex flex-col items-center space-y-6">
              {/* Error Icon */}
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>

              {/* Error Message */}
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                  Bir şeyler ters gitti
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Bu sayfayı yüklerken beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya ana sayfaya dönün.
                </p>

                {/* Error Details in Development */}
                {import.meta.env.DEV && this.state.error && (
                  <details className="mt-4 text-left">
                    <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                      Hata Detayları (Geliştirici Modu)
                    </summary>
                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-700 dark:text-red-300 font-mono overflow-auto">
                      <strong>Error:</strong> {this.state.error.message}
                      {this.state.errorInfo && (
                        <>
                          <br />
                          <strong>Stack:</strong>
                          <pre className="mt-1 whitespace-pre-wrap">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </>
                      )}
                    </div>
                  </details>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={this.handleRefresh}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 mobile-touch-target"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sayfayı Yenile
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2 mobile-touch-target"
                >
                  <Home className="w-4 h-4" />
                  Ana Sayfaya Dön
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// HOC wrapper for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <WhiskyErrorBoundary fallback={fallback}>
        <Component {...props} />
      </WhiskyErrorBoundary>
    )
  }
}

// Hook for manually triggering error boundaries
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    console.error('Manual error thrown for boundary:', error)
    throw error
  }
}