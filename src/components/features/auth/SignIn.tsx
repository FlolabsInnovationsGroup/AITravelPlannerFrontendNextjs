"use client"

import Image from "next/image"
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { signIn } from '@/lib/api'
import { useEffect, useState, Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { LinkedInLogoIcon } from "@radix-ui/react-icons"
import { Facebook, X } from 'lucide-react'

function SignInContent() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()
  const { signIn: authSignIn } = useAuth()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      toast.error(`Authentication failed: ${error}`)
    }
  }, [searchParams])

  const handleCancel = () => router.push('/')

  const handleOAuthLogin = (provider: string) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/${provider}`
    window.location.href = url
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await signIn(username, password)
      if (response?.message?.toLowerCase().includes('success')) {
        authSignIn('session-auth')
        toast.success('Signed in successfully!')
        router.push('/')
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      const data = error.response?.data
      const status = error.response?.status
      const serverMessage = data?.message ?? data?.error
      if (status === 401) {
        toast.error(serverMessage || 'Invalid credentials. Please check your username and password.')
      } else if (status === 500) {
        toast.error(serverMessage || 'Server error. Please try again later.')
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        toast.error('Cannot reach the server. Is the backend running?')
      } else {
        toast.error(serverMessage || error.message || 'Sign-in failed.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-100 p-4">
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
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Welcome back</h1>
            <p className="mt-1.5 text-sm text-stone-500">
              New here?{" "}
              <Link href="/auth/signup" className="font-medium text-amber-600 hover:text-amber-700 transition-colors">
                Create an account
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 pt-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="signin-username" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Username
                </label>
                <Input
                  id="signin-username"
                  type="text"
                  placeholder="Enter your username"
                  className="h-11 rounded-lg border-stone-200 bg-stone-50/50 focus:bg-white transition-colors"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="signin-password" className="block text-sm font-medium text-stone-700 mb-1.5">
                  Password
                </label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="Enter your password"
                  className="h-11 rounded-lg border-stone-200 bg-stone-50/50 focus:bg-white transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="mt-2 flex justify-end">
              <Link href="/auth/forgot-password" className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-6 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium shadow-sm transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {/* Divider */}
          <div className="px-8 pb-6">
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

export function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="animate-pulse text-stone-400">Loading…</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
