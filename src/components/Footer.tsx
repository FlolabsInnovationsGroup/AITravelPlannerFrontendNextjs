import { Facebook, Twitter, Linkedin } from 'lucide-react'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Image src="/logo.svg" alt="Flomad Travel Logo" width={24} height={24} style={{ width: 'auto', height: 'auto' }} className="object-contain" />
              <span className="text-xl font-bold">flomad travel</span>
            </div>
            <p className="text-sm text-gray-400 max-w-md">
              There are many variations of passages of available, but the majority have suffered alteration in some form
            </p>
          </div>

          {/* Right column */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Social media icons */}
            <div className="space-y-4">
              <button type="button" className="flex items-center space-x-2 text-sm hover:text-gray-300 bg-transparent border-none cursor-pointer">
                <Facebook size={20} />
                <span>Facebook</span>
              </button>
              <button type="button" className="flex items-center space-x-2 text-sm hover:text-gray-300 bg-transparent border-none cursor-pointer">
                <Twitter size={20} />
                <span>Twitter</span>
              </button>
              <button type="button" className="flex items-center space-x-2 text-sm hover:text-gray-300 bg-transparent border-none cursor-pointer">
                <Linkedin size={20} />
                <span>LinkedIn</span>
              </button>
            </div>

            {/* Recent Post */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Post</h3>
              <div className="space-y-2">
                {/* <a href="#" className="block text-sm hover:text-gray-300">Top 5 Himalayan Treks</a>
                <p className="text-xs text-gray-400">May 17, 2021</p> */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}