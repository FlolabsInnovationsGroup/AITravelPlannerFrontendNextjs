"use client"

import Image from "next/image"
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { signIn } from '@/lib/api'
import { useEffect, useState , Suspense } from 'react'
import { useAuth } from '@/components/contexts/AuthContext'
import { toast } from 'react-hot-toast'


function SignInContent() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams();
  const { signIn: authSignIn } = useAuth();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast.error(`Authentication failed: ${error}`);
    }
  }, [searchParams]);

  const handleCancel = () => {
    router.push('/')
  }

  const handleOAuthLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/google`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await signIn(username, password);
      if (response.token) {
        authSignIn(response.token);
        router.push('/chat');
        toast.success('Signed in successfully!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error during sign-in:', error);
      toast.error('Sign-in failed. Please check your credentials.');
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

        <h2 className="text-2xl font-bold mb-2 text-center">Welcome back!</h2>
        <p className="text-gray-600 mb-6 text-center">
          New member? <Link href="/signup" className="text-blue-600 hover:underline font-medium">Sign up</Link>
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
            className="h-11"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-11"
          />
          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-gray-800 h-11 mt-6"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        
        <Link href="/auth/forgot-password" className="block text-center text-blue-600 hover:underline mt-4 mb-4 font-medium">
          Forgot password?
        </Link>

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
          Sign in with Google
        </Button>
      </div>
    </div>
  )
}

export function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}
