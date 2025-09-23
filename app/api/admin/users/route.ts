import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

/**
 * Admin User Management API
 * Handles user listing, filtering, and management operations
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || 'all';
  const status = searchParams.get('status') || 'all';

  const supabase = createAdminClient();
  const offset = (page - 1) * limit;

  try {
    // Build query
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    if (role !== 'all') {
      query = query.eq('role', role);
    }

    if (status === 'active') {
      query = query.eq('is_banned', false);
    } else if (status === 'banned') {
      query = query.eq('is_banned', true);
    }

    const { data: users, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: {
        users: users || [],
        totalUsers: count || 0,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      message: `Retrieved ${users?.length || 0} users`
    });

  } catch (error) {
    console.error('User management API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Create new user
 */
export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    const { email, role, sm8_uuid } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { success: false, error: 'Email and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists (by email)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingUser } = await (supabase as any)
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // If sm8_uuid provided, ensure not already linked to another user
    if (sm8_uuid) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: linkedUser } = await (supabase as any)
        .from('users')
        .select('id, email')
        .eq('sm8_uuid', sm8_uuid)
        .single();

      if (linkedUser) {
        return NextResponse.json(
          { success: false, error: 'This ServiceM8 client is already linked to another user' },
          { status: 409 }
        );
      }
    }

    // Create user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newUser, error } = await (supabase as any)
      .from('users')
      .insert({
        email,
        role,
        sm8_uuid: sm8_uuid || null,
        is_banned: false,
        first_login_complete: false,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    // Log the action
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('audit_logs')
      .insert({
        actor_user_id: 'system', // TODO: Get from auth context
        action: 'user_created',
        target_type: 'user',
        target_id: newUser.id,
        metadata: {
          email: newUser.email,
          role: newUser.role,
          sm8_uuid: newUser.sm8_uuid,
        },
        timestamp: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      data: newUser,
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('User creation failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
