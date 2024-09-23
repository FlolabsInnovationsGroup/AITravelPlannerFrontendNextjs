'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from "next/legacy/image"
import Link from 'next/link'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { sendChat, getChatHistory, createSession } from '@/lib/api'
import { Mic, Send, ChevronLeft, ChevronRight, MessageSquare, Heart, Globe, X } from 'lucide-react'
import { track } from '@vercel/analytics';
import { toast } from 'react-hot-toast'

type MessageType = {
  type: 'user' | 'bot';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [chatHistory, setChatHistory] = useState<{ id: number; title: string }[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  // Guest user logic
  const [isGuest, setIsGuest] = useState(true) // Replace with actual authentication logic
  const [guestMessageCount, setGuestMessageCount] = useState(0)
  const MAX_GUEST_MESSAGES = 5

  
  useEffect(() => {
    const sid = searchParams.get('sessionId')
    const initialMessage = searchParams.get('initialMessage')
    
    if (sid && initialMessage) {
      setSessionId(sid)
      loadChatHistory(sid)
      handleSendMessage(decodeURIComponent(initialMessage), sid)
    }
  }, [searchParams])

  const loadChatHistory = async (sid: string) => {
    try {
      const history = await getChatHistory(sid)
      setMessages(history.data)
    } catch (error) {
      console.error('Error loading chat history:', error)
      toast.error('Failed to load chat history')
    }
  }

  const handleSendMessage = async (message = inputMessage, sid = sessionId) => {
    if (!message.trim() || !sid) return

     // Check if user is a guest (not authenticated)
     const token = localStorage.getItem('token');
     if (!token) {
       if (guestMessageCount >= MAX_GUEST_MESSAGES) {
         toast.error("You've reached the maximum number of messages as a guest. Please sign up to continue.");
         router.push('/signup');
         return;
       }
       setGuestMessageCount(prev => prev + 1);
     }

    setIsLoading(true)
    try {
      const response = await sendChat(message, sid)
      setMessages(prev => [...prev, { type: 'user', content: message }, { type: 'bot', content: response.data.content }])
      setInputMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }


   const toggleChatHistory = () => {
    setIsHistoryOpen(!isHistoryOpen)
    // Implement fetching actual chat history here
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-white border-r transition-all duration-300 ${isSidebarExpanded ? 'w-64' : 'w-16'} md:h-screen`}>
        <div className="p-4 flex items-center justify-center">
          <Link href="/"><Image src="/logo.png?height=24&width=24" alt="Flomad Travel Logo" width={24} height={24} /></Link> 
        </div>
        <nav className="mt-8">
          <Button
            variant="ghost"
            className={`flex items-center py-2 px-4 w-full ${isHistoryOpen ? 'bg-gray-200' : ''}`}
            onClick={toggleChatHistory}
          >
            <MessageSquare className="w-6 h-6" />
            {isSidebarExpanded && <span className="ml-2">Chats</span>}
          </Button>
          <Link href="/likes" className="flex items-center py-2 px-4">
            <Heart className="w-6 h-6" />
            {isSidebarExpanded && <span className="ml-2">Likes</span>}
          </Link>
          <Link href="/explore" className="flex items-center py-2 px-4">
            <Globe className="w-6 h-6" />
            {isSidebarExpanded && <span className="ml-2">Explore</span>}
          </Link>
        </nav>
        <Button 
          variant="ghost" 
          className="mt-8 mx-4" 
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
        >
          {isSidebarExpanded ? <ChevronLeft /> : <ChevronRight />}
        </Button>
      </div>

      {/* Chat history sidebar */}
      {isHistoryOpen && (
        <div className="w-64 bg-white border-r overflow-y-auto absolute md:relative h-full z-10">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-xl font-bold">Chat History</h2>
            <Button variant="ghost" size="icon" onClick={toggleChatHistory}>
              <X className="h-6 w-6" />
            </Button>
          </div>
          {chatHistory.map((chat) => (
            <div key={chat.id} className="p-2 hover:bg-gray-100 cursor-pointer">
              {chat.title}
            </div>
          ))}
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div key={index} className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-2 rounded-lg ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                {message.content}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t">
          <div className="flex items-center bg-white rounded-md border">
            <Input
              type="text"
              placeholder="Start a conversation..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 border-none focus:ring-0"
            />
            <Button variant="ghost" size="icon" className="p-2" onClick={() => {/* Implement mic functionality */}}>
              <Mic className="h-6 w-6" />
            </Button>
            <Button 
              onClick={() => handleSendMessage()} 
              disabled={isLoading} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-r-md"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <Send className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div className="w-full md:w-1/4 bg-white border-l p-4 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold mb-4">Hassle Free Planning.</h2>
          <Image src="/image/no-gradient.png" alt="Venice" width={800} height={900} className="rounded-lg w-full h-auto" />
          <p className="mt-4">Get Started: We'll help you take the stress out of planning.</p>
        </div>
        <Button className="mt-4 w-full">Get Started</Button>
      </div>
    </div>
  )
}