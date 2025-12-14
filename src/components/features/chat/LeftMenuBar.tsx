import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { MessageSquare, Heart, Globe, Bell, PlusCircle, Search, LogOut, Loader2, Trash2, Edit2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { toast } from 'react-hot-toast';
import { groupSessionsByDate, formatRelativeTime } from '@/utils/dateGrouping';
import type { SessionDTO } from '@/lib/api';
import { deleteSession, updateSession } from '@/lib/api';

interface LeftMenuBarProps {
  isMobileMenuOpen: boolean;
  showChatHistory: boolean;
  toggleChatHistory: () => void;
  toggleMobileMenu: () => void;
  signOut: () => void;
  handleNewChat: () => void;
  chatHistory: SessionDTO[];
  currentSessionId: string | null;
  handleSessionClick: (session: SessionDTO) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  hasMoreSessions?: boolean;
  isLoadingSessions?: boolean;
  onLoadMore?: () => void;
  onSessionDeleted?: (sessionId: string) => void;
  onSessionRenamed?: (sessionId: string, newTitle: string) => void;
  currentUserId?: string;
}

const LeftMenuBar: React.FC<LeftMenuBarProps> = ({
  isMobileMenuOpen,
  showChatHistory,
  toggleChatHistory,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toggleMobileMenu,
  signOut,
  handleNewChat,
  chatHistory,
  currentSessionId,
  handleSessionClick,
  searchQuery,
  setSearchQuery,
  hasMoreSessions = false,
  isLoadingSessions = false,
  onLoadMore,
  onSessionDeleted,
  onSessionRenamed,
  currentUserId,
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  // Handler functions for feature buttons
  const handleFavoritesClick = () => {
    toast('❤️ Favorites feature coming soon! Save your favorite destinations and trips.', {
      duration: 3000,
      position: 'top-center',
    });
  };

  const handleNotificationsClick = () => {
    toast('🔔 Notifications feature coming soon! Stay updated on your travel plans.', {
      duration: 3000,
      position: 'top-center',
    });
  };

  const handleExploreClick = () => {
    toast('🌍 Explore feature coming soon! Discover amazing destinations worldwide.', {
      duration: 3000,
      position: 'top-center',
    });
  };

  // Infinite scroll observer ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Setup infinite scroll observer
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMoreSessions && !isLoadingSessions && onLoadMore) {
      onLoadMore();
    }
  }, [hasMoreSessions, isLoadingSessions, onLoadMore]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [handleObserver]);

  // 🔒 FIX 3.1: Filter sessions with memoization to prevent unnecessary recalculations
  const filteredSessions = useMemo(() => {
    if (!Array.isArray(chatHistory) || chatHistory.length === 0) return [];
    return chatHistory.filter((session) => {
      // Defensive: ensure session object has required properties
      if (!session || typeof session !== 'object') return false;
      if (!session.title || typeof session.title !== 'string') return false;
      if (!session.sessionId) return false;
      
      return session.title.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [chatHistory, searchQuery]);

  // Group filtered sessions by date (Today, Yesterday, etc.)
  const groupedSessions = useMemo(() => {
    return groupSessionsByDate(filteredSessions);
  }, [filteredSessions]);

  // Handle session deletion
  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    
    try {
      await deleteSession(sessionId);
      toast.success('Conversation deleted');
      if (onSessionDeleted) onSessionDeleted(sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete conversation');
    }
  };

  // Handle session rename
  const handleRenameSession = async (sessionId: string) => {
    if (!editTitle.trim() || !currentUserId) {
      setEditingSessionId(null);
      return;
    }
    
    try {
      await updateSession(sessionId, editTitle.trim(), currentUserId);
      toast.success('Conversation renamed');
      if (onSessionRenamed) onSessionRenamed(sessionId, editTitle.trim());
      setEditingSessionId(null);
    } catch (error) {
      console.error('Failed to rename session:', error);
      toast.error('Failed to rename conversation');
    }
  };

  // Start editing
  const startEditing = (e: React.MouseEvent, session: SessionDTO) => {
    e.stopPropagation();
    setEditingSessionId(session.sessionId || null);
    setEditTitle(session.title || '');
  };

  // Session row component with timestamp display and hover actions
  const SessionRow = ({ session }: { session: SessionDTO }) => {
    if (!session || !session.sessionId || !session.title) return null;

    const isEditing = editingSessionId === session.sessionId;
    const [isHovered, setIsHovered] = useState(false);

    if (isEditing) {
      return (
        <div className="w-full py-3 px-4">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={() => handleRenameSession(session.sessionId!)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSession(session.sessionId!);
              if (e.key === 'Escape') setEditingSessionId(null);
            }}
            autoFocus
            className="w-full text-sm"
          />
        </div>
      );
    }

    return (
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`w-full text-left py-3 px-4 cursor-pointer hover:bg-gray-100 rounded-md transition-colors ${
            currentSessionId === session.sessionId ? "bg-gray-200" : ""
          }`}
          onClick={() => handleSessionClick(session)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSessionClick(session);
            }
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col flex-1 min-w-0">
              <span className="truncate block font-medium text-gray-900">{session.title}</span>
              {session.createdAt && (
                <span className="text-xs text-gray-500 mt-1">
                  {formatRelativeTime(session.createdAt)}
                </span>
              )}
            </div>
            
            {/* Hover actions */}
            {isHovered && (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => startEditing(e, session)}
                  className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                  aria-label="Rename conversation"
                  title="Rename"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={(e) => handleDeleteSession(e, session.sessionId!)}
                  className="p-1.5 hover:bg-red-100 rounded-md transition-colors"
                  aria-label="Delete conversation"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block bg-white border-r transition-all duration-300 ${
        showChatHistory ? 'w-full md:w-64' : 'w-16'
      } md:h-screen flex flex-col`}
    >
      {/* Logo Section */}
      <div className="p-4 flex items-center justify-center">
  <Link href="/" className="flex items-center">
          <Image
            src="/logo.svg"
            alt="AiTripPlanner Logo"
            width={24}
            height={24}
            style={{ width: 'auto', height: 'auto' }}
          />
    {showChatHistory && (
      <span
        className="ml-2 px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-[10px] font-medium rounded-full shadow-md border border-white"
        style={{
          fontFamily: "'Montserrat', sans-serif",
          letterSpacing: '0.5px',
          lineHeight: '1',
        }}
      >
        BETA
      </span>
    )}
  </Link>
</div>

      {/* Navigation Section */}
      {!showChatHistory ? (
        <nav className="flex-grow flex flex-col">
          <Button
            variant="ghost"
            className="flex items-center py-2 px-4 w-full text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            onClick={toggleChatHistory}
            aria-label="Toggle chat history"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>
          <Button 
            variant="ghost" 
            className="flex items-center py-2 px-4 w-full text-gray-700 hover:text-gray-900 hover:bg-gray-100" 
            onClick={handleFavoritesClick}
            aria-label="Favorites"
          >
            <Heart className="w-6 h-6" />
          </Button>
          <Button 
            variant="ghost" 
            className="flex items-center py-2 px-4 w-full text-gray-700 hover:text-gray-900 hover:bg-gray-100" 
            onClick={handleNotificationsClick}
            aria-label="Notifications"
          >
            <Bell className="w-6 h-6" />
          </Button>
          <Button 
            variant="ghost" 
            className="flex items-center py-2 px-4 w-full text-gray-700 hover:text-gray-900 hover:bg-gray-100" 
            onClick={handleExploreClick}
            aria-label="Global"
          >
            <Globe className="w-6 h-6" />
          </Button>
          <div className="mt-auto mb-2 border-t border-gray-200 w-full" />
          <Button
            variant="ghost"
            className="flex items-center py-2 px-4 w-full mt-auto text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            onClick={signOut}
            aria-label="Logout"
          >
            <LogOut className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            className="flex items-center py-2 px-4 w-full mb-4 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            onClick={handleNewChat}
            aria-label="New chat"
          >
            <PlusCircle className="w-6 h-6" />
          </Button>
        </nav>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center p-4 border-b">
            <Button
              variant="ghost"
              className="mr-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              onClick={toggleChatHistory}
              aria-label="Close chat history"
            >
              <MessageSquare className="w-6 h-6" />
            </Button>
            <span className="font-semibold">Chat History</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center bg-gray-100 rounded-md mb-4">
                <Search className="w-5 h-5 ml-3 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search chat titles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-none bg-transparent focus:ring-0"
                />
              </div>
              
              {/* Date-grouped chat history with ChatGPT-style sections */}
              <div className="flex-1 overflow-y-auto max-h-[500px]">
                {Array.isArray(chatHistory) && groupedSessions.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {groupedSessions.map(({ group, sessions }) => (
                        <div key={group}>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2">
                            {group}
                          </h3>
                          <div className="space-y-1">
                            {sessions.map((session) => (
                              <SessionRow key={session.sessionId} session={session} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Infinite scroll sentinel and loading indicator */}
                    {hasMoreSessions && (
                      <div ref={loadMoreRef} className="py-4 flex justify-center">
                        {isLoadingSessions && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Loading more...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 p-4">
                    {searchQuery ? 'No matching sessions found' : 'No chat history available'}
                  </p>
                )}
              </div>

            </div>
          </div>
          <Button
            variant="ghost"
            className="flex items-center justify-center p-4 w-full border-t"
            onClick={handleNewChat}
            aria-label="New chat"
          >
            <PlusCircle className="w-6 h-6 mr-2" />
            <span>New Chat</span>
          </Button>
          <Button
            variant="ghost"
            className="flex items-center justify-center p-4 w-full border-t text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            onClick={signOut}
            aria-label="Logout"
          >
            <LogOut className="w-6 h-6 mr-2" />
            <span>Logout</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default LeftMenuBar;
