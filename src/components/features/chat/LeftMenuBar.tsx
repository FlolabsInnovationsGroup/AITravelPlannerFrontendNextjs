import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { MessageSquare, Heart, Globe, Bell, PlusCircle, Search, LogOut } from 'lucide-react';
import { Input } from "@/components/ui/input";

interface LeftMenuBarProps {
  isMobileMenuOpen: boolean;
  showChatHistory: boolean;
  toggleChatHistory: () => void;
  toggleMobileMenu: () => void;
  signOut: () => void;
  handleNewChat: () => void;
  chatHistory: Array<{ sessionId: string; title: string }>;
  currentSessionId: string | null;
  handleSessionClick: (session: { sessionId: string; title: string }) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
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
}) => {
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
                        src="/logo.png" 
                        alt="AiTripPlanner Logo" 
                        width={24} 
                        height={24}
                        style={{ height: "auto" }}
                    />
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
  </Link>
</div>

      {/* Navigation Section */}
      {!showChatHistory ? (
        <nav className="flex-grow flex flex-col">
          <Button
            variant="ghost"
            className="flex items-center py-2 px-4 w-full"
            onClick={toggleChatHistory}
            aria-label="Toggle chat history"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>
          <Button variant="ghost" className="flex items-center py-2 px-4 w-full" aria-label="Favorites">
            <Heart className="w-6 h-6" />
          </Button>
          <Button variant="ghost" className="flex items-center py-2 px-4 w-full" aria-label="Notifications">
            <Bell className="w-6 h-6" />
          </Button>
          <Button variant="ghost" className="flex items-center py-2 px-4 w-full" aria-label="Global">
            <Globe className="w-6 h-6" />
          </Button>
          <div className="mt-auto mb-2 border-t border-gray-200 w-full"></div>
          <Button
            variant="ghost"
            className="flex items-center py-2 px-4 w-full mt-auto"
            onClick={signOut}
            aria-label="Logout"
          >
            <LogOut className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            className="flex items-center py-2 px-4 w-full mb-4"
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
              className="mr-2"
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
              <ul>
  {Array.isArray(chatHistory) ? (
    chatHistory
      .filter((session) =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map((session) => (
        <li
          key={session.sessionId}
          className={`py-2 px-4 cursor-pointer hover:bg-gray-100 rounded-md ${
            currentSessionId === session.sessionId ? "bg-gray-200" : ""
          }`}
          onClick={() => handleSessionClick(session)}
        >
          <span className="truncate">{session.title}</span>
        </li>
      ))
  ) : (
    <p className="text-gray-500">No chat history available</p>
  )}
</ul>

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
            className="flex items-center justify-center p-4 w-full border-t"
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
