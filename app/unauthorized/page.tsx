'use client';

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function UnauthorizedPage() {
  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
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
          <div className="rounded-full h-16 w-16 bg-yellow-100 mx-auto mb-6 flex items-center justify-center">
            <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          
          <p className="text-gray-600 mb-6">
            You don&apos;t have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={handleGoBack}
              className="w-full"
            >
              Go Back
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
              Need help? Contact your administrator or support team.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
