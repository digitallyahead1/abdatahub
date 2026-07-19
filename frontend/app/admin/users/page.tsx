'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { toast } from 'sonner'

interface AdminUserRecord {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  role: string
  status: 'active' | 'suspended'
  emailVerified: boolean
  phoneVerified: boolean
  permissions?: string[]
  createdAt: string
}

const ALL_PERMISSIONS = [
  { id: 'view:dashboard', label: 'View Dashboard Stats' },
  { id: 'manage:users', label: 'Manage Users & Roles' },
  { id: 'manage:transactions', label: 'View Transaction Logs' },
  { id: 'manage:wallet', label: 'Manual Wallet Adjustments' },
  { id: 'manage:settings', label: 'Modify Service Settings & Audit Logs' },
]

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<AdminUserRecord[]>([])

  // Modal / Editing states
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null)
  const [editRole, setEditRole] = useState<string>('')
  const [editPermissions, setEditPermissions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // OTP states for role changes
  const [showOtpStep, setShowOtpStep] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/users')
      setUsers(response.data.data)
    } catch (err) {
      console.error('Error loading admin users list:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active'
    try {
      await api.post(`/admin/users/${userId}/status`, { status: nextStatus })
      toast.success(`User status updated to ${nextStatus}!`)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change user status.')
    }
  }

  const handleDeleteUser = async (userId: string, fullName: string) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete the account of ${fullName}? All their wallets, transaction histories, and keys will be permanently deleted.`)) {
      return
    }
    try {
      await api.delete(`/admin/users/${userId}`)
      toast.success('User account deleted successfully!')
      fetchUsers()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user.')
    }
  }

  const openEditModal = (user: AdminUserRecord) => {
    setEditingUser(user)
    setEditRole(user.role)
    setEditPermissions(user.permissions || [])
    setShowOtpStep(false)
    setOtpCode('')
  }

  const handleTogglePermission = (permissionId: string) => {
    if (editPermissions.includes(permissionId)) {
      setEditPermissions(editPermissions.filter((p) => p !== permissionId))
    } else {
      setEditPermissions([...editPermissions, permissionId])
    }
  }

  const requiresOtp = editRole === 'admin' || editRole === 'super_admin'

  const handleSendOtp = async () => {
    try {
      setSendingOtp(true)
      await api.post('/admin/users/role-otp')
      toast.success('OTP has been sent to your email address.')
      setShowOtpStep(true)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP.')
    } finally {
      setSendingOtp(false)
    }
  }

  const saveRoleAndPermissions = async () => {
    if (!editingUser) return

    // If upgrading to admin/super_admin and OTP step not yet shown, trigger OTP flow
    if (requiresOtp && !showOtpStep) {
      await handleSendOtp()
      return
    }

    // If OTP is required but not entered
    if (requiresOtp && !otpCode.trim()) {
      toast.error('Please enter the OTP code sent to your email.')
      return
    }

    try {
      setSaving(true)
      // Clean up permissions array if role is not 'admin'
      const finalPermissions = editRole === 'admin' ? editPermissions : editRole === 'super_admin' ? ['*'] : []

      await api.post(`/admin/users/${editingUser.id}/role-permissions`, {
        role: editRole,
        permissions: finalPermissions,
        ...(requiresOtp ? { otp: otpCode.trim() } : {}),
      })

      toast.success('User role and permissions updated successfully!')
      setEditingUser(null)
      setShowOtpStep(false)
      setOtpCode('')
      fetchUsers()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update role and permissions.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-white tracking-wide">Manage Registered Accounts</h1>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 border border-silver-muted/15 hover:bg-white/5 rounded-xl text-xs font-semibold text-silver-light"
        >
          Refresh List
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
        ) : users.length === 0 ? (
          <div className="py-20 text-center text-silver-muted">
            <span className="text-4xl">👥</span>
            <p className="text-sm mt-2">No user accounts found in the database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-silver-muted text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4">Account Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{user.fullName}</td>
                    <td className="px-6 py-4 text-silver-muted">{user.email}</td>
                    <td className="px-6 py-4 font-mono text-silver-muted">{user.phoneNumber}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-bold capitalize ${
                          user.role === 'super_admin'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : user.role === 'admin'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : user.role === 'agent'
                            ? 'bg-primary-blue/10 text-primary-glow border border-primary-blue/20'
                            : 'bg-white/5 text-silver-light'
                        }`}
                      >
                        {user.role === 'super_admin' ? 'Super Admin' : user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex flex-col sm:flex-row items-end sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl border border-amber-500/20 text-amber-400 hover:bg-amber-500/10 transition-all"
                      >
                        Edit Role / Permissions
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user.id, user.status)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                          user.status === 'active'
                            ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                            : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                      >
                        {user.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.fullName)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Role / Permissions Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-dark-bg-secondary border border-silver-muted/15 rounded-2xl p-6 shadow-2xl relative animate-slide-up">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-5 right-5 text-silver-muted hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-lg font-bold text-white mb-2">Edit Role & Permissions</h2>
            <p className="text-xs text-silver-muted mb-4">
              Updating settings for <strong className="text-white">{editingUser.fullName}</strong> ({editingUser.email})
            </p>

            <div className="space-y-4">
              {/* Role Select */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                  Select User Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-dark-bg border border-silver-muted/10 rounded-xl px-4 py-3 text-white focus:border-primary-glow/50 focus:outline-none transition-all text-sm"
                >
                  <option value="user">Customer / User</option>
                  <option value="agent">Agent / Reseller</option>
                  <option value="admin">Administrator</option>
                  <option value="super_admin">Super Administrator</option>
                </select>
              </div>

              {/* Granular Permissions Checklist (Only for Admin role) */}
              {editRole === 'admin' && (
                <div className="space-y-3 p-4 bg-dark-bg/50 border border-silver-muted/5 rounded-xl">
                  <span className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                    Granular Access Permissions
                  </span>
                  <div className="space-y-2">
                    {ALL_PERMISSIONS.map((perm) => {
                      const isChecked = editPermissions.includes(perm.id)
                      return (
                        <label
                          key={perm.id}
                          className="flex items-center space-x-3 text-sm text-silver-light hover:text-white cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(perm.id)}
                            className="rounded bg-dark-bg border-silver-muted/10 text-primary-blue focus:ring-0 focus:ring-offset-0 w-4 h-4"
                          />
                          <span>{perm.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Super Admin status notice */}
              {editRole === 'super_admin' && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                  <strong>Warning:</strong> Super Administrators bypass all permission restrictions and obtain full administrative access to all pages, providers, APIs, and manual actions.
                </div>
              )}

              {/* OTP Verification Section */}
              {showOtpStep && requiresOtp && (
                <div className="space-y-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      OTP Verification Required
                    </span>
                  </div>
                  <p className="text-xs text-silver-muted">
                    A 6-digit verification code has been sent to your admin email address. Enter it below to authorize this role change.
                  </p>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="flex-1 bg-dark-bg border border-silver-muted/10 rounded-xl px-4 py-3 text-white text-center tracking-[0.5em] font-mono text-lg focus:border-amber-500/50 focus:outline-none transition-all placeholder:tracking-normal placeholder:text-sm placeholder:font-sans"
                    />
                    <button
                      onClick={handleSendOtp}
                      disabled={sendingOtp}
                      className="px-3 py-3 border border-silver-muted/10 text-silver-muted hover:text-white hover:border-amber-500/30 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {sendingOtp ? 'Sending...' : 'Resend'}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
                <button
                  onClick={() => { setEditingUser(null); setShowOtpStep(false); setOtpCode(''); }}
                  className="px-4 py-2 border border-silver-muted/10 text-silver-muted hover:text-white rounded-xl text-sm font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRoleAndPermissions}
                  disabled={saving || sendingOtp}
                  className="px-6 py-2 bg-gradient-blue hover:opacity-95 text-white font-bold rounded-xl shadow-glow-blue transition-all disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
                >
                  {saving ? 'Saving...' : sendingOtp ? 'Sending OTP...' : requiresOtp && !showOtpStep ? 'Send OTP & Verify' : requiresOtp && showOtpStep ? 'Verify OTP & Save' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
