'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendMessagesEntity, createSession } from '@/lib/api';
import { Send, MessageSquare, Heart, Globe, Bell, PlusCircle, Search, Menu, X, LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/components/contexts/AuthContext';
import AudioRecorder from './AudioRecorder'; // Import the AudioRecorder component
import { Components } from 'react-markdown';

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
}

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
  const [displayPrompts, setDisplayPrompts] = useState(true);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [messageCount, setMessageCount] = useState(0); // For guest user message limits
  const [hasReachedMessageLimit, setHasReachedMessageLimit] = useState(false); // For guest user message limits
  const [suggestions, setSuggestions] = useState<string[]>([]);


  const router = useRouter();
  const searchParams = useSearchParams();
  const bottomRef = useRef<HTMLDivElement>(null);
  const { signOut: authSignOut } = useAuth();

  const prompts = [
    "What are the best places to visit in Paris?",
    "Can you suggest a 5-day itinerary for Tokyo?",
    "What are some budget-friendly hotels in New York?",
    "How can I travel from Rome to Florence?",
    "What are the must-try foods in Barcelona?",
    "I have 2000 dollars how much in Moroccan currency?",
  ];

  const signOut = () => {
    authSignOut?.();
    router.push('/login');
    toast.success("You have been signed out.");
  };

  useEffect(() => {
    const initializeChat = async () => {
      if (isInitialized) return;

      const sessionId = searchParams.get('sessionId');
      const initialMessage = searchParams.get('initialMessage');

      if (sessionId) {
        setCurrentSession({ sessionId, title: 'New Chat' });
        setDisplayPrompts(false);

        if (initialMessage && !messages.length) {
          const userMessage: Message = {
            id: Date.now(),
            messageType: 'USER',
            content: decodeURIComponent(initialMessage),
          };

          setMessages([userMessage]);

          try {
            const response = await sendMessagesEntity(decodeURIComponent(initialMessage), sessionId);
            const botMessage: Message = {
              id: Date.now() + 1,
              messageType: 'ASSISTANT',
              content: response.text,
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

  const markdownComponents: Components = {
    p: ({ ...props }) => <p className="mb-4 last:mb-0" {...props} />,
    ul: ({ ...props }) => <ul className="list-disc ml-4 mb-4" {...props} />,
    ol: ({ ...props }) => <ol className="list-decimal ml-4 mb-4" {...props} />,
    li: ({ ...props }) => <li className="mb-2" {...props} />,
    h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-4" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-3" {...props} />,
    h3: ({ node, ...props }) => <h3 className="text-md font-bold mb-2" {...props} />,
    code: ({ inline, ...props }: CodeProps) =>
      inline ? (
        <code className="bg-gray-100 px-1 py-0.5 rounded" {...props} />
      ) : (
        <code className="block bg-gray-100 p-4 rounded mb-4" {...props} />
      ),
  };

  const Suggestions = ({ suggestions, handleSendMessage }: { suggestions: string[]; handleSendMessage: (message: string) => void }) => (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Suggestions:</h3>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSendMessage(suggestion)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );

  const handlePromptClick = async (prompt: string) => {
    setDisplayPrompts(false);
    await handleSendMessage(prompt);
  };

  const toggleChatHistory = () => {
    setShowChatHistory(!showChatHistory);
  };

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
      setMessages((prev) => [...prev, userMessage]);
  
      const response = await sendMessagesEntity(message, sessionId);
  
      const botMessage: Message = {
        id: Date.now() + 1,
        messageType: 'ASSISTANT',
        content: response.text,
      };
      setMessages((prev) => [...prev, botMessage]);

      // Update suggestions in state
      setSuggestions(response.suggestions || []);
      setDisplayPrompts(false);
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data === 'Guest session has reached the message limit of 5') {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            messageType: 'ASSISTANT',
            content: "You've reached the message limit for guest users. Please sign up to continue chatting.",
          },
        ]);
      } else {
        toast.error('Failed to send message. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setInputMessage('');
    }
  };


  
  

  const handleTranscription = (transcribedText: string) => {
    setInputMessage(transcribedText);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNewChat = () => {
    setCurrentSession(null); // Clear the current session
    setMessages([]); // Clear the messages
    setDisplayPrompts(true); 
    setMessageCount(0);
    setHasReachedMessageLimit(false);// Display the prompts again
    router.push('/chat'); // Redirect to the chat page
    setIsMobileMenuOpen(false); // Close the mobile menu if open
  };
  

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-white p-4 flex justify-between items-center border-b">
        <Link href="/">
          <Image src="/logo.png" alt="AiTripPlanner Logo" width={24} height={24} />
        </Link>
        <Button variant="ghost" onClick={toggleMobileMenu} aria-label="Toggle menu">
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block bg-white border-r transition-all duration-300 ${showChatHistory ? 'w-full md:w-64' : 'w-16'} md:h-screen flex flex-col`}>
        <div className="p-4 flex items-center justify-center">
          <Link href="/">
            <Image src="/logo.png" alt="AiTripPlanner Logo" width={24} height={24} />
          </Link>
        </div>

        {!showChatHistory ? (
          <nav className="flex-grow flex flex-col">
            <Button
              variant="ghost"
              className="flex items-center py-2 px-4 w-full"
              onClick={toggleChatHistory}
              aria-label="Toggle chat history"
            >
              <MessageSquare className="w-6 h-6" />
            </Button>
            <Button variant="ghost" className="flex items-center py-2 px-4 w-full" aria-label="Favorites">
              <Heart className="w-6 h-6" />
            </Button>
            <Button variant="ghost" className="flex items-center py-2 px-4 w-full" aria-label="Notifications">
              <Bell className="w-6 h-6" />
            </Button>
            <Button variant="ghost" className="flex items-center py-2 px-4 w-full" aria-label="Global">
              <Globe className="w-6 h-6" />
            </Button>
            <div className="mt-auto mb-2 border-t border-gray-200 w-full"></div>
            <Button 
              variant="ghost" 
              className="flex items-center py-2 px-4 w-full mt-auto"
              onClick={signOut}
              aria-label="Logout"
            >
              <LogOut className="w-6 h-6" />
            </Button>
            <Button 
              variant="ghost" 
              className="flex items-center py-2 px-4 w-full mb-4"
              onClick={handleNewChat}
              aria-label="New chat"
            >
              <PlusCircle className="w-6 h-6" />
            </Button>
          </nav>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center p-4 border-b">
              <Button
                variant="ghost"
                className="mr-2"
                onClick={toggleChatHistory}
                aria-label="Close chat history"
              >
                <MessageSquare className="w-6 h-6" />
              </Button>
              <span className="font-semibold">Chat History</span>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
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
                <ul>
                  {currentSession && (
                    <li className="py-2 px-4 cursor-pointer hover:bg-gray-100 bg-gray-200 rounded-md">
                      <span className="truncate">{currentSession.title}</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <Button 
              variant="ghost" 
              className="flex items-center justify-center p-4 w-full border-t"
              onClick={handleNewChat}
              aria-label="New chat"
            >
              <PlusCircle className="w-6 h-6 mr-2" />
              <span>New Chat</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex items-center justify-center p-4 w-full border-t"
              onClick={signOut}
              aria-label="Logout"
            >
              <LogOut className="w-6 h-6 mr-2" />
              <span>Logout</span>
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {displayPrompts ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center bg-gray-50 overflow-y-auto">
            <div className="flex justify-center mb-8">
              <Image src="/logo.png" alt="AiTripPlanner Logo" width={128} height={128} />
            </div>
            <div className="max-w-3xl w-full space-y-4">
              <h2 className="text-2xl font-semibold text-center mb-6">
                How can I help you plan your trip today?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt)}
                    className="text-left p-6 rounded-lg bg-white hover:bg-gray-100 
                             transition-all duration-200 shadow-sm hover:shadow
                             border border-gray-200 hover:border-gray-300"
                  >
                    <p className="text-lg text-gray-800">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-8 ${message.messageType === 'USER' ? 'ml-auto' : 'mr-auto'}`}
                >
                  <div className="flex items-start gap-4">
                    {message.messageType === 'ASSISTANT' && (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                        AI
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        message.messageType === 'USER'
                          ? 'bg-blue-500 text-white ml-auto'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="prose max-w-none">
                        <ReactMarkdown components={markdownComponents}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                    {message.messageType === 'USER' && (
                      <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white">
                        You
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
              {/* Render suggestions if available */}
                {suggestions.length > 0 && (
                <Suggestions suggestions={suggestions} handleSendMessage={handleSendMessage} />
            )}
          </div>
        )}

        {/* Chat Input */}
        <div className="border-t bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4 bg-white rounded-lg border shadow-sm">
              <Input
                type="text"
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputMessage);
                  }
                }}
                className="flex-1 border-none shadow-none focus:ring-0 py-6 px-4"
                disabled={isLoading}
                aria-label="Chat input"
              />
              <Button
                onClick={() => handleSendMessage(inputMessage)}
                disabled={isLoading || !inputMessage.trim()}
                className="m-2 px-6"
                aria-label="Send message"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" aria-hidden="true" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
              {/* Audio Recorder */}
              {currentSession?.sessionId && (
                <AudioRecorder sessionId={currentSession.sessionId} onTranscription={handleTranscription} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Panel */}
      <div className="hidden md:block w-1/4 bg-white border-l p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Details</h2>
        <div className="flex flex-col items-center justify-center h-full">
          <Image src="/image/no-gradient.png" alt="Placeholder" width={200} height={200} />
          <p className="mt-4 text-center">Additional information will appear here.</p>
        </div>
      </div>
    </div>
  );
}


