import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import {
  ORGANIZATION_ID,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  jsonLdString,
  socialMetadata,
} from '@/lib/site'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  ...socialMetadata('/', SITE_TITLE, SITE_DESCRIPTION),
}

const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  description: SITE_DESCRIPTION,
  applicationCategory: 'TravelApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  publisher: { '@id': ORGANIZATION_ID },
}

// Code splitting for performance optimization (Audit Implementation)
const LandingPage = dynamic(() => import('@/components/features/landing/LandingPage'), {
  ssr: true,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-300 border-t-amber-500" />
    </div>
  )
})

export default function Home() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(webAppJsonLd) }}
      />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-300 border-t-amber-500" />
        </div>
      }>
        <LandingPage />
      </Suspense>
    </main>
  )
}