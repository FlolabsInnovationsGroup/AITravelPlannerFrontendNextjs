'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendMessage, createSession } from '@/lib/api';
import { Send, MessageSquare, Heart, Globe, Bell, LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AudioRecorder from './AudioRecorder'; // Import the AudioRecorder component
import { useAuth } from '@/components/contexts/AuthContext';

interface Message {
  id: number;
  messageType: 'USER' | 'ASSISTANT';
  content: string;
}

export default function ChatPageContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<{ sessionId: string; title: string } | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const bottomRef = useRef<HTMLDivElement>(null);
  const { signOut: authSignOut } = useAuth();

  useEffect(() => {
    const initializeChat = async () => {
      if (isInitialized) return;

      const sessionId = searchParams.get('sessionId');
      const initialMessage = searchParams.get('initialMessage');

      if (sessionId) {
        setCurrentSession({ sessionId, title: 'New Chat' });

        if (initialMessage && !messages.length) {
          const userMessage: Message = {
            id: Date.now(),
            messageType: 'USER',
            content: decodeURIComponent(initialMessage),
          };

          setMessages([userMessage]);

          try {
            const response = await sendMessage(decodeURIComponent(initialMessage), sessionId);
            const botMessage: Message = {
              id: Date.now() + 1,
              messageType: 'ASSISTANT',
              content: response.content,
            };
            setMessages([userMessage, botMessage]);
          } catch (error) {
            toast.error('Failed to process initial message');
          }
        }
      }

      setIsInitialized(true);
    };

    initializeChat();
  }, [searchParams, isInitialized, messages.length]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      let sessionId = currentSession?.sessionId;

      if (!sessionId) {
        const newSession = await createSession('New Chat');
        sessionId = newSession.sessionId;
        setCurrentSession(newSession);
      }

      const userMessage: Message = {
        id: Date.now(),
        messageType: 'USER',
        content: message,
      };
      setMessages(prev => [...prev, userMessage]);

      const response = await sendMessage(message, sessionId);
      const botMessage: Message = {
        id: Date.now() + 1,
        messageType: 'ASSISTANT',
        content: response.content,
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
      setInputMessage(''); // Clear input message after sending
    }
  };

  const handleTranscription = (transcribedText: string) => {
    setInputMessage(transcribedText); // Set the transcribed text into the input field
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const signOut = () => {
    authSignOut?.();
    router.push('/login');
    toast.success("You have been signed out."); // Show signout message
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block bg-white border-r w-64 md:h-screen sidebar`}>
        <div className="p-4 flex items-center justify-center border-b">
          <Link href="/">
            <Image src="/logo.png" alt="AiTripPlanner Logo" width={32} height={32} />
          </Link>
        </div>
        <nav className="flex flex-col space-y-4 p-4">
          <Button variant="ghost" className="sidebar-btn hover:bg-gray-200" onClick={() => setShowChatHistory(!showChatHistory)}>
            <MessageSquare className="mr-2" /> Chat History
          </Button>
          <Button variant="ghost" className="sidebar-btn hover:bg-gray-200">
            <Heart className="mr-2" /> Favorites
          </Button>
          <Button variant="ghost" className="sidebar-btn hover:bg-gray-200">
            <Globe className="mr-2" /> Global
          </Button>
          <Button variant="ghost" className="sidebar-btn hover:bg-gray-200">
            <Bell className="mr-2" /> Notifications
          </Button>
          <Button variant="ghost" className="sidebar-btn mt-auto hover:bg-gray-200 text-red-500" onClick={signOut}>
            <LogOut className="mr-2" /> Logout
          </Button>
        </nav>
      </div>

      {/* Main Chat Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 chat-content">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${message.messageType === 'USER' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`relative max-w-xs p-4 rounded-lg shadow chat-bubble ${
                    message.messageType === 'USER'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Chat Input */}
        <div className="border-t bg-white p-4">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <Input
              type="text"
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage(inputMessage);
              }}
              className="flex-1 rounded-lg"
            />
            <Button onClick={() => handleSendMessage(inputMessage)} disabled={isLoading} className="bg-blue-500 hover:bg-blue-600 text-white">
              <Send />
            </Button>
            {/* AudioRecorder Component */}
            {currentSession?.sessionId && (
              <AudioRecorder sessionId={currentSession.sessionId} onTranscription={handleTranscription} />
            )}
          </div>
        </div>
      </div>

      {/* Details Panel */}
      <div className="hidden md:block w-1/4 bg-gray-50 p-4 border-l details-panel">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Details</h2>
        <Image src="/image/no-gradient.png" alt="Placeholder" width={200} height={200} />
        <p className="mt-4 text-sm text-gray-600">Additional information will appear here.</p>
      </div>
    </div>
  );
}


