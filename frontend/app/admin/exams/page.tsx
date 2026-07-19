'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface ExamStat {
  id: string
  name: string
  price: number
  status: string
  total: number
  sold: number
  available: number
}

interface ExamPinInventory {
  id: string
  pinCode: string
  serialNumber: string | null
  examType: string
  examName: string
  isSold: boolean
  soldToEmail: string | null
  soldToName: string | null
  soldAt: string | null
  amountPaid: number | null
  status: string
  createdAt: string
}

export default function AdminExamsPage() {
  // Stats
  const [stats, setStats] = useState<ExamStat[]>([])
  const [statsLoading, setStatsLoading] = useState(true)

  // Upload state
  const [uploadBody, setUploadBody] = useState('waec')
  const [pinsText, setPinsText] = useState('')
  const [serialsText, setSerialsText] = useState('')
  const [uploading, setUploading] = useState(false)

  // Pricing state
  const [pricingForm, setPricingForm] = useState<Record<string, number>>({})
  const [agentPricingForm, setAgentPricingForm] = useState<Record<string, number>>({})
  const [updatingPricing, setUpdatingPricing] = useState(false)

  // Inventory state
  const [inventory, setInventory] = useState<ExamPinInventory[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(true)
  const [totalPins, setTotalPins] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [filterBody, setFilterBody] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const response = await api.get('/admin/exams/stats')
      const data = response.data.data
      setStats(data)

      // Initialize pricing form values
      const initialPrices: Record<string, number> = {}
      const initialAgentPrices: Record<string, number> = {}
      data.forEach((item: any) => {
        initialPrices[item.id] = item.price
        initialAgentPrices[item.id] = item.agentPrice || 0
      })
      setPricingForm(initialPrices)
      setAgentPricingForm(initialAgentPrices)
    } catch (err) {
      console.error('Failed to fetch exam stats:', err)
      toast.error('Could not fetch exam category stats.')
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchInventory = async () => {
    try {
      setInventoryLoading(true)
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (filterBody) queryParams.append('examType', filterBody)
      if (filterStatus) queryParams.append('status', filterStatus)

      const response = await api.get(`/admin/exams/inventory?${queryParams.toString()}`)
      setInventory(response.data.data.pins)
      setTotalPins(response.data.data.total)
    } catch (err) {
      console.error('Failed to fetch inventory:', err)
      toast.error('Could not fetch exam PIN inventory.')
    } finally {
      setInventoryLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    fetchInventory()
  }, [page, filterBody, filterStatus])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pinsText.trim()) {
      toast.error('Please enter at least one PIN.')
      return
    }

    const pins = pinsText.split('\n').map(p => p.trim()).filter(Boolean)
    const serials = serialsText.split('\n').map(s => s.trim()) // Keep empty elements to pair correctly

    setUploading(true)
    try {
      const response = await api.post('/admin/exams/upload', {
        examType: uploadBody,
        pins,
        serials: serials.slice(0, pins.length), // Match length of pins
      })
      const result = response.data.data
      toast.success(
        `Successfully processed: Saved ${result.saved}, Skipped ${result.skipped} duplicates.`
      )
      setPinsText('')
      setSerialsText('')
      fetchStats()
      fetchInventory()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload exam PINs.')
    } finally {
      setUploading(false)
    }
  }

  const handleUpdatePricing = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingPricing(true)
    try {
      await api.post('/admin/exams/pricing', {
        prices: pricingForm,
        agentPrices: agentPricingForm,
      })
      toast.success('Exam PIN pricing updated successfully!')
      fetchStats()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update pricing.')
    } finally {
      setUpdatingPricing(false)
    }
  }

  const handleTogglePin = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'available' ? 'disabled' : 'available'
    try {
      await api.post(`/admin/exams/pins/${id}/toggle`, { status: nextStatus })
      toast.success(`PIN marked as ${nextStatus}`)
      fetchInventory()
      fetchStats()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to toggle status.')
    }
  }

  const handleDeletePin = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this unused PIN? This action is irreversible.')) {
      return
    }
    try {
      await api.delete(`/admin/exams/pins/${id}`)
      toast.success('Unused PIN deleted successfully')
      fetchInventory()
      fetchStats()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete PIN.')
    }
  }

  const formatMoney = (amount: number) => {
    return '₦' + Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const totalPages = Math.ceil(totalPins / limit)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">Exam PIN Management</h1>
        <p className="text-sm text-silver-muted">
          Manage results checker categories, view inventory stock level metrics, adjust retail rates, and upload serial-paired tokens.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsLoading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-32 bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl animate-pulse" />
          ))
        ) : (
          stats.map((item) => {
            const isOut = item.available === 0
            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl bg-dark-bg-secondary/40 border transition-all duration-200 ${
                  isOut ? 'border-red-500/25 bg-red-500/[0.02]' : 'border-silver-muted/10'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-silver-muted uppercase font-mono">{item.id}</span>
                  {isOut ? (
                    <span className="px-2 py-0.5 text-[10px] font-black tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 rounded uppercase animate-pulse">
                      0 In Stock
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded uppercase">
                      Active
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-white mt-2 truncate">{item.name}</h3>
                <div className="mt-4 flex justify-between items-baseline">
                  <div>
                    <span className="text-2xl font-extrabold text-white">{item.available}</span>
                    <span className="text-[10px] text-silver-muted ml-1">left</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-primary-glow font-mono">{formatMoney(item.price)}</p>
                    <p className="text-[9px] text-silver-muted">{item.sold} sold</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Action Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-dark-bg-secondary/40 border border-silver-muted/10 glass-dark space-y-4">
          <div className="border-b border-silver-muted/10 pb-3">
            <h2 className="text-lg font-bold text-white">Add Exam Checker PINs</h2>
            <p className="text-xs text-silver-muted">Pair PINs and Serial numbers by line sequence (line-for-line mapping).</p>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-silver-muted mb-2 uppercase">Exam Body Category</label>
                <select
                  value={uploadBody}
                  onChange={(e) => setUploadBody(e.target.value)}
                  className="w-full bg-dark-bg border border-silver-muted/20 hover:border-silver-muted/40 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-primary-glow transition-all"
                >
                  {stats.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id.toUpperCase()})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-silver-muted mb-2 uppercase">PIN Codes (One per line)</label>
                <textarea
                  rows={6}
                  value={pinsText}
                  onChange={(e) => setPinsText(e.target.value)}
                  placeholder="PIN-12345-67890&#10;PIN-98765-43210"
                  className="w-full bg-dark-bg border border-silver-muted/20 hover:border-silver-muted/40 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary-glow transition-all placeholder:text-silver-muted/30"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-silver-muted mb-2 uppercase">Serial Numbers (One per line)</label>
                <textarea
                  rows={6}
                  value={serialsText}
                  onChange={(e) => setSerialsText(e.target.value)}
                  placeholder="SN-99887766&#10;SN-11223344"
                  className="w-full bg-dark-bg border border-silver-muted/20 hover:border-silver-muted/40 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary-glow transition-all placeholder:text-silver-muted/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full py-3 bg-gradient-blue text-white text-sm font-bold rounded-xl shadow-glow-blue hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {uploading ? 'Processing & Uploading...' : 'Upload Checker Cards'}
            </button>
          </form>
        </div>

        {/* Pricing Adjustments */}
        <div className="p-6 rounded-2xl bg-dark-bg-secondary/40 border border-silver-muted/10 glass-dark flex flex-col justify-between">
          <div>
            <div className="border-b border-silver-muted/10 pb-3 mb-4">
              <h2 className="text-lg font-bold text-white">Adjust Price Configurations</h2>
              <p className="text-xs text-silver-muted">Change the end-user selling rates for checkers.</p>
            </div>

            <form onSubmit={handleUpdatePricing} className="space-y-6">
              {stats.map((cat) => (
                <div key={cat.id} className="space-y-2 border-b border-white/5 pb-4 last:border-b-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white uppercase font-mono">{cat.name || cat.id}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-silver-muted uppercase mb-1">Selling Price</label>
                      <div className="relative rounded-xl border border-silver-muted/20 focus-within:border-primary-glow overflow-hidden bg-dark-bg">
                        <span className="absolute left-3 top-2.5 text-silver-muted text-xs font-mono">₦</span>
                        <input
                          type="number"
                          value={pricingForm[cat.id] ?? ''}
                          onChange={(e) => setPricingForm({ ...pricingForm, [cat.id]: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-transparent pl-7 pr-3 py-2 text-white font-mono text-xs text-right focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-silver-muted uppercase mb-1">Agent Price</label>
                      <div className="relative rounded-xl border border-silver-muted/20 focus-within:border-primary-glow overflow-hidden bg-dark-bg">
                        <span className="absolute left-3 top-2.5 text-silver-muted text-xs font-mono">₦</span>
                        <input
                          type="number"
                          value={agentPricingForm[cat.id] ?? ''}
                          onChange={(e) => setAgentPricingForm({ ...agentPricingForm, [cat.id]: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-transparent pl-7 pr-3 py-2 text-white font-mono text-xs text-right focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={updatingPricing}
                className="w-full py-3 bg-gradient-blue hover:opacity-95 text-white text-sm font-bold rounded-xl shadow-glow-blue transition-all disabled:opacity-50 mt-2"
              >
                {updatingPricing ? 'Saving Price Matrix...' : 'Update Prices'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Inventory & Sales Reports */}
      <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark overflow-hidden space-y-4">
        {/* Table Filters */}
        <div className="p-6 border-b border-silver-muted/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Checker Inventory</h2>
            <p className="text-xs text-silver-muted">Detailed view of PIN usage status, allocation timestamps, and audit metrics.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filterBody}
              onChange={(e) => { setFilterBody(e.target.value); setPage(1); }}
              className="bg-dark-bg border border-silver-muted/20 rounded-xl px-4 py-2 text-white text-xs focus:outline-none"
            >
              <option value="">All Exam Bodies</option>
              {stats.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="bg-dark-bg border border-silver-muted/20 rounded-xl px-4 py-2 text-white text-xs focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="available">Available (Unsold)</option>
              <option value="sold">Sold</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {inventoryLoading ? (
            <div className="py-20 flex justify-center">
              <svg className="animate-spin h-8 w-8 text-primary-glow" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : inventory.length === 0 ? (
            <div className="py-20 text-center text-silver-muted text-sm">
              No matching PIN code items found in database.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-silver-light border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-silver-muted/10 text-xs font-bold text-silver-muted uppercase tracking-wider">
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">PIN Code</th>
                  <th className="px-6 py-4">Serial Number</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Sold To</th>
                  <th className="px-6 py-4">Purchased At</th>
                  <th className="px-6 py-4">Price Charged</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {inventory.map((pin) => (
                  <tr key={pin.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-bold text-white uppercase text-xs font-mono">{pin.examType}</td>
                    <td className="px-6 py-4 font-mono text-xs select-all text-primary-glow">{pin.pinCode}</td>
                    <td className="px-6 py-4 font-mono text-xs select-all">{pin.serialNumber || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                          pin.status === 'sold'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : pin.status === 'available'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-white/5 text-silver-muted border-white/5'
                        }`}
                      >
                        {pin.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate">
                      {pin.isSold ? (
                        <div>
                          <p className="text-white text-xs font-semibold">{pin.soldToName || 'Deleted User'}</p>
                          <p className="text-[10px] text-silver-muted">{pin.soldToEmail || 'N/A'}</p>
                        </div>
                      ) : (
                        <span className="text-silver-muted/40">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-silver-muted font-mono">
                      {pin.soldAt ? new Date(pin.soldAt).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-white">
                      {pin.amountPaid ? formatMoney(pin.amountPaid) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        {!pin.isSold ? (
                          <>
                            <button
                              onClick={() => handleTogglePin(pin.id, pin.status)}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                                pin.status === 'available'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              }`}
                            >
                              {pin.status === 'available' ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleDeletePin(pin.id)}
                              className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-bold rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <span className="text-silver-muted/30 text-[10px]">No Actions (Sold)</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-silver-muted/10 flex justify-between items-center">
            <span className="text-xs text-silver-muted">
              Showing page {page} of {totalPages} ({totalPins} total items)
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 text-xs font-semibold border border-silver-muted/20 hover:border-silver-muted/40 rounded-lg text-white disabled:opacity-30 disabled:border-silver-muted/20 transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 text-xs font-semibold border border-silver-muted/20 hover:border-silver-muted/40 rounded-lg text-white disabled:opacity-30 disabled:border-silver-muted/20 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
