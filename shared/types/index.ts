// Shared Types for AB Data Hub

// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  username?: string;
  avatar?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: UserRole;
  status: UserStatus;
  referralCode: string;
  referredBy?: string;
  walletBalance: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPPORT = 'support',
  AGENT = 'agent',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  PENDING_VERIFICATION = 'pending_verification',
}

// ============================================
// Authentication Types
// ============================================

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
}

// ============================================
// Transaction Types
// ============================================

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  service: ServiceType;
  amount: number;
  status: TransactionStatus;
  reference: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum ServiceType {
  DATA = 'data',
  AIRTIME = 'airtime',
  CABLE_TV = 'cable_tv',
  ELECTRICITY = 'electricity',
  EXAM_PINS = 'exam_pins',
  POS = 'pos',
  WALLET_FUNDING = 'wallet_funding',
}

// ============================================
// Wallet Types
// ============================================

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  ledgerBalance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference: string;
  previousBalance: number;
  newBalance: number;
  createdAt: Date;
}

// ============================================
// Service Types
// ============================================

export interface DataPlan {
  id: string;
  network: Network;
  amount: number;
  volume: string;
  validity: string;
  isActive: boolean;
}

export enum Network {
  MTN = 'mtn',
  AIRTEL = 'airtel',
  GLO = 'glo',
  NINE_MOBILE = '9mobile',
}

export interface AirtimePlan {
  id: string;
  network: Network;
  amount: number;
}

export interface CableProvider {
  id: string;
  name: string;
  code: string;
}

export enum CableProviderType {
  DSTV = 'dstv',
  GOTV = 'gotv',
  STARTIMES = 'startimes',
}

export interface ElectricityBiller {
  id: string;
  name: string;
  code: string;
}

export enum ExamType {
  WAEC = 'waec',
  NECO = 'neco',
  JAMB = 'jamb',
  NABTEB = 'nabteb',
}

// ============================================
// Referral Types
// ============================================

export interface ReferralInfo {
  referralCode: string;
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  referrals: ReferralRecord[];
}

export interface ReferralRecord {
  id: string;
  referralCode: string;
  referredUserId: string;
  status: ReferralStatus;
  commission: number;
  createdAt: Date;
}

export enum ReferralStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  INACTIVE = 'inactive',
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface PaginatedRequest {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
