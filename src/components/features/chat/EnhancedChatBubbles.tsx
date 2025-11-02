'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import { 
  User,
  Bot,
  Sparkles
} from 'lucide-react';

interface Message {
  id: number;
  messageType: 'USER' | 'ASSISTANT';
  content: string;
  timestamp?: Date;
}

interface EnhancedChatBubblesProps {
  messages: Message[];
  isLoading?: boolean;
  onMessageAction?: (action: string, message: Message) => void;
  onContinueConversation?: (message: Message) => void;
  currentUser?: any;
}

const EnhancedChatBubbles: React.FC<EnhancedChatBubblesProps> = ({
  messages,
  isLoading = false,
  onMessageAction,
  onContinueConversation,
  currentUser
}) => {
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());



  const toggleMessageExpansion = (messageId: number) => {
    setExpandedMessages(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(messageId)) {
        newExpanded.delete(messageId);
      } else {
        newExpanded.add(messageId);
      }
      return newExpanded;
    });
  };

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
    };
  }, []);

  const markdownComponents: Components = {
    p: ({ ...props }) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
    ul: ({ ...props }) => <ul className="list-disc ml-5 mb-3 space-y-1" {...props} />,
    ol: ({ ...props }) => <ol className="list-decimal ml-5 mb-3 space-y-1" {...props} />,
    li: ({ ...props }) => <li className="leading-relaxed" {...props} />,
    h1: ({ ...props }) => <h1 className="text-xl font-bold mb-3 text-gray-900" {...props} />,
    h2: ({ ...props }) => <h2 className="text-lg font-semibold mb-2 text-gray-800" {...props} />,
    h3: ({ ...props }) => <h3 className="text-md font-medium mb-2 text-gray-700" {...props} />,
    strong: ({ ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
    em: ({ ...props }) => <em className="italic text-gray-700" {...props} />,
    code: ({ ...props }: any) =>
      props.inline ? (
        <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
      ) : (
        <code className="block bg-gray-100 text-gray-800 p-4 rounded-lg mb-3 text-sm font-mono overflow-x-auto" {...props} />
      ),
    blockquote: ({ ...props }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-3" {...props} />
    ),
  };

  const formatTimestamp = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getUserAvatar = () => {
    if (currentUser?.profileImage) {
      return (
        <img 
          src={currentUser.profileImage} 
          alt="Your avatar" 
          className="w-8 h-8 rounded-full object-cover"
        />
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md border-2 border-white">
        <User className="w-4 h-4 text-white" />
      </div>
    );
  };

  const getAIAvatar = () => (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md border-2 border-white">
      <Bot className="w-4 h-4 text-white" />
    </div>
  );

  return (
    <div className="space-y-8">
      {messages.map((message, index) => {
        const isUser = message.messageType === 'USER';
        const isLongMessage = message.content.length > 300;
        const isExpanded = expandedMessages.has(message.id);
        const shouldTruncate = isLongMessage && !isExpanded;
        const displayContent = shouldTruncate 
          ? message.content.substring(0, 300) + '...'
          : message.content;

        return (
          <div
            key={message.id}
            className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {isUser ? getUserAvatar() : getAIAvatar()}
            </div>

            {/* Message Content */}
            <div className={`flex-1 max-w-[80%] ${isUser ? 'flex justify-end' : 'flex justify-start'}`}>
              <div
                className={`relative rounded-2xl px-5 py-4 shadow-sm transition-all duration-200 hover:shadow-lg ${
                  isUser
                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md shadow-blue-100'
                    : 'bg-gradient-to-br from-gray-50 to-white border border-gray-200/60 text-gray-800 rounded-bl-md hover:border-blue-200 hover:shadow-blue-50'
                }`}
              >
                {/* Message Header */}
                <div className={`flex items-center gap-2 mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-center gap-1.5 text-xs ${
                    isUser ? 'text-blue-100' : 'text-gray-600'
                  }`}>
                    {!isUser && <Sparkles className="w-3.5 h-3.5 text-blue-500" />}
                    <span className="font-semibold">
                      {isUser ? 'You' : 'AI Assistant'}
                    </span>
                    {message.timestamp && (
                      <>
                        <span className="opacity-70">•</span>
                        <span className="opacity-90">{formatTimestamp(message.timestamp)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Message Text */}
                <div className={`prose prose-sm max-w-none leading-relaxed ${
                  isUser 
                    ? 'prose-invert prose-p:text-white prose-strong:text-white prose-em:text-blue-100 prose-p:leading-relaxed' 
                    : 'prose-gray prose-p:text-gray-800 prose-strong:text-gray-900 prose-p:leading-relaxed'
                }`}>
                  <ReactMarkdown components={markdownComponents}>
                    {displayContent}
                  </ReactMarkdown>
                </div>

                {/* Expand/Collapse for long messages */}
                {isLongMessage && (
                  <button
                    onClick={() => toggleMessageExpansion(message.id)}
                    className={`mt-2 text-xs underline transition-colors ${
                      isUser 
                        ? 'text-blue-100 hover:text-white' 
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}

                {/* Action Buttons Removed */}
              </div>
            </div>
          </div>
        );
      })}

      {/* Typing Indicator */}
      {isLoading && (
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            {getAIAvatar()}
          </div>
          <div className="flex-1 max-w-[75%]">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedChatBubbles;