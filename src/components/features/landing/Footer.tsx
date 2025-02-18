import { Linkedin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Section - Brand & Description */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/logo.png" alt="Flomad Travel Logo" width={40} height={40} />
              <span className="text-2xl font-bold tracking-wide">Flomad Travel</span>
            </Link>
            <p className="text-sm text-gray-400 max-w-sm">
              Discover new destinations, plan your adventures, and travel seamlessly with Flomad Travel. Your journey starts here.
            </p>
          </div>

          {/* Right Section - Quick Links & Social */}
          <div className="flex flex-col space-y-6">
            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/" className="block text-sm text-gray-400 hover:text-gray-200 transition">Home</Link>
                <Link href="/about" className="block text-sm text-gray-400 hover:text-gray-200 transition">About Us</Link>
                <Link href="/contact" className="block text-sm text-gray-400 hover:text-gray-200 transition">Contact</Link>
                
              </div>
            </div>

            {/* Social Media (Only LinkedIn) */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Follow Us</h3>
              <a 
                href="https://www.linkedin.com/company/flomad-labs-r-d/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center space-x-2 text-sm text-gray-400 hover:text-gray-200 transition"
              >
                <Linkedin size={24} />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
