'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw,
  SkipForward,
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  Home,
  Briefcase,
  FileText,
  Users,
  Settings,
  HelpCircle
} from 'lucide-react'

export interface WalkthroughStep {
  id: string
  title: string
  content: string
  target?: string // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: {
    type: 'click' | 'scroll' | 'navigate'
    target?: string
    url?: string
  }
  image?: string
  video?: string
  interactive?: boolean
  skipable?: boolean
}

export interface WalkthroughConfig {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  steps: WalkthroughStep[]
  role: 'admin' | 'client'
  estimatedDuration: number // in minutes
  prerequisites?: string[]
}

interface WalkthroughModalProps {
  config: WalkthroughConfig
  isOpen: boolean
  onClose: () => void
  onComplete: (walkthroughId: string) => void
  onSkip: (walkthroughId: string) => void
  currentStep?: number
  onStepChange?: (step: number) => void
}

const walkthroughConfigs: WalkthroughConfig[] = [
  {
    id: 'client-dashboard-intro',
    title: 'Welcome to Your Dashboard',
    description: 'Learn how to navigate your service portal and manage your requests',
    icon: Home,
    role: 'client',
    estimatedDuration: 3,
    steps: [
      {
        id: 'welcome',
        title: 'Welcome to SmartTech Portal',
        content: 'This is your personal service dashboard where you can manage all your service requests, view quotes, and track job progress.',
        position: 'center',
        image: '/api/placeholder/400/300'
      },
      {
        id: 'quick-stats',
        title: 'Quick Overview',
        content: 'Here you can see a summary of your active jobs, pending quotes, and upcoming appointments at a glance.',
        target: '[data-walkthrough="quick-stats"]',
        position: 'bottom'
      },
      {
        id: 'emergency-button',
        title: 'Emergency Service',
        content: 'For urgent service needs, use the emergency button to get immediate assistance. We\'re available 24/7.',
        target: '[data-walkthrough="emergency-button"]',
        position: 'left',
        action: {
          type: 'click',
          target: '[data-walkthrough="emergency-button"]'
        }
      },
      {
        id: 'navigation',
        title: 'Navigation Menu',
        content: 'Use the sidebar to navigate between different sections: Jobs, Quotes, Documents, and more.',
        target: '[data-walkthrough="navigation"]',
        position: 'right'
      }
    ]
  },
  {
    id: 'client-jobs-overview',
    title: 'Managing Your Jobs',
    description: 'Learn how to view job details, track progress, and communicate with technicians',
    icon: Briefcase,
    role: 'client',
    estimatedDuration: 5,
    prerequisites: ['client-dashboard-intro'],
    steps: [
      {
        id: 'jobs-list',
        title: 'Your Jobs List',
        content: 'View all your service jobs with their current status, scheduled dates, and priority levels.',
        target: '[data-walkthrough="jobs-list"]',
        position: 'bottom'
      },
      {
        id: 'job-filters',
        title: 'Filter and Search',
        content: 'Use filters to find specific jobs by status, priority, or date range. Search by job description or technician name.',
        target: '[data-walkthrough="job-filters"]',
        position: 'bottom'
      },
      {
        id: 'job-details',
        title: 'Job Details',
        content: 'Click on any job to see detailed information including timeline, documents, photos, and materials used.',
        target: '[data-walkthrough="job-details"]',
        position: 'top',
        action: {
          type: 'click',
          target: '[data-walkthrough="job-details"]'
        }
      },
      {
        id: 'technician-contact',
        title: 'Contact Your Technician',
        content: 'Message or call your assigned technician directly from the job details page.',
        target: '[data-walkthrough="technician-contact"]',
        position: 'left'
      }
    ]
  },
  {
    id: 'client-quotes-workflow',
    title: 'Quote Approval Process',
    description: 'Understand how to review, approve, or reject service quotes',
    icon: FileText,
    role: 'client',
    estimatedDuration: 4,
    prerequisites: ['client-dashboard-intro'],
    steps: [
      {
        id: 'quotes-overview',
        title: 'Pending Quotes',
        content: 'Review quotes that require your approval. You can see the total amount and status at a glance.',
        target: '[data-walkthrough="quotes-overview"]',
        position: 'bottom'
      },
      {
        id: 'quote-breakdown',
        title: 'Detailed Breakdown',
        content: 'View line-by-line costs including labor, materials, and equipment. You can approve individual items or the entire quote.',
        target: '[data-walkthrough="quote-breakdown"]',
        position: 'top'
      },
      {
        id: 'partial-approval',
        title: 'Partial Approval',
        content: 'Select specific line items to approve if you don\'t want to approve the entire quote.',
        target: '[data-walkthrough="partial-approval"]',
        position: 'left',
        interactive: true
      },
      {
        id: 'quote-actions',
        title: 'Quote Actions',
        content: 'Approve, reject, or request modifications to quotes. You can also download PDF copies.',
        target: '[data-walkthrough="quote-actions"]',
        position: 'right'
      }
    ]
  },
  {
    id: 'admin-dashboard-intro',
    title: 'Admin Dashboard Overview',
    description: 'Learn how to manage clients, monitor system health, and oversee operations',
    icon: Settings,
    role: 'admin',
    estimatedDuration: 6,
    steps: [
      {
        id: 'admin-welcome',
        title: 'Admin Control Center',
        content: 'Welcome to the admin dashboard. Here you can monitor all system operations and manage client accounts.',
        position: 'center',
        image: '/api/placeholder/400/300'
      },
      {
        id: 'system-health',
        title: 'System Health Monitoring',
        content: 'Monitor ServiceM8 integration status, webhook processing, and system performance in real-time.',
        target: '[data-walkthrough="system-health"]',
        position: 'bottom'
      },
      {
        id: 'user-management',
        title: 'User Management',
        content: 'Create new client accounts, send magic links, and manage user permissions and access.',
        target: '[data-walkthrough="user-management"]',
        position: 'right'
      },
      {
        id: 'audit-logs',
        title: 'Audit Trail',
        content: 'Track all user actions and system events for compliance and troubleshooting.',
        target: '[data-walkthrough="audit-logs"]',
        position: 'left'
      }
    ]
  }
]

export function WalkthroughModal({
  config,
  isOpen,
  onClose,
  onComplete,
  onSkip,
  currentStep = 0,
  onStepChange
}: WalkthroughModalProps) {
  const [step, setStep] = useState(currentStep)
  const [isPlaying, setIsPlaying] = useState(false)
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const stepRef = useRef<HTMLDivElement>(null)

  const currentStepData = config.steps[step]
  const progress = ((step + 1) / config.steps.length) * 100

  useEffect(() => {
    if (onStepChange) {
      onStepChange(step)
    }
  }, [step, onStepChange])

  useEffect(() => {
    if (isOpen && currentStepData.target) {
      highlightElement(currentStepData.target)
    }
    return () => clearHighlight()
  }, [isOpen, currentStepData.target])

  const highlightElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      setHighlightedElement(element)
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const clearHighlight = () => {
    setHighlightedElement(null)
  }

  const nextStep = () => {
    if (step < config.steps.length - 1) {
      setStep(step + 1)
    } else {
      onComplete(config.id)
    }
  }

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  const skipWalkthrough = () => {
    onSkip(config.id)
  }

  const handleAction = (action: WalkthroughStep['action']) => {
    if (!action) return

    switch (action.type) {
      case 'click':
        if (action.target) {
          const element = document.querySelector(action.target) as HTMLElement
          element?.click()
        }
        break
      case 'navigate':
        if (action.url) {
          window.location.href = action.url
        }
        break
      case 'scroll':
        if (action.target) {
          const element = document.querySelector(action.target) as HTMLElement
          element?.scrollIntoView({ behavior: 'smooth' })
        }
        break
    }
  }

  const Icon = config.icon

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === overlayRef.current && onClose()}
      >
        {/* Highlight Overlay */}
        {highlightedElement && (
          <div className="absolute inset-0 pointer-events-none">
            <div 
              className="absolute border-2 border-blue-500 rounded-lg shadow-lg bg-blue-500/10"
              style={{
                top: highlightedElement.offsetTop - 8,
                left: highlightedElement.offsetLeft - 8,
                width: highlightedElement.offsetWidth + 16,
                height: highlightedElement.offsetHeight + 16,
                transition: 'all 0.3s ease'
              }}
            />
          </div>
        )}

        {/* Modal */}
        <Card className="relative max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{config.title}</h2>
                <p className="text-sm text-gray-600">{config.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={skipWalkthrough}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {step + 1} of {config.steps.length}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progress)}% complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div ref={stepRef} className="space-y-6">
              {/* Step Title */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {currentStepData.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {currentStepData.content}
                </p>
              </div>

              {/* Step Image/Video */}
              {currentStepData.image && (
                <div className="rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={currentStepData.image} 
                    alt={currentStepData.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {currentStepData.video && (
                <div className="rounded-lg overflow-hidden bg-gray-100">
                  <video 
                    src={currentStepData.video}
                    className="w-full h-48 object-cover"
                    controls
                    autoPlay={false}
                  />
                </div>
              )}

              {/* Interactive Action */}
              {currentStepData.interactive && currentStepData.action && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 mb-3">
                    Try it yourself! Click the button below to perform this action.
                  </p>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleAction(currentStepData.action)}
                  >
                    Try Action
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              {config.steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setStep(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === step ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={step === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              {step === config.steps.length - 1 ? (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onComplete(config.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Complete
                </Button>
              ) : (
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={nextStep}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}

// Hook for managing walkthroughs
export function useWalkthrough() {
  const [activeWalkthrough, setActiveWalkthrough] = useState<string | null>(null)
  const [completedWalkthroughs, setCompletedWalkthroughs] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  const startWalkthrough = (walkthroughId: string) => {
    setActiveWalkthrough(walkthroughId)
    setCurrentStep(0)
  }

  const closeWalkthrough = () => {
    setActiveWalkthrough(null)
    setCurrentStep(0)
  }

  const completeWalkthrough = (walkthroughId: string) => {
    setCompletedWalkthroughs(prev => [...prev, walkthroughId])
    setActiveWalkthrough(null)
    setCurrentStep(0)
  }

  const skipWalkthrough = (walkthroughId: string) => {
    setActiveWalkthrough(null)
    setCurrentStep(0)
  }

  const getWalkthroughConfig = (walkthroughId: string) => {
    return walkthroughConfigs.find(config => config.id === walkthroughId)
  }

  const getAvailableWalkthroughs = (role: 'admin' | 'client') => {
    return walkthroughConfigs.filter(config => 
      config.role === role && 
      !completedWalkthroughs.includes(config.id) &&
      (!config.prerequisites || config.prerequisites.every(prereq => 
        completedWalkthroughs.includes(prereq)
      ))
    )
  }

  return {
    activeWalkthrough,
    currentStep,
    completedWalkthroughs,
    startWalkthrough,
    closeWalkthrough,
    completeWalkthrough,
    skipWalkthrough,
    getWalkthroughConfig,
    getAvailableWalkthroughs
  }
}

export { walkthroughConfigs }
