import { Linkedin } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-white py-14 border-t border-stone-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/logo.svg" alt="" width={32} height={32} className="object-contain" />
              <span className="text-xl font-semibold tracking-tight text-white">Travel Planner</span>
            </Link>
            <p className="text-sm text-stone-400 max-w-xs leading-relaxed">
              Discover new destinations, plan your adventures, and travel seamlessly with our AI Travel Planner. Your journey starts here.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-4">Quick Links</h2>
            <nav className="space-y-2">
              <Link href="/" className="block text-sm text-stone-400 hover:text-amber-400 transition-colors">Home</Link>
              <Link href="/about" className="block text-sm text-stone-400 hover:text-amber-400 transition-colors">About Us</Link>
              <Link href="/contact" className="block text-sm text-stone-400 hover:text-amber-400 transition-colors">Contact</Link>
            </nav>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-4">Follow Us</h2>
            <a
              href="https://www.linkedin.com/company/flomad-labs-r-d/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-amber-400 transition-colors"
            >
              <Linkedin className="w-5 h-5" />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
