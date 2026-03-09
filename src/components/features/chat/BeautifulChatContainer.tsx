'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { Sparkles, ArrowDown, Heart, Waves, Utensils, Backpack, Loader2 } from 'lucide-react';
import EnhancedChatBubbles from './EnhancedChatBubbles';
import ModernChatInput from './ModernChatInput';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import type { Message } from '@/types/chat';

interface BeautifulChatContainerProps {
  /** Optional external message control - if not provided, uses internal streaming state */
  messages?: Message[];
  inputValue?: string;
  onInputChange?: (value: string) => void;
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  suggestions?: string[];
  currentUser?: any;
  showWelcome?: boolean;
  onVoiceRecord?: (audioBlob: Blob) => void;
  /** Enable streaming mode (default: true) */
  useStreaming?: boolean;
  /** Session ID for conversation persistence */
  sessionId?: string;
  /** When 'perplexity', use minimal search-first welcome (no large logo, "What do you want to know?" style) */
  welcomeVariant?: 'default' | 'perplexity';
  /** ID of the assistant message currently being typewriter-revealed */
  typingMessageId?: number | null;
  /** Called when typewriter effect completes */
  onTypingComplete?: () => void;
}

const BeautifulChatContainer: React.FC<BeautifulChatContainerProps> = ({
  messages: externalMessages,
  inputValue: externalInputValue,
  onInputChange: externalOnInputChange,
  onSendMessage: externalOnSendMessage,
  isLoading: externalIsLoading = false,
  suggestions: externalSuggestions = [],
  currentUser,
  showWelcome = true,
  onVoiceRecord,
  useStreaming = true,
  sessionId,
  welcomeVariant = 'default',
  typingMessageId = null,
  onTypingComplete,
}) => {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [localInputValue, setLocalInputValue] = useState(''); // Local input state for streaming mode
  const [isWSConnected, setIsWSConnected] = useState(true); // WebSocket connection state for testing
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Streaming chat integration
  const {
    messages: streamMessages,
    sendMessage: sendStreamMessage,
    isStreaming,
    cancelStream,
    clearMessages: clearStreamMessages
  } = useStreamingChat({
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
    sessionId: sessionId || `session-${Date.now()}`,
    onError: (error) => {
      console.error('Streaming error:', error);
    },
    onComplete: () => {
      console.log('✅ Stream completed');
    }
  });

  // Use streaming state or external state based on useStreaming flag
  const messages = useStreaming ? streamMessages : (externalMessages || []);
  const inputValue = useStreaming ? localInputValue : (externalInputValue || '');
  const isLoading = useStreaming ? isStreaming : externalIsLoading;
  const suggestions = externalSuggestions; // TODO: Extract from AI responses

  // Handle input changes
  const handleInputChange = (value: string) => {
    if (useStreaming) {
      setLocalInputValue(value);
    } else if (externalOnInputChange) {
      externalOnInputChange(value);
    }
  };

  // Handle sending messages
  const handleSendMessage = async (message: string) => {
    if (useStreaming) {
      try {
        await sendStreamMessage(message);
        setLocalInputValue(''); // Clear input after sending
      } catch (error) {
        console.error('Failed to send streaming message:', error);
      }
    } else {
      if (externalOnInputChange) externalOnInputChange(''); // Clear input immediately when sending
      if (externalOnSendMessage) externalOnSendMessage(message);
    }
  };

  // Scroll to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  };

  // Auto-scroll to bottom when new messages arrive (only if user is near bottom)
  useEffect(() => {
    if (isNearBottom) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isNearBottom]);

  // When loading starts, scroll so the inline typing indicator (where the reply will appear) is visible
  useEffect(() => {
    if ((isLoading || (useStreaming && isStreaming)) && messages.length > 0) {
      setTimeout(scrollToBottom, 150);
    }
  }, [isLoading, isStreaming, useStreaming, messages.length]);

  // Handle scroll detection
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    // User is near bottom if within 100px
    const nearBottom = distanceFromBottom < 100;
    setIsNearBottom(nearBottom);
    
    // Show scroll to bottom button if not near bottom and there are messages
    setShowScrollToBottom(!nearBottom && messages.length > 0);
  };

  // Welcome screen with example prompts
  const welcomePrompts = [
    { icon: Heart, text: "Plan my dream romantic getaway to Paris", color: "text-amber-600" },
    { icon: Waves, text: "Find the best family-friendly beaches in Thailand", color: "text-stone-600" },
    { icon: Utensils, text: "Create a foodie tour through Italy", color: "text-amber-700" },
    { icon: Backpack, text: "Budget backpacking route through Southeast Asia", color: "text-stone-700" }
  ];

  const handlePromptClick = (prompt: { icon: any, text: string, color: string } | string) => {
    const promptText = typeof prompt === 'string' ? prompt : prompt.text;
    handleInputChange(promptText);
    handleSendMessage(promptText);
  };

  const handleMessageAction = (action: string, message: Message) => {
    switch (action) {
      case 'copy':
        navigator.clipboard.writeText(message.content);
        // Message copied to clipboard
        break;
      case 'like':
      case 'dislike':
        // Handle message feedback
        // Could send to analytics or backend for AI improvement
        break;
      default:
        // Unknown action
        break;
    }
  };

  const handleContinueConversation = (message: Message) => {
    if (message.messageType === 'USER') {
      // For user messages, copy to input for editing
      handleInputChange(message.content);
    } else {
      // For AI messages, create a continuation prompt
      const continuePrompt = `Continue from: "${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}"`;
      handleInputChange(continuePrompt);
    }
  };

  // Enhanced location request handler with proper error handling
  const handleLocationRequest = async () => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported by browser');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout
      maximumAge: 300000 // 5 minutes
    };

    const success = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      
      // Try to get a readable address using reverse geocoding
      let locationText = `coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const address = data.results[0].formatted_address;
          locationText = `${address}`;
        }
      } catch (geocodeError) {
        // Geocoding failed, using coordinates only
      }
      
      // Add location to input with emoji for better UX
      if (inputValue) {
        handleInputChange(`${inputValue} 📍 My current location: ${locationText}`);
      } else {
        handleInputChange(`📍 I'm currently at ${locationText}. What can you recommend near me?`);
      }
    };

    const error = (err: GeolocationPositionError) => {
      let message = '';
      const title = '📍 Location Request Failed';
      
      switch (err.code) {
        case err.PERMISSION_DENIED:
          message = '🔒 Location access was denied.\n\n• Click the location icon in your browser\'s address bar\n• Select "Allow" for location access\n• Refresh the page and try again';
          break;
        case err.POSITION_UNAVAILABLE:
          message = '📡 Your location is currently unavailable.\n\n• Check if GPS/location services are enabled\n• Try moving to an area with better signal\n• Ensure your device has location services turned on';
          break;
        case err.TIMEOUT:
          message = '⏰ Location request timed out.\n\n• Check your internet connection\n• Try again in a few moments\n• Make sure location services are enabled';
          break;
        default:
          message = '❌ An unexpected error occurred while getting your location.\n\nPlease try again or enter your location manually.';
          break;
      }
      
      // Log error instead of using alert for production
      console.error(`${title}: ${message}`);
    };

    navigator.geolocation.getCurrentPosition(success, error, options);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <ConnectionStatus isConnected={isWSConnected} isConnecting={false} />

      <div className="flex-1 relative overflow-hidden min-h-0 flex flex-col">
        {/* Welcome: default (with logo) or perplexity (minimal, search-first) */}
        {messages.length === 0 && showWelcome && (
          <div className="h-full flex flex-col items-center justify-center px-4 py-8 overflow-y-auto animate-in fade-in duration-500">
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
              {welcomeVariant === 'perplexity' ? (
                <>
                  <h1 className="text-xl sm:text-2xl font-medium text-stone-800 mb-2 tracking-tight">
                    What do you want to know?
                  </h1>
                  <p className="text-stone-500 text-sm mb-6 max-w-md text-center">
                    Ask about destinations, itineraries, or travel tips.
                  </p>
                </>
              ) : (
                <>
                  <div className="mb-6 flex justify-center">
                    {!logoError ? (
                      <Image
                        src="/logo.svg"
                        alt="AI Travel Planner"
                        width={48}
                        height={48}
                        className="object-contain"
                        priority
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-amber-600" />
                      </div>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-1.5 tracking-tight">
                    AI Travel Planner
                  </h1>
                  <p className="text-stone-500 text-sm sm:text-base mb-8">
                    Ask anything about travel—destinations, itineraries, or tips.
                  </p>
                </>
              )}

              {/* Suggested prompts as pills */}
              <div className="flex flex-wrap justify-center gap-2 w-full">
                {welcomePrompts.map((prompt) => {
                  const IconComponent = prompt.icon;
                  return (
                    <button
                      key={prompt.text}
                      type="button"
                      onClick={() => handlePromptClick(prompt)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 text-sm font-medium transition-colors border border-transparent hover:border-stone-200"
                    >
                      <IconComponent className={`w-4 h-4 flex-shrink-0 ${prompt.color}`} />
                      <span className="truncate max-w-[200px] sm:max-w-none">{prompt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Messages List - centered column like Perplexity */}
        {messages.length > 0 && (
          <div
            ref={messagesContainerRef}
            data-testid="messages-container"
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 min-h-0 bg-white"
            style={{ scrollBehavior: 'smooth' }}
          >
            {/* Messages */}
            <EnhancedChatBubbles
              messages={messages}
              onContinueConversation={handleContinueConversation}
              currentUser={currentUser}
              typingMessageId={typingMessageId}
              onTypingComplete={onTypingComplete}
            />

            {/* Delay indicator: show spinner while waiting for response (before typewriter starts) */}
            {(isLoading || (useStreaming && isStreaming)) && !typingMessageId && (
              <div className="flex gap-3 max-w-3xl mx-auto mt-10" aria-live="polite" aria-label="Loading response">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="w-7 h-7 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 flex items-center">
                  <span className="text-sm text-stone-500">Loading...</span>
                </div>
              </div>
            )}
            
            {/* Spacer for scroll */}
            <div className="h-4" />
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll to Bottom Button */}
        {showScrollToBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-20 right-4 sm:right-6 p-2.5 bg-white border border-stone-200 text-stone-600 rounded-full shadow-md hover:bg-stone-50 hover:border-stone-300 z-10"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Input Section - Perplexity-style centered bar (typing indicator is inline in message list) */}
      <div className="border-t border-stone-200 bg-white px-4 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          {useStreaming && isStreaming && (
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={cancelStream}
                className="text-xs text-stone-400 hover:text-red-600 font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          <ModernChatInput
            value={inputValue}
            onChange={handleInputChange}
            onSend={handleSendMessage}
            placeholder="Ask anything about travel..."
            disabled={isLoading}
            isLoading={isLoading}
            suggestions={suggestions}
            onVoiceRecord={onVoiceRecord}
            onLocationRequest={handleLocationRequest}
            showVoice
            showLocation
            showEmojiPicker={false} // Simplified for travel focus
          />
        </div>
      </div>
    </div>
  );
};

export default BeautifulChatContainer;