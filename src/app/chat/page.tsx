"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const ChatPageContent = dynamic(() => import('@/components/ChatPageContent'), {
  ssr: false,
});

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
