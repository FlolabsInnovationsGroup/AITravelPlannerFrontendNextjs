'use client'

import { Suspense } from 'react'
import ChatPageContent from '@/components/features/chat/ChatPageContent'

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  )
}