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
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-white tracking-wide">System Transaction Logs</h1>
        <button onClick={fetchTransactions} className="px-4 py-2 border border-silver-muted/15 hover:bg-white/5 rounded-xl text-xs font-semibold text-silver-light">
          Refresh Logs
        </button>
      </div>

      <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-primary-glow" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 text-center text-silver-muted">
            <span className="text-4xl">📜</span>
            <p className="text-sm mt-2">No transaction records found in the database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-silver-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-primary-glow select-all">{tx.reference}</td>
                    <td className="px-6 py-4 space-y-0.5">
                      <p className="font-semibold text-white">{tx.fullName}</p>
                      <p className="text-xs text-silver-muted">{tx.email}</p>
                    </td>
                    <td className="px-6 py-4 font-semibold text-white capitalize">{tx.service}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        tx.status === 'failed'
                          ? 'bg-white/5 text-silver-muted border border-silver-muted/20'
                          : tx.type === 'credit'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {tx.status === 'failed' ? 'failed' : tx.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-mono ${tx.status === 'failed' ? 'text-silver-muted line-through font-normal' : 'font-bold text-white'}`}>
                      ₦{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : tx.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-silver-muted">
                      {new Date(tx.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
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
