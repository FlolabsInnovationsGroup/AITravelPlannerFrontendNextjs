'use client';

import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, LogOut, Loader2, Trash2, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import { groupSessionsByDate } from '@/utils/dateGrouping';
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
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMoreSessions && !isLoadingSessions && onLoadMore) {
        onLoadMore();
      }
    },
    [hasMoreSessions, isLoadingSessions, onLoadMore]
  );

  const filteredSessions = useMemo(() => {
    if (!Array.isArray(chatHistory) || chatHistory.length === 0) return [];
    const seen = new Set<string>();
    const unique = chatHistory.filter((s) => {
      if (!s?.sessionId) return false;
      if (seen.has(s.sessionId)) return false;
      seen.add(s.sessionId);
      return true;
    });
    if (!searchQuery.trim()) return unique;
    return unique.filter((s) =>
      s.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [chatHistory, searchQuery]);

  const groupedSessions = useMemo(() => groupSessionsByDate(filteredSessions), [filteredSessions]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1,
    });
    const el = loadMoreRef.current;
    if (el) observerRef.current.observe(el);
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [handleObserver, filteredSessions.length]);

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    try {
      await deleteSession(sessionId);
      toast.success('Conversation deleted');
      onSessionDeleted?.(sessionId);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleRenameSession = async (sessionId: string) => {
    if (!editTitle.trim() || !currentUserId) {
      setEditingSessionId(null);
      return;
    }
    try {
      await updateSession(sessionId, editTitle.trim(), currentUserId);
      toast.success('Renamed');
      onSessionRenamed?.(sessionId, editTitle.trim());
      setEditingSessionId(null);
    } catch {
      toast.error('Failed to rename');
    }
  };

  const startEditing = (e: React.MouseEvent, session: SessionDTO) => {
    e.stopPropagation();
    setEditingSessionId(session.sessionId ?? null);
    setEditTitle(session.title ?? '');
  };

  return (
    <div
      className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:flex md:flex-col w-full md:w-[260px] flex-shrink-0 h-screen bg-white border-r border-stone-200`}
    >
      {/* Logo: same as original chat history header (logo.svg + BETA) */}
      <div className="flex-shrink-0 border-b border-stone-200 p-4">
        <Link href="/" className="flex items-center justify-center w-full min-w-0 gap-2">
          <Image
            src="/logo.svg"
            alt="AI Travel Planner Logo"
            width={32}
            height={32}
            className="object-contain flex-shrink-0"
          />
          <span
            className="px-2 py-1 bg-stone-800 text-amber-400 text-[10px] font-medium rounded-full border border-stone-600 flex-shrink-0"
            style={{ letterSpacing: '0.5px', lineHeight: 1 }}
          >
            BETA
          </span>
        </Link>
      </div>

      {/* 1. New chat */}
      <div className="flex-shrink-0 p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 rounded-lg h-10 text-stone-700 hover:bg-stone-100 hover:text-stone-900"
          onClick={handleNewChat}
          aria-label="New chat"
        >
          <PlusCircle className="w-5 h-5" />
          <span>New chat</span>
        </Button>
      </div>

      {/* 2. History (chat list with search) */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-shrink-0 px-2 pb-2">
          <div className="flex items-center gap-2 rounded-lg bg-stone-100 border border-stone-200 px-2.5 py-2">
            <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
            <Input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent p-0 h-auto text-sm placeholder:text-stone-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
        <p className="flex-shrink-0 px-3 pb-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">
          History
        </p>
        <div className="flex-1 overflow-y-auto min-h-0 px-1">
          {groupedSessions.length === 0 ? (
            <p className="text-stone-500 text-sm px-3 py-4">
              {searchQuery ? 'No matching chats' : 'No chats yet'}
            </p>
          ) : (
            <div className="space-y-3 pb-4">
              {groupedSessions.map(({ group, sessions }) => (
                <div key={group}>
                  <h3 className="text-[11px] font-medium text-stone-400 uppercase tracking-wider px-2 mb-1">
                    {group}
                  </h3>
                  <div className="space-y-0.5">
                    {sessions.map((session) => (
                      <SessionRow
                        key={session.sessionId}
                        session={session}
                        isActive={currentSessionId === session.sessionId}
                        isEditing={editingSessionId === session.sessionId}
                        editTitle={editTitle}
                        setEditTitle={setEditTitle}
                        onSelect={() => handleSessionClick(session)}
                        onStartEdit={(e) => startEditing(e, session)}
                        onCommitEdit={() => handleRenameSession(session.sessionId!)}
                        onCancelEdit={() => setEditingSessionId(null)}
                        onDelete={(e) => handleDeleteSession(e, session.sessionId!)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {hasMoreSessions && (
            <div ref={loadMoreRef} className="py-3 flex justify-center">
              {isLoadingSessions && <Loader2 className="w-4 h-4 animate-spin text-stone-400" />}
            </div>
          )}
        </div>
      </div>

      {/* 3. Logout at bottom */}
      <div className="flex-shrink-0 border-t border-stone-200 p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 rounded-lg h-10 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
          onClick={signOut}
          aria-label="Log out"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1 text-center">Log out</span>
        </Button>
      </div>
    </div>
  );
};

function SessionRow({
  session,
  isActive,
  isEditing,
  editTitle,
  setEditTitle,
  onSelect,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
  onDelete,
}: {
  session: SessionDTO;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  setEditTitle: (v: string) => void;
  onSelect: () => void;
  onStartEdit: (e: React.MouseEvent) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const [hover, setHover] = useState(false);

  if (!session?.sessionId) return null;

  if (isEditing) {
    return (
      <div className="px-2 py-1.5">
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={onCommitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCommitEdit();
            if (e.key === 'Escape') onCancelEdit();
          }}
          autoFocus
          className="h-8 text-sm"
        />
      </div>
    );
  }

  return (
    <div
      className="relative group/row"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center min-w-0 transition-colors cursor-pointer ${
          isActive ? 'bg-stone-100 text-stone-900 font-medium' : 'text-stone-600 hover:bg-stone-50'
        }`}
      >
        <span className="truncate flex-1">{session.title || 'New Chat'}</span>
        {hover && (
          <span className="flex items-center gap-0.5 flex-shrink-0 ml-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onStartEdit(e); }}
              className="p-1 rounded hover:bg-stone-200 text-stone-500 hover:text-stone-700"
              title="Rename"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(e); }}
              className="p-1 rounded hover:bg-red-50 text-stone-500 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </span>
        )}
      </div>
    </div>
  );
}

export default LeftMenuBar;
