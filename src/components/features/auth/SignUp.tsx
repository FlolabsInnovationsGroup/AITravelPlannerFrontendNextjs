"use client"

import Image from "next/image"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { signUp } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { LinkedInLogoIcon } from "@radix-ui/react-icons"
import { Facebook, X } from 'lucide-react'

export function SignUp() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCancel = () => router.push('/')

  const handleOAuthLogin = (provider: string) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/${provider}`
    window.location.href = url
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }
    setIsLoading(true)
    try {
      const result = await signUp(username, email, password)
      const serverMessage = result?.message
      toast.success(serverMessage || 'Account created. You are now signed in.')
      router.push(serverMessage?.toLowerCase().includes('logged in') ? '/' : '/auth/signin')
    } catch (error: any) {
      const data = error.response?.data
      const status = error.response?.status
      const serverMessage = data?.message ?? data?.error
      if (status === 409) {
        toast.error(serverMessage || 'Username or email already in use.')
      } else if (status === 400) {
        toast.error(serverMessage || 'Invalid input. Check username, email, and password (min 8 characters).')
      } else {
        toast.error(serverMessage || error.message || 'Failed to sign up. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-100 p-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-stone-200/80 overflow-hidden">
          {/* Header */}
          <div className="relative px-8 pt-8 pb-6 border-b border-stone-100">
            <button
              type="button"
              onClick={handleCancel}
              className="absolute top-6 right-6 p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-6">
              <Image src="/logo.svg" alt="" width={28} height={28} className="object-contain" />
              <span className="text-lg font-semibold text-stone-800 tracking-tight">Travel Planner</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Create an account</h1>
            <p className="mt-1.5 text-sm text-stone-500">
              Already have an account?{" "}
              <Link href="/auth/signin" className="font-medium text-amber-600 hover:text-amber-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="p-8 pt-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="signup-username" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Username
                </label>
                <Input
                  id="signup-username"
                  type="text"
                  placeholder="Choose a username"
                  className="h-11 rounded-lg border-stone-200 bg-stone-50/50 focus:bg-white transition-colors"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Email
                </label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  className="h-11 rounded-lg border-stone-200 bg-stone-50/50 focus:bg-white transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Password
                </label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="At least 8 characters"
                  className="h-11 rounded-lg border-stone-200 bg-stone-50/50 focus:bg-white transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="signup-confirm" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Confirm password
                </label>
                <Input
                  id="signup-confirm"
                  type="password"
                  placeholder="Repeat your password"
                  className="h-11 rounded-lg border-stone-200 bg-stone-50/50 focus:bg-white transition-colors"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-6 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium shadow-sm transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account…' : 'Sign up'}
            </Button>
          </form>

          {/* Divider */}
          <div className="px-8 pb-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-medium uppercase tracking-wider text-stone-400">Or continue with</span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-lg border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-medium"
                onClick={() => handleOAuthLogin('google')}
              >
                <Image src="/image/google.png" alt="" width={20} height={20} className="mr-3 object-contain" />
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-lg border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-medium"
                onClick={() => handleOAuthLogin('linkedin')}
              >
                <LinkedInLogoIcon className="mr-3 h-5 w-5 text-[#0A66C2]" />
                LinkedIn
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-lg border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-medium"
                onClick={() => handleOAuthLogin('facebook')}
              >
                <Facebook className="mr-3 h-5 w-5 text-[#1877F2]" />
                Facebook
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
