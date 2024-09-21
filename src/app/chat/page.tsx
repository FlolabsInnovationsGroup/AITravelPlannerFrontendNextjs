// 'use client'

// import { useState, useEffect } from 'react'
// import { useSearchParams } from 'next/navigation'
// import Image from "next/legacy/image"
// import Link from 'next/link'
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"
// import { sendChat, getChatHistory } from '@/lib/api'
// import { Mic, Send, ChevronLeft, ChevronRight, MessageSquare, Heart, Globe, X } from 'lucide-react'

// export default function ChatPage() {
//   const [messages, setMessages] = useState([])
//   const [inputMessage, setInputMessage] = useState('')
//   const [isLoading, setIsLoading] = useState(false)
//   const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
//   const [isHistoryOpen, setIsHistoryOpen] = useState(false)
//   const [chatHistory, setChatHistory] = useState([])
//   const searchParams = useSearchParams()

//   useEffect(() => {
//     const sessionId = searchParams.get('sessionId')
//     const initialMessage = searchParams.get('initialMessage')
    
//     if (sessionId && initialMessage) {
//       loadChatHistory(sessionId)
//       handleSendMessage(initialMessage, sessionId)
//     }
//   }, [searchParams])

//   const loadChatHistory = async (sessionId) => {
//     try {
//       const history = await getChatHistory(sessionId)
//       setMessages(history)
//     } catch (error) {
//       console.error('Error loading chat history:', error)
//     }
//   }

//   const handleSendMessage = async (message = inputMessage, sessionId = 'current-session-id') => {
//     if (!message.trim()) return

//     setIsLoading(true)
//     try {
//       const response = await sendChat(message, sessionId)
//       setMessages(prev => [...prev, { type: 'user', content: message }, { type: 'bot', content: response }])
//       setInputMessage('')
//     } catch (error) {
//       console.error('Error sending message:', error)
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const toggleChatHistory = () => {
//     setIsHistoryOpen(!isHistoryOpen)
//     // Here you would typically fetch the chat history
//     // For now, we'll use a placeholder
//     setChatHistory([
//       { id: 1, title: "Trip to Paris" },
//       { id: 2, title: "Beach vacation" },
//       { id: 3, title: "Mountain retreat" },
//     ])
//   }

//   return (
//     <div className="flex flex-col md:flex-row h-screen bg-gray-100">
//       {/* Sidebar */}
//       <div className={`bg-white border-r transition-all duration-300 ${isSidebarExpanded ? 'w-64' : 'w-16'} md:h-screen`}>
//         <div className="p-4 flex items-center justify-center">
//          <Link href="/"><Image src="/logo.png?height=24&width=24" alt="Flomad Travel Logo" width={24} height={24} /></Link> 
//         </div>
//         <nav className="mt-8">
//           <Button
//             variant="ghost"
//             className={`flex items-center py-2 px-4 w-full ${isHistoryOpen ? 'bg-gray-200' : ''}`}
//             onClick={toggleChatHistory}
//           >
//             <MessageSquare className="w-6 h-6" />
//             {isSidebarExpanded && <span className="ml-2">Chats</span>}
//           </Button>
//           <Link href="/likes" className="flex items-center py-2 px-4">
//             <Heart className="w-6 h-6" />
//             {isSidebarExpanded && <span className="ml-2">Likes</span>}
//           </Link>
//           <Link href="/explore" className="flex items-center py-2 px-4">
//             <Globe className="w-6 h-6" />
//             {isSidebarExpanded && <span className="ml-2">Explore</span>}
//           </Link>
//         </nav>
//         <Button 
//           variant="ghost" 
//           className="mt-8 mx-4" 
//           onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
//         >
//           {isSidebarExpanded ? <ChevronLeft /> : <ChevronRight />}
//         </Button>
//       </div>

//       {/* Chat history sidebar */}
//       {isHistoryOpen && (
//         <div className="w-64 bg-white border-r overflow-y-auto absolute md:relative h-full z-10">
//           <div className="flex justify-between items-center p-4">
//             <h2 className="text-xl font-bold">Chat History</h2>
//             <Button variant="ghost" size="icon" onClick={toggleChatHistory}>
//               <X className="h-6 w-6" />
//             </Button>
//           </div>
//           {chatHistory.map((chat) => (
//             <div key={chat.id} className="p-2 hover:bg-gray-100 cursor-pointer">
//               {chat.title}
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Main chat area */}
//       <div className="flex-1 flex flex-col">
//         <div className="flex-1 overflow-y-auto p-4">
//           {messages.map((message, index) => (
//             <div key={index} className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
//               <div className={`inline-block p-2 rounded-lg ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
//                 {message.content}
//               </div>
//             </div>
//           ))}
//         </div>
//         <div className="p-4 border-t">
//           <div className="flex items-center bg-white rounded-md border">
//             <Input
//               type="text"
//               placeholder="Start a conversation..."
//               value={inputMessage}
//               onChange={(e) => setInputMessage(e.target.value)}
//               className="flex-1 border-none focus:ring-0"
//             />
//             <Button variant="ghost" size="icon" className="p-2" onClick={() => {/* Implement mic functionality */}}>
//               <Mic className="h-6 w-6" />
//             </Button>
//             <Button 
//               onClick={() => handleSendMessage()} 
//               disabled={isLoading} 
//               className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-r-md"
//             >
//               {isLoading ? (
//                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
//               ) : (
//                 <Send className="h-6 w-6" />
//               )}
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Right sidebar */}
//       <div className="w-full md:w-1/4 bg-white border-l p-4 flex flex-col justify-between">
//         <div>
//           <h2 className="text-xl font-bold mb-4">Hassle Free Planning.</h2>
//           <Image src="/image/no-gradient.png" alt="Venice" width={800} height={900} className="rounded-lg w-full h-auto" />
//           <p className="mt-4">Get Started: We'll help you take the stress out of planning.</p>
//         </div>
//         <Button className="mt-4 w-full">Get Started</Button>
//       </div>
//     </div>
//   )
// }

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from "next/legacy/image"
import Link from 'next/link'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { sendChat, getChatHistory } from '@/lib/api'
import { Mic, Send, ChevronLeft, ChevronRight, MessageSquare, Heart, Globe, X } from 'lucide-react'
import { track } from '@vercel/analytics';

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
  const searchParams = useSearchParams()
  const router = useRouter();

  // Guest user logic
  const [isGuest, setIsGuest] = useState(true) // Replace with actual authentication logic
  const [guestMessageCount, setGuestMessageCount] = useState(0)
  const MAX_GUEST_MESSAGES = 5

  useEffect(() => {
    const sessionId = searchParams.get('sessionId')
    const initialMessage = searchParams.get('initialMessage')
    
    if (sessionId && initialMessage) {
      loadChatHistory(sessionId)
      handleSendMessage(initialMessage, sessionId)
    }
  }, [searchParams])

  const loadChatHistory = async (sessionId: string) => {
    try {
      const history = await getChatHistory(sessionId)
      setMessages(history)
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }

  const handleSendMessage = async (message = inputMessage, sessionId = 'current-session-id') => {
    if (!message.trim()) return

    setIsLoading(true)
    try {
      if (isGuest && guestMessageCount >= MAX_GUEST_MESSAGES) {
        track('Guest Limit Reached');
        if (window.confirm('You\'ve reached the maximum number of messages as a guest. Would you like to sign up to continue?')) {
          track('Guest Signup Prompt Accepted');
          router.push('/signup')
        } else {
          track('Guest Signup Prompt Rejected');
        }
        return
      }

      const response = await sendChat(message, sessionId)
      setMessages(prev => [...prev, { type: 'user', content: message }, { type: 'bot', content: response }])
      setInputMessage('')

      if (isGuest) {
        setGuestMessageCount(prev => prev + 1)
        track('Guest Message Sent', { count: guestMessageCount + 1 });
      } else {
        track('User Message Sent');
      }
    } catch (error) {
      console.error('Error sending message:', error)
      track('Message Send Error', { error: error.message });
    } finally {
      setIsLoading(false)
    }
  }

  const toggleChatHistory = () => {
    setIsHistoryOpen(!isHistoryOpen)
    setChatHistory([
      { id: 1, title: "Trip to Paris" },
      { id: 2, title: "Beach vacation" },
      { id: 3, title: "Mountain retreat" },
    ])
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
