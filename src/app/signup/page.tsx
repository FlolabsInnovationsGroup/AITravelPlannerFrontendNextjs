import type { Metadata } from 'next'
import { SignUp } from '@/components/SignUp'

export const metadata: Metadata = {
  title: 'Sign Up',
  robots: { index: false, follow: true },
}

export default function SignUpPage() {
  return <SignUp />
}