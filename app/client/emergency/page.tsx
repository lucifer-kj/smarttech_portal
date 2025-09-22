'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import ClientLayout from '@/components/client/ClientLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  AlertTriangle, 
  Phone, 
  MapPin, 
  MessageCircle, 
  Camera,
  Upload,
  CheckCircle,
  XCircle,
  User,
  Shield
} from 'lucide-react'

interface EmergencyRequest {
  id?: string
  type: 'plumbing' | 'electrical' | 'hvac' | 'security' | 'other'
  priority: 'emergency' | 'urgent' | 'critical'
  description: string
  location: string
  contact_phone: string
  contact_name: string
  photos?: File[]
  additional_notes?: string
  estimated_arrival?: string
  status: 'pending' | 'confirmed' | 'dispatched' | 'arrived' | 'completed'
}

const emergencyTypes = [
  { id: 'plumbing', label: 'Plumbing Emergency', icon: '🚰', description: 'Burst pipes, major leaks, sewage backup' },
  { id: 'electrical', label: 'Electrical Emergency', icon: '⚡', description: 'Power outages, exposed wires, electrical fires' },
  { id: 'hvac', label: 'HVAC Emergency', icon: '🌡️', description: 'No heat/cooling, system failures, gas leaks' },
  { id: 'security', label: 'Security Emergency', icon: '🔒', description: 'Broken locks, security system failures' },
  { id: 'other', label: 'Other Emergency', icon: '🚨', description: 'Any other urgent service need' }
]

const priorityLevels = [
  { id: 'emergency', label: 'Emergency', color: 'bg-red-600', description: 'Immediate danger to safety or property' },
  { id: 'urgent', label: 'Urgent', color: 'bg-orange-500', description: 'Service needed within 2 hours' },
  { id: 'critical', label: 'Critical', color: 'bg-yellow-500', description: 'Service needed within 4 hours' }
]

export default function EmergencyPage() {
  const { user: _user } = useAuth() // TODO: Use user data for emergency contact info
  const [request, setRequest] = useState<EmergencyRequest>({
    type: 'plumbing',
    priority: 'emergency',
    description: '',
    location: '',
    contact_phone: '',
    contact_name: '',
    additional_notes: '',
    status: 'pending'
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const handleInputChange = (field: keyof EmergencyRequest, value: string) => {
    setRequest(prev => ({ ...prev, [field]: value }))
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setPhotos(prev => [...prev, ...files].slice(0, 5)) // Max 5 photos
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
      setCurrentStep(4)
    }, 2000)
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return request.type && request.priority
      case 2:
        return request.description.trim().length > 10 && request.location.trim().length > 5
      case 3:
        return request.contact_name.trim().length > 0 && request.contact_phone.trim().length > 0
      default:
        return false
    }
  }

  if (submitted) {
    return (
      <ClientLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Success Message */}
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Emergency Request Submitted!</h1>
            <p className="text-gray-600 mb-6">
              Your emergency service request has been received and our team is responding immediately.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• You&apos;ll receive a confirmation call within 5 minutes</li>
                <li>• A technician will be dispatched immediately</li>
                <li>• You&apos;ll receive real-time updates via SMS</li>
                <li>• Estimated arrival time: 30-60 minutes</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="bg-green-600 hover:bg-green-700">
                <Phone className="h-4 w-4 mr-2" />
                Call Now: (555) 911-HELP
              </Button>
              <Button variant="outline">
                <MessageCircle className="h-4 w-4 mr-2" />
                Track Status
              </Button>
            </div>
          </Card>

          {/* Emergency Contacts */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contacts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <Phone className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <p className="font-medium text-red-900">Emergency Hotline</p>
                  <p className="text-sm text-red-700">(555) 911-HELP</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <MessageCircle className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-blue-900">Text Support</p>
                  <p className="text-sm text-blue-700">(555) 911-TEXT</p>
                </div>
              </div>
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
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency Service Request</h1>
          <p className="text-gray-600">We&apos;re here to help 24/7. Describe your emergency and we&apos;ll respond immediately.</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  step < currentStep ? 'bg-red-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Emergency Type */}
        {currentStep === 1 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">What type of emergency is this?</h2>
            
            <div className="space-y-4 mb-6">
              {emergencyTypes.map((type) => (
                <div
                  key={type.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    request.type === type.id
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleInputChange('type', type.id)}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-4">{type.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{type.label}</h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      request.type === type.id ? 'border-red-500 bg-red-500' : 'border-gray-300'
                    }`}>
                      {request.type === type.id && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-4">How urgent is this?</h3>
              <div className="space-y-3">
                {priorityLevels.map((priority) => (
                  <div
                    key={priority.id}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      request.priority === priority.id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('priority', priority.id)}
                  >
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${priority.color} mr-3`}></div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{priority.label}</h4>
                        <p className="text-sm text-gray-600">{priority.description}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        request.priority === priority.id ? 'border-red-500 bg-red-500' : 'border-gray-300'
                      }`}>
                        {request.priority === priority.id && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={nextStep}
                disabled={!canProceed()}
                className="bg-red-600 hover:bg-red-700"
              >
                Next Step
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Problem Description */}
        {currentStep === 2 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Describe the problem</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Problem Description *
                </label>
                <textarea
                  value={request.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Please describe what's happening in detail..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {request.description.length}/500 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={request.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter your address or location"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={request.additional_notes}
                  onChange={(e) => handleInputChange('additional_notes', e.target.value)}
                  placeholder="Any additional information that might help our technicians..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photos (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Upload photos to help us understand the problem
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
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={URL.createObjectURL(photo)}
                          alt={`Emergency photo ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                          width={200}
                          height={80}
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={prevStep}>
                Previous
              </Button>
              <Button 
                onClick={nextStep}
                disabled={!canProceed()}
                className="bg-red-600 hover:bg-red-700"
              >
                Next Step
              </Button>
            </div>
          </Card>
        )}

        {/* Step 3: Contact Information */}
        {currentStep === 3 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={request.contact_name}
                    onChange={(e) => handleInputChange('contact_name', e.target.value)}
                    placeholder="Enter your full name"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={request.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900">Emergency Response Guarantee</h3>
                    <ul className="text-sm text-blue-800 mt-2 space-y-1">
                      <li>• 24/7 emergency service available</li>
                      <li>• Response time: 30-60 minutes</li>
                      <li>• Licensed and insured technicians</li>
                      <li>• Upfront pricing - no surprises</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={prevStep}>
                Previous
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Submit Emergency Request
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Emergency Hotline */}
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Need Immediate Help?</h3>
            <p className="text-red-700 mb-4">Call our emergency hotline for immediate assistance</p>
            <Button className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-3">
              <Phone className="h-5 w-5 mr-2" />
              (555) 911-HELP
            </Button>
          </div>
        </Card>
      </div>
    </ClientLayout>
  )
}
