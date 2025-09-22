'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ClientLayout from '@/components/client/ClientLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  Star, 
  MessageCircle, 
  CheckCircle, 
  Clock, 
  User, 
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Camera,
  Upload,
  Send,
  Heart,
  Award,
  Zap
} from 'lucide-react'

interface Feedback {
  id: string
  job_id: string
  job_title: string
  job_date: string
  technician_name: string
  rating: number
  overall_satisfaction: 'excellent' | 'good' | 'average' | 'poor'
  categories: {
    timeliness: number
    quality: number
    communication: number
    professionalism: number
    cleanliness: number
  }
  comments: string
  would_recommend: boolean
  photos?: File[]
  submitted_at?: string
  status: 'pending' | 'submitted' | 'published'
}

interface JobForFeedback {
  id: string
  title: string
  completed_date: string
  technician_name: string
  status: 'completed'
  has_feedback: boolean
}

const satisfactionLevels = [
  { id: 'excellent', label: 'Excellent', color: 'bg-green-100 text-green-800', icon: Award },
  { id: 'good', label: 'Good', color: 'bg-blue-100 text-blue-800', icon: ThumbsUp },
  { id: 'average', label: 'Average', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  { id: 'poor', label: 'Poor', color: 'bg-red-100 text-red-800', icon: ThumbsDown }
]

const ratingCategories = [
  { id: 'timeliness', label: 'Timeliness', description: 'How well did we stick to the scheduled time?' },
  { id: 'quality', label: 'Quality of Work', description: 'How satisfied are you with the work quality?' },
  { id: 'communication', label: 'Communication', description: 'How clear and helpful was our communication?' },
  { id: 'professionalism', label: 'Professionalism', description: 'How professional was our technician?' },
  { id: 'cleanliness', label: 'Cleanliness', description: 'How clean did we leave your space?' }
]

export default function FeedbackPage() {
  const { user } = useAuth()
  const [jobsForFeedback, setJobsForFeedback] = useState<JobForFeedback[]>([])
  const [selectedJob, setSelectedJob] = useState<JobForFeedback | null>(null)
  const [feedback, setFeedback] = useState<Feedback>({
    id: '',
    job_id: '',
    job_title: '',
    job_date: '',
    technician_name: '',
    rating: 5,
    overall_satisfaction: 'excellent',
    categories: {
      timeliness: 5,
      quality: 5,
      communication: 5,
      professionalism: 5,
      cleanliness: 5
    },
    comments: '',
    would_recommend: true,
    photos: [],
    status: 'pending'
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showJobSelection, setShowJobSelection] = useState(true)

  // Mock data - will be replaced with real API call
  useEffect(() => {
    const mockJobs: JobForFeedback[] = [
      {
        id: '1',
        title: 'HVAC System Maintenance',
        completed_date: '2024-01-10T14:30:00Z',
        technician_name: 'John Smith',
        status: 'completed',
        has_feedback: false
      },
      {
        id: '2',
        title: 'Plumbing Repair - Kitchen Sink',
        completed_date: '2024-01-08T11:45:00Z',
        technician_name: 'Mike Davis',
        status: 'completed',
        has_feedback: true
      },
      {
        id: '3',
        title: 'Electrical Panel Inspection',
        completed_date: '2024-01-05T16:20:00Z',
        technician_name: 'Sarah Johnson',
        status: 'completed',
        has_feedback: false
      }
    ]

    setJobsForFeedback(mockJobs)
  }, [])

  const selectJob = (job: JobForFeedback) => {
    setSelectedJob(job)
    setFeedback(prev => ({
      ...prev,
      job_id: job.id,
      job_title: job.title,
      job_date: job.completed_date,
      technician_name: job.technician_name
    }))
    setShowJobSelection(false)
  }

  const handleRatingChange = (category: keyof Feedback['categories'], rating: number) => {
    setFeedback(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: rating
      }
    }))
  }

  const handleOverallRatingChange = (rating: number) => {
    setFeedback(prev => ({
      ...prev,
      rating,
      overall_satisfaction: rating >= 4 ? 'excellent' : rating >= 3 ? 'good' : rating >= 2 ? 'average' : 'poor'
    }))
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setPhotos(prev => [...prev, ...files].slice(0, 3)) // Max 3 photos
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 2000)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const renderStars = (rating: number, onChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className={`h-6 w-6 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            } ${onChange ? 'hover:text-yellow-400 cursor-pointer' : 'cursor-default'}`}
          >
            <Star className="h-full w-full" />
          </button>
        ))}
      </div>
    )
  }

  if (submitted) {
    return (
      <ClientLayout>
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
            <p className="text-gray-600 mb-6">
              Your feedback has been submitted successfully. We appreciate you taking the time to help us improve our service.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your feedback will be reviewed by our team</li>
                <li>• We&apos;ll share your positive feedback with the technician</li>
                <li>• Any concerns will be addressed promptly</li>
                <li>• You may be eligible for our referral program</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Heart className="h-4 w-4 mr-2" />
                Leave Google Review
              </Button>
              <Button variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Us
              </Button>
            </div>
          </Card>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Feedback</h1>
          <p className="text-gray-600">Help us improve by sharing your experience</p>
        </div>

        {/* Job Selection */}
        {showJobSelection && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Select a completed job to review</h2>
            
            {jobsForFeedback.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No completed jobs</h3>
                <p className="text-gray-600">You don&apos;t have any completed jobs to review yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobsForFeedback.map((job) => (
                  <div
                    key={job.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      job.has_feedback 
                        ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                    onClick={() => !job.has_feedback && selectJob(job)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-600">
                          Completed on {formatDate(job.completed_date)} by {job.technician_name}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {job.has_feedback ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Reviewed
                          </span>
                        ) : (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Star className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Feedback Form */}
        {selectedJob && !showJobSelection && (
          <div className="space-y-6">
            {/* Job Info */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedJob.title}</h2>
                  <p className="text-gray-600">
                    Completed on {formatDate(selectedJob.completed_date)} by {selectedJob.technician_name}
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowJobSelection(true)}>
                  Change Job
                </Button>
              </div>
            </Card>

            {/* Overall Rating */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Rating</h3>
              <div className="text-center">
                <div className="mb-4">
                  {renderStars(feedback.rating, handleOverallRatingChange)}
                </div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {feedback.rating === 5 ? 'Excellent!' : 
                   feedback.rating === 4 ? 'Good' : 
                   feedback.rating === 3 ? 'Average' : 
                   feedback.rating === 2 ? 'Poor' : 'Very Poor'}
                </p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  satisfactionLevels.find(s => s.id === feedback.overall_satisfaction)?.color
                }`}>
                  {satisfactionLevels.find(s => s.id === feedback.overall_satisfaction)?.label}
                </span>
              </div>
            </Card>

            {/* Category Ratings */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Rate Each Category</h3>
              <div className="space-y-6">
                {ratingCategories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{category.label}</h4>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                    <div className="ml-4">
                      {renderStars(feedback.categories[category.id as keyof Feedback['categories']], (rating) => 
                        handleRatingChange(category.id as keyof Feedback['categories'], rating)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Comments */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Comments</h3>
              <textarea
                value={feedback.comments}
                onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Tell us more about your experience..."
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </Card>

            {/* Recommendation */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Would you recommend us?</h3>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setFeedback(prev => ({ ...prev, would_recommend: true }))}
                  className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${
                    feedback.would_recommend 
                      ? 'border-green-500 bg-green-50 text-green-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ThumbsUp className="h-5 w-5 mr-2" />
                  Yes, I would recommend
                </button>
                <button
                  type="button"
                  onClick={() => setFeedback(prev => ({ ...prev, would_recommend: false }))}
                  className={`flex items-center px-4 py-2 rounded-lg border-2 transition-colors ${
                    !feedback.would_recommend 
                      ? 'border-red-500 bg-red-50 text-red-700' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ThumbsDown className="h-5 w-5 mr-2" />
                  No, I would not recommend
                </button>
              </div>
            </Card>

            {/* Photos */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos (Optional)</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Share photos of the completed work
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Photos
                </label>
              </div>
              
              {photos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Feedback photo ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Submit */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setShowJobSelection(true)}>
                Back to Job Selection
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </ClientLayout>
  )
}
