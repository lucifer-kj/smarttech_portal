'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { z } from 'zod'
// import { supabase } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('Enter a valid email').optional(),
  role: z.enum(['admin', 'client']),
  sm8_uuid: z.string().optional().nullable(),
  companyName: z.string().min(1, 'Company name is required'),
  companyEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export default function NewUserPage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'client'>('client')
  const [sm8, setSm8] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = schema.parse({ 
        email, role, sm8_uuid: sm8 || null,
        companyName, companyEmail, phone, address, notes,
      })

      // Preferred email for the portal user
      const userEmail = payload.email || payload.companyEmail
      if (!userEmail) throw new Error('A valid email is required to create and invite the user')

      // 1) Create portal user first (ensures RLS + magic link even if SM8 fails)
      let createdUser: { id: string } | null = null
      let userCreate409 = false
      const resp = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, role: payload.role, sm8_uuid: null }),
      })
      if (!resp.ok) {
        if (resp.status === 409) {
          userCreate409 = true
        } else {
          const j = await resp.json().catch(() => ({}))
          throw new Error(j.error || 'Failed to create user')
        }
      } else {
        const j = await resp.json().catch(() => ({}))
        createdUser = j?.data || null
      }

      // 2) Try to create ServiceM8 client (non-blocking)
      let newSm8Uuid: string | null = null
      try {
        const createSm8 = await fetch('/api/servicem8/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: payload.companyName,
            email: userEmail,
            phone: payload.phone,
            address: payload.address,
            notes: payload.notes,
          }),
        })
        if (createSm8.ok) {
          const sm8Resp = await createSm8.json()
          newSm8Uuid = sm8Resp?.data?.uuid || null
        }
      } catch {
        // ignore; we'll proceed without SM8 link
      }

      // 3) If we have an sm8 uuid and a user, update the user record
      if (newSm8Uuid) {
        // If user was 409, try to fetch existing user id
        if (!createdUser) {
          const q = new URLSearchParams({ page: '1', search: userEmail, role: 'all', status: 'all' })
          const u = await fetch(`/api/admin/users?${q.toString()}`)
          const uj = await u.json().catch(() => ({}))
          const existing = Array.isArray(uj?.data?.users) ? uj.data.users.find((u: { email: string }) => u.email === userEmail) : null
          if (existing) {
            createdUser = { id: existing.id }
          }
        }

        if (createdUser?.id) {
          await fetch(`/api/admin/users/${createdUser.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update', sm8_uuid: newSm8Uuid })
          }).catch(() => {})
        }
      }

      // 4) Send magic link
      const ml = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, appRedirect: role === 'admin' ? '/admin' : '/client' }),
      })
      if (!ml.ok) {
        const j = await ml.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to send magic link')
      }

      setSuccess(userCreate409
        ? 'User already existed. Magic link sent. ServiceM8 link applied if available.'
        : 'User created. Magic link sent. ServiceM8 client created if available.'
      )
      setEmail('')
      setRole('client')
      setSm8('')
      setCompanyName('')
      setCompanyEmail('')
      setPhone('')
      setAddress('')
      setNotes('')
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Portal Login Email (optional)</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="If different from company email" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Email</label>
              <Input type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <Input value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
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
            <Button type="submit" disabled={isLoading || (!email && !companyEmail)}>
              {isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}


