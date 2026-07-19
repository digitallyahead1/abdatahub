'use client'

import { useContext, useEffect, useState } from 'react'
import { AuthContext } from '@/context/AuthContext'
import api from '@/lib/api'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface AgentRequest {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  role: string
  agentStatus: string
  agentAppliedAt: string
  createdAt: string
}

export default function AgentRequestsPage() {
  const auth = useContext(AuthContext)
  const router = useRouter()
  const [requests, setRequests] = useState<AgentRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      const response = await api.get('/admin/agent-requests')
      if (response.data.success) {
        setRequests(response.data.data)
      }
    } catch (err: any) {
      console.error('Failed to fetch agent requests:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleApprove = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to approve ${name} as an agent?`)) return

    try {
      const response = await api.post(`/admin/agent-requests/${id}/approve`)
      if (response.data.success) {
        toast.success(`${name} is now an approved agent!`)
        fetchRequests()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not approve request.')
    }
  }

  const handleReject = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to reject ${name}'s agent request?`)) return

    try {
      const response = await api.post(`/admin/agent-requests/${id}/reject`)
      if (response.data.success) {
        toast.success(`${name}'s request has been rejected.`)
        fetchRequests()
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not reject request.')
    }
  }

  const handleImpersonate = async (id: string, name: string) => {
    if (!window.confirm(`You will be logged into ${name}'s account. You can revert back to Admin anytime from the banner. Continue?`)) return

    try {
      if (auth?.impersonate) {
        await auth.impersonate(id)
        toast.success(`Logging in as ${name}...`)
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not impersonate user.')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-silver-light">Agent Requests</h1>
        <p className="text-sm text-silver-muted mt-1">Review and manage user agent applications and access accounts</p>
      </div>

      {/* Main Table Card */}
      <div className="bg-dark-bg-secondary rounded-2xl border border-silver-muted/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-silver-muted/10 bg-white/5 text-silver-light text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Contact Info</th>
                <th className="py-4 px-6">Date Requested</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver-muted/5 text-sm text-silver-muted">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <svg className="animate-spin h-8 w-8 text-primary-glow mx-auto" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-silver-muted">
                    No agent requests found.
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/[0.02] transition-all">
                    <td className="py-4 px-6 font-semibold text-silver-light">{req.fullName}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span>{req.email}</span>
                        <span className="text-xs text-silver-muted/70">{req.phoneNumber}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs">
                      {req.agentAppliedAt ? new Date(req.agentAppliedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {req.agentStatus === 'pending' && (
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                          Pending
                        </span>
                      )}
                      {req.agentStatus === 'approved' && (
                        <span className="px-2.5 py-1 bg-green-500/10 text-green-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                          Approved
                        </span>
                      )}
                      {req.agentStatus === 'rejected' && (
                        <span className="px-2.5 py-1 bg-red-500/10 text-red-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                          Rejected
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                      {req.agentStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(req.id, req.fullName)}
                            className="px-3 py-1.5 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-dark-bg text-xs font-semibold rounded-lg transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req.id, req.fullName)}
                            className="px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-xs font-semibold rounded-lg transition-all"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => handleImpersonate(req.id, req.fullName)}
                        className="px-3 py-1.5 bg-primary-blue/10 text-primary-glow hover:bg-primary-blue hover:text-dark-bg text-xs font-semibold rounded-lg transition-all"
                      >
                        Login as Agent
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
