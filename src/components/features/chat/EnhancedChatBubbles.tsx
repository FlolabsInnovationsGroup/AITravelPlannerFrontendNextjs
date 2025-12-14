'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ReactMarkdown, { Components } from 'react-markdown';
import { User, Sparkles } from 'lucide-react';

interface Message {
  id: number;
  messageType: 'USER' | 'ASSISTANT';
  content: string;
  timestamp?: Date;
}

interface EnhancedChatBubblesProps {
  messages: Message[];
  onContinueConversation?: (message: Message) => void;
  currentUser?: any;
}

// Define markdown components OUTSIDE the component to prevent re-creation on every render
const markdownComponents: Components = {
  p: ({ ...props }) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
  ul: ({ ...props }) => <ul className="list-none ml-0 mb-3 space-y-2" {...props} />,
  ol: ({ ...props }) => <ol className="list-decimal ml-5 mb-3 space-y-1" {...props} />,
  li: ({ ...props }) => (
    <li className="leading-relaxed flex items-start gap-2" {...props}>
      <span className="text-blue-500 text-sm mt-1.5">•</span>
      <span className="flex-1">{props.children}</span>
    </li>
  ),
  h1: ({ children, ...props }) => <h1 className="text-xl font-bold mb-3 text-gray-900 flex items-center gap-2" {...props}>{children}</h1>,
  h2: ({ children, ...props }) => <h2 className="text-lg font-semibold mb-2 text-gray-800 flex items-center gap-2" {...props}>{children}</h2>,
  h3: ({ children, ...props }) => <h3 className="text-md font-medium mb-2 text-gray-700 flex items-center gap-2" {...props}>{children}</h3>,
  strong: ({ ...props }) => <strong className="font-semibold text-gray-900 bg-yellow-100 px-1 py-0.5 rounded" {...props} />,
  em: ({ ...props }) => <em className="italic text-blue-600" {...props} />,
  code: ({ ...props }: any) =>
    props.inline ? (
      <code className="bg-blue-50 text-blue-800 px-2 py-1 rounded-md text-sm font-mono border border-blue-200" {...props} />
    ) : (
      <code className="block bg-gray-50 text-gray-800 p-4 rounded-lg mb-3 text-sm font-mono overflow-x-auto border border-gray-200" {...props} />
    ),
  blockquote: ({ ...props }) => (
    <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-2 rounded-r-lg italic text-gray-700 my-3" {...props} />
  ),
};

// Enhanced markdown components for travel responses with richer styling
const enhancedMarkdownComponents: Components = {
  ...markdownComponents,
  p: ({ ...props }) => <p className="mb-4 last:mb-0 leading-relaxed text-gray-700" {...props} />,
  h1: ({ children, ...props }) => <h1 className="text-lg font-bold mb-3 text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-2" {...props}>{children}</h1>,
  h2: ({ children, ...props }) => <h2 className="text-md font-semibold mb-3 text-gray-800 flex items-center gap-2 mt-4" {...props}>{children}</h2>,
  h3: ({ children, ...props }) => <h3 className="text-sm font-medium mb-2 text-gray-700 flex items-center gap-2 mt-3" {...props}>{children}</h3>,
  ul: ({ ...props }) => <ul className="list-none ml-0 mb-4 space-y-2" {...props} />,
  ol: ({ ...props }) => <ol className="list-decimal ml-5 mb-4 space-y-2" {...props} />,
  li: ({ ...props }) => (
    <li className="leading-relaxed flex items-start gap-2 text-gray-700" {...props}>
      <span className="text-blue-500 text-sm mt-1.5 flex-shrink-0">•</span>
      <span className="flex-1">{props.children}</span>
    </li>
  ),
  strong: ({ ...props }) => <strong className="font-semibold text-gray-900 bg-blue-50 px-1 py-0.5 rounded" {...props} />,
  em: ({ ...props }) => <em className="italic text-blue-600" {...props} />,
  blockquote: ({ ...props }) => (
    <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-3 rounded-r-lg italic text-gray-700 my-4" {...props} />
  ),
};

const EnhancedChatBubbles: React.FC<EnhancedChatBubblesProps> = ({
  messages,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onContinueConversation,
  currentUser
}) => {
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [copiedMessages, setCopiedMessages] = useState<Set<number>>(new Set());



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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const copyToClipboard = async (text: string, messageId: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessages(prev => new Set(prev).add(messageId));
      setTimeout(() => {
        setCopiedMessages(prev => {
          const newCopied = new Set(prev);
          newCopied.delete(messageId);
          return newCopied;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  // Clean up speech synthesis on unmount
  useEffect(() => () => {
      speechSynthesis.cancel();
    }, []);

  // Helper function to improve text formatting for markdown parsing (must be before formatTravelResponse)
  const formatTextForMarkdown = (content: string): string => {
    // Convert common patterns to markdown
    const formatted = content
      // Add line breaks for better paragraph separation
      .replace(/\. ([A-Z])/g, '.\n\n$1')
      // Convert numbered lists
      .replace(/(\d+\.\s)/g, '\n$1')
      // Convert bullet points
      .replace(/([•·*-]\s)/g, '\n- ')
      // Add emphasis to location names and important terms
      .replace(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*(?:\sTemple|\sMuseum|\sPark|\sMarket|\sSquare|\sCastle|\sPalace|\sGarden|\sBeach))\b/g, '**$1**')
      // Convert section headers
      .replace(/^([A-Z][A-Za-z\s]+):$/gm, '### $1')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n');

    return formatted;
  };

  // Enhanced travel response formatting with better markdown parsing
  const formatTravelResponse = (content: string, isUser: boolean): JSX.Element => {
    if (isUser) {
      return <p className="leading-relaxed">{content}</p>;
    }

    // Enhanced markdown parsing for better formatting
    return (
      <div className="prose prose-sm max-w-none text-gray-800">
        <ReactMarkdown components={enhancedMarkdownComponents}>
          {formatTextForMarkdown(content)}
        </ReactMarkdown>
      </div>
    );
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
        <Image 
          src={currentUser.profileImage} 
          alt="Your avatar"
          width={32}
          height={32} 
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
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-md border-2 border-white">
      <Sparkles className="w-4 h-4 text-white" />
    </div>
  );

  return (
    <div className="space-y-8">
      {messages.map((message) => {
        const isUser = message.messageType === 'USER';
        const isLongMessage = message.content.length > 300;
        const isExpanded = expandedMessages.has(message.id);
        const shouldTruncate = isLongMessage && !isExpanded;
        const displayContent = shouldTruncate 
          ? `${message.content.substring(0, 300)  }...`
          : message.content;

        return (
          <div
            key={message.id}
            data-testid="message"
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

                {/* Enhanced Message Content */}
                <div className={`max-w-none leading-relaxed ${
                  isUser 
                    ? 'text-white' 
                    : 'text-gray-800'
                }`}>
                  {formatTravelResponse(displayContent, isUser)}
                </div>

                {/* Expand/Collapse for long messages */}
                {isLongMessage && (
                  <button
                    type="button"
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


    </div>
  );
};

export default EnhancedChatBubbles;