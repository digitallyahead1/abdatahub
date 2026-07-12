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

interface VirtualAccount {
  accountNumber: string
  accountName: string
  bankName: string
}

export default function FundWalletPage() {
  // Tabs: 'palmpay' (Permanent) or 'monnify' (Permanent)
  const [gateway, setGateway] = useState<'palmpay' | 'monnify'>('palmpay')
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  
  // Data states
  const [history, setHistory] = useState<HistoryRecord[]>([])
  
  // Monnify states
  const [monnifyAccount, setMonnifyAccount] = useState<VirtualAccount | null>(null)
  const [monnifyLoading, setMonnifyLoading] = useState(true)
  
  // PalmPay (Gafiapay under-the-hood) states
  const [palmpayAccount, setPalmpayAccount] = useState<VirtualAccount | null>(null)
  const [palmpayLoading, setPalmpayLoading] = useState(true)

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

  // Load Monnify account details
  const loadMonnifyAccount = async () => {
    try {
      setMonnifyLoading(true)
      const response = await api.get('/user/monnify-account')
      if (response.data.exists && response.data.account) {
        setMonnifyAccount(response.data.account)
      } else {
        setMonnifyAccount(null)
      }
    } catch (err) {
      console.error('Failed to load Monnify account:', err)
    } finally {
      setMonnifyLoading(false)
    }
  }

  // Generate Monnify account
  const generateMonnifyAccount = async () => {
    setLoading(true)
    try {
      const response = await api.post('/user/monnify-account/generate')
      if (response.data.success && response.data.account) {
        setMonnifyAccount(response.data.account)
        toast.success('Permanent Monnify virtual account generated!')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate Monnify account. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // Load PalmPay (Gafiapay) account details
  const loadPalmpayAccount = async () => {
    try {
      setPalmpayLoading(true)
      const response = await api.get('/user/gafiapay/active')
      if (response.data.exists && response.data.account) {
        setPalmpayAccount(response.data.account)
      } else {
        setPalmpayAccount(null)
      }
    } catch (err) {
      console.error('Failed to load PalmPay account:', err)
    } finally {
      setPalmpayLoading(false)
    }
  }

  // Generate PalmPay (Gafiapay) account
  const generatePalmpayAccount = async () => {
    setLoading(true)
    try {
      const response = await api.post('/user/gafiapay/generate')
      if (response.data.success && response.data.account) {
        setPalmpayAccount(response.data.account)
        toast.success('Permanent PalmPay virtual account generated!')
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate PalmPay account. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  // Load everything on mount
  useEffect(() => {
    fetchHistory()
    loadMonnifyAccount()
    loadPalmpayAccount()
  }, [])

  return (
    <div className="space-y-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-wide">Fund Your Wallet</h1>
          <p className="text-sm text-silver-muted">
            Add funds instantly to your wallet using secure payment providers
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-dark-bg-secondary/40 border border-silver-muted/10 p-1 rounded-xl">
          <button
            onClick={() => setGateway('palmpay')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase transition-all ${
              gateway === 'palmpay'
                ? 'bg-gradient-blue text-white shadow-glow-blue'
                : 'text-silver-muted hover:text-white'
            }`}
          >
            PalmPay (Permanent)
          </button>
          <button
            disabled
            className="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase transition-all text-silver-muted/40 cursor-not-allowed bg-black/10 border border-transparent"
            title="Monnify integration is not available yet"
          >
            Monnify (Unavailable)
          </button>
        </div>

        {/* Gateway Content */}
        <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 p-6 rounded-2xl glass-dark glow-blue">
          {gateway === 'palmpay' ? (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-white">Pay with PalmPay</h3>
                <p className="text-xs text-silver-muted">
                  Your permanent PalmPay reserved bank details. Transfer any amount anytime to fund instantly.
                </p>
              </div>

              {palmpayLoading ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin h-6 w-6 border-2 border-primary-glow border-t-transparent rounded-full" />
                </div>
              ) : palmpayAccount ? (
                <div className="bg-dark-bg/60 border border-silver-muted/10 rounded-xl p-4 space-y-3 font-mono text-sm text-silver-light">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-silver-muted">Account Name:</span>
                    <span className="font-semibold text-white">{palmpayAccount.accountName}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2 items-center">
                    <span className="text-silver-muted">Account Number:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white text-base tracking-wider">{palmpayAccount.accountNumber}</span>
                      <button
                        onClick={() => handleCopy(palmpayAccount.accountNumber, 'Account number')}
                        className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-primary-glow hover:bg-white/10"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-silver-muted">Bank Name:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">{palmpayAccount.bankName}</span>
                      <button
                        onClick={() => handleCopy(palmpayAccount.bankName, 'Bank name')}
                        className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-primary-glow hover:bg-white/10"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={generatePalmpayAccount}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-blue hover:opacity-95 text-white font-bold rounded-xl shadow-glow-blue transition-all disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
                >
                  {loading ? 'Generating...' : 'Generate PalmPay Reserved Account'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-white">Pay with Monnify</h3>
                <p className="text-xs text-silver-muted">
                  Your permanent bank account details. Transfer any amount anytime to fund instantly.
                </p>
              </div>

              {monnifyLoading ? (
                <div className="py-8 flex justify-center">
                  <div className="animate-spin h-6 w-6 border-2 border-primary-glow border-t-transparent rounded-full" />
                </div>
              ) : monnifyAccount ? (
                <div className="bg-dark-bg/60 border border-silver-muted/10 rounded-xl p-4 space-y-3 font-mono text-sm text-silver-light">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-silver-muted">Account Name:</span>
                    <span className="font-semibold text-white">{monnifyAccount.accountName}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2 items-center">
                    <span className="text-silver-muted">Account Number:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white text-base tracking-wider">{monnifyAccount.accountNumber}</span>
                      <button
                        onClick={() => handleCopy(monnifyAccount.accountNumber, 'Account number')}
                        className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-primary-glow hover:bg-white/10"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-silver-muted">Bank Name:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">{monnifyAccount.bankName}</span>
                      <button
                        onClick={() => handleCopy(monnifyAccount.bankName, 'Bank name')}
                        className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-primary-glow hover:bg-white/10"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={generateMonnifyAccount}
                  disabled={true}
                  className="w-full py-3 bg-white/5 text-silver-muted font-bold rounded-xl transition-all cursor-not-allowed text-sm flex items-center justify-center space-x-2"
                >
                  Monnify Unavailable
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ledger History List */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-white tracking-wide">Wallet History Logs</h2>
          <button 
            onClick={fetchHistory}
            className="text-xs bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-primary-glow hover:bg-white/10 transition-all font-bold"
          >
            Refresh
          </button>
        </div>
        
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
