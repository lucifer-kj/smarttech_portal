'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { LogoutButton } from '@/components/auth/LogoutButton';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  HelpCircle
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

// Mobile bottom navigation items (priority items)
const mobileNavigationItems = navigationItems.slice(0, 5);

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
    <div className="min-h-screen bg-surface-50 safe-top safe-bottom">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.div 
        initial={{ x: -256 }}
        animate={{ x: 0 }}
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:w-64 lg:bg-white lg:shadow-lg lg:border-r lg:border-border"
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ST</span>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-surface-900">SmartTech</h1>
              <p className="text-xs text-surface-500">Client Portal</p>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigationItems.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      item.isEmergency
                        ? 'bg-emergency-50 text-emergency-700 hover:bg-emergency-100 border border-emergency-200 animate-pulse-fast'
                        : isActive
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700 shadow-sm'
                        : 'text-surface-700 hover:bg-surface-50 hover:text-surface-900 hover:shadow-sm'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 transition-colors duration-200 ${
                        item.isEmergency
                          ? 'text-emergency-600'
                          : isActive 
                          ? 'text-primary-700' 
                          : 'text-surface-400 group-hover:text-surface-600'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-800 animate-bounce">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-surface-500 mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </nav>

        {/* Emergency Contact */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emergency-50 border border-emergency-200 rounded-lg p-3"
          >
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-emergency-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-emergency-800">Emergency Hotline</p>
                <p className="text-xs text-emergency-600">24/7 Service</p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="emergency"
              className="w-full mt-2"
              onClick={() => window.location.href = '/client/emergency'}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Emergency
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-border lg:hidden"
          >
            <div className="flex items-center justify-between h-16 px-6 border-b border-border">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">ST</span>
                  </div>
                </div>
                <div className="ml-3">
                  <h1 className="text-lg font-semibold text-surface-900">SmartTech</h1>
                  <p className="text-xs text-surface-500">Client Portal</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="mt-6 px-3">
              <div className="space-y-1">
                {navigationItems.map((item, index) => {
                  const isActive = pathname === item.href;
                  return (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                          item.isEmergency
                            ? 'bg-emergency-50 text-emergency-700 hover:bg-emergency-100 border border-emergency-200'
                            : isActive
                            ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                            : 'text-surface-700 hover:bg-surface-50 hover:text-surface-900'
                        }`}
                      >
                        <item.icon
                          className={`mr-3 h-5 w-5 ${
                            item.isEmergency
                              ? 'text-emergency-600'
                              : isActive 
                              ? 'text-primary-700' 
                              : 'text-surface-400 group-hover:text-surface-600'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span>{item.name}</span>
                            {item.badge && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-800">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-surface-500 mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <motion.div 
          initial={{ y: -64 }}
          animate={{ y: 0 }}
          className="sticky top-0 z-40 bg-white/80 backdrop-blur-md shadow-sm border-b border-border"
        >
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors touch-target"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-lg mx-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-surface-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search jobs, quotes, documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-border rounded-md leading-5 bg-white placeholder-surface-500 focus:outline-none focus:placeholder-surface-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all duration-200"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Emergency Button - Always visible */}
              <Button 
                size="sm" 
                variant="emergency"
                className="hidden sm:flex"
                onClick={() => window.location.href = '/client/emergency'}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Emergency
              </Button>

              {/* Mobile Emergency Button */}
              <Button 
                size="icon-sm" 
                variant="emergency"
                className="sm:hidden touch-target"
                onClick={() => window.location.href = '/client/emergency'}
              >
                <AlertTriangle className="h-4 w-4" />
              </Button>

              {/* Notifications */}
              <div className="relative">
                <button 
                  className="p-2 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded-md relative transition-colors touch-target"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 h-2 w-2 bg-danger-500 rounded-full animate-pulse"></span>
                  )}
                </button>

                {/* Notifications dropdown */}
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-border z-50"
                    >
                      <div className="p-4 border-b border-border">
                        <h3 className="text-sm font-medium text-surface-900">Notifications</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.map((notification, index) => (
                          <motion.div 
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-4 border-b border-border hover:bg-surface-50 cursor-pointer transition-colors ${
                              notification.unread ? 'bg-primary-50' : ''
                            }`}
                          >
                            <div className="flex items-start">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-surface-900">{notification.title}</p>
                                <p className="text-sm text-surface-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-surface-500 mt-1">{notification.time}</p>
                              </div>
                              {notification.unread && (
                                <div className="h-2 w-2 bg-primary-600 rounded-full mt-1"></div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      <div className="p-3 border-t border-border">
                        <Button size="sm" variant="outline" className="w-full">
                          View All Notifications
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User menu */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-surface-900">{user.email}</p>
                  <p className="text-xs text-surface-500">Client</p>
                </div>
                <LogoutButton />
              </div>

              {/* Mobile user menu */}
              <div className="sm:hidden">
                <LogoutButton />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Page content */}
        <main className="flex-1">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="py-6"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </motion.div>
        </main>

        {/* Mobile Bottom Navigation */}
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-border sm:hidden safe-bottom"
        >
          <div className="flex items-center justify-around py-2">
            {mobileNavigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 touch-target ${
                    item.isEmergency
                      ? 'text-emergency-600'
                      : isActive
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-surface-500 hover:text-surface-700 hover:bg-surface-50'
                  }`}
                >
                  <div className="relative">
                    <item.icon className="h-5 w-5" />
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium mt-1">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
