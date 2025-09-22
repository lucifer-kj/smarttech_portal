'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ClientLayout from '@/components/client/ClientLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Briefcase, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  MessageCircle,
  Download,
  Eye,
  Camera,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  Star,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Share,
  Edit,
  Plus,
  Image,
  Video,
  FileText as Document
} from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface JobDetail {
  id: string
  title: string
  description: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'quote'
  priority: 'low' | 'medium' | 'high' | 'emergency'
  scheduled_date: string
  estimated_duration: string
  actual_duration?: string
  address: string
  created_at: string
  updated_at: string
  technician?: {
    id: string
    name: string
    phone: string
    email: string
    photo?: string
    specialties: string[]
  }
  client_notes?: string
  technician_notes?: string
  materials_used?: Material[]
  photos?: JobPhoto[]
  documents?: JobDocument[]
  activities?: JobActivity[]
  feedback?: {
    rating: number
    comment: string
    submitted_at: string
  }
}

interface Material {
  id: string
  name: string
  quantity: number
  unit: string
  cost_per_unit: number
  total_cost: number
  category: 'labor' | 'materials' | 'equipment'
}

interface JobPhoto {
  id: string
  url: string
  caption?: string
  taken_at: string
  taken_by: string
  category: 'before' | 'during' | 'after'
}

interface JobDocument {
  id: string
  title: string
  type: 'quote' | 'invoice' | 'warranty' | 'certificate' | 'other'
  url: string
  uploaded_at: string
  requires_signature: boolean
  signed_at?: string
}

interface JobActivity {
  id: string
  type: 'status_change' | 'note_added' | 'photo_uploaded' | 'document_uploaded' | 'material_added'
  description: string
  timestamp: string
  user_id: string
  user_name: string
  metadata?: Record<string, unknown>
}

const statusConfig = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800', icon: Calendar },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  quote: { label: 'Quote', color: 'bg-purple-100 text-purple-800', icon: FileText }
}

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
  emergency: { label: 'Emergency', color: 'bg-red-100 text-red-800' }
}

export default function JobDetailPage() {
  const { user } = useAuth()
  const params = useParams()
  const jobId = params.id as string
  
  const [job, setJob] = useState<JobDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'documents' | 'photos' | 'materials'>('overview')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  // Mock data - will be replaced with real API call
  useEffect(() => {
    const mockJob: JobDetail = {
      id: jobId,
      title: 'HVAC System Maintenance',
      description: 'Annual maintenance check for central air conditioning system including filter replacement, coil cleaning, and system testing.',
      status: 'completed',
      priority: 'medium',
      scheduled_date: '2024-01-15T10:00:00Z',
      estimated_duration: '2 hours',
      actual_duration: '1.75 hours',
      address: '123 Main Street, Anytown, ST 12345',
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-15T12:00:00Z',
      technician: {
        id: 'tech-1',
        name: 'John Smith',
        phone: '+1 (555) 123-4567',
        email: 'john.smith@smarttech.com',
        specialties: ['HVAC', 'Refrigeration', 'Electrical']
      },
      client_notes: 'Please check the thermostat settings and ensure all vents are working properly.',
      technician_notes: 'System is running efficiently. Replaced air filter and cleaned condenser coils. All vents are functioning correctly.',
      materials_used: [
        {
          id: 'mat-1',
          name: 'High-Efficiency Air Filter',
          quantity: 1,
          unit: 'each',
          cost_per_unit: 25.00,
          total_cost: 25.00,
          category: 'materials'
        },
        {
          id: 'mat-2',
          name: 'Coil Cleaning Solution',
          quantity: 2,
          unit: 'bottles',
          cost_per_unit: 15.00,
          total_cost: 30.00,
          category: 'materials'
        },
        {
          id: 'mat-3',
          name: 'Labor - HVAC Technician',
          quantity: 1.75,
          unit: 'hours',
          cost_per_unit: 85.00,
          total_cost: 148.75,
          category: 'labor'
        }
      ],
      photos: [
        {
          id: 'photo-1',
          url: '/api/placeholder/400/300',
          caption: 'Before: Dirty air filter',
          taken_at: '2024-01-15T10:15:00Z',
          taken_by: 'John Smith',
          category: 'before'
        },
        {
          id: 'photo-2',
          url: '/api/placeholder/400/300',
          caption: 'During: Cleaning condenser coils',
          taken_at: '2024-01-15T11:30:00Z',
          taken_by: 'John Smith',
          category: 'during'
        },
        {
          id: 'photo-3',
          url: '/api/placeholder/400/300',
          caption: 'After: Clean system ready for operation',
          taken_at: '2024-01-15T12:00:00Z',
          taken_by: 'John Smith',
          category: 'after'
        }
      ],
      documents: [
        {
          id: 'doc-1',
          title: 'Service Quote',
          type: 'quote',
          url: '/api/placeholder/quote.pdf',
          uploaded_at: '2024-01-10T09:00:00Z',
          requires_signature: true,
          signed_at: '2024-01-12T14:30:00Z'
        },
        {
          id: 'doc-2',
          title: 'Work Completion Certificate',
          type: 'certificate',
          url: '/api/placeholder/certificate.pdf',
          uploaded_at: '2024-01-15T12:00:00Z',
          requires_signature: false
        },
        {
          id: 'doc-3',
          title: 'Equipment Warranty',
          type: 'warranty',
          url: '/api/placeholder/warranty.pdf',
          uploaded_at: '2024-01-15T12:00:00Z',
          requires_signature: false
        }
      ],
      activities: [
        {
          id: 'act-1',
          type: 'status_change',
          description: 'Job scheduled',
          timestamp: '2024-01-10T09:00:00Z',
          user_id: 'system',
          user_name: 'System'
        },
        {
          id: 'act-2',
          type: 'note_added',
          description: 'Client notes added',
          timestamp: '2024-01-12T10:30:00Z',
          user_id: user?.id || '',
          user_name: user?.email?.split('@')[0] || 'Client'
        },
        {
          id: 'act-3',
          type: 'status_change',
          description: 'Job started',
          timestamp: '2024-01-15T10:00:00Z',
          user_id: 'tech-1',
          user_name: 'John Smith'
        },
        {
          id: 'act-4',
          type: 'photo_uploaded',
          description: 'Before photos uploaded',
          timestamp: '2024-01-15T10:15:00Z',
          user_id: 'tech-1',
          user_name: 'John Smith'
        },
        {
          id: 'act-5',
          type: 'photo_uploaded',
          description: 'During work photos uploaded',
          timestamp: '2024-01-15T11:30:00Z',
          user_id: 'tech-1',
          user_name: 'John Smith'
        },
        {
          id: 'act-6',
          type: 'photo_uploaded',
          description: 'After photos uploaded',
          timestamp: '2024-01-15T12:00:00Z',
          user_id: 'tech-1',
          user_name: 'John Smith'
        },
        {
          id: 'act-7',
          type: 'status_change',
          description: 'Job completed',
          timestamp: '2024-01-15T12:00:00Z',
          user_id: 'tech-1',
          user_name: 'John Smith'
        }
      ],
      feedback: {
        rating: 5,
        comment: 'Excellent service! John was professional, punctual, and thorough. The system is running much more efficiently now.',
        submitted_at: '2024-01-16T09:00:00Z'
      }
    }

    setTimeout(() => {
      setJob(mockJob)
      setIsLoading(false)
    }, 1000)
  }, [jobId, user])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (hours: number) => {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    return `${wholeHours}h ${minutes}m`
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Briefcase },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'materials', label: 'Materials', icon: CheckCircle }
  ]

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

  if (!job) {
    return (
      <ClientLayout>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Job not found</h3>
          <p className="text-gray-600 mb-4">The requested job could not be found.</p>
          <Link href="/client/jobs">
            <Button>Back to Jobs</Button>
          </Link>
        </div>
      </ClientLayout>
    )
  }

  const StatusIcon = statusConfig[job.status].icon

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/client/jobs">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-600">Job ID: {job.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig[job.status].color}`}>
              <StatusIcon className="h-4 w-4 mr-1" />
              {statusConfig[job.status].label}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityConfig[job.priority].color}`}>
              {priorityConfig[job.priority].label}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' | 'timeline' | 'documents' | 'photos' | 'materials')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Details */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Description</h3>
                    <p className="text-gray-600 mt-1">{job.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium text-gray-900">Scheduled Date</h3>
                      <p className="text-gray-600">{formatDate(job.scheduled_date)}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Duration</h3>
                      <p className="text-gray-600">
                        {job.actual_duration ? formatDuration(parseFloat(job.actual_duration)) : job.estimated_duration}
                        {job.actual_duration && (
                          <span className="text-sm text-gray-500 ml-1">
                            (estimated: {job.estimated_duration})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900">Address</h3>
                    <p className="text-gray-600">{job.address}</p>
                  </div>
                </div>
              </Card>

              {/* Technician Information */}
              {job.technician && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Technician</h2>
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{job.technician.name}</h3>
                      <p className="text-sm text-gray-600">{job.technician.email}</p>
                      <p className="text-sm text-gray-600">{job.technician.phone}</p>
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-gray-900">Specialties</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {job.technician.specialties.map((specialty) => (
                            <span key={specialty} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
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

              {/* Notes */}
              {(job.client_notes || job.technician_notes) && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                  <div className="space-y-4">
                    {job.client_notes && (
                      <div>
                        <h3 className="font-medium text-gray-900">Your Notes</h3>
                        <p className="text-gray-600 mt-1">{job.client_notes}</p>
                      </div>
                    )}
                    {job.technician_notes && (
                      <div>
                        <h3 className="font-medium text-gray-900">Technician Notes</h3>
                        <p className="text-gray-600 mt-1">{job.technician_notes}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Feedback */}
              {job.feedback && (
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Feedback</h2>
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-5 w-5 ${
                            i < job.feedback!.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{job.feedback.comment}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Submitted on {formatDate(job.feedback.submitted_at)}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  <Button className="w-full justify-start" variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message Technician
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Share className="h-4 w-4 mr-2" />
                    Share Job Details
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Add Notes
                  </Button>
                  {job.status === 'completed' && !job.feedback && (
                    <Button className="w-full justify-start" variant="outline">
                      <Star className="h-4 w-4 mr-2" />
                      Submit Feedback
                    </Button>
                  )}
                </div>
              </Card>

              {/* Job Summary */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-medium ${statusConfig[job.status].color}`}>
                      {statusConfig[job.status].label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority</span>
                    <span className={`font-medium ${priorityConfig[job.priority].color}`}>
                      {priorityConfig[job.priority].label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created</span>
                    <span className="font-medium text-gray-900">{formatDate(job.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="font-medium text-gray-900">{formatDate(job.updated_at)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Job Timeline</h2>
            <div className="space-y-4">
              {job.activities?.map((activity, index) => (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    {index < (job.activities?.length || 0) - 1 && (
                      <div className="w-px h-8 bg-gray-200 ml-4"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(activity.timestamp)} • {activity.user_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {job.documents?.map((document) => (
                <Card key={document.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Document className="h-5 w-5 text-gray-400" />
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        document.type === 'quote' ? 'bg-blue-100 text-blue-800' :
                        document.type === 'certificate' ? 'bg-green-100 text-green-800' :
                        document.type === 'warranty' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {document.type}
                      </span>
                    </div>
                    {document.requires_signature && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        document.signed_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {document.signed_at ? 'Signed' : 'Pending'}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-2">{document.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Uploaded {formatDate(document.uploaded_at)}
                  </p>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Job Photos</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {job.photos?.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Job photo'}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        photo.category === 'before' ? 'bg-red-100 text-red-800' :
                        photo.category === 'during' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {photo.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(photo.taken_at)}
                      </span>
                    </div>
                    {photo.caption && (
                      <p className="text-sm text-gray-600">{photo.caption}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Taken by {photo.taken_by}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Materials Used</h2>
            
            {job.materials_used && job.materials_used.length > 0 ? (
              <div className="space-y-4">
                {job.materials_used.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{material.name}</h3>
                      <p className="text-sm text-gray-600">
                        {material.quantity} {material.unit} × ${material.cost_per_unit.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${material.total_cost.toFixed(2)}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        material.category === 'labor' ? 'bg-blue-100 text-blue-800' :
                        material.category === 'materials' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {material.category}
                      </span>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Cost</span>
                    <span className="text-lg font-bold text-gray-900">
                      ${job.materials_used.reduce((sum, mat) => sum + mat.total_cost, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No materials recorded</h3>
                <p className="text-gray-600">No materials were used for this job.</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </ClientLayout>
  )
}
