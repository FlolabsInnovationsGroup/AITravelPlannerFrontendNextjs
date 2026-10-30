'use client'

import { Suspense } from 'react'
import ChatPageContent from '@/components/features/chat/ChatPageContent'

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-stone-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-200 border-t-amber-500 mx-auto" />
          <p className="mt-3 text-stone-600">Loading chat...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  )
}