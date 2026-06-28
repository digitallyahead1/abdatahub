'use client'

import { useContext, useState, useEffect } from 'react'
import { AuthContext } from '@/context/AuthContext'
import api from '@/lib/api'
import { toast } from 'sonner'

interface ReferredUser {
  id: string
  fullName: string
  email: string
  createdAt: string
  status: string
}

export default function ReferralsPage() {
  const auth = useContext(AuthContext)
  const [loading, setLoading] = useState(true)
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([])
  const [earnings, setEarnings] = useState(0)

  const referralCode = auth?.user?.referralCode || 'ABDATAHUB'
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${referralCode}` : ''

  const fetchReferrals = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/referrals')
      setReferredUsers(response.data.data.referredUsers)
      setEarnings(response.data.data.earnings)
    } catch (err) {
      console.error('Error fetching referrals:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (auth?.isAuthenticated) {
      fetchReferrals()
    }
  }, [auth])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Referral link copied to clipboard!')
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-wide">Referral Program</h1>
        <p className="text-sm text-silver-muted">
          Invite friends to register on AB Data Hub and earn ₦500 commission on their first wallet funding!
        </p>
      </div>

      {/* Stats and Referral Link copy box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-6 bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark space-y-4">
          <h3 className="font-bold text-white text-sm">Your Referral Link</h3>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white text-xs font-mono select-all focus:outline-none"
            />
            <button
              onClick={() => copyToClipboard(referralLink)}
              className="px-5 py-3 bg-gradient-blue text-white font-bold rounded-xl shadow-glow-blue hover:opacity-90 transition-all text-xs shrink-0"
            >
              Copy Link
            </button>
          </div>
        </div>

        <div className="p-6 bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark flex flex-col justify-center items-center text-center space-y-1">
          <p className="text-xs text-silver-muted uppercase font-semibold">Referral Commission</p>
          <p className="text-3xl font-extrabold text-primary-glow font-mono">₦{earnings.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-400 font-medium mt-1">✓ Credited automatically</span>
        </div>
      </div>

      {/* List of Referred accounts */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-wide">My Referrals ({referredUsers.length})</h2>
        
        <div className="bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark overflow-hidden">
          {loading ? (
            <div className="py-12 flex justify-center">
              <svg className="animate-spin h-8 w-8 text-primary-glow" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : referredUsers.length === 0 ? (
            <div className="py-12 text-center text-silver-muted space-y-2">
              <span className="text-4xl">👥</span>
              <p className="text-sm">You haven't referred anyone yet. Share your link to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-silver-muted text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Full Name</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Register Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {referredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{user.fullName}</td>
                      <td className="px-6 py-4 text-silver-muted">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-silver-muted">
                        {new Date(user.createdAt).toLocaleDateString()}
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
