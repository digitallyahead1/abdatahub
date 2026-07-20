'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface DataPlan {
  id: string
  smeplugPlanId: number
  network: string
  bundleName: string
  smeplugCost: number
  sellingPrice: number
  agentPrice: number
  overrideStatus: boolean
  visibilityStatus: boolean
  lastSyncedAt: string
  provider?: string
}

type TabType = 'mtn' | 'airtel' | 'glo' | '9mobile' | 'amzaet'

export default function AdminDataPlansPage() {
  const [plans, setPlans] = useState<DataPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('mtn')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingPrice, setEditingPrice] = useState<string>('')
  const [editingAgentPrice, setEditingAgentPrice] = useState<string>('')
  const [editingBundleName, setEditingBundleName] = useState<string>('')

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/data-plans')
      setPlans(response.data.data)
    } catch (err) {
      console.error('Failed to fetch data plans:', err)
      toast.error('Could not fetch data plans from server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleSync = async () => {
    try {
      setSyncing(true)
      const res = await api.post('/admin/smeplug/sync')
      toast.success(res.data.message || 'Synchronization complete!')
      await fetchPlans()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Sync failed.')
    } finally {
      setSyncing(false)
    }
  }

  const toggleOverride = async (plan: DataPlan) => {
    try {
      const updated = await api.put(`/admin/data-plans/${plan.id}`, {
        overrideStatus: !plan.overrideStatus,
      })
      toast.success('Price override status updated.')
      setPlans(plans.map((p) => (p.id === plan.id ? updated.data.data : p)))
    } catch (err) {
      toast.error('Failed to update override status.')
    }
  }

  const toggleVisibility = async (plan: DataPlan) => {
    try {
      const updated = await api.put(`/admin/data-plans/${plan.id}`, {
        visibilityStatus: !plan.visibilityStatus,
      })
      toast.success('Visibility changed.')
      setPlans(plans.map((p) => (p.id === plan.id ? updated.data.data : p)))
    } catch (err) {
      toast.error('Failed to change visibility.')
    }
  }

  const startEdit = (plan: DataPlan) => {
    setEditingId(plan.id)
    setEditingPrice(plan.sellingPrice.toString())
    setEditingAgentPrice((plan.agentPrice || 0).toString())
    setEditingBundleName(plan.bundleName)
  }

  const savePrice = async (plan: DataPlan) => {
    const priceVal = parseFloat(editingPrice)
    const agentPriceVal = parseFloat(editingAgentPrice)
    if (isNaN(priceVal) || priceVal < 0) {
      toast.error('Please enter a valid selling price.')
      return
    }
    if (isNaN(agentPriceVal) || agentPriceVal < 0) {
      toast.error('Please enter a valid agent price.')
      return
    }

    try {
      const updated = await api.put(`/admin/data-plans/${plan.id}`, {
        bundleName: editingBundleName.trim() || plan.bundleName,
        sellingPrice: priceVal,
        agentPrice: agentPriceVal,
        overrideStatus: true, // Auto-enable override when plan is custom-set
      })
      toast.success('Prices saved successfully.')
      setPlans(plans.map((p) => (p.id === plan.id ? updated.data.data : p)))
      setEditingId(null)
    } catch (err) {
      toast.error('Failed to update price.')
    }
  }

  const filteredPlans = plans.filter((p) => {
    if (activeTab === 'amzaet') {
      return p.provider === 'amzaet'
    }
    // Treat null/undefined provider as 'smeplug' (pre-migration rows)
    return p.network === activeTab && (!p.provider || p.provider === 'smeplug')
  })

  if (loading && plans.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-primary-glow" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Data Plans Management</h1>
          <p className="text-sm text-silver-muted">
            Manage customer pricing, overrides, and visibility of data bundles dynamically.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-blue hover:opacity-95 text-white font-bold rounded-xl shadow-glow-blue transition-all disabled:opacity-50 text-sm"
        >
          {syncing ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Syncing plans...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89H18" />
              </svg>
              <span>Sync SMEPlug plans</span>
            </>
          )}
        </button>
      </div>

      {/* Network / Provider Selection tabs */}
      <div className="flex space-x-2 border-b border-white/5 pb-px">
        {[
          { id: 'mtn', name: 'MTN (SMEPlug)' },
          { id: 'airtel', name: 'Airtel' },
          { id: 'glo', name: 'Glo' },
          { id: '9mobile', name: '9mobile' },
          { id: 'amzaet', name: 'AMZAET (MTN)' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as TabType)
              setEditingId(null)
            }}
            className={`px-6 py-3 text-sm font-bold uppercase border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-primary-glow text-primary-glow font-extrabold'
                : 'border-transparent text-silver-muted hover:text-white'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Plans Table */}
      <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-silver-light border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-silver-muted/10 text-xs font-bold text-silver-muted uppercase tracking-wider">
                <th className="px-6 py-4">Plan ID</th>
                <th className="px-6 py-4">Bundle Name</th>
                <th className="px-6 py-4">{activeTab === 'amzaet' ? 'AMZAET Cost' : 'SMEPlug Cost'}</th>
                <th className="px-6 py-4">Selling Price</th>
                <th className="px-6 py-4">Agent Price</th>
                <th className="px-6 py-4">Override Status</th>
                <th className="px-6 py-4">Visibility</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-silver-muted font-medium">
                    No active plans synced for this network yet. Try clicking "Sync SMEPlug plans".
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr
                    key={plan.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs">{plan.smeplugPlanId}</td>
                    <td className="px-6 py-4 font-semibold text-white">
                      {editingId === plan.id ? (
                        <input
                          type="text"
                          value={editingBundleName}
                          onChange={(e) => setEditingBundleName(e.target.value)}
                          className="w-full bg-dark-bg border border-primary-glow/50 rounded px-2 py-1 text-white text-sm focus:outline-none"
                          placeholder="Bundle Name"
                        />
                      ) : (
                        plan.bundleName
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono">₦{plan.smeplugCost.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {editingId === plan.id ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-silver-muted">₦</span>
                          <input
                            type="number"
                            value={editingPrice}
                            onChange={(e) => setEditingPrice(e.target.value)}
                            className="w-24 bg-dark-bg border border-primary-glow/50 rounded px-2 py-1 text-white font-mono text-sm focus:outline-none"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-primary-glow font-mono">₦{plan.sellingPrice.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingId === plan.id ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-silver-muted">₦</span>
                          <input
                            type="number"
                            value={editingAgentPrice}
                            onChange={(e) => setEditingAgentPrice(e.target.value)}
                            className="w-24 bg-dark-bg border border-primary-glow/50 rounded px-2 py-1 text-white font-mono text-sm focus:outline-none"
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-purple-400 font-mono">₦{(plan.agentPrice || 0).toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                          plan.overrideStatus
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-white/5 text-silver-muted border-white/5'
                        }`}
                      >
                        {plan.overrideStatus ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                          plan.visibilityStatus
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}
                      >
                        {plan.visibilityStatus ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        {editingId === plan.id ? (
                          <>
                            <button
                              onClick={() => savePrice(plan)}
                              className="px-3 py-1 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(plan)}
                              className="px-3 py-1 bg-white/5 border border-white/10 text-white text-xs font-semibold rounded-lg hover:bg-white/10 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => toggleOverride(plan)}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                                plan.overrideStatus
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                  : 'bg-white/5 text-silver-muted border-white/5 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {plan.overrideStatus ? 'Disable Override' : 'Enable Override'}
                            </button>
                            <button
                              onClick={() => toggleVisibility(plan)}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                                plan.visibilityStatus
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              }`}
                            >
                              {plan.visibilityStatus ? 'Hide Plan' : 'Show Plan'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
