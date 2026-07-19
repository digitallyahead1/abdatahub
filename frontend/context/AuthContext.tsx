'use client'

import { ReactNode, createContext, useCallback, useEffect, useState } from 'react'
import { User, AuthState } from '@/types'
import api from '@/lib/api'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  register: (data: any) => Promise<User>
  updateUser: (user: User) => void
  isLoading: boolean
  isImpersonating: boolean
  impersonate: (targetUserId: string) => Promise<void>
  exitImpersonation: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isImpersonating, setIsImpersonating] = useState(false)

  // Initialize auth from localStorage
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const user = localStorage.getItem('user')
    const impersonating = localStorage.getItem('admin_accessToken') !== null

    if (token && user) {
      setAuthState({
        isAuthenticated: true,
        user: JSON.parse(user),
        token,
        refreshToken: localStorage.getItem('refreshToken'),
      })
      setIsImpersonating(impersonating)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { accessToken, refreshToken, user } = response.data.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))

      setAuthState({
        isAuthenticated: true,
        user,
        token: accessToken,
        refreshToken,
      })
      setIsImpersonating(false)
      return user
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('admin_accessToken')
    localStorage.removeItem('admin_refreshToken')
    localStorage.removeItem('admin_user')

    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
    })
    setIsImpersonating(false)
  }, [])

  const register = useCallback(async (data: any) => {
    try {
      const response = await api.post('/auth/register', data)
      const { accessToken, refreshToken, user } = response.data.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))

      setAuthState({
        isAuthenticated: true,
        user,
        token: accessToken,
        refreshToken,
      })
      setIsImpersonating(false)
      return user
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }, [])

  const updateUser = useCallback((updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setAuthState((prev) => ({
      ...prev,
      user: updatedUser,
    }))
  }, [])

  const impersonate = useCallback(async (targetUserId: string) => {
    try {
      const response = await api.post(`/admin/impersonate/${targetUserId}`)
      const { accessToken, refreshToken, user } = response.data.data

      // Backup admin credentials if not already impersonating
      if (!localStorage.getItem('admin_accessToken')) {
        localStorage.setItem('admin_accessToken', localStorage.getItem('accessToken') || '')
        localStorage.setItem('admin_refreshToken', localStorage.getItem('refreshToken') || '')
        localStorage.setItem('admin_user', localStorage.getItem('user') || '')
      }

      // Overwrite active credentials
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(user))

      setAuthState({
        isAuthenticated: true,
        user,
        token: accessToken,
        refreshToken,
      })
      setIsImpersonating(true)
    } catch (error) {
      console.error('Impersonation failed:', error)
      throw error
    }
  }, [])

  const exitImpersonation = useCallback(() => {
    const adminToken = localStorage.getItem('admin_accessToken')
    const adminRefreshToken = localStorage.getItem('admin_refreshToken')
    const adminUser = localStorage.getItem('admin_user')

    if (adminToken && adminUser) {
      localStorage.setItem('accessToken', adminToken)
      localStorage.setItem('refreshToken', adminRefreshToken || '')
      localStorage.setItem('user', adminUser)

      // Clean up backups
      localStorage.removeItem('admin_accessToken')
      localStorage.removeItem('admin_refreshToken')
      localStorage.removeItem('admin_user')

      setAuthState({
        isAuthenticated: true,
        user: JSON.parse(adminUser),
        token: adminToken,
        refreshToken: adminRefreshToken,
      })
      setIsImpersonating(false)
    } else {
      logout()
    }
  }, [logout])

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        register,
        updateUser,
        isLoading,
        isImpersonating,
        impersonate,
        exitImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
