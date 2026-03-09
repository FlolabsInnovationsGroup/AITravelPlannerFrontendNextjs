import Footer from "@/components/features/landing/Footer";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, MapPin, CalendarDays, MessageCircle, Compass, ArrowRight, Globe } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      {/* Header - same structure and position as landing/contact */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-stone-900/95 backdrop-blur-md border-b border-stone-800">
        <nav className="flex items-center justify-between px-4 py-4 sm:px-6 md:px-10 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/logo.svg" alt="" width={32} height={32} className="object-contain flex-shrink-0" />
            <span className="text-white text-lg font-semibold tracking-tight">Travel Planner</span>
          </Link>
          <div className="flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-stone-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/about" className="text-sm font-medium text-amber-400">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium text-stone-300 hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-grow max-w-5xl mx-auto px-6 sm:px-8 pt-28 pb-16">
        {/* Hero */}
        <section className="text-center mb-16">
          <p className="text-amber-600 font-semibold text-sm uppercase tracking-wider mb-3">
            Your journey, smarter
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 tracking-tight max-w-2xl mx-auto leading-tight">
            Travel planning that adapts to you
          </h1>
          <p className="mt-5 text-lg text-stone-600 max-w-xl mx-auto">
            We combine AI with real-world travel data so you get personalized recommendations, clear itineraries, and support—before, during, and after your trip.
          </p>
        </section>

        {/* Mission card */}
        <section className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-8 sm:p-10 text-white shadow-xl mb-16">
          <div className="flex items-center gap-2 text-amber-400 mb-4">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold text-sm uppercase tracking-wider">Our mission</span>
          </div>
          <p className="text-xl sm:text-2xl font-medium text-white/95 leading-relaxed max-w-2xl">
            Make every trip feel tailored—whether you&apos;re a digital nomad, an adventure seeker, or traveling for work or leisure.
          </p>
          <p className="mt-4 text-stone-300 text-lg">
            Our AI assistant delivers real-time suggestions, builds itineraries, and surfaces local insights so you spend less time planning and more time exploring.
          </p>
        </section>

        {/* What we offer */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mb-2">
            What we offer
          </h2>
          <p className="text-stone-600 mb-8">
            Everything you need to plan and enjoy your next trip.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: MapPin,
                title: "AI-powered trip planning",
                description: "Custom recommendations based on your interests, budget, and travel style—no generic lists.",
              },
              {
                icon: CalendarDays,
                title: "Smart itineraries",
                description: "Flights, stays, and activities in one place. Adjust on the go without the hassle.",
              },
              {
                icon: MessageCircle,
                title: "Real-time travel assistance",
                description: "Ask questions anytime. Our AI chatbot is there for tips, changes, and local know-how.",
              },
              {
                icon: Compass,
                title: "Destination insights",
                description: "Discover hidden gems, top spots, and practical info for destinations worldwide.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group bg-white border border-stone-200 p-6 rounded-xl shadow-sm hover:shadow-md hover:border-amber-200/80 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-lg bg-amber-50 flex items-center justify-center mb-4 group-hover:bg-amber-100 transition-colors">
                  <item.icon className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-stone-900">{item.title}</h3>
                <p className="text-stone-600 mt-2 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Vision + Who we are - two columns on large screens */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 mb-16">
          <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-stone-900 tracking-tight mb-3">
              Our vision
            </h2>
            <p className="text-stone-600 leading-relaxed">
              We&apos;re redefining travel by blending AI with real data. Your next trip isn&apos;t just a vacation—it&apos;s a personalized experience shaped around what you care about.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-amber-600 mb-3">
              <Globe className="w-5 h-5" />
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                Who we are
              </h2>
            </div>
            <p className="text-stone-600 leading-relaxed">
              Travel Planner is part of the <strong>FloLab ecosystem</strong>—a set of AI-driven products that help people work, travel, and live more effectively.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-stone-100/80 rounded-2xl p-8 sm:p-10 border border-stone-200/80">
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
            Ready to plan your next adventure?
          </h2>
          <p className="mt-2 text-stone-600">
            Start a conversation with our AI—it&apos;s free and takes seconds.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium shadow-sm transition-colors"
            >
              Start planning
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-stone-200 hover:border-stone-300 text-stone-700 rounded-lg font-medium transition-colors"
            >
              Get in touch
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
