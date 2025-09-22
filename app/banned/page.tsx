'use client';

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function BannedPage() {
  const handleContactSupport = () => {
    if (typeof window !== 'undefined') {
      window.location.href = 'mailto:support@smarttech.com';
    }
  };

  const handleReturnHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="rounded-full h-16 w-16 bg-red-100 mx-auto mb-6 flex items-center justify-center">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Account Suspended
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your account has been suspended. Please contact support for assistance.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleContactSupport}
              className="w-full"
            >
              Contact Support
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleReturnHome}
              className="w-full"
            >
              Return Home
            </Button>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>
              If you believe this is an error, please contact our support team immediately.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
