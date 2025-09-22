'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { LogoutButton } from '@/components/auth/LogoutButton';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Briefcase, 
  FileText, 
  Star, 
  User, 
  Menu, 
  X, 
  Search, 
  Bell, 
  AlertTriangle,
  Phone,
  Calendar,
  Settings,
  HelpCircle,
  ChevronDown
} from 'lucide-react';

interface ClientLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
  isEmergency?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Home',
    href: '/client',
    icon: Home,
    description: 'Dashboard and overview'
  },
  {
    name: 'Jobs',
    href: '/client/jobs',
    icon: Briefcase,
    description: 'Track your service requests',
    badge: 3 // Example pending jobs count
  },
  {
    name: 'Quotes',
    href: '/client/quotes',
    icon: FileText,
    description: 'Review and approve quotes',
    badge: 2 // Example pending quotes count
  },
  {
    name: 'Documents',
    href: '/client/documents',
    icon: FileText,
    description: 'Access your documents'
  },
  {
    name: 'Feedback',
    href: '/client/feedback',
    icon: Star,
    description: 'Rate your service experience'
  },
  {
    name: 'Maintenance',
    href: '/client/maintenance',
    icon: Calendar,
    description: 'Schedule maintenance'
  },
  {
    name: 'Emergency',
    href: '/client/emergency',
    icon: AlertTriangle,
    description: 'Emergency service request',
    isEmergency: true
  },
  {
    name: 'Analytics',
    href: '/client/analytics',
    icon: User,
    description: 'Your service trends'
  },
  {
    name: 'Account',
    href: '/client/account',
    icon: User,
    description: 'Profile and settings'
  },
  {
    name: 'Support',
    href: '/client/support',
    icon: HelpCircle,
    description: 'Help and support'
  }
];

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([
    { id: 1, title: 'New quote available', message: 'Quote #1234 is ready for review', time: '2 min ago', unread: true },
    { id: 2, title: 'Job completed', message: 'Service job #5678 has been completed', time: '1 hour ago', unread: true },
    { id: 3, title: 'Maintenance reminder', message: 'Annual maintenance due next week', time: '2 days ago', unread: false }
  ]);

  // Check if user is client
  useEffect(() => {
    if (!isLoading && user && user.role !== 'client') {
      window.location.href = '/unauthorized';
    }
  }, [user, isLoading]);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading client portal...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'client') {
    return null;
  }

  const unreadNotifications = notifications.filter(n => n.unread).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ST</span>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">SmartTech</h1>
              <p className="text-xs text-gray-500">Client Portal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    item.isEmergency
                      ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                      : isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      item.isEmergency
                        ? 'text-red-600'
                        : isActive 
                        ? 'text-blue-700' 
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Emergency Contact */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-red-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-red-800">Emergency Hotline</p>
                <p className="text-xs text-red-600">24/7 Service</p>
              </div>
            </div>
            <Button 
              size="sm" 
              className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => window.location.href = '/client/emergency'}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Emergency
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-lg mx-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search jobs, quotes, documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Emergency Button - Always visible */}
              <Button 
                size="sm" 
                className="bg-red-600 hover:bg-red-700 text-white animate-pulse"
                onClick={() => window.location.href = '/client/emergency'}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Emergency
              </Button>

              {/* Notifications */}
              <div className="relative">
                <button 
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md relative"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                  )}
                </button>

                {/* Notifications dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            notification.unread ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                            </div>
                            {notification.unread && (
                              <div className="h-2 w-2 bg-blue-600 rounded-full mt-1"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t border-gray-200">
                      <Button size="sm" variant="outline" className="w-full">
                        View All Notifications
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-500">Client</p>
                </div>
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
