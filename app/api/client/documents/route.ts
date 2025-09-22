import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'
import { DocumentService } from '@/services/document-service'

// GET /api/client/documents - Get user documents
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    
    // Get user from auth header or session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = searchParams.get('userId')
    const jobId = searchParams.get('jobId')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const documents = await DocumentService.getUserDocuments(userId, {
      jobId: jobId || undefined,
      category: category as 'quote' | 'invoice' | 'warranty' | 'certificate' | 'photo' | 'other' || undefined,
      limit,
      offset
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

// POST /api/client/documents - Upload document
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get user from auth header or session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const jobId = formData.get('jobId') as string
    const quoteId = formData.get('quoteId') as string
    const requiresSignature = formData.get('requiresSignature') === 'true'
    const isPublic = formData.get('isPublic') === 'true'
    const userId = formData.get('userId') as string

    if (!file || !title || !category || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const document = await DocumentService.uploadDocument({
      file,
      title,
      description: description || undefined,
      category: category as 'quote' | 'invoice' | 'warranty' | 'certificate' | 'photo' | 'other',
      jobId: jobId || undefined,
      quoteId: quoteId || undefined,
      requiresSignature,
      isPublic
    }, userId)

    return NextResponse.json({ document })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}
