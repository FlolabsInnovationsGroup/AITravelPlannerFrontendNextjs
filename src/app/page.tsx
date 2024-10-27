'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/legacy/image";
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WeProvideBest } from '@/components/WeProvideBest';
import { FeaturedTourPlaces } from '@/components/FeaturedTourPlaces';
import { TopCities } from '@/components/TopCities';
import { ExploreSection } from '@/components/ExploreSection';
import { TourPartners } from '@/components/TourPartners';
import { Testimonials } from '@/components/Testimonials';
import Footer from '@/components/Footer';
import { createSession, sendMessage } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/components/contexts/AuthContext';

const backgroundImages = [
  '/travel1.jpg',
  '/mountain-landscape.jpg',
  '/travel2.jpg',
];

export default function LandingPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      );
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const handleStartChat = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsLoading(true);
    try {
      // Create new session
      const sessionResponse = await createSession('New Chat');
      console.log('Session created:', sessionResponse);

      // Send initial message
      const chatResponse = await sendMessage(message, sessionResponse.sessionId);
      console.log('Initial message sent:', chatResponse);

      // Navigate to chat with session and message
      router.push(`/chat?sessionId=${sessionResponse.sessionId}&initialMessage=${encodeURIComponent(message)}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
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
        <div className="absolute inset-0 bg-black opacity-30" />
        
        {/* Hero Content */}
        <div className="relative z-10 flex flex-col h-full">
          <header className="py-4 px-6 md:px-10">
            <nav className="flex justify-between items-center">
              <div className="flex items-center">
                <Image
                  src="/logo.png"
                  alt="Flomad Travel Logo"
                  width={20}
                  height={25}
                  className="mr-2"
                />
                <span className="text-white text-2xl font-semibold">flomad travel</span>
              </div>
              <div className="flex items-center space-x-6">
                <Link href="/about" className="text-white hover:text-gray-300">about</Link>
                <Link href="/contact" className="text-white hover:text-gray-300">contact</Link>
                <Link href={isAuthenticated ? "/chat" : "/signup"} passHref>
                  <Button variant="secondary" className="bg-white text-black hover:bg-gray-200">
                    {isAuthenticated ? "Go to Chat" : "Create Account"}
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
              <p className="text-xl text-white mb-8">
                Explore your way, all the way.
              </p>
              <div className="flex">
                <Input
                  type="text"
                  placeholder="Start planning your trip..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-grow"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                      e.preventDefault();
                      handleStartChat();
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

      {/* Additional sections */}
      <WeProvideBest />
      <FeaturedTourPlaces />
      <ExploreSection />
      <TopCities />
      <Testimonials />
      <Footer />
    </div>
  );
}