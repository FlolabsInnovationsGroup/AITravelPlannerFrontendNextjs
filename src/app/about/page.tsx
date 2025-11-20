import Footer from "@/components/features/landing/Footer";
import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      
{/* HEADER - Matches Landing Page */}
<header className="fixed top-0 left-0 right-0 z-50 py-4 px-6 md:px-10 bg-black/30 backdrop-blur-md">
  <nav className="flex justify-between items-center">
  <Link href="/" className="flex items-center">
      <Image
        src="/logo.svg"
        alt="Flomad Travel Logo"
        width={25}
        height={25}
        style={{ width: 'auto', height: 'auto' }}
        className="mr-2"
      />
      <span className="text-white text-2xl font-semibold">Flomad Travel</span>
    </Link>

    {/* Centered Navigation */}
    <div className="flex items-center space-x-6">
      <Link href="/" className="text-white hover:text-gray-300">Home</Link>
        <Link href="/about" className="text-white hover:text-gray-300">About</Link>
      <Link href="/contact" className="text-white hover:text-gray-300">Contact</Link>
    </div>
  </nav>
</header>


      {/* ABOUT PAGE CONTENT */}
      <main className="flex-grow max-w-5xl mx-auto px-8 py-16 pt-60">

        <h1 className="text-5xl font-extrabold text-center mb-10 text-[#0056b3] tracking-tight">About Flomad Travel 🌍✈️</h1>
        
        <section className="bg-gray-100 rounded-lg p-8 shadow-lg">
          <p className="text-xl leading-relaxed text-gray-800">
            <strong>Revolutionizing Travel with AI</strong>
          </p>
          <p className="mt-4 text-lg text-gray-700">
            At <strong>Flomad Travel</strong>, we believe travel should be seamless, personalized, and stress-free.
            Our AI-powered platform helps travelers plan, explore, and book journeys with ease. Whether you&apos;re a 
            <strong> digital nomad, an adventure seeker, traveling for business, or vacation</strong>, our AI assistant provides 
            real-time recommendations, itinerary planning, and insider insights to enhance your experience.
          </p>
        </section>

        <h2 className="text-4xl font-semibold mt-14 text-[#0056b3] tracking-tight">Our Vision</h2>
        <p className="mt-4 text-lg text-gray-700">
          We aim to redefine travel by integrating AI and automation. With Flomad Travel, your next trip isn’t just a vacation—it’s a 
          personalized adventure, curated to your preferences.
        </p>

        <h2 className="text-4xl font-semibold mt-14 text-[#0056b3] tracking-tight">What We Offer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-100 p-6 rounded-lg shadow-md">
            <p className="text-lg text-gray-800">✅ <strong>AI-Powered Trip Planning</strong></p>
            <p className="text-gray-700">Get custom recommendations based on your interests and budget.</p>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg shadow-md">
            <p className="text-lg text-gray-800">✅ <strong>Smart Itineraries</strong></p>
            <p className="text-gray-700">Organize flights, accommodations, and activities seamlessly.</p>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg shadow-md">
            <p className="text-lg text-gray-800">✅ <strong>Real-Time Travel Assistance</strong></p>
            <p className="text-gray-700">Our AI chatbot provides instant travel help.</p>
          </div>
          <div className="bg-gray-100 p-6 rounded-lg shadow-md">
            <p className="text-lg text-gray-800">✅ <strong>Destination Insights</strong></p>
            <p className="text-gray-700">Discover hidden gems and top-rated attractions worldwide.</p>
          </div>
        </div>

        <h2 className="text-4xl font-semibold mt-14 text-[#0056b3] tracking-tight">Who We Are</h2>
        <p className="mt-4 text-lg text-gray-700">
          Flomad Travel is part of the <strong>Flomad ecosystem</strong>, a network of AI-driven projects designed to 
          enhance the way people work, travel, and live.
        </p>

        <h2 className="text-4xl font-semibold mt-14 text-[#0056b3] tracking-tight">Join the Flomad Community</h2>
        <p className="mt-4 text-lg text-gray-700">
          Whether you&apos;re planning your next getaway or looking for inspiration, Flomad Travel is here to guide you.  
        </p>

        <div className="flex justify-center mt-8">
          <Link href="/" className="px-6 py-3 bg-[#0056b3] hover:bg-[#004494] text-white rounded-lg text-lg font-medium shadow-lg transition duration-300">
            Explore Flomad Travel
          </Link>
        </div>

      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
