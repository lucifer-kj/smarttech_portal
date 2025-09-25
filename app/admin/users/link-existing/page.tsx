'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Sm8Company = { uuid: string; name: string; email?: string }
type ListedUser = { sm8_uuid: string | null }

export default function LinkExistingSm8Page() {
  const [companies, setCompanies] = useState<Sm8Company[]>([])
  const [linked, setLinked] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const sm8Resp = await fetch('/api/servicem8/clients')
        const sm8Json = await sm8Resp.json()

        const usersResp = await fetch('/api/admin/users?role=client&status=all&page=1&search=')
        const usersJson = await usersResp.json()

        const linkedSet = new Set<string>(
          ((usersJson?.data?.users as ListedUser[]) || [])
            .map((u) => u.sm8_uuid || '')
            .filter((v): v is string => Boolean(v))
        )

        const list: Sm8Company[] = Array.isArray(sm8Json?.data)
          ? sm8Json.data.map((c: unknown) => {
              const co = c as { uuid?: string; name?: string; email?: string }
              return { uuid: co.uuid || '', name: co.name || '', email: co.email }
            }).filter((c: Sm8Company) => !!c.uuid && !!c.name)
          : []

        setCompanies(list)
        setLinked(linkedSet)
      } catch {
        setErr('Failed to load ServiceM8 companies')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return companies
      .filter(c => !linked.has(c.uuid))
      .filter(c => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
      .slice(0, 200)
  }, [companies, linked, search])

  const addUser = async (company: Sm8Company) => {
    setErr(null); setMsg(null)
    try {
      if (!company.email) throw new Error('Company has no email in ServiceM8')

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: company.email,
          role: 'client',
          sm8_uuid: company.uuid
        })
      })
      if (!res.ok && res.status !== 409) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Failed to create user')
      }

      const ml = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: company.email, appRedirect: '/client' })
      })
      if (!ml.ok) throw new Error('Failed to send magic link')

      setMsg(`User added for ${company.name}. Magic link sent.`)
      setLinked(prev => new Set([...prev, company.uuid]))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to add user')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Link Existing ServiceM8 Client</h1>
      </div>

      <Card className="p-6 space-y-4">
        <Input placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} />
        {err && <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">{err}</div>}
        {msg && <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-700">{msg}</div>}

        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-gray-500">No unlinked companies found.</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <div key={c.uuid} className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.email || 'No email'}</div>
                </div>
                <Button onClick={() => addUser(c)} disabled={!c.email}>Add User</Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}


