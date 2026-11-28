import type { Metadata } from 'next'
import { SignIn } from '@/components/SignIn'

export const metadata: Metadata = {
  title: 'Sign In',
  robots: { index: false, follow: true },
}

export default function SignInPage() {
  return <SignIn />
}