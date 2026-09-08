'use client'

import { useContext, useState } from 'react'
import { AuthContext } from '@/context/AuthContext'
import api from '@/lib/api'
import { toast } from 'sonner'
import Link from 'next/link'

const AGENT_FEE = 3000

export default function BecomeAgentPage() {
  const auth = useContext(AuthContext)
  const [submitting, setSubmitting] = useState(false)

  const walletBalance = Number(auth?.user?.walletBalance || 0)
  const hasSufficientBalance = walletBalance >= AGENT_FEE

  const handleApply = async () => {
    if (!hasSufficientBalance) {
      toast.error(`Insufficient wallet balance. You need at least ₦${AGENT_FEE.toLocaleString()} to apply for Agent status. Please fund your wallet.`)
      return
    }

    const confirmed = window.confirm(
      `Confirm Payment:\n\nA fee of ₦${AGENT_FEE.toLocaleString()} will be debited from your wallet balance to submit your Agent application.\n\nDo you want to proceed?`
    )
    if (!confirmed) return

    setSubmitting(true)
    try {
      const response = await api.post('/users/apply-agent')
      if (response.data.success) {
        if (auth?.updateUser && auth.user) {
          auth.updateUser({
            ...auth.user,
            agentStatus: 'pending',
            walletBalance: Math.max(0, walletBalance - AGENT_FEE),
          })
        }
        toast.success(`Application Submitted! ₦${AGENT_FEE.toLocaleString()} has been debited from your wallet. Your request is now pending approval.`)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const agentStatus = auth?.user?.agentStatus || 'none'

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-silver-light">Agent Services</h1>
        <p className="text-sm text-silver-muted mt-1">Upgrade your account to Agent status and enjoy reseller prices</p>
      </div>

      {/* Main card */}
      <div className="bg-dark-bg-secondary rounded-2xl border border-silver-muted/10 p-8 space-y-6 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-glow/20 rounded-full blur-3xl" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-silver-light">Why become an Agent?</h2>
            <p className="text-sm text-silver-muted max-w-lg">
              As an approved agent on AB Data Hub, you get access to discounted reseller rates for mobile data, airtime, and exam checkers. Perfect for resellers, students, and businesses.
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center space-x-3 shrink-0">
            <span className="text-sm text-silver-muted">Status:</span>
            {agentStatus === 'none' && (
              <span className="px-3 py-1 bg-silver-muted/10 text-silver-muted text-xs font-semibold rounded-full uppercase tracking-wider">
                Not Applied
              </span>
            )}
            {agentStatus === 'pending' && (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full uppercase tracking-wider animate-pulse">
                Pending Approval
              </span>
            )}
            {agentStatus === 'approved' && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                Approved Agent
              </span>
            )}
            {agentStatus === 'rejected' && (
              <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                Rejected
              </span>
            )}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-silver-muted/10">
          <div className="bg-dark-bg rounded-xl p-4 border border-silver-muted/5 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary-blue/20 flex items-center justify-center text-primary-glow">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="font-semibold text-silver-light text-sm">Reseller Data Pricing</h3>
            <p className="text-xs text-silver-muted">Save significantly on every gigabyte of MTN, Airtel, Glo, and 9mobile data plans.</p>
          </div>

          <div className="bg-dark-bg rounded-xl p-4 border border-silver-muted/5 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-silver-light text-sm">Discounted Airtime</h3>
            <p className="text-xs text-silver-muted">Enjoy cheaper rates for top-ups on all networks with instant automated delivery.</p>
          </div>

          <div className="bg-dark-bg rounded-xl p-4 border border-silver-muted/5 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-silver-light text-sm">Bulk Exam Checkers</h3>
            <p className="text-xs text-silver-muted">Purchase WAEC result checker PINs and NECO tokens at low wholesale rates.</p>
          </div>
        </div>

        {/* Application Fee Notice Box (For Not Applied & Rejected States) */}
        {(agentStatus === 'none' || agentStatus === 'rejected') && (
          <div className="p-5 bg-primary-glow/5 border border-primary-glow/20 rounded-2xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-primary-glow/15 flex items-center justify-center text-primary-glow shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Agent Upgrade Fee: ₦{AGENT_FEE.toLocaleString()}</h4>
                  <p className="text-xs text-silver-muted">One-time payment deducted directly from your wallet</p>
                </div>
              </div>

              {/* Wallet Balance Display */}
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-silver-muted uppercase tracking-wider block">Your Wallet Balance</span>
                <span className={`text-sm font-bold font-mono ${hasSufficientBalance ? 'text-emerald-400' : 'text-red-400'}`}>
                  ₦{walletBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Note telling the user about payment */}
            <div className="p-3 bg-dark-bg/60 border border-white/5 rounded-xl text-xs text-silver-muted space-y-1">
              <p className="font-semibold text-silver-light flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Important Application Note:
              </p>
              <p>
                You must pay a one-time application fee of <strong className="text-white font-bold">₦{AGENT_FEE.toLocaleString()}</strong> from your wallet balance to submit your Agent request. This amount will be debited automatically upon application submission.
              </p>
            </div>

            {/* Insufficient balance warning and fund button */}
            {!hasSufficientBalance && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Your wallet balance is below ₦{AGENT_FEE.toLocaleString()}. Please fund your wallet before applying.</span>
                </div>
                <Link
                  href="/dashboard/wallet"
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-xs transition-all text-center shrink-0"
                >
                  Fund Wallet
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Action area */}
        <div className="pt-6 flex flex-col items-center justify-center border-t border-silver-muted/10 text-center space-y-4">
          {agentStatus === 'none' && (
            <>
              <p className="text-xs text-silver-muted">
                Clicking the button below will deduct ₦{AGENT_FEE.toLocaleString()} from your wallet and send your application for review.
              </p>
              <button
                onClick={handleApply}
                disabled={submitting || !hasSufficientBalance}
                className="px-8 py-3 bg-gradient-to-r from-primary-blue to-primary-glow hover:opacity-90 disabled:opacity-50 text-dark-bg font-bold rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 text-sm"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-dark-bg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₦{AGENT_FEE.toLocaleString()} &amp; Apply for Agent</span>
                  </>
                )}
              </button>
            </>
          )}

          {agentStatus === 'pending' && (
            <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-xl max-w-md space-y-2">
              <div className="inline-flex items-center gap-2 text-amber-400 font-bold text-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Application Under Review
              </div>
              <p className="text-xs text-silver-muted">
                Your ₦{AGENT_FEE.toLocaleString()} application fee was received. Our administration is currently reviewing your request. Once approved, your account will immediately gain agent reseller discounts.
              </p>
            </div>
          )}

          {agentStatus === 'approved' && (
            <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl max-w-md space-y-2">
              <p className="text-sm text-green-400 font-semibold">🎉 Congratulations! You are an Approved Agent.</p>
              <p className="text-xs text-silver-muted">
                You are currently logged in with active agent privileges. All services automatically reflect your discounted prices.
              </p>
            </div>
          )}

          {agentStatus === 'rejected' && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl max-w-md space-y-3">
              <p className="text-sm text-red-400 font-medium">Your agent application was not approved.</p>
              <p className="text-xs text-silver-muted">
                You can re-apply by making the ₦{AGENT_FEE.toLocaleString()} application fee payment again.
              </p>
              <button
                onClick={handleApply}
                disabled={submitting || !hasSufficientBalance}
                className="px-6 py-2.5 bg-gradient-to-r from-primary-blue to-primary-glow hover:opacity-90 disabled:opacity-50 text-dark-bg text-xs font-bold rounded-lg shadow-md transition-all duration-200"
              >
                {submitting ? 'Processing Payment...' : `Re-apply (₦${AGENT_FEE.toLocaleString()})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
