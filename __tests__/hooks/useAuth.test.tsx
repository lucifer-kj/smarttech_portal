import { renderHook } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'

// Basic smoke test; deeper tests would mock Supabase client
describe('useAuth', () => {
  it('provides default unauthenticated state', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBeDefined()
  })
})


