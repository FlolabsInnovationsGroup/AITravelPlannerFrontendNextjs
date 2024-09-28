'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from "next/image"
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { sendChat, getChatHistory, createSession, getSessionList, deleteSession, updateSession } from '@/lib/api'
import { Mic, Send, ChevronLeft, ChevronRight, MessageSquare, Heart, Globe, X } from 'lucide-react'
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
  const [rightSectionContent, setRightSectionContent] = useState<string | null>(null)
  const searchParams = useSearchParams()
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
    fetchChatSessions()
  }, [])

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const fetchChatSessions = async () => {
    try {
      const response = await getSessionList()
      if (response && response.data) {
        setChatSessions(response.data)
        if (response.data.length > 0) {
          handleSelectSession(response.data[0])
        }
      } else {
        setChatSessions([])
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error)
      setChatSessions([])
    }
  }

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

  const handleCreateNewChat = async (name?: string) => {
    const newChat = name || `Chat ${chatSessions.length + 1}`
    const newSession: SessionType = { sessionId: chatSessions.length, title: newChat }
    setChatSessions((prevSessions) => [newSession, ...prevSessions])
    setSelectedSession(newSession)
    setMessages([])
    setRightSectionContent(null)

    if (newChat === 'Chat') {
      try {
        const response = await createSession(newChat)
        if (response.status === 200) {
          const createdSession = response.data
          setChatSessions((prevSessions) => [createdSession, ...prevSessions])
          setSelectedSession(createdSession)
          setMessages([])
        } else {
          console.error('Error creating chat:', response.data.message)
        }
      } catch (error) {
        console.error('Error creating chat:', error)
      }
    }

    return newSession
  }

  const handleSendMessage = async (message: string, attempt = 0) => {
    if (attempt >= MAX_ATTEMPTS) {
      console.error('Max attempts reached. Could not send Message.')
      return
    }

    let session = selectedSession
    if (session === null) {
      session = await handleCreateNewChat()
    }

    setIsLoading(true)
    try {
      await sendMessage(message, session)
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (message: string, session: SessionType) => {
    if (typeof session.sessionId === 'number') {
      session = await createNewSession(session.title)
      if (!session) {
        console.error('Failed to create a new session.')
        return
      }
    }
    
    const userMessage: MessageType = { id: messages.length, messageType: 'USER', content: message }
    setMessages((prevMessages) => [...prevMessages, userMessage])

    try {
      const response = await sendChat(message, session.sessionId.toString())
      if (session.sessionId === (selectedSession ? selectedSession.sessionId : null)) {
        const botResponse: MessageType = { id: messages.length, messageType: 'ASSISTANT', content: response.data.content }
        setMessages((prevMessages) => [...prevMessages, botResponse])
        setRightSectionContent(response.data.additionalInfo || null)
      }
    } catch (error) {
      console.error(`Error sending message:`, error)
    }
  }

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
    setIsHistoryOpen(!isHistoryOpen)
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`bg-white border-r transition-all duration-300 ${isHistoryOpen ? 'w-64' : 'w-16'} md:h-screen`}>
        <div className="p-4 flex items-center justify-center">
          <Link href="/"><Image src="/logo.png" alt="AiTripPlanner Logo" width={24} height={24} /></Link>
        </div>
        <nav className="mt-8">
          <Button
            variant="ghost"
            className="flex items-center py-2 px-4 w-full"
            onClick={toggleChatHistory}
          >
            <MessageSquare className="w-6 h-6" />
            {isHistoryOpen && <span className="ml-2">Chats</span>}
          </Button>
          <Link href="/likes" className="flex items-center py-2 px-4">
            <Heart className="w-6 h-6" />
            {isHistoryOpen && <span className="ml-2">Likes</span>}
          </Link>
          <Link href="/explore" className="flex items-center py-2 px-4">
            <Globe className="w-6 h-6" />
            {isHistoryOpen && <span className="ml-2">Explore</span>}
          </Link>
        </nav>
        {isHistoryOpen && (
          <>
            <Button
              variant="ghost"
              className="flex items-center py-2 px-4 w-full mt-4"
              onClick={() => handleCreateNewChat()}
            >
              + New Chat
            </Button>
            <ul className="mt-2">
              {chatSessions.map((session) => (
                <li
                  key={session.sessionId}
                  className={`flex items-center py-2 px-4 cursor-pointer ${selectedSession?.sessionId === session.sessionId ? 'bg-gray-200' : ''}`}
                  onClick={() => handleSelectSession(session)}
                >
                  <span className="truncate flex-grow">{session.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSession(session.sessionId)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

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
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSendMessage(inputMessage)
                  setInputMessage('')
                }
              }}
              className="flex-1 border-none focus:ring-0"
            />
            <Button
              variant="ghost"
              size="icon"
              className="p-2"
              onClick={() => {/* Implement mic functionality */}}
            >
              <Mic className="h-6 w-6" />
            </Button>
            <Button
              onClick={() => {
                handleSendMessage(inputMessage)
                setInputMessage('')
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