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

  // If accessing protected route without session, redirect to login
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If accessing admin route, check if user is admin
  if (isAdminRoute && session) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('role, is_banned')
        .eq('id', session.user.id)
        .single()

      if (!user || user.is_banned || user.role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  // If accessing client route, check if user is not banned
  if (req.nextUrl.pathname.startsWith('/client') && session) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('is_banned')
        .eq('id', session.user.id)
        .single()

      if (user?.is_banned) {
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
