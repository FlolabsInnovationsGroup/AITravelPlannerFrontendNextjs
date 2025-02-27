import { Linkedin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Left Section - Brand & Description */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/image/logowhite.png" alt="Flomad Travel Logo" width={50} height={50} />
              <span className="text-2xl font-bold tracking-wide text-white">Flomad Travel</span>
            </Link>
            <p className="text-sm text-gray-400 max-w-sm">
              Discover new destinations, plan your adventures, and travel seamlessly with Flomad Travel. Your journey starts here.
            </p>
          </div>

          {/* Center Section - Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link href="/" className="block text-sm text-gray-400 hover:text-gray-200 transition">Home</Link>
              <Link href="/about" className="block text-sm text-gray-400 hover:text-gray-200 transition">About Us</Link>
              <Link href="/contact" className="block text-sm text-gray-400 hover:text-gray-200 transition">Contact</Link>
            </div>
          </div>

          {/* Right Section - Social Media */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex items-center space-x-3">
              <a 
                href="https://www.linkedin.com/company/flomad-labs-r-d/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center space-x-2 text-sm text-gray-400 hover:text-gray-200 transition"
              >
                <Linkedin size={28} />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
