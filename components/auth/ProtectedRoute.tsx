'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (user?.is_banned) {
      router.push('/banned')
      return
    }

    if (requireAdmin && user?.role !== 'admin') {
      router.push('/unauthorized')
      return
    }
  }, [user, isLoading, isAuthenticated, requireAdmin, router])

  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading...
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your access.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || null
  }

  if (user?.is_banned) {
    return fallback || null
  }

  if (requireAdmin && user?.role !== 'admin') {
    return fallback || null
  }

  return <>{children}</>
}

export function AdminRoute({ children, fallback }: Omit<ProtectedRouteProps, 'requireAdmin'>) {
  return (
    <ProtectedRoute requireAdmin={true} fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}

export function ClientRoute({ children, fallback }: Omit<ProtectedRouteProps, 'requireAdmin'>) {
  return (
    <ProtectedRoute fallback={fallback}>
      {children}
    </ProtectedRoute>
  )
}
