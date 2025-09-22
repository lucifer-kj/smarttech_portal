'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordChangeForm } from '@/components/auth/PasswordChangeForm'
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences'
import { AlertTriangle, Check, Key, Link2, Server, User } from 'lucide-react'

type TabKey = 'profile' | 'security' | 'integrations'

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [testingSm8, setTestingSm8] = useState(false)
  const [sm8TestResult, setSm8TestResult] = useState<null | { ok: boolean; message: string }>(null)

  const maskedEnv = useMemo(() => {
    const mask = (val?: string) => (val ? `${val.slice(0, 4)}••••${val.slice(-2)}` : 'Not set')
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set (public)',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: mask(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SERVICEM8_API_KEY: mask(process.env.SERVICEM8_API_KEY),
      SERVICEM8_CLIENT_ID: mask(process.env.SERVICEM8_CLIENT_ID),
      WEBHOOK_SECRET: mask(process.env.WEBHOOK_SECRET),
      VAPID_PUBLIC_KEY: mask(process.env.VAPID_PUBLIC_KEY),
    }
  }, [])

  const onTestServiceM8 = useCallback(async () => {
    setTestingSm8(true)
    setSm8TestResult(null)
    try {
      const res = await fetch('/api/servicem8/test-connection', { method: 'POST' })
      const data = await res.json()
      setSm8TestResult({ ok: res.ok, message: data?.message || (res.ok ? 'Connected' : 'Failed') })
    } catch (err) {
      setSm8TestResult({ ok: false, message: 'Request failed' })
    } finally {
      setTestingSm8(false)
    }
  }, [])

  useEffect(() => {
    // Ensure only admins use this page; AdminLayout should guard already
  }, [])

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your admin account and integrations.</p>
        </div>
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <Button variant={activeTab === 'profile' ? 'default' : 'outline'} onClick={() => setActiveTab('profile')}>
            <User className="h-4 w-4 mr-2" /> Profile
          </Button>
          <Button variant={activeTab === 'security' ? 'default' : 'outline'} onClick={() => setActiveTab('security')} className="ml-2">
            <Key className="h-4 w-4 mr-2" /> Security
          </Button>
          <Button variant={activeTab === 'integrations' ? 'default' : 'outline'} onClick={() => setActiveTab('integrations')} className="ml-2">
            <Server className="h-4 w-4 mr-2" /> Integrations
          </Button>
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Profile details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <Input value={user?.email || ''} readOnly className="mt-1" />
              </div>
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                Profile is synced from Supabase. Display-only for admins.
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Notifications</h2>
            <NotificationPreferences />
          </Card>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Change password</h2>
            <PasswordChangeForm />
          </Card>
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Security notes</h2>
            <div className="flex items-start text-sm text-gray-700">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
              Use strong passwords and enable email security for your account.
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-1">API settings</h2>
            <p className="text-sm text-gray-500 mb-4">Environment variables (masked in UI).</p>
            <div className="space-y-3 text-sm">
              {Object.entries(maskedEnv).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-gray-600">{k}</span>
                  <span className="font-mono text-gray-900">{v}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-gray-900">ServiceM8</h2>
              <Button onClick={onTestServiceM8} disabled={testingSm8} variant="outline">
                <Link2 className="h-4 w-4 mr-2" />
                {testingSm8 ? 'Testing…' : 'Test connection'}
              </Button>
            </div>
            {sm8TestResult && (
              <div className={`mt-2 inline-flex items-center rounded-md px-2 py-1 text-xs ${sm8TestResult.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {sm8TestResult.ok ? <Check className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                {sm8TestResult.message}
              </div>
            )}
            <p className="text-sm text-gray-600 mt-4">
              Uses credentials from environment; no keys are stored in the database.
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}


