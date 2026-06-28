'use client'

import { useContext, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, RegisterInput } from '@/lib/validators'
import { AuthContext } from '@/context/AuthContext'

import Link from 'next/link'

export default function RegisterPage() {
  const auth = useContext(AuthContext)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    setError(null)
    setLoading(true)
    try {
      if (auth?.register) {
        await auth.register(data)
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Registration failed. Please check your inputs.'
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
        <h1 className="text-2xl font-bold text-white tracking-wide">Sign Up</h1>
        <p className="text-sm text-silver-muted">
          Create an account to start purchasing VTU bundles instantly
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-sm text-red-400 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
            Full Name
          </label>
          <input
            type="text"
            {...register('fullName')}
            placeholder="John Doe"
            className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white placeholder-silver-muted/30 focus:border-primary-glow/50 focus:outline-none transition-all text-sm"
          />
          {errors.fullName && (
            <p className="text-xs text-red-400 font-medium">{errors.fullName.message}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            {...register('email')}
            placeholder="john@example.com"
            className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white placeholder-silver-muted/30 focus:border-primary-glow/50 focus:outline-none transition-all text-sm"
          />
          {errors.email && (
            <p className="text-xs text-red-400 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Phone Number */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
            Phone Number
          </label>
          <input
            type="text"
            {...register('phoneNumber')}
            placeholder="e.g. 08012345678"
            className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white placeholder-silver-muted/30 focus:border-primary-glow/50 focus:outline-none transition-all text-sm"
          />
          {errors.phoneNumber && (
            <p className="text-xs text-red-400 font-medium">{errors.phoneNumber.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>

        {/* Referral Code (Optional) */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-silver-muted uppercase tracking-wider">
            Referral Code (Optional)
          </label>
          <input
            type="text"
            {...register('referralCode')}
            placeholder="e.g. AB12345"
            className="w-full bg-dark-bg/60 border border-silver-muted/10 rounded-xl px-4 py-3 text-white placeholder-silver-muted/30 focus:border-primary-glow/50 focus:outline-none transition-all text-sm"
          />
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
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Register</span>
          )}
        </button>
      </form>

      <div className="text-center text-xs text-silver-muted pt-4 border-t border-white/5">
        Already have an account?{' '}
        <a href="/login" className="text-primary-glow font-semibold hover:text-white transition-all">
          Sign In
        </a>
      </div>
    </div>
  )
}
