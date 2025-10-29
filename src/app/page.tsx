import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Code splitting for performance optimization (Audit Implementation)
const LandingPage = dynamic(() => import('@/components/features/landing/LandingPage'), {
  ssr: true,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  )
})

export default function Home() {
  return (
    <main>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      }>
        <LandingPage />
      </Suspense>
    </main>
  )
}