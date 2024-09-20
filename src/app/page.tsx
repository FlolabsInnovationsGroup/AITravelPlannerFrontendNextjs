"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { WeProvideBest } from '@/components/WeProvideBest'
import { FeaturedTourPlaces } from '@/components/FeaturedTourPlaces'
import { TopCities } from '@/components/TopCities'
import { ExploreSection } from '@/components/ExploreSection'
import { TourPartners } from '@/components/TourPartners'
import { Testimonials } from '@/components/Testimonials'
import { createSession, sendChat } from '@/lib/api'


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

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      )
    }, 5000)

    return () => clearInterval(intervalId)
  }, [])

  const handleStartChat = async () => {
    if (!message.trim()) return

    setIsLoading(true)
    try {
      const newSession = await createSession('New Chat')
      router.push(`/chat?sessionId=${newSession.sessionId}&initialMessage=${encodeURIComponent(message)}`)
    } catch (error) {
      console.error('Error starting chat:', error)
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      <div className="relative h-screen">
        {/* Background Images */}
        {backgroundImages.map((img, index) => (
          <Image
            key={img}
            src={img}
            alt={`Travel scene ${index + 1}`}
            layout="fill"
            objectFit="cover"
            quality={100}
            priority={index === 0}
            className={`transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black opacity-30"></div>
        
        {/* Hero Content */}
        <div className="relative z-10 flex flex-col h-full">
          <header className="py-4 px-6 md:px-10">
            <nav className="flex justify-between items-center">
              <div className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Flomad Travel Logo"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                <span className="text-white text-2xl font-semibold">flomad travel</span>
              </div>
              <div className="flex items-center space-x-6">
                <Link href="/about" className="text-white hover:text-gray-300">about</Link>
                <Link href="/contact" className="text-white hover:text-gray-300">contact</Link>
                <Link href="/signup" passHref>
                  <Button variant="secondary" className="bg-white text-black hover:bg-gray-200">
                    Create Account
                  </Button>
                </Link>
              </div>
            </nav>
          </header>

          <main className="flex-grow flex items-center px-6 md:px-10">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Explore The World<br />In Comfort.
          </h1>
          <p className="text-xl text-white mb-8">Explore your way, all the way.</p>
          <div className="flex">
            <Input
              type="text"
              placeholder="start planning your trip..."
              className="rounded-r-none flex-grow bg-white text-black"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button 
              className="rounded-l-none bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handleStartChat}
              disabled={isLoading}
            >
              {isLoading ? 'Starting...' : 'start chatting'}
            </Button>
          </div>
        </div>
      </main>
        </div>
      </div>

      <WeProvideBest />
      <FeaturedTourPlaces />
      <ExploreSection />
      <TopCities />
      <Testimonials />
      {/* <TourPartners /> */}

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Add footer content here */}
          </div>
        </div>
      </footer>
    </div>
  )
}