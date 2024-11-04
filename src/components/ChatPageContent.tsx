'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendMessage, createSession, uploadAudio } from '@/lib/api';
import { Send, Menu, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AudioRecorder from './AudioRecorder'; // Import the AudioRecorder component

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            const response = await sendMessage(decodeURIComponent(initialMessage), sessionId);
            const botMessage: Message = {
              id: Date.now() + 1,
              messageType: 'ASSISTANT',
              content: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
            };
            setMessages([userMessage, botMessage]);
          } catch (error) {
            console.error('Error processing initial message:', error);
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
        content: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
      };
      setMessages(prev => [...prev, botMessage]);
      setDisplayPrompts(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
      setInputMessage('');
    }
  };

  const handleAudioUpload = async (audioFile: File) => {
    if (!audioFile) return;

    setIsLoading(true);
    try {
      let sessionId = currentSession?.sessionId;

      if (!sessionId) {
        const newSession = await createSession('New Chat');
        sessionId = newSession.sessionId;
        setCurrentSession(newSession);
      }

      const response = await uploadAudio(audioFile, sessionId);
      const botMessage: Message = {
        id: Date.now() + 1,
        messageType: 'ASSISTANT',
        content: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
      };

      setMessages(prev => [...prev, botMessage]);
      setDisplayPrompts(false);
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast.error('Failed to upload audio. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      <div className="md:hidden bg-white p-4 flex justify-between items-center border-b">
        <Link href="/">
          <Image src="/logo.png" alt="AiTripPlanner Logo" width={24} height={24} />
        </Link>
        <Button variant="ghost" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {displayPrompts ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center bg-gray-50 overflow-y-auto">
            <h2 className="text-2xl font-semibold text-center mb-6">How can I help you plan your trip today?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prompts.map((prompt, index) => (
                <button key={index} onClick={() => handleSendMessage(prompt)} className="text-left p-6 rounded-lg bg-white hover:bg-gray-100 transition-all duration-200 shadow-sm border border-gray-200">
                  <p className="text-lg text-gray-800">{prompt}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto">
              {messages.map((message) => (
                <div key={message.id} className={`mb-8 ${message.messageType === 'USER' ? 'ml-auto' : 'mr-auto'}`}>
                  <div className="flex items-start gap-4">
                    {message.messageType === 'ASSISTANT' && (
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">AI</div>
                    )}
                    <div className={`max-w-[80%] p-4 rounded-lg ${message.messageType === 'USER' ? 'bg-blue-500 text-white ml-auto' : 'bg-white border border-gray-200'}`}>
                      <ReactMarkdown>{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}</ReactMarkdown>
                    </div>
                    {message.messageType === 'USER' && (
                      <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white">You</div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
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
                className="flex-1 border-none shadow-none focus:ring-0 py-6 px-4"
                disabled={isLoading}
                aria-label="Chat input"
              />
              <Button onClick={() => handleSendMessage(inputMessage)} disabled={isLoading || !inputMessage.trim()} className="m-2 px-6" aria-label="Send message">
                {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" aria-hidden="true" /> : <Send className="h-5 w-5" />}
              </Button>
              <AudioRecorder onAudioUpload={handleAudioUpload} /> {/* Audio Recorder Component */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
