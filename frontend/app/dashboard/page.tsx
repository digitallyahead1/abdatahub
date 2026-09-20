'use client'

import { useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthContext } from '@/context/AuthContext'
import api from '@/lib/api'
import { Transaction } from '@/types'
import TransactionReceiptModal from '@/components/dashboard/TransactionReceiptModal'
import { toast } from 'sonner'

export default function DashboardPage() {
  const auth = useContext(AuthContext)
  const router = useRouter()
  const [balance, setBalance] = useState({ balance: 0, ledgerBalance: 0, currency: 'NGN' })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({ totalCount: 0, successCount: 0, referralEarnings: 0 })
  const [showBalance, setShowBalance] = useState(true)

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null)

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      // Fetch wallet balance
      const balanceRes = await api.get('/wallet/balance')
      setBalance(balanceRes.data.data)

      // Fetch transaction history (recent 10)
      const txRes = await api.get('/transactions?limit=10')
      setTransactions(txRes.data.data ? txRes.data.data.slice(0, 10) : [])

      // Fetch stats
      const statsRes = await api.get('/wallet/stats')
      setStats(statsRes.data.data)

      if (isRefresh) {
        toast.success('Dashboard refreshed')
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      if (isRefresh) {
        toast.error('Failed to refresh dashboard')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (auth && !auth.isLoading && !auth.isAuthenticated) {
      router.push('/login')
      return
    }

    if (auth?.isAuthenticated) {
      fetchData()
    }
  }, [auth, router])

  const handleViewReceipt = (tx: Transaction) => {
    setSelectedReceiptTx(tx)
    setReceiptModalOpen(true)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  // Quick Services list
  const quickActions = [
    {
      name: 'Buy Data',
      path: '/dashboard/data',
      color: 'from-blue-600/25 to-blue-900/40 border-blue-500/30 text-blue-400 hover:border-blue-400/60',
      iconBg: 'bg-blue-500/20 text-blue-400',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      badge: 'Popular',
    },
    {
      name: 'Buy Airtime',
      path: '/dashboard/airtime',
      color: 'from-emerald-600/25 to-emerald-900/40 border-emerald-500/30 text-emerald-400 hover:border-emerald-400/60',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      badge: 'Instant',
    },
    {
      name: 'Cable TV',
      path: '/dashboard/cable',
      color: 'from-violet-600/25 to-purple-900/40 border-violet-500/30 text-violet-400 hover:border-violet-400/60',
      iconBg: 'bg-violet-500/20 text-violet-400',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      ),
    },
    {
      name: 'Electricity',
      path: '/dashboard/electricity',
      color: 'from-amber-600/25 to-amber-900/40 border-amber-500/30 text-amber-400 hover:border-amber-400/60',
      iconBg: 'bg-amber-500/20 text-amber-400',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      name: 'Exam Pins',
      path: '/dashboard/exam-pins',
      color: 'from-pink-600/25 to-rose-900/40 border-pink-500/30 text-pink-400 hover:border-pink-400/60',
      iconBg: 'bg-pink-500/20 text-pink-400',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Airtime to Cash',
      path: 'https://chat.whatsapp.com/G40DE7gJE5i3AEFTOYUmec?s=cl&p=a&mlu=4&ilr=4',
      color: 'from-orange-600/25 to-orange-900/40 border-orange-500/30 text-orange-400 hover:border-orange-400/60',
      iconBg: 'bg-orange-500/20 text-orange-400',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      isExternal: true,
      badge: 'WhatsApp',
    },
    {
      name: 'Fund Wallet',
      path: '/dashboard/wallet',
      color: 'from-cyan-600/25 to-blue-900/40 border-cyan-500/30 text-cyan-400 hover:border-cyan-400/60',
      iconBg: 'bg-cyan-500/20 text-cyan-400',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Community',
      path: 'https://chat.whatsapp.com/G40DE7gJE5i3AEFTOYUmec?s=cl&p=a&mlu=4&ilr=4',
      color: 'from-teal-600/25 to-emerald-900/40 border-teal-500/30 text-teal-400 hover:border-teal-400/60',
      iconBg: 'bg-teal-500/20 text-teal-400',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      isExternal: true,
      badge: 'Group',
    },
  ]

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'data':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        )
      case 'airtime':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
        )
      case 'cable':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
        )
      case 'electricity':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        )
      case 'exam-pin':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )
      case 'deposit':
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary-glow/10 border border-primary-glow/20 text-primary-glow flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        )
    }
  }

  const formatTxDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    } catch {
      return dateStr
    }
  }

  const getTxDescription = (tx: Transaction) => {
    const meta = tx.metadata || {}
    const plan = meta.planName || meta.plan
    const recipient = meta.phoneNumber || meta.phone || meta.recipient || meta.meterNumber || meta.smartCardNumber
    const network = meta.network || meta.operator || meta.provider || meta.disco

    if (plan && recipient) {
      return `${plan} • ${recipient}`
    }
    if (plan) return plan
    if (network && recipient) {
      return `${network} • ${recipient}`
    }
    if (recipient) return recipient
    if (network) return network
    if (tx.service === 'deposit') return 'Wallet Top-up via Dedicated Account'
    return `Transaction Ref: ${tx.reference.substring(0, 10)}...`
  }

  if (loading || auth?.isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <svg className="animate-spin h-10 w-10 text-primary-glow" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-xs text-silver-muted font-medium">Loading your dashboard...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. TOP CARDS: Wallet Balance (and Referral on desktop) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Wallet Balance Card */}
        <div className="lg:col-span-2 p-5 sm:p-7 bg-gradient-to-br from-dark-bg-secondary via-dark-bg-secondary/95 to-dark-bg border border-silver-muted/15 rounded-2xl sm:rounded-3xl relative overflow-hidden shadow-xl group hover:border-primary-glow/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-44 h-44 bg-primary-glow/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-primary-blue/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-silver-muted uppercase tracking-wider">Available Balance</span>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="text-silver-muted hover:text-white transition-colors p-1"
                    title={showBalance ? 'Hide balance' : 'Show balance'}
                  >
                    {showBalance ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fetchData(true)}
                    disabled={refreshing}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-silver-muted hover:text-white transition-all disabled:opacity-50"
                    title="Refresh Balance"
                  >
                    <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary-glow' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                    Live
                  </span>
                </div>
              </div>

              <div className="mt-2 flex items-baseline gap-2">
                <p className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight">
                  {showBalance ? (
                    `₦${balance.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  ) : (
                    '••••••••••'
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5 text-xs">
              <div className="text-silver-muted">
                Ledger Balance: <span className="font-mono text-white font-semibold">₦{balance.ledgerBalance.toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/wallet"
                  className="px-4 py-2 bg-gradient-to-r from-primary-blue to-primary-glow hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-primary-blue/20 transition-all active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Fund Wallet</span>
                </Link>
                <Link
                  href="/dashboard/transactions"
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-silver-light hover:text-white font-semibold rounded-xl text-xs border border-white/10 transition-all"
                >
                  History
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Card (Desktop view) */}
        <div className="hidden lg:flex flex-col justify-between p-6 bg-gradient-to-br from-dark-bg-secondary to-dark-bg border border-silver-muted/15 rounded-3xl relative overflow-hidden shadow-xl group hover:border-primary-glow/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-glow/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-silver-muted uppercase tracking-wider">Referral Earnings</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-glow/15 text-primary-glow border border-primary-glow/30">
                Passive Income
              </span>
            </div>
            <p className="text-3xl font-extrabold text-primary-glow mt-2 font-mono">
              ₦{stats.referralEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-2">
            <p className="text-xs text-silver-muted">Your Referral Code:</p>
            <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl px-3 py-2">
              <span className="font-mono text-sm font-bold text-white tracking-wider">
                {auth?.user?.referralCode || 'AB-DATA'}
              </span>
              <button
                onClick={() => copyToClipboard(auth?.user?.referralCode || '', 'Referral code')}
                className="text-xs text-primary-glow hover:text-cyan-300 font-semibold flex items-center space-x-1 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>Copy</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. QUICK SERVICES: Displayed right at top on mobile */}
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-primary-glow animate-pulse" />
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">Quick Services</h3>
          </div>
          <span className="text-xs text-silver-muted font-medium">Instant Automated Processing</span>
        </div>

        {/* High-density grid: 4 columns on mobile, 4 columns on tablet, 8 columns on desktop */}
        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3.5">
          {quickActions.map((act) => {
            const content = (
              <>
                {act.badge && (
                  <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-white/10 text-white border border-white/10 uppercase tracking-tighter">
                    {act.badge}
                  </span>
                )}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${act.iconBg} flex items-center justify-center mb-1.5 sm:mb-2 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  {act.icon}
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-white text-center line-clamp-1 leading-tight">
                  {act.name}
                </span>
              </>
            )

            if (act.isExternal) {
              return (
                <a
                  key={act.name}
                  href={act.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2.5 sm:p-4 bg-gradient-to-b ${act.color} border rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-lg relative group`}
                >
                  {content}
                </a>
              )
            }

            return (
              <Link
                key={act.name}
                href={act.path}
                className={`p-2.5 sm:p-4 bg-gradient-to-b ${act.color} border rounded-2xl flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-lg relative group`}
              >
                {content}
              </Link>
            )
          })}
        </div>
      </section>

      {/* 3. RECENT TRANSACTIONS: Modern, descriptive, visible */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <h3 className="text-base sm:text-lg font-bold text-white">Recent Transactions</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/10 text-silver-light">
              {transactions.length} Latest
            </span>
          </div>
          <Link
            href="/dashboard/transactions"
            className="text-xs text-primary-glow hover:text-cyan-300 font-semibold flex items-center space-x-1 group transition-colors"
          >
            <span>View Full History</span>
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        <div className="bg-dark-bg-secondary/60 border border-silver-muted/15 rounded-2xl sm:rounded-3xl glass-dark overflow-hidden shadow-xl">
          {transactions.length === 0 ? (
            <div className="py-14 sm:py-20 text-center text-silver-muted space-y-3 px-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-silver-muted border border-white/5">
                <svg className="w-7 h-7 text-silver-muted/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">No transactions yet</p>
                <p className="text-xs text-silver-muted max-w-sm mx-auto">
                  Your recent data purchases, airtime recharges, and bill payments will appear right here.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/dashboard/data"
                  className="inline-flex items-center px-4 py-2 bg-gradient-blue text-white rounded-xl text-xs font-bold hover:shadow-glow-blue transition-all"
                >
                  Purchase Data Now
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02] text-silver-muted text-[11px] font-semibold uppercase tracking-wider">
                      <th className="px-6 py-3.5">Service &amp; Details</th>
                      <th className="px-6 py-3.5">Reference</th>
                      <th className="px-6 py-3.5">Date / Time</th>
                      <th className="px-6 py-3.5">Amount</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((tx) => {
                      const isCredit = tx.type === 'credit'
                      const isFailed = tx.status === 'failed'
                      const isSuccess = tx.status === 'success'

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                          onClick={() => handleViewReceipt(tx)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {getServiceIcon(tx.service)}
                              <div className="space-y-0.5 min-w-0">
                                <p className="font-bold text-white capitalize text-sm">
                                  {tx.service === 'exam-pin' ? 'Exam Pin' : tx.service}
                                </p>
                                <p className="text-xs text-silver-muted truncate max-w-xs">
                                  {getTxDescription(tx)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyToClipboard(tx.reference, 'Reference')
                              }}
                              className="font-mono text-xs text-primary-glow hover:underline flex items-center space-x-1"
                              title="Click to copy reference"
                            >
                              <span>{tx.reference.substring(0, 12)}...</span>
                              <svg className="w-3 h-3 text-silver-muted opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </td>

                          <td className="px-6 py-4 text-xs text-silver-muted whitespace-nowrap">
                            {formatTxDate(tx.createdAt)}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`font-mono font-bold text-sm ${
                              isFailed
                                ? 'text-silver-muted line-through'
                                : isCredit
                                ? 'text-emerald-400'
                                : 'text-white'
                            }`}>
                              {isFailed ? '' : isCredit ? '+' : '-'}₦{tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                              isSuccess
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : isFailed
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                isSuccess ? 'bg-emerald-400' : isFailed ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'
                              }`} />
                              {tx.status}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewReceipt(tx)
                              }}
                              className="px-3 py-1 bg-white/5 hover:bg-primary-blue/20 text-silver-light hover:text-white rounded-lg text-xs font-semibold border border-white/10 hover:border-primary-glow/30 transition-all inline-flex items-center space-x-1"
                            >
                              <span>Receipt</span>
                              <svg className="w-3 h-3 text-primary-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-white/5">
                {transactions.map((tx) => {
                  const isCredit = tx.type === 'credit'
                  const isFailed = tx.status === 'failed'
                  const isSuccess = tx.status === 'success'

                  return (
                    <div
                      key={tx.id}
                      onClick={() => handleViewReceipt(tx)}
                      className="p-4 flex items-center justify-between gap-3 active:bg-white/5 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {getServiceIcon(tx.service)}
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-bold text-white text-sm capitalize truncate">
                            {tx.service === 'exam-pin' ? 'Exam Pin' : tx.service}
                          </p>
                          <p className="text-xs text-silver-muted truncate max-w-[180px]">
                            {getTxDescription(tx)}
                          </p>
                          <p className="text-[10px] text-silver-muted/80 font-mono">
                            {formatTxDate(tx.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right space-y-1 shrink-0">
                        <p className={`font-mono font-bold text-sm ${
                          isFailed
                            ? 'text-silver-muted line-through'
                            : isCredit
                            ? 'text-emerald-400'
                            : 'text-white'
                        }`}>
                          {isFailed ? '' : isCredit ? '+' : '-'}₦{tx.amount.toLocaleString()}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isFailed
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          <span className={`w-1 h-1 rounded-full mr-1 ${
                            isSuccess ? 'bg-emerald-400' : isFailed ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'
                          }`} />
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
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
