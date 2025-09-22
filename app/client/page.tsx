'use client'

import { useAuth } from '@/hooks/useAuth'
import ClientLayout from '@/components/client/ClientLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import {
  Briefcase, 
  FileText, 
  Star, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Phone,
  MessageCircle
} from 'lucide-react'

export default function ClientDashboard() {
  const { user } = useAuth()

  // Mock data - will be replaced with real data from API
  const dashboardData = {
    upcomingJobs: [
      { id: 1, title: 'HVAC Maintenance', date: '2024-01-15', time: '10:00 AM', status: 'scheduled' },
      { id: 2, title: 'Electrical Inspection', date: '2024-01-18', time: '2:00 PM', status: 'confirmed' }
    ],
    pendingQuotes: [
      { id: 1, title: 'Kitchen Renovation', amount: 15000, status: 'pending' },
      { id: 2, title: 'Bathroom Upgrade', amount: 8500, status: 'pending' }
    ],
    recentJobs: [
      { id: 1, title: 'Plumbing Repair', date: '2024-01-10', status: 'completed', rating: 5 },
      { id: 2, title: 'AC Service', date: '2024-01-08', status: 'completed', rating: 4 }
    ],
    stats: {
      totalJobs: 12,
      completedJobs: 10,
      pendingQuotes: 2,
      averageRating: 4.8
    }
  }

  return (
    <ClientLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {user?.email?.split('@')[0]}!</h1>
              <p className="text-blue-100 mt-1">Here&apos;s what&apos;s happening with your services</p>
            </div>
            <div className="hidden sm:block">
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => window.location.href = '/client/emergency'}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Emergency Service
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalJobs}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.completedJobs}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Quotes</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.pendingQuotes}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.averageRating}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Jobs */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Jobs</h2>
              <Link href="/client/jobs">
                <Button size="sm" variant="outline">View All</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {dashboardData.upcomingJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-600">{job.date} at {job.time}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    job.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
              ))}
              {dashboardData.upcomingJobs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No upcoming jobs scheduled</p>
                </div>
              )}
            </div>
          </Card>

          {/* Pending Quotes */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Pending Quotes</h2>
              <Link href="/client/quotes">
                <Button size="sm" variant="outline">View All</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {dashboardData.pendingQuotes.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                      <FileText className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{quote.title}</p>
                      <p className="text-sm text-gray-600">${quote.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Review
                  </Button>
                </div>
              ))}
              {dashboardData.pendingQuotes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No pending quotes</p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Jobs */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
              <Link href="/client/jobs">
                <Button size="sm" variant="outline">View All</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {dashboardData.recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-600">{job.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center mr-3">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${
                            i < job.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <Button size="sm" variant="outline">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Feedback
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/client/jobs">
                <Button className="w-full justify-start" variant="outline">
                  <Briefcase className="h-4 w-4 mr-2" />
                  View Jobs
                </Button>
              </Link>
              <Link href="/client/quotes">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Review Quotes
                </Button>
              </Link>
              <Link href="/client/feedback">
                <Button className="w-full justify-start" variant="outline">
                  <Star className="h-4 w-4 mr-2" />
                  Submit Feedback
                </Button>
              </Link>
              <Link href="/client/maintenance">
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Service
                </Button>
              </Link>
            </div>
            
            {/* Emergency Section */}
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center mb-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <h3 className="font-medium text-red-800">Emergency Service</h3>
              </div>
              <p className="text-sm text-red-700 mb-3">Need immediate assistance? We&apos;re available 24/7 for emergencies.</p>
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => window.location.href = '/client/emergency'}
                >
                  <Phone className="h-4 w-4 mr-1" />
                  Call Now
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => window.location.href = '/client/emergency'}
                >
                  Request Service
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ClientLayout>
  )
}
