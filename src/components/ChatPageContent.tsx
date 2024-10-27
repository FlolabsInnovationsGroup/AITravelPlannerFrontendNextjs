'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendMessage, createSession } from '@/lib/api';
import { Send, MessageSquare, Heart, Globe, Bell, PlusCircle, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/components/contexts/AuthContext';
import axios from 'axios';

interface Message {
  id: number;
  messageType: 'USER' | 'ASSISTANT';
  content: string;
}

export default function ChatPageContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<{ sessionId: string, title: string } | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPrompts] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const bottomRef = useRef<HTMLDivElement>(null);

  const prompts = [
    "What are the best places to visit in Paris?",
    "Can you suggest a 5-day itinerary for Tokyo?",
    "What are some budget-friendly hotels in New York?",
    "How can I travel from Rome to Florence?",
    "What are the must-try foods in Barcelona?",
    "I have 2000 dollars how much in moroccan currency?",
  ];

  useEffect(() => {
    const initializeChat = async () => {
      const sessionId = searchParams.get('sessionId');
      const initialMessage = searchParams.get('initialMessage');

      if (sessionId) {
        setCurrentSession({ sessionId, title: 'New Chat' });
        if (initialMessage) {
          await handleSendMessage(decodeURIComponent(initialMessage));
        }
      }
    };

    initializeChat();
  }, [searchParams]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // const handlePromptClick = async (prompt: string) => {
  //   setShowPrompts(false);
  //   await handleSendMessage(prompt);
  // };

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

      // Add user message
      const userMessage: Message = {
        id: Date.now(),
        messageType: 'USER',
        content: message
      };
      setMessages(prev => [...prev, userMessage]);

      // Send message and get response
      const response = await sendMessage(message, sessionId);

      // Add assistant message
      const botMessage: Message = {
        id: Date.now() + 1,
        messageType: 'ASSISTANT',
        content: response.content
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          toast.error('Message limit reached. Please sign up for full access.');
          router.push('/signup');
        } else {
          toast.error('Failed to send message');
        }
      }
    } finally {
      setIsLoading(false);
      setInputMessage('');
    }
  };

  const toggleChatHistory = () => {
    setShowChatHistory(prev => !prev);
  };

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
            {showChatHistory && <span className="ml-2">Chats</span>}
          </Button>
          <Button variant="ghost" className="flex items-center py-2 px-4 w-full">
            <Heart className="w-6 h-6" />
            {showChatHistory && <span className="ml-2">Likes</span>}
          </Button>
          <Button variant="ghost" className="flex items-center py-2 px-4 w-full">
            <Bell className="w-6 h-6" />
            {showChatHistory && <span className="ml-2">Notifications</span>}
          </Button>
          <Button variant="ghost" className="flex items-center py-2 px-4 w-full">
            <Globe className="w-6 h-6" />
            {showChatHistory && <span className="ml-2">Explore</span>}
          </Button>
        </nav>
        <Button 
          variant="ghost" 
          className="flex items-center py-2 px-4 w-full mt-auto mb-4"
          onClick={() => {
            setCurrentSession(null);
            setMessages([]);
            router.push('/chat');
          }}
        >
          <PlusCircle className="w-6 h-6" />
          {showChatHistory && <span className="ml-2">New Chat</span>}
        </Button>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {showPrompts ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center">
            <div className="flex justify-center mb-6">
              <Image src="/logo.png" alt="AiTripPlanner Logo" width={128} height={128} />
            </div>
            {/* <div className="grid grid-cols-2 gap-6 max-w-2xl">
              {prompts.map((prompt, index) => (
                <div 
                  key={index} 
                  className="p-6 rounded-lg cursor-pointer bg-white hover:bg-gray-100"
                  onClick={() => handlePromptClick(prompt)}
                >
                  <h3 className="text-lg font-semibold">{prompt}</h3>
                </div>
              ))}
            </div> */}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`mb-4 ${message.messageType === 'USER' ? 'text-right' : 'text-left'}`}
                >
                  <div 
                    className={`inline-block p-2 rounded-lg ${
                      message.messageType === 'USER' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </>
        )}

        {/* Chat input */}
        <div className="p-4 border-t">
          <div className="flex items-center bg-white rounded-md border">
            <Input
              type="text"
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputMessage);
                }
              }}
              className="flex-1 border-none focus:ring-0"
              disabled={isLoading}
            />
            <Button
               onClick={() => handleSendMessage(inputMessage)}
               disabled={isLoading || !inputMessage.trim()}
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
 
       {/* Chat History Area - Shown when showChatHistory is true */}
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
             <ul>
               {currentSession && (
                 <li
                   className="py-2 px-4 cursor-pointer hover:bg-gray-100 bg-gray-200"
                 >
                   <span className="truncate">{currentSession.title}</span>
                 </li>
               )}
             </ul>
           </div>
         </div>
       )}
 
       {/* Right section for details */}
       <div className="w-1/4 bg-white border-l p-4 overflow-y-auto">
         <h2 className="text-xl font-bold mb-4">Details</h2>
         {messages.length > 0 ? (
           <div className="prose max-w-none">
             <ReactMarkdown>
               {messages[messages.length - 1].content}
             </ReactMarkdown>
           </div>
         ) : (
           <div className="flex flex-col items-center justify-center h-full">
             <Image src="/image/no-gradient.png" alt="Placeholder" width={200} height={200} />
             <p className="mt-4 text-center">No additional information available.</p>
           </div>
         )}
       </div>
     </div>
   );
 }