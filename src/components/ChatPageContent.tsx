'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendMessagesEntity, createSession, getUserSessions, getSessionMessages, updateSession } from '@/lib/api';
import { Send, Menu, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/components/contexts/AuthContext';
import AudioRecorder from './AudioRecorder';
import { Components } from 'react-markdown';
import LeftMenuBar from '@/components/LeftMenuBar';
import RightMapPanel from '@/components/features/map/RightMapPanel';

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
    const [showChatHistory, setShowChatHistory] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [messageCount, setMessageCount] = useState(0);
    const [chatHistory, setChatHistory] = useState<Array<{ sessionId: string; title: string }>>([]);
    const { currentUser } = useAuth();
    const [hasReachedMessageLimit, setHasReachedMessageLimit] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

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
    const generateDynamicPrompts = (context: string | undefined) => {
        if (!context) {
            console.warn("generateDynamicPrompts received an undefined context.");
            return defaultPrompts.slice(0, 4); // Return default prompts instead of crashing
        }
    
        const lowerCaseContext = context.toLowerCase(); // Ensure case-insensitive search
    
        if (lowerCaseContext.includes("flight")) {
            return ["Book a flight", "Check flight prices", "View flight schedules", "Explore airline options"];
        } else if (lowerCaseContext.includes("hotel")) {
            return ["Find nearby hotels", "Check hotel reviews", "View hotel deals", "Explore amenities"];
        } else if (lowerCaseContext.includes("beach")) {
            return ["Explore beach resorts", "Find snorkeling spots", "Plan a beach vacation", "Check weather for beaches"];
        }
    
        return defaultPrompts.slice(0, 4); // Default fallback prompts
    };
    

    // Event handlers and functions
    const signOut = () => {
        if (authSignOut) {
            authSignOut();
            router.push('/signin');
            toast.success("You have been signed out.");
        }
    };
    
    const handleNewChat = async () => {
        try {
            setCurrentSession(null);
            setMessages([]);
            setDisplayPrompts(true);
            router.push('/chat');
            setIsMobileMenuOpen(false);
            await fetchChatHistory();
        } catch (error) {
            console.error('Error starting a new chat:', error);
            toast.error('Failed to start a new chat');
        }
    };
    
    const toggleChatHistory = () => {
        setShowChatHistory((prevState) => !prevState);
    };
    
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen((prev) => !prev);
    };
    
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
    
    const handleSendMessage = async (message: string) => {
        if (!message.trim()) return;
    
        setIsLoading(true);
        try {
            let sessionId = currentSession?.sessionId;
    
            if (!sessionId) {
                console.log("Creating a new session...");
                const newSession = await createSession('New Chat');
                console.log("New session created:", newSession);
                
                if (!newSession || !newSession.sessionId) {
                    throw new Error("Failed to create a new session.");
                }
    
                sessionId = newSession.sessionId;
                setCurrentSession(newSession);
            }
    
            if (messageCount >= 1000 && !currentUser) {
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
    
            const userMessage: Message = {
                id: Date.now(),
                messageType: 'USER',
                content: message,
            };
            setMessages((prev) => [...prev, userMessage]);
    
            const response = await sendMessagesEntity(message, sessionId);
    
            if (!response || typeof response.message !== "string") {
                console.error("Invalid response format:", response);
                setSuggestions(defaultPrompts.slice(0, 4)); // ✅ Use safe fallback
            } else {
                const botMessage: Message = {
                    id: Date.now() + 1,
                    messageType: 'ASSISTANT',
                    content: response.message,
                };
                setMessages((prev) => [...prev, botMessage]);
    
                setSuggestions(response.suggestions || generateDynamicPrompts(response.message));
            }
    
            setDisplayPrompts(false);
        } catch (error) {
            console.error('Error sending message:', error);
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
            setInputMessage('');
        }
    };
    
    
    const handlePromptClick = async (prompt: string) => {
        setDisplayPrompts(false);
        await handleSendMessage(prompt);
    };
    
    const handleTranscription = (transcribedText: string) => {
        console.log("✅ Received transcription:", transcribedText);
        setInputMessage(transcribedText);
        handleSendMessage(transcribedText); // ✅ Auto-send
    };
    
    
    const fetchChatHistory = async () => {
        if (!currentUser?.id) return;
    
        try {
            const sessions = await getUserSessions(currentUser.id);
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
    

    const generateSessionTitle = (message: string) => {
        const cleanMessage = message.replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();

        if (cleanMessage.length <= 30) {
            return cleanMessage;
        }

        const words = cleanMessage.split(' ');
        let title = '';
        for (const word of words) {
            if ((title + word).length > 27) break;
            title += (title ? ' ' : '') + word;
        }
        return title + '...';
    };

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

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        const initializeChat = async () => {
            if (isInitialized) return;
    
            const sessionId = searchParams.get('sessionId');
            const initialMessage = searchParams.get('initialMessage');
    
            if (sessionId && initialMessage) {
                try {
                    const userMessage: Message = {
                        id: Date.now(),
                        messageType: 'USER',
                        content: decodeURIComponent(initialMessage),
                    };
    
                    setCurrentSession({ sessionId, title: 'New Chat' });
                    setMessages([userMessage]);
    
                    const response = await sendMessagesEntity(decodeURIComponent(initialMessage), sessionId);
                    const botMessage: Message = {
                        id: Date.now() + 1,
                        messageType: 'ASSISTANT',
                        content: response.message || "I couldn't process your request. Please try again.",
                    };
    
                    setMessages([userMessage, botMessage]);
                } catch (error) {
                    console.error('Error initializing chat session:', error);
                    toast.error('Failed to initialize chat session');
                }
            }
    
            setIsInitialized(true);
        };
    
        // Invoke the initializeChat function
        initializeChat();
    }, [searchParams, isInitialized]);
    


    return (
        <div className="flex h-screen bg-gray-100">
            {/* Left Menu Bar */}
            <LeftMenuBar
                isMobileMenuOpen={isMobileMenuOpen}
                showChatHistory={showChatHistory}
                toggleChatHistory={toggleChatHistory}
                toggleMobileMenu={toggleMobileMenu}
                signOut={signOut}
                handleNewChat={handleNewChat}
                chatHistory={chatHistory}
                currentSessionId={currentSession?.sessionId || null}
                handleSessionClick={handleSessionClick}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />
    
            {/* Middle Chat Section */}
            <div className="flex-[3.3] flex flex-col bg-white border-l border-r overflow-hidden">
                {/* Chat Section */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {displayPrompts ? (
                        <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto">
                        {/* Wrapper for Logo */}
                        <div className="flex justify-center mt-6 mb-8">
                            <Image
                                src="/logo.png"
                                alt="AiTripPlanner Logo"
                                width={128}
                                height={128}
                                style={{ width: 'auto', height: 'auto' }}
                                className="object-contain"
                            />
                        </div>
                    
                        {/* Wrapper for Prompts */}
                        <div className="flex-1 flex flex-col items-center justify-center px-6">
                            <div className="max-w-3xl w-full text-center">
                                <h2 className="text-2xl font-semibold mb-6">
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
                            {suggestions.length > 0 && (
                                <Suggestions suggestions={suggestions} handleSendMessage={handleSendMessage} />
                            )}
                        </div>
                    )}
                </div>
    
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
                                    <div
                                        className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
                            </Button>
                            {currentSession?.sessionId && (
                                <AudioRecorder sessionId={currentSession.sessionId} onTranscription={handleTranscription} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
    
{/* Right Map Panel */}
<div className="flex-[2.7] bg-white overflow-hidden p-4 h-full">
    <RightMapPanel
        currentSessionId={currentSession?.sessionId || null}
        currentUserToken={currentUser?.token || null}
    />
</div>
</div>

    );      
    
    
    
    
    
    
    
    
    
    
    
    
}
    
