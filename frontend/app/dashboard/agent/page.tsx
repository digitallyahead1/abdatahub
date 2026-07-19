'use client'

import { useContext, useState } from 'react'
import { AuthContext } from '@/context/AuthContext'
import api from '@/lib/api'
import { toast } from 'sonner'

export default function BecomeAgentPage() {
  const auth = useContext(AuthContext)
  const [submitting, setSubmitting] = useState(false)

  const handleApply = async () => {
    setSubmitting(true)
    try {
      const response = await api.post('/users/apply-agent')
      if (response.data.success) {
        if (auth?.updateUser) {
          auth.updateUser(response.data.data)
        }
        toast.success('Application Submitted! Your request is now pending approval.')
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

        {/* Action area */}
        <div className="pt-6 flex flex-col items-center justify-center border-t border-silver-muted/10 text-center space-y-4">
          {agentStatus === 'none' && (
            <>
              <p className="text-sm text-silver-muted">Click the button below to request an upgrade to an Agent account.</p>
              <button
                onClick={handleApply}
                disabled={submitting}
                className="px-8 py-3 bg-gradient-to-r from-primary-blue to-primary-glow hover:opacity-90 disabled:opacity-50 text-dark-bg font-bold rounded-xl shadow-lg transition-all duration-200"
              >
                {submitting ? 'Submitting Request...' : 'Apply to Become Agent'}
              </button>
            </>
          )}

          {agentStatus === 'pending' && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl max-w-md">
              <p className="text-sm text-amber-400 font-medium">
                Your agent application is currently under review by our administration. Once approved, your account pricing will update automatically.
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
              <button
                onClick={handleApply}
                disabled={submitting}
                className="px-6 py-2 bg-gradient-to-r from-primary-blue to-primary-glow hover:opacity-90 disabled:opacity-50 text-dark-bg text-xs font-bold rounded-lg shadow-md transition-all duration-200"
              >
                Re-apply for Agent Status
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
