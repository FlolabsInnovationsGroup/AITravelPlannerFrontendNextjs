'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendMessagesEntity, createSession, getUserSessions, getSessionMessages, updateSession, getLocationsBySession, getToken } from '@/lib/api';
import { Send, Menu, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import AudioRecorder from './AudioRecorder';
import { Components } from 'react-markdown';
import LeftMenuBar from '@/components/features/chat/LeftMenuBar';
import RightMapPanel from '@/components/features/map/RightMapPanel';
import LocationSuggestions from '@/components/features/map/LocationSuggestions';
import { LocationExtractionService } from '@/services/LocationExtractionService';
import { LocationService } from '@/services/LocationService';
import { MapService } from '@/services/MapService';
import { LoadScript, LoadScriptProps } from '@react-google-maps/api';
import { Location } from '@/types/map';

// Loader Component
const MessageLoader = () => {
    return (
        <div className="flex justify-start items-center gap-2 mt-4">
        <div className="flex space-x-1 bg-gray-200 rounded-full px-3 py-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-300"></div>
        </div>
      </div>
    );
  };
  

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
    inline?: boolean;
}

interface Message {
    id: number;
    messageType: 'USER' | 'ASSISTANT';
    content: string;
}

const libraries: LoadScriptProps["libraries"] = ["places"];

export default function ChatPageContent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
    const [currentSession, setCurrentSession] = useState<{ sessionId: string; title: string } | null>(null);
    const [displayPrompts, setDisplayPrompts] = useState(true);
    const [showChatHistory, setShowChatHistory] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [messageCount, setMessageCount] = useState(0);
    const [chatHistory, setChatHistory] = useState<Array<{ sessionId: string; title: string }>>([]);
    const [wsConnected, setWsConnected] = useState(false);
    const [wsRetryCount, setWsRetryCount] = useState(0);
    const { currentUser } = useAuth();
    const [hasReachedMessageLimit, setHasReachedMessageLimit] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [locationSuggestions, setLocationSuggestions] = useState<Location[]>([]);
    const [pendingLocationSearch, setPendingLocationSearch] = useState<string | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const bottomRef = useRef<HTMLDivElement>(null);
    const { signOut: authSignOut } = useAuth();
    const mapServiceRef = useRef<MapService | null>(null);
    const wsReconnectTimerRef = useRef<NodeJS.Timeout>();
    const MAX_WS_RETRIES = 3;

    // Memoize token to prevent unnecessary re-renders of RightMapPanel
    const currentUserToken = React.useMemo(() => {
        return currentUser?.token || getToken();
    }, [currentUser?.token]);

    // Initialize and manage MapService and sessions
    useEffect(() => {
        if (!currentUser?.token) return;
        
        // Initialize MapService if not exists
        if (!mapServiceRef.current) {
            console.log("🔧 Initializing MapService");
            mapServiceRef.current = new MapService(currentUser.token);
            
            // Set up WebSocket event listeners
            mapServiceRef.current.onConnect = () => {
                console.log("✅ WebSocket connected");
                setWsConnected(true);
                setWsRetryCount(0);
                if (wsReconnectTimerRef.current) {
                    clearTimeout(wsReconnectTimerRef.current);
                }
            };

            mapServiceRef.current.onDisconnect = () => {
                console.log("❌ WebSocket disconnected");
                setWsConnected(false);
                handleReconnection();
            };

            mapServiceRef.current.onError = (error) => {
                console.error("⚠️ WebSocket error:", error);
                toast.error("Connection error. Attempting to reconnect...");
                handleReconnection();
            };
        }

        // Handle WebSocket reconnection
        const handleReconnection = () => {
            if (wsRetryCount >= MAX_WS_RETRIES) {
                console.error("🚫 Max WebSocket retry attempts reached");
                toast.error("Unable to establish connection. Please refresh the page.");
                return;
            }

            if (wsReconnectTimerRef.current) {
                clearTimeout(wsReconnectTimerRef.current);
            }

            wsReconnectTimerRef.current = setTimeout(() => {
                if (currentSession?.sessionId && !wsConnected) {
                    console.log(`🔄 Attempting reconnection (attempt ${wsRetryCount + 1})`);
                    connectToSession(currentSession.sessionId);
                    setWsRetryCount(prev => prev + 1);
                }
            }, Math.min(1000 * Math.pow(2, wsRetryCount), 10000)); // Exponential backoff, max 10s
        };

        // Handle session connection
        const connectToSession = async (sessionId: string) => {
            try {
                if (!mapServiceRef.current || wsConnected) {
                    return;
                }

                console.log(`🔄 Connecting to session: ${sessionId}`);
                await mapServiceRef.current.connectWebSocket(sessionId);
            } catch (error) {
                console.error("❌ Error connecting to session:", error);
                toast.error("Failed to connect to session");
                handleReconnection();
            }
        };

        // Connect to current session if exists
        if (currentSession?.sessionId && !wsConnected) {
            connectToSession(currentSession.sessionId);
        }

        // Cleanup function
        return () => {
            if (mapServiceRef.current) {
                console.log("🧹 Cleaning up MapService connections");
                mapServiceRef.current.disconnect();
                mapServiceRef.current = null;
                setWsConnected(false);
            }
            if (wsReconnectTimerRef.current) {
                clearTimeout(wsReconnectTimerRef.current);
            }
        };
    }, [currentUser?.token, currentSession?.sessionId]);

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
        authSignOut?.();
        router.push('/auth/signin');
        toast.success("You have been signed out.");
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
    
    const locationService = useRef<LocationExtractionService | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && isGoogleMapsLoaded) {
            locationService.current = new LocationExtractionService();
        }
    }, [isGoogleMapsLoaded]);

    // Helper function to add location to map
    const addLocationToMap = async (location: Location) => {
        try {
            if (!mapServiceRef.current) {
                console.error("MapService not initialized");
                throw new Error("MapService not initialized");
            }

            if (!currentSession?.sessionId) {
                console.error("No active session");
                throw new Error("No active session");
            }

            const locationToAdd = {
                latitude: location.latitude,
                longitude: location.longitude,
                name: location.name,
                type: location.type,
                sessionId: currentSession.sessionId
            };
            
            console.log("📍 Attempting to add location:", locationToAdd);
            const addedLocation = await mapServiceRef.current.addLocation(locationToAdd);
            
            console.log("✅ Location added successfully:", addedLocation);
            
            // Dispatch event for map update
            const event = new CustomEvent('newLocation', { 
                detail: addedLocation
            });
            window.dispatchEvent(event);
            console.log("🌍 Location event dispatched");
            
            return addedLocation;
        } catch (error) {
            console.error("❌ Error adding location:", error);
            
            // Check if it's a validation error
            if (error instanceof Error && error.message && error.message.includes('invalid characters')) {
                console.warn("⚠️ Location name contains invalid characters:", location.name);
                throw new Error(`Location name "${location.name}" contains characters not supported by the server.`);
            }
            
            throw error;
        }
    };

    // Handler for when user selects a location from suggestions
    const handleLocationSelect = async (location: Location) => {
        console.log("🎯 User selected location:", location);
        
        try {
            // Add the selected location to the map
            await addLocationToMap(location);
            console.log("✅ Location successfully added to map");
            
            // Clear suggestions and continue with the original message
            setLocationSuggestions([]);
            const originalMessage = pendingLocationSearch;
            setPendingLocationSearch(null);
            
            if (originalMessage) {
                // Add the original user message to chat (since it was never added when suggestions were shown)
                setMessages((prev) => {
                    // Check if message already exists
                    if (prev.length > 0 && prev[prev.length - 1].content === originalMessage && prev[prev.length - 1].messageType === "USER") {
                        console.warn("⚠️ User message already in chat, skipping duplicate");
                        return prev;
                    }
                    console.log("✅ Adding selected user message to chat:", originalMessage);
                    return [...prev, { id: Date.now(), messageType: 'USER', content: originalMessage }];
                });
                
                console.log("📞 Continuing with enhanced message after location selection");
                // Create enhanced message for AI context
                const enhancedMessage = `I've added ${location.name} to the map. ${originalMessage}. Please provide detailed travel information about this place.`;
                
                // Continue processing with enhanced message
                await processChatMessage(enhancedMessage);
            } else {
                console.warn("⚠️ No pending message to continue with");
            }
        } catch (error) {
            console.error("❌ Error in handleLocationSelect:", error);
            // Even if location adding fails, continue with chat
            setLocationSuggestions([]);
            const originalMessage = pendingLocationSearch;
            setPendingLocationSearch(null);
            
            if (originalMessage) {
                // Add the original user message to chat (since it was never added)
                setMessages((prev) => {
                    if (prev.length > 0 && prev[prev.length - 1].content === originalMessage && prev[prev.length - 1].messageType === "USER") {
                        return prev;
                    }
                    return [...prev, { id: Date.now(), messageType: 'USER', content: originalMessage }];
                });
                
                await processChatMessage(originalMessage);
            }
        }
    };

    // Handler for dismissing location suggestions
    const handleLocationSuggestionsDismiss = async () => {
        console.log("❌ User dismissed location suggestions");
        setLocationSuggestions([]);
        const originalMessage = pendingLocationSearch;
        setPendingLocationSearch(null);
        
        if (originalMessage) {
            // Add the original user message to chat (since it was never added when suggestions were shown)
            setMessages((prev) => {
                // Check if message already exists
                if (prev.length > 0 && prev[prev.length - 1].content === originalMessage && prev[prev.length - 1].messageType === "USER") {
                    console.warn("⚠️ User message already in chat, skipping duplicate");
                    return prev;
                }
                console.log("✅ Adding dismissed user message to chat:", originalMessage);
                return [...prev, { id: Date.now(), messageType: 'USER', content: originalMessage }];
            });
            
            // Continue processing the original message without location extraction
            await processChatMessage(originalMessage);
        }
    };

    // Separate function for processing chat message (user message should already be in UI)
    const processChatMessage = async (message: string) => {
        try {
            let sessionId = currentSession?.sessionId;
    
            if (!sessionId) {
                console.log("Creating a new session...");
                const newSession = await createSession('New Chat');
    
                if (!newSession || !newSession.sessionId) {
                    throw new Error("Failed to create a new session.");
                }
    
                sessionId = newSession.sessionId;
                setCurrentSession(newSession);
                if (mapServiceRef.current && newSession.sessionId) {
                    mapServiceRef.current.connectWebSocket(newSession.sessionId);
                }
            }
    
            // Send message to backend (user message should already be in chat UI)
            console.log("📡 Sending message to API:", message, sessionId);
            console.log("📡 About to call sendMessagesEntity...");
            
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('API call timeout after 30 seconds')), 30000);
            });
            
            const response = await Promise.race([
                sendMessagesEntity(message, sessionId),
                timeoutPromise
            ]);
            
            console.log("📡 API Response received:", response);
    
            if (!response || typeof (response as any)?.message !== "string") {
                console.error("Invalid response format:", response);
                throw new Error("Invalid response from API");
            }
    
            setMessages((prev) => [...prev, { 
                id: Date.now() + 1, 
                messageType: 'ASSISTANT', 
                content: (response as any).message 
            }]);
    
            setMessageCount(prev => prev + 1);
            
        } catch (error) {
            console.error("❌ Error processing chat message:", error);
            toast.error('Failed to send message');
        }
    };

    const handleSendMessage = async (message: string) => {
        if (!message.trim()) return;
    
        setIsLoading(true);
    
        try {
            // ✅ FIRST: Add user's original message to chat UI immediately
            setMessages((prev) => {
                // Prevent duplicate messages
                if (prev.length > 0 && prev[prev.length - 1].content === message && prev[prev.length - 1].messageType === "USER") {
                    console.warn("⚠️ Duplicate message detected, skipping:", message);
                    return prev;
                }
                console.log("✅ User message added to chat:", message);
                return [...prev, { id: Date.now(), messageType: 'USER', content: message }];
            });

            // Check if the message mentions locations - expanded for travel terms
            const locationKeywords = [
                'show', 'find', 'where', 'restaurant', 'place', 'location', 'near', 'at', 'in', 'visit',
                'attractions', 'attraction', 'sights', 'things to do', 'destinations', 'travel', 'trip',
                'hotel', 'hotels', 'cafe', 'cafes', 'museum', 'museums', 'park', 'parks',
                'best', 'top', 'popular', 'famous', 'must-see', 'recommended', 'guide',
                'paris', 'london', 'tokyo', 'new york', 'rome', 'barcelona', 'amsterdam' // common cities
            ];
            const hasLocationKeyword = locationKeywords.some(keyword => 
                message.toLowerCase().includes(keyword)
            );
            
            console.log(`🔍 Checking for location keywords in: "${message}"`);
            console.log(`🎯 Has location keyword: ${hasLocationKeyword}`);

            // Extract and add locations from the message if it contains location keywords
            let locationsAdded = false;
            if (hasLocationKeyword && locationService.current) {
                console.log("🔍 Extracting location from message:", message);
                try {
                    const locationResult = await locationService.current.extractLocationFromMessage(message);
                    console.log("🔍 Location extraction result:", locationResult);
                    
                    if (locationResult.extractedLocation && currentSession?.sessionId) {
                        // Check if there are multiple suggestions
                        if (locationResult.suggestedPlaces && locationResult.suggestedPlaces.length > 0) {
                            // Show suggestions to user - BUT DON'T add user message to chat yet
                            // Remove the user message that was added earlier since we're waiting for selection
                            setMessages((prev) => {
                                if (prev.length > 0 && prev[prev.length - 1].content === message && prev[prev.length - 1].messageType === "USER") {
                                    console.log("🔄 Removing user message temporarily for location selection");
                                    return prev.slice(0, -1); // Remove last message
                                }
                                return prev;
                            });
                            
                            console.log("🔍 Multiple location options found, showing suggestions");
                            setLocationSuggestions([locationResult.extractedLocation, ...locationResult.suggestedPlaces]);
                            setPendingLocationSearch(message);
                            setIsLoading(false); // Stop loading since we're waiting for user input
                            return; // Don't proceed with sending the message yet
                        }
                        
                        console.log("📍 Found location:", locationResult.extractedLocation);
                        await addLocationToMap(locationResult.extractedLocation);
                        locationsAdded = true;
                    } else if (locationResult.error) {
                        console.warn("⚠️ Location extraction error:", locationResult.error);
                    } else {
                        console.log("ℹ️ No specific location extracted, proceeding with normal chat");
                    }
                } catch (error) {
                    console.error("❌ Location extraction failed:", error);
                    // Continue with normal chat processing even if location extraction fails
                }
            } else {
                console.log("ℹ️ No location extraction needed, proceeding with normal chat");
            }
            
            // If locations were added, modify the message to provide context to the AI (internal only)
            let messageToSend = message;
            if (locationsAdded) {
                messageToSend = `I've added the location you mentioned to the map. ${message}. Please provide travel information about this place.`;
                console.log("📍 Enhanced message for AI (internal):", messageToSend);
            }

            console.log("💬 Proceeding to send message to chat API");
            let sessionId = currentSession?.sessionId;
    
            if (!sessionId) {
                console.log("Creating a new session...");
                const newSession = await createSession('New Chat');
    
                if (!newSession || !newSession.sessionId) {
                    throw new Error("Failed to create a new session.");
                }
    
                sessionId = newSession.sessionId;
                setCurrentSession(newSession);
                // Ensure WebSocket is connected after setting new session
                if (mapServiceRef.current && newSession.sessionId) {
                    mapServiceRef.current.connectWebSocket(newSession.sessionId);
                }
            }
    
            // ✅ Send enhanced message to backend (user message already added to UI above)
            console.log("📡 Sending enhanced message to API:", messageToSend, sessionId);
            console.log("📡 About to call sendMessagesEntity...");
            
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('API call timeout after 30 seconds')), 30000);
            });
            
            const response = await Promise.race([
                sendMessagesEntity(messageToSend, sessionId),
                timeoutPromise
            ]);
            console.log("API Response:", response);
    
            if (!response || typeof (response as any)?.message !== "string") {
                console.error("Invalid response format:", response);
    
                setMessages((prev) => [...prev, {
                    id: Date.now() + 1,
                    messageType: 'ASSISTANT',
                    content: "Something went wrong. Please try again.",
                }]);
            } else {
                setMessages((prev) => [...prev, {
                    id: Date.now() + 1,
                    messageType: 'ASSISTANT',
                    content: (response as any).message,
                }]);

                    // Check if the message might contain location data
                const locationKeywords = ['show', 'find', 'where', 'restaurant', 'place', 'location', 'near', 'at', 'in'];
                const hasLocationKeyword = locationKeywords.some(keyword => 
                    message.toLowerCase().includes(keyword)
                );

                if (hasLocationKeyword) {
                    // Add a small delay to allow the backend to process locations
                    setTimeout(async () => {
                        try {
                            console.log('🗺️ Fetching locations for session:', sessionId);
                            const locations = await getLocationsBySession(sessionId);
                            
                            if (locations && locations.length > 0) {
                                console.log(`📍 Found ${locations.length} locations:`, locations);
                                toast.success(`Found ${locations.length} locations on the map`);
                            } else {
                                console.log('⚠️ No locations found for the request');
                                // Only show the message if it's likely we should have found locations
                                if (message.toLowerCase().includes('restaurant') || 
                                    message.toLowerCase().includes('place') ||
                                    message.toLowerCase().includes('where is')) {
                                    toast('No specific locations found for this request. Try being more specific with the location.', {
                                        icon: '🗺️',
                                        duration: 4000
                                    });
                                }
                            }
                        } catch (error: any) {
                            console.error('❌ Error fetching locations:', error);
                            toast.error(error.message || 'Failed to load location data');
                        }
                    }, 1000); // 1 second delay to allow backend processing
                }                // ✅ Update suggestions dynamically
                setSuggestions((response as any).suggestions || generateDynamicPrompts((response as any).message));
            }
    
            setDisplayPrompts(false);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages((prev) => [...prev, {
                id: Date.now(),
                messageType: 'ASSISTANT',
                content: "Something went wrong. Please try again.",
            }]);
        } finally {
            setIsLoading(false);
            setInputMessage('');
        }
    };
    
    
    
    
    const handlePromptClick = async (prompt: string) => {
        console.log("Saving initial message:", prompt);
    
        // ✅ Store the message in sessionStorage before navigating
        sessionStorage.setItem("initialMessage", prompt);
    
        // ✅ Navigate to the chat page with the message as a query parameter
        router.push(`/chat?initialMessage=${encodeURIComponent(prompt)}`);
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
        if (bottomRef.current && !inputMessage) {
            // Use a more controlled scroll that doesn't affect page layout
            const chatContainer = bottomRef.current.closest('.overflow-y-auto');
            if (chatContainer) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            } else {
                // Fallback with block: 'nearest' to prevent page layout shifts
                bottomRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest',
                    inline: 'nearest' 
                });
            }
        }
    }, [messages, inputMessage]);


    useEffect(() => {
        const initializeChat = async () => {
            if (isInitialized || !currentUser || typeof window === 'undefined') return;
        
            console.log("Initializing chat...");
        
            let sessionId = searchParams.get("sessionId");
            if (typeof window !== 'undefined') {
                sessionId = sessionId || sessionStorage.getItem("chatSessionId");
            }
            let initialMessage = searchParams.get("initialMessage") || sessionStorage.getItem("initialMessage");
        
            console.log("➡️ Checking sessionId:", sessionId);
            console.log("➡️ Checking initialMessage:", initialMessage);
        
            if (!sessionId) {
                console.log("⚠️ No session found, creating a new session...");
                const newSession = await createSession("New Chat");
        
                if (newSession?.sessionId) {
                    sessionId = newSession.sessionId;
                    sessionStorage.setItem("chatSessionId", sessionId);
                    setCurrentSession({ sessionId, title: "New Chat" });
                    console.log("✅ New session created:", sessionId);
                } else {
                    console.error("❌ Failed to create a session.");
                    return;
                }
            } else {
                setCurrentSession({ sessionId, title: "New Chat" });
                console.log("✅ Using existing session:", sessionId);
            }
        
            if (initialMessage) {
                console.log("✅ Retrieved initial message:", initialMessage);
        
                try {
                    const decodedMessage = decodeURIComponent(initialMessage);
        

            // ✅ Prevent duplicate processing but allow future messages
            if (sessionStorage.getItem("sentMessage") === decodedMessage) {
            console.log("⚠️ Message already sent, skipping duplicate.");
            sessionStorage.removeItem("sentMessage"); // Clear it after sending once
            return;
            }

        
                    // ✅ Add to state (avoid duplicate messages)
                    setMessages((prev) => {
                        if (!prev.some((m) => m.content === decodedMessage)) {
                            console.log("✅ Adding initial message to state:", decodedMessage);
                            return [
                                ...prev,
                                { id: Date.now(), messageType: "USER", content: decodedMessage }
                            ];
                        }
                        return prev;
                    });
        
                    // 🛑 Store in sessionStorage to avoid duplicates
                    sessionStorage.setItem("sentMessage", decodedMessage);
        
                    // ✅ Update session title if user is logged in
                    if (currentUser?.id) {
                        const newTitle = generateSessionTitle(decodedMessage);
                        await updateSession(sessionId, newTitle, currentUser.id);
                    }
        
                    // ✅ Send message to backend only if not already sent
                    const response = await sendMessagesEntity(decodedMessage, sessionId);
        
                    setMessages((prev) => {
                        if (!prev.some((m) => m.content === (response as any).message)) {
                            return [
                                ...prev,
                                { id: Date.now() + 1, messageType: "ASSISTANT", content: (response as any).message || "I couldn't process your request. Please try again." }
                            ];
                        }
                        return prev;
                    });
        
                    // ✅ Clean up session storage **after response is processed**
                    sessionStorage.removeItem("initialMessage");
                } catch (error) {
                    console.error("Error initializing chat session:", error);
                    toast.error("Failed to initialize chat session");
                }
            }
        
            setIsInitialized(true);
        };
        
        initializeChat();
        }, [searchParams, isInitialized]);
        
        
    
    
    
    
    
    


    return (
        <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
            libraries={libraries}
            onLoad={() => setIsGoogleMapsLoaded(true)}
        >
            <div className="flex h-screen bg-gray-100 overflow-hidden">
                <div className="flex flex-1 min-h-0">{/* min-h-0 prevents flex items from growing beyond container */}
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
                    <div className="flex-[3.3] flex flex-col bg-white border-l border-r overflow-hidden min-h-0">
                        {/* Chat Section */}
                        <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0">{/* Prevent chat from growing beyond bounds */}
                            {displayPrompts && messages.length === 0 ? (
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
                                <div className="flex-1 overflow-y-auto p-4 min-h-0">{/* Remove viewport calc, let flex handle it */}
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
                        {/* ✅ Loader Display */}
                        {isLoading && <MessageLoader />}
                        <div ref={bottomRef} />
                    </div>
                    {suggestions.length > 0 && (
                        <Suggestions suggestions={suggestions} handleSendMessage={handleSendMessage} />
                    )}
                </div>
                            )}
                        </div>
    
                        {/* Chat Input */}
                        <div className="border-t bg-white p-4 flex-shrink-0">{/* Use flex-shrink-0 instead of sticky to prevent layout shifts */}
                            <div className="max-w-3xl mx-auto">
                                <div className="flex items-center gap-4 bg-white rounded-xl border shadow-md p-3">
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
                                        className="flex-1 border-none shadow-none focus:ring-0 py-4 px-4 rounded-xl bg-gray-100"
                                        disabled={isLoading}
                                        aria-label="Chat input"
                                    />
                                    <Button
                                        onClick={() => handleSendMessage(inputMessage)}
                                        disabled={isLoading || !inputMessage.trim()}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl shadow"
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
                    <div className="flex-[2.7] bg-white overflow-hidden p-4 h-full min-h-0">{/* Ensure map area doesn't grow */}
                        {typeof window !== 'undefined' && (
                            <RightMapPanel
                                currentSessionId={currentSession?.sessionId || null}
                                currentUserToken={currentUserToken}
                            />
                        )}
                    </div>
                </div>
            </div>
            
            {/* Location Suggestions Modal */}
            {locationSuggestions.length > 0 && pendingLocationSearch && (
                <LocationSuggestions
                    suggestions={locationSuggestions}
                    onLocationSelect={handleLocationSelect}
                    onDismiss={handleLocationSuggestionsDismiss}
                    searchTerm={pendingLocationSearch}
                />
            )}
        </LoadScript>
    );
}