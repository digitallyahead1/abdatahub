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

  // Initialize auth from localStorage
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const user = localStorage.getItem('user')

    if (token && user) {
      setAuthState({
        isAuthenticated: true,
        user: JSON.parse(user),
        token,
        refreshToken: localStorage.getItem('refreshToken'),
      })
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

    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
    })
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

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        register,
        updateUser,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
