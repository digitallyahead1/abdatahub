'use client'

import { useContext, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginInput } from '@/lib/validators'
import { AuthContext } from '@/context/AuthContext'
import Link from 'next/link'

function LoginForm() {
  const auth = useContext(AuthContext)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isResetSuccess = searchParams.get('reset') === 'success'
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setError(null)
    setLoading(true)
    try {
      if (auth?.login) {
        const user = await auth.login(data.email, data.password)
        if (user?.role === 'super_admin' || user?.role === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Invalid credentials. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-start -mb-2">
        <Link href="/" className="inline-flex items-center group">
          <div className="w-8 h-8 rounded-full bg-white/5 border border-silver-muted/10 flex items-center justify-center text-silver-muted group-hover:bg-primary-blue/20 group-hover:border-primary-glow/30 transition-all duration-300">
            <svg className="w-3.5 h-3.5 transform group-hover:-translate-x-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="text-[11px] font-bold text-silver-muted group-hover:text-white transition-colors ml-2 tracking-wide uppercase">
            Back to Home
          </span>
        </Link>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-wide">Sign In</h1>
        <p className="text-sm text-silver-muted">
          Enter your account details to access your dashboard
        </p>
      </div>

      {isResetSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-sm text-emerald-400 text-center font-medium">
          Password reset successful! Please sign in with your new password.
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-sm text-red-400 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email or Phone */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
            Email or Phone Number
          </label>
          <input
            type="text"
            {...register('email')}
            placeholder="e.g. user@gmail.com or 08012345678"
            className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white placeholder-silver-muted/30 focus:border-primary-glow/50 focus:outline-none transition-all text-sm"
          />
          {errors.email && (
            <p className="text-xs text-red-400 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
            Password
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

        {/* Extras */}
        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center space-x-2 text-silver-muted hover:text-white cursor-pointer select-none">
            <input
              type="checkbox"
              className="rounded bg-dark-bg border-silver-muted/10 text-primary-blue focus:ring-0 focus:ring-offset-0"
            />
            <span>Remember Me</span>
          </label>
          <Link href="/forgot-password" className="text-primary-glow hover:text-white font-medium transition-all">
            Forgot Password?
          </Link>
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
              <span>Signing In...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-silver-muted pt-4 border-t border-white/5">
        Don't have an account?{' '}
        <a href="/register" className="text-primary-glow font-semibold hover:text-white transition-all">
          Sign Up
        </a>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-8">
        <svg className="animate-spin h-8 w-8 text-primary-glow mx-auto" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm text-silver-muted mt-4">Loading login form...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
