'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

export default function AdminWalletPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [operation, setOperation] = useState<'credit' | 'debit' | 'reverse'>('credit')
  const [description, setDescription] = useState('')

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !amount || !description) {
      toast.error('All fields are required')
      return
    }

    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/admin/wallet/adjust', {
        email,
        amount: amt,
        operation,
        description,
      })
      toast.success(response.data.message || 'Wallet adjusted successfully!')
      setEmail('')
      setAmount('')
      setDescription('')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Wallet adjustment failed. Check user email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-wide">Manual Wallet Adjustments</h1>
        <p className="text-sm text-silver-muted">
          Credit or debit user wallets directly. Always document manual adjustments.
        </p>
      </div>

      <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 p-6 rounded-2xl glass-dark glow-blue">
        <form onSubmit={handleAdjust} className="space-y-4">
          {/* User Email */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
              User Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. client@gmail.com"
              className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm"
            />
          </div>

          {/* Operation Type */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
              Adjustment Operation
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'credit', name: 'Credit Wallet' },
                { id: 'debit', name: 'Debit Wallet' },
                { id: 'reverse', name: 'Reverse Tx' },
              ].map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setOperation(op.id as any)}
                  className={`py-3 rounded-xl border text-xs font-bold transition-all ${
                    operation === op.id
                      ? 'bg-gradient-blue border-primary-glow text-white shadow-glow-blue'
                      : 'bg-white/5 border-silver-muted/10 text-silver-muted hover:text-white'
                  }`}
                >
                  {op.name}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
              Adjustment Amount (₦)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1500"
              className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm font-mono"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
              Audit Reason / Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Promotion bonus or failed data transaction refund reference TX-129"
              rows={3}
              className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-blue hover:opacity-95 text-white font-bold rounded-xl shadow-glow-blue transition-all disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
          >
            {loading ? 'Executing Adjustment...' : 'Apply Wallet Adjustment'}
          </button>
        </form>
      </div>
    </div>
  )
}
