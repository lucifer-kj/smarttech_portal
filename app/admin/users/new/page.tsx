'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { z } from 'zod'
import { supabase } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.enum(['admin', 'client']),
  sm8_uuid: z.string().optional().nullable(),
})

export default function NewUserPage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'client'>('client')
  const [sm8, setSm8] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = schema.parse({ email, role, sm8_uuid: sm8 || null })

      // Create auth user via admin RPC route (assume API exists), otherwise invite
      const resp = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to create user')
      }
      setSuccess('User created. Magic link sent if configured.')
      setEmail('')
      setRole('client')
      setSm8('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Create New User</h1>
      </div>

      <Card className="p-6">
        <form className="space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as 'admin' | 'client')}
              className="block w-full border border-gray-300 rounded-md p-2 text-sm"
            >
              <option value="client">Client</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ServiceM8 UUID (optional)</label>
            <Input value={sm8} onChange={e => setSm8(e.target.value)} placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-700">{success}</div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || !email}>
              {isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}


