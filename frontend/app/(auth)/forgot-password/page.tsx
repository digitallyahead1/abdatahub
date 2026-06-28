'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordSchema, ForgotPasswordInput } from '@/lib/validators'
import api from '@/lib/api'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    setError(null)
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: data.email })
      router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`)
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to request OTP. Please try again later.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-start -mb-2">
        <Link href="/login" className="inline-flex items-center group">
          <div className="w-8 h-8 rounded-full bg-white/5 border border-silver-muted/10 flex items-center justify-center text-silver-muted group-hover:bg-primary-blue/20 group-hover:border-primary-glow/30 transition-all duration-300">
            <svg className="w-3.5 h-3.5 transform group-hover:-translate-x-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-silver-muted group-hover:text-white transition-colors ml-2 tracking-wide uppercase">
            Back to Login
          </span>
        </Link>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-wide">Forgot Password</h1>
        <p className="text-sm text-silver-muted">
          Enter your email address to receive a 6-digit OTP verification code
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-sm text-red-400 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            {...register('email')}
            placeholder="e.g. user@gmail.com"
            className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white placeholder-silver-muted/30 focus:border-primary-glow/50 focus:outline-none transition-all text-sm"
          />
          {errors.email && (
            <p className="text-xs text-red-400 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-blue hover:opacity-95 text-white font-bold rounded-xl shadow-glow-blue transition-all disabled:opacity-50 text-sm flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Sending OTP...</span>
            </>
          ) : (
            <span>Send OTP</span>
          )}
        </button>
      </form>
    </div>
  )
}
