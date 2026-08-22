'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'
import Link from 'next/link'

interface ApiKeyItem {
  id: string
  name: string
  keyPrefix: string
  maskedKey: string
  scope: 'read' | 'full'
  status: 'active' | 'revoked'
  requestCount: number
  successCount: number
  failCount: number
  lastUsedAt: string | null
  createdAt: string
}

interface ApiStats {
  totalKeys: number
  activeKeys: number
  totalRequests: number
  totalSuccess: number
  totalFail: number
  lastUsedAt: string | null
}

export default function UserApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [stats, setStats] = useState<ApiStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Generate Key Modal State
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [keyScope, setKeyScope] = useState<'full' | 'read'>('full')
  const [generating, setGenerating] = useState(false)

  // Newly Created Key Modal State
  const [newKeyData, setNewKeyData] = useState<{ name: string; key: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Revoke Modal State
  const [revokeModalOpen, setRevokeModalOpen] = useState(false)
  const [selectedKeyToRevoke, setSelectedKeyToRevoke] = useState<ApiKeyItem | null>(null)
  const [revoking, setRevoking] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [keysRes, statsRes] = await Promise.all([
        api.get('/user/api-keys'),
        api.get('/user/api-keys/stats'),
      ])
      if (keysRes.data.success) {
        setKeys(keysRes.data.data)
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.data)
      }
    } catch (err: any) {
      console.error('Error fetching API key data:', err)
      toast.error('Failed to load API keys and statistics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyName.trim()) {
      toast.error('Please enter an identifier name for your API key.')
      return
    }

    try {
      setGenerating(true)
      const res = await api.post('/user/api-keys/generate', {
        name: keyName.trim(),
        scope: keyScope,
      })

      if (res.data.success) {
        setGenerateModalOpen(false)
        setKeyName('')
        setNewKeyData({
          name: res.data.data.name,
          key: res.data.data.key,
        })
        fetchData()
        toast.success('API Key generated successfully!')
      }
    } catch (err: any) {
      console.error('Failed to generate key:', err)
      toast.error(err.response?.data?.message || 'Failed to generate API key.')
    } finally {
      setGenerating(false)
    }
  }

  const handleRevoke = async () => {
    if (!selectedKeyToRevoke) return
    try {
      setRevoking(true)
      const res = await api.delete(`/user/api-keys/${selectedKeyToRevoke.id}`)
      if (res.data.success) {
        toast.success('API Key revoked successfully.')
        setRevokeModalOpen(false)
        setSelectedKeyToRevoke(null)
        fetchData()
      }
    } catch (err: any) {
      console.error('Failed to revoke API key:', err)
      toast.error(err.response?.data?.message || 'Failed to revoke key.')
    } finally {
      setRevoking(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('API Key copied to clipboard!')
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-dark-bg-secondary via-dark-bg to-dark-bg-secondary border border-silver-muted/10 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-blue/10 border border-primary-blue/20 text-primary-glow text-xs font-semibold uppercase tracking-wider mb-3">
              <span className="w-2 h-2 rounded-full bg-primary-glow animate-pulse"></span>
              Developer & API Management
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Data Subscription API
            </h1>
            <p className="text-silver-muted text-sm md:text-base mt-2 max-w-2xl">
              Integrate mobile data subscriptions directly into your application or service. Generate secure credentials, track usage analytics, and review transactions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/developers"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-silver-light border border-silver-muted/15 font-medium text-sm transition-all"
            >
              <svg className="w-4 h-4 text-primary-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              View API Documentation
            </Link>
            <button
              onClick={() => setGenerateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-blue hover:shadow-glow-blue text-white font-medium text-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Generate New API Key
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary-blue/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-silver-muted text-xs md:text-sm font-medium">Active API Keys</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-primary-glow">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white mt-3">
            {stats ? stats.activeKeys : 0} <span className="text-xs text-silver-muted font-normal">/ {stats ? stats.totalKeys : 0}</span>
          </p>
          <span className="text-xs text-emerald-400 mt-1 block">Ready for requests</span>
        </div>

        <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-silver-muted text-xs md:text-sm font-medium">Total API Requests</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white mt-3">
            {stats ? Number(stats.totalRequests).toLocaleString() : 0}
          </p>
          <span className="text-xs text-silver-muted mt-1 block">Lifetime volume</span>
        </div>

        <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-silver-muted text-xs md:text-sm font-medium">Successful Requests</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-white mt-3">
            {stats ? Number(stats.totalSuccess).toLocaleString() : 0}
          </p>
          <span className="text-xs text-emerald-400 mt-1 block">
            {stats && stats.totalRequests > 0
              ? `${((stats.totalSuccess / stats.totalRequests) * 100).toFixed(1)}% Success Rate`
              : '100% Reliability'}
          </span>
        </div>

        <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-silver-muted text-xs md:text-sm font-medium">Last Request</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm md:text-base font-semibold text-white mt-3 truncate">
            {stats?.lastUsedAt ? new Date(stats.lastUsedAt).toLocaleDateString() : 'Never'}
          </p>
          <span className="text-xs text-silver-muted mt-1 block truncate">
            {stats?.lastUsedAt ? new Date(stats.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No calls yet'}
          </span>
        </div>
      </div>

      {/* API Keys Table & Section */}
      <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-silver-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Your API Credentials</h2>
            <p className="text-xs md:text-sm text-silver-muted mt-1">
              Include your secret API key in the <code className="text-primary-glow font-mono">Authorization: Bearer YOUR_API_KEY</code> header.
            </p>
          </div>

          <button
            onClick={() => setGenerateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-silver-light border border-silver-muted/15 text-xs font-semibold transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Key
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <svg className="animate-spin h-8 w-8 text-primary-glow mx-auto" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-silver-muted text-sm mt-3">Loading credentials...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-blue/10 border border-primary-blue/20 flex items-center justify-center text-primary-glow mx-auto">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">No API Keys Generated</h3>
            <p className="text-silver-muted text-sm">
              You haven't generated any API keys yet. Create one to begin integrating data subscriptions programmatically.
            </p>
            <button
              onClick={() => setGenerateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-blue text-white font-medium text-sm hover:shadow-glow-blue transition-all"
            >
              Generate Your First Key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-silver-muted/10 text-xs font-semibold uppercase text-silver-muted bg-white/[0.02]">
                  <th className="py-4 px-6">Name / Label</th>
                  <th className="py-4 px-6">Key Prefix</th>
                  <th className="py-4 px-6">Scope</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Requests</th>
                  <th className="py-4 px-6">Created / Last Used</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver-muted/10 text-sm">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{k.name}</div>
                      <div className="text-xs text-silver-muted font-mono mt-0.5">{k.maskedKey}</div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-primary-glow font-bold">
                      {k.keyPrefix}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        k.scope === 'full'
                          ? 'bg-blue-500/10 text-primary-glow border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {k.scope === 'full' ? 'Full Access' : 'Read Only'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        k.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${k.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                        {k.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-white font-medium">{Number(k.requestCount).toLocaleString()}</div>
                      <div className="text-xs text-silver-muted">
                        {k.successCount} succ • {k.failCount} fail
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-silver-muted">
                      <div>Created: {new Date(k.createdAt).toLocaleDateString()}</div>
                      <div>Used: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}</div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {k.status === 'active' ? (
                        <button
                          onClick={() => {
                            setSelectedKeyToRevoke(k)
                            setRevokeModalOpen(true)
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition-all"
                        >
                          Revoke
                        </button>
                      ) : (
                        <span className="text-xs text-silver-muted italic">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Integration Guide / Code Block */}
      <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Quick Integration Preview</h2>
            <p className="text-xs md:text-sm text-silver-muted mt-1">
              Test your endpoint connection using cURL or your favourite programming language.
            </p>
          </div>
          <Link
            href="/developers"
            className="inline-flex items-center gap-2 text-primary-glow hover:underline text-xs font-semibold"
          >
            Open Interactive Docs &rarr;
          </Link>
        </div>

        <div className="bg-dark-bg border border-silver-muted/10 rounded-xl p-4 md:p-5 overflow-x-auto font-mono text-xs md:text-sm text-silver-light relative">
          <pre className="text-emerald-400">
{`# 1. Fetch available data plans
curl -X GET "https://abdatahub.com/api/v1/data/plans" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# 2. Purchase a data bundle programmatically
curl -X POST "https://abdatahub.com/api/v1/data/purchase" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: your-unique-order-uuid" \\
  -d '{
    "network": "mtn",
    "plan_id": "1",
    "phone": "08012345678"
  }'`}
          </pre>
        </div>
      </div>

      {/* MODAL: Generate API Key */}
      {generateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-bg-secondary border border-silver-muted/15 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold text-white">Generate API Key</h3>
            <p className="text-xs text-silver-muted mt-1.5">
              Choose a descriptive identifier so you can recognize which system is using this key.
            </p>

            <form onSubmit={handleGenerate} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider mb-2">
                  Key Name / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Production Mobile App, POS Backend"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="w-full bg-dark-bg border border-silver-muted/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-primary-glow"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider mb-2">
                  Access Scope
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setKeyScope('full')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      keyScope === 'full'
                        ? 'bg-primary-blue/10 border-primary-glow text-white'
                        : 'bg-dark-bg border-silver-muted/15 text-silver-muted hover:border-silver-muted/30'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">Full Access</div>
                    <div className="text-[11px] text-silver-muted mt-0.5">Purchases + Read</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setKeyScope('read')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      keyScope === 'read'
                        ? 'bg-primary-blue/10 border-primary-glow text-white'
                        : 'bg-dark-bg border-silver-muted/15 text-silver-muted hover:border-silver-muted/30'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">Read Only</div>
                    <div className="text-[11px] text-silver-muted mt-0.5">Plans & Networks</div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-silver-muted/10">
                <button
                  type="button"
                  onClick={() => setGenerateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-silver-light text-sm font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-blue hover:shadow-glow-blue text-white text-sm font-medium transition-all disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Create Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Newly Created Key Display */}
      {newKeyData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-dark-bg-secondary border border-emerald-500/30 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Save Your API Key</h3>
                <p className="text-xs text-emerald-400 font-medium">Key Generated: {newKeyData.name}</p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-200">
              <span className="font-bold">⚠️ Warning:</span> This is the <span className="underline">only time</span> your full API key will be displayed. Store it in a secure environment variable. If you lose it, you must generate a new key.
            </div>

            <div>
              <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider mb-2">
                Secret API Key
              </label>
              <div className="flex items-center gap-2 bg-dark-bg border border-silver-muted/20 rounded-xl p-3">
                <span className="font-mono text-xs text-primary-glow select-all break-all flex-1">
                  {newKeyData.key}
                </span>
                <button
                  onClick={() => copyToClipboard(newKeyData.key)}
                  className="px-3 py-1.5 rounded-lg bg-primary-blue text-white text-xs font-semibold hover:bg-primary-glow transition-all shrink-0"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setNewKeyData(null)}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all"
              >
                I have saved my API Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Revoke Confirmation */}
      {revokeModalOpen && selectedKeyToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-bg-secondary border border-rose-500/30 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Revoke API Key</h3>
            <p className="text-sm text-silver-muted">
              Are you sure you want to revoke <strong className="text-white font-semibold">"{selectedKeyToRevoke.name}"</strong>? Any application or integration using this key will immediately be denied access.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-silver-muted/10">
              <button
                onClick={() => {
                  setRevokeModalOpen(false)
                  setSelectedKeyToRevoke(null)
                }}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-silver-light text-sm font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium transition-all disabled:opacity-50"
              >
                {revoking ? 'Revoking...' : 'Yes, Revoke Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
