'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from "next/image"
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import apiClient, { sendChat, getChatHistory, createSession, getSessionList, deleteSession, updateSession } from '@/lib/api'
import { Mic, Send, ChevronLeft, ChevronRight, MessageSquare, Heart, Globe, X, Bell, PlusCircle, Search } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Loader from '@/components/Loader'

type MessageType = {
  id: number;
  messageType: 'USER' | 'ASSISTANT';
  content: string;
}

type SessionType = {
  sessionId: string | number;
  title: string;
}

const MAX_ATTEMPTS = 3;

export default function ChatPageContent() {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [chatSessions, setChatSessions] = useState<SessionType[]>([])
  const [selectedSession, setSelectedSession] = useState<SessionType | null>(null)
  const [showPrompts, setShowPrompts] = useState(true)
  const [isGuest, setIsGuest] = useState(true);
  const [rightSectionContent, setRightSectionContent] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)

  const prompts = [
    "What are the best places to visit in Paris?",
    "Can you suggest a 5-day itinerary for Tokyo?",
    "What are some budget-friendly hotels in New York?",
    "How can I travel from Rome to Florence?",
    "What are the must-try foods in Barcelona?",
    "I have 2000 dollars how much in moroccan currency ?",
  ]

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsGuest(false);
      fetchChatSessions();
    } else {
      setIsGuest(true);
      handleCreateNewChat();
    }
  }, [])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])


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

  const createNewSession = async (name: string) => {
    try {
      const response = await createSession(name)
      if (response.status === 200 && response.data) {
        setChatSessions((prevSessions) => [
          response.data,
          ...prevSessions.filter(session => 
            selectedSession === null 
              ? typeof session.sessionId !== 'number' 
              : session.sessionId !== selectedSession.sessionId
          )
        ])
        setSelectedSession(response.data)
        setMessages([])
        return response.data
      } else {
        console.error('Error creating chat:', response.data.message)
        return null
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      return null
    }
  }

  const sendMessageToBackend = async (message: string) => {
    try {
      const response = await apiClient.post('/api/chatbot/message', { text: message });
      return response.data;
    } catch (error) {
      console.error('Error sending message to backend:', error);
      throw error;
    }
  };

  const handleCreateNewChat = async (name?: string) => {
    const newChat = name || `Chat ${chatSessions.length + 1}`;
    let newSession: SessionType;
    
    if (isGuest) {
      newSession = { sessionId: Date.now().toString(), title: newChat };
    } else {
      try {
        const response = await createSession(newChat);
        if (response.status === 200) {
          newSession = response.data;
        } else {
          console.error('Error creating chat:', response.data.message);
          toast.error('Failed to create new chat');
          return null;
        }
      } catch (error) {
        console.error('Error creating chat:', error);
        toast.error('Failed to create new chat');
        return null;
      }
    }

    setChatSessions((prevSessions) => [newSession, ...prevSessions]);
    setSelectedSession(newSession);
    setMessages([]);
    setRightSectionContent(null);
    return newSession;
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
  
    let session = selectedSession;
    if (session === null) {
      session = await handleCreateNewChat();
      if (!session) {
        toast.error('Failed to create a new chat session');
        return;
      }
    }
  
    setIsLoading(true);
    try {
      const userMessage: MessageType = { id: messages.length, messageType: 'USER', content: message };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
  
      let response;
      if (isGuest) {
        response = await sendMessageToBackend(message);
      } else {
        response = await sendChat(message, session.sessionId.toString());
      }
  
      const botResponse: MessageType = { 
        id: messages.length + 1, 
        messageType: 'ASSISTANT', 
        content: isGuest ? response : response.data.content 
      };
      setMessages((prevMessages) => [...prevMessages, botResponse]);
      
      if (!isGuest) {
        setRightSectionContent(response.data.additionalInfo || null);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteSession = async (sessionId: string | number) => {
    try {
      const response = await deleteSession(sessionId.toString())
      if (response.status === 204) {
        setChatSessions((prevSessions) => prevSessions.filter(session => session.sessionId !== sessionId))
        if (selectedSession && selectedSession.sessionId === sessionId) {
          handleSelectSession(chatSessions[1] || null)
        }
      } else {
        console.log('Session deletion failed:', sessionId)
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  const handleUpdateSession = async (sessionId: string | number, title: string) => {
    try {
      const response = await updateSession(sessionId.toString(), title)
      if (response.status === 200) {
        setChatSessions((prevSessions) => prevSessions.map(session => 
          session.sessionId === sessionId ? response.data : session
        ))
      } else {
        console.error('Error updating session:', response.data.message)
      }
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  const handleSelectSession = async (session: SessionType | null) => {
    if (session) {
      setSelectedSession(session)
      const chatHistory = await getHistoryChat(session.sessionId.toString())
      setMessages(chatHistory || [])
      setRightSectionContent(null)
    } else {
      setSelectedSession(null)
      setMessages([])
      setRightSectionContent(null)
    }
  }

  const getHistoryChat = async (sessionId: string, attempt = 0) => {
    if (attempt >= MAX_ATTEMPTS) {
      console.error('Max attempts reached. Could not retrieve chat history.')
      return null
    }

    try {
      const response = await getChatHistory(sessionId)
      if (response.status === 200) {
        if (response.data) {
          return response.data
        }
      } else {
        console.log('New session!')
        return null
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1}: Error retrieving chat history`, error)
      return new Promise((resolve) =>
        setTimeout(async () => resolve(await getHistoryChat(sessionId, attempt + 1)), 1000)
      )
    }
  }

  const handlePromptClick = async (prompt: string) => {
    setShowPrompts(false)
    await handleSendMessage(prompt)
  }

  const toggleChatHistory = () => {
    setShowChatHistory(!showChatHistory)
    if (!showChatHistory) {
      setIsHistoryOpen(true)
    }
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
            <Button
              variant="outline"
              className="w-full mb-4"
              onClick={() => handleCreateNewChat()}
            >
              New chat
            </Button>
            <ul>
              {chatSessions
                .filter(session => session.title.toLowerCase().includes(searchQuery.toLowerCase()))
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
                  setInputMessage('');
                }
              }}
              className="flex-1 border-none focus:ring-0"
            />
            <Button
              onClick={() => {
                handleSendMessage(inputMessage);
                setInputMessage('');
              }}
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

// function sendMessageToBackend(message: string): any {
//   throw new Error('Function not implemented.')
// }
