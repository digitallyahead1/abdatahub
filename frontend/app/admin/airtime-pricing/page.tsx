'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface AirtimePricing {
  network: string
  smeplugRate: number
  sellingRate: number
  overrideStatus: boolean
  visibilityStatus: boolean
  lastSyncedAt: string
}

export default function AdminAirtimePricingPage() {
  const [pricingList, setPricingList] = useState<AirtimePricing[]>([])
  const [loading, setLoading] = useState(true)
  const [editingNetwork, setEditingNetwork] = useState<string | null>(null)
  const [editingRate, setEditingRate] = useState<string>('')

  const fetchPricing = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/airtime-pricing')
      setPricingList(response.data.data)
    } catch (err) {
      console.error('Failed to fetch airtime rates:', err)
      toast.error('Could not fetch airtime configurations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPricing()
  }, [])

  const toggleOverride = async (pricing: AirtimePricing) => {
    try {
      const updated = await api.put(`/admin/airtime-pricing/${pricing.network}`, {
        overrideStatus: !pricing.overrideStatus,
      })
      toast.success('Override status updated.')
      setPricingList(pricingList.map((p) => (p.network === pricing.network ? updated.data.data : p)))
    } catch (err) {
      toast.error('Failed to update override.')
    }
  }

  const toggleVisibility = async (pricing: AirtimePricing) => {
    try {
      const updated = await api.put(`/admin/airtime-pricing/${pricing.network}`, {
        visibilityStatus: !pricing.visibilityStatus,
      })
      toast.success('Service visibility updated.')
      setPricingList(pricingList.map((p) => (p.network === pricing.network ? updated.data.data : p)))
    } catch (err) {
      toast.error('Failed to update visibility.')
    }
  }

  const startEdit = (pricing: AirtimePricing) => {
    setEditingNetwork(pricing.network)
    setEditingRate(pricing.sellingRate.toString())
  }

  const saveRate = async (pricing: AirtimePricing) => {
    const rateVal = parseFloat(editingRate)
    if (isNaN(rateVal) || rateVal < 0 || rateVal > 2.00) {
      toast.error('Please enter a valid rate (e.g. 0.99 for 1% discount, 1.02 for 2% markup).')
      return
    }

    try {
      const updated = await api.put(`/admin/airtime-pricing/${pricing.network}`, {
        sellingRate: rateVal,
        overrideStatus: true, // Auto-enable override on manual update
      })
      toast.success('Selling rate saved and override activated.')
      setPricingList(pricingList.map((p) => (p.network === pricing.network ? updated.data.data : p)))
      setEditingNetwork(null)
    } catch (err) {
      toast.error('Failed to save rate configuration.')
    }
  }

  if (loading) {
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
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">Airtime Pricing Management</h1>
        <p className="text-sm text-silver-muted">
          Configure customer buying rates, commission markups, status overrides, and visibility of airtime top-up services.
        </p>
      </div>

      <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-silver-light border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-silver-muted/10 text-xs font-bold text-silver-muted uppercase tracking-wider">
                <th className="px-6 py-4">Network</th>
                <th className="px-6 py-4">SMEPlug Cost Rate</th>
                <th className="px-6 py-4">Selling Rate</th>
                <th className="px-6 py-4">Calculated Markup</th>
                <th className="px-6 py-4">Override Status</th>
                <th className="px-6 py-4">Visibility</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {pricingList.map((pricing) => {
                const markup = pricing.sellingRate - pricing.smeplugRate
                const markupPercent = (markup * 100).toFixed(2)
                
                return (
                  <tr
                    key={pricing.network}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-white uppercase">{pricing.network}</td>
                    <td className="px-6 py-4 font-mono">
                      {(pricing.smeplugRate * 100).toFixed(1)}% ({(pricing.smeplugRate).toFixed(4)})
                      <span className="text-[10px] text-silver-muted block">Reseller cost discount</span>
                    </td>
                    <td className="px-6 py-4">
                      {editingNetwork === pricing.network ? (
                        <input
                          type="number"
                          step="0.0001"
                          value={editingRate}
                          onChange={(e) => setEditingRate(e.target.value)}
                          className="w-24 bg-dark-bg border border-primary-glow/50 rounded px-2 py-1 text-white font-mono text-sm focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span className="font-bold text-primary-glow font-mono">
                          {(pricing.sellingRate * 100).toFixed(1)}% ({(pricing.sellingRate).toFixed(4)})
                        </span>
                      )}
                      <span className="text-[10px] text-silver-muted block">End-user billing rate</span>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-emerald-400">
                      {markup >= 0 ? `+${markupPercent}%` : `${markupPercent}%`}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                          pricing.overrideStatus
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-white/5 text-silver-muted border-white/5'
                        }`}
                      >
                        {pricing.overrideStatus ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                          pricing.visibilityStatus
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}
                      >
                        {pricing.visibilityStatus ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        {editingNetwork === pricing.network ? (
                          <>
                            <button
                              onClick={() => saveRate(pricing)}
                              className="px-3 py-1 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingNetwork(null)}
                              className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(pricing)}
                              className="px-3 py-1 bg-white/5 border border-white/10 text-white text-xs font-semibold rounded-lg hover:bg-white/10 transition-colors"
                            >
                              Edit Rate
                            </button>
                            <button
                              onClick={() => toggleOverride(pricing)}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                                pricing.overrideStatus
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                  : 'bg-white/5 text-silver-muted border-white/5 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {pricing.overrideStatus ? 'Disable Override' : 'Enable Override'}
                            </button>
                            <button
                              onClick={() => toggleVisibility(pricing)}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                                pricing.visibilityStatus
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              }`}
                            >
                              {pricing.visibilityStatus ? 'Hide Service' : 'Show Service'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
