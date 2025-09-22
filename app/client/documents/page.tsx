'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ClientLayout from '@/components/client/ClientLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { type DocumentWithUrl } from '@/services/document-service'
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Folder,
  Shield,
  CheckCircle,
  Plus,
  Image,
  File,
  Trash2,
  Clock
} from 'lucide-react'

interface DocumentCategory {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  count: number
}

const documentCategories: DocumentCategory[] = [
  { id: 'quote', label: 'Quotes', icon: FileText, color: 'bg-blue-100 text-blue-800', count: 0 },
  { id: 'invoice', label: 'Invoices', icon: FileText, color: 'bg-green-100 text-green-800', count: 0 },
  { id: 'warranty', label: 'Warranties', icon: Shield, color: 'bg-purple-100 text-purple-800', count: 0 },
  { id: 'certificate', label: 'Certificates', icon: CheckCircle, color: 'bg-yellow-100 text-yellow-800', count: 0 },
  { id: 'photo', label: 'Photos', icon: Image, color: 'bg-pink-100 text-pink-800', count: 0 },
  { id: 'other', label: 'Other', icon: File, color: 'bg-gray-100 text-gray-800', count: 0 }
]

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<DocumentWithUrl[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentWithUrl[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'category'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  // const [uploading, setUploading] = useState(false) // TODO: Implement file upload
  const [categories, setCategories] = useState(documentCategories)

  // Mock data - will be replaced with real API call
  useEffect(() => {
    const mockDocuments: DocumentWithUrl[] = [
      {
        id: '1',
        job_id: '1',
        quote_id: null,
        user_id: user?.id || '',
        title: 'HVAC Maintenance Quote',
        description: 'Detailed quote for HVAC system maintenance',
        file_path: 'users/123/quotes/quote-1.pdf',
        file_name: 'hvac-maintenance-quote.pdf',
        file_size: 245760,
        mime_type: 'application/pdf',
        category: 'quote',
        is_public: false,
        requires_signature: true,
        signed_at: null,
        signed_by: null,
        version: 1,
        parent_document_id: null,
        metadata: {},
        created_at: '2024-01-10T10:00:00Z',
        updated_at: '2024-01-10T10:00:00Z',
        downloadUrl: '/api/placeholder/document.pdf'
      },
      {
        id: '2',
        job_id: '1',
        quote_id: null,
        user_id: user?.id || '',
        title: 'Work Completion Certificate',
        description: 'Certificate of completed HVAC maintenance work',
        file_path: 'users/123/certificates/cert-1.pdf',
        file_name: 'work-completion-certificate.pdf',
        file_size: 189440,
        mime_type: 'application/pdf',
        category: 'certificate',
        is_public: false,
        requires_signature: false,
        signed_at: '2024-01-12T14:30:00Z',
        signed_by: user?.id || '',
        version: 1,
        parent_document_id: null,
        metadata: {},
        created_at: '2024-01-12T14:30:00Z',
        updated_at: '2024-01-12T14:30:00Z',
        downloadUrl: '/api/placeholder/certificate.pdf'
      },
      {
        id: '3',
        job_id: '2',
        quote_id: null,
        user_id: user?.id || '',
        title: 'Before and After Photos',
        description: 'Photos showing the work completed',
        file_path: 'users/123/photos/photos-1.jpg',
        file_name: 'before-after-photos.jpg',
        file_size: 1024000,
        mime_type: 'image/jpeg',
        category: 'photo',
        is_public: false,
        requires_signature: false,
        signed_at: null,
        signed_by: null,
        version: 1,
        parent_document_id: null,
        metadata: {},
        created_at: '2024-01-08T16:45:00Z',
        updated_at: '2024-01-08T16:45:00Z',
        downloadUrl: '/api/placeholder/photos.jpg'
      },
      {
        id: '4',
        job_id: '3',
        quote_id: null,
        user_id: user?.id || '',
        title: 'Equipment Warranty',
        description: 'Warranty information for installed equipment',
        file_path: 'users/123/warranties/warranty-1.pdf',
        file_name: 'equipment-warranty.pdf',
        file_size: 156720,
        mime_type: 'application/pdf',
        category: 'warranty',
        is_public: false,
        requires_signature: false,
        signed_at: null,
        signed_by: null,
        version: 1,
        parent_document_id: null,
        metadata: {},
        created_at: '2024-01-05T09:15:00Z',
        updated_at: '2024-01-05T09:15:00Z',
        downloadUrl: '/api/placeholder/warranty.pdf'
      }
    ]

    setTimeout(() => {
      setDocuments(mockDocuments)
      setFilteredDocuments(mockDocuments)
      
      // Update category counts
      const categoryCounts = mockDocuments.reduce((acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      setCategories(prev => prev.map(cat => ({
        ...cat,
        count: categoryCounts[cat.id] || 0
      })))

      setIsLoading(false)
    }, 1000)
  }, [user])

  // Filter and sort documents
  useEffect(() => {
    let filtered = documents

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.file_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(doc => doc.category === categoryFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'name':
          comparison = a.title.localeCompare(b.title)
          break
        case 'size':
          comparison = a.file_size - b.file_size
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredDocuments(filtered)
  }, [documents, searchQuery, categoryFilter, sortBy, sortOrder])

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev =>
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    )
  }

  const selectAllDocuments = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([])
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id))
    }
  }

  const handleDownload = async (document: DocumentWithUrl) => {
    try {
      // In a real implementation, this would call DocumentService.downloadDocument
      console.log('Downloading document:', document.title)
      // For now, just simulate download
      const link = window.document.createElement('a')
      link.href = document.downloadUrl || '#'
      link.download = document.file_name
      link.click()
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleBulkDownload = async () => {
    if (selectedDocuments.length === 0) return
    
    try {
      // In a real implementation, this would call DocumentService.bulkDownload
      console.log('Bulk downloading documents:', selectedDocuments)
      // For now, just download the first selected document
      const firstDoc = documents.find(doc => doc.id === selectedDocuments[0])
      if (firstDoc) {
        await handleDownload(firstDoc)
      }
    } catch (error) {
      console.error('Bulk download failed:', error)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    
    try {
      // In a real implementation, this would call DocumentService.deleteDocument
      console.log('Deleting document:', documentId)
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      setSelectedDocuments(prev => prev.filter(id => id !== documentId))
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category)
    return cat ? cat.icon : File
  }

  const getCategoryColor = (category: string) => {
    const cat = categories.find(c => c.id === category)
    return cat ? cat.color : 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
            <p className="text-gray-600 mt-1">Access and manage your service documents</p>
          </div>
          <div className="mt-4 sm:mt-0 flex space-x-2">
            <Button 
              variant="outline"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Request Document
            </Button>
          </div>
        </div>

        {/* Category Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Card
                key={category.id}
                className={`p-4 cursor-pointer transition-colors ${
                  categoryFilter === category.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'
                }`}
                onClick={() => setCategoryFilter(categoryFilter === category.id ? 'all' : category.id)}
              >
                <div className="text-center">
                  <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center mx-auto mb-2`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">{category.label}</h3>
                  <p className="text-xs text-gray-600">{category.count} files</p>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Filters and Search */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center space-x-4">
              {/* Sort */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-')
                    setSortBy(field as 'date' | 'name' | 'size' | 'category')
                    setSortOrder(order as 'asc' | 'desc')
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="date-desc">Date (Newest)</option>
                  <option value="date-asc">Date (Oldest)</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="size-desc">Size (Largest)</option>
                  <option value="size-asc">Size (Smallest)</option>
                  <option value="category-asc">Category (A-Z)</option>
                  <option value="category-desc">Category (Z-A)</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Bulk Actions */}
        {selectedDocuments.length > 0 && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleBulkDownload}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download Selected
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-red-700 border-red-300 hover:bg-red-50"
                  onClick={() => {
                    if (confirm(`Delete ${selectedDocuments.length} selected documents?`)) {
                      selectedDocuments.forEach(handleDelete)
                      setSelectedDocuments([])
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setSelectedDocuments([])}
              >
                Clear Selection
              </Button>
            </div>
          </Card>
        )}

        {/* Documents List */}
        <div className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <Card className="p-8 text-center">
              <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || categoryFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'You don\'t have any documents yet.'}
              </p>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowUploadModal(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Document
              </Button>
            </Card>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0}
                    onChange={selectAllDocuments}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Select all documents
                  </span>
                </label>
                <span className="text-sm text-gray-600">
                  {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Documents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((document) => {
                  const CategoryIcon = getCategoryIcon(document.category)
                  const categoryColor = getCategoryColor(document.category)
                  
                  return (
                    <Card key={document.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-4">
                        {/* Document Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(document.id)}
                              onChange={() => toggleDocumentSelection(document.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className={`p-2 rounded-lg ${categoryColor}`}>
                              <CategoryIcon className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(document)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(document.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Document Info */}
                        <div className="space-y-2">
                          <h3 className="font-medium text-gray-900 truncate" title={document.title}>
                            {document.title}
                          </h3>
                          {document.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {document.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{formatFileSize(document.file_size)}</span>
                            <span>{formatDate(document.created_at)}</span>
                          </div>

                          {/* Status Indicators */}
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor}`}>
                              {document.category}
                            </span>
                            {document.requires_signature && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                document.signed_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {document.signed_at ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Signed
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending Signature
                                  </>
                                )}
                              </span>
                            )}
                            {document.version > 1 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                v{document.version}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Upload Modal Placeholder */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Document</h3>
              <p className="text-gray-600 mb-4">Document upload functionality will be implemented here.</p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Upload
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </ClientLayout>
  )
}
