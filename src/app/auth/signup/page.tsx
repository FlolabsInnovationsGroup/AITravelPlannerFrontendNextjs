import type { Metadata } from 'next'
import { SignUp } from '@/components/features/auth/SignUp'

export const metadata: Metadata = {
  title: 'Sign Up',
  robots: { index: false, follow: true },
}

export default function SignUpPage() {
  return <SignUp />
}