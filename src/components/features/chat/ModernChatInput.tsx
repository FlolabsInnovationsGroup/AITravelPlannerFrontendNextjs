'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Smile, 
  MapPin, 
  Loader2,
  X,
  Paperclip
} from 'lucide-react';

// 🔒 FIX 2.1: Input sanitization utility
const sanitizeInput = (input: string): string => {
  // Remove dangerous HTML/script tags while preserving user intent
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers like onclick=
    .replace(/javascript:/gi, ''); // Remove javascript: protocol
  
  // Trim excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
};

// 🔒 FIX 2.2: Validate message content
const validateMessage = (message: string, maxLength: number): { valid: boolean; error?: string } => {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (message.length > maxLength) {
    return { valid: false, error: `Message too long (max ${maxLength} characters)` };
  }
  
  // Check for repeated characters (potential spam)
  const repeatedPattern = /(.)\1{49,}/; // 50+ same characters in a row
  if (repeatedPattern.test(message)) {
    return { valid: false, error: 'Message contains too many repeated characters' };
  }
  
  return { valid: true };
};

interface ModernChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  onVoiceRecord?: (audioBlob: Blob) => void;
  onLocationRequest?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  suggestions?: string[];
  maxLength?: number;
  showEmojiPicker?: boolean;
  showAttachments?: boolean;
  showVoice?: boolean;
  showLocation?: boolean;
}

const ModernChatInput: React.FC<ModernChatInputProps> = ({
  value,
  onChange,
  onSend,
  onVoiceRecord,
  onLocationRequest,
  placeholder = "Type your message...",
  disabled = false,
  isLoading = false,
  suggestions = [],
  maxLength = 4000, // 🔒 FIX 2.2: Increased from 1000 to 4000 for longer queries
  showEmojiPicker = true,
  showAttachments = false,
  showVoice = true,
  showLocation = true
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [validationError, setValidationError] = useState<string | null>(null); // 🔒 FIX 2.2: Track validation errors
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Smooth auto-resize textarea to prevent container jumping
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      
      // Store current height to prevent jarring changes
      const currentHeight = textarea.clientHeight;
      
      // Temporarily reset to calculate needed height
      textarea.style.height = 'auto';
      const newHeight = Math.max(44, Math.min(textarea.scrollHeight, 120));
      
      // Only change height if there's a significant difference (prevents micro-adjustments)
      if (Math.abs(newHeight - currentHeight) > 2) {
        textarea.style.height = `${newHeight}px`;
      } else {
        // Restore previous height if change is minimal
        textarea.style.height = `${currentHeight}px`;
      }
    }
  }, [value]);

  // Filter suggestions based on input
  useEffect(() => {
    if (value && suggestions.length > 0) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && value.length > 1);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [value, suggestions]);

  const handleSend = () => {
    // 🔒 FIX 2.1 & 2.2: Add sanitization and validation
    if (!value.trim() || disabled || isLoading) {
      return;
    }
    
    const sanitized = sanitizeInput(value.trim());
    const validation = validateMessage(sanitized, maxLength);
    
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid message');
      return;
    }
    
    setValidationError(null);
    onSend(sanitized);
    setShowSuggestions(false);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Cmd+Enter / Ctrl+Enter: send (same as Enter)
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        handleSend();
        return;
      }
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
      } else if (showSuggestions && selectedSuggestionIndex >= 0) {
        // Select suggestion with Enter
        e.preventDefault();
        handleSuggestionSelect(filteredSuggestions[selectedSuggestionIndex]);
      } else {
        // Send message with Enter
        e.preventDefault();
        handleSend();
      }
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp' && showSuggestions) {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
      );
    } else if (e.key === 'Escape' && showSuggestions) {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onVoiceRecord?.(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      
      let errorMessage = 'Unable to start voice recording. ';
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            errorMessage += 'Please allow microphone access in your browser settings.';
            break;
          case 'NotFoundError':
            errorMessage += 'No microphone found. Please check your audio devices.';
            break;
          case 'NotSupportedError':
            errorMessage += 'Voice recording is not supported in this browser.';
            break;
          default:
            errorMessage += 'Please check your microphone permissions and try again.';
        }
      } else {
        errorMessage += 'Please check your microphone and try again.';
      }
      
      console.error('Microphone error:', errorMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };



  return (
    <div className="relative">
      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-stone-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
          <div className="p-2">
            <div className="text-xs text-stone-500 mb-2 px-2">Suggestions</div>
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  index === selectedSuggestionIndex
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'hover:bg-stone-50 text-stone-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="truncate">{suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}



      {/* Main Input Container - Perplexity-style pill bar */}
      <div className={`relative flex items-center gap-2 sm:gap-3 pl-4 pr-2 py-2 bg-stone-100 rounded-full transition-all duration-200 ${
        isRecording 
          ? 'ring-2 ring-red-300 bg-red-50' 
          : 'focus-within:bg-stone-50 focus-within:ring-2 focus-within:ring-stone-200'
      }`}>
        
        {/* Voice Recording Indicator */}
        {isRecording && (
          <div className="absolute -top-12 left-4 right-4 bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">Recording...</span>
                <span className="text-sm">{formatRecordingTime(recordingDuration)}</span>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="text-white hover:bg-red-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Left Side Actions */}
        <div className="flex items-center gap-1">
          {showAttachments && (
            <button
              type="button"
              className="p-2 text-stone-400 hover:text-stone-600 rounded-full transition-colors flex items-center justify-center"
              title="Attach file"
              disabled={disabled}
            >
              <Paperclip className="w-4 h-4" />
            </button>
          )}

          {showVoice && (
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              className={`p-2 rounded-full transition-colors flex items-center justify-center ${
                isRecording
                  ? 'bg-red-500 text-white'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
              title="Hold to record voice message"
              disabled={disabled}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Text Input */}
        <div className="flex-1 relative min-w-0">
          <textarea
            ref={textareaRef}
            data-testid="message-input"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              // 🔒 FIX 2.2: Clear validation error when user types
              if (validationError) {
                setValidationError(null);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Recording audio..." : placeholder}
            disabled={disabled || isRecording}
            maxLength={maxLength}
            className={`w-full resize-none bg-transparent border-none outline-none text-stone-900 placeholder-stone-500 py-2.5 px-1 rounded-full min-h-[40px] max-h-[120px] h-[40px] flex items-center text-[15px] dark:text-stone-900 dark:placeholder-stone-500 ${
              validationError ? 'border-red-300' : ''
            }`}
            rows={1}
          />
          
          {/* 🔒 FIX 2.2: Validation Error Display */}
          {validationError && (
            <div className="absolute bottom-full mb-1 left-0 right-0 bg-red-50 border border-red-200 text-red-600 text-xs px-2 py-1 rounded">
              {validationError}
            </div>
          )}
          
          {/* Character Counter */}
          {value.length > maxLength * 0.8 && !validationError && (
            <div className={`absolute bottom-1 right-1 text-xs ${
              value.length > maxLength * 0.95 ? 'text-red-500 font-semibold' : 'text-stone-400'
            }`}>
              {value.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1">
          {showEmojiPicker && !isRecording && (
            <button
              type="button"
              className="p-2 text-stone-400 hover:text-stone-600 rounded-full transition-colors flex items-center justify-center"
              title="Add emoji"
              disabled={disabled}
            >
              <Smile className="w-4 h-4" />
            </button>
          )}

          {showLocation && !isRecording && onLocationRequest && (
            <button
              type="button"
              onClick={onLocationRequest}
              className="p-2 text-stone-400 hover:text-amber-600 rounded-full transition-colors flex items-center justify-center"
              title="Share location"
              disabled={disabled}
            >
              <MapPin className="w-4 h-4" />
            </button>
          )}

          {/* Send Button - Perplexity-style */}
          <button
            type="button"
            data-testid="send-button"
            onClick={handleSend}
            disabled={disabled || isLoading || !value.trim() || isRecording}
            className={`p-2.5 rounded-full transition-all duration-200 flex items-center justify-center ${
              value.trim() && !disabled && !isLoading && !isRecording
                ? 'bg-stone-900 text-white hover:bg-stone-800'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
            title="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>


    </div>
  );
};

export default ModernChatInput;