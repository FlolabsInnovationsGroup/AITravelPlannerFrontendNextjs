import dynamic from 'next/dynamic'
import { Suspense } from 'react'

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