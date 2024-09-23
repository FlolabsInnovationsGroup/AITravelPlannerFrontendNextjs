"use client"

import Image from "next/legacy/image"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { signIn } from '@/lib/api' // Import the login function
import { useState } from 'react'
import { useAuth } from '@/components/AuthContext';
import { toast } from 'react-hot-toast'

export function SignIn() {
  const router = useRouter()
  const [username, setUsername] = useState('') // Changed from email to username
  const [password, setPassword] = useState('')
  // const [isLoading, setIsLoading] = useState(false)
  const { signIn: authSignIn } = useAuth();

  const handleCancel = () => {
    router.push('/') // Navigate back to the home page
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await signIn(username, password);
      if (response.status === 200) {
        authSignIn(response.data.token);
        router.push('/chat');
      }
    } catch (error) {
      toast.error('Sign-in failed. Please check your credentials.');
      console.error('Error during sign-in:', error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 relative">
        <button 
          onClick={handleCancel}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="flex items-center mb-6">
          <Image src="/logo.png" alt="Flomad Travel Logo" width={24} height={24} />
          <span className="ml-2 text-xl font-semibold">flomad travel</span>
        </div>
        
        <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
        <p className="text-gray-600 mb-6">
          New member? <Link href="/signup" className="text-blue-600 hover:underline">Sign up</Link>
        </p>
        
        <form onSubmit={handleSubmit}>
          <Input 
            type="text" // Changed type to text for username
            placeholder="Username" // Updated placeholder
            className="mb-4" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input 
            type="password" 
            placeholder="Password" 
            className="mb-6"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800 mb-4">
            Sign in
          </Button>
        </form>
        
        <Link href="/forgot-password" className="block text-center text-blue-600 hover:underline mb-4">
          Forgot password?
        </Link>
        
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>
        
        <Button variant="outline" className="w-full">
          <Image src="/image/google.png" alt="Google Logo" width={20} height={20} className="mr-2" />
          Sign in with Google
        </Button>
      </div>
    </div>
  )
}