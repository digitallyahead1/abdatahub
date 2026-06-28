'use client'

import { FormEvent, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="mb-6">
        <label htmlFor="email" className="block text-sm font-medium text-silver-light mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full px-4 py-3 bg-dark-bg-secondary border border-silver-muted/20 rounded-lg text-silver-light placeholder-silver-muted/50 focus:border-primary-blue focus:outline-none transition"
          required
        />
      </div>

      <div className="mb-6">
        <label htmlFor="password" className="block text-sm font-medium text-silver-light mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="w-full px-4 py-3 bg-dark-bg-secondary border border-silver-muted/20 rounded-lg text-silver-light placeholder-silver-muted/50 focus:border-primary-blue focus:outline-none transition"
          required
        />
      </div>

      {error && (
        <div className="mb-6 p-3 bg-error/10 border border-error/20 rounded-lg">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>

      <p className="mt-4 text-center text-sm text-silver-muted">
        Don't have an account?{' '}
        <a href="/register" className="text-primary-blue hover:text-primary-dark-blue">
          Register here
        </a>
      </p>
    </form>
  )
}
