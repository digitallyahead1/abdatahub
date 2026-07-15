/**
 * Shared configuration constants
 */

export const APP_CONFIG = {
  name: 'AB Data Hub',
  version: '1.0.0',
  tagline: 'Fast • Reliable • Always Connected',
  contact: '08133887526',
  website: 'https://abdatahub.com',
}

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  retries: 3,
}

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  PREFERENCES: 'preferences',
}

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
}

export const TRANSACTION_LIMITS = {
  MIN_AMOUNT: 100,
  MAX_AMOUNT: 1000000,
  DAILY_LIMIT: 500000,
}

export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY: 5 * 60 * 1000, // 5 minutes
  MAX_ATTEMPTS: 3,
}

export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL: false,
}
