'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface ReportSummary {
  totalDataSales: number
  totalDataProfit: number
  dataCount: number
  totalAirtimeSales: number
  totalAirtimeProfit: number
  airtimeCount: number
  totalSales: number
  totalProfit: number
  totalCount: number
}

interface VTUTransaction {
  id: string
  network: string
  bundleName?: string
  amount?: number
  smeplugCost: number
  sellingPrice: number
  profit: number
  transactionReference: string
  status: string
  createdAt: string
  user?: {
    fullName: string
    email: string
  }
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [networkBreakdown, setNetworkBreakdown] = useState<any>(null)
  const [transactions, setTransactions] = useState<VTUTransaction[]>([])

  // Filters state
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [network, setNetwork] = useState('')
  const [status, setStatus] = useState('')

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (serviceType) params.append('serviceType', serviceType)
      if (network) params.append('network', network)
      if (status) params.append('status', status)

      const response = await api.get(`/admin/reports?${params.toString()}`)
      const reportData = response.data.data

      setSummary(reportData.summary)
      setNetworkBreakdown(reportData.networkBreakdown)

      // Merge data and airtime transactions and sort by date
      const dataTxs = (reportData.dataTransactions || []).map((t: any) => ({ ...t, type: 'Data' }))
      const airtimeTxs = (reportData.airtimeTransactions || []).map((t: any) => ({ ...t, type: 'Airtime', bundleName: `${t.network.toUpperCase()} Airtime` }))
      
      const merged = [...dataTxs, ...airtimeTxs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setTransactions(merged)
    } catch (err) {
      console.error('Failed to load reports:', err)
      toast.error('Could not retrieve reports data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    fetchReports()
  }

  const handleReset = () => {
    setStartDate('')
    setEndDate('')
    setServiceType('')
    setNetwork('')
    setStatus('')
    setTimeout(() => fetchReports(), 50)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">VTU Sales & Revenue Reports</h1>
        <p className="text-sm text-silver-muted font-medium">
          Monitor your dynamic sales volume, profit margins, and network transaction distributions.
        </p>
      </div>

      {/* Filter Section */}
      <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 p-6 rounded-2xl glass-dark glow-blue">
        <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-silver-muted uppercase tracking-wider">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-dark-bg border border-silver-muted/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-primary-glow"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-silver-muted uppercase tracking-wider">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-dark-bg border border-silver-muted/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-primary-glow"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-silver-muted uppercase tracking-wider">Service Type</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full bg-dark-bg-secondary border border-silver-muted/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-primary-glow"
            >
              <option value="">All Services</option>
              <option value="data">Data Subscriptions</option>
              <option value="airtime">Airtime Top-Up</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-silver-muted uppercase tracking-wider">Network</label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full bg-dark-bg-secondary border border-silver-muted/10 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-primary-glow"
            >
              <option value="">All Networks</option>
              <option value="mtn">MTN</option>
              <option value="airtel">Airtel</option>
              <option value="glo">Glo</option>
              <option value="9mobile">9mobile</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-blue text-white font-bold text-xs rounded-xl shadow-glow-blue transition-all"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 bg-white/5 border border-white/5 text-white font-bold text-xs rounded-xl hover:bg-white/10 transition-all"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {loading && transactions.length === 0 ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <svg className="animate-spin h-10 w-10 text-primary-glow" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'VTU Gross Revenue', val: `₦${summary.totalSales.toLocaleString()}`, sub: `${summary.totalCount} successful deals`, color: 'text-white' },
                { label: 'Estimated Profits', val: `₦${summary.totalProfit.toLocaleString()}`, sub: `Margin of ${(summary.totalSales ? (summary.totalProfit / summary.totalSales * 100) : 0).toFixed(1)}%`, color: 'text-amber-400' },
                { label: 'Data Subscription Sales', val: `₦${summary.totalDataSales.toLocaleString()}`, sub: `${summary.dataCount} transactions`, color: 'text-white' },
                { label: 'Airtime Vended Volume', val: `₦${summary.totalAirtimeSales.toLocaleString()}`, sub: `${summary.airtimeCount} transactions`, color: 'text-white' },
              ].map((card, i) => (
                <div key={i} className="p-6 bg-gradient-to-br from-dark-bg-secondary to-dark-bg border border-silver-muted/10 rounded-2xl relative overflow-hidden group hover:border-primary-glow/20 transition-all duration-300">
                  <p className="text-[10px] font-bold text-silver-muted uppercase tracking-wider">{card.label}</p>
                  <p className={`text-2xl font-extrabold mt-2 font-mono ${card.color}`}>{card.val}</p>
                  <p className="text-[10px] text-silver-muted mt-2 font-semibold">{card.sub}</p>
                </div>
              ))}
            </div>
          )}

          {/* Network breakdowns */}
          {networkBreakdown && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Data Plans Network Share</h3>
                <div className="space-y-3">
                  {['mtn', 'airtel', 'glo', '9mobile'].map((net) => {
                    const count = networkBreakdown.data[net] || 0
                    const percent = summary?.dataCount ? ((count / summary.dataCount) * 100).toFixed(1) : '0.0'
                    return (
                      <div key={net} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="uppercase text-white">{net}</span>
                          <span className="text-silver-muted">{count} sales ({percent}%)</span>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                          <div className="bg-primary-glow h-full rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-6 bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Airtime Network Share</h3>
                <div className="space-y-3">
                  {['mtn', 'airtel', 'glo', '9mobile'].map((net) => {
                    const count = networkBreakdown.airtime[net] || 0
                    const percent = summary?.airtimeCount ? ((count / summary.airtimeCount) * 100).toFixed(1) : '0.0'
                    return (
                      <div key={net} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="uppercase text-white">{net}</span>
                          <span className="text-silver-muted">{count} recharges ({percent}%)</span>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-400 h-full rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Transactions List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white tracking-wide">Detailed Logs</h2>
            <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-silver-light border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-silver-muted/10 text-xs font-bold text-silver-muted uppercase tracking-wider">
                      <th className="px-6 py-4">Reference</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Network</th>
                      <th className="px-6 py-4">Service</th>
                      <th className="px-6 py-4">Selling Price</th>
                      <th className="px-6 py-4">Profit</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-10 text-center text-silver-muted font-medium">
                          No transactions found matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-mono text-xs text-white">{tx.transactionReference}</td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-white block">{tx.user?.fullName || 'N/A'}</span>
                            <span className="text-[10px] text-silver-muted block">{tx.user?.email || 'N/A'}</span>
                          </td>
                          <td className="px-6 py-4 font-bold text-xs uppercase text-white">{tx.network}</td>
                          <td className="px-6 py-4 text-xs font-semibold">
                            {tx.bundleName}
                          </td>
                          <td className="px-6 py-4 font-mono text-white font-semibold">
                            ₦{Number(tx.sellingPrice).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 font-mono text-emerald-400 font-semibold">
                            ₦{Number(tx.profit).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                                tx.status === 'success'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : tx.status === 'failed'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-silver-muted font-mono">
                            {new Date(tx.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
