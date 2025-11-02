// Mobile-optimized responsive layout for chat and map
'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Map, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ResponsiveChatLayoutProps {
  chatPanel: React.ReactNode;
  mapPanel: React.ReactNode;
  className?: string;
}

type ViewMode = 'chat' | 'map' | 'split';
type BreakPoint = 'mobile' | 'tablet' | 'desktop';

export default function ResponsiveChatLayout({
  chatPanel,
  mapPanel,
  className
}: ResponsiveChatLayoutProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [breakpoint, setBreakpoint] = useState<BreakPoint>('desktop');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Detect screen size and adjust layout
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
        setViewMode('chat'); // Default to chat on mobile
      } else if (width < 1024) {
        setBreakpoint('tablet');
        setViewMode('split');
      } else {
        setBreakpoint('desktop');
        setViewMode('split');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile view switcher
  const MobileViewSwitcher = () => (
    <div className="flex bg-white border-t border-gray-200 md:hidden">
      <button
        onClick={() => setViewMode('chat')}
        className={cn(
          "flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors",
          viewMode === 'chat'
            ? "text-blue-600 bg-blue-50 border-t-2 border-blue-600"
            : "text-gray-500 hover:text-gray-700"
        )}
      >
        <MessageSquare size={20} className="mr-2" />
        Chat
      </button>
      
      <button
        onClick={() => setViewMode('map')}
        className={cn(
          "flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors",
          viewMode === 'map'
            ? "text-blue-600 bg-blue-50 border-t-2 border-blue-600"
            : "text-gray-500 hover:text-gray-700"
        )}
      >
        <Map size={20} className="mr-2" />
        Map
      </button>
    </div>
  );

  // Desktop view controls
  const DesktopControls = () => (
    <div className="hidden md:flex items-center gap-2 p-2 bg-gray-50 border-b border-gray-200">
      <div className="flex bg-white rounded-md p-1 shadow-sm">
        <button
          onClick={() => setViewMode('chat')}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded transition-colors",
            viewMode === 'chat'
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:text-gray-800"
          )}
        >
          Chat Only
        </button>
        
        <button
          onClick={() => setViewMode('split')}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded transition-colors",
            viewMode === 'split'
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:text-gray-800"
          )}
        >
          Split View
        </button>
        
        <button
          onClick={() => setViewMode('map')}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded transition-colors",
            viewMode === 'map'
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:text-gray-800"
          )}
        >
          Map Only
        </button>
      </div>

      {/* Collapse Toggle for Split View */}
      {viewMode === 'split' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto h-8 w-8 p-0"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      )}
    </div>
  );

  return (
    <div className={cn("flex flex-col h-screen bg-gray-100", className)}>
      {/* Desktop Controls */}
      <DesktopControls />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile: Single Panel View */}
        {breakpoint === 'mobile' && (
          <>
            {viewMode === 'chat' && (
              <div className="flex-1 flex flex-col">
                {chatPanel}
              </div>
            )}
            
            {viewMode === 'map' && (
              <div className="flex-1 flex flex-col">
                {mapPanel}
              </div>
            )}
          </>
        )}

        {/* Tablet/Desktop: Split or Single Panel */}
        {breakpoint !== 'mobile' && (
          <>
            {/* Chat Panel */}
            {(viewMode === 'chat' || viewMode === 'split') && (
              <div className={cn(
                "flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
                viewMode === 'chat' ? "flex-1" : 
                viewMode === 'split' ? (isCollapsed ? "w-16" : "w-1/2 min-w-[400px]") : "hidden"
              )}>
                {isCollapsed ? (
                  <div className="flex items-center justify-center h-full">
                    <Button
                      variant="ghost"
                      onClick={() => setIsCollapsed(false)}
                      className="rotate-0 hover:rotate-12 transition-transform"
                    >
                      <MessageSquare size={24} />
                    </Button>
                  </div>
                ) : (
                  chatPanel
                )}
              </div>
            )}

            {/* Map Panel */}
            {(viewMode === 'map' || viewMode === 'split') && (
              <div className={cn(
                "flex flex-col transition-all duration-300",
                viewMode === 'map' ? "flex-1" : 
                viewMode === 'split' ? (isCollapsed ? "flex-1" : "flex-1 min-w-[400px]") : "hidden"
              )}>
                {mapPanel}
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile View Switcher */}
      <MobileViewSwitcher />

      {/* Quick Action Fab (Mobile) */}
      {breakpoint === 'mobile' && (
        <div className="fixed bottom-20 right-4 z-50">
          <Button
            onClick={() => setViewMode(viewMode === 'chat' ? 'map' : 'chat')}
            className="h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
          >
            {viewMode === 'chat' ? <Map size={20} /> : <MessageSquare size={20} />}
          </Button>
        </div>
      )}

      {/* Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .mobile-optimized {
            padding: 0.75rem;
          }
          
          .mobile-input {
            font-size: 16px; /* Prevents zoom on iOS */
          }
        }
        
        @media (max-width: 480px) {
          .ultra-mobile {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}