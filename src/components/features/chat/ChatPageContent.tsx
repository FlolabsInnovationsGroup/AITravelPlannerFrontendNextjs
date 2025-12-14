'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendMessagesEntity, createSession, getUserSessions, getSessionMessages, updateSession, generateSessionTitle, getLocationsBySession, getToken, transcribeAudio, type SessionDTO } from '@/lib/api';
import { Send, Menu, Map, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LoadScript, LoadScriptProps } from '@react-google-maps/api';
import { Location } from '@/types/map';
import LeftMenuBar from '@/components/features/chat/LeftMenuBar';
import LocationSuggestions from '@/components/features/map/LocationSuggestions';
import dynamic from 'next/dynamic';
import { useChatErrorHandler, useMessageRetry } from '@/hooks/useMessageRetry';
import { 
  TypingIndicator, 
  ErrorMessage 
} from '@/components/ui/ChatUIComponents';
import { LocationExtractionService } from '@/services/LocationExtractionService';
import { MapService } from '@/services/MapService';
import BeautifulChatContainer from './BeautifulChatContainer';

// Code splitting for heavy map component (Performance Audit Implementation)
const RightMapPanel = dynamic(() => import('@/components/features/map/RightMapPanel'), {
  ssr: false, // Map components work better with client-side rendering
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
        <p className="mt-4 text-gray-600">Loading map...</p>
      </div>
    </div>
  )
});

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

// Define libraries outside component to prevent LoadScript from reloading on every render
const libraries: LoadScriptProps["libraries"] = ["places"];

export default function ChatPageContent() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // 🔒 FIX 2.3: Duplicate message prevention with request tracking
    const pendingRequestsRef = useRef<Set<string>>(new Set());
    const lastSentMessageRef = useRef<{ content: string; timestamp: number } | null>(null);
    
    // Debug: Log messages state changes
    useEffect(() => {
        console.log('📨 Messages state updated:', messages.length, 'messages');
        messages.forEach((msg, idx) => {
            console.log(`  ${idx + 1}. [${msg.messageType}]: ${msg.content.substring(0, 50)}...`);
        });
    }, [messages]);
    const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
    const [currentSession, setCurrentSession] = useState<{ sessionId: string; title: string } | null>(null);
    const [displayPrompts, setDisplayPrompts] = useState(true);
    const [showChatHistory, setShowChatHistory] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<SessionDTO[]>([]);
    const [hasMoreSessions, setHasMoreSessions] = useState(true);
    const [sessionPage, setSessionPage] = useState(0);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const { currentUser } = useAuth();
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [locationSuggestions, setLocationSuggestions] = useState<Location[]>([]);
    const [pendingLocationSearch, setPendingLocationSearch] = useState<string | null>(null);
    const [lastLocationAlternatives, setLastLocationAlternatives] = useState<Location[]>([]);
    const [isAITyping, setIsAITyping] = useState(false);
    
    // Enhanced error handling
    const { errorState, handleError, clearError } = useChatErrorHandler();
    
    // 🔒 FIX 2.4: Message retry functionality with queue
    const { retryMessage, retryState, cancelRetry } = useMessageRetry();
    const [failedMessages, setFailedMessages] = useState<Array<{ 
        id: number; 
        content: string; 
        timestamp: Date;
        error: string;
    }>>([]);
    
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

    // ==================== HELPER FUNCTIONS (defined before useEffects to avoid no-use-before-define) ====================
    
    // Handle session connection (must be before handleReconnection to avoid use-before-define)
    const connectToSession = async (sessionId: string) => {
        try {
            if (!mapServiceRef.current) {
                return;
            }

            await mapServiceRef.current.connectWebSocket(sessionId);
        } catch (error) {
            console.error("❌ Error connecting to session:", error);
            toast.error("Failed to connect to session");
            // Forward reference to handleReconnection (defined below) - both functions reference each other
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            handleReconnection();
        }
    };

    // Handle WebSocket reconnection (calls connectToSession defined above)
    const handleReconnection = () => {
        if (wsReconnectTimerRef.current) {
            clearTimeout(wsReconnectTimerRef.current);
        }

        wsReconnectTimerRef.current = setTimeout(() => {
            if (currentSession?.sessionId) {
                connectToSession(currentSession.sessionId);
            }
        }, 3000);
    };
    
    // ✅ Fetch chat history function with pagination support
    const fetchChatHistory = useCallback(async (page = 0, append = false) => {
        if (!currentUser?.id) {
            console.log('⚠️ Cannot fetch chat history: No user ID');
            setChatHistory([]);
            return;
        }
    
        if (isLoadingSessions) return; // Prevent concurrent requests
        
        try {
            setIsLoadingSessions(true);
            console.log(`📥 Fetching chat history for user: ${currentUser.id}, page: ${page}`);
            
            const pageSize = 20;
            const sessions = await getUserSessions(currentUser.id, {
                limit: pageSize,
                offset: page * pageSize,
                sortBy: 'createdAt',
                order: 'desc'
            });
            
            if (Array.isArray(sessions)) {
                console.log(`✅ Chat history fetched: ${sessions.length} sessions on page ${page}`);
                
                if (append) {
                    setChatHistory(prev => [...prev, ...sessions]);
                } else {
                    setChatHistory(sessions);
                }
                
                // If we got fewer sessions than pageSize, we've reached the end
                setHasMoreSessions(sessions.length === pageSize);
                setSessionPage(page);
            } else {
                console.warn('⚠️ getUserSessions did not return an array:', sessions);
                if (!append) setChatHistory([]);
            }
        } catch (error) {
            console.error('❌ Error fetching chat history:', error);
            if (!append) setChatHistory([]);
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (!errorMessage.includes('Network Error') && !errorMessage.includes('401')) {
                toast.error('Failed to load chat history');
            }
        } finally {
            setIsLoadingSessions(false);
        }
    }, [currentUser?.id, isLoadingSessions]);
    
    // Load more sessions for infinite scroll
    const loadMoreSessions = useCallback(() => {
        if (hasMoreSessions && !isLoadingSessions) {
            fetchChatHistory(sessionPage + 1, true);
        }
    }, [hasMoreSessions, isLoadingSessions, sessionPage, fetchChatHistory]);

    // Handle session deletion
    const handleSessionDeleted = useCallback((sessionId: string) => {
        setChatHistory(prev => prev.filter(s => s.sessionId !== sessionId));
        
        // If deleted session was current, clear it
        if (currentSession?.sessionId === sessionId) {
            setCurrentSession(null);
            setMessages([]);
            setDisplayPrompts(true);
        }
    }, [currentSession?.sessionId]);

    // Handle session rename
    const handleSessionRenamed = useCallback((sessionId: string, newTitle: string) => {
        setChatHistory(prev => prev.map(s => 
            s.sessionId === sessionId ? { ...s, title: newTitle, updatedAt: new Date().toISOString() } : s
        ));
        
        // Update current session title if it's the one being renamed
        if (currentSession?.sessionId === sessionId) {
            setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null);
        }
    }, [currentSession?.sessionId]);

    // Generate session title from message
    // 🔒 FIX 3.3: Validate and sanitize session titles
    const validateAndSanitizeTitle = (title: string): string => {
        if (!title || typeof title !== 'string') {
            return 'New Chat';
        }
        
        // Remove dangerous characters and scripts
        let sanitized = title
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<[^>]+>/g, '')
            .replace(/[<>"'`]/g, '')
            .trim();
        
        // Limit length to 100 characters
        if (sanitized.length > 100) {
            sanitized = sanitized.substring(0, 97) + '...';
        }
        
        // If empty after sanitization, use default
        return sanitized.length > 0 ? sanitized : 'New Chat';
    };
    
    /**
     * Fallback title generation using simple keyword extraction
     * Used when AI-powered backend title generation fails
     * @deprecated Use AI-powered generateSessionTitle() from api.ts instead
     */
    const generateSessionTitleFromMessage = (message: string) => {
        // 🔒 FIX 3.3: Validate input before processing
        if (!message || message.trim().length === 0) {
            return 'New Chat';
        }
        
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
            } else if (word.length > 3) { // Only include words longer than 3 characters
                regularWords.push(word);
            }
        });

        // Combine important words with regular words (up to 5 words total)
        const titleWords = [...importantWords, ...regularWords].slice(0, 5);
        
        // 🔒 FIX 3.3: Validate and sanitize the generated title
        const rawTitle = titleWords.length > 0 ? titleWords.join(' ') : cleanMessage.split(' ').slice(0, 5).join(' ');
        return validateAndSanitizeTitle(rawTitle || 'New Chat');
    };

    // Location service initialization (must be before processChatMessage)
    const locationService = useRef<LocationExtractionService | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && isGoogleMapsLoaded) {
            locationService.current = new LocationExtractionService();
        }
    }, [isGoogleMapsLoaded]);

    // Helper function to add location to map (must be before processChatMessage)
    const addLocationToMap = async (location: Location) => {
        try {
            if (!mapServiceRef.current) {
                console.error("MapService not initialized");
                throw new Error("MapService not initialized");
            }

            // ✅ FIX: Session must exist before adding locations
            // Don't create new sessions here - this was causing duplicate session spam
            if (!currentSession?.sessionId) {
                const errorMsg = "❌ Cannot add location: No active session. Please start a new chat first.";
                console.error(errorMsg);
                throw new Error(errorMsg);
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
                // Sanitize name to prevent backend validation errors
                name: location.name.trim().replace(/[\u0000-\u001F\u007F-\u009F]/g, ''),
                type: location.type || 'attraction',
                sessionId: currentSession?.sessionId || sessionStorage.getItem("chatSessionId") || "default"
            };
            


            const addedLocation = await mapServiceRef.current.addLocation(locationToAdd);
            

            
            // Dispatch event for map update
            if (typeof window !== 'undefined') {
                const event = new CustomEvent('newLocation', { 
                    detail: addedLocation
                });
                window.dispatchEvent(event);
            }

            
            return addedLocation;
        } catch (error) {
            // Silently handle location addition errors for better UX
            // The AI response will still show successfully even if map markers fail
            if (process.env.NODE_ENV === 'development') {
                console.warn("⚠️ Could not add location to map:", location.name, error);
            }
            // Check if it's a validation error
            if (error instanceof Error && error.message && error.message.includes('invalid characters')) {

                throw new Error(`Location name "${location.name}" contains characters not supported by the server.`);
            }
            
            throw error;
        }
    };

    // Process chat message (separate function to avoid duplication)
    const processChatMessage = async (message: string) => {
        try {
            // ✅ FIX: Session should already exist from handleNewChat
            // If it doesn't exist (edge case), create it now
            let sessionId = currentSession?.sessionId;
    
            if (!sessionId) {
                console.warn('⚠️ processChatMessage: No session found - creating one now');
                const newSession = await createSession('New Chat');
    
                if (!newSession || !newSession.sessionId) {
                    throw new Error("Failed to create a new session.");
                }
    
                sessionId = newSession.sessionId;
                setCurrentSession({ 
                    sessionId: newSession.sessionId, 
                    title: newSession.title || 'New Chat' 
                });
                if (mapServiceRef.current && newSession.sessionId) {
                    await mapServiceRef.current.connectWebSocket(newSession.sessionId);
                }
                sessionStorage.setItem("chatSessionId", sessionId);
            }
    
            const sessionIdToUse = sessionId;
            
            clearError();
            setIsLoading(true);
            setIsAITyping(true);
            
            // ✅ CRITICAL FIX: Get the ACTUAL message count (user message was already added)
            // Since React state updates are async, we count from current state + 1 for the user message that was just added
            const messageCountBeforeResponse = messages.length + 1; // +1 for the user message just added
            console.log('📊 Message count before AI response (including user message):', messageCountBeforeResponse);
    
            const response = await sendMessagesEntity(message, sessionIdToUse);
    
            let aiResponse = '';
            
            if (typeof response === 'string') {
                try {
                    const parsedResponse = JSON.parse(response);
                    if (parsedResponse.message && typeof parsedResponse.message === 'string') {
                        aiResponse = parsedResponse.message;
                    } else {
                        aiResponse = response;
                    }
                } catch {
                    aiResponse = response;
                }
            } else if (response && typeof response === 'object' && 'message' in response) {
                aiResponse = (response as ApiResponse).message;
                
                if ((response as ApiResponse).suggestions) {
                    setSuggestions((response as ApiResponse).suggestions || []);
                }
            } else {
                aiResponse = "I received your message but couldn't process the response properly.";
            }
    
            if (aiResponse) {
                setMessages(prev => [...prev, { 
                    id: Date.now(), 
                    messageType: 'ASSISTANT', 
                    content: aiResponse 
                }]);
                setDisplayPrompts(false);
                
                // Location extraction is now handled automatically by the backend
                // via autoLocationExtractionFunction for tour/itinerary requests
                // Locations will be added via WebSocket updates from the backend

                // Update session title if this is the first conversation
                // ✅ FIX: Use captured message count from BEFORE API call
                console.log('🔍 Title update check:', {
                    messageCountBeforeResponse,
                    hasUserId: !!currentUser?.id,
                    userId: currentUser?.id,
                    hasSessionId: !!sessionIdToUse,
                    sessionId: sessionIdToUse,
                    currentTitle: currentSession?.title,
                    isNewChat: currentSession?.title === 'New Chat',
                    isEmpty: !currentSession?.title || currentSession.title.trim() === ''
                });
                
                console.log('🧮 Condition breakdown:', {
                    'messageCountBeforeResponse === 1': messageCountBeforeResponse === 1,
                    'currentUser?.id exists': !!currentUser?.id,
                    'sessionIdToUse exists': !!sessionIdToUse,
                    'title check': !currentSession?.title || currentSession.title === 'New Chat' || currentSession.title.trim() === ''
                });
                
                const shouldUpdateTitle = messageCountBeforeResponse === 1 && 
                                        currentUser?.id && 
                                        sessionIdToUse && 
                                        (!currentSession?.title || currentSession.title === 'New Chat' || currentSession.title.trim() === '');
                
                console.log('🎯 Should update title:', shouldUpdateTitle);
                
                if (shouldUpdateTitle) {
                    console.log(`📝 Generating AI-powered title for session "${currentSession?.title}"`);
                    
                    try {
                        // Use AI-powered title generation from backend
                        const newTitle = await generateSessionTitle(sessionIdToUse);
                        console.log(`✅ AI-generated title: "${newTitle}"`);
                        
                        // Update local state with new title
                        setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null);
                        
                        // ✅ FIX: Force refresh chat history to show new title in sidebar
                        console.log('🔄 Refreshing chat history to update sidebar title');
                        await fetchChatHistory(0, false);
                    } catch (error) {
                        console.error('❌ Failed to generate AI title:', error);
                        // Fallback to simple title generation from message
                        const fallbackTitle = generateSessionTitleFromMessage(message);
                        console.log(`⚠️ Using fallback title: "${fallbackTitle}"`);
                        
                        try {
                            await updateSession(sessionIdToUse, fallbackTitle, currentUser.id);
                            setCurrentSession(prev => prev ? { ...prev, title: fallbackTitle } : null);
                            await fetchChatHistory(0, false);
                        } catch (fallbackError) {
                            console.error('❌ Fallback title update also failed:', fallbackError);
                            // Still update local state even if API call fails
                            setCurrentSession(prev => prev ? { ...prev, title: fallbackTitle } : null);
                        }
                    }
                }
            }
        } catch (error: any) {
            console.error("❌ Error processing chat message:", error);
            
            if (error.response?.status === 401) {
                toast.error('Session expired. Please sign in again.');
                authSignOut();
                return;
            }
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            setMessages(prev => [...prev, { 
                id: Date.now(), 
                messageType: 'ASSISTANT', 
                content: `❌ Error: ${errorMessage}` 
            }]);
        } finally {
            setIsLoading(false);
            setIsAITyping(false);
        }
    };

    // ==================== END HELPER FUNCTIONS ====================

    // Initialize MapService only once when user token is available
    useEffect(() => {
        const token = currentUser?.token || getToken();
        if (!token) {

            return undefined;
        }
        
        // Initialize MapService if not exists - use singleton pattern
        if (!mapServiceRef.current) {

            mapServiceRef.current = MapService.getInstance(token);
            
            // Set up WebSocket event listeners
            mapServiceRef.current.onConnect = () => {

                setWsConnected(true);
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

    // Advanced persona-driven prompt categories removed - not used in current implementation

    // Generate dynamic prompts based on context
    const generateDynamicPrompts = (context: string | undefined) => {
        if (!context) {

            return defaultPrompts.slice(0, 4); // Return default prompts instead of crashing
        }
    
        const lowerCaseContext = context.toLowerCase(); // Ensure case-insensitive search
    
        if (lowerCaseContext.includes("flight")) {
            return ["Book a flight", "Check flight prices", "View flight schedules", "Explore airline options"];
        } if (lowerCaseContext.includes("hotel")) {
            return ["Find nearby hotels", "Check hotel reviews", "View hotel deals", "Explore amenities"];
        } if (lowerCaseContext.includes("beach")) {
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
            // ✅ FIX: Set flag to prevent initializeChat from running during navigation
            sessionStorage.setItem("newChatCreating", "true");
            
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
            
            // ✅ FIX: Create session IMMEDIATELY when "New Chat" is clicked
            // This prevents duplicate session creation when AI extracts locations
            console.log('📝 Creating new session immediately...');
            const newSession = await createSession('New Chat');
            
            if (!newSession || !newSession.sessionId) {
                throw new Error("Failed to create new session");
            }
            
            console.log('✅ New session created:', newSession.sessionId);
            setCurrentSession({ 
                sessionId: newSession.sessionId, 
                title: newSession.title || 'New Chat' 
            });
            
            // ✅ CRITICAL FIX: Save session to storage BEFORE router.push
            // This prevents initializeChat() from creating ANOTHER session on re-render
            sessionStorage.setItem("chatSessionId", newSession.sessionId);
            
            // Connect WebSocket to new session
            if (mapServiceRef.current) {
                await mapServiceRef.current.connectWebSocket(newSession.sessionId);
            }
            
            setMessages([]);
            setDisplayPrompts(true);
            setWsConnected(false);
            
            // Clear only the temporary message storage
            sessionStorage.removeItem("sentMessage");
            sessionStorage.removeItem("initialMessage");
            
            router.push('/chat');
            setIsMobileMenuOpen(false);
            
            // ✅ FIX: Refresh chat history after creating new session
            console.log('🔄 Refreshing chat history after new chat creation');
            await fetchChatHistory();
            
            // ✅ FIX: Clear the flag after navigation completes
            setTimeout(() => {
                sessionStorage.removeItem("newChatCreating");
            }, 1000);
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
    
    // 🔒 FIX 3.4: Track active session load to prevent race conditions
    const activeSessionLoadRef = useRef<AbortController | null>(null);
    
    const handleSessionClick = async (session: SessionDTO) => {
        try {
            // Validate session has required fields
            if (!session.sessionId) {
                console.error('❌ Cannot load session: sessionId is undefined');
                return;
            }
            
            // 🔒 FIX 3.4: Cancel any in-flight session load requests
            if (activeSessionLoadRef.current) {
                activeSessionLoadRef.current.abort();
                console.log('⚠️ Cancelled previous session load');
            }
            
            // Create new abort controller for this request
            const abortController = new AbortController();
            activeSessionLoadRef.current = abortController;
            
            const targetSessionId = session.sessionId;
            setCurrentSession({ sessionId: session.sessionId, title: session.title || 'Untitled Session' });
            
            // ✅ Update sessionStorage to maintain session consistency
            sessionStorage.setItem("chatSessionId", targetSessionId);
            console.log('✅ Updated sessionStorage with new sessionId:', targetSessionId);
            
            const sessionMessages = await getSessionMessages(session.sessionId);
            
            // 🔒 FIX 3.4: Verify we're still loading the same session (not switched mid-load)
            if (abortController.signal.aborted) {
                console.log('⚠️ Session load aborted - user switched sessions');
                return;
            }
            
            // Double-check session ID matches current session
            if (targetSessionId !== session.sessionId) {
                console.warn('⚠️ Session mismatch - discarding stale data');
                return;
            }
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
            
            // 🔒 FIX 3.4: Final check before applying state changes
            if (!abortController.signal.aborted) {
                setMessages(parsedMessages);
                setDisplayPrompts(false);
                setShowChatHistory(false);
                setIsMobileMenuOpen(false);
                
                // ✅ CRITICAL: Reconnect WebSocket to new session and load locations
                if (mapServiceRef.current && targetSessionId) {
                    console.log('🔄 Reconnecting WebSocket to session:', targetSessionId);
                    await mapServiceRef.current.disconnect();
                    await mapServiceRef.current.connectWebSocket(targetSessionId);
                    
                    // ✅ Load locations for this session from database
                    try {
                        console.log('📍 Loading locations for session:', targetSessionId);
                        const sessionLocations = await mapServiceRef.current.getLocations(targetSessionId);
                        console.log(`✅ Loaded ${sessionLocations?.length || 0} locations for session`);
                        
                        // Clear existing markers and add new ones
                        mapServiceRef.current.clearAllMarkers();
                        if (sessionLocations && sessionLocations.length > 0 && typeof window !== 'undefined') {
                            sessionLocations.forEach(location => {
                                window.dispatchEvent(new CustomEvent('newLocation', { detail: location }));
                            });
                        }
                    } catch (locationError) {
                        console.error('❌ Failed to load session locations:', locationError);
                    }
                }
                
                await fetchChatHistory();
                
                // Clear the active load ref since we completed successfully
                activeSessionLoadRef.current = null;
            }
        } catch (error: any) {
            // 🔒 FIX 3.4: Don't show error if request was intentionally aborted
            if (error.name === 'AbortError' || error.message?.includes('aborted')) {
                console.log('Session load cancelled by user');
                return;
            }
            
            console.error('Error loading session messages:', error);
            toast.error('Failed to load chat messages');
            activeSessionLoadRef.current = null;
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

    const handleSendMessage = async (message: string) => {
        if (!message.trim()) return;
        
        // 🔒 FIX 2.3: Enhanced duplicate prevention
        const messageHash = `${message.trim()}-${currentSession?.sessionId || 'no-session'}`;
        
        // Check if request is already in flight
        if (pendingRequestsRef.current.has(messageHash)) {
            console.warn('⚠️ Duplicate request prevented - message already being sent');
            return;
        }
        
        // Check if same message sent within last 2 seconds (prevents accidental double-clicks)
        const now = Date.now();
        if (lastSentMessageRef.current && 
            lastSentMessageRef.current.content === message.trim() &&
            now - lastSentMessageRef.current.timestamp < 2000) {
            console.warn('⚠️ Duplicate prevented - same message sent <2s ago');
            return;
        }
    
        setIsLoading(true);
        setIsAITyping(false);  // Clear any existing typing indicator
        clearError();          // Clear any previous errors
        
        // Track this request
        pendingRequestsRef.current.add(messageHash);
        lastSentMessageRef.current = { content: message.trim(), timestamp: now };
    
        try {
            // ✅ CRITICAL: Capture message count BEFORE adding user message
            // This is used later for title generation detection
            const messageCountBeforeSending = messages.length;
            
            // ✅ FIRST: Add user's original message to chat UI immediately
            setMessages((prev) => {
                // Double-check for duplicate in UI (belt and suspenders approach)
                const isDuplicate = prev.some(
                    msg => msg.content === message && 
                    msg.messageType === 'USER' && 
                    now - (msg.timestamp?.getTime() || 0) < 2000
                );
                
                if (isDuplicate) {
                    return prev;
                }

                return [...prev, { id: Date.now(), messageType: 'USER', content: message, timestamp: new Date() }];
            });

            // Check if the message mentions locations - expanded for travel terms
            const locationKeywords = [
                'show', 'find', 'where', 'restaurant', 'place', 'location', 'near', 'at', 'in', 'visit',
                'attractions', 'attraction', 'sights', 'things to do', 'destinations', 'travel',
                'hotel', 'hotels', 'cafe', 'cafes', 'museum', 'museums', 'park', 'parks',
                'best', 'top', 'popular', 'famous', 'must-see', 'recommended', 'guide',
                'paris', 'london', 'tokyo', 'new york', 'rome', 'barcelona', 'amsterdam' // common cities
            ];
            const hasLocationKeyword = locationKeywords.some(keyword => 
                message.toLowerCase().includes(keyword)
            );
            
            // Tour/itinerary requests should be handled by backend AI with addLocationFunction
            const tourKeywords = ['tour', 'itinerary', 'plan', 'trip', 'journey', 'route', 'multi', 'cities'];
            const isTourRequest = tourKeywords.some(keyword => message.toLowerCase().includes(keyword));
            



            // FRONTEND LOCATION EXTRACTION DISABLED
            // All location extraction is now handled by backend AI's AutoLocationExtractionFunction
            // which provides proper geographic filtering and validation
            //
            // Previous frontend location extraction code has been removed - the backend AI now:
            // 1. Extracts locations from chat messages using Spring AI
            // 2. Enriches with Google Places API data (photos, ratings, hours, contact info)
            // 3. Applies geographic filtering to prevent wrong locations (e.g., Paris for Southeast Asia queries)
            // 4. Broadcasts location updates via WebSocket to sync with map in real-time
            //
            // This ensures consistent location data with proper validation and contextual relevance.
            
            // Message is sent directly to AI without frontend preprocessing
            const messageToSend = message;


            // ✅ FIX: Session should already exist from handleNewChat
            // If it doesn't exist (edge case), create it now
            let sessionId = currentSession?.sessionId;
    
            if (!sessionId) {
                console.warn('⚠️ No session found when sending message - creating one now');
                const newSession = await createSession('New Chat');
    
                if (!newSession || !newSession.sessionId) {
                    throw new Error("Failed to create a new session.");
                }
    
                sessionId = newSession.sessionId;
                setCurrentSession({ 
                    sessionId: newSession.sessionId, 
                    title: newSession.title || 'New Chat' 
                });
                // Ensure WebSocket is connected after setting new session
                if (mapServiceRef.current && newSession.sessionId) {
                    await mapServiceRef.current.connectWebSocket(newSession.sessionId);
                }
            }
    
            // 🔒 FIX 2.4: Wrap API call in retry mechanism
            // Show AI typing indicator
            setIsAITyping(true);
            
            const response = await retryMessage(async () => {
                // Add timeout to prevent hanging (90 seconds for AI processing)
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('API call timeout after 90 seconds')), 90000);
                });

                return await Promise.race([
                    sendMessagesEntity(messageToSend, sessionId) as Promise<ApiResponse>,
                    timeoutPromise
                ]) as ApiResponse;
            }, {
                maxAttempts: 3,
                baseDelay: 2000,
                retryCondition: (error) => {
                    // Retry on network errors, timeouts, and 5xx server errors
                    return error.message?.includes('timeout') ||
                           error.message?.includes('Network Error') ||
                           (error.response?.status >= 500 && error.response?.status < 600);
                }
            });
            
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
                            await Promise.all(
                                aiMultipleLocations.map(async (location) => {
                                    try {
                                        await addLocationToMap(location);
                                    } catch (locationError) {
                                        // TODO: Handle location addition errors gracefully
                                        console.error("Failed to add location to map:", locationError);
                                    }
                                })
                            );
                        } else {
                            // TODO: Handle case when location lacks required coordinates
                        }
                    } catch (error) {
                        // TODO: Implement comprehensive error handling for location processing
                        console.error("Location processing error:", error);
                    }
                }

                // ✅ Update session title if this is the first conversation (check for first user message)
                
                // Check if this is the first message conversation AND the session still has "New Chat" title
                // CRITICAL: We use messageCountBeforeSending (captured before adding user message)
                // because messages.length may be 0 here due to React's async state updates
                const shouldUpdateTitle = messageCountBeforeSending === 0 && 
                                        currentUser?.id && 
                                        sessionId && 
                                        (!currentSession?.title || currentSession.title === 'New Chat' || currentSession.title.trim() === '');
                
                console.log('🔍 Title update check:', { 
                    messageCountBeforeSending: messageCountBeforeSending,
                    currentMessagesLength: messages.length,
                    hasUser: !!currentUser?.id, 
                    hasSessionId: !!sessionId, 
                    currentTitle: currentSession?.title,
                    shouldUpdate: shouldUpdateTitle
                });
                
                if (shouldUpdateTitle) {
                    try {
                        // Call backend AI to generate title from session conversation
                        console.log(`🤖 Generating AI title for session: ${sessionId}`);
                        const newTitle = await generateSessionTitle(sessionId);
                        console.log(`📝 AI generated title: "${newTitle}"`);
                        
                        await updateSession(sessionId, newTitle, currentUser.id);
                        console.log('✅ Session title updated successfully in database');

                        setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null);
                        
                        // ✅ CRITICAL: Force refresh chat history with page reset to show new title in sidebar
                        console.log('🔄 Forcing chat history refresh after title update');
                        await fetchChatHistory(0, false); // Explicitly fetch page 0, don't append

                    } catch (error) {
                        console.warn('⚠️ Backend title generation failed, using fallback:', error);
                        
                        // Fallback: Use local title generation from message content
                        const fallbackTitle = generateSessionTitleFromMessage(message);
                        console.log(`📝 Using fallback title: "${fallbackTitle}"`);
                        
                        try {
                            await updateSession(sessionId, fallbackTitle, currentUser.id);
                            setCurrentSession(prev => prev ? { ...prev, title: fallbackTitle } : null);
                            await fetchChatHistory(0, false);
                        } catch (fallbackError) {
                            console.error('❌ Even fallback title update failed:', fallbackError);
                            // Update local state only
                            setCurrentSession(prev => prev ? { ...prev, title: fallbackTitle } : null);
                        }
                    }
                }

                    // Check if the message might contain location data
                const innerLocationKeywords = ['show', 'find', 'where', 'restaurant', 'place', 'location', 'near', 'at', 'in'];
                const hasInnerLocationKeyword = innerLocationKeywords.some(keyword => 
                    message.toLowerCase().includes(keyword)
                );

                if (hasInnerLocationKeyword) {
                    // Add a small delay to allow the backend to process locations
                    setTimeout(async () => {
                        try {

                            const locations = await getLocationsBySession(sessionId);
                            
                            if (locations && locations.length > 0) {

                                toast.success(`Found ${locations.length} locations on the map`);
                            } else if (message.toLowerCase().includes('restaurant') || 
                                message.toLowerCase().includes('place') ||
                                message.toLowerCase().includes('where is')) {
                                // Only show the message if it's likely we should have found locations
                                toast('No specific locations found for this request. Try being more specific with the location.', {
                                    icon: '🗺️',
                                    duration: 4000
                                });
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
            // 🔒 FIX 2.4: Track failed messages for manual retry
            const failedMessage = {
                id: Date.now(),
                content: message,
                timestamp: new Date(),
                error: error.message || 'Unknown error'
            };
            setFailedMessages(prev => [...prev, failedMessage]);
            
            // Use enhanced error handling
            const { errorMessage, canRetry } = handleError(error, 'sendMessage');
            
            setMessages((prev) => [...prev, {
                id: Date.now(),
                messageType: 'ASSISTANT',
                content: `❌ ${errorMessage}${canRetry ? '\n\n💡 You can retry sending this message.' : ''}`,
            }]);

            // Show retry option if applicable  
            if (canRetry) {
                toast.error(`${errorMessage} You can try sending your message again.`, {
                    duration: 6000,
                    action: {
                        label: 'Retry',
                        onClick: () => handleRetryFailedMessage(failedMessage.id)
                    }
                } as any);
            } else {
                toast.error(errorMessage, { duration: 4000 });
            }
        } finally {
            // 🔒 FIX 2.3: Cleanup pending request tracking
            const messageHash = `${message.trim()}-${currentSession?.sessionId || 'no-session'}`;
            pendingRequestsRef.current.delete(messageHash);
            
            setIsLoading(false);
            setInputMessage('');
            setIsAITyping(false);  // Ensure typing indicator is cleared
        }
    };
    
    // 🔒 FIX 2.4: Retry handler for failed messages
    const handleRetryFailedMessage = async (messageId: number) => {
        const failedMessage = failedMessages.find(m => m.id === messageId);
        if (!failedMessage) {
            toast.error('Failed message not found');
            return;
        }
        
        // Remove from failed queue
        setFailedMessages(prev => prev.filter(m => m.id !== messageId));
        
        // Retry sending the message
        await handleSendMessage(failedMessage.content);
    };
    
    
    
    
    // handlePromptClick removed - BeautifulChatContainer handles prompt clicks internally
    // handleSuggestionClick removed - ModernChatInput handles suggestions internally
    // handleSuggestionMessage removed - was only used by handleSuggestionClick
    
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

    // Context menu functionality removed - not currently implemented in UI

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
        return undefined;
    }, [contextMenu.visible]);
    
    
    const handleTranscription = (transcribedText: string) => {

        setInputMessage(transcribedText);
        handleSendMessage(transcribedText); // ✅ Auto-send
    };

    // ✅ FIX: Fetch chat history on component mount when user is authenticated
    useEffect(() => {
        if (currentUser?.id) {
            console.log('🔄 Fetching initial chat history for user:', currentUser.id);
            fetchChatHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.id]); // Only re-run when user ID changes

    // Markdown components removed - EnhancedChatBubbles handles message rendering with its own markdown styling

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
            console.log('🔵 initializeChat called', {
                initializationRef: initializationRef.current,
                hasWindow: typeof window !== 'undefined',
                currentUser: currentUser?.id
            });

            // ✅ FIX: Don't initialize if we're in the middle of creating a new chat
            if (typeof window !== 'undefined' && sessionStorage.getItem("newChatCreating") === "true") {
                console.log('🛑 Skipping initializeChat - new chat is being created');
                return;
            }

            // Prevent duplicate initialization 
            // Note: Allow execution even without currentUser to support guest users
            if (initializationRef.current || typeof window === 'undefined') {
                console.log('🛑 Returning early from initializeChat');
                return;
            }
            
            initializationRef.current = true;

        
            let sessionId = searchParams.get("sessionId");
            if (typeof window !== 'undefined') {
                sessionId = sessionId || sessionStorage.getItem("chatSessionId");
            }
            const initialMessage = searchParams.get("initialMessage") || sessionStorage.getItem("initialMessage");
        
            console.log('🔵 Chat initialization params:', {
                sessionIdFromUrl: searchParams.get("sessionId"),
                sessionIdFromStorage: sessionStorage.getItem("chatSessionId"),
                finalSessionId: sessionId,
                initialMessageFromUrl: searchParams.get("initialMessage"),
                initialMessageFromStorage: sessionStorage.getItem("initialMessage"),
                finalInitialMessage: initialMessage
            });


        
            if (!sessionId) {
                console.log('🔵 No sessionId found, creating new session...');

                try {
                    const newSession = await createSession("New Chat");
                    console.log('🔵 New session created:', newSession);
        
                    // Backend returns sessionId field
                    if (newSession?.sessionId) {
                        sessionId = newSession.sessionId;
                        sessionStorage.setItem("chatSessionId", sessionId);
                        setCurrentSession({ sessionId, title: "New Chat" });
                        console.log('✅ Session set:', sessionId);

                    } else {
                        console.error("❌ Failed to create a session - no sessionId returned:", newSession);
                        initializationRef.current = false; // Reset on failure
                        return;
                    }
                } catch (error) {
                    console.error("❌ Error creating session:", error);
                    initializationRef.current = false; // Reset on failure
                    return;
                }
            } else {
                console.log('✅ Using existing sessionId:', sessionId);
                setCurrentSession({ sessionId, title: "New Chat" });

            }
        
            if (initialMessage) {
                console.log('🔵 Processing initial message:', initialMessage);

        
                try {
                    const decodedMessage = decodeURIComponent(initialMessage);
                    const storedMessage = sessionStorage.getItem("sentMessage");
                    
                    console.log('🔵 Duplicate check:', {
                        decodedMessage,
                        storedMessage,
                        isMatch: storedMessage === decodedMessage
                    });
        
                    // ✅ Prevent duplicate processing but allow future messages
                    if (storedMessage === decodedMessage) {
                        console.log('⚠️ Message already sent, skipping');
                        sessionStorage.removeItem("sentMessage"); // Clear it after sending once
                        return;
                    }
        
                    // ✅ Add to state (avoid duplicate messages)
                    console.log('🔵 Adding message to state');
                    setMessages((prev) => {
                        console.log('  Current messages in state:', prev.length);
                        if (!prev.some((m) => m.content === decodedMessage)) {
                            console.log('✅ Message added to state');
                            const newMessages = [
                                ...prev,
                                { id: Date.now(), messageType: "USER" as const, content: decodedMessage }
                            ];
                            console.log('  New messages count:', newMessages.length);
                            return newMessages;
                        }
                        console.log('⚠️ Message already exists in state');
                        return prev;
                    });
        
                    // 🛑 Store in sessionStorage to avoid duplicates
                    sessionStorage.setItem("sentMessage", decodedMessage);
                    console.log('🔵 Message stored in sessionStorage');
        
                    // ✅ Update session title for all users (including guests) if it's still "New Chat"
                    const shouldUpdateTitle = currentUser?.id && 
                                            sessionId && 
                                            (!currentSession?.title || currentSession.title === 'New Chat' || currentSession.title.trim() === '');
                    
                    if (shouldUpdateTitle && currentUser?.id) {
                        console.log('🔵 Updating session title for authenticated user');
                        const newTitle = await generateSessionTitle(decodedMessage);

                        
                        try {

                            await updateSession(sessionId, newTitle, currentUser.id);
                            
                            // Update the current session title in local state immediately
                            setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null);
                            
                            // Refresh chat history to update the sidebar

                            await fetchChatHistory();

                        } catch (error) {
                            console.error('❌ Failed to update session title:', error);
                            // Still update local state even if API call fails
                            setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null);
                        }
                    } else {
                        console.warn('⚠️ Cannot update session title - missing requirements:', {
                            hasCurrentUser: !!currentUser,
                            hasUserId: !!currentUser?.id,
                            hasSessionId: !!sessionId
                        });
                    }
        
                    // ✅ Send message to backend only if not already sent
                    console.log('🔵 Sending message to backend:', decodedMessage);
                    const response = await sendMessagesEntity(decodedMessage, sessionId!);
                    console.log('✅ Received response from backend:', response);
                    
                    // Ensure suggestions are always available with fallback
                    if (!response.suggestions || response.suggestions.length === 0) {
                        console.warn('⚠️ No suggestions received, using fallback suggestions');
                        response.suggestions = [
                            "Tell me more about this",
                            "What are my options?",
                            "Help me plan the next steps"
                        ];
                    }
        
                    console.log('🔵 Adding AI response to messages');
                    setMessages((prev) => {
                        console.log('  Current messages before AI response:', prev.length);
                        if (!prev.some((m) => m.content === response.message)) {
                            console.log('✅ AI response added to state');
                            const newMessages = [
                                ...prev,
                                { id: Date.now() + 1, messageType: "ASSISTANT" as const, content: response.message || "I couldn't process your request. Please try again." }
                            ];
                            console.log('  New messages count after AI response:', newMessages.length);
                            return newMessages;
                        }
                        console.log('⚠️ AI response already exists in state');
                        return prev;
                    });
        
                    // ✅ Clean up session storage **after response is processed**
                    sessionStorage.removeItem("initialMessage");
                } catch (error) {
                    console.error("Error initializing chat session:", error);
                    toast.error("Failed to initialize chat session");
                }
            }
        };
        
        initializeChat();
    }, [searchParams]); // Remove currentUser from dependencies - we don't need to wait for it
        
        
    
    
    
    
    
    


    return (
        <LoadScript
            googleMapsApiKey={(() => {
                const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
                // Only log once per session to reduce console noise
                if (typeof window !== 'undefined' && !(window as any).__MAPS_KEY_LOGGED) {
                    console.log('🔑 Google Maps API Key configured:', apiKey ? 'Yes' : 'No');
                    (window as any).__MAPS_KEY_LOGGED = true;
                }
                return apiKey;
            })()}
            libraries={libraries}
            onLoad={() => {
                if (typeof window !== 'undefined' && !(window as any).__MAPS_LOADED_LOGGED) {
                    console.log('✅ Google Maps loaded successfully');
                    (window as any).__MAPS_LOADED_LOGGED = true;
                }
                setIsGoogleMapsLoaded(true);
            }}
            onError={(error) => {
                console.error('❌ Google Maps failed to load:', error);
                toast.error('Google Maps failed to load. Please check your API key and billing settings.');
            }}
            loadingElement={<div>Loading Google Maps...</div>}
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
                                type="button"
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
                                hasMoreSessions={hasMoreSessions}
                                isLoadingSessions={isLoadingSessions}
                                onLoadMore={loadMoreSessions}
                                onSessionDeleted={handleSessionDeleted}
                                onSessionRenamed={handleSessionRenamed}
                                currentUserId={currentUser?.id}
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
                    hasMoreSessions={hasMoreSessions}
                    isLoadingSessions={isLoadingSessions}
                    onLoadMore={loadMoreSessions}
                    onSessionDeleted={handleSessionDeleted}
                    onSessionRenamed={handleSessionRenamed}
                    currentUserId={currentUser?.id}
                />
            </div>
            {/* Middle Chat Section */}
            <div className="flex-[3.3] flex flex-col bg-white border-l border-r overflow-auto">

                {/* Mobile +Tablet header: menu + title + map button */}
                <div className="lg:hidden flex items-center justify-between px-3 py-3 border-b bg-white shadow-sm">
                    {/* Left: Menu + Chat title */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="p-2 rounded hover:bg-gray-100 md:hidden"
                            aria-label="Open menu"
                            onClick={toggleMobileMenu}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Send className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold">Chat</span>
                        </div>
                    </div>

                    {/* Right: Enhanced Map button with tooltip */}
                    <button
                        type="button"
                        onClick={() => { setShowMap(true); setIsMobileMenuOpen(false); }}
                        aria-label="View travel map"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                        title="View locations on map"
                    >
                        <Map className="w-5 h-5" />
                        <span className="text-sm font-medium">View Map</span>
                    </button>
                </div>

                {/* Status indicators */}
                <div className="px-4 py-2 space-y-2">
                    {/* AI Typing Indicator */}
                    {isAITyping && (
                        <TypingIndicator 
                            isTyping
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
                    useStreaming={false}
                    sessionId={currentSession?.sessionId}
                    onVoiceRecord={async (audioBlob) => {
                        try {
                            // Use centralized transcribeAudio function
                            const transcribedText = await transcribeAudio(audioBlob);
                            if (transcribedText) {
                                // Use handleTranscription to set message and auto-send
                                handleTranscription(transcribedText);
                            }
                        } catch (error) {
                            console.error('Transcription error:', error);
                            toast.error('Failed to transcribe audio. Please try again.');
                        }
                    }}
                />
            </div>

            {/* Right Map Panel (Desktop only) */}
            <div className="hidden lg:block flex-[2.7] bg-white overflow-hidden p-4 h-full">
                <RightMapPanel
                    currentSessionId={currentSession?.sessionId || null}
                    currentUserToken={currentUser?.token || null}
                />

            </div>

            {/* Mobile Map Overlay */}
            {showMap && (
                <div className="fixed inset-0 z-50 lg:hidden flex animate-in slide-in-from-right duration-300">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowMap(false)}
                        aria-hidden="true"
                    />

                    {/* Panel: full-screen map (or you can use width like w-full md:w-80 if you prefer) */}
                    <div className="relative flex-1 bg-white transform transition-transform duration-300 ease-out">
                        {/* Header with close button */}
                        <div className="flex items-center justify-between px-3 py-3 border-b bg-white shadow-sm">
                            <div className="flex items-center gap-2">
                                <Map className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold">Travel Map</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowMap(false)}
                                aria-label="Back to chat"
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <X className="w-4 h-4" />
                                <span className="text-sm">Back to Chat</span>
                            </button>
                        </div>

                        {/* Map content */}
                        <div className="h-[calc(100%-60px)] overflow-auto">
                            <RightMapPanel
                                currentSessionId={currentSession?.sessionId || null}
                                currentUserToken={currentUser?.token || null}
                            />
                        </div>

                        {/* Floating Chat Button - Additional navigation option */}
                        <div className="absolute bottom-6 left-6 z-10">
                            <button
                                type="button"
                                onClick={() => setShowMap(false)}
                                aria-label="Return to chat"
                                className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all transform hover:scale-105 active:scale-95"
                            >
                                <Send className="w-5 h-5" />
                                <span className="text-sm font-medium">Chat</span>
                            </button>
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
                            type="button"
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
                            hasMoreSessions={hasMoreSessions}
                            isLoadingSessions={isLoadingSessions}
                            onLoadMore={loadMoreSessions}
                            onSessionDeleted={handleSessionDeleted}
                            onSessionRenamed={handleSessionRenamed}
                            currentUserId={currentUser?.id}
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
                        type="button"
                        onClick={handleCopyMessage}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                    >
                        📋 Copy Message
                    </button>
                    {contextMenu.message?.messageType === 'USER' ? (
                        <button
                            type="button"
                            onClick={handleEditMessage}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                        >
                            ✏️ Edit & Resend
                        </button>
                    ) : (
                        <button
                            type="button"
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
