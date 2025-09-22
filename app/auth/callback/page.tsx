'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { User } from '@/types'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser, setSession } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setError(error.message)
          setStatus('error')
          return
        }

        if (data.session?.user) {
          const authUser = data.session.user
          const appMeta = (authUser.app_metadata || {}) as Record<string, unknown>
          const userMeta = (authUser.user_metadata || {}) as Record<string, unknown>

          let role = (appMeta.role as string) || (userMeta.role as string) || ''
          const sm8_uuid = (appMeta.sm8_uuid as string) || (userMeta.sm8_uuid as string) || null
          const is_banned = Boolean((appMeta.is_banned as boolean) ?? (userMeta.is_banned as boolean) ?? false)
          const first_login_complete = Boolean(
            (appMeta.first_login_complete as boolean) ?? (userMeta.first_login_complete as boolean) ?? false
          )

          // Fallback: if role missing, check admin allowlist by email
          if (!role) {
            const allowlist = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
              .split(',')
              .map(e => e.trim().toLowerCase())
              .filter(Boolean)
            if (authUser.email && allowlist.includes(authUser.email.toLowerCase())) {
              role = 'admin'
            }
          }

          const user: User = {
            id: authUser.id,
            email: authUser.email || '',
            sm8_uuid,
            role: role === 'admin' ? 'admin' : 'client',
            is_banned,
            first_login_complete,
            created_at: authUser.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          // Check if user is banned
          if (user.is_banned) {
            setError('Your account has been suspended. Please contact support.')
            setStatus('error')
            return
          }

          // Update auth store
          setUser(user)
          setSession(data.session)

          // Check if this is first login
          if (!user.first_login_complete) {
            // Redirect to walkthrough
            router.push('/auth/walkthrough')
            return
          }

          // Redirect based on role
          const redirectTo = searchParams.get('redirectTo')
          if (redirectTo) {
            router.push(redirectTo)
          } else if (user.role === 'admin') {
            router.push('/admin')
          } else {
            router.push('/client')
          }

          setStatus('success')
        } else {
          setError('No session found')
          setStatus('error')
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err)
        setError('An unexpected error occurred')
        setStatus('error')
      }
    }

    handleAuthCallback()
  }, [router, searchParams, setUser, setSession])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Signing you in...
            </h2>
            <p className="text-gray-600">
              Please wait while we complete your authentication.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="rounded-full h-12 w-12 bg-red-100 mx-auto mb-4 flex items-center justify-center">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'There was a problem signing you in.'}
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/auth/login')}
                className="w-full"
              >
                Try Again
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return null
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading...
          </h2>
          <p className="text-gray-600">
            Please wait while we process your request.
          </p>
        </div>
      </Card>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  )
}
