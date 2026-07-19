'use client'

import { useContext, useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { AuthContext } from '@/context/AuthContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = useContext(AuthContext)
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!auth?.isLoading && !auth?.isAuthenticated) {
      router.push('/login')
    }
  }, [auth?.isLoading, auth?.isAuthenticated, router])

  if (auth?.isLoading || !auth?.isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-primary-glow" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  const handleLogout = () => {
    if (auth?.logout) {
      auth.logout()
      router.push('/login')
    }
  }

  const menuItems = [
    {
      name: 'Overview',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      name: 'Fund Wallet',
      path: '/dashboard/wallet',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Buy Data',
      path: '/dashboard/data',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'Buy Airtime',
      path: '/dashboard/airtime',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
    {
      name: 'Cable TV',
      path: '/dashboard/cable',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      ),
    },
    {
      name: 'Electricity Bills',
      path: '/dashboard/electricity',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      name: 'Exam Pins',
      path: '/dashboard/exam-pins',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Transaction History',
      path: '/dashboard/transactions',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      name: 'Referrals',
      path: '/dashboard/referrals',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0-.001h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      name: 'Agent Services',
      path: '/dashboard/agent',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      name: 'Profile Settings',
      path: '/dashboard/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-dark-bg text-silver-light flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-dark-bg-secondary border-r border-silver-muted/10 shrink-0">
        {/* Sidebar Header Brand */}
        <div className="h-20 flex items-center px-6 border-b border-silver-muted/10 space-x-3">
          <div className="relative w-10 h-10 overflow-hidden rounded-xl border border-primary-glow/20 glow-blue">
            <Image src="/logo.png" alt="AB Data Hub Logo" fill className="object-cover" />
          </div>
          <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-primary-blue to-primary-glow bg-clip-text text-transparent">
            AB DATA HUB
          </span>
        </div>

        {/* Sidebar Menu Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path
            return (
              <a
                key={item.name}
                href={item.path}
                className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-blue text-white shadow-glow-blue'
                    : 'text-silver-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </a>
            )
          })}

          {/* Admin panel link for admin users */}
          {(auth?.user?.role === 'admin' || auth?.user?.role === 'super_admin') && (
            <a
              href="/admin/dashboard"
              className="flex items-center space-x-3 px-4 py-3.5 rounded-xl font-medium text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 transition-all mt-4"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Admin Panel</span>
            </a>
          )}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-silver-muted/10">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 mb-3">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{auth?.user?.fullName || 'User'}</p>
              <p className="text-xs text-primary-glow font-mono select-all truncate">{auth?.user?.referralCode || 'AB---'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/10 rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-dark-bg/80 backdrop-blur-sm">
          <div className="relative flex flex-col w-64 max-w-xs bg-dark-bg-secondary border-r border-silver-muted/10 h-full animate-slide-in">
            {/* Close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-5 right-5 text-silver-muted hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Logo */}
            <div className="h-20 flex items-center px-6 border-b border-silver-muted/10 space-x-3">
              <div className="relative w-8 h-8 overflow-hidden rounded-lg border border-primary-glow/20 glow-blue">
                <Image src="/logo.png" alt="AB Data Hub Logo" fill className="object-cover" />
              </div>
              <span className="text-base font-bold tracking-wider bg-gradient-to-r from-primary-blue to-primary-glow bg-clip-text text-transparent">
                AB DATA HUB
              </span>
            </div>

            {/* Menu */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = pathname === item.path
                return (
                  <a
                    key={item.name}
                    href={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-blue text-white shadow-glow-blue'
                        : 'text-silver-muted hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </a>
                )
              })}

              {(auth?.user?.role === 'admin' || auth?.user?.role === 'super_admin') && (
                <a
                  href="/admin/dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3.5 rounded-xl font-medium text-sm text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 transition-all mt-4"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span>Admin Panel</span>
                </a>
              )}
            </nav>

            {/* User card footer */}
            <div className="p-4 border-t border-silver-muted/10">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 mb-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{auth?.user?.fullName || 'User'}</p>
                  <p className="text-xs text-primary-glow font-mono truncate">{auth?.user?.referralCode || 'AB---'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/10 rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {auth?.isImpersonating && (
          <div className="bg-amber-500 text-dark-bg px-6 py-2.5 flex items-center justify-between text-sm font-semibold select-none z-20 shadow-md">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 animate-pulse shrink-0 text-dark-bg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>
                You are currently impersonating <strong className="underline">{auth.user?.fullName}</strong> ({auth.user?.email}).
              </span>
            </div>
            <button
              onClick={() => auth.exitImpersonation()}
              className="px-3 py-1 bg-dark-bg text-amber-400 hover:text-white rounded-md text-xs font-bold transition-all border border-amber-400/20"
            >
              Exit Impersonation
            </button>
          </div>
        )}

        {/* Top Navbar */}
        <header className="h-20 bg-dark-bg-secondary border-b border-silver-muted/10 flex items-center justify-between px-6 z-10">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-silver-muted hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-white capitalize hidden sm:block">
              {pathname === '/dashboard' ? 'Welcome to AB Data Hub' : pathname.split('/').pop()?.replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs text-silver-muted">Active Role</span>
              <span className="text-xs font-semibold text-primary-glow capitalize">
                {auth?.user?.role || 'User'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-blue flex items-center justify-center font-bold text-white border border-primary-glow/20 shadow-glow-blue">
              {auth?.user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Core view area */}
        <main className="flex-1 overflow-y-auto px-6 py-8 relative">
          {children}
        </main>
      </div>
    </div>
  )
}
