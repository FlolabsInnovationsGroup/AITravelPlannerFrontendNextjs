import Image from "next/image";
import Link from "next/link";
import Footer from "@/components/features/landing/Footer";
import { Mail, Linkedin } from "lucide-react";
import type { Metadata } from "next";
import { ORGANIZATION_ID, SITE_URL, WEBSITE_ID, jsonLdString, socialMetadata } from "@/lib/site";

const CONTACT_TITLE = "Contact Flomad Travel";
const CONTACT_DESCRIPTION =
  "Get in touch with the Flomad Travel team. Reach out by email or connect with Flomad Labs R&D on LinkedIn.";

export const metadata: Metadata = {
  title: { absolute: CONTACT_TITLE },
  description: CONTACT_DESCRIPTION,
  alternates: { canonical: "/contact" },
  ...socialMetadata("/contact", CONTACT_TITLE, CONTACT_DESCRIPTION),
};

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": `${SITE_URL}/contact#webpage`,
  url: `${SITE_URL}/contact`,
  name: CONTACT_TITLE,
  description: CONTACT_DESCRIPTION,
  inLanguage: "en",
  isPartOf: { "@id": WEBSITE_ID },
  about: { "@id": ORGANIZATION_ID },
};

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-stone-50 text-stone-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(contactJsonLd) }}
      />
      {/* Header - same structure and position as landing nav */}
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
            <Link href="/about" className="text-sm font-medium text-stone-300 hover:text-white transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium text-amber-400">
              Contact
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-grow max-w-2xl mx-auto px-6 sm:px-8 pt-28 pb-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-stone-900 tracking-tight mb-3">
          Get in touch
        </h1>
        <p className="text-center text-stone-600 mb-10">
          We’d love to hear from you. Reach out via email or LinkedIn.
        </p>

        <div className="space-y-4">
          <a
            href="mailto:hr@flomadlabs.com"
            className="flex items-center gap-4 p-5 rounded-xl bg-white border border-stone-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center group-hover:bg-amber-50 transition-colors">
              <Mail className="w-6 h-6 text-stone-600 group-hover:text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-stone-900">Email</p>
              <p className="text-sm text-stone-500 truncate">TBA</p>
            </div>
            <span className="text-sm font-medium text-amber-600 group-hover:text-amber-700">
              Send email
            </span>
          </a>

          <a
            href="https://www.linkedin.com/company/flomad-labs-r-d/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 rounded-xl bg-white border border-stone-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center group-hover:bg-amber-50 transition-colors">
              <Linkedin className="w-6 h-6 text-stone-600 group-hover:text-amber-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-stone-900">LinkedIn</p>
              <p className="text-sm text-stone-500">Flomad Labs R&D</p>
            </div>
            <span className="text-sm font-medium text-amber-600 group-hover:text-amber-700">
              Open profile
            </span>
          </a>
        </div>

        <p className="mt-10 text-center text-sm text-stone-500">
          <Link href="/" className="text-amber-600 hover:text-amber-700 font-medium">
            ← Back to home
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}
