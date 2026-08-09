'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface AdminTxRecord {
  id: string
  fullName: string
  email: string
  type: 'credit' | 'debit'
  service: string
  amount: number
  status: string
  reference: string
  createdAt: string
  metadata?: any
}

export default function AdminTransactionsPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<AdminTxRecord[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [activeQuery, setActiveQuery] = useState('')

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/transactions')
      setTransactions(response.data.data)
    } catch (err) {
      console.error('Error fetching admin transaction logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setActiveQuery(searchInput.trim().toLowerCase())
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (!activeQuery) return true
    const emailMatch = tx.email?.toLowerCase().includes(activeQuery)
    const nameMatch = tx.fullName?.toLowerCase().includes(activeQuery)
    const refMatch = tx.reference?.toLowerCase().includes(activeQuery)
    const phoneMatch = tx.metadata?.phoneNumber?.toLowerCase().includes(activeQuery)
    return emailMatch || nameMatch || refMatch || phoneMatch
  })

  const makeSuccessful = async (txId: string) => {
    try {
      await api.post(`/admin/transactions/${txId}/success`)
      toast.success('Transaction marked as successful!')
      fetchTransactions()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update transaction.')
    }
  }

  const requeryTransaction = async (txId: string) => {
    try {
      const res = await api.post(`/admin/transactions/${txId}/requery`)
      toast.success(res.data.message || 'Requery complete!')
      fetchTransactions()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Requery failed.')
    }
  }

  const refundTransaction = async (txId: string) => {
    try {
      await api.post(`/admin/transactions/${txId}/refund`)
      toast.success('Transaction refunded successfully!')
      fetchTransactions()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to refund transaction.')
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-white tracking-wide">System Transaction Logs</h1>

        {/* Search Bar with Search Button */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search email, phone or reference..."
            className="bg-white/5 border border-silver-muted/15 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-primary-glow w-full sm:w-64"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-blue text-white font-bold rounded-xl text-xs hover:opacity-95 transition-all flex items-center gap-1.5 shrink-0 shadow-glow-blue-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
          {activeQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('')
                setActiveQuery('')
              }}
              className="px-3 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs text-silver-muted shrink-0"
            >
              Clear
            </button>
          )}
          <button onClick={fetchTransactions} className="px-3 py-2 border border-silver-muted/15 hover:bg-white/5 rounded-xl text-xs font-semibold text-silver-light shrink-0">
            Refresh
          </button>
        </form>
      </div>

      <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-primary-glow" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-20 text-center text-silver-muted">
            <span className="text-4xl">📜</span>
            <p className="text-sm mt-2">{activeQuery ? `No transaction records found matching "${activeQuery}".` : 'No transaction records found in the database.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-silver-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-4 py-4">Reference</th>
                  <th className="px-3 py-4">User Details</th>
                  <th className="px-4 py-4">Service / Type</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4 font-mono text-xs text-primary-glow select-all">{tx.reference}</td>
                    <td className="px-3 py-4 space-y-0.5">
                      <p className="font-semibold text-white text-sm">{tx.fullName}</p>
                      <p className="text-xs text-silver-muted">{tx.email}</p>
                    </td>
                    {/* Service + Type combined */}
                    <td className="px-4 py-4">
                      <p className="font-semibold text-white capitalize text-sm">{tx.service}</p>
                      <span className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        tx.status === 'failed'
                          ? 'bg-white/5 text-silver-muted border border-silver-muted/20'
                          : tx.type === 'credit'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {tx.status === 'failed' ? 'failed' : tx.type}
                      </span>
                    </td>
                    <td className={`px-4 py-4 font-mono ${tx.status === 'failed' ? 'text-silver-muted line-through font-normal' : 'font-bold text-white'}`}>
                      ₦{tx.amount.toLocaleString()}
                    </td>
                    {/* Status + Date combined */}
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : tx.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {tx.status}
                      </span>
                      <p className="text-[10px] text-silver-muted mt-1.5 leading-tight">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right space-x-1.5 whitespace-nowrap">
                      {tx.status !== 'success' && (
                        <button
                          onClick={() => makeSuccessful(tx.id)}
                          className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                          title="Force Mark Successful"
                        >
                          Mark Success
                        </button>
                      )}
                      {(tx.service === 'data' || tx.service === 'airtime') && (
                        <button
                          onClick={() => requeryTransaction(tx.id)}
                          className="text-[10px] font-bold px-2 py-1 rounded bg-blue-500/10 text-primary-glow border border-primary-blue/20 hover:bg-primary-blue/20 transition-all"
                          title="Requery status from provider"
                        >
                          Requery
                        </button>
                      )}
                      {tx.status === 'failed' && !tx.metadata?.refunded && (
                        <button
                          onClick={() => refundTransaction(tx.id)}
                          className="text-[10px] font-bold px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                          title="Refund to user wallet"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
