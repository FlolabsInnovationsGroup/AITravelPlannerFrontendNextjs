'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { Sparkles, MessageCircle, ArrowDown, Heart, Waves, Utensils, Backpack } from 'lucide-react';
import EnhancedChatBubbles from './EnhancedChatBubbles';
import ModernChatInput from './ModernChatInput';

interface Message {
  id: number;
  messageType: 'USER' | 'ASSISTANT';
  content: string;
  timestamp?: Date;
}

interface BeautifulChatContainerProps {
  messages: Message[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  suggestions?: string[];
  currentUser?: any;
  showWelcome?: boolean;
  onVoiceRecord?: (audioBlob: Blob) => void;
}

const BeautifulChatContainer: React.FC<BeautifulChatContainerProps> = ({
  messages,
  inputValue,
  onInputChange,
  onSendMessage,
  isLoading = false,
  suggestions = [],
  currentUser,
  showWelcome = true,
  onVoiceRecord
}) => {
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
    { icon: Heart, text: "Plan my dream romantic getaway to Paris", color: "text-pink-600" },
    { icon: Waves, text: "Find the best family-friendly beaches in Thailand", color: "text-blue-600" }, 
    { icon: Utensils, text: "Create a foodie tour through Italy", color: "text-amber-600" },
    { icon: Backpack, text: "Budget backpacking route through Southeast Asia", color: "text-green-600" }
  ];

  const handlePromptClick = (prompt: { icon: any, text: string, color: string } | string) => {
    const promptText = typeof prompt === 'string' ? prompt : prompt.text;
    onInputChange(promptText);
    onSendMessage(promptText);
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
      onInputChange(message.content);
    } else {
      // For AI messages, create a continuation prompt
      const continuePrompt = `Continue from: "${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}"`;
      onInputChange(continuePrompt);
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
        onInputChange(`${inputValue} 📍 My current location: ${locationText}`);
      } else {
        onInputChange(`📍 I'm currently at ${locationText}. What can you recommend near me?`);
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
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/40 relative">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>
      {/* Messages Container */}
      <div className="flex-1 relative overflow-hidden min-h-0 flex flex-col">
        {/* Welcome Screen */}
        {messages.length === 0 && showWelcome && (
          <div className="h-full flex flex-col items-center p-4 py-6 overflow-y-auto">
            {/* Spacer for top alignment */}
            <div className="flex-1 min-h-[2rem] max-h-[4rem]" />
            
            {/* Branded Logo - Enhanced professional branding with improved sizing */}
            <div className="mb-4 relative flex-shrink-0">
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl border-2 border-gray-100/80 hover:shadow-3xl transition-all duration-500 group cursor-pointer backdrop-blur-sm">
                <div className="relative w-16 h-16 transition-transform duration-500 group-hover:scale-105">
                  {!logoError ? (
                    <Image 
                      src="/logo.svg" 
                      alt="AI Travel Planner" 
                      width={64}
                      height={64}
                      className="object-contain w-full h-full transition-all duration-500"
                      priority
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    /* Enhanced fallback with professional styling */
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                      <Sparkles className="w-8 h-8 text-white/95 drop-shadow-lg" />
                    </div>
                  )}
                </div>
              </div>
              {/* Enhanced status indicator - positioned to avoid cutoff */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center border-3 border-white shadow-lg">
                <MessageCircle className="w-3 h-3 text-white drop-shadow-sm" />
              </div>
              {/* Enhanced glow effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-indigo-400/30 blur-2xl -z-10 scale-125 opacity-70 animate-pulse" />
            </div>

            {/* Enhanced Branded Welcome Text */}
            <div className="text-center mb-4 max-w-xl flex-shrink-0 px-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent mb-2 tracking-tight">
                AI Travel Planner
              </h1>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 leading-tight">
                Ready to plan your next adventure?
              </h2>
            </div>

            {/* Example Prompts */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-lg flex-shrink-0">
              {welcomePrompts.map((prompt) => {
                const IconComponent = prompt.icon;
                return (
                  <button
                    key={prompt.text}
                    type="button"
                    onClick={() => handlePromptClick(prompt)}
                    className="group p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-300 text-center transform hover:-translate-y-0.5"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className={`p-2 rounded-lg bg-gray-50 group-hover:bg-blue-50 transition-colors ${prompt.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 group-hover:text-blue-700 transition-colors leading-tight font-medium">
                          {prompt.text}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs font-medium">Try this →</span>
                    </div>
                  </button>
                );
              })}
            </div>


            
            {/* Bottom spacer */}
            <div className="flex-1 min-h-[1rem] max-h-[3rem]" />
          </div>
        )}

        {/* Messages List */}
        {messages.length > 0 && (
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-6 min-h-0"
            style={{ 
              scrollBehavior: 'smooth',
              // Add subtle background pattern
              backgroundImage: `radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.03) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          >
            {/* Messages */}
            <EnhancedChatBubbles
              messages={messages}
              isLoading={isLoading}
              onMessageAction={handleMessageAction}
              onContinueConversation={handleContinueConversation}
              currentUser={currentUser}
            />
            
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
            className="absolute bottom-6 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-110 z-10"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Input Section */}
      <div className="border-t bg-white/80 backdrop-blur-sm p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <ModernChatInput
            value={inputValue}
            onChange={onInputChange}
            onSend={onSendMessage}
            placeholder="Ask me anything about your travel plans..."
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