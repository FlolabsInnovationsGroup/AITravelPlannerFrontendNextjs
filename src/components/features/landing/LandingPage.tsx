'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createSession } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

const WeProvideBest = dynamic(() => import('@/components/features/landing/WeProvideBest').then(mod => mod.WeProvideBest))
const FeaturedTourPlaces = dynamic(() => import('@/components/features/landing/FeaturedTourPlaces').then(mod => mod.FeaturedTourPlaces))
const TopCities = dynamic(() => import('@/components/features/landing/TopCities').then(mod => mod.TopCities))
const ExploreSection = dynamic(() => import('@/components/features/landing/ExploreSection').then(mod => mod.ExploreSection))
const TourPartners = dynamic(() => import('@/components/features/landing/TourPartners').then(mod => mod.TourPartners))
const Testimonials = dynamic(() => import('@/components/features/landing/Testimonials').then(mod => mod.Testimonials))
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
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      )
    }, 5000)

    return () => clearInterval(intervalId)
  }, [])

  const handleStartChat = useCallback(async () => {
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }

    setIsLoading(true)
    try {
      const sessionResponse = await createSession('New Chat')
      console.log('Session created:', sessionResponse)
      router.push(
        `/chat?sessionId=${sessionResponse.sessionId}&initialMessage=${encodeURIComponent(message)}`
      )
    } catch (error) {
      console.error('Error starting chat:', error)
      toast.error('Failed to start chat. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [message, router])

  return (
    <div className="flex flex-col min-h-screen">
      <div className="relative h-screen">
        {backgroundImages.map((img, index) => (
          <div key={img} className="absolute inset-0">
            <Image
              src={img}
              alt={`Travel scene ${index + 1}`}
              fill
              sizes="100vw"
              quality={85}
              priority={index === 0}
              className={`object-cover transition-opacity duration-1000 ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        ))}
        
        <div className="absolute inset-0 bg-black opacity-30" />
        
        <div className="relative z-10 flex flex-col h-full">
        <header className="fixed top-0 left-0 right-0 z-50 py-4 px-6 md:px-10 bg-black/30 backdrop-blur-md">
  <nav className="flex justify-between items-center">

              <div className="flex items-center">
                <Image
                  src="/image/logowhite.png"
                  alt="Flomad Travel Logo"
                  width={20}
                  height={25}
                  style={{ width: 'auto', height: 'auto' }}
                  className="mr-2"
                />
                <span className="text-white text-2xl font-semibold">Flomad Travel</span>
              </div>
              <div className="flex items-center space-x-6">
                <Link href="/about" className="text-white hover:text-gray-300">About</Link>
                <Link href="/contact" className="text-white hover:text-gray-300">Contact</Link>
                <Link href={isAuthenticated ? "/chat" : "/auth/signup"} passHref>
                  <Button variant="secondary" className="bg-white text-black hover:bg-gray-200">
                    {isAuthenticated ? "Go to Chat" : "Create Account"}
                  </Button>
                </Link>
              </div>
            </nav>
          </header>

          <main className="flex-grow flex items-center px-6 md:px-10">
            <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
  Explore your way,<br />all the way.
</h1>

              <div className="flex">
                <Input
                  type="text"
                  placeholder="Start planning your trip..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-grow"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                      e.preventDefault()
                      handleStartChat()
                    }
                  }}
                />
                <Button 
                  onClick={handleStartChat}
                  disabled={isLoading || !message.trim()}
                  className="ml-2 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Starting...
                    </div>
                  ) : (
                    'Start Chatting'
                  )}
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>

      <WeProvideBest />
      <FeaturedTourPlaces />
      {/*<ExploreSection /> */}
      <TopCities />
      {/*<Testimonials /> */}
      <Footer />
    </div>
  )
}