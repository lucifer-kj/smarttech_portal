'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'
// no direct Database type usage in this file

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Magic link removed; success state no longer used

  // Magic link handler removed

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const validatedData = loginSchema.parse({ email, password })

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      })

      if (signInError) {
        throw new Error(signInError.message || 'Failed to sign in')
      }

      if (!data.session) {
        throw new Error('Sign in did not return a session')
      }

      // Fetch fresh auth user (ensures latest app_metadata/user_metadata)
      const { data: { user: authUser } } = await supabase.auth.getUser()
      type RoleMeta = { role?: 'admin' | 'client' | string }
      const authRole = (authUser?.app_metadata as RoleMeta)?.role || (authUser?.user_metadata as RoleMeta)?.role

      // Fallback to server session API (service role) if auth metadata is missing
      let role = authRole as string | undefined
      if (!role) {
        // Try admin allowlist fallback first
        const allowlist = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
          .split(',')
          .map(e => e.trim().toLowerCase())
          .filter(Boolean)
        if (authUser?.email && allowlist.includes(authUser.email.toLowerCase())) {
          role = 'admin'
        } else {
          // Fallback to server session API (service role) if still missing
          const accessToken = data.session?.access_token
          if (!accessToken) throw new Error('Missing access token')

          const sessionResp = await fetch('/api/auth/session', {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          const sessionJson: { user?: { role?: string } } = await sessionResp.json()
          role = sessionJson.user?.role
        }
      }

      if (role === 'admin') {
        router.replace('/admin')
      } else {
        router.replace('/client')
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message)
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // No magic link success screen

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sign In to SmartTech Portal
          </h1>
          <p className="text-gray-600">Sign in with your email and password.</p>
        </div>

        <form className="space-y-4" onSubmit={handlePasswordSignIn}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <span className="text-xs text-gray-500">&nbsp;</span>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <Button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account? Contact your administrator to get access.
          </p>
        </div>
      </Card>
    </div>
  )
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
            Please wait while we load the login form.
          </p>
        </div>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  )
}
