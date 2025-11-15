'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from "next/image";
import ReactMarkdown from 'react-markdown';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendMessagesEntity, createSession, getUserSessions, getSessionMessages, updateSession, getLocationsBySession, getToken } from '@/lib/api';
import { Send, Menu, Map, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Components } from 'react-markdown';
import { LoadScript, LoadScriptProps } from '@react-google-maps/api';
import { Location } from '@/types/map';
import SmartSuggestionsComponent from './SmartSuggestionsComponent';
import AudioRecorder from './AudioRecorder';
import LeftMenuBar from '@/components/features/chat/LeftMenuBar';
import LocationSuggestions from '@/components/features/map/LocationSuggestions';
import dynamic from 'next/dynamic';
import { useChatErrorHandler } from '@/hooks/useMessageRetry';
import { ConnectionState } from '@/hooks/useEnhancedWebSocket';
import { 
  MessageStatusIndicator, 
  TypingIndicator, 
  ErrorMessage 
} from '@/components/ui/ChatUIComponents';

// Code splitting for heavy map component (Performance Audit Implementation)
const RightMapPanel = dynamic(() => import('@/components/features/map/RightMapPanel'), {
  ssr: false, // Map components work better with client-side rendering
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading map...</p>
      </div>
    </div>
  )
});
import { LocationExtractionService } from '@/services/LocationExtractionService';
import { MapService } from '@/services/MapService';
import BeautifulChatContainer from './BeautifulChatContainer';

// Loader Component
const MessageLoader = () => {
    return (
        <div className="flex justify-start items-center gap-2 mt-4">
        <div className="flex space-x-1 bg-gray-200 rounded-full px-3 py-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150" />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-300" />
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
    timestamp?: Date;
}

interface ApiResponse {
    message: string;
    suggestions?: string[];
}

const libraries: LoadScriptProps["libraries"] = ["places"];

// Suggestions Component - moved outside to prevent re-renders
const Suggestions = ({ suggestions, handleSendMessage }: { suggestions: string[]; handleSendMessage: (message: string) => void }) => (
    <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Suggestions:</h3>
        <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
                <button
                    key={`suggestion-${index}`}
                    type="button"
                    onClick={() => handleSendMessage(suggestion)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
                >
                    {suggestion}
                </button>
            ))}
        </div>
    </div>
);

export default function ChatPageContent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
    const [currentSession, setCurrentSession] = useState<{ sessionId: string; title: string } | null>(null);
    const [displayPrompts, setDisplayPrompts] = useState(true);
    const [showChatHistory, setShowChatHistory] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<Array<{ sessionId: string; title: string }>>([]);
    const [wsConnected, setWsConnected] = useState(false);
    const [wsRetryCount, setWsRetryCount] = useState(0);
    const [showMap, setShowMap] = useState(false);
    const { currentUser } = useAuth();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [locationSuggestions, setLocationSuggestions] = useState<Location[]>([]);
    const [pendingLocationSearch, setPendingLocationSearch] = useState<string | null>(null);
    const [lastLocationAlternatives, setLastLocationAlternatives] = useState<Location[]>([]);
    const [isAITyping, setIsAITyping] = useState(false);
    
    // Enhanced error handling
    const { errorState, handleError, clearError } = useChatErrorHandler();
    
    // Simulate connection state for demo (in a real implementation, this would come from WebSocket)
    const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.CONNECTED);
    const [connectionMetrics, setConnectionMetrics] = useState({
        connectionAttempts: 1,
        totalReconnects: 0,
        averageLatency: 45,
        lastConnectedAt: new Date()
    });
    
    // Context menu state
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        message: Message | null;
    }>({ visible: false, x: 0, y: 0, message: null });

    const router = useRouter();
    const searchParams = useSearchParams();
    const bottomRef = useRef<HTMLDivElement>(null);
    const { signOut: authSignOut } = useAuth();
    const mapServiceRef = useRef<MapService | null>(null);
    const wsReconnectTimerRef = useRef<NodeJS.Timeout>();
    const initializationRef = useRef<boolean>(false);
    const MAX_WS_RETRIES = 3;

    // Memoize token to prevent unnecessary re-renders of RightMapPanel
    const currentUserToken = React.useMemo(() => {
        const token = currentUser?.token || getToken();
        console.log('🔑 Current token status:', token ? 'Present' : 'Missing');
        return token;
    }, [currentUser?.token]);

    // Initialize MapService only once when user token is available
    useEffect(() => {
        const token = currentUser?.token || getToken();
        if (!token) {

            return;
        }
        
        // Initialize MapService if not exists
        if (!mapServiceRef.current) {

            mapServiceRef.current = new MapService(token);
            
            // Set up WebSocket event listeners
            mapServiceRef.current.onConnect = () => {

                setWsConnected(true);
                setWsRetryCount(0);
                if (wsReconnectTimerRef.current) {
                    clearTimeout(wsReconnectTimerRef.current);
                }
            };

            mapServiceRef.current.onDisconnect = () => {

                setWsConnected(false);
                handleReconnection();
            };

            mapServiceRef.current.onError = (error) => {
                console.error("⚠️ WebSocket error:", error);
                toast.error("Connection error. Attempting to reconnect...");
                handleReconnection();
            };
        }

        // Handle WebSocket reconnection (moved outside to avoid closure issues)
        const handleReconnection = () => {
            setWsRetryCount(prev => {
                const newRetryCount = prev + 1;
                
                if (newRetryCount > MAX_WS_RETRIES) {
                    console.error("🚫 Max WebSocket retry attempts reached");
                    toast.error("Unable to establish connection. Please refresh the page.");
                    return prev;
                }

                if (wsReconnectTimerRef.current) {
                    clearTimeout(wsReconnectTimerRef.current);
                }

                wsReconnectTimerRef.current = setTimeout(() => {
                    if (currentSession?.sessionId) {

                        connectToSession(currentSession.sessionId);
                    }
                }, Math.min(1000 * (2 ** prev), 10000)); // Exponential backoff, max 10s
                
                return newRetryCount;
            });
        };

        // Handle session connection
        const connectToSession = async (sessionId: string) => {
            try {
                if (!mapServiceRef.current) {
                    return;
                }


                await mapServiceRef.current.connectWebSocket(sessionId);
            } catch (error) {
                console.error("❌ Error connecting to session:", error);
                toast.error("Failed to connect to session");
                handleReconnection();
            }
        };

        // Cleanup function
        return () => {
            if (mapServiceRef.current) {

                mapServiceRef.current.disconnect();
                mapServiceRef.current = null;
                setWsConnected(false);
            }
            if (wsReconnectTimerRef.current) {
                clearTimeout(wsReconnectTimerRef.current);
            }
        };
    }, [currentUser?.token]);

    // Separate effect for handling session connections
    useEffect(() => {
        if (!mapServiceRef.current || !currentSession?.sessionId || wsConnected) {
            return;
        }

        const connectToSession = async (sessionId: string) => {
            try {

                await mapServiceRef.current!.connectWebSocket(sessionId);
            } catch (error) {
                console.error("❌ Error connecting to session:", error);
                toast.error("Failed to connect to session");
            }
        };

        connectToSession(currentSession.sessionId);
    }, [currentSession?.sessionId, wsConnected]);

    // Dynamic persona-based prompts inspired by competitor analysis
    const defaultPrompts = [
        "✨ Plan my dream romantic getaway to Paris with hidden local gems",
        "🏝️ I need a family adventure in Tokyo - make it unforgettable!",
        "🌊 Show me Bali's most Instagram-worthy beaches and secret spots",
        "🍷 Which European city gives me the best weekend culture immersion?",
        "💰 Help me travel Europe like a local on a tight budget",
        "🍝 Create a foodie's paradise itinerary through Italy",
        "🎒 I want an off-the-beaten-path Southeast Asia adventure",
        "🏖️ Plan the perfect beach-hopping Caribbean escape"
    ];

    // Advanced persona-driven prompt categories (like Layla AI)
    const personaPrompts = {
        luxury: [
            "Plan my luxury escape to the Maldives with private experiences",
            "Design a high-end wine tour through Tuscany's finest vineyards",
            "Create an exclusive cultural journey through Japan's premium experiences"
        ],
        adventure: [
            "Plan my epic hiking adventure through Patagonia",
            "Design an adrenaline-packed New Zealand road trip",
            "Create a wild safari adventure across East Africa"
        ],
        romantic: [
            "Plan the most romantic proposal trip to Santorini",
            "Design a dreamy honeymoon in the French Riviera",
            "Create an intimate couples' retreat in Bali"
        ],
        family: [
            "Plan an educational family adventure through ancient Rome",
            "Design a fun-packed Disney World alternative in Europe",
            "Create a multi-generational family trip to Costa Rica"
        ],
        budget: [
            "Show me how to backpack Southeast Asia on $30/day",
            "Plan a budget-friendly European rail adventure",
            "Design a cost-effective Central America exploration"
        ]
    };

    // Generate dynamic prompts based on context
    const generateDynamicPrompts = (context: string | undefined) => {
        if (!context) {

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
            // Reset initialization state
            initializationRef.current = false;
            setIsInitialized(false);
            
            // Clear locations from backend for current session before starting new one
            const currentSessionId = sessionStorage.getItem("chatSessionId");
            if (currentSessionId && mapServiceRef.current) {
                try {

                    await mapServiceRef.current.clearLocations(currentSessionId);
                } catch (error) {

                    // Continue with new chat even if clearing fails
                }
            }

            // Disconnect from current session's WebSocket and clear map data safely
            if (mapServiceRef.current) {

                mapServiceRef.current.disconnect();
                // Safely clear markers (won't throw error if map not initialized)
                mapServiceRef.current.clearAllMarkers();
            }
            
            setCurrentSession(null);
            setMessages([]);
            setDisplayPrompts(true);
            setWsConnected(false);
            setWsRetryCount(0);
            
            // Clear session storage
            sessionStorage.removeItem("chatSessionId");
            sessionStorage.removeItem("sentMessage");
            sessionStorage.removeItem("initialMessage");
            
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
            
            // ✅ Apply JSON parsing to historical messages (same logic as new messages)
            const parsedMessages = messageArray.map(message => {
                if (message.messageType === 'ASSISTANT' && message.content) {
                    // Check if the message is actually a JSON string that needs parsing
                    if (message.content.trim().startsWith('{') && message.content.trim().endsWith('}')) {
                        try {
                            const parsedResponse = JSON.parse(message.content);
                            if (parsedResponse.message && typeof parsedResponse.message === 'string') {

                                return {
                                    ...message,
                                    content: parsedResponse.message
                                };
                            }
                        } catch (parseError) {

                            // Keep original message if parsing fails
                        }
                    }
                }
                return message;
            });
            
            setMessages(parsedMessages);
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
                console.log("🔄 No session found, creating new session for location operation...");
                const newSession = await createSession('New Chat');
                
                if (!newSession || !newSession.sessionId) {
                    throw new Error("Failed to create a new session for location operation");
                }
                
                setCurrentSession(newSession);
                
                // Initialize WebSocket connection for the new session
                if (mapServiceRef.current) {
                    mapServiceRef.current.connectWebSocket(newSession.sessionId);
                }
                
                console.log("✅ Created new session for location:", newSession.sessionId);
            }

            // Validate location data before sending
            if (!location.latitude || !location.longitude) {
                console.error("❌ Invalid location coordinates:", location);
                throw new Error("Location must have valid latitude and longitude coordinates");
            }

            if (!location.name || location.name.trim() === '') {
                console.error("❌ Invalid location name:", location);
                throw new Error("Location must have a valid name");
            }

            const locationToAdd = {
                latitude: Number(location.latitude),
                longitude: Number(location.longitude),
                name: location.name.trim(),
                type: location.type || 'attraction',
                sessionId: currentSession?.sessionId || sessionStorage.getItem("chatSessionId") || "default"
            };
            


            const addedLocation = await mapServiceRef.current.addLocation(locationToAdd);
            

            
            // Dispatch event for map update
            const event = new CustomEvent('newLocation', { 
                detail: addedLocation
            });
            window.dispatchEvent(event);

            
            return addedLocation;
        } catch (error) {
            console.error("❌ Error adding location:", error);
            console.error("❌ Location data:", location);
            console.error("❌ Current session:", currentSession);
            console.error("❌ Current user:", currentUser ? 'Available' : 'Not available');
            
            // Check if it's a validation error
            if (error instanceof Error && error.message && error.message.includes('invalid characters')) {

                throw new Error(`Location name "${location.name}" contains characters not supported by the server.`);
            }
            
            throw error;
        }
    };

    // Handler for when user selects a location from suggestions
    const handleLocationSelect = async (location: Location) => {

        
        try {
            // Add the selected location to the map
            await addLocationToMap(location);

            
            // Clear suggestions and continue with the original message
            setLocationSuggestions([]);
            const originalMessage = pendingLocationSearch;
            setPendingLocationSearch(null);
            
            if (originalMessage) {
                // Add the original user message to chat (since it was never added when suggestions were shown)
                setMessages((prev) => {
                    // Check if message already exists
                    if (prev.length > 0 && prev[prev.length - 1].content === originalMessage && prev[prev.length - 1].messageType === "USER") {

                        return prev;
                    }

                    return [...prev, { id: Date.now(), messageType: 'USER', content: originalMessage }];
                });
                

                // Create enhanced message for AI context
                const enhancedMessage = `I've added ${location.name} to the map. ${originalMessage}. Please provide detailed travel information about this place.`;
                
                // Continue processing with enhanced message
                await processChatMessage(enhancedMessage);
            } else {

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

        setLocationSuggestions([]);
        const originalMessage = pendingLocationSearch;
        setPendingLocationSearch(null);
        
        if (originalMessage) {
            // Add the original user message to chat (since it was never added when suggestions were shown)
            setMessages((prev) => {
                // Check if message already exists
                if (prev.length > 0 && prev[prev.length - 1].content === originalMessage && prev[prev.length - 1].messageType === "USER") {

                    return prev;
                }

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


            
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('API call timeout after 30 seconds')), 30000);
            });
            
            const response = await Promise.race([
                sendMessagesEntity(message, sessionId) as Promise<ApiResponse>,
                timeoutPromise
            ]) as ApiResponse;
            

    
            if (!response || typeof response.message !== "string") {
                console.error("Invalid response format:", response);
                throw new Error("Invalid response from API");
            }

            setMessages((prev) => [...prev, { 
                id: Date.now() + 1, 
                messageType: 'ASSISTANT', 
                content: response.message,
                timestamp: new Date() 
            }]);
            
        } catch (error) {
            console.error("❌ Error processing chat message:", error);
            toast.error('Failed to send message');
        }
    };

    const handleSendMessage = async (message: string) => {
        if (!message.trim()) return;
    
        setIsLoading(true);
        setIsAITyping(false);  // Clear any existing typing indicator
        clearError();          // Clear any previous errors
    
        try {
            // ✅ FIRST: Add user's original message to chat UI immediately
            setMessages((prev) => {
                // Prevent duplicate messages
                if (prev.length > 0 && prev[prev.length - 1].content === message && prev[prev.length - 1].messageType === "USER") {

                    return prev;
                }

                return [...prev, { id: Date.now(), messageType: 'USER', content: message, timestamp: new Date() }];
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
            



            // Extract and add locations from the message if it contains location keywords
            let locationsAdded = false;
            if (hasLocationKeyword && locationService.current) {

                try {
                    // First try to extract multiple locations (for AI responses with itineraries)
                    const multipleLocations = await locationService.current.extractMultipleLocationsFromMessage(message);

                    
                    if (multipleLocations && multipleLocations.length > 0 && currentSession?.sessionId) {

                        
                        // Add all locations to the map
                        for (const location of multipleLocations) {
                            await addLocationToMap(location);
                        }
                        locationsAdded = true;
                        setLastLocationAlternatives([]);
                        // Continue to AI processing instead of returning early
                    }
                    
                    // Fallback to single location extraction
                    const locationResult = await locationService.current.extractLocationFromMessage(message);

                    
                    if (locationResult.extractedLocation && currentSession?.sessionId) {
                        // Automatically use the most likely location (first result) instead of showing popup

                        await addLocationToMap(locationResult.extractedLocation);
                        locationsAdded = true;
                        
                        // Store alternative locations for AI context
                        if (locationResult.suggestedPlaces && locationResult.suggestedPlaces.length > 0) {
                            setLastLocationAlternatives(locationResult.suggestedPlaces);
                        } else {
                            setLastLocationAlternatives([]);
                        }
                    } else if (locationResult.error) {

                    } else {

                    }
                } catch (error) {
                    console.error("❌ Location extraction failed:", error);
                    // Continue with normal chat processing even if location extraction fails
                }
            } else {

            }
            
            // If locations were added, modify the message to provide context to the AI (internal only)
            let messageToSend = message;
            if (locationsAdded) {
                messageToSend = `${message}. Please provide detailed travel information about this place without adding it to the map again.`;
                
                // Add context about alternatives if they exist
                if (lastLocationAlternatives.length > 0) {
                    const alternativeNames = lastLocationAlternatives.slice(0, 3).map(loc => loc.name).join(', ');
                    messageToSend += ` [Context: I auto-selected the most likely location. If multiple locations were possible, mention alternatives like: ${alternativeNames}. Ask if they meant a different location if applicable.]`;
                }
                

            }


            let sessionId = currentSession?.sessionId;
    
            if (!sessionId) {

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




            
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('API call timeout after 30 seconds')), 30000);
            });
            
            // Show AI typing indicator
            setIsAITyping(true);

            const response = await Promise.race([
                sendMessagesEntity(messageToSend, sessionId) as Promise<ApiResponse>,
                timeoutPromise
            ]) as ApiResponse;
            
            // Clear typing indicator
            setIsAITyping(false);

    
            if (!response || typeof response.message !== "string") {
                console.error("Invalid response format:", response);
    
                setMessages((prev) => [...prev, {
                    id: Date.now() + 1,
                    messageType: 'ASSISTANT',
                    content: "Something went wrong. Please try again.",
                }]);
            } else {
                // ✅ Handle case where backend returns JSON string instead of parsed object
                let messageContent = response.message;
                let responseSuggestions = response.suggestions;
                
                // Check if the message is actually a JSON string that needs parsing
                if (response.message.trim().startsWith('{') && response.message.trim().endsWith('}')) {
                    try {
                        const parsedResponse = JSON.parse(response.message);
                        if (parsedResponse.message && typeof parsedResponse.message === 'string') {

                            messageContent = parsedResponse.message;
                            responseSuggestions = parsedResponse.suggestions || responseSuggestions;
                        }
                    } catch (parseError) {

                        // Keep original message if parsing fails
                    }
                }
                
                setMessages((prev) => [...prev, {
                    id: Date.now() + 1,
                    messageType: 'ASSISTANT',
                    content: messageContent,
                }]);

                // 🗺️ Extract locations from AI response (this is where multiple cities would be mentioned)
                if (locationService.current && messageContent && messageContent.length > 10) {
                    try {

                        
                        // First try to extract multiple locations (for AI responses with itineraries)
                        const aiMultipleLocations = await locationService.current.extractMultipleLocationsFromMessage(messageContent);
                        
                        if (aiMultipleLocations && aiMultipleLocations.length > 0) {

                            
                            // Add all locations found in the AI response
                            for (const location of aiMultipleLocations) {
                                try {
                                    await addLocationToMap(location);

                                } catch (locationError) {

                                }
                            }
                        } else {

                        }
                    } catch (error) {

                    }
                }

                // ✅ Update session title if this is the first conversation (check for first user message)
                
                // Check if this is the first message conversation AND the session still has "New Chat" title
                // Since we add user message first, then AI response, check for length === 2 (user + AI)
                if (messages.length === 2 && currentUser?.id && sessionId && currentSession?.title === 'New Chat') {
                    const newTitle = generateSessionTitle(message);

                    
                    try {

                        await updateSession(sessionId, newTitle, currentUser.id);
                        

                        setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null);
                        

                        await fetchChatHistory();
                        

                    } catch (error) {
                        console.error('❌ Failed to update session title:', error);
                        // Still update local state even if API call fails
                        setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null);
                    }
                }

                    // Check if the message might contain location data
                const locationKeywords = ['show', 'find', 'where', 'restaurant', 'place', 'location', 'near', 'at', 'in'];
                const hasLocationKeyword = locationKeywords.some(keyword => 
                    message.toLowerCase().includes(keyword)
                );

                if (hasLocationKeyword) {
                    // Add a small delay to allow the backend to process locations
                    setTimeout(async () => {
                        try {

                            const locations = await getLocationsBySession(sessionId);
                            
                            if (locations && locations.length > 0) {

                                toast.success(`Found ${locations.length} locations on the map`);
                            } else {

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
                }                
                // ✅ Update suggestions dynamically using parsed suggestions
                setSuggestions(responseSuggestions || generateDynamicPrompts(messageContent));
            }
    
            setDisplayPrompts(false);
        } catch (error: any) {
            // Use enhanced error handling
            const { errorMessage, errorType, canRetry } = handleError(error, 'sendMessage');
            
            setMessages((prev) => [...prev, {
                id: Date.now(),
                messageType: 'ASSISTANT',
                content: errorMessage,
            }]);

            // Show retry option if applicable  
            if (canRetry) {
                toast.error(`${errorMessage} You can try sending your message again.`, {
                    duration: 6000
                });
            } else {
                toast.error(errorMessage, { duration: 4000 });
            }
        } finally {
            setIsLoading(false);
            setInputMessage('');
            setIsAITyping(false);  // Ensure typing indicator is cleared
        }
    };
    
    
    
    
    const handlePromptClick = async (prompt: string) => {

        
        // Instead of navigating, directly send the message
        setInputMessage(prompt);
        await handleSendMessage(prompt);
    };

    // Handle suggestion clicks - convert suggestions to proper questions
    const handleSuggestionClick = async (suggestion: string) => {

        
        // Convert suggestion into a proper question
        let question = suggestion;
        
        // Transform common suggestion patterns into questions
        if (suggestion.toLowerCase().startsWith('ask about')) {
            question = suggestion.replace(/ask about/i, 'What can you tell me about') + '?';
        } else if (suggestion.toLowerCase().startsWith('inquire about')) {
            question = suggestion.replace(/inquire about/i, 'Can you provide information about') + '?';
        } else if (suggestion.toLowerCase().startsWith('request tips')) {
            question = suggestion.replace(/request tips/i, 'What tips do you have') + '?';
        } else if (suggestion.toLowerCase().startsWith('seek advice')) {
            question = suggestion.replace(/seek advice/i, 'What advice do you have') + '?';
        } else if (suggestion.toLowerCase().startsWith('explore')) {
            question = suggestion.replace(/explore/i, 'Tell me about') + '?';
        } else if (suggestion.toLowerCase().includes('suggestions')) {
            question = suggestion.replace(/suggestions/i, 'options') + '?';
        } else if (!suggestion.endsWith('?') && !suggestion.endsWith('.')) {
            // If it doesn't end with punctuation, make it a question
            question = suggestion + '?';
        }


        
        // Send the question directly without location extraction
        await handleSuggestionMessage(question);
    };

    // Simplified message handler for suggestions that bypasses location extraction
    const handleSuggestionMessage = async (question: string) => {
        if (!question.trim()) return;
    
        setIsLoading(true);
    
        try {
            // Add user's question to chat UI immediately
            setMessages((prev) => {
                // Prevent duplicate messages
                if (prev.length > 0 && prev[prev.length - 1].content === question && prev[prev.length - 1].messageType === "USER") {

                    return prev;
                }

                return [...prev, { id: Date.now(), messageType: 'USER', content: question }];
            });


            let sessionId = currentSession?.sessionId;
    
            if (!sessionId) {

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
    
            // Send question directly to backend without location enhancement

            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('API call timeout after 30 seconds')), 30000);
            });
            
            const response = await Promise.race([
                sendMessagesEntity(question, sessionId) as Promise<ApiResponse>,
                timeoutPromise
            ]) as ApiResponse;

    
            if (!response || typeof response.message !== "string") {
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
                    content: response.message,
                }]);

                // Set suggestions if available
                if (response.suggestions && Array.isArray(response.suggestions)) {
                    setSuggestions(response.suggestions);
                }
            }
        } catch (error) {
            console.error("❌ Error processing suggestion message:", error);
            
            setMessages((prev) => [...prev, {
                id: Date.now() + 1,
                messageType: 'ASSISTANT',
                content: "I apologize, but I encountered an error processing your question. Please try again.",
            }]);
            
            toast.error('Failed to send message');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Handle message click functionality
    const handleMessageClick = (message: Message) => {

        if (message.messageType === 'USER') {
            // For user messages, copy to input field for editing/re-sending

            setInputMessage(message.content);
            toast.success("Message copied to input field");
        } else {
            // For assistant messages, offer to continue the conversation

            const continuePrompt = `Continue from: "${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}"`;
            setInputMessage(continuePrompt);
            toast.success("Click send to continue this conversation");
        }
    };

    // Handle right-click context menu
    const handleContextMenu = (e: React.MouseEvent, message: Message) => {

        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            message
        });
    };

    // Context menu actions
    const handleCopyMessage = () => {
        if (contextMenu.message) {
            navigator.clipboard.writeText(contextMenu.message.content);
            toast.success("Message copied to clipboard");
        }
        setContextMenu({ visible: false, x: 0, y: 0, message: null });
    };

    const handleContinueConversation = () => {
        if (contextMenu.message) {
            handleMessageClick(contextMenu.message);
        }
        setContextMenu({ visible: false, x: 0, y: 0, message: null });
    };

    const handleEditMessage = () => {
        if (contextMenu.message) {
            setInputMessage(contextMenu.message.content);
            toast.success("Message loaded for editing");
        }
        setContextMenu({ visible: false, x: 0, y: 0, message: null });
    };

    // Hide context menu on outside click
    useEffect(() => {
        const handleClickOutside = () => {
            setContextMenu({ visible: false, x: 0, y: 0, message: null });
        };
        
        if (contextMenu.visible) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [contextMenu.visible]);
    
    
    const handleTranscription = (transcribedText: string) => {

        setInputMessage(transcribedText);
        handleSendMessage(transcribedText); // ✅ Auto-send
    };


    
    
    
    const fetchChatHistory = async () => {
        if (!currentUser?.id) {

            setChatHistory([]);
            return;
        }
    
        try {

            const sessions = await getUserSessions(currentUser.id);

            
            if (Array.isArray(sessions)) {
                setChatHistory(sessions);
            } else {

                setChatHistory([]);
            }
        } catch (error) {
            console.error('❌ Error fetching chat history:', error);
            setChatHistory([]);
            // Only show toast if it's not a network/auth issue
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (!errorMessage.includes('Network Error') && !errorMessage.includes('401')) {
                toast.error('Failed to load chat history');
            }
        }
    };
    
    useEffect(() => {
        
        if (currentUser?.id && messages.length > 0) {
            fetchChatHistory();
        }
    }, [messages, currentUser?.id]);
    

    const generateSessionTitle = (message: string) => {
        // Clean the message and remove emojis for better processing
        const cleanMessage = message.replace(/[^\w\s]/gi, ' ').replace(/\s+/g, ' ').trim();
        
        // Travel-specific keywords to prioritize in titles
        const travelKeywords = [
            'Tokyo', 'Paris', 'London', 'New York', 'Rome', 'Barcelona', 'Amsterdam', 'Berlin',
            'Bangkok', 'Singapore', 'Sydney', 'Dubai', 'Istanbul', 'Prague', 'Vienna',
            'trip', 'travel', 'vacation', 'holiday', 'adventure', 'getaway', 'journey',
            'itinerary', 'plan', 'visit', 'explore', 'discover', 'weekend', 'honeymoon',
            'family', 'solo', 'budget', 'luxury', 'backpack', 'romantic', 'cultural'
        ];

        const words = cleanMessage.split(' ');
        const importantWords: string[] = [];
        const regularWords: string[] = [];

        // Separate travel-related keywords from regular words
        words.forEach(word => {
            const lowerWord = word.toLowerCase();
            if (travelKeywords.some(keyword => keyword.toLowerCase() === lowerWord)) {
                importantWords.push(word);
            } else {
                regularWords.push(word);
            }
        });

        // Build title prioritizing travel keywords
        const prioritizedWords = [...importantWords, ...regularWords];
        
        let title = '';
        for (const word of prioritizedWords) {
            if ((title + word).length > 27) break;
            title += `${title ? ' ' : ''}${word}`;
        }

        // If the original message is short enough, use it as-is
        if (cleanMessage.length <= 30) {
            return cleanMessage;
        }

        return title ? `${title}...` : 'Travel Chat';
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
            // Prevent duplicate initialization 
            if (initializationRef.current || !currentUser || typeof window === 'undefined') {
                return;
            }
            
            initializationRef.current = true;

        
            let sessionId = searchParams.get("sessionId");
            if (typeof window !== 'undefined') {
                sessionId = sessionId || sessionStorage.getItem("chatSessionId");
            }
            const initialMessage = searchParams.get("initialMessage") || sessionStorage.getItem("initialMessage");
        


        
            if (!sessionId) {

                try {
                    const newSession = await createSession("New Chat");
        
                    if (newSession?.sessionId) {
                        sessionId = newSession.sessionId;
                        sessionStorage.setItem("chatSessionId", sessionId);
                        setCurrentSession({ sessionId, title: "New Chat" });

                    } else {
                        console.error("❌ Failed to create a session.");
                        initializationRef.current = false; // Reset on failure
                        return;
                    }
                } catch (error) {
                    console.error("❌ Error creating session:", error);
                    initializationRef.current = false; // Reset on failure
                    return;
                }
            } else {
                setCurrentSession({ sessionId, title: "New Chat" });

            }
        
            if (initialMessage) {

        
                try {
                    const decodedMessage = decodeURIComponent(initialMessage);
        
                    // ✅ Prevent duplicate processing but allow future messages
                    if (sessionStorage.getItem("sentMessage") === decodedMessage) {

                        sessionStorage.removeItem("sentMessage"); // Clear it after sending once
                        setIsInitialized(true);
                        return;
                    }
        
                    // ✅ Add to state (avoid duplicate messages)
                    setMessages((prev) => {
                        if (!prev.some((m) => m.content === decodedMessage)) {

                            return [
                                ...prev,
                                { id: Date.now(), messageType: "USER", content: decodedMessage }
                            ];
                        }
                        return prev;
                    });
        
                    // 🛑 Store in sessionStorage to avoid duplicates
                    sessionStorage.setItem("sentMessage", decodedMessage);
        
                    // ✅ Update session title for all users (including guests)
                    if (currentUser?.id && sessionId) {
                        const newTitle = generateSessionTitle(decodedMessage);

                        
                        try {

                            await updateSession(sessionId, newTitle, currentUser.id);
                            
                            // Update the current session title in local state immediately
                            setCurrentSession(prev => {

                                return prev ? { ...prev, title: newTitle } : null;
                            });
                            
                            // Refresh chat history to update the sidebar

                            await fetchChatHistory();

                        } catch (error) {
                            console.error('❌ Failed to update session title:', error);
                            // Still update local state even if API call fails
                            setCurrentSession(prev => {

                                return prev ? { ...prev, title: newTitle } : null;
                            });
                        }
                    } else {
                        console.warn('⚠️ Cannot update session title - missing requirements:', {
                            hasCurrentUser: !!currentUser,
                            hasUserId: !!currentUser?.id,
                            hasSessionId: !!sessionId
                        });
                    }
        
                    // ✅ Send message to backend only if not already sent
                    const response = await sendMessagesEntity(decodedMessage, sessionId!);
        
                    setMessages((prev) => {
                        if (!prev.some((m) => m.content === response.message)) {
                            return [
                                ...prev,
                                { id: Date.now() + 1, messageType: "ASSISTANT", content: response.message || "I couldn't process your request. Please try again." }
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
    }, [searchParams, currentUser]);
        
        
    
    
    
    
    
    


    return (
        <LoadScript
            googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
            libraries={libraries}
            onLoad={() => setIsGoogleMapsLoaded(true)}
        >
        <div className="flex h-screen bg-gray-100">
            {/* Mobile slide-out menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={toggleMobileMenu}
                        aria-hidden="true"
                    />
                    {/* drawer panel */}
                    <div className="absolute left-0 top-0 h-full w-72 max-w-[85%] bg-white shadow-2xl flex flex-col">
                        <div className="flex items-center justify-between px-3 py-3 border-b">
                            <span className="font-semibold">Menu</span>
                            <button
                                className="p-2 rounded hover:bg-gray-100"
                                onClick={toggleMobileMenu}
                                aria-label="Close menu"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* reuse your existing component inside the drawer */}
                        <div className="flex-1 overflow-y-auto">
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
                        </div>
                    </div>
                </div>
            )}

            {/* Left Menu Bar (desktop / tablet) */}
            <div className="hidden md:block">
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
            </div>
            {/* Middle Chat Section */}
            <div className="flex-[3.3] flex flex-col bg-white border-l border-r overflow-auto">

                {/* Mobile +Tablet header: menu + title + map button */}
                <div className="lg:hidden flex items-center justify-between px-3 py-3 border-b">
                    {/* Left: Menu + Chat title */}
                    <div className="flex items-center gap-2">
                        <button
                            className="p-2 rounded hover:bg-gray-100 md:hidden"
                            aria-label="Open menu"
                            onClick={toggleMobileMenu}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="font-semibold">Chat</div>
                    </div>

                    {/* Right: Map button */}
                    <button
                        onClick={() => { setShowMap(true); setIsMobileMenuOpen(false); }}
                        aria-label="Open map"
                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg shadow-md"
                    >
                        <Map className="w-5 h-5" />
                        <span className="text-sm">Map</span>
                    </button>
                </div>

                {/* Status indicators */}
                <div className="px-4 py-2 space-y-2">
                    {/* AI Typing Indicator */}
                    {isAITyping && (
                        <TypingIndicator 
                            isTyping={true}
                            user="AI Assistant"
                            className="text-xs"
                        />
                    )}
                    
                    {errorState.hasError && (
                        <ErrorMessage
                            message={errorState.errorMessage || 'An error occurred'}
                            type={errorState.errorType === 'network' ? 'warning' : 'error'}
                            canRetry={errorState.canRetry}
                            onRetry={() => {
                                clearError();
                                // Retry last message if applicable
                                if (messages.length > 0) {
                                    const lastUserMessage = [...messages].reverse().find(m => m.messageType === 'USER');
                                    if (lastUserMessage) {
                                        handleSendMessage(lastUserMessage.content);
                                    }
                                }
                            }}
                            onDismiss={clearError}
                            className="text-sm"
                        />
                    )}


                </div>

                {/* Beautiful Chat Container - Enhanced UI/UX */}
                <BeautifulChatContainer
                    messages={messages}
                    inputValue={inputMessage}
                    onInputChange={setInputMessage}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    suggestions={suggestions}
                    currentUser={currentUser}
                    showWelcome={displayPrompts && messages.length === 0}
                    onVoiceRecord={(audioBlob) => {
                        // Handle voice recording if needed

                    }}
                    onLocationRequest={() => {
                        // Handle location request if needed

                    }}
                />
            </div>

            {/* Right Map Panel (Desktop only)*/}
            <div className="hidden lg:block flex-[2.7] bg-white overflow-hidden p-4 h-full">
                <RightMapPanel
                    currentSessionId={currentSession?.sessionId || null}
                    currentUserToken={currentUser?.token || null}
                />

            </div>

            {/* Mobile Map Overlay */}
            {showMap && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowMap(false)}
                        aria-hidden="true"
                    />

                    {/* Panel: full-screen map (or you can use width like w-full md:w-80 if you prefer) */}
                    <div className="relative flex-1 bg-white">
                        {/* Header with close button */}
                        <div className="flex items-center justify-between px-3 py-2 border-b">
                            <div className="font-semibold">Map</div>
                            <button
                                onClick={() => setShowMap(false)}
                                aria-label="Close map"
                                className="p-2 rounded hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Map content */}
                        <div className="h-full overflow-auto">
                            <RightMapPanel
                                currentSessionId={currentSession?.sessionId || null}
                                currentUserToken={currentUser?.token || null}
                            />
                        </div>
                    </div>
                </div>
            )}

        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
            <div className="fixed inset-0 z-40 md:hidden">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/50"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                />

                {/* Sidebar */}
                <div className="relative w-64 h-full bg-white shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <div className="font-semibold">Menu</div>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            aria-label="Close menu"
                            className="p-2 rounded hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-0">
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
                    </div>
                </div>
            </div>
        )}
            
            {/* Location Suggestions Modal */}
            {locationSuggestions.length > 0 && pendingLocationSearch && (
                <LocationSuggestions
                    suggestions={locationSuggestions}
                    onLocationSelect={handleLocationSelect}
                    onDismiss={handleLocationSuggestionsDismiss}
                    searchTerm={pendingLocationSearch!}
                />
            )}

            {/* Context Menu */}
            {contextMenu.visible && (
                <div
                    className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-48"
                    style={{
                        left: `${contextMenu.x}px`,
                        top: `${contextMenu.y}px`,
                    }}
                >
                    <button
                        onClick={handleCopyMessage}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                    >
                        📋 Copy Message
                    </button>
                    {contextMenu.message?.messageType === 'USER' ? (
                        <button
                            onClick={handleEditMessage}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                        >
                            ✏️ Edit & Resend
                        </button>
                    ) : (
                        <button
                            onClick={handleContinueConversation}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                        >
                            ➡️ Continue Conversation
                        </button>
                    )}
                </div>
            )}
        </LoadScript>
    );
}
