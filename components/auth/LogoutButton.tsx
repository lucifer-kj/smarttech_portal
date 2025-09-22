'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/Button'

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
  children?: React.ReactNode
}

export function LogoutButton({ 
  variant = 'outline', 
  className = '',
  children = 'Sign Out'
}: LogoutButtonProps) {
  const router = useRouter()
  const { logout } = useAuthStore()

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut()
      
      // Clear local state
      logout()
      
      // Redirect to login
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear local state and redirect
      logout()
      router.push('/auth/login')
    }
  }

  return (
    <Button
      variant={variant}
      onClick={handleLogout}
      className={className}
    >
      {children}
    </Button>
  )
}
