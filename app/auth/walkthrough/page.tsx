'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useAuthStore } from '@/lib/stores/auth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface WalkthroughStep {
  title: string
  description: string
  image?: string
  action?: string
}

const walkthroughSteps: WalkthroughStep[] = [
  {
    title: "Welcome to SmartTech Portal!",
    description: "This portal gives you complete visibility into your service requests, quotes, and maintenance schedules.",
    action: "Let's get started!"
  },
  {
    title: "Track Your Jobs",
    description: "View all your service requests in real-time. See when technicians are scheduled, track progress, and get updates.",
    action: "Next"
  },
  {
    title: "Manage Quotes",
    description: "Review and approve quotes directly from the portal. See detailed breakdowns of costs and materials.",
    action: "Next"
  },
  {
    title: "Submit Feedback",
    description: "Rate your service experience and provide feedback. Help us improve our service quality.",
    action: "Next"
  },
  {
    title: "Access Documents",
    description: "Download invoices, warranties, certificates, and other important documents securely.",
    action: "Next"
  },
  {
    title: "Emergency Services",
    description: "Request emergency services 24/7 and track response times in real-time.",
    action: "Get Started!"
  }
]

export default function WalkthroughPage() {
  const router = useRouter()
  const { user, updateUser } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)

  const handleNext = () => {
    if (currentStep < walkthroughSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = async () => {
    if (!user) return

    setIsCompleting(true)

    try {
      // Update user's first_login_complete status
      const { error } = await (supabase as SupabaseClient)
        .from('users')
        .update({ first_login_complete: true })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating user:', error)
        // Continue anyway - don't block the user
      }

      // Update local state
      updateUser({ first_login_complete: true })

      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/client')
      }
    } catch (error) {
      console.error('Error completing walkthrough:', error)
      // Redirect anyway
      if (user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/client')
      }
    }
  }

  // If user is not authenticated or already completed walkthrough, redirect
  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (user.first_login_complete) {
      if (user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/client')
      }
    }
  }, [user, router])

  if (!user || user.first_login_complete) {
    return null
  }

  const step = walkthroughSteps[currentStep]
  const isLastStep = currentStep === walkthroughSteps.length - 1

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 max-w-2xl w-full mx-4">
        <div className="text-center">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-center space-x-2 mb-4">
              {walkthroughSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500">
              Step {currentStep + 1} of {walkthroughSteps.length}
            </p>
          </div>

          {/* Step content */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {step.title}
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              {step.description}
            </p>

            {/* Placeholder for future images */}
            {step.image && (
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center mb-6">
                <p className="text-gray-500">Image placeholder</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-center space-x-4">
            {!isLastStep && (
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isCompleting}
              >
                Skip Tour
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={isCompleting}
              className="min-w-[120px]"
            >
              {isCompleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </>
              ) : (
                step.action || 'Next'
              )}
            </Button>
          </div>

          {/* Additional info */}
          <div className="mt-8 text-sm text-gray-500">
            <p>
              You can always access help and tutorials from the help menu in your dashboard.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
