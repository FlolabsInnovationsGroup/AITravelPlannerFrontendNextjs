// src/components/SignUp.tsx

"use client"

import Image from "next/image"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { signUp } from '@/lib/api'
import { toast } from 'react-hot-toast'

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
  const handleOAuthLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/oauth2/authorization/google`;
  };
  
  

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    
    
    setIsLoading(true);
    try {
      /* const response = */ await signUp(username, email, password);
      // Signup successful
      toast.success('Signup successful! Please check your email for verification.');
      router.push('/signin');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.response?.data?.message || 'Failed to sign up. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md relative">
        <button 
          type="button"
          onClick={handleCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <Image 
              src="/logo.svg" 
              alt="Flomad Travel Logo" 
              width={80} 
              height={80} 
              className="object-contain"
              priority
            />
          </div>
          <span className="text-2xl font-bold text-gray-900">flomad travel</span>
        </div>
        
        <h2 className="text-2xl font-bold mb-2 text-center">Sign up for free!</h2>
        <p className="text-gray-600 mb-6 text-center">
          Have an account? <Link href="/signin" className="text-blue-600 hover:underline font-medium">Login</Link>
        </p>
        
        <form onSubmit={handleSignUp} className="space-y-4">
          <Input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="h-11"
          />
          <Input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11"
          />
          <Input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11"
          />
          <Input 
            type="password" 
            placeholder="Confirm Password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="h-11"
          />
          
          <Button 
            type="submit" 
            className="w-full bg-black text-white hover:bg-gray-800 h-11 mt-6" 
            disabled={isLoading}
          >
            {isLoading ? 'Signing up...' : 'Sign up'}
          </Button>
        </form>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full h-11 flex items-center justify-center gap-3" 
          onClick={handleOAuthLogin}
        >
          <Image 
            src="/image/google.png" 
            alt="Google Logo" 
            width={20} 
            height={20} 
            className="object-contain"
          />
          <span>Sign up with Google</span>
        </Button>
      </div>
    </div>
  )
}