'use client'

import { useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthContext } from '@/context/AuthContext'
import api from '@/lib/api'
import { toast } from 'sonner'

export default function PinCheckWrapper({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext)
  const pathname = usePathname()
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Show prompt if user is logged in, has no pin, and is on dashboard/admin routes
    const isExcludedRoute = pathname === '/' || pathname === '/login' || pathname === '/register'
    if (auth?.isAuthenticated && auth?.user && !auth.user.transactionPin && !isExcludedRoute) {
      setShowPrompt(true)
    } else {
      setShowPrompt(false)
    }
  }, [auth?.isAuthenticated, auth?.user, pathname])

  if (!showPrompt) {
    return <>{children}</>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length !== 4 || isNaN(Number(pin))) {
      toast.error('PIN must be a 4-digit number')
      return
    }

    if (pin !== confirmPin) {
      toast.error('PINs do not match')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/users/transaction-pin', { pin })
      toast.success(response.data.message || 'Transaction PIN set successfully!')
      
      // Update local storage and auth context state
      if (auth?.updateUser) {
        auth.updateUser(response.data.data)
      }
      setShowPrompt(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to set transaction PIN')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Block background interaction */}
      <div className="fixed inset-0 z-[999] bg-dark-bg filter blur-[3px]" aria-hidden="true">
        {children}
      </div>

      {/* Force modal overlay */}
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
        <div className="bg-dark-bg-secondary border border-primary-glow/20 p-8 rounded-2xl max-w-md w-full glass-dark glow-blue shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-wide">Set Transaction PIN</h2>
            <p className="text-sm text-silver-muted leading-relaxed">
              Create a secure 4-digit transaction PIN to authorize payments and service checkouts.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input PIN */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                Choose 4-Digit PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="e.g. 1234"
                disabled={loading}
                className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white text-center text-xl font-bold font-mono tracking-widest focus:border-primary-glow/50 focus:outline-none transition-all"
              />
            </div>

            {/* Confirm PIN */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
                Confirm 4-Digit PIN
              </label>
              <input
                type="password"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="e.g. 1234"
                disabled={loading}
                className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white text-center text-xl font-bold font-mono tracking-widest focus:border-primary-glow/50 focus:outline-none transition-all"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
              className="w-full py-3 bg-gradient-blue hover:opacity-95 text-white font-bold rounded-xl shadow-glow-blue transition-all disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving Security PIN...</span>
                </>
              ) : (
                <span>Set Secure PIN</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
