import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import PinCheckWrapper from '@/components/auth/PinCheckWrapper'
import { Toaster } from 'sonner'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'AB Data Hub - Fast VTU Platform',
  description: "Nigeria's fastest VTU platform for data, airtime, cable TV, electricity bills and exam pins. The Pride of Data.",
  keywords: ['VTU', 'data', 'airtime', 'Nigeria', 'fintech', 'AB Data Hub', 'bill payment'],
  openGraph: {
    title: 'AB Data Hub - Fast VTU Platform',
    description: "Nigeria's fastest VTU platform for data, airtime, and more. The Pride of Data.",
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <PinCheckWrapper>
            {children}
          </PinCheckWrapper>
          <Toaster richColors position="top-right" closeButton theme="dark" />
        </AuthProvider>
      </body>
    </html>
  )
}
