// Enhanced Chat Input with modern UX features

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Mic, MicOff, Smile, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';

interface EnhancedChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  enableVoice?: boolean;
  enableLocation?: boolean;
  maxLength?: number;
}

export default function EnhancedChatInput({
  value,
  onChange,
  onSend,
  isLoading = false,
  placeholder = "Ask me anything about travel...",
  enableVoice = true,
  enableLocation = true,
  maxLength = 1000
}: EnhancedChatInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [value]);

  const handleSend = () => {
    if (value.trim() && !isLoading) {
      onSend(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        // const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        // Here you would implement speech-to-text conversion
        toast.success('Voice recording completed');
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const insertCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationText = `My current location: ${position.coords.latitude}, ${position.coords.longitude}`;
          onChange(value + (value ? ' ' : '') + locationText);
          toast.success('Current location added');
        },
        () => {
          toast.error('Could not get your location');
        }
      );
    } else {
      toast.error('Geolocation not supported');
    }
  };

  const onEmojiClick = (emojiData: any) => {
    onChange(value + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="relative">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 right-0 z-50">
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
      )}

      {/* Input Container */}
      <div className={`flex flex-col bg-white border-2 rounded-xl shadow-lg transition-all duration-200 ${
        isFocused 
          ? 'border-blue-500 shadow-blue-100' 
          : 'border-gray-200 hover:border-gray-300'
      }`}>
        
        {/* Character Counter */}
        {value.length > maxLength * 0.8 && (
          <div className="px-4 pt-2 text-xs text-gray-500">
            {value.length}/{maxLength} characters
          </div>
        )}

        {/* Main Input Area */}
        <div className="flex items-end gap-2 p-3">
          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className="w-full min-h-[44px] max-h-[120px] resize-none rounded-lg border-0 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-100 dark:focus:bg-white dark:text-gray-900"
              rows={1}
              maxLength={maxLength}
              disabled={isLoading || isRecording}
            />
            
            {/* Input Suggestions */}
            {!value && (
              <div className="absolute top-3 left-4 pointer-events-none">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin size={12} />
                  <span>Try: &quot;Show me Paris&quot; or &quot;Plan a trip to Tokyo&quot;</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Voice Recording */}
            {enableVoice && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
                className={`h-9 w-9 p-0 ${
                  isRecording 
                    ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                disabled={isLoading}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              </Button>
            )}

            {/* Location */}
            {enableLocation && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={insertCurrentLocation}
                className="h-9 w-9 p-0 text-gray-500 hover:text-blue-600"
                disabled={isLoading}
              >
                <MapPin size={16} />
              </Button>
            )}

            {/* Emoji */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="h-9 w-9 p-0 text-gray-500 hover:text-yellow-600"
              disabled={isLoading}
            >
              <Smile size={16} />
            </Button>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={!value.trim() || isLoading || isRecording}
              size="sm"
              className="h-9 w-9 p-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="px-4 pb-3 flex items-center gap-2 text-red-600 text-sm">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            <span>Recording... Click to stop</span>
          </div>
        )}

        {/* Quick Actions */}
        {!value && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {[
              "🗺️ Show me Paris",
              "✈️ Plan a weekend trip",
              "🏨 Find hotels in Tokyo",
              "🍕 Best restaurants nearby"
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onChange(suggestion.substring(3))}
                className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}