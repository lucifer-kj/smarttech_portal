import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'

interface UserData {
  id: string
  email: string
  sm8_uuid: string | null
  role: string
  is_banned: boolean
  first_login_complete: boolean
  created_at: string
  updated_at: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Get session from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    // Get user data from our users table
    const { data: userData, error: dataError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (dataError || !userData) {
      return NextResponse.json(
        { error: 'User data not found' },
        { status: 404 }
      )
    }

    const userInfo = userData as UserData

    // Check if user is banned
    if (userInfo.is_banned) {
      return NextResponse.json(
        { error: 'Account is banned' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      user: {
        id: userInfo.id,
        email: userInfo.email,
        sm8_uuid: userInfo.sm8_uuid,
        role: userInfo.role,
        is_banned: userInfo.is_banned,
        first_login_complete: userInfo.first_login_complete,
        created_at: userInfo.created_at,
        updated_at: userInfo.updated_at,
      },
      session: {
        access_token: token,
      },
    })

  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
