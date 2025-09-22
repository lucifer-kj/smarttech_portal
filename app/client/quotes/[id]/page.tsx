'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ClientLayout from '@/components/client/ClientLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  Download,
  Calculator,
  Share,
  User,
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Award,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface QuoteDetail {
  id: string
  job_id: string
  job_title: string
  job_description: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  total_amount: number
  currency: string
  valid_until: string
  created_at: string
  updated_at: string
  line_items: LineItem[]
  notes?: string
  documents_count: number
  can_partial_approve: boolean
  approved_items?: string[]
  rejection_reason?: string
  technician?: {
    name: string
    phone: string
    email: string
  }
  client_notes?: string
  terms_and_conditions?: string
  payment_terms?: string
  warranty_info?: string
}

interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
  category: 'labor' | 'materials' | 'equipment' | 'other'
  is_optional: boolean
  notes?: string
  warranty_period?: string
}

const statusConfig = {
  pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
}

const categoryConfig = {
  labor: { label: 'Labor', color: 'bg-blue-100 text-blue-800', icon: User },
  materials: { label: 'Materials', color: 'bg-green-100 text-green-800', icon: Package },
  equipment: { label: 'Equipment', color: 'bg-purple-100 text-purple-800', icon: Award },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-800', icon: FileText }
}

export default function QuoteDetailPage() {
  const { user: _user } = useAuth() // TODO: Use user data for quote approval
  const params = useParams()
  const quoteId = params.id as string
  
  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['line-items']))
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')

  // Mock data - will be replaced with real API call
  useEffect(() => {
    const mockQuote: QuoteDetail = {
      id: quoteId,
      job_id: '5',
      job_title: 'Bathroom Renovation',
      job_description: 'Complete bathroom renovation including plumbing, electrical, and fixtures',
      status: 'pending',
      total_amount: 15750,
      currency: 'USD',
      valid_until: '2024-02-15T23:59:59Z',
      created_at: '2024-01-12T13:00:00Z',
      updated_at: '2024-01-12T13:00:00Z',
      documents_count: 5,
      can_partial_approve: true,
      technician: {
        name: 'Sarah Johnson',
        phone: '+1 (555) 987-6543',
        email: 'sarah.johnson@smarttech.com'
      },
      client_notes: 'Please ensure all fixtures are energy efficient and include smart features where possible.',
      terms_and_conditions: 'Work will be completed within 2 weeks of approval. Payment due upon completion.',
      payment_terms: '50% deposit required, remaining balance due upon completion',
      warranty_info: 'All work guaranteed for 2 years, fixtures carry manufacturer warranty',
      line_items: [
        {
          id: '1-1',
          description: 'Demolition and removal of existing fixtures',
          quantity: 1,
          unit_price: 800,
          total_price: 800,
          category: 'labor',
          is_optional: false,
          notes: 'Includes disposal fees'
        },
        {
          id: '1-2',
          description: 'New vanity with marble countertop',
          quantity: 1,
          unit_price: 2500,
          total_price: 2500,
          category: 'materials',
          is_optional: false,
          warranty_period: '5 years'
        },
        {
          id: '1-3',
          description: 'Plumbing installation and connections',
          quantity: 1,
          unit_price: 1200,
          total_price: 1200,
          category: 'labor',
          is_optional: false,
          notes: 'Includes shut-off valves and pressure regulator'
        },
        {
          id: '1-4',
          description: 'Electrical work for new lighting',
          quantity: 1,
          unit_price: 900,
          total_price: 900,
          category: 'labor',
          is_optional: false,
          notes: 'Includes GFCI outlets and smart switch installation'
        },
        {
          id: '1-5',
          description: 'Premium heated towel rack',
          quantity: 1,
          unit_price: 450,
          total_price: 450,
          category: 'equipment',
          is_optional: true,
          warranty_period: '3 years'
        },
        {
          id: '1-6',
          description: 'Tile work and grouting',
          quantity: 1,
          unit_price: 1800,
          total_price: 1800,
          category: 'labor',
          is_optional: false,
          notes: 'Includes waterproofing membrane'
        },
        {
          id: '1-7',
          description: 'Paint and finishing',
          quantity: 1,
          unit_price: 400,
          total_price: 400,
          category: 'materials',
          is_optional: false,
          notes: 'Mold-resistant paint'
        }
      ],
      notes: 'This quote includes all necessary permits and inspections. Work will be completed within 2 weeks of approval. All materials are high-quality and energy-efficient.'
    }

    setTimeout(() => {
      setQuote(mockQuote)
      setIsLoading(false)
    }, 1000)
  }, [quoteId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const calculateSelectedTotal = () => {
    if (!quote) return 0
    return quote.line_items
      .filter(item => selectedItems.includes(item.id))
      .reduce((sum, item) => sum + item.total_price, 0)
  }

  const handleApproveQuote = async (partial = false) => {
    try {
      // In a real implementation, this would call the API
      console.log('Approving quote:', quote?.id, partial ? 'partial' : 'full')
      setShowApprovalModal(false)
      // Update quote status
      if (quote) {
        setQuote({ ...quote, status: 'approved' })
      }
    } catch (error) {
      console.error('Approval failed:', error)
    }
  }

  const handleRejectQuote = async () => {
    try {
      // In a real implementation, this would call the API
      console.log('Rejecting quote:', quote?.id, rejectionReason)
      setShowRejectionModal(false)
      setRejectionReason('')
      // Update quote status
      if (quote) {
        setQuote({ ...quote, status: 'rejected', rejection_reason: rejectionReason })
      }
    } catch (error) {
      console.error('Rejection failed:', error)
    }
  }

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </ClientLayout>
    )
  }

  if (!quote) {
    return (
      <ClientLayout>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Quote not found</h3>
          <p className="text-gray-600 mb-4">The requested quote could not be found.</p>
          <Link href="/client/quotes">
            <Button>Back to Quotes</Button>
          </Link>
        </div>
      </ClientLayout>
    )
  }

  const StatusIcon = statusConfig[quote.status].icon
  const expired = isExpired(quote.valid_until)
  const selectedTotal = calculateSelectedTotal()

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/client/quotes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quotes
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quote.job_title}</h1>
              <p className="text-gray-600">Quote ID: {quote.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[quote.status].color}`}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {statusConfig[quote.status].label}
            </span>
            {expired && quote.status === 'pending' && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                <AlertCircle className="h-4 w-4 mr-1" />
                Expired
              </span>
            )}
          </div>
        </div>

        {/* Quote Summary */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Total Amount</h3>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(quote.total_amount)}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Valid Until</h3>
              <p className="text-lg text-gray-900">{formatDate(quote.valid_until)}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Created</h3>
              <p className="text-lg text-gray-900">{formatDate(quote.created_at)}</p>
            </div>
          </div>
        </Card>

        {/* Job Description */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
          <p className="text-gray-600">{quote.job_description}</p>
          {quote.client_notes && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Your Notes</h3>
              <p className="text-blue-800">{quote.client_notes}</p>
            </div>
          )}
        </Card>

        {/* Technician Information */}
        {quote.technician && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Prepared By</h2>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{quote.technician.name}</h3>
                <p className="text-sm text-gray-600">{quote.technician.email}</p>
                <p className="text-sm text-gray-600">{quote.technician.phone}</p>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4 mr-1" />
                  Call
                </Button>
                <Button size="sm" variant="outline">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Message
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Line Items */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quote Breakdown</h2>
            <button
              onClick={() => toggleSection('line-items')}
              className="text-gray-500 hover:text-gray-700"
            >
              {expandedSections.has('line-items') ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>
          
          {expandedSections.has('line-items') && (
            <div className="space-y-4">
              {quote.line_items.map((item) => {
                const CategoryIcon = categoryConfig[item.category].icon
                const isSelected = selectedItems.includes(item.id)
                const canSelect = quote.can_partial_approve && quote.status === 'pending'
                
                return (
                  <div 
                    key={item.id} 
                    className={`p-4 border rounded-lg ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {canSelect && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleItemSelection(item.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          )}
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryConfig[item.category].color}`}>
                            <CategoryIcon className="h-3 w-3 mr-1" />
                            {categoryConfig[item.category].label}
                          </div>
                          {item.is_optional && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Optional
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{item.description}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {item.quantity} × {formatCurrency(item.unit_price)} = {formatCurrency(item.total_price)}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-gray-500 italic">{item.notes}</p>
                        )}
                        {item.warranty_period && (
                          <p className="text-sm text-green-600">
                            <Shield className="h-3 w-3 inline mr-1" />
                            {item.warranty_period} warranty
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-gray-900">{formatCurrency(item.total_price)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {/* Total */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(quote.total_amount)}</span>
                </div>
                {quote.can_partial_approve && selectedItems.length > 0 && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">Selected Items</span>
                    <span className="text-sm font-semibold text-blue-600">{formatCurrency(selectedTotal)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Terms and Conditions */}
          {quote.terms_and_conditions && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
              <p className="text-gray-600">{quote.terms_and_conditions}</p>
            </Card>
          )}

          {/* Payment Terms */}
          {quote.payment_terms && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Terms</h2>
              <p className="text-gray-600">{quote.payment_terms}</p>
            </Card>
          )}

          {/* Warranty Information */}
          {quote.warranty_info && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Warranty Information</h2>
              <p className="text-gray-600">{quote.warranty_info}</p>
            </Card>
          )}

          {/* Notes */}
          {quote.notes && (
            <Card className="p-6 md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
              <p className="text-gray-600">{quote.notes}</p>
            </Card>
          )}
        </div>

        {/* Rejection Reason */}
        {quote.rejection_reason && (
          <Card className="p-6 border-red-200 bg-red-50">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Rejection Reason</h2>
            <p className="text-red-700">{quote.rejection_reason}</p>
          </Card>
        )}

        {/* Actions */}
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-wrap items-center space-x-4">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline">
                <Share className="h-4 w-4 mr-2" />
                Share Quote
              </Button>
              <Button variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                Ask Questions
              </Button>
            </div>
            
            {quote.status === 'pending' && !expired && (
              <div className="flex space-x-3">
                {quote.can_partial_approve && selectedItems.length > 0 && (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setShowApprovalModal(true)}
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Approve Selected ({formatCurrency(selectedTotal)})
                  </Button>
                )}
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setShowApprovalModal(true)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Full Quote
                </Button>
                <Button 
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => setShowRejectionModal(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Quote
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Approval Modal */}
        {showApprovalModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Approve Quote</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to approve this quote? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowApprovalModal(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApproveQuote(selectedItems.length > 0)}
                >
                  Approve Quote
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectionModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Quote</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for rejection (optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this quote..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowRejectionModal(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleRejectQuote}
                >
                  Reject Quote
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </ClientLayout>
  )
}
