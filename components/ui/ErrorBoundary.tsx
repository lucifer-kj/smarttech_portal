'use client'

import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

interface ErrorFallbackProps {
  error: Error
  errorInfo: ErrorInfo
  errorId: string
  resetError: () => void
  retry: () => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9)
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys && resetKeys.length > 0) {
        this.resetErrorBoundary()
      }
    }

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary()
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to an error reporting service
    // like Sentry, LogRocket, or Bugsnag
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // Example: Send to your error reporting service
    // errorReportingService.captureException(errorData)
    console.error('Error logged to service:', errorData)
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  retry = () => {
    this.resetErrorBoundary()
    // Force a re-render by updating a dummy state
    this.forceUpdate()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback
          error={this.state.error!}
          errorInfo={this.state.errorInfo!}
          errorId={this.state.errorId}
          resetError={this.resetErrorBoundary}
          retry={this.retry}
        />
      )
    }

    return this.props.children
  }
}

function ErrorFallback({ 
  error, 
  errorInfo, 
  errorId, 
  resetError, 
  retry 
}: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h1>

          {/* Error Message */}
          <p className="text-gray-600 mb-6">
            We apologize for the inconvenience. An unexpected error has occurred.
          </p>

          {/* Error ID for Support */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Error ID:</p>
            <code className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded">
              {errorId}
            </code>
          </div>

          {/* Development Error Details */}
          {isDevelopment && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-semibold text-red-800 mb-2">
                Development Error Details:
              </h3>
              <div className="text-sm text-red-700 space-y-2">
                <div>
                  <strong>Error:</strong> {error.message}
                </div>
                {error.stack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {errorInfo.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={retry}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>

          {/* Support Information */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-2">
              If this problem persists, please contact support with the Error ID above.
            </p>
            <div className="flex justify-center space-x-4 text-sm">
              <a 
                href="mailto:support@smarttech.com" 
                className="text-blue-600 hover:text-blue-700"
              >
                Email Support
              </a>
              <span className="text-gray-300">|</span>
              <a 
                href="tel:+1-555-123-4567" 
                className="text-blue-600 hover:text-blue-700"
              >
                Call Support
              </a>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Specific Error Boundaries for Different Components
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log page-level errors
        console.error('Page Error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <ErrorBoundary
      fallback={fallback || (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800 text-sm">
              This component encountered an error and couldn't be displayed.
            </span>
          </div>
        </div>
      )}
      onError={(error, errorInfo) => {
        console.error('Component Error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

export function AsyncErrorBoundary({ 
  children, 
  resetKeys 
}: { 
  children: ReactNode
  resetKeys?: Array<string | number>
}) {
  return (
    <ErrorBoundary
      resetKeys={resetKeys}
      onError={(error, errorInfo) => {
        console.error('Async Error:', error, errorInfo)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Error Boundary Hook for Functional Components
export function useErrorHandler() {
  const handleError = (error: Error, errorInfo?: string) => {
    console.error('Manual Error:', error, errorInfo)
    
    // In a real application, you might want to:
    // 1. Log to an error reporting service
    // 2. Show a toast notification
    // 3. Track error metrics
    
    if (process.env.NODE_ENV === 'production') {
      // Log to error reporting service
      const errorData = {
        message: error.message,
        stack: error.stack,
        errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
      
      console.error('Error logged to service:', errorData)
    }
  }

  return { handleError }
}

// Error Recovery Component
interface ErrorRecoveryProps {
  error: Error
  onRetry: () => void
  onReset: () => void
}

export function ErrorRecovery({ error, onRetry, onReset }: ErrorRecoveryProps) {
  return (
    <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-1">
            Error: {error.message}
          </h3>
          <p className="text-sm text-red-700 mb-3">
            Something went wrong. You can try to recover or reset the component.
          </p>
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={onRetry}
              className="bg-red-600 hover:bg-red-700"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReset}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}