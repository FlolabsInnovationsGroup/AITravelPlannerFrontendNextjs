import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/features/landing/Footer"; 

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* HEADER - Matches Landing Page */}
      <header className="fixed top-0 left-0 right-0 z-50 py-4 px-6 md:px-10 bg-black/30 backdrop-blur-md">
        <nav className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image src="/logo.png" alt="Flomad Travel Logo" width={20} height={25} className="mr-2" />
            <span className="text-white text-2xl font-semibold">Flomad Travel</span>
          </Link>
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-white hover:text-gray-300">Home</Link>
            <Link href="/about" className="text-white hover:text-gray-300">About</Link>
            <Link href="/contact" className="text-white hover:text-gray-300">Contact</Link>
          </div>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow max-w-5xl mx-auto px-8 py-16 pt-24">
        <h1 className="text-5xl font-extrabold text-center mb-10 text-[#0056b3] tracking-tight">
          Get in Touch 📩
        </h1>

        {/* CONTACT INFORMATION & FORM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Details */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Contact Details</h2>
            <p className="text-lg text-gray-700">We’d love to hear from you! Feel free to reach out.</p>
            
            <div className="space-y-3 text-lg text-gray-600">
              <p>Email: <a href="mailto:hr@flomadlabs.com" className="text-blue-500 hover:underline">Email Us</a></p>
              <p>LinkedIn: <a href="https://www.linkedin.com/company/flomad-labs-r-d/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Send us a message</a></p>
            </div>
          </div>

          {/* Contact Form */}
          {/* <div className="bg-gray-100 p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Send Us a Message</h2>
            <form className="space-y-4">
              <input 
                type="text" 
                placeholder="Your Name" 
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required 
              />
              <input 
                type="email" 
                placeholder="Your Email" 
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required 
              />
              <textarea 
                rows={4} 
                placeholder="Your Message" 
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required 
              />
              <button 
                type="submit" 
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition"
              >
                Send Message
              </button>
            </form>
          </div> */}
        </div> 
      </main>
      {/* FOOTER*/}
      <Footer />
    </div>
  );
}
