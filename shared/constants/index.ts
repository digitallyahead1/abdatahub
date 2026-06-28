// Global Constants

// Services
export const SERVICES = {
  DATA: 'data',
  AIRTIME: 'airtime',
  CABLE_TV: 'cable_tv',
  ELECTRICITY: 'electricity',
  EXAM_PINS: 'exam_pins',
  POS: 'pos',
  WALLET_FUNDING: 'wallet_funding',
} as const;

// Networks
export const NETWORKS = {
  MTN: 'mtn',
  AIRTEL: 'airtel',
  GLO: 'glo',
  NINE_MOBILE: '9mobile',
} as const;

// Cable Providers
export const CABLE_PROVIDERS = {
  DSTV: 'dstv',
  GOTV: 'gotv',
  STARTIMES: 'startimes',
} as const;

// Electricity Providers (DisCos)
export const ELECTRICITY_PROVIDERS = [
  { code: 'ikedc', name: 'IKEDC' },
  { code: 'ekedc', name: 'EKEDC' },
  { code: 'aedc', name: 'AEDC' },
  { code: 'kedco', name: 'KEDCO' },
  { code: 'bedc', name: 'BEDC' },
  { code: 'iedc', name: 'IEDC' },
  { code: 'phedc', name: 'PHEDC' },
  { code: 'umedc', name: 'UMEDC' },
  { code: 'yedc', name: 'YEDC' },
] as const;

// Exam Types
export const EXAM_TYPES = {
  WAEC: 'waec',
  NECO: 'neco',
  JAMB: 'jamb',
  NABTEB: 'nabteb',
} as const;

// Brand Colors
export const BRAND_COLORS = {
  PRIMARY_BLUE: '#007BFF',
  PRIMARY_DARK_BLUE: '#0066E8',
  ACCENT_GLOW: '#00A8FF',
  DARK_BG: '#0B0F1A',
  DARK_BG_SECONDARY: '#101827',
  SILVER_LIGHT: '#F5F7FA',
  SILVER_MUTED: '#D9DDE4',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

// Transaction Status
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPPORT: 'support',
  AGENT: 'agent',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh-token',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
  },
  TRANSACTIONS: {
    LIST: '/transactions',
    DETAIL: '/transactions/:id',
    DATA: '/transactions/data',
    AIRTIME: '/transactions/airtime',
    CABLE: '/transactions/cable',
    ELECTRICITY: '/transactions/electricity',
    EXAM_PINS: '/transactions/exam-pins',
  },
  WALLET: {
    BALANCE: '/wallet/balance',
    HISTORY: '/wallet/history',
    FUND: '/wallet/fund',
  },
  REFERRAL: {
    INFO: '/referral/info',
    EARNINGS: '/referral/earnings',
    LEADERBOARD: '/referral/leaderboard',
  },
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Codes
export const ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  INVALID_PHONE_NUMBER: 'INVALID_PHONE_NUMBER',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const;
