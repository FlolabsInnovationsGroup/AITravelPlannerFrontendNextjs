// Enhanced Chat Message Component with better UX

'use client';

import React from 'react';
import { Message } from '@/types/chat';
import { User, Bot, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown, { Components } from 'react-markdown';

interface EnhancedChatMessageProps {
  message: Message;
  isLoading?: boolean;
  onFeedback?: (messageId: number, type: 'like' | 'dislike') => void;
  onCopy?: (content: string) => void;
}

// Define markdown components OUTSIDE the component to prevent re-creation on every render
const markdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal ml-4 mb-2 space-y-1">{children}</ol>,
  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
};

export default function EnhancedChatMessage({ 
  message, 
  isLoading = false, 
  onFeedback, 
  onCopy 
}: EnhancedChatMessageProps) {
  const isUser = message.messageType === 'USER';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    onCopy?.(message.content);
  };

  return (
    <div className={`flex gap-3 p-4 rounded-lg mb-4 transition-all duration-200 hover:bg-gray-50/50 ${
      isUser 
        ? 'bg-blue-50 ml-8 border-l-4 border-blue-500' 
        : 'bg-white border border-gray-200 shadow-sm'
    }`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-blue-500 text-white' 
          : 'bg-gradient-to-br from-purple-500 to-blue-600 text-white'
      }`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-700">
            {isUser ? 'You' : 'AI Assistant'}
          </span>
          {!isUser && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              Online
            </span>
          )}
        </div>

        {/* Message Text with Enhanced Styling */}
        <div className={`prose prose-sm max-w-none ${
          isUser 
            ? 'text-gray-800' 
            : 'text-gray-700'
        }`}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-300" />
              </div>
              <span className="text-gray-500">AI is thinking...</span>
            </div>
          ) : (
            <ReactMarkdown 
              className="markdown-content"
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Action Buttons */}
        {!isUser && !isLoading && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 px-2 text-gray-500 hover:text-gray-700"
            >
              <Copy size={14} />
              <span className="ml-1 text-xs">Copy</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFeedback?.(message.id, 'like')}
              className="h-8 px-2 text-gray-500 hover:text-green-600"
            >
              <ThumbsUp size={14} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFeedback?.(message.id, 'dislike')}
              className="h-8 px-2 text-gray-500 hover:text-red-600"
            >
              <ThumbsDown size={14} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}