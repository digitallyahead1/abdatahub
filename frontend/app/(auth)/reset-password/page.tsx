'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, ResetPasswordInput } from '@/lib/validators'
import api from '@/lib/api'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      setError('Reset token is missing. Please initiate the forgot password flow again.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        resetToken: token,
        password: data.password,
      })
      router.push('/login?reset=success')
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to reset password. The link may have expired.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-wide">Reset Password</h1>
        <p className="text-sm text-silver-muted">
          Choose a strong, secure new password for your account
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-sm text-red-400 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New Password */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
            New Password
          </label>
          <input
            type="password"
            {...register('password')}
            placeholder="••••••••"
            className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white placeholder-silver-muted/30 focus:border-primary-glow/50 focus:outline-none transition-all text-sm"
          />
          {errors.password && (
            <p className="text-xs text-red-400 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
            Confirm Password
          </label>
          <input
            type="password"
            {...register('confirmPassword')}
            placeholder="••••••••"
            className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white placeholder-silver-muted/30 focus:border-primary-glow/50 focus:outline-none transition-all text-sm"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-400 font-medium">{errors.confirmPassword.message}</p>
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
              <span>Resetting Password...</span>
            </>
          ) : (
            <span>Reset Password</span>
          )}
        </button>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-8">
        <svg className="animate-spin h-8 w-8 text-primary-glow mx-auto" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm text-silver-muted mt-4">Loading reset form...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
