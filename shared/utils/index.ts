// Shared Utilities

export const formatCurrency = (amount: number, currency = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+234${cleaned.substring(1)}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `+234${cleaned.substring(1)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('234')) {
    return `+${cleaned}`;
  }
  return phone;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^(\+234|0)[0-9]{10}$/;
  return phoneRegex.test(phone);
};

export const generateReferralCode = (userId: string): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const userIdPart = userId.slice(-4).toUpperCase();
  return `AB${userIdPart}${timestamp}`;
};

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

export const calculateCommission = (amount: number, commissionRate: number): number => {
  return Math.round((amount * commissionRate) / 100);
};

export const maskPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const last4 = cleaned.slice(-4);
  return `****${last4}`;
};

export const maskEmail = (email: string): string => {
  const [name, domain] = email.split('@');
  const maskedName = `${name.charAt(0)}${'*'.repeat(name.length - 2)}${name.charAt(
    name.length - 1,
  )}`;
  return `${maskedName}@${domain}`;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(delay * (i + 1));
    }
  }
  throw new Error('Max retries exceeded');
};
