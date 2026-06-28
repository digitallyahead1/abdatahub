import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(3, 'Email or Phone is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    phoneNumber: z
      .string()
      .regex(/^(\+234|0)[0-9]{10}$/, 'Invalid phone number'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const dataTransactionSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^(\+234|0)[0-9]{10}$/, 'Invalid phone number'),
  network: z.enum(['mtn', 'airtel', 'glo', '9mobile']),
  planId: z.string().min(1, 'Please select a data plan'),
  amount: z.number().min(10, 'Amount must be at least 10'),
})

export const airtimeTransactionSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^(\+234|0)[0-9]{10}$/, 'Invalid phone number'),
  network: z.enum(['mtn', 'airtel', 'glo', '9mobile']),
  amount: z.number().min(10, 'Amount must be at least 10'),
})

export const walletFundSchema = z.object({
  amount: z.number().min(100, 'Minimum amount is 100'),
  paymentMethod: z.enum(['paystack', 'flutterwave', 'moniepoint']),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type DataTransactionInput = z.infer<typeof dataTransactionSchema>
export type AirtimeTransactionInput = z.infer<typeof airtimeTransactionSchema>
export type WalletFundInput = z.infer<typeof walletFundSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const verifyOtpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^[0-9]+$/, 'OTP must contain only numbers'),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

