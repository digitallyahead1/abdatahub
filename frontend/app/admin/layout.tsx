'use client'

import { useContext, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { AuthContext } from '@/context/AuthContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = useContext(AuthContext)
  const router = useRouter()
  const pathname = usePathname()

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

  const adminMenu = [
    {
      name: 'Overview',
      path: '/admin/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      permission: 'view:dashboard',
    },
    {
      name: 'Users Manager',
      path: '/admin/users',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0-.001h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      permission: 'manage:users',
    },
    {
      name: 'Agent Requests',
      path: '/admin/agent-requests',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      ),
      permission: 'manage:users',
    },
    {
      name: 'Transaction Logs',
      path: '/admin/transactions',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      permission: 'manage:transactions',
    },
    {
      name: 'Wallet Adjustments',
      path: '/admin/wallet',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      permission: 'manage:wallet',
    },
    {
      name: 'Data Plans',
      path: '/admin/data-plans',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      permission: 'manage:settings',
    },
    {
      name: 'Airtime Pricing',
      path: '/admin/airtime-pricing',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zm1-5h10M7 11h10" />
        </svg>
      ),
      permission: 'manage:settings',
    },
    {
      name: 'Exam PINs',
      path: '/admin/exams',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      permission: 'manage:settings',
    },
    {
      name: 'Sales Reports',
      path: '/admin/reports',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      permission: 'view:dashboard',
    },
    {
      name: 'Service Settings',
      path: '/admin/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        </svg>
      ),
      permission: 'manage:settings',
    },
  ]

  const filteredMenu = adminMenu.filter((item) => {
    if (auth?.user?.role === 'super_admin') return true
    if (!item.permission) return true
    return auth?.user?.permissions?.includes(item.permission)
  })

  const activeItem = adminMenu.find((item) => item.path === pathname)
  const hasPagePermission =
    !activeItem ||
    !activeItem.permission ||
    auth?.user?.role === 'super_admin' ||
    auth?.user?.permissions?.includes(activeItem.permission)

  if (!auth?.isLoading && auth?.user?.role !== 'admin' && auth?.user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col justify-center items-center py-12 px-4 text-center">
        <span className="text-6xl mb-4">🚫</span>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-silver-muted text-sm max-w-sm mb-6">
          You do not have administrative privileges to access this control interface.
        </p>
        <a href="/dashboard" className="px-6 py-2.5 bg-gradient-blue text-white font-semibold rounded-lg shadow-glow-blue">
          Go To Main Dashboard
        </a>
      </div>
    )
  }

  if (!auth?.isLoading && !hasPagePermission) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col justify-center items-center py-12 px-4 text-center">
        <span className="text-6xl mb-4">🛡️</span>
        <h1 className="text-2xl font-bold text-white mb-2">Permission Denied</h1>
        <p className="text-silver-muted text-sm max-w-md mb-6">
          Your administrator account does not possess the granular permission **{activeItem?.permission}** required to view this section.
        </p>
        <a href="/admin/dashboard" className="px-6 py-2.5 bg-gradient-blue text-white font-semibold rounded-lg shadow-glow-blue">
          Back to Admin Overview
        </a>
      </div>
    )
  }

  const userRoleDisplay = auth?.user?.role === 'super_admin' ? 'Super Admin' : 'Admin'

  return (
    <div className="min-h-screen bg-dark-bg text-silver-light flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-dark-bg-secondary border-b md:border-b-0 md:border-r border-silver-muted/10 flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-silver-muted/10 space-x-3">
          <div className="relative w-10 h-10 overflow-hidden rounded-xl border border-amber-500/20 shadow-glow-blue">
            <Image src="/logo.png" alt="AB Data Hub Logo" fill className="object-cover" />
          </div>
          <span className="text-lg font-bold tracking-wider text-amber-400">
            ADMIN PANEL
          </span>
        </div>

        <nav className="flex-grow px-4 py-6 space-y-1">
          {filteredMenu.map((item) => {
            const isActive = pathname === item.path
            return (
              <a
                key={item.name}
                href={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
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

          <a
            href="/dashboard"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm text-primary-glow hover:text-white hover:bg-primary-blue/10 border border-primary-glow/20 transition-all mt-8"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>User Dashboard</span>
          </a>
        </nav>

        <div className="p-4 border-t border-silver-muted/10">
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

      {/* Main Control Panel Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-dark-bg-secondary border-b border-silver-muted/10 flex items-center justify-between px-8 z-10">
          <h2 className="text-lg font-bold text-white capitalize">
            {pathname.split('/').pop()?.replace('-', ' ')}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {userRoleDisplay}
            </span>
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center font-bold text-black shadow-glow-blue border border-amber-400/20">
              {auth?.user?.fullName?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8 relative">
          {children}
        </main>
      </div>
    </div>
  )
}
