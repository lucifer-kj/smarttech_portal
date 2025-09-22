import { supabase, createAdminClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type Document = Database['public']['Tables']['documents']['Row']
type DocumentInsert = Database['public']['Tables']['documents']['Insert']
type DocumentUpdate = Database['public']['Tables']['documents']['Update']

export interface DocumentUpload {
  file: File
  title: string
  description?: string
  category: Document['category']
  jobId?: string
  quoteId?: string
  requiresSignature?: boolean
  isPublic?: boolean
}

export interface DocumentWithUrl extends Document {
  downloadUrl?: string
  previewUrl?: string
}

export class DocumentService {
  private static readonly STORAGE_BUCKET = 'documents'
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]

  /**
   * Upload a document to Supabase Storage and create database record
   */
  static async uploadDocument(
    upload: DocumentUpload,
    userId: string
  ): Promise<DocumentWithUrl> {
    // Validate file
    this.validateFile(upload.file)

    // Generate unique file path
    const fileExtension = upload.file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`
    const filePath = `users/${userId}/${upload.category}/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(this.STORAGE_BUCKET)
      .upload(filePath, upload.file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Create database record
    const documentData: DocumentInsert = {
      job_id: upload.jobId || null,
      quote_id: upload.quoteId || null,
      user_id: userId,
      title: upload.title,
      description: upload.description || null,
      file_path: uploadData.path,
      file_name: upload.file.name,
      file_size: upload.file.size,
      mime_type: upload.file.type,
      category: upload.category,
      is_public: upload.isPublic || false,
      requires_signature: upload.requiresSignature || false,
      metadata: {
        originalFileName: upload.file.name,
        uploadedAt: new Date().toISOString(),
        fileExtension
      }
    }

    const { data: document, error: dbError } = await (supabase as any)
      .from('documents')
      .insert(documentData)
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from(this.STORAGE_BUCKET).remove([filePath])
      throw new Error(`Database insert failed: ${dbError.message}`)
    }

    if (!document) {
      throw new Error('Failed to create document record')
    }

    // Get download URL
    const downloadUrl = await this.getDownloadUrl(document.id)

    return {
      ...document,
      downloadUrl
    }
  }

  /**
   * Get documents for a user with optional filtering
   */
  static async getUserDocuments(
    userId: string,
    options: {
      jobId?: string
      category?: Document['category']
      limit?: number
      offset?: number
    } = {}
  ): Promise<DocumentWithUrl[]> {
    const { data, error } = await (supabase as any).rpc('get_user_documents', {
      p_user_id: userId,
      p_job_id: options.jobId || null,
      p_category: options.category || null,
      p_limit: options.limit || 50,
      p_offset: options.offset || 0
    })

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`)
    }

    // Get download URLs for each document
    const documentsWithUrls = await Promise.all(
      (data || []).map(async (doc: any) => ({
        ...doc,
        downloadUrl: await this.getDownloadUrl(doc.id)
      }))
    )

    return documentsWithUrls
  }

  /**
   * Get a single document by ID
   */
  static async getDocument(documentId: string): Promise<DocumentWithUrl | null> {
    const { data, error } = await (supabase as any)
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Document not found
      }
      throw new Error(`Failed to fetch document: ${error.message}`)
    }

    const downloadUrl = await this.getDownloadUrl(documentId)

    return {
      ...(data as Document),
      downloadUrl
    }
  }

  /**
   * Get download URL for a document
   */
  static async getDownloadUrl(documentId: string): Promise<string> {
    const { data: document } = await (supabase as any)
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .single()

    if (!document) {
      throw new Error('Document not found')
    }

    const { data } = await supabase.storage
      .from(this.STORAGE_BUCKET)
      .createSignedUrl(document.file_path, 3600) // 1 hour expiry

    return data?.signedUrl || ''
  }

  /**
   * Download a document and log access
   */
  static async downloadDocument(
    documentId: string,
    userId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<Blob> {
    const document = await this.getDocument(documentId)
    if (!document) {
      throw new Error('Document not found')
    }

    // Log access
    await (supabase as any).rpc('log_document_access', {
      p_document_id: documentId,
      p_user_id: userId,
      p_action: 'download',
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent || null
    })

    // Download file
    const { data, error } = await supabase.storage
      .from(this.STORAGE_BUCKET)
      .download(document.file_path)

    if (error) {
      throw new Error(`Download failed: ${error.message}`)
    }

    return data
  }

  /**
   * Create a new version of an existing document
   */
  static async createDocumentVersion(
    parentDocumentId: string,
    newFile: File,
    userId: string
  ): Promise<DocumentWithUrl> {
    // Validate file
    this.validateFile(newFile)

    // Get parent document
    const parentDocument = await this.getDocument(parentDocumentId)
    if (!parentDocument) {
      throw new Error('Parent document not found')
    }

    // Generate new file path
    const fileExtension = newFile.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`
    const filePath = `users/${userId}/${parentDocument.category}/${fileName}`

    // Upload new file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(this.STORAGE_BUCKET)
      .upload(filePath, newFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Create new version using database function
    const { data: newDocumentId, error: dbError } = await (supabase as any).rpc(
      'create_document_version',
      {
        p_parent_document_id: parentDocumentId,
        p_file_path: uploadData.path,
        p_file_name: newFile.name,
        p_file_size: newFile.size,
        p_mime_type: newFile.type,
        p_user_id: userId
      }
    )

    if (dbError) {
      // Clean up uploaded file
      await supabase.storage.from(this.STORAGE_BUCKET).remove([filePath])
      throw new Error(`Database insert failed: ${dbError.message}`)
    }

    // Get the new document
    const newDocument = await this.getDocument(newDocumentId)
    if (!newDocument) {
      throw new Error('Failed to retrieve new document version')
    }

    return newDocument
  }

  /**
   * Delete a document and its file
   */
  static async deleteDocument(documentId: string, userId: string): Promise<void> {
    // Get document info
    const document = await this.getDocument(documentId)
    if (!document) {
      throw new Error('Document not found')
    }

    // Check if user owns the document
    if (document.user_id !== userId) {
      throw new Error('Unauthorized to delete this document')
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(this.STORAGE_BUCKET)
      .remove([document.file_path])

    if (storageError) {
      console.warn(`Failed to delete file from storage: ${storageError.message}`)
    }

    // Delete from database
    const { error: dbError } = await (supabase as any)
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (dbError) {
      throw new Error(`Database delete failed: ${dbError.message}`)
    }

    // Log deletion
    await (supabase as any).rpc('log_document_access', {
      p_document_id: documentId,
      p_user_id: userId,
      p_action: 'delete'
    })
  }

  /**
   * Sign a document (electronic signature)
   */
  static async signDocument(
    documentId: string,
    userId: string,
    signatureData: string,
    signatureType: 'electronic' | 'digital' = 'electronic'
  ): Promise<void> {
    const { error } = await (supabase as any)
      .from('document_signatures')
      .insert({
        document_id: documentId,
        user_id: userId,
        signature_data: signatureData,
        signature_type: signatureType,
        ip_address: null, // Will be set by the client
        metadata: {
          signedAt: new Date().toISOString(),
          signatureMethod: 'web_portal'
        }
      })

    if (error) {
      throw new Error(`Signature failed: ${error.message}`)
    }

    // Update document signed status
    const { error: updateError } = await (supabase as any)
      .from('documents')
      .update({
        signed_at: new Date().toISOString(),
        signed_by: userId
      })
      .eq('id', documentId)

    if (updateError) {
      throw new Error(`Failed to update document signature status: ${updateError.message}`)
    }

    // Log signature action
    await (supabase as any).rpc('log_document_access', {
      p_document_id: documentId,
      p_user_id: userId,
      p_action: 'sign'
    })
  }

  /**
   * Get document access logs
   */
  static async getDocumentAccessLogs(
    documentId: string,
    userId: string
  ): Promise<Database['public']['Tables']['document_access_logs']['Row'][]> {
    const { data, error } = await supabase
      .from('document_access_logs')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch access logs: ${error.message}`)
    }

    return data || []
  }

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): void {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`)
    }

    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`)
    }
  }

  /**
   * Get file preview URL for images
   */
  static async getPreviewUrl(documentId: string): Promise<string | null> {
    const document = await this.getDocument(documentId)
    if (!document) {
      return null
    }

    // Only provide preview for images
    if (!document.mime_type.startsWith('image/')) {
      return null
    }

    return await this.getDownloadUrl(documentId)
  }

  /**
   * Bulk download multiple documents as a ZIP
   */
  static async bulkDownload(
    documentIds: string[],
    userId: string
  ): Promise<Blob> {
    // This would require a server-side implementation to create ZIP files
    // For now, we'll return the first document
    if (documentIds.length === 0) {
      throw new Error('No documents selected')
    }

    return await this.downloadDocument(documentIds[0], userId)
  }

  /**
   * Get storage usage for a user
   */
  static async getUserStorageUsage(userId: string): Promise<{
    totalSize: number
    documentCount: number
    categoryBreakdown: Record<string, { count: number; size: number }>
  }> {
    const { data, error } = await (supabase as any)
      .from('documents')
      .select('file_size, category')
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to fetch storage usage: ${error.message}`)
    }

    const totalSize = (data || []).reduce((sum: number, doc: any) => sum + doc.file_size, 0)
    const documentCount = (data || []).length

    const categoryBreakdown = (data || []).reduce((acc: Record<string, { count: number; size: number }>, doc: any) => {
      if (!acc[doc.category]) {
        acc[doc.category] = { count: 0, size: 0 }
      }
      acc[doc.category].count++
      acc[doc.category].size += doc.file_size
      return acc
    }, {} as Record<string, { count: number; size: number }>)

    return {
      totalSize,
      documentCount,
      categoryBreakdown
    }
  }
}
