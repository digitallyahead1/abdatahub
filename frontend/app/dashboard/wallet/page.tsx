'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface HistoryRecord {
  id: string
  type: string
  amount: number
  description: string
  reference: string
  createdAt: string
  previousBalance: number
  newBalance: number
}

export default function FundWalletPage() {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<'paystack' | 'flutterwave' | 'moniepoint'>('paystack')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true)
      const response = await api.get('/wallet/history')
      setHistory(response.data.data)
    } catch (err) {
      console.error('Error fetching ledger history:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt < 100) {
      toast.error('Minimum deposit amount is ₦100')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/wallet/deposit', {
        amount: amt,
        paymentMethod: method,
      })
      toast.success(response.data.message || `Wallet credited with ₦${amt.toLocaleString()} via ${method}!`)
      setAmount('')
      fetchHistory() // Refresh the transaction list
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Deposit gateway failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-wide">Fund Your Wallet</h1>
          <p className="text-sm text-silver-muted">
            Add funds instantly to your wallet using secure payment providers
          </p>
        </div>

        <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 p-6 rounded-2xl glass-dark glow-blue">
          <form onSubmit={handleFund} className="space-y-4">
            {/* Amount input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                Deposit Amount (₦)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm font-mono"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                Select Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'paystack', name: 'Paystack' },
                  { id: 'flutterwave', name: 'Flutterwave' },
                  { id: 'moniepoint', name: 'Moniepoint' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id as any)}
                    className={`py-3.5 rounded-xl border text-xs font-bold uppercase transition-all ${
                      method === m.id
                        ? 'bg-gradient-blue border-primary-glow text-white shadow-glow-blue'
                        : 'bg-white/5 border-silver-muted/10 text-silver-muted hover:text-white'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-blue hover:opacity-95 text-white font-bold rounded-xl shadow-glow-blue transition-all disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Connecting to Gateway...</span>
                </>
              ) : (
                <span>Fund Wallet</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Ledger History List */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-wide">Wallet History Logs</h2>
        
        <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark overflow-hidden">
          {historyLoading ? (
            <div className="py-20 flex justify-center">
              <svg className="animate-spin h-8 w-8 text-primary-glow" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : history.length === 0 ? (
            <div className="py-20 text-center text-silver-muted">
              <span className="text-4xl">📜</span>
              <p className="mt-2 text-sm">No transaction records found on this account.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-silver-muted text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Reference</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Previous Balance</th>
                    <th className="px-6 py-4">New Balance</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-primary-glow">{record.reference}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          record.type === 'credit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {record.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold font-mono">
                        ₦{record.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-silver-muted">₦{record.previousBalance.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono">₦{record.newBalance.toLocaleString()}</td>
                      <td className="px-6 py-4 text-silver-muted">{record.description}</td>
                      <td className="px-6 py-4 text-xs text-silver-muted">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
