// Frontend types
export type Maybe<T> = T | null | undefined

export interface User {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  avatar?: string
  emailVerified: boolean
  phoneVerified: boolean
  walletBalance: number
  referralCode: string
  role: 'super_admin' | 'admin' | 'agent' | 'user'
  permissions?: string[]
  transactionPin?: string | null
  agentStatus?: string
  createdAt: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  refreshToken: string | null
}

export interface Transaction {
  id: string
  type: 'credit' | 'debit'
  service: string
  amount: number
  status: 'pending' | 'processing' | 'success' | 'failed'
  reference: string
  createdAt: string
  metadata?: any
}

export interface WalletBalance {
  balance: number
  ledgerBalance: number
  currency: string
}

export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}
