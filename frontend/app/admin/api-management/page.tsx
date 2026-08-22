'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface AdminApiKey {
  id: string
  userId: string
  userName: string | null
  userEmail: string | null
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

interface ApiLogItem {
  id: string
  endpoint: string
  method: string
  statusCode: number
  responseTimeMs: number
  errorCode: string | null
  userId: string
  apiKeyName: string | null
  apiKeyPrefix: string | null
  createdAt: string
}

interface AdminApiStats {
  totalRequests: number
  successRequests: number
  failedRequests: number
  errorRate: string
  todayRequests: number
  weekRequests: number
  monthRequests: number
  avgResponseTimeMs: string
  activeApiUsers: number
}

export default function AdminApiManagementPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'logs'>('overview')
  const [stats, setStats] = useState<AdminApiStats | null>(null)
  const [keys, setKeys] = useState<AdminApiKey[]>([])
  const [logs, setLogs] = useState<ApiLogItem[]>([])
  const [loading, setLoading] = useState(true)

  // Filtering for Keys
  const [keySearch, setKeySearch] = useState('')

  // Filtering for Logs
  const [logPage, setLogPage] = useState(1)
  const [logTotalPages, setLogTotalPages] = useState(1)
  const [logFilterStatus, setLogFilterStatus] = useState<string>('')

  // Revoke state
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const fetchOverview = async () => {
    try {
      const [statsRes, keysRes] = await Promise.all([
        api.get('/admin/api-stats'),
        api.get('/admin/api-keys'),
      ])
      if (statsRes.data.success) setStats(statsRes.data.data)
      if (keysRes.data.success) setKeys(keysRes.data.data)
    } catch (err: any) {
      console.error('Error fetching admin API stats:', err)
      toast.error('Failed to load API overview data.')
    }
  }

  const fetchLogs = async (page = 1) => {
    try {
      const res = await api.get(`/admin/api-logs?page=${page}&limit=25`)
      if (res.data.success) {
        setLogs(res.data.data)
        setLogPage(res.data.pagination.page)
        setLogTotalPages(res.data.pagination.totalPages)
      }
    } catch (err: any) {
      console.error('Error fetching API logs:', err)
    }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchOverview(), fetchLogs(1)]).finally(() => setLoading(false))
  }, [])

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? The client will immediately be cut off.')) {
      return
    }

    try {
      setRevokingId(keyId)
      const res = await api.post(`/admin/api-keys/${keyId}/revoke`)
      if (res.data.success) {
        toast.success('API Key revoked.')
        fetchOverview()
      }
    } catch (err: any) {
      console.error('Failed to revoke key:', err)
      toast.error(err.response?.data?.message || 'Failed to revoke key.')
    } finally {
      setRevokingId(null)
    }
  }

  const filteredKeys = keys.filter(k => {
    const term = keySearch.toLowerCase()
    return (
      k.name.toLowerCase().includes(term) ||
      (k.userName && k.userName.toLowerCase().includes(term)) ||
      (k.userEmail && k.userEmail.toLowerCase().includes(term)) ||
      k.keyPrefix.toLowerCase().includes(term)
    )
  })

  const filteredLogs = logs.filter(l => {
    if (!logFilterStatus) return true
    if (logFilterStatus === '2xx') return l.statusCode >= 200 && l.statusCode < 300
    if (logFilterStatus === '4xx') return l.statusCode >= 400 && l.statusCode < 500
    if (logFilterStatus === '5xx') return l.statusCode >= 500
    return true
  })

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-blue/10 border border-primary-blue/20 text-primary-glow text-xs font-semibold uppercase tracking-wider mb-2">
            Platform Infrastructure
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            API & Developer Management
          </h1>
          <p className="text-silver-muted text-sm mt-1">
            Monitor API traffic, view generated developer credentials, inspect request logs, and manage developer access.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-dark-bg-secondary border border-silver-muted/15 rounded-2xl p-1.5 self-start">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-blue text-white shadow-glow-blue'
                : 'text-silver-muted hover:text-white'
            }`}
          >
            Overview & Stats
          </button>
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'keys'
                ? 'bg-gradient-blue text-white shadow-glow-blue'
                : 'text-silver-muted hover:text-white'
            }`}
          >
            API Keys ({keys.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'logs'
                ? 'bg-gradient-blue text-white shadow-glow-blue'
                : 'text-silver-muted hover:text-white'
            }`}
          >
            Request Logs
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-5">
              <span className="text-silver-muted text-xs font-medium uppercase tracking-wider">Total Requests</span>
              <p className="text-2xl md:text-3xl font-bold text-white mt-2">
                {stats ? Number(stats.totalRequests).toLocaleString() : 0}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-silver-muted">
                <span>Today: <strong className="text-white font-semibold">{stats ? stats.todayRequests : 0}</strong></span>
                <span>•</span>
                <span>Week: <strong className="text-white font-semibold">{stats ? stats.weekRequests : 0}</strong></span>
              </div>
            </div>

            <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-5">
              <span className="text-silver-muted text-xs font-medium uppercase tracking-wider">Active API Users</span>
              <p className="text-2xl md:text-3xl font-bold text-primary-glow mt-2">
                {stats ? stats.activeApiUsers : 0}
              </p>
              <span className="text-xs text-silver-muted mt-2 block">
                {keys.filter(k => k.status === 'active').length} total active keys
              </span>
            </div>

            <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-5">
              <span className="text-silver-muted text-xs font-medium uppercase tracking-wider">Error Rate</span>
              <p className={`text-2xl md:text-3xl font-bold mt-2 ${
                stats && parseFloat(stats.errorRate) > 5 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {stats ? `${stats.errorRate}%` : '0.0%'}
              </p>
              <span className="text-xs text-silver-muted mt-2 block">
                {stats ? stats.failedRequests : 0} failed / {stats ? stats.successRequests : 0} success
              </span>
            </div>

            <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-5">
              <span className="text-silver-muted text-xs font-medium uppercase tracking-wider">Avg Latency</span>
              <p className="text-2xl md:text-3xl font-bold text-amber-400 mt-2">
                {stats ? `${stats.avgResponseTimeMs}ms` : '0ms'}
              </p>
              <span className="text-xs text-emerald-400 mt-2 block">Provider processing included</span>
            </div>
          </div>

          {/* Quick Summary Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4">Traffic Breakdown by Period</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-dark-bg rounded-xl border border-silver-muted/10">
                  <span className="text-sm text-silver-muted">Today (24h)</span>
                  <span className="text-sm font-bold text-white">{stats ? Number(stats.todayRequests).toLocaleString() : 0} reqs</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-bg rounded-xl border border-silver-muted/10">
                  <span className="text-sm text-silver-muted">Past 7 Days</span>
                  <span className="text-sm font-bold text-white">{stats ? Number(stats.weekRequests).toLocaleString() : 0} reqs</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-bg rounded-xl border border-silver-muted/10">
                  <span className="text-sm text-silver-muted">This Month</span>
                  <span className="text-sm font-bold text-white">{stats ? Number(stats.monthRequests).toLocaleString() : 0} reqs</span>
                </div>
              </div>
            </div>

            <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4">API Platform Health</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-dark-bg rounded-xl border border-silver-muted/10">
                  <span className="text-sm text-silver-muted">Public API Base URL</span>
                  <code className="text-xs text-primary-glow font-mono bg-primary-blue/10 px-2 py-1 rounded">/api/v1</code>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-bg rounded-xl border border-silver-muted/10">
                  <span className="text-sm text-silver-muted">Authentication Scheme</span>
                  <span className="text-xs font-semibold text-emerald-400">Bearer API Key</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-dark-bg rounded-xl border border-silver-muted/10">
                  <span className="text-sm text-silver-muted">Idempotency Protection</span>
                  <span className="text-xs font-semibold text-emerald-400">Active (24h TTL)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KEYS TAB */}
      {activeTab === 'keys' && (
        <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl overflow-hidden space-y-4">
          <div className="p-6 border-b border-silver-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">All Platform API Keys</h2>
              <p className="text-xs text-silver-muted mt-1">Manage and audit developer credentials across all user accounts.</p>
            </div>

            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search user, email, key prefix..."
                value={keySearch}
                onChange={(e) => setKeySearch(e.target.value)}
                className="w-full bg-dark-bg border border-silver-muted/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-silver-muted/50 focus:outline-none focus:border-primary-glow"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-silver-muted/10 text-xs font-semibold uppercase text-silver-muted bg-white/[0.02]">
                  <th className="py-4 px-6">User / Account</th>
                  <th className="py-4 px-6">Key Identifier</th>
                  <th className="py-4 px-6">Prefix</th>
                  <th className="py-4 px-6">Scope</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Requests</th>
                  <th className="py-4 px-6">Created / Used</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver-muted/10 text-sm">
                {filteredKeys.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-silver-muted text-xs">
                      No API keys match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredKeys.map((k) => (
                    <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{k.userName || 'Unnamed User'}</div>
                        <div className="text-xs text-silver-muted">{k.userEmail}</div>
                      </td>
                      <td className="py-4 px-6 font-medium text-white">
                        {k.name}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-primary-glow font-bold">
                        {k.keyPrefix}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          k.scope === 'full'
                            ? 'bg-blue-500/10 text-primary-glow border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {k.scope.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          k.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {k.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs">
                        <div className="font-bold text-white">{Number(k.requestCount).toLocaleString()}</div>
                        <div className="text-silver-muted">{k.successCount} succ • {k.failCount} fail</div>
                      </td>
                      <td className="py-4 px-6 text-xs text-silver-muted">
                        <div>Created: {new Date(k.createdAt).toLocaleDateString()}</div>
                        <div>Used: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}</div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {k.status === 'active' ? (
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            disabled={revokingId === k.id}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition-all disabled:opacity-50"
                          >
                            {revokingId === k.id ? 'Revoking...' : 'Revoke'}
                          </button>
                        ) : (
                          <span className="text-xs text-silver-muted italic">Revoked</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="bg-dark-bg-secondary border border-silver-muted/10 rounded-2xl overflow-hidden space-y-4">
          <div className="p-6 border-b border-silver-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Live API Request Logs</h2>
              <p className="text-xs text-silver-muted mt-1">Audit incoming API calls with response times and HTTP status codes.</p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={logFilterStatus}
                onChange={(e) => setLogFilterStatus(e.target.value)}
                className="bg-dark-bg border border-silver-muted/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary-glow"
              >
                <option value="">All Status Codes</option>
                <option value="2xx">2xx (Success)</option>
                <option value="4xx">4xx (Client Errors)</option>
                <option value="5xx">5xx (Server Errors)</option>
              </select>

              <button
                onClick={() => fetchLogs(logPage)}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-silver-light border border-silver-muted/15 text-xs font-medium transition-all"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-silver-muted/10 text-xs font-semibold uppercase text-silver-muted bg-white/[0.02]">
                  <th className="py-4 px-6">Method / Endpoint</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Latency</th>
                  <th className="py-4 px-6">API Key</th>
                  <th className="py-4 px-6">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-silver-muted/10 text-sm font-mono">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-silver-muted text-xs font-sans">
                      No API request logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            l.method === 'POST' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-primary-glow'
                          }`}>
                            {l.method}
                          </span>
                          <span className="text-white text-xs">{l.endpoint}</span>
                        </div>
                        {l.errorCode && (
                          <div className="text-[11px] text-rose-400 font-sans mt-0.5">Error: {l.errorCode}</div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          l.statusCode >= 200 && l.statusCode < 300
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : l.statusCode >= 400 && l.statusCode < 500
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {l.statusCode || 500}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-silver-muted">
                        {l.responseTimeMs}ms
                      </td>
                      <td className="py-4 px-6 text-xs text-silver-light font-sans">
                        {l.apiKeyName ? `${l.apiKeyName} (${l.apiKeyPrefix})` : 'Direct Key'}
                      </td>
                      <td className="py-4 px-6 text-xs text-silver-muted font-sans">
                        {new Date(l.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {logTotalPages > 1 && (
            <div className="p-4 border-t border-silver-muted/10 flex items-center justify-between">
              <span className="text-xs text-silver-muted">Page {logPage} of {logTotalPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={logPage <= 1}
                  onClick={() => fetchLogs(logPage - 1)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs disabled:opacity-30"
                >
                  Previous
                </button>
                <button
                  disabled={logPage >= logTotalPages}
                  onClick={() => fetchLogs(logPage + 1)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
