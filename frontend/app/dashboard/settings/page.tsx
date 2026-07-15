'use client'

import { useContext, useState } from 'react'
import { AuthContext } from '@/context/AuthContext'
import api from '@/lib/api'
import { toast } from 'sonner'

export default function SettingsPage() {
  const auth = useContext(AuthContext)
  const [fullName, setFullName] = useState(auth?.user?.fullName || '')
  const [phoneNumber, setPhoneNumber] = useState(auth?.user?.phoneNumber || '')
  const [updatingProfile, setUpdatingProfile] = useState(false)

  // PIN reset states
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otp, setOtp] = useState('')
  const [newPin, setNewPin] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)
  const [resettingPin, setResettingPin] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !phoneNumber.trim()) {
      toast.error('All profile fields are required.')
      return
    }

    try {
      setUpdatingProfile(true)
      const response = await api.patch('/auth/profile', {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
      })

      if (response.data.success) {
        toast.success('Profile updated successfully!')
        // Update user session context if possible
        if (auth?.setUser && auth?.user) {
          auth.setUser({
            ...auth.user,
            fullName: response.data.data.fullName,
            phoneNumber: response.data.data.phoneNumber,
          })
        }
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to update profile.')
    } finally {
      setUpdatingProfile(false)
    }
  }

  const handleRequestOtp = async () => {
    try {
      setSendingOtp(true)
      const response = await api.post('/auth/reset-pin/send-otp')
      if (response.data.success) {
        toast.success('OTP sent to your registered email address!')
        setShowOtpInput(true)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to send OTP.')
    } finally {
      setSendingOtp(false)
    }
  }

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim()) {
      toast.error('Please enter the OTP sent to your email.')
      return
    }
    if (!/^\d{4}$/.test(newPin)) {
      toast.error('New Transaction PIN must be exactly 4 digits.')
      return
    }

    try {
      setResettingPin(true)
      const response = await api.post('/auth/reset-pin/verify', {
        otp: otp.trim(),
        newPin: newPin.trim(),
      })

      if (response.data.success) {
        toast.success('Transaction PIN reset successfully!')
        setOtp('')
        setNewPin('')
        setShowOtpInput(false)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to reset transaction PIN.')
    } finally {
      setResettingPin(false)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-wide">Profile Settings</h1>
        <p className="text-sm text-silver-muted">
          Manage your personal details and secure your account transactions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Card */}
        <div className="p-6 bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">Personal Information</h2>
            <p className="text-xs text-silver-muted">Update your full name and phone number.</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-silver-muted mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={auth?.user?.email || ''}
                className="w-full bg-dark-bg/40 border border-silver-muted/10 rounded-xl px-4 py-3 text-silver-muted text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-silver-light mb-2 uppercase tracking-wide">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter Full Name"
                className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary-blue focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-silver-light mb-2 uppercase tracking-wide">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter Phone Number"
                className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white text-sm focus:border-primary-blue focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="w-full py-3.5 bg-gradient-blue text-white font-bold rounded-xl shadow-glow-blue hover:opacity-90 transition-all text-sm disabled:opacity-50"
            >
              {updatingProfile ? 'Updating Profile...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Security / PIN Card */}
        <div className="p-6 bg-dark-bg-secondary/40 border border-silver-muted/10 rounded-2xl glass-dark space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">Secure Transaction PIN</h2>
            <p className="text-xs text-silver-muted">Reset your 4-digit transaction PIN via email verification.</p>
          </div>

          {!showOtpInput ? (
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-primary-blue/5 border border-primary-blue/10 rounded-xl">
                <p className="text-xs text-primary-glow leading-relaxed">
                  We will send a 6-digit confirmation code to your registered email: <strong>{auth?.user?.email}</strong>. 
                  You will enter this OTP along with your new 4-digit PIN to perform the change.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={sendingOtp}
                className="w-full py-3.5 bg-gradient-blue text-white font-bold rounded-xl shadow-glow-blue hover:opacity-90 transition-all text-sm disabled:opacity-50"
              >
                {sendingOtp ? 'Requesting OTP...' : 'Send Reset OTP'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-silver-light mb-2 uppercase tracking-wide">
                  6-Digit Email OTP
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP Code"
                  className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white text-sm tracking-widest text-center font-bold focus:border-primary-blue focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-silver-light mb-2 uppercase tracking-wide">
                  New 4-Digit Transaction PIN
                </label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="xxxx"
                  className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white text-sm text-center tracking-widest font-bold focus:border-primary-blue focus:outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOtpInput(false)}
                  className="flex-1 py-3.5 bg-dark-bg border border-silver-muted/10 text-silver-light font-bold rounded-xl hover:bg-white/5 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPin}
                  className="flex-1 py-3.5 bg-gradient-blue text-white font-bold rounded-xl shadow-glow-blue hover:opacity-90 transition-all text-sm disabled:opacity-50"
                >
                  {resettingPin ? 'Resetting PIN...' : 'Confirm Reset'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
