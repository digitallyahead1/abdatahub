'use client'

import { useState, useEffect, useMemo } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface ApiUserRow {
  id: string
  fullName: string
  email: string
  role: string
  createdAt: string
  totalKeys: number
  activeKeys: number
  totalRequests: string | number
  totalSuccess: string | number
  totalFail: string | number
  lastActiveAt: string | null
  totalApiRevenue: string | number
  pricingGroupId: string | null
  pricingGroupName: string | null
}

interface PricingGroupSimple {
  id: string
  name: string
  description?: string
  isActive: boolean
}

interface ApiUserDetail {
  id: string
  fullName: string
  email: string
  role: string
  createdAt: string
  keys: Array<{
    id: string
    name: string
    keyPrefix: string
    scope: string
    status: string
    requestCount: number
    successCount: number
    failCount: number
    lastUsedAt: string | null
    createdAt: string
  }>
  webhooks: Array<{
    id: string
    label?: string
    url: string
    events: string[]
    status: string
    createdAt: string
  }>
  recentTransactions: Array<{
    transactionReference: string
    network: string
    bundleName: string
    sellingPrice: number
    status: string
    createdAt: string
  }>
  pricingGroup: {
    id: string
    name: string
  } | null
}

interface DataPlan {
  id: string
  network: string
  bundleName: string
  sellingPrice: number
  agentPrice: number
}

export default function AdminApiUsersPage() {
  const [users, setUsers] = useState<ApiUserRow[]>([])
  const [pricingGroups, setPricingGroups] = useState<PricingGroupSimple[]>([])
  const [allPlans, setAllPlans] = useState<DataPlan[]>([])
  const [loading, setLoading] = useState(true)

  // Filtering
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all')

  // Selected User Detail Drawer
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [userDetail, setUserDetail] = useState<ApiUserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Fast group price preview for user detail modal
  const [groupPlanPrices, setGroupPlanPrices] = useState<Record<string, number>>({})

  // Assign Group Modal / State
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null)
  const [targetGroupId, setTargetGroupId] = useState<string>('')
  const [savingAssignment, setSavingAssignment] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersRes, groupsRes, plansRes] = await Promise.all([
        api.get('/admin/api-users'),
        api.get('/admin/pricing-groups'),
        api.get('/admin/data-plans'),
      ])
      if (usersRes.data.success) setUsers(usersRes.data.data)
      if (groupsRes.data.success) setPricingGroups(groupsRes.data.data)
      if (plansRes.data.success) setAllPlans(plansRes.data.data)
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to load API users data.')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserDetail = async (userId: string) => {
    try {
      setDetailLoading(true)
      const res = await api.get(`/admin/api-users/${userId}`)
      if (res.data.success) {
        setUserDetail(res.data.data)
        // If user has a pricing group, fetch group's custom prices to display
        if (res.data.data.pricingGroup?.id) {
          const groupRes = await api.get(`/admin/pricing-groups/${res.data.data.pricingGroup.id}`)
          if (groupRes.data.success && groupRes.data.data.planPrices) {
            const map: Record<string, number> = {}
            groupRes.data.data.planPrices.forEach((p: any) => {
              map[p.planId] = Number(p.groupPrice)
            })
            setGroupPlanPrices(map)
          } else {
            setGroupPlanPrices({})
          }
        } else {
          setGroupPlanPrices({})
        }
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to load developer details.')
    } finally {
      setDetailLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedUserId) {
      fetchUserDetail(selectedUserId)
    } else {
      setUserDetail(null)
      setGroupPlanPrices({})
    }
  }, [selectedUserId])

  // Handle assigning user to group
  const handleAssignGroup = async (userId: string, newGroupId: string) => {
    try {
      setSavingAssignment(true)
      if (!newGroupId) {
        // Find existing membership and remove
        const user = users.find((u) => u.id === userId)
        if (user?.pricingGroupId) {
          await api.delete(`/admin/pricing-groups/${user.pricingGroupId}/members/${userId}`)
          toast.success('Removed user from pricing group (reverted to default prices).')
        }
      } else {
        await api.post(`/admin/pricing-groups/${newGroupId}/members`, { userId })
        const groupObj = pricingGroups.find((g) => g.id === newGroupId)
        toast.success(`Assigned to group "${groupObj?.name || newGroupId}"!`)
      }

      setAssigningUserId(null)
      await fetchData()
      if (selectedUserId === userId) {
        await fetchUserDetail(userId)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update pricing group.')
    } finally {
      setSavingAssignment(false)
    }
  }

  // Revoke an API key
  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) return
    try {
      const res = await api.post(`/admin/api-keys/${keyId}/revoke`)
      if (res.data.success) {
        toast.success('API key revoked successfully.')
        if (selectedUserId) await fetchUserDetail(selectedUserId)
        await fetchData()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to revoke key.')
    }
  }

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !searchQuery.trim() ||
        (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))

      let matchGroup = true
      if (selectedGroupFilter === 'unassigned') {
        matchGroup = !u.pricingGroupId
      } else if (selectedGroupFilter !== 'all') {
        matchGroup = u.pricingGroupId === selectedGroupFilter
      }

      return matchSearch && matchGroup
    })
  }, [users, searchQuery, selectedGroupFilter])

  // Overview stats calculation
  const totalStats = useMemo(() => {
    let keysCount = 0
    let requestsCount = 0
    let revenueSum = 0
    users.forEach((u) => {
      keysCount += Number(u.activeKeys || 0)
      requestsCount += Number(u.totalRequests || 0)
      revenueSum += Number(u.totalApiRevenue || 0)
    })
    return {
      developers: users.length,
      activeKeys: keysCount,
      totalRequests: requestsCount,
      totalRevenue: revenueSum,
    }
  }, [users])

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-border/60 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-glow/10 border border-primary-glow/20 text-primary-glow">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">API Users &amp; Pricing Management</h1>
              <p className="text-sm text-slate-400">
                Monitor public API developers, track volume and revenue, and assign dedicated wholesale pricing tiers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="px-3.5 py-2 rounded-xl bg-dark-surface hover:bg-dark-bg border border-dark-border text-xs font-medium text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <a
            href="/admin/pricing-groups"
            className="px-4 py-2 rounded-xl bg-primary-glow hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-primary-glow/20 transition-all flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Manage Pricing Groups
          </a>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-surface border border-dark-border/80 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">API Developers</p>
          <p className="text-2xl font-bold text-white mt-1.5">{totalStats.developers}</p>
          <p className="text-[11px] text-slate-500 mt-1">Users with generated keys</p>
        </div>

        <div className="bg-dark-surface border border-dark-border/80 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Active API Keys</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1.5">{totalStats.activeKeys}</p>
          <p className="text-[11px] text-slate-500 mt-1">Authorized access tokens</p>
        </div>

        <div className="bg-dark-surface border border-dark-border/80 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Total API Calls</p>
          <p className="text-2xl font-bold text-blue-400 mt-1.5">{Number(totalStats.totalRequests).toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-1">Incoming request throughput</p>
        </div>

        <div className="bg-dark-surface border border-dark-border/80 rounded-2xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">API Data Revenue</p>
          <p className="text-2xl font-bold text-primary-glow mt-1.5">₦{Number(totalStats.totalRevenue).toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-1">Total completed purchases</p>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-dark-surface border border-dark-border rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-sm">
        <div className="relative flex-1 max-w-md">
          <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search API users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-glow"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 whitespace-nowrap">Pricing Group:</span>
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary-glow"
          >
            <option value="all">All Pricing Groups</option>
            <option value="unassigned">Default Pricing (No Group)</option>
            {pricingGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* API Users Table */}
      <div className="bg-dark-surface border border-dark-border rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-bg/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-dark-border/60">
              <tr>
                <th className="py-3.5 px-4">Developer</th>
                <th className="py-3.5 px-4">Pricing Tier</th>
                <th className="py-3.5 px-4">API Keys</th>
                <th className="py-3.5 px-4">Total Requests</th>
                <th className="py-3.5 px-4">Success Rate</th>
                <th className="py-3.5 px-4">Total Spent</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <svg className="animate-spin h-6 w-6 text-primary-glow mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading API users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No API developers found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const reqs = Number(u.totalRequests || 0)
                  const success = Number(u.totalSuccess || 0)
                  const rate = reqs > 0 ? Math.round((success / reqs) * 100) : 100

                  return (
                    <tr key={u.id} className="hover:bg-dark-bg/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-glow/10 border border-primary-glow/20 flex items-center justify-center text-primary-glow font-bold text-xs uppercase">
                            {u.fullName ? u.fullName.charAt(0) : 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{u.fullName || 'Developer'}</p>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Pricing Tier */}
                      <td className="py-3.5 px-4">
                        {u.pricingGroupId ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-glow/10 text-primary-glow border border-primary-glow/30">
                              {u.pricingGroupName || 'Custom Group'}
                            </span>
                            <button
                              onClick={() => {
                                setAssigningUserId(u.id)
                                setTargetGroupId(u.pricingGroupId || '')
                              }}
                              className="text-[10px] text-slate-400 hover:text-white underline ml-1"
                              title="Change pricing group"
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                              Default Standard
                            </span>
                            <button
                              onClick={() => {
                                setAssigningUserId(u.id)
                                setTargetGroupId('')
                              }}
                              className="text-[10px] text-primary-glow hover:underline ml-1"
                              title="Assign to a group"
                            >
                              + Assign
                            </button>
                          </div>
                        )}
                      </td>

                      {/* API Keys */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-300">
                          <strong className="text-emerald-400">{u.activeKeys}</strong> / {u.totalKeys}
                        </span>
                      </td>

                      {/* Requests */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {reqs.toLocaleString()}
                      </td>

                      {/* Success Rate */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              rate >= 90 ? 'text-emerald-400' : rate >= 70 ? 'text-amber-400' : 'text-red-400'
                            }`}
                          >
                            {rate}%
                          </span>
                        </div>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                        ₦{Number(u.totalApiRevenue || 0).toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedUserId(u.id)}
                          className="px-3 py-1.5 rounded-xl bg-dark-bg hover:bg-slate-800 text-slate-200 hover:text-white border border-dark-border text-xs font-medium transition-colors"
                        >
                          View Pricing &amp; Keys
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Change / Assign Pricing Group */}
      {assigningUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-surface border border-dark-border rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-dark-border/60">
              <h3 className="text-base font-bold text-white">Assign Pricing Group</h3>
              <button
                onClick={() => setAssigningUserId(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select which pricing group this developer should belong to. All requests made via their API keys will automatically receive that group&apos;s rates.
            </p>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Pricing Group
              </label>
              <select
                value={targetGroupId}
                onChange={(e) => setTargetGroupId(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-primary-glow"
              >
                <option value="">Default Standard Pricing (No Group)</option>
                {pricingGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} {g.isActive ? '' : '(Inactive)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-dark-border/40">
              <button
                type="button"
                onClick={() => setAssigningUserId(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingAssignment}
                onClick={() => handleAssignGroup(assigningUserId, targetGroupId)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary-glow hover:opacity-95 text-white shadow-md shadow-primary-glow/20 disabled:opacity-50"
              >
                {savingAssignment ? 'Saving...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL / DRAWER: Developer Pricing & Keys */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-dark-surface border border-dark-border rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            {detailLoading || !userDetail ? (
              <div className="py-16 text-center">
                <svg className="animate-spin h-8 w-8 text-primary-glow mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-sm text-slate-400">Loading developer profile &amp; pricing...</p>
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="mt-4 px-4 py-1.5 rounded-xl bg-dark-bg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-dark-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">{userDetail.fullName || 'Developer Profile'}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-slate-800 text-slate-300">
                    {userDetail.role}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{userDetail.email}</p>
              </div>

              <button
                onClick={() => setSelectedUserId(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white bg-dark-bg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Pricing Group Status & Quick Change */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-glow/10 to-blue-600/10 border border-primary-glow/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Active Pricing Tier</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-bold text-white">
                    {userDetail.pricingGroup?.name || 'Standard Retail / Agent Pricing'}
                  </span>
                  {userDetail.pricingGroup && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Wholesale Group Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {userDetail.pricingGroup
                    ? 'This user receives custom data rates mapped specifically to their pricing group.'
                    : 'User is paying default prices. Assign to a group to offer special wholesale data prices.'}
                </p>
              </div>

              <button
                onClick={() => {
                  setAssigningUserId(userDetail.id)
                  setTargetGroupId(userDetail.pricingGroup?.id || '')
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary-glow hover:opacity-95 text-white shadow-md shadow-primary-glow/20 transition-all whitespace-nowrap self-start sm:self-auto"
              >
                Change Pricing Group
              </button>
            </div>

            {/* Custom Pricing Preview Table */}
            {userDetail.pricingGroup && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Group Plan Rates for {userDetail.pricingGroup.name}
                  </h4>
                  <a
                    href="/admin/pricing-groups"
                    className="text-xs text-primary-glow hover:underline"
                  >
                    Edit Rates in Group Manager →
                  </a>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-dark-border/60 max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-dark-bg/80 text-slate-400 uppercase tracking-wider font-semibold sticky top-0 border-b border-dark-border/60">
                      <tr>
                        <th className="py-2.5 px-3">Network & Plan</th>
                        <th className="py-2.5 px-3">Standard Price</th>
                        <th className="py-2.5 px-3">Agent Price</th>
                        <th className="py-2.5 px-3">This User Pays</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border/40">
                      {allPlans.slice(0, 15).map((plan) => {
                        const gp = groupPlanPrices[plan.id]
                        const hasCustom = gp !== undefined && gp > 0
                        const userPay = hasCustom
                          ? gp
                          : userDetail.role === 'agent' && Number(plan.agentPrice) > 0
                          ? Number(plan.agentPrice)
                          : Number(plan.sellingPrice)

                        return (
                          <tr key={plan.id} className="hover:bg-dark-bg/40">
                            <td className="py-2 px-3">
                              <span className="font-semibold text-white uppercase text-[11px] mr-1.5">
                                {plan.network}:
                              </span>
                              <span className="text-slate-300">{plan.bundleName}</span>
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-400">
                              ₦{Number(plan.sellingPrice).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-400">
                              ₦{Number(plan.agentPrice || 0).toLocaleString()}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-primary-glow">
                              ₦{userPay.toLocaleString()}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {hasCustom ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-glow/10 text-primary-glow border border-primary-glow/20">
                                  Group Custom
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                                  Default
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* API Keys Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Authorized API Keys ({userDetail.keys.length})
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-dark-border/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-dark-bg/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-dark-border/60">
                    <tr>
                      <th className="py-2.5 px-3">Key Name</th>
                      <th className="py-2.5 px-3">Prefix</th>
                      <th className="py-2.5 px-3">Scope</th>
                      <th className="py-2.5 px-3">Calls</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border/40">
                    {userDetail.keys.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">
                          No API keys generated yet.
                        </td>
                      </tr>
                    ) : (
                      userDetail.keys.map((k) => (
                        <tr key={k.id} className="hover:bg-dark-bg/40">
                          <td className="py-2.5 px-3 font-medium text-white">{k.name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-300">{k.keyPrefix}...</td>
                          <td className="py-2.5 px-3">
                            <span className="uppercase text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {k.scope}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-300">
                            {Number(k.requestCount).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3">
                            {k.status === 'active' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                                Revoked
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {k.status === 'active' && (
                              <button
                                onClick={() => handleRevokeKey(k.id)}
                                className="px-2 py-1 rounded text-[11px] font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent API Transactions */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Recent API Purchases ({userDetail.recentTransactions.length})
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-dark-border/60 max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-dark-bg/80 text-slate-400 uppercase tracking-wider font-semibold sticky top-0 border-b border-dark-border/60">
                    <tr>
                      <th className="py-2 px-3">Reference</th>
                      <th className="py-2 px-3">Network & Plan</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border/40">
                    {userDetail.recentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          No recent transactions recorded via API.
                        </td>
                      </tr>
                    ) : (
                      userDetail.recentTransactions.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-dark-bg/40">
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                            {tx.transactionReference}
                          </td>
                          <td className="py-2 px-3 text-slate-200">
                            <span className="uppercase font-semibold text-white mr-1">{tx.network}</span>
                            {tx.bundleName}
                          </td>
                          <td className="py-2 px-3 font-mono font-semibold text-slate-200">
                            ₦{Number(tx.sellingPrice).toLocaleString()}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                tx.status === 'success'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500 text-[11px]">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-dark-border/40">
              <button
                onClick={() => setSelectedUserId(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-dark-bg hover:bg-slate-800 text-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
            </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
