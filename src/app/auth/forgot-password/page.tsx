import type { Metadata } from 'next'
import { ForgotPassword } from '@/components/features/auth/ForgotPassword'

export const metadata: Metadata = {
  title: 'Reset Password',
  robots: { index: false, follow: true },
  alternates: { canonical: '/forgot-password' },
}

export default function ForgotPasswordPage() {
  return <ForgotPassword />
}
