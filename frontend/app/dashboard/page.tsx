'use client'

import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthContext } from '@/context/AuthContext'
import api from '@/lib/api'
import { Transaction } from '@/types'
import TransactionReceiptModal from '@/components/dashboard/TransactionReceiptModal'

export default function DashboardPage() {
  const auth = useContext(AuthContext)
  const router = useRouter()
  const [balance, setBalance] = useState({ balance: 0, ledgerBalance: 0, currency: 'NGN' })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalCount: 0, successCount: 0, referralEarnings: 0 })

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null)

  useEffect(() => {
    if (auth && !auth.isLoading && !auth.isAuthenticated) {
      router.push('/login')
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        // Fetch wallet balance
        const balanceRes = await api.get('/wallet/balance')
        setBalance(balanceRes.data.data)

        // Fetch transaction history
        const txRes = await api.get('/transactions')
        setTransactions(txRes.data.data.slice(0, 5)) // Get recent 5

        // Fetch stats
        const statsRes = await api.get('/wallet/stats')
        setStats(statsRes.data.data)
      } catch (err) {
        console.error('Error loading dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (auth?.isAuthenticated) {
      fetchData()
    }
  }, [auth, router])

  const handleViewReceipt = (tx: Transaction) => {
    setSelectedReceiptTx(tx)
    setReceiptModalOpen(true)
  }

  const quickActions = [
    { name: 'Fund Wallet', path: '/dashboard/wallet', color: 'from-primary-blue/20 to-primary-glow/10 border-primary-glow/25 text-primary-glow', icon: '💰' },
    { name: 'Buy Data', path: '/dashboard/data', color: 'from-blue-600/20 to-blue-500/10 border-blue-500/20 text-blue-400', icon: '📶' },
    { name: 'Buy Airtime', path: '/dashboard/airtime', color: 'from-emerald-600/20 to-emerald-500/10 border-emerald-500/20 text-emerald-400', icon: '📞' },
    { name: 'Cable TV', path: '/dashboard/cable', color: 'from-violet-600/20 to-violet-500/10 border-violet-500/20 text-violet-400', icon: '📺' },
    { name: 'Electricity', path: '/dashboard/electricity', color: 'from-amber-600/20 to-amber-500/10 border-amber-500/20 text-amber-400', icon: '⚡' },
    { name: 'Exam Pins', path: '/dashboard/exam-pins', color: 'from-pink-600/20 to-pink-500/10 border-pink-500/20 text-pink-400', icon: '🎓' },
  ]

  if (loading || auth?.isLoading) {
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
    <div className="space-y-8">
      {/* Wallet overview cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Wallet Balance */}
        <div className="p-6 bg-gradient-to-br from-dark-bg-secondary to-dark-bg border border-silver-muted/10 rounded-2xl relative overflow-hidden group hover:border-primary-glow/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-glow/5 rounded-full blur-2xl" />
          <p className="text-xs font-semibold text-silver-muted uppercase tracking-wider">Available Balance</p>
          <p className="text-3xl font-extrabold text-white mt-2 font-mono">
            ₦{balance.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-between text-xs text-silver-muted mt-4 pt-4 border-t border-white/5">
            <span>Ledger: ₦{balance.ledgerBalance.toLocaleString()}</span>
            <span className="text-emerald-400 font-medium">● Live</span>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="p-6 bg-gradient-to-br from-dark-bg-secondary to-dark-bg border border-silver-muted/10 rounded-2xl relative overflow-hidden group hover:border-primary-glow/30 transition-all duration-300">
          <p className="text-xs font-semibold text-silver-muted uppercase tracking-wider">Total Transactions</p>
          <p className="text-3xl font-extrabold text-white mt-2 font-mono">{stats.totalCount}</p>
          <div className="text-xs text-silver-muted mt-4 pt-4 border-t border-white/5">
            <span>All time processed queries</span>
          </div>
        </div>

        {/* Successful Transactions */}
        <div className="p-6 bg-gradient-to-br from-dark-bg-secondary to-dark-bg border border-silver-muted/10 rounded-2xl relative overflow-hidden group hover:border-primary-glow/30 transition-all duration-300">
          <p className="text-xs font-semibold text-silver-muted uppercase tracking-wider">Success Rate</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
            {stats.totalCount > 0 ? Math.round((stats.successCount / stats.totalCount) * 100) : 100}%
          </p>
          <div className="text-xs text-silver-muted mt-4 pt-4 border-t border-white/5 flex justify-between">
            <span>Successful: {stats.successCount}</span>
            <span className="text-emerald-400">Stable</span>
          </div>
        </div>

        {/* Referral Earnings */}
        <div className="p-6 bg-gradient-to-br from-dark-bg-secondary to-dark-bg border border-silver-muted/10 rounded-2xl relative overflow-hidden group hover:border-primary-glow/30 transition-all duration-300">
          <p className="text-xs font-semibold text-silver-muted uppercase tracking-wider">Referral Earnings</p>
          <p className="text-3xl font-extrabold text-primary-glow mt-2 font-mono">
            ₦{stats.referralEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <div className="text-xs text-silver-muted mt-4 pt-4 border-t border-white/5">
            <span>Share your link to earn more</span>
          </div>
        </div>
      </section>

      {/* Quick actions grid */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-white tracking-wide">Quick Services</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {quickActions.map((act) => (
            <a
              key={act.name}
              href={act.path}
              className={`p-4 bg-gradient-to-b ${act.color} border rounded-xl flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:border-opacity-40 group`}
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{act.icon}</span>
              <span className="text-xs font-bold text-white leading-normal">{act.name}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Analytics Graph & Recent activity */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Custom Premium Chart */}
        <div className="lg:col-span-2 p-6 bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white">Usage Analytics</h3>
            <span className="text-xs text-silver-muted">Past 7 Days</span>
          </div>
          {/* Simulated Premium Graph Bars */}
          <div className="h-48 flex items-end justify-between px-2 pt-4 relative">
            {/* Grid lines */}
            <div className="absolute inset-x-0 bottom-0 border-b border-white/5" />
            <div className="absolute inset-x-0 bottom-16 border-b border-white/5" />
            <div className="absolute inset-x-0 bottom-32 border-b border-white/5" />
            
            {[
              { day: 'Mon', val: '45%' },
              { day: 'Tue', val: '65%' },
              { day: 'Wed', val: '50%' },
              { day: 'Thu', val: '80%' },
              { day: 'Fri', val: '75%' },
              { day: 'Sat', val: '90%' },
              { day: 'Sun', val: '30%' },
            ].map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1 space-y-2 z-10">
                <div className="w-8 bg-gradient-blue rounded-t-lg glow-blue group relative transition-all duration-500 ease-out" style={{ height: `calc(${d.val} * 1.5)` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary-glow text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-semibold">
                    {d.val}
                  </div>
                </div>
                <span className="text-xs text-silver-muted font-medium">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="p-6 bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark space-y-6 flex flex-col">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white">Recent Transactions</h3>
            <a href="/dashboard/transactions" className="text-xs text-primary-glow hover:underline">View All</a>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[220px] pr-1">
            {transactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <span className="text-3xl mb-2">🤷‍♂️</span>
                <p className="text-xs text-silver-muted">No transactions recorded yet.</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => handleViewReceipt(tx)}
                  className="w-full flex justify-between items-center text-sm p-3 bg-white/5 rounded-xl border border-white/5 hover:border-primary-glow/30 hover:bg-white/[0.07] transition-all duration-200 cursor-pointer group text-left"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-white capitalize">{tx.service}</p>
                    <p className="text-xs text-silver-muted font-mono">{tx.reference.substring(0, 10)}...</p>
                  </div>
                  <div className="text-right space-y-1 flex items-center gap-3">
                    <div>
                      <p className={`font-bold ${tx.status === 'failed' ? 'text-silver-muted line-through' : tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.status === 'failed' ? '' : tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                      </p>
                      <p className={`text-[10px] font-semibold uppercase ${
                        tx.status === 'success' ? 'text-emerald-400' : tx.status === 'failed' ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {tx.status}
                      </p>
                    </div>
                    {/* Small receipt icon hint */}
                    <svg className="w-4 h-4 text-silver-muted/40 group-hover:text-primary-glow transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Transaction Receipt Modal */}
      <TransactionReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => {
          setReceiptModalOpen(false)
          setSelectedReceiptTx(null)
        }}
        transaction={selectedReceiptTx}
      />
    </div>
  )
}
