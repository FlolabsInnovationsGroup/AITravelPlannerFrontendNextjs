'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createSession } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Menu, X } from 'lucide-react'

const WeProvideBest = dynamic(() => import('@/components/features/landing/WeProvideBest').then(mod => mod.WeProvideBest))
const FeaturedTourPlaces = dynamic(() => import('@/components/features/landing/FeaturedTourPlaces').then(mod => mod.FeaturedTourPlaces))
const TopCities = dynamic(() => import('@/components/features/landing/TopCities').then(mod => mod.TopCities))
const Footer = dynamic(() => import('@/components/features/landing/Footer').then(mod => mod.default))

const backgroundImages = [
  '/travel1.jpg',
  '/mountain-landscape.jpg',
  '/travel2.jpg',
]

export default function LandingPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const handleStartChat = useCallback(async () => {
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }
    setIsLoading(true)
    try {
      const sessionResponse = await createSession('New Chat')
      if (!sessionResponse.sessionId) throw new Error('No session ID returned')
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('sentMessage')
        sessionStorage.removeItem('initialMessage')
      }
      router.push(`/chat?sessionId=${sessionResponse.sessionId}&initialMessage=${encodeURIComponent(message)}`)
    } catch (error) {
      console.error('Error starting chat:', error)
      toast.error('Failed to start chat. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [message, router])

  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      {/* Hero */}
      <div className="relative min-h-[90vh] flex flex-col">
        {backgroundImages.map((img, index) => (
          <div key={img} className="absolute inset-0">
            <Image
              src={img}
              alt=""
              fill
              sizes="100vw"
              priority={index === 0}
              className={`object-cover transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

        {/* Nav */}
        <header className="relative z-10 w-full">
          <nav className="flex items-center justify-between px-4 py-4 sm:px-6 md:px-10 max-w-7xl mx-auto">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <Image src="/logo.svg" alt="" width={32} height={32} className="object-contain flex-shrink-0 -translate-y-1" />
              <span className="text-white text-lg font-semibold tracking-tight -translate-y-1 block">Travel Planner</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/about" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
                Contact
              </Link>
              {isAuthenticated ? (
                <Link href="/chat">
                  <Button className="rounded-lg bg-white text-stone-900 hover:bg-stone-100 font-medium">
                    Go to Chat
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/signin" className="text-sm font-medium text-white/90 hover:text-white transition-colors">
                    Sign in
                  </Link>
                  <Link href="/auth/signup">
                    <Button className="rounded-lg bg-amber-500 text-white hover:bg-amber-600 font-medium border-0">
                      Create Account
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/10 rounded-lg"
              onClick={toggleMobileMenu}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </nav>

          {isMobileMenuOpen && (
            <div className="md:hidden absolute top-full left-0 right-0 mx-4 mt-2 rounded-xl bg-stone-900/95 backdrop-blur-md border border-stone-700/50 p-4 shadow-xl">
              <Link href="/about" className="block py-3 text-white/90 hover:text-white font-medium" onClick={toggleMobileMenu}>
                About
              </Link>
              <Link href="/contact" className="block py-3 text-white/90 hover:text-white font-medium" onClick={toggleMobileMenu}>
                Contact
              </Link>
              {isAuthenticated ? (
                <Link href="/chat" onClick={toggleMobileMenu}>
                  <Button className="w-full mt-3 rounded-lg bg-white text-stone-900 hover:bg-stone-100">Go to Chat</Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/signin" className="block py-3 text-white/90 hover:text-white font-medium" onClick={toggleMobileMenu}>
                    Sign in
                  </Link>
                  <Link href="/auth/signup" onClick={toggleMobileMenu}>
                    <Button className="w-full mt-3 rounded-lg bg-amber-500 text-white hover:bg-amber-600 border-0">Create Account</Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </header>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex items-center px-4 sm:px-6 md:px-10 max-w-4xl mx-auto w-full pb-20">
          <div className="w-full">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight drop-shadow-lg">
              Explore your way,<br />all the way.
            </h1>
            <p className="mt-4 text-lg text-white/90 max-w-xl">
              The best AI travel system is here to help you plan trips—accommodations, flights, and experiences.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-2xl">
              <Input
                type="text"
                placeholder="e.g. Weekend in Paris, beach trip to Bali..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                    e.preventDefault()
                    handleStartChat()
                  }
                }}
                className="flex-1 h-12 rounded-lg bg-white/95 border-0 text-gray-900 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-amber-400"
              />
              <Button
                onClick={handleStartChat}
                disabled={isLoading || !message.trim()}
                className="h-12 px-6 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium border-0 shrink-0"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Starting...
                  </span>
                ) : (
                  'Start Chatting'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <WeProvideBest />
      <FeaturedTourPlaces />
      <TopCities />
      <Footer />
    </div>
  )
}
