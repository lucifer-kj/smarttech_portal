import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'
import { z } from 'zod'

const magicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
  redirectTo: z.string().url().optional(),
})

interface UserData {
  id: string
  email: string
  is_banned: boolean
  role: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, redirectTo } = magicLinkSchema.parse(body)

    const supabase = createAdminClient()

    // Check if user exists in our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, is_banned, role')
      .eq('email', email)
      .single()

    if (userError) {
      return NextResponse.json(
        { error: 'User not found. Please contact your administrator.' },
        { status: 404 }
      )
    }

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found. Please contact your administrator.' },
        { status: 404 }
      )
    }

    const user = userData as UserData

    if (user.is_banned) {
      return NextResponse.json(
        { error: 'Account is banned. Please contact support.' },
        { status: 403 }
      )
    }

    // Generate magic link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    })

    if (error) {
      console.error('Magic link generation error:', error)
      return NextResponse.json(
        { error: 'Failed to generate magic link' },
        { status: 500 }
      )
    }

    // Log the magic link request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc('log_audit_event', {
      p_action: 'magic_link_requested',
      p_target_type: 'user',
      p_target_id: user.id,
      p_metadata: {
        email: email,
        redirectTo: redirectTo,
        timestamp: new Date().toISOString(),
      },
    })

    // In production, you would send the email here
    // For development, we'll return the link
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        message: 'Magic link generated successfully',
        link: data.properties?.action_link, // Only in development
      })
    }

    return NextResponse.json({
      message: 'Magic link sent to your email',
    })

  } catch (error) {
    console.error('Magic link API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
