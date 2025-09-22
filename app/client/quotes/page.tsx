'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ClientLayout from '@/components/client/ClientLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Star,
  MessageCircle,
  Calculator
} from 'lucide-react'

interface Quote {
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
}

interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
  category: 'labor' | 'materials' | 'equipment' | 'other'
  is_optional: boolean
}

const statusConfig = {
  pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
}

const categoryConfig = {
  labor: { label: 'Labor', color: 'bg-blue-100 text-blue-800' },
  materials: { label: 'Materials', color: 'bg-green-100 text-green-800' },
  equipment: { label: 'Equipment', color: 'bg-purple-100 text-purple-800' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-800' }
}

export default function QuotesPage() {
  const { user } = useAuth()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<{ [quoteId: string]: string[] }>({})

  // Mock data - will be replaced with real API call
  useEffect(() => {
    const mockQuotes: Quote[] = [
      {
        id: '1',
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
        line_items: [
          {
            id: '1-1',
            description: 'Demolition and removal of existing fixtures',
            quantity: 1,
            unit_price: 800,
            total_price: 800,
            category: 'labor',
            is_optional: false
          },
          {
            id: '1-2',
            description: 'New vanity with marble countertop',
            quantity: 1,
            unit_price: 2500,
            total_price: 2500,
            category: 'materials',
            is_optional: false
          },
          {
            id: '1-3',
            description: 'Plumbing installation and connections',
            quantity: 1,
            unit_price: 1200,
            total_price: 1200,
            category: 'labor',
            is_optional: false
          },
          {
            id: '1-4',
            description: 'Electrical work for new lighting',
            quantity: 1,
            unit_price: 900,
            total_price: 900,
            category: 'labor',
            is_optional: false
          },
          {
            id: '1-5',
            description: 'Premium heated towel rack',
            quantity: 1,
            unit_price: 450,
            total_price: 450,
            category: 'equipment',
            is_optional: true
          },
          {
            id: '1-6',
            description: 'Tile work and grouting',
            quantity: 1,
            unit_price: 1800,
            total_price: 1800,
            category: 'labor',
            is_optional: false
          },
          {
            id: '1-7',
            description: 'Paint and finishing',
            quantity: 1,
            unit_price: 400,
            total_price: 400,
            category: 'materials',
            is_optional: false
          }
        ],
        notes: 'This quote includes all necessary permits and inspections. Work will be completed within 2 weeks of approval.'
      },
      {
        id: '2',
        job_id: '6',
        job_title: 'Kitchen Cabinet Installation',
        job_description: 'Install new custom kitchen cabinets and hardware',
        status: 'approved',
        total_amount: 8500,
        currency: 'USD',
        valid_until: '2024-02-10T23:59:59Z',
        created_at: '2024-01-08T10:30:00Z',
        updated_at: '2024-01-10T14:20:00Z',
        documents_count: 3,
        can_partial_approve: false,
        approved_items: ['2-1', '2-2', '2-3', '2-4'],
        line_items: [
          {
            id: '2-1',
            description: 'Custom cabinet construction',
            quantity: 1,
            unit_price: 4500,
            total_price: 4500,
            category: 'materials',
            is_optional: false
          },
          {
            id: '2-2',
            description: 'Cabinet installation and mounting',
            quantity: 1,
            unit_price: 2000,
            total_price: 2000,
            category: 'labor',
            is_optional: false
          },
          {
            id: '2-3',
            description: 'Hardware installation (handles, hinges)',
            quantity: 1,
            unit_price: 800,
            total_price: 800,
            category: 'labor',
            is_optional: false
          },
          {
            id: '2-4',
            description: 'Countertop installation',
            quantity: 1,
            unit_price: 1200,
            total_price: 1200,
            category: 'labor',
            is_optional: false
          }
        ]
      },
      {
        id: '3',
        job_id: '7',
        job_title: 'HVAC System Upgrade',
        job_description: 'Upgrade existing HVAC system with new high-efficiency unit',
        status: 'rejected',
        total_amount: 12500,
        currency: 'USD',
        valid_until: '2024-01-20T23:59:59Z',
        created_at: '2024-01-05T09:15:00Z',
        updated_at: '2024-01-18T16:45:00Z',
        documents_count: 4,
        can_partial_approve: true,
        rejection_reason: 'Budget constraints - will reconsider in Q2',
        line_items: [
          {
            id: '3-1',
            description: 'High-efficiency HVAC unit (3-ton)',
            quantity: 1,
            unit_price: 6500,
            total_price: 6500,
            category: 'equipment',
            is_optional: false
          },
          {
            id: '3-2',
            description: 'Installation and setup',
            quantity: 1,
            unit_price: 2500,
            total_price: 2500,
            category: 'labor',
            is_optional: false
          },
          {
            id: '3-3',
            description: 'Ductwork modifications',
            quantity: 1,
            unit_price: 1800,
            total_price: 1800,
            category: 'labor',
            is_optional: false
          },
          {
            id: '3-4',
            description: 'Smart thermostat installation',
            quantity: 1,
            unit_price: 700,
            total_price: 700,
            category: 'equipment',
            is_optional: true
          }
        ]
      }
    ]

    setTimeout(() => {
      setQuotes(mockQuotes)
      setFilteredQuotes(mockQuotes)
      setIsLoading(false)
    }, 1000)
  }, [])

  // Filter and sort quotes
  useEffect(() => {
    let filtered = quotes

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(quote =>
        quote.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quote.job_description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quote => quote.status === statusFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'amount':
          comparison = a.total_amount - b.total_amount
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredQuotes(filtered)
  }, [quotes, searchQuery, statusFilter, sortBy, sortOrder])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  const toggleQuoteExpansion = (quoteId: string) => {
    setExpandedQuote(expandedQuote === quoteId ? null : quoteId)
  }

  const toggleItemSelection = (quoteId: string, itemId: string) => {
    setSelectedItems(prev => ({
      ...prev,
      [quoteId]: prev[quoteId]?.includes(itemId)
        ? prev[quoteId].filter(id => id !== itemId)
        : [...(prev[quoteId] || []), itemId]
    }))
  }

  const calculateSelectedTotal = (quote: Quote) => {
    const selected = selectedItems[quote.id] || []
    return quote.line_items
      .filter(item => selected.includes(item.id))
      .reduce((sum, item) => sum + item.total_price, 0)
  }

  const handleApproveQuote = async (quoteId: string, partial = false) => {
    // TODO: Implement API call
    console.log('Approving quote:', quoteId, partial ? 'partial' : 'full')
  }

  const handleRejectQuote = async (quoteId: string, reason?: string) => {
    // TODO: Implement API call
    console.log('Rejecting quote:', quoteId, reason)
  }

  if (isLoading) {
    return (
      <ClientLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
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
            <h1 className="text-2xl font-bold text-gray-900">My Quotes</h1>
            <p className="text-gray-600 mt-1">Review and approve service quotes</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <FileText className="h-4 w-4 mr-2" />
              Request Quote
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search quotes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center space-x-4">
              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center space-x-2">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-')
                    setSortBy(field as 'date' | 'amount' | 'status')
                    setSortOrder(order as 'asc' | 'desc')
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="date-desc">Date (Newest)</option>
                  <option value="date-asc">Date (Oldest)</option>
                  <option value="amount-desc">Amount (High to Low)</option>
                  <option value="amount-asc">Amount (Low to High)</option>
                  <option value="status-asc">Status (A-Z)</option>
                  <option value="status-desc">Status (Z-A)</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Quotes List */}
        <div className="space-y-4">
          {filteredQuotes.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'You don\'t have any quotes yet.'}
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <FileText className="h-4 w-4 mr-2" />
                Request Your First Quote
              </Button>
            </Card>
          ) : (
            filteredQuotes.map((quote) => {
              const isExpanded = expandedQuote === quote.id
              const StatusIcon = statusConfig[quote.status].icon
              const expired = isExpired(quote.valid_until)
              const selectedTotal = calculateSelectedTotal(quote)
              
              return (
                <Card key={quote.id} className="overflow-hidden">
                  <div className="p-6">
                    {/* Quote Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{quote.job_title}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[quote.status].color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[quote.status].label}
                          </span>
                          {expired && quote.status === 'pending' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Expired
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{quote.job_description}</p>
                        
                        {/* Quote Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <DollarSign className="h-4 w-4 mr-2" />
                            <span className="font-semibold">{formatCurrency(quote.total_amount)}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>Valid until {formatDate(quote.valid_until)}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Download className="h-4 w-4 mr-2" />
                            <span>{quote.documents_count} documents</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleQuoteExpansion(quote.id)}
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        {/* Line Items */}
                        <div className="mb-6">
                          <h4 className="font-medium text-gray-900 mb-4">Quote Breakdown</h4>
                          <div className="space-y-3">
                            {quote.line_items.map((item) => {
                              const isSelected = selectedItems[quote.id]?.includes(item.id)
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
                                            onChange={() => toggleItemSelection(quote.id, item.id)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                          />
                                        )}
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryConfig[item.category].color}`}>
                                          {categoryConfig[item.category].label}
                                        </span>
                                        {item.is_optional && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            Optional
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-gray-900 font-medium">{item.description}</p>
                                      <p className="text-sm text-gray-600">
                                        {item.quantity} × {formatCurrency(item.unit_price)} = {formatCurrency(item.total_price)}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-gray-900">{formatCurrency(item.total_price)}</p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          
                          {/* Total */}
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                              <span className="text-lg font-bold text-gray-900">{formatCurrency(quote.total_amount)}</span>
                            </div>
                            {quote.can_partial_approve && selectedItems[quote.id]?.length > 0 && (
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-sm text-gray-600">Selected Items</span>
                                <span className="text-sm font-semibold text-blue-600">{formatCurrency(selectedTotal)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Notes */}
                        {quote.notes && (
                          <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{quote.notes}</p>
                          </div>
                        )}

                        {/* Rejection Reason */}
                        {quote.rejection_reason && (
                          <div className="mb-6">
                            <h4 className="font-medium text-red-900 mb-2">Rejection Reason</h4>
                            <p className="text-red-700 bg-red-50 p-3 rounded-lg">{quote.rejection_reason}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap items-center space-x-3">
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Download PDF
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Ask Questions
                          </Button>
                          
                          {quote.status === 'pending' && !expired && (
                            <>
                              {quote.can_partial_approve && selectedItems[quote.id]?.length > 0 && (
                                <Button 
                                  size="sm" 
                                  className="bg-blue-600 hover:bg-blue-700"
                                  onClick={() => handleApproveQuote(quote.id, true)}
                                >
                                  <Calculator className="h-4 w-4 mr-1" />
                                  Approve Selected ({formatCurrency(selectedTotal)})
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveQuote(quote.id, false)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve Full Quote
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-red-300 text-red-700 hover:bg-red-50"
                                onClick={() => handleRejectQuote(quote.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject Quote
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })
          )}
        </div>

        {/* Results Summary */}
        {filteredQuotes.length > 0 && (
          <div className="text-center text-sm text-gray-600">
            Showing {filteredQuotes.length} of {quotes.length} quotes
          </div>
        )}
      </div>
    </ClientLayout>
  )
}
