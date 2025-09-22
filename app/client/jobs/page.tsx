'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ClientLayout from '@/components/client/ClientLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Briefcase, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  MapPin, 
  Phone,
  MessageCircle,
  Eye,
  Download,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface Job {
  id: string
  title: string
  description: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'quote'
  priority: 'low' | 'medium' | 'high' | 'emergency'
  scheduled_date: string
  estimated_duration: string
  technician?: {
    name: string
    phone: string
    photo?: string
  }
  location: string
  created_at: string
  updated_at: string
  documents_count: number
  has_feedback: boolean
  rating?: number
}

const statusConfig = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800', icon: Calendar },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  quote: { label: 'Quote', color: 'bg-purple-100 text-purple-800', icon: Briefcase }
}

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  emergency: { label: 'Emergency', color: 'bg-red-100 text-red-800' }
}

export default function JobsPage() {
  const { user: _user } = useAuth() // TODO: Use user data for job filtering
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'priority'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [expandedJob, setExpandedJob] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - will be replaced with real API call
  useEffect(() => {
    const mockJobs: Job[] = [
      {
        id: '1',
        title: 'HVAC System Maintenance',
        description: 'Annual maintenance check for central air conditioning system',
        status: 'scheduled',
        priority: 'medium',
        scheduled_date: '2024-01-15T10:00:00Z',
        estimated_duration: '2 hours',
        technician: {
          name: 'John Smith',
          phone: '+1 (555) 123-4567',
          photo: '/api/placeholder/40/40'
        },
        location: '123 Main St, Anytown, ST 12345',
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-10T09:00:00Z',
        documents_count: 3,
        has_feedback: false
      },
      {
        id: '2',
        title: 'Electrical Panel Inspection',
        description: 'Safety inspection and testing of main electrical panel',
        status: 'in_progress',
        priority: 'high',
        scheduled_date: '2024-01-12T14:00:00Z',
        estimated_duration: '1.5 hours',
        technician: {
          name: 'Sarah Johnson',
          phone: '+1 (555) 987-6543',
          photo: '/api/placeholder/40/40'
        },
        location: '123 Main St, Anytown, ST 12345',
        created_at: '2024-01-08T11:30:00Z',
        updated_at: '2024-01-12T14:15:00Z',
        documents_count: 1,
        has_feedback: false
      },
      {
        id: '3',
        title: 'Plumbing Repair - Kitchen Sink',
        description: 'Fix leaking kitchen sink faucet and replace worn parts',
        status: 'completed',
        priority: 'medium',
        scheduled_date: '2024-01-10T09:00:00Z',
        estimated_duration: '1 hour',
        technician: {
          name: 'Mike Davis',
          phone: '+1 (555) 456-7890',
          photo: '/api/placeholder/40/40'
        },
        location: '123 Main St, Anytown, ST 12345',
        created_at: '2024-01-05T16:20:00Z',
        updated_at: '2024-01-10T10:30:00Z',
        documents_count: 2,
        has_feedback: true,
        rating: 5
      },
      {
        id: '4',
        title: 'Emergency AC Repair',
        description: 'AC unit not cooling - emergency repair needed',
        status: 'completed',
        priority: 'emergency',
        scheduled_date: '2024-01-08T18:00:00Z',
        estimated_duration: '3 hours',
        technician: {
          name: 'Alex Rodriguez',
          phone: '+1 (555) 321-0987',
          photo: '/api/placeholder/40/40'
        },
        location: '123 Main St, Anytown, ST 12345',
        created_at: '2024-01-08T17:30:00Z',
        updated_at: '2024-01-08T21:45:00Z',
        documents_count: 4,
        has_feedback: true,
        rating: 4
      },
      {
        id: '5',
        title: 'Bathroom Renovation Quote',
        description: 'Complete bathroom renovation including plumbing, electrical, and fixtures',
        status: 'quote',
        priority: 'low',
        scheduled_date: '2024-01-20T10:00:00Z',
        estimated_duration: '2 hours',
        location: '123 Main St, Anytown, ST 12345',
        created_at: '2024-01-12T13:00:00Z',
        updated_at: '2024-01-12T13:00:00Z',
        documents_count: 5,
        has_feedback: false
      }
    ]

    setTimeout(() => {
      setJobs(mockJobs)
      setFilteredJobs(mockJobs)
      setIsLoading(false)
    }, 1000)
  }, [])

  // Filter and sort jobs
  useEffect(() => {
    let filtered = jobs

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(job => job.priority === priorityFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'priority':
          const priorityOrder = { emergency: 4, high: 3, medium: 2, low: 1 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredJobs(filtered)
  }, [jobs, searchQuery, statusFilter, priorityFilter, sortBy, sortOrder])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // const getStatusIcon = (status: Job['status']) => {
  //   const Icon = statusConfig[status].icon
  //   return <Icon className="h-4 w-4" />
  // }

  const toggleJobExpansion = (jobId: string) => {
    setExpandedJob(expandedJob === jobId ? null : jobId)
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
            <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
            <p className="text-gray-600 mt-1">Track and manage your service requests</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Briefcase className="h-4 w-4 mr-2" />
              Request Service
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
                  placeholder="Search jobs..."
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
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="quote">Quote</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center space-x-2">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Priority</option>
                  <option value="emergency">Emergency</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center space-x-2">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-')
                    setSortBy(field as 'date' | 'status' | 'priority')
                    setSortOrder(order as 'asc' | 'desc')
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="date-desc">Date (Newest)</option>
                  <option value="date-asc">Date (Oldest)</option>
                  <option value="priority-desc">Priority (High to Low)</option>
                  <option value="priority-asc">Priority (Low to High)</option>
                  <option value="status-asc">Status (A-Z)</option>
                  <option value="status-desc">Status (Z-A)</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Jobs List */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <Card className="p-8 text-center">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'You don\'t have any service requests yet.'}
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Briefcase className="h-4 w-4 mr-2" />
                Request Your First Service
              </Button>
            </Card>
          ) : (
            filteredJobs.map((job) => {
              const isExpanded = expandedJob === job.id
              const StatusIcon = statusConfig[job.status].icon
              
              return (
                <Card key={job.id} className="overflow-hidden">
                  <div className="p-6">
                    {/* Job Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[job.status].color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[job.status].label}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityConfig[job.priority].color}`}>
                            {priorityConfig[job.priority].label}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{job.description}</p>
                        
                        {/* Job Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{formatDate(job.scheduled_date)}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{job.estimated_duration}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span className="truncate">{job.location}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Download className="h-4 w-4 mr-2" />
                            <span>{job.documents_count} documents</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleJobExpansion(job.id)}
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
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Technician Info */}
                          {job.technician && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Assigned Technician</h4>
                              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{job.technician.name}</p>
                                  <p className="text-sm text-gray-600">{job.technician.phone}</p>
                                </div>
                                <Button size="sm" variant="outline">
                                  <Phone className="h-4 w-4 mr-1" />
                                  Call
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Actions */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                            <div className="space-y-2">
                              <Button size="sm" className="w-full justify-start" variant="outline">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Message Technician
                              </Button>
                              <Button size="sm" className="w-full justify-start" variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                View Documents
                              </Button>
                              {job.status === 'completed' && !job.has_feedback && (
                                <Button size="sm" className="w-full justify-start" variant="outline">
                                  <Star className="h-4 w-4 mr-2" />
                                  Submit Feedback
                                </Button>
                              )}
                              {job.status === 'completed' && job.has_feedback && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">Rating:</span>
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        className={`h-4 w-4 ${
                                          i < (job.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                        }`} 
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
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
        {filteredJobs.length > 0 && (
          <div className="text-center text-sm text-gray-600">
            Showing {filteredJobs.length} of {jobs.length} jobs
          </div>
        )}
      </div>
    </ClientLayout>
  )
}
