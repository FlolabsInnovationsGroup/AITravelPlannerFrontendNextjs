"use client"

import Image from "next/image"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { signUp } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { LinkedInLogoIcon } from "@radix-ui/react-icons"
import { Facebook, Linkedin } from 'lucide-react'

export function SignUp() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCancel = () => {
    router.push('/')
  }

  const handleOAuthLogin = (loginProvider: string) => {

    if (loginProvider === 'google') {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/google`;
    } else if (loginProvider === 'linkedin') {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/linkedin`;
    } else {
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/facebook`;
    }
  }


  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }



    setIsLoading(true);
    try {
      const response = await signUp(username, email, password);
      // Signup successful
      toast.success('Signup successful! Please check your email for verification.');
      router.push('/auth/signin');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.response?.data?.message || 'Failed to sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 relative">
        <button
          type="button"
          onClick={handleCancel}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center mb-6">
          <Image src="/logo.png" alt="Flomad Travel Logo" width={24} height={24} style={{ width: 'auto', height: 'auto' }} />
          <span className="ml-2 text-xl font-semibold">flomad travel</span>
        </div>

        <h2 className="text-2xl font-bold mb-2">Sign up for free!</h2>
        <p className="text-gray-600 mb-6">
          Have an account? <Link href="/auth/signin" className="text-blue-600 hover:underline">Login</Link>
        </p>

        <form onSubmit={handleSignUp}>
          <Input
            type="text"
            placeholder="Username"
            className="mb-4"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Email"
            className="mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            className="mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Confirm Password"
            className="mb-6"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800 mb-4" disabled={isLoading}>
            {isLoading ? 'Signing up...' : 'Sign up'}
          </Button>
        </form>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>

        <div className="space-y-4">
          <Button variant="outline" className="w-full" onClick={() => handleOAuthLogin('google')}>
            <Image src="/image/google.png" className="mr-4" alt="Google Logo" width={25} height={25} style={{ width: 'auto', height: 'auto' }} />
            Signup in with Google
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleOAuthLogin('linkedin')}>
            <LinkedInLogoIcon className="mr-4" style={{ width: 25, height: 25, color: '#0077B5' }} />
            Signup in with LinkedIn
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleOAuthLogin('facebook')}>
            <Facebook size={25} className="mr-4" style={{ color: '#FFFFFF', background: '#1877F2', borderRadius: 3 }} />
            Signup in with Facebook
          </Button>
        </div>
      </div>
    </div>
  )
}
