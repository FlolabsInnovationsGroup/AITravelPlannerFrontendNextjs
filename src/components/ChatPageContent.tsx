'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendMessagesEntity, createSession, getUserSessions, getSessionMessages, updateSession } from '@/lib/api';
import { Send, MessageSquare, Heart, Globe, Bell, PlusCircle, Search, Menu, X, LogOut } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/components/contexts/AuthContext';
import AudioRecorder from './AudioRecorder'; // Import the AudioRecorder component
import { Components } from 'react-markdown';
import { Client } from '@stomp/stompjs'; // Import STOMP.js client
import SockJS from 'sockjs-client'; // Import SockJS for WebSocket fallback
import { addDotToMap, clearMap } from '@/lib/map-service'; // Import map-service functions
import GoogleMapComponent from "@/components/GoogleMapComponent";


interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
}

interface Message {
  id: number;
  messageType: 'USER' | 'ASSISTANT';
  content: string;
}

interface Location {
  sessionId: string;
  latitude: number;
  longitude: number;
  name?: string;
  type?: string;
}

export default function ChatPageContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<{ sessionId: string; title: string } | null>(null);
  const [displayPrompts, setDisplayPrompts] = useState(true);
  const [showChatHistory, setShowChatHistory] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [messageCount, setMessageCount] = useState(0); // For guest user message limits
  const [chatHistory, setChatHistory] = useState<Array<{ sessionId: string; title: string }>>([]);
  const { currentUser } = useAuth(); // Make sure you're getting the current user from AuthContext
  const [hasReachedMessageLimit, setHasReachedMessageLimit] = useState(false); // For guest user message limits
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);


  const router = useRouter();
  const searchParams = useSearchParams();
  const bottomRef = useRef<HTMLDivElement>(null);
  const { signOut: authSignOut } = useAuth();

  // Default prompts
  const defaultPrompts = [
    "What are the best attractions in Paris for first-time visitors?",
    "Can you help me plan a family trip to Tokyo?",
    "What are the top beaches to visit in Bali?",
    "Which European city is best for a weekend getaway?",
    "How can I travel to Europe on a budget?",
    "What are the must-try dishes in Italy?"
  ];

    // Generate dynamic prompts based on context
    const generateDynamicPrompts = (context: string) => {
      if (context.includes("flight")) {
        return ["Book a flight", "Check flight prices", "View flight schedules", "Explore airline options"];
      } else if (context.includes("hotel")) {
        return ["Find nearby hotels", "Check hotel reviews", "View hotel deals", "Explore amenities"];
      } else if (context.includes("beach")) {
        return ["Explore beach resorts", "Find snorkeling spots", "Plan a beach vacation", "Check weather for beaches"];
      }
      return defaultPrompts.slice(0, 4); // Default fallback prompts
    };

      // Dummy locations for testing (Replace or enhance dynamically)
  const testLocations = [
    { sessionId: "1", latitude: 40.712776, longitude: -74.005974, name: "New York" },
    { sessionId: "2", latitude: 34.052235, longitude: -118.243683, name: "Los Angeles" },
    { sessionId: "3", latitude: 51.507351, longitude: -0.127758, name: "London" },
  ];


  const signOut = () => {
    authSignOut?.();
    router.push('/signin');
    toast.success("You have been signed out.");
  };

    // WebSocket connection for real-time updates
    useEffect(() => {
      if (!currentSession?.sessionId) return; // Exit if no session is active
  
      const socketUrl = 'http://localhost:8081/ws'; // Replace with your backend WebSocket URL
      const stompClient = new Client({
        webSocketFactory: () => new SockJS(socketUrl), // Use SockJS for WebSocket fallback
        reconnectDelay: 5000, // Retry connection every 5 seconds if disconnected
        connectHeaders: {
          // Add your authorization header here if needed
          Authorization: `Bearer ${currentUser?.token || ''}`
        },
      });
  
      stompClient.onConnect = () => {
        console.log('WebSocket connected');
  
        // Subscribe to the session's location updates
        stompClient.subscribe(`/topic/locations/${currentSession.sessionId}`, (message) => {
          const locationData = JSON.parse(message.body);
  
          if (locationData === 'MAP_CLEARED') {
            console.log('Map cleared');
            setLocations([]); // Clear the locations state
            clearMap(); // Call the map-service to clear the map
          } else {
            console.log('Location received:', locationData);
            setLocations((prevLocations) => [...prevLocations, locationData]); // Add the new location
            addDotToMap(locationData); // Call the map-service to add the dot to the map
          }
        });
      };
  
      stompClient.onStompError = (frame) => {
        console.error('WebSocket error:', frame.headers['message']);
      };
  
      stompClient.activate(); // Activate the WebSocket connection
  
      // Cleanup function to deactivate the WebSocket when the component unmounts
      return () => {
        stompClient.deactivate();
        console.log('WebSocket disconnected');
      };
    }, [currentSession?.sessionId]); // Re-run when the session ID changes
  

  useEffect(() => {
    const initializeChat = async () => {
      if (isInitialized) return;

      const sessionId = searchParams.get('sessionId');
      const initialMessage = searchParams.get('initialMessage');

      if (sessionId && initialMessage) {
        try {
          // Set current session
          setCurrentSession({ sessionId, title: 'New Chat' });
          setDisplayPrompts(false);

          // Generate and update title
          if (!currentUser?.id) {
            throw new Error('User ID is required to update session');
          }

          const newTitle = generateSessionTitle(decodeURIComponent(initialMessage));
          await updateSession(sessionId, newTitle, currentUser.id);

          // Add user message
          const userMessage: Message = {
            id: Date.now(),
            messageType: 'USER',
            content: decodeURIComponent(initialMessage),
          };

          setMessages([userMessage]);

          // Get AI response
          const response = await sendMessagesEntity(decodeURIComponent(initialMessage), sessionId);
          const botMessage: Message = {
            id: Date.now() + 1,
            messageType: 'ASSISTANT',
            content: response.message,
          };

          setMessages([userMessage, botMessage]);
          await fetchChatHistory(); // Refresh chat history to show new title
        } catch (error) {
          console.error('Error processing initial message:', error);
          toast.error('Failed to process initial message');
        }
      }

      setIsInitialized(true);
    };

    if (currentUser?.id) {
      initializeChat();
    }
  }, [searchParams, isInitialized, currentUser?.id]);

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


  const generateSessionTitle = (message: string) => {
    // Remove special characters and extra spaces
    const cleanMessage = message.replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();
    
    // If message is short enough, use it directly
    if (cleanMessage.length <= 30) {
      return cleanMessage;
    }
    
    // Take first few words and add ellipsis
    const words = cleanMessage.split(' ');
    let title = '';
    for (const word of words) {
      if ((title + word).length > 27) break;
      title += (title ? ' ' : '') + word;
    }
    return title + '...';
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;
  
    setIsLoading(true);
    try {
      let sessionId = currentSession?.sessionId;
  
      if (!sessionId) {
        console.log("Creating a new session...");
        const newSession = await createSession('New Chat');
        sessionId = newSession.sessionId;
        setCurrentSession(newSession);
      }

          // Check guest user message limit
    if (messageCount >= 5 && !currentUser) { // Assuming `currentUser` is null for guest users
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          messageType: 'ASSISTANT',
          content: "You've reached the message limit for guest users. Please sign up to continue chatting.",
        },
      ]);
      setIsLoading(false);
      return;
    }
  
      // Add user message
      const userMessage: Message = {
        id: Date.now(),
        messageType: 'USER',
        content: message,
      };
      setMessages((prev) => [...prev, userMessage]); // Append user message
      console.log("User message added:", userMessage);
  
      // Send message to backend
      console.log("Sending message to API:", message, sessionId);
      const response = await sendMessagesEntity(message, sessionId);
      console.log("API Response:", response);
  
      // Add bot message using the correct response property
      const botMessage: Message = {
        id: Date.now() + 1,
        messageType: 'ASSISTANT',
        content: response.message || "I couldn't process your request. Please try again.",
      };
      setMessages((prev) => [...prev, botMessage]); // Append bot message
      console.log("Bot message added:", botMessage);
  
      // Update suggestions dynamically
      setSuggestions(response.suggestions || generateDynamicPrompts(response.message));
      setDisplayPrompts(false);
    } catch (error: any) {
      console.error("Error in handleSendMessage:", error);
  
      // Fallback error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          messageType: 'ASSISTANT',
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setInputMessage(''); // Clear input box
    }
  };
  


  
    const handlePromptClick = async (prompt: string) => {
    setDisplayPrompts(false);
    await handleSendMessage(prompt);
  };
  const toggleChatHistory = () => {
    setShowChatHistory((prevState) => !prevState);
  };

  const handleTranscription = (transcribedText: string) => {
    setInputMessage(transcribedText);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNewChat = () => {
    setCurrentSession(null);
    setMessages([]);
    setDisplayPrompts(true);
    router.push('/chat');
    setIsMobileMenuOpen(false);
    fetchChatHistory();
  };

  const fetchChatHistory = async () => {
    if (!currentUser?.id) return;
    
    try {
      const sessions = await getUserSessions(currentUser.id);
      console.log('Fetched sessions:', sessions); // Debug log
      setChatHistory(sessions);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      toast.error('Failed to load chat history');
    }
  };

  useEffect(() => {
    if (currentUser?.id && messages.length > 0) {
      fetchChatHistory();
    }
  }, [messages, currentUser?.id]);

  const handleSessionClick = async (session: { sessionId: string; title: string }) => {
    try {
      setCurrentSession(session);
      const sessionMessages = await getSessionMessages(session.sessionId);
      const messageArray = Array.isArray(sessionMessages) ? sessionMessages : [];
      setMessages(messageArray);
      setDisplayPrompts(false);
      setShowChatHistory(false);
      setIsMobileMenuOpen(false);
      await fetchChatHistory();
    } catch (error) {
      console.error('Error loading session messages:', error);
      toast.error('Failed to load chat messages');
    }
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
                  {chatHistory
                    .filter(session => 
                      session.title.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((session) => (
                      <li
                        key={session.sessionId}
                        className={`py-2 px-4 cursor-pointer hover:bg-gray-100 rounded-md ${
                          currentSession?.sessionId === session.sessionId ? 'bg-gray-200' : ''
                        }`}
                        onClick={() => handleSessionClick(session)}
                      >
                        <span className="truncate">{session.title}</span>
                      </li>
                    ))}
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
                {defaultPrompts.map((prompt: string, index: number) => (
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
{/* Details Panel */}
<div className="hidden md:block w-1/4 bg-white border-l p-4 overflow-y-auto">
  <h2 className="text-xl font-bold mb-4">Map</h2>
  {/* Google Map Integration */}
  <GoogleMapComponent locations={locations} />
</div>
    </div>
  );
}


