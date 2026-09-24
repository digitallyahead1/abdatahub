'use client'

import { useState, useEffect, useMemo } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface PricingEntry {
  id: string
  network: string
  bundleName: string
  standardPrice: number
  agentPrice: number | null
  groupPrice: number | null
  effectivePrice: number
  priceSource: 'group' | 'agent' | 'standard'
  savings: number
}

interface MyPricingData {
  hasGroup: boolean
  group: { id: string; name: string; description?: string } | null
  userRole: string
  pricingTable: PricingEntry[]
  summary: { totalPlans: number; customPricedPlans: number; averageSavings: number }
}

const NETWORK_COLORS: Record<string, string> = {
  mtn: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25',
  airtel: 'text-red-400 bg-red-500/10 border-red-500/25',
  glo: 'text-green-400 bg-green-500/10 border-green-500/25',
  '9mobile': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
}

export default function MyPricingPage() {
  const [data, setData] = useState<MyPricingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlyCustom, setShowOnlyCustom] = useState(false)

  useEffect(() => {
    fetchPricing()
  }, [])

  const fetchPricing = async () => {
    try {
      setLoading(true)
      const res = await api.get('/services/my-pricing')
      if (res.data.success) {
        setData(res.data.data)
      }
    } catch (err: any) {
      toast.error('Could not load your pricing information.')
    } finally {
      setLoading(false)
    }
  }

  const networks = useMemo(() => {
    if (!data) return []
    return Array.from(new Set(data.pricingTable.map((p) => p.network))).sort()
  }, [data])

  const filteredPlans = useMemo(() => {
    if (!data) return []
    return data.pricingTable.filter((plan) => {
      if (selectedNetwork !== 'all' && plan.network !== selectedNetwork) return false
      if (showOnlyCustom && plan.priceSource === 'standard') return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return plan.bundleName.toLowerCase().includes(q) || plan.network.toLowerCase().includes(q)
      }
      return true
    })
  }, [data, selectedNetwork, showOnlyCustom, searchQuery])

  const totalSavings = useMemo(() => {
    if (!data) return 0
    return data.pricingTable.reduce((sum, p) => sum + p.savings, 0)
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-primary-glow mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-slate-400 text-sm">Loading your personalized pricing...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-24 text-slate-400">Failed to load pricing data.</div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="text-center space-y-2 pb-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-glow/10 border border-primary-glow/20 text-primary-glow text-xs font-semibold mb-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
          </svg>
          My Pricing Plan
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Your Data Plan Rates</h1>
        <p className="text-sm text-slate-400">
          {data.hasGroup
            ? `You are in the "${data.group?.name}" pricing group with exclusive wholesale rates.`
            : data.userRole === 'agent'
            ? 'You are an approved agent with discounted agent rates.'
            : 'You are on the standard pricing tier. Contact support for wholesale pricing.'}
        </p>
      </div>

      {/* Tier Banner */}
      {data.hasGroup ? (
        <div className="relative overflow-hidden rounded-2xl border border-primary-glow/30 bg-gradient-to-r from-primary-glow/15 via-blue-600/10 to-purple-600/10 p-5">
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-glow/20 border border-primary-glow/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">{data.group?.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                    Wholesale Group
                  </span>
                </div>
                {data.group?.description && (
                  <p className="text-xs text-slate-400 mt-0.5">{data.group.description}</p>
                )}
              </div>
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-primary-glow">{data.summary.customPricedPlans}</p>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider">Custom Rates</p>
              </div>
              <div className="w-px bg-dark-border/60" />
              <div>
                <p className="text-xl font-bold text-emerald-400">
                  ₦{totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider">Total Savings</p>
              </div>
            </div>
          </div>
        </div>
      ) : data.userRole === 'agent' ? (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-600/5 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">Agent Pricing Tier</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                  Agent
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">You get discounted agent rates on eligible data plans.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/40 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-700/60 border border-slate-600/40 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Standard Pricing Tier</p>
              <p className="text-xs text-slate-400 mt-1">
                You are currently on standard public pricing. Contact support to be assigned to a pricing group.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Plans', value: data.summary.totalPlans.toLocaleString(), icon: '📦', color: 'text-slate-300' },
          { label: 'Custom Rates', value: data.summary.customPricedPlans.toLocaleString(), icon: '🏷️', color: 'text-primary-glow' },
          { label: 'Avg Savings/Plan', value: `₦${data.summary.averageSavings.toLocaleString(undefined, { maximumFractionDigits: 1 })}`, icon: '💰', color: 'text-emerald-400' },
          { label: 'Your Tier', value: data.hasGroup ? 'Group' : data.userRole === 'agent' ? 'Agent' : 'Standard', icon: '⭐', color: data.hasGroup ? 'text-primary-glow' : data.userRole === 'agent' ? 'text-amber-400' : 'text-slate-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-dark-surface border border-dark-border/60 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-dark-surface border border-dark-border/60 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-glow"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-primary-glow"
          >
            <option value="all">All Networks</option>
            {networks.map((n) => (
              <option key={n} value={n}>
                {n.toUpperCase()}
              </option>
            ))}
          </select>
          {data.hasGroup && (
            <button
              onClick={() => setShowOnlyCustom((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                showOnlyCustom
                  ? 'bg-primary-glow/10 border-primary-glow/30 text-primary-glow'
                  : 'bg-dark-bg border-dark-border text-slate-400 hover:text-white'
              }`}
            >
              Custom Only
            </button>
          )}
          <button
            onClick={fetchPricing}
            className="px-3 py-2 rounded-xl bg-dark-bg border border-dark-border text-xs text-slate-400 hover:text-white transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-surface border border-dark-border/60 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-dark-bg/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-dark-border/60">
              <tr>
                <th className="py-3.5 px-4">Network & Plan</th>
                <th className="py-3.5 px-4 text-right">Standard Price</th>
                {(data.hasGroup || data.userRole === 'agent') && (
                  <th className="py-3.5 px-4 text-right">Your Rate</th>
                )}
                {data.hasGroup && <th className="py-3.5 px-4 text-right">Savings</th>}
                <th className="py-3.5 px-4 text-center">Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/30">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No plans match your filters.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => {
                  const netColor =
                    NETWORK_COLORS[plan.network] ||
                    'text-slate-400 bg-slate-700/30 border-slate-600/30'
                  const isCustom = plan.priceSource === 'group'
                  const isAgent = plan.priceSource === 'agent'
                  return (
                    <tr
                      key={plan.id}
                      className={`hover:bg-dark-bg/30 transition-colors ${
                        isCustom ? 'bg-primary-glow/[0.02]' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${netColor}`}
                          >
                            {plan.network}
                          </span>
                          <span className="text-slate-200 text-xs">{plan.bundleName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-mono text-xs ${
                            isCustom || isAgent ? 'line-through text-slate-500' : 'text-slate-300'
                          }`}
                        >
                          ₦{Number(plan.standardPrice).toLocaleString()}
                        </span>
                      </td>
                      {(data.hasGroup || data.userRole === 'agent') && (
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-mono font-bold text-xs ${
                              isCustom
                                ? 'text-primary-glow'
                                : isAgent
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }`}
                          >
                            ₦{Number(plan.effectivePrice).toLocaleString()}
                          </span>
                        </td>
                      )}
                      {data.hasGroup && (
                        <td className="py-3 px-4 text-right">
                          {plan.savings > 0 ? (
                            <span className="font-mono font-semibold text-emerald-400 text-xs">
                              -₦{Number(plan.savings).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-4 text-center">
                        {isCustom ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-glow/10 text-primary-glow border border-primary-glow/25">
                            Group Rate
                          </span>
                        ) : isAgent ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                            Agent Rate
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-500 border border-slate-700/60">
                            Standard
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredPlans.length > 0 && (
          <div className="border-t border-dark-border/40 px-4 py-3 flex items-center justify-between text-[11px] text-slate-500 bg-dark-bg/40">
            <span>
              Showing {filteredPlans.length} of {data.pricingTable.length} plans
            </span>
            <span>Rates apply automatically at checkout</span>
          </div>
        )}
      </div>
    </div>
  )
}
