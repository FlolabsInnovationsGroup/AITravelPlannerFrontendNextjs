//src/components/ChatPageContent.tsx
'use client'
import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from "next/image"
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { sendMessage, getChatHistory, getSessionList, createSession, setGuestToken } from '@/lib/api'
import { Send, MessageSquare, Heart, Globe, Bell, PlusCircle, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Loader from '@/components/Loader'
import axios from 'axios'

type MessageType = {
  id: number;
  messageType: 'USER' | 'ASSISTANT';
  content: string;
}

type SessionType = {
  sessionId: string | number;
  title: string;
}

export default function ChatPageContent() {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatSessions, setChatSessions] = useState<SessionType[]>([])
  const [selectedSession, setSelectedSession] = useState<SessionType | null>(null)
  const [showPrompts, setShowPrompts] = useState(true)
  const [rightSectionContent, setRightSectionContent] = useState<string | null>(null)
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  const prompts = [
    "What are the best places to visit in Paris?",
    "Can you suggest a 5-day itinerary for Tokyo?",
    "What are some budget-friendly hotels in New York?",
    "How can I travel from Rome to Florence?",
    "What are the must-try foods in Barcelona?",
    "I have 2000 dollars how much in moroccan currency ?",
  ]
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  useEffect(() => {
    fetchChatSessions();
    
    const initialMessage = searchParams.get('initialMessage');
    if (initialMessage) {
      handleSendMessage(decodeURIComponent(initialMessage));
    }
  }, [])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const createNewSession = async (): Promise<string | null> => {
    try {
      const response = await createSession(`Chat ${chatSessions.length + 1}`);
      if (response && response.id) {
        const newSession: SessionType = {
          sessionId: response.id,
          title: response.title || `Chat ${chatSessions.length + 1}`
        };
        setChatSessions(prevSessions => [newSession, ...(prevSessions || [])]);
        setSelectedSession(newSession);
        setCurrentSessionId(newSession.sessionId.toString());
        return newSession.sessionId.toString();
      } else {
        throw new Error('Invalid response from server when creating session');
      }
    } catch (error) {
      console.error('Error creating new session:', error);
      toast.error('Failed to create new chat session');
      return null;
    }
  };

  const fetchChatSessions = async () => {
    try {
      const response = await getSessionList();
      if (response && response.data) {
        setChatSessions(response.data);
        if (response.data.length > 0) {
          handleSelectSession(response.data[0]);
        }
      } else {
        setChatSessions([]);
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      toast.error('Failed to fetch chat sessions');
    }
  };

  const handlePromptClick = async (prompt: string) => {
    setShowPrompts(false);
    setMessages([]); // Clear previous messages
    await handleSendMessage(prompt);
  };
  
  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
  
    setIsLoading(true);
    try {
      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = await createNewSession();
        if (!sessionId) {
          throw new Error('Failed to create a new chat session');
        }
      }
  
      const userMessage: MessageType = { id: Date.now(), messageType: 'USER', content: message };
      setMessages(prevMessages => [...prevMessages, userMessage]);
  
      const response = await sendMessage(message, sessionId);
  
      if (response.redirectTo) {
        router.push(response.redirectTo);
        return;
      }
  
      const botResponse: MessageType = { 
        id: Date.now() + 1, 
        messageType: 'ASSISTANT', 
        content: response.content 
      };
      setMessages(prevMessages => [...prevMessages, botResponse]);
      
      setRightSectionContent(response.additionalInfo || null);
  
      if (showPrompts) {
        setShowPrompts(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
      setInputMessage('');
    }
  };

  const handleSelectSession = async (session: SessionType | null) => {
    if (session && session.sessionId) {
      setSelectedSession(session);
      setCurrentSessionId(session.sessionId.toString());
      try {
        const chatHistory = await getChatHistory(session.sessionId.toString());
        setMessages(chatHistory?.data || []);
        setRightSectionContent(null);
      } catch (error) {
        console.error('Error fetching chat history:', error);
        toast.error('Failed to fetch chat history');
        setMessages([]);
      }
    } else {
      setSelectedSession(null);
      setCurrentSessionId(null);
      setMessages([]);
      setRightSectionContent(null);
    }
  };
  

  const toggleChatHistory = () => {
    setShowChatHistory(!showChatHistory)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-white border-r transition-all duration-300 ${showChatHistory ? 'w-64' : 'w-16'} md:h-screen flex flex-col`}>
        <div className="p-4 flex items-center justify-center">
          <Link href="/"><Image src="/logo.png" alt="AiTripPlanner Logo" width={24} height={24} /></Link>
        </div>
        <nav className="flex-grow">
          <Button
            variant="ghost"
            className={`flex items-center py-2 px-4 w-full ${showChatHistory ? 'bg-gray-200' : ''}`}
            onClick={toggleChatHistory}
          >
            <MessageSquare className="w-6 h-6" />
            {!showChatHistory && <span className="sr-only">Chats</span>}
          </Button>
          <Button variant="ghost" className="flex items-center py-2 px-4 w-full">
            <Heart className="w-6 h-6" />
            {!showChatHistory && <span className="sr-only">Likes</span>}
          </Button>
          <Button variant="ghost" className="flex items-center py-2 px-4 w-full">
            <Bell className="w-6 h-6" />
            {!showChatHistory && <span className="sr-only">Notifications</span>}
          </Button>
          <Button variant="ghost" className="flex items-center py-2 px-4 w-full">
            <Globe className="w-6 h-6" />
            {!showChatHistory && <span className="sr-only">Explore</span>}
          </Button>
        </nav>
        <Button variant="ghost" className="flex items-center py-2 px-4 w-full mt-auto mb-4">
          <PlusCircle className="w-6 h-6" />
          {!showChatHistory && <span className="sr-only">New Chat</span>}
        </Button>
      </div>

      {/* Chat History Area */}
      {showChatHistory && (
        <div className="w-64 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Chats</h2>
            <div className="flex items-center bg-gray-100 rounded-md mb-4">
              <Search className="w-5 h-5 ml-3 text-gray-400" />
              <Input
                type="text"
                placeholder="Search chat titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-none bg-transparent focus:ring-0"
              />
            </div>
            <div className="flex mb-4">
              <Button variant="ghost" className="mr-2">All</Button>
              <Button variant="ghost">Trips</Button>
            </div>
            {/* <Button
              variant="outline"
              className="w-full mb-4"
              onClick={() => handleCreateNewChat()}
            >
              New chat
            </Button> */}
            <ul>
            {chatSessions && chatSessions
  .filter(session => 
    session.title && searchQuery && 
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  )
  .map((session) => (
    <li
      key={session.sessionId}
      className={`py-2 px-4 cursor-pointer ${selectedSession?.sessionId === session.sessionId ? 'bg-gray-200' : ''}`}
      onClick={() => handleSelectSession(session)}
    >
      <span className="truncate">{session.title}</span>
    </li>
  ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {showPrompts ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center">
            <div className="flex justify-center mb-6">
              <Image src="/logo.png" alt="AiTripPlanner Logo" width={128} height={128} />
            </div>
            <div className="grid grid-cols-2 gap-6 max-w-2xl">
              {prompts.map((prompt, index) => (
                <div 
                  key={index} 
                  className="p-6 rounded-lg cursor-pointer bg-white hover:bg-gray-100"
                  onClick={() => handlePromptClick(prompt)}
                >
                  <h3 className="text-lg font-semibold">{prompt}</h3>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div key={index} className={`mb-4 ${message.messageType === 'USER' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block p-2 rounded-lg ${message.messageType === 'USER' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            {isLoading && <Loader />}
          </>
        )}
        <div className="p-4 border-t">
          <div className="flex items-center bg-white rounded-md border">
            <Input
              type="text"
              placeholder="Start a conversation..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputMessage);
                }
              }}
              className="flex-1 border-none focus:ring-0"
            />
            <Button
              onClick={() => handleSendMessage(inputMessage)}
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

      {/* Right section for details */}
      <div className="w-1/4 bg-white border-l p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Details</h2>
        {rightSectionContent ? (
          <ReactMarkdown>{rightSectionContent}</ReactMarkdown>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <Image src="/image/no-gradient.png" alt="Placeholder" width={200} height={200} />
            <p className="mt-4 text-center">No additional information available.</p>
          </div>
        )}
      </div>
    </div>
  )
}
