import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: Record<string, unknown>) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedRoutes = ['/admin', '/client', '/dashboard']
  const adminRoutes = ['/admin']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )
  const isAdminRoute = adminRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // If accessing protected route without server session, allow through and let client-side guards handle redirects
  // This avoids issues where client sign-in hasn't synced cookies for middleware yet
  if (isProtectedRoute && !session) {
    return res
  }

  // If accessing admin route, check if user is admin via Auth metadata or email allowlist
  if (isAdminRoute && session) {
    try {
      const appMeta = (session.user.app_metadata || {}) as Record<string, unknown>
      const userMeta = (session.user.user_metadata || {}) as Record<string, unknown>
      let role = (appMeta.role as string) || (userMeta.role as string) || ''
      const is_banned = Boolean((appMeta.is_banned as boolean) ?? (userMeta.is_banned as boolean) ?? false)

      if (!role) {
        const allowlist = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
          .split(',')
          .map(e => e.trim().toLowerCase())
          .filter(Boolean)
        if (session.user.email && allowlist.includes(session.user.email.toLowerCase())) {
          role = 'admin'
        } else {
          role = 'client'
        }
      }

      if (is_banned || role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  // If accessing client route, check if user is not banned via Auth metadata
  if (req.nextUrl.pathname.startsWith('/client') && session) {
    try {
      const appMeta = (session.user.app_metadata || {}) as Record<string, unknown>
      const userMeta = (session.user.user_metadata || {}) as Record<string, unknown>
      const is_banned = Boolean((appMeta.is_banned as boolean) ?? (userMeta.is_banned as boolean) ?? false)

      if (is_banned) {
        return NextResponse.redirect(new URL('/banned', req.url))
      }
    } catch (error) {
      console.error('Error checking user status:', error)
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
