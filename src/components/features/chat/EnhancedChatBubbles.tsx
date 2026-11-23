'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ReactMarkdown, { Components } from 'react-markdown';
import { User, Sparkles, Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  /** When set, the assistant message with this id is revealed with a typewriter effect */
  typingMessageId?: number | null;
  /** Called when the typewriter effect for typingMessageId finishes */
  onTypingComplete?: () => void;
}

// Define markdown components OUTSIDE the component to prevent re-creation on every render
const markdownComponents: Components = {
  p: ({ ...props }) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
  ul: ({ ...props }) => <ul className="list-none ml-0 mb-3 space-y-2" {...props} />,
  ol: ({ ...props }) => <ol className="list-decimal ml-5 mb-3 space-y-1" {...props} />,
  li: ({ ...props }) => (
    <li className="leading-relaxed flex items-start gap-2" {...props}>
      <span className="text-amber-500 text-sm mt-1.5">•</span>
      <span className="flex-1">{props.children}</span>
    </li>
  ),
  h1: ({ children, ...props }) => <h1 className="text-xl font-bold mb-3 text-stone-900 flex items-center gap-2" {...props}>{children}</h1>,
  h2: ({ children, ...props }) => <h2 className="text-lg font-semibold mb-2 text-stone-800 flex items-center gap-2" {...props}>{children}</h2>,
  h3: ({ children, ...props }) => <h3 className="text-md font-medium mb-2 text-stone-700 flex items-center gap-2" {...props}>{children}</h3>,
  strong: ({ ...props }) => <strong className="font-semibold text-stone-900 bg-amber-100 px-1 py-0.5 rounded" {...props} />,
  em: ({ ...props }) => <em className="italic text-amber-700" {...props} />,
  code: ({ ...props }: any) =>
    props.inline ? (
      <code className="bg-amber-50 text-stone-800 px-2 py-1 rounded-md text-sm font-mono border border-amber-200" {...props} />
    ) : (
      <code className="block bg-stone-50 text-stone-800 p-4 rounded-lg mb-3 text-sm font-mono overflow-x-auto border border-stone-200" {...props} />
    ),
  blockquote: ({ ...props }) => (
    <blockquote className="border-l-4 border-amber-500 bg-amber-50 pl-4 py-2 rounded-r-lg italic text-stone-700 my-3" {...props} />
  ),
};

// Enhanced markdown components for travel responses with richer styling
const enhancedMarkdownComponents: Components = {
  ...markdownComponents,
  p: ({ ...props }) => <p className="mb-4 last:mb-0 leading-relaxed text-stone-700" {...props} />,
  h1: ({ children, ...props }) => <h1 className="text-lg font-bold mb-3 text-stone-900 flex items-center gap-2 border-b border-stone-200 pb-2" {...props}>{children}</h1>,
  h2: ({ children, ...props }) => <h2 className="text-md font-semibold mb-3 text-stone-800 flex items-center gap-2 mt-4" {...props}>{children}</h2>,
  h3: ({ children, ...props }) => <h3 className="text-sm font-medium mb-2 text-stone-700 flex items-center gap-2 mt-3" {...props}>{children}</h3>,
  ul: ({ ...props }) => <ul className="list-none ml-0 mb-4 space-y-2" {...props} />,
  ol: ({ ...props }) => <ol className="list-decimal ml-5 mb-4 space-y-2" {...props} />,
  li: ({ ...props }) => (
    <li className="leading-relaxed flex items-start gap-2 text-stone-700" {...props}>
      <span className="text-amber-500 text-sm mt-1.5 flex-shrink-0">•</span>
      <span className="flex-1">{props.children}</span>
    </li>
  ),
  strong: ({ ...props }) => <strong className="font-semibold text-stone-900" {...props} />,
  em: ({ ...props }) => <em className="italic text-stone-700" {...props} />,
  blockquote: ({ ...props }) => (
    <blockquote className="border-l-2 border-stone-300 pl-4 py-2 my-3 text-stone-600 text-sm" {...props} />
  ),
  a: ({ href, children, ...props }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 underline underline-offset-2" {...props}>
      {children}
    </a>
  ),
};

const TYPEWRITER_INTERVAL_MS = 14;
const TYPEWRITER_CHUNK = 2;

const EnhancedChatBubbles: React.FC<EnhancedChatBubblesProps> = ({
  messages,
  onContinueConversation,
  currentUser,
  typingMessageId = null,
  onTypingComplete,
}) => {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [visibleLength, setVisibleLength] = useState(0);
  const onTypingCompleteRef = useRef(onTypingComplete);
  onTypingCompleteRef.current = onTypingComplete;
  const typingMessage = messages.find((m) => m.messageType === 'ASSISTANT' && m.id === typingMessageId);
  const fullLength = typingMessage?.content?.length ?? 0;

  // Typewriter effect for the message being typed
  useEffect(() => {
    if (typingMessageId == null || fullLength === 0) {
      setVisibleLength(0);
      return;
    }
    setVisibleLength(0);
    const interval = setInterval(() => {
      setVisibleLength((prev) => {
        const next = Math.min(prev + TYPEWRITER_CHUNK, fullLength);
        if (next >= fullLength) {
          clearInterval(interval);
          // Defer so we don't update parent (ChatPageContent) during this render/commit
          queueMicrotask(() => onTypingCompleteRef.current?.());
        }
        return next;
      });
    }, TYPEWRITER_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [typingMessageId, fullLength]);

  const copyToClipboard = async (text: string, messageId: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(messageId);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
      toast.error('Failed to copy');
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
      <div className="prose prose-sm max-w-none text-stone-800">
        <ReactMarkdown components={enhancedMarkdownComponents}>
          {formatTextForMarkdown(content)}
        </ReactMarkdown>
      </div>
    );
  };

  // Perplexity-style: small icon (no large avatar)
  const getUserIcon = () => {
    if (currentUser?.profileImage) {
      return (
        <Image 
          src={currentUser.profileImage} 
          alt="You"
          width={28}
          height={28} 
          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
        />
      );
    }
    return (
      <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
        <User className="w-3.5 h-3.5 text-stone-600" />
      </div>
    );
  };

  const getAIIcon = () => (
    <div className="w-7 h-7 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0">
      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
    </div>
  );

  return (
    <div
      className="space-y-10 max-w-3xl mx-auto"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.map((message) => {
        const isUser = message.messageType === 'USER';
        const isCopied = copiedId === message.id;
        const isTypingThis = !isUser && typingMessageId === message.id;
        const displayContent = isTypingThis && fullLength > 0
          ? message.content.slice(0, visibleLength)
          : message.content;

        return (
          <div
            key={message.id}
            data-testid="message"
            className={`flex gap-3 animate-in fade-in duration-200 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className="flex-shrink-0 pt-0.5">
              {isUser ? getUserIcon() : getAIIcon()}
            </div>

            <div className={`flex-1 min-w-0 ${isUser ? 'flex justify-end' : 'flex justify-start'}`}>
              <div
                className={`group relative max-w-[85%] sm:max-w-[80%] ${
                  isUser
                    ? 'rounded-2xl px-4 py-2.5 bg-stone-100 text-stone-900'
                    : 'rounded-2xl px-0 py-1 text-stone-800'
                }`}
              >
                {isUser ? (
                  <div className="leading-relaxed text-[15px]">
                    {formatTravelResponse(message.content, isUser)}
                  </div>
                ) : (
                  <>
                    <div className="prose prose-sm max-w-none prose-p:text-stone-700 prose-p:leading-relaxed prose-headings:text-stone-900 prose-headings:font-semibold prose-li:text-stone-700 prose-li:marker:text-amber-500 prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline">
                      <ReactMarkdown components={enhancedMarkdownComponents}>
                        {formatTextForMarkdown(displayContent)}
                      </ReactMarkdown>
                    </div>
                    {isTypingThis && visibleLength < fullLength && (
                      <span className="inline-block w-2 h-4 ml-0.5 bg-amber-500 animate-pulse" aria-hidden />
                    )}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className="absolute top-0 right-0 p-1.5 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
                      aria-label="Copy message"
                      title="Copy"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EnhancedChatBubbles;