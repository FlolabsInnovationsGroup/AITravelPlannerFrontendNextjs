"use client"
import Image from "next/legacy/image"
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { signIn } from '@/lib/api'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { Suspense } from 'react'
import { LinkedInLogoIcon } from "@radix-ui/react-icons"
import { Facebook, Linkedin } from 'lucide-react'



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

  const handleOAuthLogin = (loginProvider: string) => {

    if (loginProvider === 'google') {
      window.location.href = `http://localhost:8080/oauth2/authorization/google`;
    }else if (loginProvider === 'linkedin') {
      window.location.href = `http://localhost:8080/oauth2/authorization/linkedin`;
      }else {
        window.location.href = `http://localhost:8080/oauth2/authorization/facebook`;
        }
    }

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
          New member? <Link href="/auth/signup" className="text-blue-600 hover:underline">Sign up</Link>
        </p>
        <form onSubmit={handleSubmit}>
          <Input
            type="text"
            placeholder="Username"
            className="mb-4"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
          />
          <Input
            type="password"
            placeholder="Password"
            className="mb-6"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            className="w-full bg-black text-white hover:bg-gray-800 mb-4"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
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
        <div className="space-y-4">
        <Button variant="outline" className="w-full" onClick={()=>handleOAuthLogin('google')}>
          <Image src="/image/google.png" className="mr-4" alt="Google Logo" width={25} height={25}  style={{padding: 5}} />
          Sign in with Google
        </Button>
        <Button variant="outline" className="w-full" onClick={()=>handleOAuthLogin('linkedin')}>
          <LinkedInLogoIcon className="mr-4" style={{ width: 25, height: 25,color: '#0077B5' }}/>
          Sign in with LinkedIn
        </Button>
        <Button variant="outline" className="w-full" onClick={()=>handleOAuthLogin('facebook')}>
          <Facebook size={25} className="mr-4" style={{ color: '#FFFFFF', background: '#1877F2', borderRadius: 3 }}/>
          Sign in with Facebook
        </Button>
        </div>
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