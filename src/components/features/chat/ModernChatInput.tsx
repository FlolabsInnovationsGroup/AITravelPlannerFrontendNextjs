'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Smile, 
  MapPin, 
  Camera,
  Paperclip,
  Loader2,
  X
} from 'lucide-react';

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
  maxLength = 1000,
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
    if (value.trim() && !disabled && !isLoading) {
      onSend(value.trim());
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return;
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

  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    textareaRef.current?.focus();
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
      
      alert(errorMessage);
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
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
          <div className="p-2">
            <div className="text-xs text-gray-500 mb-2 px-2">Suggestions</div>
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  index === selectedSuggestionIndex
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'hover:bg-gray-50 text-gray-700'
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



      {/* Main Input Container */}
      <div className={`relative flex items-center gap-3 p-4 bg-white border-2 rounded-2xl shadow-sm transition-all duration-200 ${
        isRecording 
          ? 'border-red-300 bg-red-50' 
          : 'border-gray-200 hover:border-gray-300 focus-within:border-blue-400 focus-within:shadow-md'
      }`}>
        
        {/* Voice Recording Indicator */}
        {isRecording && (
          <div className="absolute -top-12 left-4 right-4 bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Recording...</span>
                <span className="text-sm">{formatRecordingTime(recordingDuration)}</span>
              </div>
              <button
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
              className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
              title="Attach file"
              disabled={disabled}
            >
              <Paperclip className="w-5 h-5" />
            </button>
          )}

          {showVoice && (
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              className={`p-2.5 rounded-lg transition-colors flex items-center justify-center ${
                isRecording
                  ? 'bg-red-500 text-white'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title="Hold to record voice message"
              disabled={disabled}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Recording audio..." : placeholder}
            disabled={disabled || isRecording}
            maxLength={maxLength}
            className="w-full resize-none bg-transparent border-none outline-none text-gray-800 placeholder-gray-500 py-2.5 px-3 rounded-lg min-h-[44px] max-h-[120px] h-[44px] flex items-center"
            rows={1}
          />
          
          {/* Character Counter */}
          {value.length > maxLength * 0.8 && (
            <div className={`absolute bottom-1 right-1 text-xs ${
              value.length > maxLength * 0.95 ? 'text-red-500' : 'text-gray-400'
            }`}>
              {value.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1">
          {showEmojiPicker && !isRecording && (
            <button
              className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
              title="Add emoji"
              disabled={disabled}
            >
              <Smile className="w-5 h-5" />
            </button>
          )}

          {showLocation && !isRecording && onLocationRequest && (
            <button
              onClick={onLocationRequest}
              className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center justify-center"
              title="Share location"
              disabled={disabled}
            >
              <MapPin className="w-5 h-5" />
            </button>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={disabled || isLoading || !value.trim() || isRecording}
            className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center ${
              value.trim() && !disabled && !isLoading && !isRecording
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            title="Send message"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>


    </div>
  );
};

export default ModernChatInput;